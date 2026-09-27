import test from "node:test";
import assert from "node:assert/strict";
import {
  BackendShapeRecognizer,
  resample
} from "../src/services/shapeRecognizer.service.js";

test("recognizeShape correctly identifies a straight line", () => {
  // Generate a noisy straight line from (10, 10) to (200, 200)
  const linePoints = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    linePoints.push({
      x: 10 + t * 190 + (Math.random() - 0.5) * 2,
      y: 10 + t * 190 + (Math.random() - 0.5) * 2
    });
  }

  const result = BackendShapeRecognizer.recognize(linePoints);
  assert.equal(result.recognized, true);
  assert.equal(result.type, "line");
  assert.ok(result.confidence >= 0.7);
  assert.ok(result.properties.points.length === 4);
});

test("recognizeShape correctly identifies a circle", () => {
  // Generate a hand-drawn circle centered at (150, 150) with radius ~50
  const circlePoints = [];
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const r = 50 + (Math.sin(i) * 2); // slight natural wobble
    circlePoints.push({
      x: 150 + Math.cos(angle) * r,
      y: 150 + Math.sin(angle) * r
    });
  }

  const result = BackendShapeRecognizer.recognize(circlePoints);
  assert.equal(result.recognized, true);
  assert.equal(result.type, "circle");
  assert.ok(result.confidence >= 0.7);
  assert.ok(Math.abs(result.properties.radius - 50) < 5);
});

test("resample normalizes variable point strokes to fixed point counts", () => {
  const pts = [
    { x: 0, y: 0 },
    { x: 50, y: 0 },
    { x: 100, y: 0 }
  ];

  const resampled = resample(pts, 64);
  assert.equal(resampled.length, 64);
  assert.equal(resampled[0].x, 0);
  assert.equal(resampled[63].x, 100);
});
