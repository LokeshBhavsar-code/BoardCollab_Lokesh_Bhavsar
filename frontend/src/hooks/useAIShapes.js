/**
 * useAIShapes — React hook for TF.js-powered shape recognition.
 *
 * Loads/trains the CNN model in the background on first enable.
 * Exposes:
 *   aiEnabled      : boolean
 *   modelStatus    : "idle" | "loading" | "ready" | "error"
 *   toggleAI       : () => void
 *   recognizeStroke: (rawPoints, currentTool, color, strokeWidth, fillEnabled, fillColor)
 *                    => Promise<element-props | null>
 *   lastRecognition: { type, confidence } | null  — for toast display
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { recognizeShape } from "../ai/shapeRecognizer.js";
import { recognizeWithTF, loadModel } from "../ai/tfShapeModel.js";
import { RECOGNIZER_DEFAULTS } from "../ai/recognizerConfig.js";

const CONFIDENCE_THRESHOLD = RECOGNIZER_DEFAULTS.CONFIDENCE_THRESHOLD;

// Map TF class names to canvas element types (some overlap 1:1, triangle -> polygon)
const TF_TO_CANVAS_TYPE = {
  line: "line",
  circle: "circle",
  rect: "rect",
  triangle: "polygon",
  path: "path"
};

/**
 * Build a Konva-ready element properties object from a recognized shape.
 */
function buildElementProps(recognized, rawPoints, color, strokeWidth, fillEnabled, fillColor) {
  const type = recognized.type;
  const p = recognized.properties || {};

  // common stroke / fill
  const base = {
    stroke: color,
    strokeWidth: strokeWidth || 2,
    fill: fillEnabled ? fillColor : "transparent"
  };

  if (type === "line") {
    const flatPoints = p.points || [rawPoints[0].x, rawPoints[0].y, rawPoints[rawPoints.length - 1].x, rawPoints[rawPoints.length - 1].y];
    return {
      type: "line",
      properties: {
        ...base,
        points: typeof flatPoints[0] === "number"
          ? [[flatPoints[0], flatPoints[1]], [flatPoints[2], flatPoints[3]]]
          : flatPoints
      }
    };
  }

  if (type === "circle") {
    return {
      type: "circle",
      properties: { ...base, x: p.x, y: p.y, radius: p.radius }
    };
  }

  if (type === "rect") {
    return {
      type: "rect",
      properties: { ...base, x: p.x, y: p.y, width: p.width, height: p.height }
    };
  }

  if (type === "polygon") {
    // Triangle: use heuristic polygon points or fall back to raw bounding box vertices
    const pts = rawPoints.map((pt) => [pt.x, pt.y]);
    return {
      type: "polygon",
      properties: { ...base, points: pts }
    };
  }

  // path fallback
  return null;
}

export function useAIShapes() {
  const [aiEnabled, setAiEnabled] = useState(false);
  const [modelStatus, setModelStatus] = useState("idle"); // idle | loading | ready | error
  const [lastRecognition, setLastRecognition] = useState(null);
  const loadStarted = useRef(false);

  // Start loading model when user enables AI
  useEffect(() => {
    if (!aiEnabled || loadStarted.current) return;
    if (modelStatus === "ready") return;

    loadStarted.current = true;
    setModelStatus("loading");

    loadModel()
      .then(() => setModelStatus("ready"))
      .catch((err) => {
        console.error("[AI] Failed to load model:", err);
        setModelStatus("error");
      });
  }, [aiEnabled, modelStatus]);

  const toggleAI = useCallback(() => {
    setAiEnabled((prev) => !prev);
    setLastRecognition(null);
  }, []);

  /**
   * Run recognition on a completed stroke.
   * Returns element-like { type, properties } if a shape is recognized,
   * or null to fall through to the raw freehand path.
   */
  const recognizeStroke = useCallback(
    async (rawPoints, currentTool, color, strokeWidth, fillEnabled, fillColor) => {
      // Only activate for pen strokes when AI is on
      if (!aiEnabled || currentTool !== "pen" || !rawPoints || rawPoints.length < 5) {
        return null;
      }

      let recognized = null;

      // 1. TF.js inference (primary, if model is ready)
      if (modelStatus === "ready") {
        try {
          const tfResult = await recognizeWithTF(rawPoints);
          if (tfResult && tfResult.confidence >= CONFIDENCE_THRESHOLD) {
            const canvasType = TF_TO_CANVAS_TYPE[tfResult.type] || "path";

            if (canvasType !== "path") {
              // Get geometric properties from the heuristic recognizer for bounding info
              const heuristic = recognizeShape(rawPoints);

              recognized = {
                type: canvasType,
                confidence: tfResult.confidence,
                source: "tfjs",
                properties: heuristic.recognized && heuristic.type === canvasType
                  ? heuristic.properties
                  : buildFallbackProperties(canvasType, rawPoints)
              };
            }
          }
        } catch (e) {
          console.warn("[AI] TF.js inference error:", e.message);
        }
      }

      // 2. Geometric heuristic fallback (if TF isn't confident or model isn't ready)
      if (!recognized) {
        const heuristic = recognizeShape(rawPoints);
        if (heuristic.recognized && heuristic.confidence >= CONFIDENCE_THRESHOLD) {
          recognized = { ...heuristic, source: "heuristic" };
        }
      }

      if (!recognized || recognized.type === "path") {
        setLastRecognition(null);
        return null;
      }

      setLastRecognition({ type: recognized.type, confidence: recognized.confidence, source: recognized.source });

      return buildElementProps(recognized, rawPoints, color, strokeWidth, fillEnabled, fillColor);
    },
    [aiEnabled, modelStatus]
  );

  return { aiEnabled, modelStatus, toggleAI, recognizeStroke, lastRecognition };
}

/** Compute bounding-box based properties when heuristic didn't match */
function buildFallbackProperties(type, rawPoints) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let sumX = 0, sumY = 0;
  for (const p of rawPoints) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    sumX += p.x;
    sumY += p.y;
  }
  const cx = sumX / rawPoints.length;
  const cy = sumY / rawPoints.length;
  const w = maxX - minX;
  const h = maxY - minY;
  const r = Math.min(w, h) / 2;

  switch (type) {
    case "line":
      return { points: [[rawPoints[0].x, rawPoints[0].y], [rawPoints[rawPoints.length - 1].x, rawPoints[rawPoints.length - 1].y]] };
    case "circle":
      return { x: cx, y: cy, radius: Math.max(r, 5) };
    case "rect":
      return { x: minX, y: minY, width: w, height: h };
    case "polygon":
      return { points: rawPoints.map((p) => [p.x, p.y]) };
    default:
      return { points: rawPoints.map((p) => [p.x, p.y]) };
  }
}
