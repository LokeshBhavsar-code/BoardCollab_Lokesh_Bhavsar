import { createCanvas } from "canvas"; // M-4: node-canvas for server-side PNG rendering

// M-10: Allowlists for SVG attribute sanitization
const CSS_COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+|none|transparent)$/i;
const FINITE_NUMBER_RE = /^-?\d+(\.\d+)?$/;

/**
 * M-10: Sanitize a value intended for an SVG color attribute.
 * Rejects anything that isn't a recognized CSS color token.
 */
function sanitizeColor(value, fallback = "#000000") {
  const str = String(value ?? "").trim();
  return CSS_COLOR_RE.test(str) ? str : fallback;
}

/**
 * M-10: Sanitize a value intended for a numeric SVG attribute (x, y, width, etc.).
 * Returns the number as a string, or the fallback if invalid.
 */
function sanitizeNumber(value, fallback = 0) {
  const n = Number(value);
  if (Number.isFinite(n)) return n;
  const str = String(value ?? "").trim();
  return FINITE_NUMBER_RE.test(str) ? Number(str) : fallback;
}

export class ExportService {
  static exportJson(room, elements) {
    return {
      metadata: {
        roomId: room._id.toString(),
        roomName: room.name,
        exportedAt: new Date().toISOString(),
        elementCount: elements.length
      },
      elements: elements.map((el) => ({
        id: el.elementId || el.id,
        type: el.type,
        properties: el.properties,
        createdBy: el.createdBy,
        version: el.version
      }))
    };
  }

  static exportSvg(room, elements, options = {}) {
    const width = sanitizeNumber(options.width, 1920);
    const height = sanitizeNumber(options.height, 1080);
    // M-10: Escape title for XML output
    const title = String(room?.name || "BoardCollab Export")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    let svgBody = "";

    for (const el of elements) {
      if (el.isDeleted) continue;
      const props = el.properties || {};

      switch (el.type) {
        case "path": {
          const points = props.points || [];
          if (points.length < 2) break;
          // M-10: sanitize color attrs
          const stroke = sanitizeColor(props.stroke, "#000000");
          const strokeWidth = sanitizeNumber(props.strokeWidth, 2);
          const strokeLinecap = ["round", "butt", "square"].includes(props.lineCap) ? props.lineCap : "round";
          const strokeLinejoin = ["round", "miter", "bevel"].includes(props.lineJoin) ? props.lineJoin : "round";

          let d = "";
          if (Array.isArray(points[0])) {
            d = `M ${sanitizeNumber(points[0][0])} ${sanitizeNumber(points[0][1])} ` +
              points.slice(1).map((p) => `L ${sanitizeNumber(p[0])} ${sanitizeNumber(p[1])}`).join(" ");
          } else {
            d = `M ${sanitizeNumber(points[0])} ${sanitizeNumber(points[1])}`;
            for (let i = 2; i < points.length; i += 2) {
              d += ` L ${sanitizeNumber(points[i])} ${sanitizeNumber(points[i + 1])}`;
            }
          }

          svgBody += `  <path d="${d}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" stroke-linecap="${strokeLinecap}" stroke-linejoin="${strokeLinejoin}" />\n`;
          break;
        }

        case "rect": {
          const x = sanitizeNumber(props.x, 0);
          const y = sanitizeNumber(props.y, 0);
          const w = sanitizeNumber(props.width, 50);
          const h = sanitizeNumber(props.height, 50);
          const stroke = sanitizeColor(props.stroke, "#000000");
          const strokeWidth = sanitizeNumber(props.strokeWidth, 2);
          const fill = sanitizeColor(props.fill, "none");
          svgBody += `  <rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill}" />\n`;
          break;
        }

        case "circle": {
          const cx = sanitizeNumber(props.cx ?? props.x, 0);
          const cy = sanitizeNumber(props.cy ?? props.y, 0);
          const r = sanitizeNumber(props.radius, 25);
          const stroke = sanitizeColor(props.stroke, "#000000");
          const strokeWidth = sanitizeNumber(props.strokeWidth, 2);
          const fill = sanitizeColor(props.fill, "none");
          svgBody += `  <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill}" />\n`;
          break;
        }

        case "text": {
          const x = sanitizeNumber(props.x, 0);
          const y = sanitizeNumber(props.y, 0);
          const fill = sanitizeColor(props.fill ?? props.stroke, "#000000");
          const fontSize = sanitizeNumber(props.fontSize, 16);
          // M-10: escape all special XML chars in text content
          const text = String(props.text || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
          svgBody += `  <text x="${x}" y="${y}" fill="${fill}" font-size="${fontSize}" font-family="sans-serif">${text}</text>\n`;
          break;
        }

        case "line":
        case "arrow": {
          const points = props.points || [0, 0, 100, 100];
          const stroke = sanitizeColor(props.stroke, "#000000");
          const strokeWidth = sanitizeNumber(props.strokeWidth, 2);
          let x1 = 0, y1 = 0, x2 = 100, y2 = 100;
          if (Array.isArray(points[0])) {
            x1 = sanitizeNumber(points[0]?.[0]); y1 = sanitizeNumber(points[0]?.[1]);
            x2 = sanitizeNumber(points[1]?.[0]); y2 = sanitizeNumber(points[1]?.[1]);
          } else {
            x1 = sanitizeNumber(points[0]); y1 = sanitizeNumber(points[1]);
            x2 = sanitizeNumber(points[2]); y2 = sanitizeNumber(points[3]);
          }
          svgBody += `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" />\n`;
          break;
        }

        case "polygon": {
          const rawPoints = props.points || [];
          if (rawPoints.length < 2) break;
          const stroke = sanitizeColor(props.stroke, "#000000");
          const strokeWidth = sanitizeNumber(props.strokeWidth, 2);
          const fill = sanitizeColor(props.fill, "none");
          const pointsStr = rawPoints
            .map((p) => Array.isArray(p) ? `${sanitizeNumber(p[0])},${sanitizeNumber(p[1])}` : "")
            .filter(Boolean)
            .join(" ");
          svgBody += `  <polygon points="${pointsStr}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" />\n`;
          break;
        }
      }
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <title>${title}</title>
  <rect width="100%" height="100%" fill="#ffffff"/>
${svgBody}</svg>`;
  }

  /**
   * M-4: PNG export using node-canvas (server-side Canvas API rendering).
   * Renders the same elements as the SVG exporter but produces a raster PNG buffer.
   */
  static async exportPng(room, elements, options = {}) {
    const width = sanitizeNumber(options.width, 1920);
    const height = sanitizeNumber(options.height, 1080);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    for (const el of elements) {
      if (el.isDeleted) continue;
      const props = el.properties || {};

      ctx.save();
      ctx.strokeStyle = sanitizeColor(props.stroke, "#000000");
      ctx.lineWidth = sanitizeNumber(props.strokeWidth, 2);
      ctx.fillStyle = sanitizeColor(props.fill, "transparent");
      ctx.lineCap = ["round", "butt", "square"].includes(props.lineCap) ? props.lineCap : "round";
      ctx.lineJoin = ["round", "miter", "bevel"].includes(props.lineJoin) ? props.lineJoin : "round";

      switch (el.type) {
        case "path": {
          const points = props.points || [];
          if (points.length < 2) break;
          ctx.beginPath();
          if (Array.isArray(points[0])) {
            ctx.moveTo(sanitizeNumber(points[0][0]), sanitizeNumber(points[0][1]));
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(sanitizeNumber(points[i][0]), sanitizeNumber(points[i][1]));
            }
          } else {
            ctx.moveTo(sanitizeNumber(points[0]), sanitizeNumber(points[1]));
            for (let i = 2; i < points.length; i += 2) {
              ctx.lineTo(sanitizeNumber(points[i]), sanitizeNumber(points[i + 1]));
            }
          }
          ctx.stroke();
          break;
        }

        case "rect": {
          const x = sanitizeNumber(props.x, 0);
          const y = sanitizeNumber(props.y, 0);
          const w = sanitizeNumber(props.width, 50);
          const h = sanitizeNumber(props.height, 50);
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          if (props.fill && props.fill !== "none") ctx.fill();
          ctx.stroke();
          break;
        }

        case "circle": {
          const cx = sanitizeNumber(props.cx ?? props.x, 0);
          const cy = sanitizeNumber(props.cy ?? props.y, 0);
          const r = sanitizeNumber(props.radius, 25);
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          if (props.fill && props.fill !== "none") ctx.fill();
          ctx.stroke();
          break;
        }

        case "text": {
          const x = sanitizeNumber(props.x, 0);
          const y = sanitizeNumber(props.y, 0);
          const fontSize = sanitizeNumber(props.fontSize, 16);
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = sanitizeColor(props.fill ?? props.stroke, "#000000");
          ctx.fillText(String(props.text || ""), x, y);
          break;
        }

        case "line":
        case "arrow": {
          const points = props.points || [0, 0, 100, 100];
          let x1, y1, x2, y2;
          if (Array.isArray(points[0])) {
            x1 = sanitizeNumber(points[0]?.[0]); y1 = sanitizeNumber(points[0]?.[1]);
            x2 = sanitizeNumber(points[1]?.[0]); y2 = sanitizeNumber(points[1]?.[1]);
          } else {
            x1 = sanitizeNumber(points[0]); y1 = sanitizeNumber(points[1]);
            x2 = sanitizeNumber(points[2]); y2 = sanitizeNumber(points[3]);
          }
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          break;
        }

        case "polygon": {
          const points = props.points || [];
          if (points.length < 2) break;
          ctx.beginPath();
          ctx.moveTo(sanitizeNumber(points[0][0]), sanitizeNumber(points[0][1]));
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(sanitizeNumber(points[i][0]), sanitizeNumber(points[i][1]));
          }
          ctx.closePath();
          if (props.fill && props.fill !== "none" && props.fill !== "transparent") ctx.fill();
          ctx.stroke();
          break;
        }
      }

      ctx.restore();
    }

    return canvas.toBuffer("image/png");
  }
}

export default ExportService;
