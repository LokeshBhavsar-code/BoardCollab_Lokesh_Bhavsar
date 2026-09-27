import * as tf from "@tensorflow/tfjs";
import logger from "../utils/logger.js";
import env from "../config/env.js";

/**
 * Resamples an array of points {x, y} to N equidistant points.
 */
export function resample(points, n = 64) {
  if (!points || points.length === 0) return [];
  if (points.length === 1) {
    return Array(n).fill({ x: points[0].x, y: points[0].y });
  }

  let totalLength = 0;
  const dists = [0];
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    totalLength += d;
    dists.push(totalLength);
  }

  if (totalLength === 0) {
    return Array(n).fill({ x: points[0].x, y: points[0].y });
  }

  const interval = totalLength / (n - 1);
  const newPoints = [{ x: points[0].x, y: points[0].y }];
  let currentSegment = 1;

  for (let i = 1; i < n - 1; i++) {
    const targetDist = i * interval;
    while (currentSegment < dists.length && dists[currentSegment] < targetDist) {
      currentSegment++;
    }

    const prevDist = dists[currentSegment - 1];
    const nextDist = dists[currentSegment];
    const segmentLength = nextDist - prevDist;
    const t = segmentLength > 0 ? (targetDist - prevDist) / segmentLength : 0;

    const p0 = points[currentSegment - 1];
    const p1 = points[currentSegment];

    newPoints.push({
      x: p0.x + t * (p1.x - p0.x),
      y: p0.y + t * (p1.y - p0.y)
    });
  }

  newPoints.push({ x: points[points.length - 1].x, y: points[points.length - 1].y });
  return newPoints;
}

/**
 * Normalizes points by translating centroid to origin (0, 0) and extracting bounding box data.
 */
export function normalizePoints(points) {
  if (!points || points.length === 0) {
    return { points: [], minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centroid: { x: 0, y: 0 } };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let sumX = 0;
  let sumY = 0;

  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
    sumX += pt.x;
    sumY += pt.y;
  }

  const centroid = { x: sumX / points.length, y: sumY / points.length };
  const normalized = points.map((p) => ({
    x: p.x - centroid.x,
    y: p.y - centroid.y
  }));

  return {
    points: normalized,
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centroid
  };
}

/**
 * Computes geometric tensor metrics on point series using TensorFlow.js tensors.
 */
export function computeMetrics(points) {
  const norm = normalizePoints(points);
  const n = norm.points.length;
  if (n === 0) return null;

  // Use TensorFlow.js tensor operations for statistical moments and radial dispersion
  const coords = norm.points.map((p) => [p.x, p.y]);
  const tensor = tf.tensor2d(coords, [n, 2]);

  // L-6: Use a single tf.tidy() so all intermediate tensors (mean, diff, square, etc.)
  // are automatically disposed after the computation, preventing memory accumulation.
  const { meanRadius, varianceRadius } = tf.tidy(() => {
    const x = tensor.slice([0, 0], [n, 1]);
    const y = tensor.slice([0, 1], [n, 1]);
    const radii = tf.sqrt(tf.add(tf.square(x), tf.square(y)));
    const mean = radii.mean().arraySync();
    const diff = tf.sub(radii, mean);
    const variance = tf.mean(tf.square(diff)).arraySync();
    return { meanRadius: mean, varianceRadius: variance };
  });

  tensor.dispose();

  const stdDevRadius = Math.sqrt(varianceRadius);
  const radialStdDevRatio = meanRadius > 0 ? stdDevRadius / meanRadius : 1;

  // Endpoint distance & closure ratio
  const first = points[0];
  const last = points[points.length - 1];
  const endpointDist = Math.hypot(last.x - first.x, last.y - first.y);
  const diagonal = Math.hypot(norm.width, norm.height);
  const isClosed = diagonal > 0 ? endpointDist / diagonal < 0.25 : true;

  // Maximum chord deviation (collinearity test)
  let maxLineDev = 0;
  const chordLen = Math.hypot(last.x - first.x, last.y - first.y);
  if (chordLen > 0) {
    for (const pt of points) {
      const dev = Math.abs(
        (last.y - first.y) * pt.x - (last.x - first.x) * pt.y + last.x * first.y - last.y * first.x
      ) / chordLen;
      if (dev > maxLineDev) maxLineDev = dev;
    }
  }
  const lineDeviationRatio = chordLen > 0 ? maxLineDev / chordLen : 1;

  return {
    ...norm,
    meanRadius,
    stdDevRadius,
    radialStdDevRatio,
    endpointDist,
    diagonal,
    isClosed,
    lineDeviationRatio
  };
}

/**
 * Backend AI Shape Recognizer service powered by TensorFlow.js.
 * Classifies freehand stroke coordinates into geometric primitives (line, circle, rect, arrow).
 */
export class BackendShapeRecognizer {
  static recognize(rawPoints, options = {}) {
    const threshold = options.confidenceThreshold ?? env.AI_CONFIDENCE_THRESHOLD;

    if (!rawPoints || rawPoints.length < 2) {
      return { recognized: false, type: "path", confidence: 0, properties: {} };
    }

    const points = resample(rawPoints, 64);
    const metrics = computeMetrics(points);
    if (!metrics) {
      return { recognized: false, type: "path", confidence: 0, properties: {} };
    }

    const {
      minX,
      minY,
      maxX,
      maxY,
      width,
      height,
      centroid,
      radialStdDevRatio,
      meanRadius,
      isClosed,
      lineDeviationRatio
    } = metrics;

    // 1. Line Check: Open path with low deviation along chord
    if (!isClosed && lineDeviationRatio < 0.12 && metrics.endpointDist > 15) {
      const confidence = Math.min(1.0, Math.max(0.7, 1 - lineDeviationRatio * 2));
      if (confidence >= threshold) {
        const p1 = rawPoints[0];
        const p2 = rawPoints[rawPoints.length - 1];
        return {
          recognized: true,
          type: "line",
          confidence,
          properties: {
            points: [p1.x, p1.y, p2.x, p2.y]
          }
        };
      }
    }

    // 2. Circle Check: Closed path with low radial variance and 1:1 aspect ratio
    if (isClosed && radialStdDevRatio < 0.22 && meanRadius > 8) {
      const aspectRatio = height > 0 ? width / height : 1;
      if (aspectRatio >= 0.75 && aspectRatio <= 1.35) {
        const confidence = Math.min(1.0, Math.max(0.7, 1 - radialStdDevRatio * 1.5));
        if (confidence >= threshold) {
          return {
            recognized: true,
            type: "circle",
            confidence,
            properties: {
              x: centroid.x,
              y: centroid.y,
              radius: meanRadius
            }
          };
        }
      }
    }

    // 3. Rectangle Check: Closed path with defined bounding dimensions
    if (isClosed && width > 15 && height > 15) {
      const confidence = 0.78;
      if (confidence >= threshold) {
        return {
          recognized: true,
          type: "rect",
          confidence,
          properties: {
            x: minX,
            y: minY,
            width,
            height
          }
        };
      }
    }

    // Fallback: Return raw path
    return {
      recognized: false,
      type: "path",
      confidence: 0,
      properties: {
        points: rawPoints
      }
    };
  }
}

export const shapeRecognizer = BackendShapeRecognizer;
export default BackendShapeRecognizer;
