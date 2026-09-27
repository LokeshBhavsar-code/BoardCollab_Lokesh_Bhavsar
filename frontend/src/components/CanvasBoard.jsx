import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Arrow, Circle, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import { useDispatch, useSelector } from "react-redux";
import {
  addLocalElement,
  applyLocalTransform,
  deleteSelectedElements,
  groupSelectedElements,
  moveElementsBatch,
  redoLocal,
  setSelectedIds,
  toggleSelectedId,
  undoLocal
} from "../redux/canvasSlice.js";
import Toolbar from "./Toolbar.jsx";

const TRANSFORMABLE_TYPES = new Set(["rect", "circle", "text"]);
const POINT_TYPES = new Set(["line", "arrow", "polygon", "path"]);
const MIN_SCALE = 0.2;
const MAX_SCALE = 4;
const NUDGE_DELTAS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };

function idOf(element) {
  return element.id || element.elementId;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const CanvasElement = memo(function CanvasElement({
  element,
  mode,
  panMode,
  registerRef,
  onErase,
  onSelectClick,
  onDragStart,
  onDragMove,
  onDragEnd
}) {
  const properties = element.properties || {};
  const id = idOf(element);
  const interactive = mode === "eraser" || mode === "select";

  function handleClick(event) {
    if (mode === "eraser") {
      onErase(id);
      return;
    }
    if (mode === "select") {
      onSelectClick(id, event.evt.shiftKey);
    }
  }

  const common = {
    ref: (node) => registerRef(id, node),
    listening: interactive,
    draggable: mode === "select" && !panMode,
    onClick: interactive ? handleClick : undefined,
    onTap: interactive ? handleClick : undefined,
    onDragStart: mode === "select" ? (event) => onDragStart(id, event) : undefined,
    onDragMove: mode === "select" ? (event) => onDragMove(id, event) : undefined,
    onDragEnd: mode === "select" ? (event) => onDragEnd(id, event) : undefined
  };

  if (element.type === "rect") {
    return <Rect {...common} x={properties.x} y={properties.y} width={properties.width} height={properties.height} rotation={properties.rotation || 0} stroke={properties.stroke} fill={properties.fill || "transparent"} strokeWidth={properties.strokeWidth || 2} />;
  }
  if (element.type === "circle") {
    return <Circle {...common} x={properties.x} y={properties.y} radius={properties.radius} stroke={properties.stroke} fill={properties.fill || "transparent"} strokeWidth={properties.strokeWidth || 2} />;
  }
  if (element.type === "text") {
    return <Text {...common} x={properties.x} y={properties.y} text={properties.text || "Text"} fill={properties.fill || properties.stroke} fontSize={properties.fontSize || 20} rotation={properties.rotation || 0} />;
  }
  if (element.type === "line") {
    const flatPoints = (properties.points || []).flatMap((point) => point);
    return <Line {...common} x={0} y={0} points={flatPoints} stroke={properties.stroke} strokeWidth={properties.strokeWidth || 2} lineCap="round" lineJoin="round" />;
  }
  if (element.type === "arrow") {
    const flatPoints = (properties.points || []).flatMap((point) => point);
    return <Arrow {...common} x={0} y={0} points={flatPoints} stroke={properties.stroke} fill={properties.stroke} strokeWidth={properties.strokeWidth || 2} pointerLength={10} pointerWidth={10} />;
  }
  if (element.type === "polygon") {
    const flatPoints = (properties.points || []).flatMap((point) => point);
    return <Line {...common} x={0} y={0} points={flatPoints} closed stroke={properties.stroke} fill={properties.fill || "transparent"} strokeWidth={properties.strokeWidth || 2} lineJoin="round" />;
  }
  const flatPoints = (properties.points || []).flatMap((point) => point);
  return <Line {...common} x={0} y={0} points={flatPoints} stroke={properties.stroke} strokeWidth={properties.strokeWidth || 3} lineCap="round" lineJoin="round" />;
});

const DraftShape = memo(function DraftShape({ draft }) {
  if (!draft) return null;
  if (draft.type === "rect") return <Rect {...draft.properties} />;
  if (draft.type === "circle") return <Circle {...draft.properties} />;
  if (draft.type === "text") return null;
  if (draft.type === "line") {
    return <Line points={draft.properties.points.flatMap((point) => point)} stroke={draft.properties.stroke} strokeWidth={draft.properties.strokeWidth || 2} lineCap="round" lineJoin="round" />;
  }
  if (draft.type === "arrow") {
    return <Arrow points={draft.properties.points.flatMap((point) => point)} stroke={draft.properties.stroke} fill={draft.properties.stroke} strokeWidth={draft.properties.strokeWidth || 2} pointerLength={10} pointerWidth={10} />;
  }
  if (draft.type === "polygon") {
    return <Line points={draft.properties.points.flatMap((point) => point)} stroke={draft.properties.stroke} fill={draft.properties.fill || "transparent"} strokeWidth={draft.properties.strokeWidth || 2} lineJoin="round" closed={false} />;
  }
  return <Line points={draft.properties.points.flatMap((point) => point)} stroke={draft.properties.stroke} strokeWidth={3} lineCap="round" lineJoin="round" />;
});

function propertiesAfterDrag(element, node) {
  const properties = element.properties || {};
  if (POINT_TYPES.has(element.type)) {
    const dx = node.x();
    const dy = node.y();
    return { ...properties, points: properties.points.map(([px, py]) => [px + dx, py + dy]) };
  }
  return { ...properties, x: node.x(), y: node.y() };
}

function propertiesAfterTransform(element, node) {
  const properties = element.properties || {};
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();
  if (element.type === "rect") {
    const next = { ...properties, x: node.x(), y: node.y(), rotation: node.rotation(), width: Math.max(5, properties.width * scaleX), height: Math.max(5, properties.height * scaleY) };
    node.scaleX(1);
    node.scaleY(1);
    return next;
  }
  if (element.type === "circle") {
    const averageScale = (scaleX + scaleY) / 2;
    const next = { ...properties, x: node.x(), y: node.y(), radius: Math.max(3, properties.radius * averageScale) };
    node.scaleX(1);
    node.scaleY(1);
    return next;
  }
  const averageScale = (scaleX + scaleY) / 2;
  const next = { ...properties, x: node.x(), y: node.y(), rotation: node.rotation(), fontSize: Math.max(8, (properties.fontSize || 20) * averageScale) };
  node.scaleX(1);
  node.scaleY(1);
  return next;
}

export default function CanvasBoard({ socket, roomId }) {
  const dispatch = useDispatch();
  const { tool, color, strokeWidth, fillEnabled, elements, selectedIds, undoStack, redoStack } = useSelector((state) => state.canvas);
  const activeElements = useMemo(() => elements.filter((element) => !element.isDeleted), [elements]);
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const pointerDown = useRef(false);
  const shapeRefs = useRef({});
  const transformerRef = useRef(null);
  const dragContext = useRef(null);
  const panStart = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 960, height: 600 });
  const [draft, setDraft] = useState(null);
  const [selectionRect, setSelectionRect] = useState(null);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [gridVisible, setGridVisible] = useState(true);
  const [panMode, setPanMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setDimensions({ width: Math.max(320, entry.contentRect.width), height: Math.max(320, entry.contentRect.height) });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (tool !== "polygon" && draft?.type === "polygon") setDraft(null);
  }, [tool]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const nodes = selectedIds
      .map((id) => {
        const element = elements.find((item) => idOf(item) === id);
        if (!element || !TRANSFORMABLE_TYPES.has(element.type)) return null;
        return shapeRefs.current[id] || null;
      })
      .filter(Boolean);
    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedIds, elements]);

  // Spacebar pan-mode toggle, kept separate from the shortcut listener below
  // since it needs to ignore key-repeat and not fight typing in the stroke-width input.
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.code !== "Space" || event.repeat) return;
      const active = document.activeElement;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
      event.preventDefault();
      setPanMode(true);
    }
    function handleKeyUp(event) {
      if (event.code === "Space") setPanMode(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Polygon Enter/Escape, Delete, Ctrl+G, Ctrl+Z/Y, arrow-key nudge — one listener.
  useEffect(() => {
    function handleKeyDown(event) {
      if (tool === "polygon" && draft?.type === "polygon") {
        if (event.key === "Enter") {
          event.preventDefault();
          closePolygon();
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setDraft(null);
          return;
        }
      }
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === "y" || (event.shiftKey && event.key.toLowerCase() === "z"))) {
        event.preventDefault();
        redo();
        return;
      }
      if (tool === "select" && selectedIds.length) {
        if (event.key === "Delete" || event.key === "Backspace") {
          event.preventDefault();
          deleteSelection();
          return;
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "g") {
          event.preventDefault();
          groupSelection();
          return;
        }
        if (NUDGE_DELTAS[event.key]) {
          event.preventDefault();
          nudgeSelection(event.key);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }); // no dep array — needs fresh draft/selectedIds/stacks every render

  // Un-transforms a screen pointer position into content coordinates. Required once the
  // stage can pan/zoom — without this every draw tool draws offset from the cursor.
  function pointerPosition(event) {
    const stage = event.target.getStage();
    if (!stage) return null;
    const screenPos = stage.getPointerPosition();
    if (!screenPos) return null;
    return { x: (screenPos.x - stage.x()) / stage.scaleX(), y: (screenPos.y - stage.y()) / stage.scaleY() };
  }

  function registerRef(id, node) {
    if (node) shapeRefs.current[id] = node;
    else delete shapeRefs.current[id];
  }

  function commitElement(value) {
    const element = { id: crypto.randomUUID(), ...value };
    dispatch(addLocalElement(element));
    socket?.emit("draw-stroke", { roomId, element });
  }

  function eraseElement(id) {
    const target = elements.find((element) => idOf(element) === id);
    if (!target || target.isDeleted) return;
    dispatch(deleteSelectedElements([id]));
    socket?.emit("element:updated", { roomId, element: { ...target, isDeleted: true } });
  }

  function undo() {
    if (!undoStack.length) return;
    dispatch(undoLocal());
    socket?.emit("undo", { roomId });
  }

  function redo() {
    if (!redoStack.length) return;
    dispatch(redoLocal());
    socket?.emit("redo", { roomId });
  }

  function handleSelectClick(id, shiftKey) {
    if (shiftKey) dispatch(toggleSelectedId(id));
    else dispatch(setSelectedIds([id]));
  }

  function handleSelectMouseDown(event) {
    const stage = event.target.getStage();
    if (event.target !== stage) return;
    const position = pointerPosition(event);
    if (!position) return;
    if (!event.evt.shiftKey) dispatch(setSelectedIds([]));
    setSelectionRect({ startX: position.x, startY: position.y, x: position.x, y: position.y, width: 0, height: 0 });
  }

  function handleSelectMouseMove(event) {
    if (!selectionRect) return;
    const position = pointerPosition(event);
    if (!position) return;
    setSelectionRect((current) => {
      if (!current) return current;
      const x = Math.min(current.startX, position.x);
      const y = Math.min(current.startY, position.y);
      return { ...current, x, y, width: Math.abs(position.x - current.startX), height: Math.abs(position.y - current.startY) };
    });
  }

  function handleSelectMouseUp() {
    if (!selectionRect) return;
    const box = selectionRect;
    setSelectionRect(null);
    if (box.width < 3 && box.height < 3) return;
    const hitIds = [];
    for (const element of activeElements) {
      const node = shapeRefs.current[idOf(element)];
      if (!node) continue;
      const rect = node.getClientRect({ relativeTo: stageRef.current });
      const intersects = rect.x < box.x + box.width && rect.x + rect.width > box.x && rect.y < box.y + box.height && rect.y + rect.height > box.y;
      if (intersects) hitIds.push(idOf(element));
    }
    if (!hitIds.length) return;
    dispatch(setSelectedIds(hitIds));
  }

  function handleShapeDragStart(id) {
    const element = elements.find((item) => idOf(item) === id);
    const node = shapeRefs.current[id];
    if (!element || !node) return;
    if (!element.groupId) {
      dragContext.current = null;
      return;
    }
    const siblingIds = elements.filter((item) => item.groupId === element.groupId && !item.isDeleted).map(idOf);
    const startPositions = {};
    for (const siblingId of siblingIds) {
      const siblingNode = shapeRefs.current[siblingId];
      if (siblingNode) startPositions[siblingId] = { x: siblingNode.x(), y: siblingNode.y() };
    }
    dragContext.current = { leaderId: id, leaderStart: { x: node.x(), y: node.y() }, siblingIds, startPositions };
  }

  function handleShapeDragMove(id, event) {
    const context = dragContext.current;
    if (!context || context.leaderId !== id) return;
    const leaderNode = event.target;
    const dx = leaderNode.x() - context.leaderStart.x;
    const dy = leaderNode.y() - context.leaderStart.y;
    for (const siblingId of context.siblingIds) {
      if (siblingId === id) continue;
      const siblingNode = shapeRefs.current[siblingId];
      const start = context.startPositions[siblingId];
      if (!siblingNode || !start) continue;
      siblingNode.position({ x: start.x + dx, y: start.y + dy });
    }
    leaderNode.getLayer()?.batchDraw();
  }

  function handleShapeDragEnd(id, event) {
    const context = dragContext.current;
    dragContext.current = null;
    const element = elements.find((item) => idOf(item) === id);
    if (!element) return;

    if (context && context.leaderId === id && context.siblingIds.length > 1) {
      const updates = [];
      for (const siblingId of context.siblingIds) {
        const siblingElement = elements.find((item) => idOf(item) === siblingId);
        const siblingNode = shapeRefs.current[siblingId];
        if (!siblingElement || !siblingNode) continue;
        updates.push({ id: siblingId, properties: propertiesAfterDrag(siblingElement, siblingNode) });
      }
      if (updates.length) {
        dispatch(moveElementsBatch(updates));
        for (const update of updates) {
          const updatedElement = elements.find((item) => idOf(item) === update.id);
          if (updatedElement) socket?.emit("element:updated", { roomId, element: { ...updatedElement, properties: update.properties } });
        }
      }
      return;
    }

    const node = event.target;
    const properties = propertiesAfterDrag(element, node);
    dispatch(applyLocalTransform({ id, properties }));
    socket?.emit("element:updated", { roomId, element: { ...element, properties } });
  }

  function handleTransformEnd() {
    const nodes = transformerRef.current?.nodes() || [];
    const updates = [];
    for (const node of nodes) {
      const id = node.id() || Object.keys(shapeRefs.current).find((key) => shapeRefs.current[key] === node);
      const element = elements.find((item) => idOf(item) === id);
      if (!element) continue;
      updates.push({ id, properties: propertiesAfterTransform(element, node) });
    }
    if (!updates.length) return;
    if (updates.length === 1) dispatch(applyLocalTransform(updates[0]));
    else dispatch(moveElementsBatch(updates));
    for (const update of updates) {
      const element = elements.find((item) => idOf(item) === update.id);
      if (element) socket?.emit("element:updated", { roomId, element: { ...element, properties: update.properties } });
    }
  }

  function nudgeSelection(key) {
    const delta = NUDGE_DELTAS[key];
    if (!delta) return;
    const [dx, dy] = delta;
    const updates = [];
    for (const id of selectedIds) {
      const element = elements.find((item) => idOf(item) === id);
      if (!element) continue;
      const properties = element.properties;
      const nextProperties = POINT_TYPES.has(element.type)
        ? { ...properties, points: properties.points.map(([px, py]) => [px + dx, py + dy]) }
        : { ...properties, x: properties.x + dx, y: properties.y + dy };
      updates.push({ id, properties: nextProperties });
    }
    if (!updates.length) return;
    if (updates.length === 1) dispatch(applyLocalTransform(updates[0]));
    else dispatch(moveElementsBatch(updates));
    for (const update of updates) {
      const element = elements.find((item) => idOf(item) === update.id);
      if (element) socket?.emit("element:updated", { roomId, element: { ...element, properties: update.properties } });
    }
  }

  function deleteSelection() {
    if (!selectedIds.length) return;
    const targets = elements.filter((element) => selectedIds.includes(idOf(element)) && !element.isDeleted);
    dispatch(deleteSelectedElements(selectedIds));
    for (const target of targets) socket?.emit("element:updated", { roomId, element: { ...target, isDeleted: true } });
  }

  function groupSelection() {
    if (selectedIds.length < 2) return;
    const groupId = crypto.randomUUID();
    dispatch(groupSelectedElements({ ids: selectedIds, groupId }));
    for (const id of selectedIds) {
      const element = elements.find((item) => idOf(item) === id);
      if (element) socket?.emit("element:updated", { roomId, element: { ...element, groupId } });
    }
  }

  function closePolygon() {
    if (!draft || draft.type !== "polygon") return;
    const points = draft.properties.points;
    if (points.length < 3) {
      setDraft(null);
      return;
    }
    commitElement({ type: "polygon", properties: draft.properties });
    setDraft(null);
  }

  function startDrawing(event) {
    const position = pointerPosition(event);
    if (!position || event.evt.button > 0) return;

    if (tool === "text") {
      commitElement({ type: "text", properties: { x: position.x, y: position.y, text: "Text", fontSize: 20, fill: color } });
      return;
    }
    if (tool === "polygon") {
      setDraft((current) => {
        if (!current || current.type !== "polygon") {
          return { type: "polygon", properties: { points: [[position.x, position.y]], stroke: color, strokeWidth, fill: fillEnabled ? color : "transparent" } };
        }
        return { ...current, properties: { ...current.properties, points: [...current.properties.points, [position.x, position.y]] } };
      });
      return;
    }

    pointerDown.current = true;

    if (tool === "pen") {
      setDraft({ type: "path", start: position, properties: { points: [[position.x, position.y]], stroke: color, strokeWidth: strokeWidth || 3 } });
      return;
    }
    if (tool === "line" || tool === "arrow") {
      setDraft({ type: tool, start: position, properties: { points: [[position.x, position.y], [position.x, position.y]], stroke: color, strokeWidth } });
      return;
    }
    setDraft({ type: tool, start: position, properties: { x: position.x, y: position.y, width: 0, height: 0, radius: 0, stroke: color, strokeWidth, fill: fillEnabled ? color : "transparent" } });
  }

  function moveDrawing(event) {
    if (!pointerDown.current || !draft) return;
    const position = pointerPosition(event);
    if (!position) return;
    setDraft((current) => {
      if (!current) return current;
      if (current.type === "path") {
        return { ...current, properties: { ...current.properties, points: [...current.properties.points, [position.x, position.y]] } };
      }
      if (current.type === "line" || current.type === "arrow") {
        return { ...current, properties: { ...current.properties, points: [current.properties.points[0], [position.x, position.y]] } };
      }
      if (current.type === "rect") {
        const x = Math.min(current.start.x, position.x);
        const y = Math.min(current.start.y, position.y);
        return { ...current, properties: { ...current.properties, x, y, width: Math.abs(position.x - current.start.x), height: Math.abs(position.y - current.start.y) } };
      }
      return { ...current, properties: { ...current.properties, radius: Math.hypot(position.x - current.start.x, position.y - current.start.y) } };
    });
  }

  function finishDrawing() {
    pointerDown.current = false;
    if (!draft || draft.type === "polygon") return;
    const completed = draft;
    setDraft(null);
    const p = completed.properties;
    if (completed.type === "path" && p.points.length < 2) p.points.push(p.points[0]);
    commitElement({ type: completed.type, properties: p });
  }

  function zoomAtCenter(nextScale) {
    const clamped = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    const center = { x: dimensions.width / 2, y: dimensions.height / 2 };
    const contentPoint = { x: (center.x - stagePos.x) / scale, y: (center.y - stagePos.y) / scale };
    setScale(clamped);
    setStagePos({ x: center.x - contentPoint.x * clamped, y: center.y - contentPoint.y * clamped });
  }

  function zoomIn() {
    zoomAtCenter(scale * 1.2);
  }

  function zoomOut() {
    zoomAtCenter(scale / 1.2);
  }

  function zoomReset() {
    setScale(1);
    setStagePos({ x: 0, y: 0 });
  }

  function toggleGrid() {
    setGridVisible((current) => !current);
  }

  function handleWheel(event) {
    if (!(event.evt.ctrlKey || event.evt.metaKey)) return;
    event.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const contentPoint = { x: (pointer.x - stagePos.x) / scale, y: (pointer.y - stagePos.y) / scale };
    const direction = event.evt.deltaY > 0 ? -1 : 1;
    const nextScale = clamp(direction > 0 ? scale * 1.05 : scale / 1.05, MIN_SCALE, MAX_SCALE);
    setScale(nextScale);
    setStagePos({ x: pointer.x - contentPoint.x * nextScale, y: pointer.y - contentPoint.y * nextScale });
  }

  function beginPan(event) {
    event.evt.preventDefault();
    setIsPanning(true);
    panStart.current = { pointerX: event.evt.clientX, pointerY: event.evt.clientY, stageX: stagePos.x, stageY: stagePos.y };
  }

  function handleStageMouseDown(event) {
    if (event.evt.button === 1 || (panMode && event.evt.button === 0 && event.target === event.target.getStage())) {
      beginPan(event);
      return;
    }
    if (tool === "select") {
      handleSelectMouseDown(event);
      return;
    }
    if (tool === "eraser") return;
    startDrawing(event);
  }

  function handleStageMouseMove(event) {
    if (isPanning && panStart.current) {
      const dx = event.evt.clientX - panStart.current.pointerX;
      const dy = event.evt.clientY - panStart.current.pointerY;
      setStagePos({ x: panStart.current.stageX + dx, y: panStart.current.stageY + dy });
      return;
    }
    if (tool === "select") {
      handleSelectMouseMove(event);
      return;
    }
    moveDrawing(event);
  }

  function handleStageMouseUp() {
    if (isPanning) {
      setIsPanning(false);
      panStart.current = null;
      return;
    }
    if (tool === "select") {
      handleSelectMouseUp();
      return;
    }
    finishDrawing();
  }

  const eraserActive = tool === "eraser";
  const selectActive = tool === "select";
  const frameClassName = [
    "canvas-frame",
    gridVisible ? "" : "grid-hidden",
    panMode ? "pan-mode" : "",
    isPanning ? "panning" : ""
  ].filter(Boolean).join(" ");

  return (
    <section className="board-workspace" aria-label="Collaborative whiteboard">
      <Toolbar
        stageRef={stageRef}
        dimensions={dimensions}
        socket={socket}
        roomId={roomId}
        zoomLevel={scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={zoomReset}
        gridVisible={gridVisible}
        onToggleGrid={toggleGrid}
      />
      <div className={frameClassName} ref={containerRef}>
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          x={stagePos.x}
          y={stagePos.y}
          scaleX={scale}
          scaleY={scale}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
          onTouchStart={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onTouchMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onTouchEnd={handleStageMouseUp}
          onDblClick={closePolygon}
          onDblTap={closePolygon}
        >
          <Layer>
            {activeElements.map((element) => (
              <CanvasElement
                element={element}
                mode={eraserActive ? "eraser" : selectActive ? "select" : "draw"}
                panMode={panMode}
                registerRef={registerRef}
                onErase={eraseElement}
                onSelectClick={handleSelectClick}
                onDragStart={handleShapeDragStart}
                onDragMove={handleShapeDragMove}
                onDragEnd={handleShapeDragEnd}
                key={idOf(element)}
              />
            ))}
            <DraftShape draft={draft} />
            {selectActive && <Transformer ref={transformerRef} onTransformEnd={handleTransformEnd} rotateEnabled boundBoxFunc={(oldBox, newBox) => (newBox.width < 5 || newBox.height < 5 ? oldBox : newBox)} />}
            {selectionRect && <Rect x={selectionRect.x} y={selectionRect.y} width={selectionRect.width} height={selectionRect.height} fill="rgba(58,110,90,0.12)" stroke="#3a6e5a" strokeWidth={1} dash={[4, 4]} listening={false} />}
          </Layer>
        </Stage>
      </div>
    </section>
  );
}