/**
 * TensorFlow.js Shape Recognition Model
 *
 * Architecture: Lightweight CNN that classifies strokes rendered onto a 28x28
 * grayscale canvas into one of 5 shape classes: line, circle, rect, triangle, path.
 *
 * Strategy:
 *  1. On first use, build + train the model on synthetic stroke data generated
 *     procedurally (no external dataset download needed -> works fully offline).
 *  2. Cache the trained weights in IndexedDB via tf.io.browserIndexedDB.
 *  3. On subsequent loads, restore from cache instantly.
 *  4. Expose recognizeWithTF(rawPoints) -> { type, confidence } that the canvas
 *     can call after every stroke.
 */

import * as tf from "@tensorflow/tfjs";
import { resample, normalizePoints } from "./shapeRecognizer.js";

const MODEL_KEY = "indexeddb://boardcollab-shape-model-v2";
const CANVAS_SIZE = 28;
const NUM_CLASSES = 5;
const CLASS_NAMES = ["line", "circle", "rect", "triangle", "path"];

let _model = null;
let _loadPromise = null;

// --- Synthetic data generation -----------------------------------------------

function generateLine() {
  const pts = [];
  const x0 = Math.random() * 0.6 + 0.1;
  const y0 = Math.random() * 0.6 + 0.1;
  const x1 = Math.random() * 0.6 + 0.1;
  const y1 = Math.random() * 0.6 + 0.1;
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    pts.push({
      x: (x0 + t * (x1 - x0)) * CANVAS_SIZE + (Math.random() - 0.5) * 0.5,
      y: (y0 + t * (y1 - y0)) * CANVAS_SIZE + (Math.random() - 0.5) * 0.5
    });
  }
  return pts;
}

function generateCircle() {
  const pts = [];
  const cx = CANVAS_SIZE / 2 + (Math.random() - 0.5) * 4;
  const cy = CANVAS_SIZE / 2 + (Math.random() - 0.5) * 4;
  const r = 6 + Math.random() * 6;
  const startAngle = Math.random() * Math.PI * 2;
  const steps = 32;
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + (i / steps) * Math.PI * 2;
    pts.push({
      x: cx + Math.cos(a) * r + (Math.random() - 0.5) * 0.6,
      y: cy + Math.sin(a) * r + (Math.random() - 0.5) * 0.6
    });
  }
  return pts;
}

function generateRect() {
  const pts = [];
  const x = 4 + Math.random() * 6;
  const y = 4 + Math.random() * 6;
  const w = 8 + Math.random() * 10;
  const h = 6 + Math.random() * 10;
  const corners = [
    [x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]
  ];
  for (let c = 0; c < corners.length - 1; c++) {
    const [ax, ay] = corners[c];
    const [bx, by] = corners[c + 1];
    for (let s = 0; s <= 8; s++) {
      const t = s / 8;
      pts.push({
        x: ax + t * (bx - ax) + (Math.random() - 0.5) * 0.5,
        y: ay + t * (by - ay) + (Math.random() - 0.5) * 0.5
      });
    }
  }
  return pts;
}

function generateTriangle() {
  const pts = [];
  const cx = CANVAS_SIZE / 2 + (Math.random() - 0.5) * 4;
  const cy = CANVAS_SIZE / 2 + (Math.random() - 0.5) * 4;
  const r = 7 + Math.random() * 5;
  const baseAngle = Math.random() * Math.PI * 2;
  const vertices = [0, 1, 2].map((i) => ({
    x: cx + Math.cos(baseAngle + (i * Math.PI * 2) / 3) * r,
    y: cy + Math.sin(baseAngle + (i * Math.PI * 2) / 3) * r
  }));
  const corners = [...vertices, vertices[0]];
  for (let c = 0; c < corners.length - 1; c++) {
    for (let s = 0; s <= 10; s++) {
      const t = s / 10;
      pts.push({
        x: corners[c].x + t * (corners[c + 1].x - corners[c].x) + (Math.random() - 0.5) * 0.5,
        y: corners[c].y + t * (corners[c + 1].y - corners[c].y) + (Math.random() - 0.5) * 0.5
      });
    }
  }
  return pts;
}

function generatePath() {
  const pts = [];
  let x = 4 + Math.random() * 20;
  let y = 4 + Math.random() * 20;
  const steps = 20 + Math.floor(Math.random() * 20);
  for (let i = 0; i < steps; i++) {
    x += (Math.random() - 0.5) * 5;
    y += (Math.random() - 0.5) * 5;
    x = Math.max(1, Math.min(CANVAS_SIZE - 1, x));
    y = Math.max(1, Math.min(CANVAS_SIZE - 1, y));
    pts.push({ x, y });
  }
  return pts;
}

const GENERATORS = [generateLine, generateCircle, generateRect, generateTriangle, generatePath];

// --- Points -> 28x28 tensor --------------------------------------------------

/** Bresenham line into a flat Float32 pixel array */
function drawLine(pixels, x0, y0, x1, y1, size) {
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let safety = 0;
  while (safety++ < 1000) {
    if (x0 >= 0 && x0 < size && y0 >= 0 && y0 < size) {
      pixels[y0 * size + x0] = 1.0;
    }
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
}

function pointsToPixels(rawPoints) {
  const resampled = resample(rawPoints, 64);
  const norm = normalizePoints(resampled);
  const pts = norm.points;

  const pad = 2;
  const scaleX = norm.width > 0 ? (CANVAS_SIZE - pad * 2) / norm.width : 1;
  const scaleY = norm.height > 0 ? (CANVAS_SIZE - pad * 2) / norm.height : 1;

  const pixels = new Float32Array(CANVAS_SIZE * CANVAS_SIZE);

  // pts[i] are centroid-subtracted; shift back to [0, width] then scale into canvas
  const offsetX = -norm.minX + norm.centroid.x;
  const offsetY = -norm.minY + norm.centroid.y;

  for (let i = 0; i < pts.length - 1; i++) {
    const x0 = Math.round((pts[i].x + offsetX) * scaleX + pad);
    const y0 = Math.round((pts[i].y + offsetY) * scaleY + pad);
    const x1 = Math.round((pts[i + 1].x + offsetX) * scaleX + pad);
    const y1 = Math.round((pts[i + 1].y + offsetY) * scaleY + pad);
    drawLine(pixels, x0, y0, x1, y1, CANVAS_SIZE);
  }

  return pixels;
}

function pointsToInput(rawPoints) {
  const pixels = pointsToPixels(rawPoints);
  return tf.tensor4d(pixels, [1, CANVAS_SIZE, CANVAS_SIZE, 1]);
}

// --- Build training data ------------------------------------------------------

function buildTrainingData(samplesPerClass = 200) {
  const xs = [];
  const ys = [];

  for (let classIdx = 0; classIdx < NUM_CLASSES; classIdx++) {
    for (let s = 0; s < samplesPerClass; s++) {
      const rawPts = GENERATORS[classIdx]();
      const pixels = pointsToPixels(rawPts);
      xs.push(...pixels);
      ys.push(classIdx);
    }
  }

  const total = NUM_CLASSES * samplesPerClass;
  const xsTensor = tf.tensor4d(new Float32Array(xs), [total, CANVAS_SIZE, CANVAS_SIZE, 1]);
  const ysTensor = tf.oneHot(tf.tensor1d(ys, "int32"), NUM_CLASSES);
  return { xsTensor, ysTensor };
}

// --- Model definition ---------------------------------------------------------

function buildModel() {
  const model = tf.sequential();

  model.add(tf.layers.conv2d({
    inputShape: [CANVAS_SIZE, CANVAS_SIZE, 1],
    filters: 16,
    kernelSize: 3,
    activation: "relu",
    padding: "same"
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
  model.add(tf.layers.conv2d({ filters: 32, kernelSize: 3, activation: "relu", padding: "same" }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dropout({ rate: 0.25 }));
  model.add(tf.layers.dense({ units: 64, activation: "relu" }));
  model.add(tf.layers.dense({ units: NUM_CLASSES, activation: "softmax" }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"]
  });

  return model;
}

// --- Train & cache ------------------------------------------------------------

async function trainAndCache() {
  console.log("[AI] Training shape recognition model (first launch only)...");
  const model = buildModel();
  const { xsTensor, ysTensor } = buildTrainingData(200);

  await model.fit(xsTensor, ysTensor, {
    epochs: 15,
    batchSize: 64,
    validationSplit: 0.1,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`[AI] Epoch ${epoch + 1}/15 — acc: ${(logs.acc * 100).toFixed(1)}%`);
      }
    }
  });

  xsTensor.dispose();
  ysTensor.dispose();

  try {
    await model.save(MODEL_KEY);
    console.log("[AI] Model cached to IndexedDB.");
  } catch (e) {
    console.warn("[AI] Could not cache model:", e.message);
  }

  return model;
}

// --- Public API ---------------------------------------------------------------

/**
 * Load (or train) the TF.js model. Safe to call multiple times.
 * Returns a promise that resolves once the model is ready.
 */
export function loadModel() {
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    try {
      _model = await tf.loadLayersModel(MODEL_KEY);
      console.log("[AI] Loaded cached model from IndexedDB.");
    } catch {
      _model = await trainAndCache();
    }
    return _model;
  })();

  return _loadPromise;
}

/** Returns true if the model is loaded and ready for inference */
export function isModelReady() {
  return _model !== null;
}

/**
 * Classify a stroke.
 * @param {Array<{x:number, y:number}>} rawPoints
 * @returns {Promise<{type:string, confidence:number, allScores:Object}|null>}
 */
export async function recognizeWithTF(rawPoints) {
  if (!_model) {
    try {
      await loadModel();
    } catch (e) {
      console.warn("[AI] Model not available:", e.message);
      return null;
    }
  }

  if (!rawPoints || rawPoints.length < 3) return null;

  const input = pointsToInput(rawPoints);
  const predictions = _model.predict(input);
  const scores = await predictions.data();
  input.dispose();
  predictions.dispose();

  let bestIdx = 0;
  let bestScore = scores[0];
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > bestScore) { bestScore = scores[i]; bestIdx = i; }
  }

  const allScores = {};
  CLASS_NAMES.forEach((name, i) => { allScores[name] = scores[i]; });

  return { type: CLASS_NAMES[bestIdx], confidence: bestScore, allScores };
}

export { CLASS_NAMES };
export default { loadModel, isModelReady, recognizeWithTF, CLASS_NAMES };
