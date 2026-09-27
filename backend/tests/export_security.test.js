/**
 * Extended export service tests covering:
 * - M-10: SVG XSS sanitization (malicious color/attribute injection)
 * - M-4: PNG export returns a Buffer
 */
import test from "node:test";
import assert from "node:assert/strict";
import { ExportService } from "../src/services/export.service.js";

const baseRoom = { _id: "r1", name: "Test Room" };

// ---------------------------------------------------------------------------
// M-10: SVG XSS sanitization
// ---------------------------------------------------------------------------

test("M-10: exportSvg rejects malicious fill attribute (XSS injection attempt)", () => {
  const elements = [
    {
      type: "rect",
      isDeleted: false,
      properties: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        stroke: "#000000",
        fill: 'red" onload="alert(1)' // XSS payload
      }
    }
  ];

  const svg = ExportService.exportSvg(baseRoom, elements);

  // The raw payload must not appear in the SVG
  assert.ok(!svg.includes('onload="alert(1)'), "SVG must not contain injected event handlers");
  // Should fallback to default color
  assert.ok(!svg.includes("red\" onload"), "Malicious fill string must be stripped");
});

test("M-10: exportSvg sanitizes numeric attributes — rejects NaN and non-finite values", () => {
  const elements = [
    {
      type: "rect",
      isDeleted: false,
      properties: {
        x: "not-a-number", // → fallback 0
        y: NaN,            // → fallback 0
        width: Infinity,   // → fallback 0 (non-finite)
        height: 100,       // → valid, passes through
        stroke: "#000"
      }
    }
  ];

  const svg = ExportService.exportSvg(baseRoom, elements);
  // Non-finite and non-numeric values fall back to their element-type defaults
  assert.ok(svg.includes('x="0"'), "NaN x should fall back to 0");
  assert.ok(svg.includes('y="0"'), "NaN y should fall back to 0");
  // Infinity for width falls back to the rect width default (50) since Number.isFinite(Infinity) = false
  assert.ok(svg.includes('width="50"'), "Infinity width should fall back to default (50)");
  assert.ok(svg.includes('height="100"'), "Valid height should pass through");
});

test("M-10: exportSvg escapes special XML chars in text content", () => {
  const elements = [
    {
      type: "text",
      isDeleted: false,
      properties: {
        x: 0,
        y: 20,
        text: '<script>alert("xss")</script> & "hello"',
        fontSize: 14
      }
    }
  ];

  const svg = ExportService.exportSvg(baseRoom, elements);

  assert.ok(!svg.includes("<script>"), "Raw <script> tag must not appear in SVG output");
  assert.ok(svg.includes("&lt;script&gt;"), "< > must be escaped to entities");
  assert.ok(svg.includes("&amp;"), "& must be escaped to &amp;");
  assert.ok(svg.includes("&quot;"), "Quotes must be escaped");
});

test("M-10: exportSvg sanitizes stroke color in path element", () => {
  const elements = [
    {
      type: "path",
      isDeleted: false,
      properties: {
        points: [[0, 0], [10, 10]],
        stroke: 'url(javascript:alert(1))', // XSS via SVG fill reference
        strokeWidth: 2
      }
    }
  ];

  const svg = ExportService.exportSvg(baseRoom, elements);
  assert.ok(!svg.includes("javascript:"), "JavaScript URL must be stripped from stroke");
});

test("M-10: exportSvg allows valid CSS color values through sanitizer", () => {
  const elements = [
    {
      type: "rect",
      isDeleted: false,
      properties: {
        x: 10, y: 10, width: 50, height: 50,
        stroke: "#2563eb",
        fill: "rgba(255, 0, 0, 0.5)"
      }
    }
  ];

  const svg = ExportService.exportSvg(baseRoom, elements);
  assert.ok(svg.includes('stroke="#2563eb"'), "Valid hex color should pass through");
  assert.ok(svg.includes('fill="rgba(255, 0, 0, 0.5)"'), "Valid rgba should pass through");
});

// ---------------------------------------------------------------------------
// M-4: PNG export
// ---------------------------------------------------------------------------

test("M-4: exportPng returns a Buffer for a room with elements", async () => {
  const elements = [
    {
      type: "rect",
      isDeleted: false,
      properties: { x: 10, y: 10, width: 100, height: 80, stroke: "#000000" }
    },
    {
      type: "circle",
      isDeleted: false,
      properties: { x: 200, y: 200, radius: 40, stroke: "#ff0000" }
    },
    {
      type: "path",
      isDeleted: false,
      properties: { points: [[0, 0], [100, 100]], stroke: "#0000ff", strokeWidth: 3 }
    },
    {
      type: "text",
      isDeleted: false,
      properties: { x: 50, y: 50, text: "Hello PNG", fontSize: 20 }
    }
  ];

  const pngBuffer = await ExportService.exportPng(baseRoom, elements);

  assert.ok(Buffer.isBuffer(pngBuffer), "exportPng should return a Buffer");
  assert.ok(pngBuffer.length > 0, "PNG buffer should not be empty");
  // PNG magic bytes: 0x89 0x50 0x4E 0x47 (‰PNG)
  assert.equal(pngBuffer[0], 0x89);
  assert.equal(pngBuffer[1], 0x50); // P
  assert.equal(pngBuffer[2], 0x4e); // N
  assert.equal(pngBuffer[3], 0x47); // G
});

test("M-4: exportPng skips deleted elements", async () => {
  const elements = [
    {
      type: "rect",
      isDeleted: true, // should be skipped
      properties: { x: 0, y: 0, width: 200, height: 200, fill: "#ff0000" }
    }
  ];

  // Should complete without error even when all elements are deleted
  const pngBuffer = await ExportService.exportPng(baseRoom, elements);
  assert.ok(Buffer.isBuffer(pngBuffer));
  assert.ok(pngBuffer.length > 0, "Should still produce a white canvas PNG");
});

test("M-4: exportPng returns a valid PNG for empty room", async () => {
  const pngBuffer = await ExportService.exportPng(baseRoom, []);
  assert.ok(Buffer.isBuffer(pngBuffer));
  assert.equal(pngBuffer[0], 0x89);
});
