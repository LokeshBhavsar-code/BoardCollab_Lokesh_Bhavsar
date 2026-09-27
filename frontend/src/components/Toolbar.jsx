import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearCanvas,
  redoLocal,
  setColor,
  setFillColor,
  setFillEnabled,
  setStrokeWidth,
  setTool,
  undoLocal
} from "../redux/canvasSlice.js";

const TOOLS = [
  { id: "select",  icon: "↖",  label: "Select",  title: "Select & Move" },
  { id: "pen",     icon: "P",  label: "Pen",     title: "Pen / Pencil" },
  { id: "eraser",  icon: "⌫",  label: "Eraser",  title: "Eraser" },
  { id: "line",    icon: "/",  label: "Line",    title: "Straight Line" },
  { id: "arrow",   icon: "→",  label: "Arrow",   title: "Arrow" },
  { id: "rect",    icon: "□",  label: "Rect",    title: "Rectangle" },
  { id: "circle",  icon: "○",  label: "Circle",  title: "Circle / Ellipse" },
  { id: "polygon", icon: "⬠",  label: "Polygon", title: "Polygon (dbl-click to close)" },
  { id: "text",    icon: "A",  label: "Text",    title: "Text" },
];

const PALETTE = [
  "#000000","#ffffff","#ef4444","#f97316","#eab308",
  "#22c55e","#3b82f6","#8b5cf6","#ec4899","#64748b",
  "#7f1d1d","#1e3a5f","#166534","#713f12","#c084fc",
];

const WIDTHS = [1, 2, 4, 6, 10, 16];

function Divider() {
  return <div className="tb-divider" aria-hidden="true" />;
}

export default function Toolbar({ stageRef, socket, roomId }) {
  const dispatch = useDispatch();
  const { tool, color, fillColor, fillEnabled, strokeWidth, undoStack, redoStack } =
    useSelector((s) => s.canvas);

  const [showPicker, setShowPicker] = useState(false);
  const [activeSlot, setActiveSlot] = useState("stroke");
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!showPicker) return;
    function close(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target))
        setShowPicker(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showPicker]);

  const undo = () => { if (undoStack.length) { dispatch(undoLocal()); socket?.emit("undo", { roomId }); } };
  const redo = () => { if (redoStack.length) { dispatch(redoLocal()); socket?.emit("redo", { roomId }); } };
  const clear = () => {
    if (window.confirm("Clear the board for everyone?")) {
      dispatch(clearCanvas());
      socket?.emit("clear-canvas", { roomId });
    }
  };
  const exportPng = () => {
    const stage = stageRef?.current;
    if (!stage) return;
    const a = document.createElement("a");
    a.download = "whiteboard.png";
    a.href = stage.toDataURL({ pixelRatio: 2 });
    a.click();
  };

  const activeColor = activeSlot === "fill" ? fillColor : color;
  const pickColor = (c) => {
    if (activeSlot === "fill") dispatch(setFillColor(c));
    else dispatch(setColor(c));
  };

  return (
    <div className="tb-bar" role="toolbar" aria-label="Drawing toolbar">

      {/* Undo / Redo */}
      <div className="tb-group">
        <button className="tb-btn" title="Undo (Ctrl+Z)" disabled={!undoStack.length} onClick={undo} aria-label="Undo">
          <span className="tb-icon">↩</span><span className="tb-label">Undo</span>
        </button>
        <button className="tb-btn" title="Redo (Ctrl+Y)" disabled={!redoStack.length} onClick={redo} aria-label="Redo">
          <span className="tb-icon">↪</span><span className="tb-label">Redo</span>
        </button>
      </div>

      <Divider />

      {/* Drawing Tools */}
      <div className="tb-group">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className={`tb-btn tb-tool ${tool === t.id ? "tb-active" : ""}`}
            title={t.title}
            aria-label={t.title}
            aria-pressed={tool === t.id}
            onClick={() => dispatch(setTool(t.id))}
          >
            <span className="tb-icon">{t.icon}</span>
            <span className="tb-label">{t.label}</span>
          </button>
        ))}
      </div>

      <Divider />

      {/* Stroke Width */}
      <div className="tb-group tb-widths" aria-label="Stroke width">
        {WIDTHS.map((w) => (
          <button
            key={w}
            className={`tb-width-btn ${strokeWidth === w ? "tb-active" : ""}`}
            title={`${w}px stroke`}
            aria-label={`Stroke width ${w}px`}
            aria-pressed={strokeWidth === w}
            onClick={() => dispatch(setStrokeWidth(w))}
          >
            <span
              className="tb-dot"
              style={{ width: Math.min(w + 3, 18), height: Math.min(w + 3, 18) }}
            />
          </button>
        ))}
      </div>

      <Divider />

      {/* Color picker */}
      <div className="tb-group tb-color-area" ref={pickerRef}>
        <button
          className={`tb-slot-btn ${activeSlot === "stroke" ? "tb-active" : ""}`}
          title="Stroke color"
          aria-label="Stroke color"
          onClick={() => { setActiveSlot("stroke"); setShowPicker(true); }}
        >
          <span className="tb-slot-swatch" style={{ background: color }} />
          <span className="tb-label">Stroke</span>
        </button>
        <button
          className={`tb-slot-btn ${activeSlot === "fill" ? "tb-active" : ""}`}
          title="Fill color"
          aria-label="Fill color"
          onClick={() => { setActiveSlot("fill"); setShowPicker(true); }}
        >
          <span
            className="tb-slot-swatch"
            style={{
              background: fillEnabled ? fillColor : "transparent",
              border: fillEnabled ? "none" : "2px dashed #94a3b8"
            }}
          />
          <span className="tb-label">Fill</span>
        </button>
        <button
          className={`tb-btn ${fillEnabled ? "tb-active" : ""}`}
          title={fillEnabled ? "Disable fill" : "Enable fill"}
          aria-pressed={fillEnabled}
          onClick={() => dispatch(setFillEnabled(!fillEnabled))}
        >
          <span className="tb-icon">{fillEnabled ? "■" : "□"}</span>
          <span className="tb-label">{fillEnabled ? "Filled" : "No Fill"}</span>
        </button>

        {showPicker && (
          <div className="tb-popup" role="dialog" aria-label="Color palette">
            <div className="tb-palette-grid">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  className={`tb-swatch ${activeColor === c ? "tb-swatch-sel" : ""}`}
                  style={{ background: c, border: c === "#ffffff" ? "1px solid #e2e8f0" : "none" }}
                  title={c}
                  aria-label={`Pick color ${c}`}
                  onClick={() => { pickColor(c); setShowPicker(false); }}
                />
              ))}
            </div>
            <label className="tb-custom-row">
              <span>Custom</span>
              <input
                type="color"
                value={activeColor}
                onChange={(e) => pickColor(e.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      <Divider />

      {/* Actions */}
      <div className="tb-group">
        <button className="tb-btn" title="Save as PNG" onClick={exportPng} aria-label="Export PNG">
          <span className="tb-icon">PNG</span><span className="tb-label">Export</span>
        </button>
        <button className="tb-btn tb-danger" title="Clear board" onClick={clear} aria-label="Clear board">
          <span className="tb-icon">Clear</span><span className="tb-label">Board</span>
        </button>
      </div>

    </div>
  );
}
