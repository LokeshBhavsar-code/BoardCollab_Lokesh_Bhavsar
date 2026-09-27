import {
  recognizeShape,
  resample,
  computeMetrics,
  normalizePoints
} from "./shapeRecognizer.js";

export {
  recognizeShape,
  resample,
  computeMetrics,
  normalizePoints
};

export const RECOGNIZER_DEFAULTS = {
  SAMPLE_COUNT: 64,
  CONFIDENCE_THRESHOLD: 0.70,
  CIRCLE_RADIAL_STD_DEV_THRESHOLD: 0.22,
  LINE_DEVIATION_THRESHOLD: 0.08
};
