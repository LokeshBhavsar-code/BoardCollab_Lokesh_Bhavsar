import test from "node:test";
import assert from "node:assert/strict";
import { ExportService } from "../src/services/export.service.js";

test("ExportService serializes elements into JSON", () => {
  const room = { _id: "room_123", name: "Architecture Review" };
  const elements = [
    {
      elementId: "el-1",
      type: "rect",
      properties: { x: 10, y: 20, width: 100, height: 50 },
      createdBy: "u1",
      version: 1
    }
  ];

  const jsonExport = ExportService.exportJson(room, elements);
  assert.equal(jsonExport.metadata.roomId, "room_123");
  assert.equal(jsonExport.metadata.elementCount, 1);
  assert.equal(jsonExport.elements[0].type, "rect");
});

test("ExportService renders SVG elements correctly", () => {
  const room = { name: "Design Sprint" };
  const elements = [
    {
      type: "path",
      isDeleted: false,
      properties: {
        points: [[10, 10], [50, 50]],
        stroke: "#2563eb",
        strokeWidth: 4
      }
    },
    {
      type: "rect",
      isDeleted: false,
      properties: {
        x: 100,
        y: 100,
        width: 80,
        height: 40,
        stroke: "#000000",
        fill: "#e2e8f0"
      }
    },
    {
      type: "circle",
      isDeleted: false,
      properties: {
        cx: 200,
        cy: 200,
        radius: 30,
        stroke: "#16a34a"
      }
    },
    {
      type: "text",
      isDeleted: false,
      properties: {
        x: 50,
        y: 80,
        text: "BoardCollab Rocks!",
        fontSize: 20
      }
    }
  ];

  const svg = ExportService.exportSvg(room, elements);
  assert.ok(svg.includes("<svg"));
  assert.ok(svg.includes("<path d=\"M 10 10 L 50 50\""));
  assert.ok(svg.includes("<rect x=\"100\" y=\"100\" width=\"80\" height=\"40\""));
  assert.ok(svg.includes("<circle cx=\"200\" cy=\"200\" r=\"30\""));
  assert.ok(svg.includes("BoardCollab Rocks!"));
  assert.ok(svg.includes("</svg>"));
});
