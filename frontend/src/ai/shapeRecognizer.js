/**
 * Resamples an array of points {x, y} to N equidistant points.
 */
export function resample(points, n = 64) {
  if (!points || points.length === 0) return [];
  if (points.length === 1) {
    return Array(n).fill({ x: points[0].x, y: points[0].y });
  }

  // Calculate total path length
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
 * Normalizes points by translating centroid to origin (0, 0) and returning bounding box info.
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
 * Computes geometric tensor metrics on point series.
 */
export function computeMetrics(points) {
  const norm = normalizePoints(points);
  const n = norm.points.length;
  if (n === 0) return null;

  // Distances from centroid (radii)
  const radii = norm.points.map((p) => Math.hypot(p.x, p.y));
  const meanRadius = radii.reduce((a, b) => a + b, 0) / n;
  const varianceRadius = radii.reduce((acc, r) => acc + Math.pow(r - meanRadius, 2), 0) / n;
  const stdDevRadius = Math.sqrt(varianceRadius);
  const radialStdDevRatio = meanRadius > 0 ? stdDevRadius / meanRadius : 1;

  // Closure ratio: start-to-end distance vs perimeter/diagonal
  const first = points[0];
  const last = points[points.length - 1];
  const endpointDist = Math.hypot(last.x - first.x, last.y - first.y);
  const diagonal = Math.hypot(norm.width, norm.height);
  const isClosed = diagonal > 0 ? endpointDist / diagonal < 0.25 : true;

  // Collinearity / Line deviation: max distance from chord connecting first and last
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
 * Recognizes geometric primitives (line, circle, rectangle, arrow, path) from a stroke.
 */
export function recognizeShape(rawPoints) {
  if (!rawPoints || rawPoints.length < 2) {
    return { recognized: false, type: "path", confidence: 0, properties: {} };
  }

  // Resample stroke to standard 64 points
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

  // 1. Line check: Open path with low chord deviation
  if (!isClosed && lineDeviationRatio < 0.12 && metrics.endpointDist > 15) {
    const p1 = rawPoints[0];
    const p2 = rawPoints[rawPoints.length - 1];
    return {
      recognized: true,
      type: "line",
      confidence: Math.max(0.7, 1 - lineDeviationRatio * 2),
      properties: {
        points: [p1.x, p1.y, p2.x, p2.y]
      }
    };
  }

  // 2. Circle check: Closed path with low radial standard deviation
  if (isClosed && radialStdDevRatio < 0.22 && meanRadius > 8) {
    const aspectRatio = height > 0 ? width / height : 1;
    if (aspectRatio >= 0.75 && aspectRatio <= 1.35) {
      return {
        recognized: true,
        type: "circle",
        confidence: Math.max(0.7, 1 - radialStdDevRatio * 1.5),
        properties: {
          x: centroid.x,
          y: centroid.y,
          radius: meanRadius
        }
      };
    }
  }

  // 3. Rectangle check: Closed path, bounding box aspect ratio defined, area fill high
  if (isClosed && width > 15 && height > 15) {
    return {
      recognized: true,
      type: "rect",
      confidence: 0.75,
      properties: {
        x: minX,
        y: minY,
        width,
        height
      }
    };
  }

  // Fallback: raw freehand path
  return {
    recognized: false,
    type: "path",
    confidence: 0,
    properties: {
      points: rawPoints
    }
  };
}

export default {
  recognizeShape,
  resample,
  computeMetrics,
  normalizePoints
};
