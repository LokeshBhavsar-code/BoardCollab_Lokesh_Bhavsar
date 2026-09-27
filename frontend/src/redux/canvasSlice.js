import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tool: "pen",
  color: "#173f35",
  fillColor: "#e6edea",
  activeColorSlot: "color1", // "color1" (stroke/primary) or "color2" (fill/secondary)
  strokeWidth: 2,
  fillEnabled: false,
  roomId: null,
  elements: [],
  selectedIds: [],
  undoStack: [],
  redoStack: []
};

function elementId(element) {
  return element.id || element.elementId;
}

function upsert(elements, incoming) {
  if (!incoming) return elements;
  const id = elementId(incoming);
  if (!id) return elements;
  const index = elements.findIndex((element) => elementId(element) === id);
  if (index < 0) return [...elements, incoming];
  const next = elements.slice();
  next[index] = incoming;
  return next;
}

function findElement(elements, id) {
  return elements.find((element) => elementId(element) === id);
}

function snapshot(element) {
  return { ...element, properties: { ...(element.properties || {}) } };
}

function recordOperation(state, ids, before, after) {
  state.undoStack.push({ ids, before, after });
  state.redoStack = [];
}

function restoreOperation(state, ids, snapshots) {
  for (const id of ids) {
    const saved = snapshots.find((element) => elementId(element) === id);
    const current = findElement(state.elements, id);
    if (saved) {
      state.elements = upsert(state.elements, saved);
    } else if (current) {
      current.isDeleted = true;
    }
  }
}

const canvasSlice = createSlice({
  name: "canvas",
  initialState,
  reducers: {
    setTool(state, action) {
      state.tool = action.payload;
    },
    setColor(state, action) {
      state.color = action.payload;
    },
    setFillColor(state, action) {
      state.fillColor = action.payload;
    },
    setActiveColorSlot(state, action) {
      state.activeColorSlot = action.payload;
    },
    setStrokeWidth(state, action) {
      state.strokeWidth = action.payload;
    },
    toggleFillEnabled(state) {
      state.fillEnabled = !state.fillEnabled;
    },
    setFillEnabled(state, action) {
      state.fillEnabled = Boolean(action.payload);
    },
    hydrateCanvas(state, action) {
      const { roomId, elements = [] } = action.payload;
      if (state.roomId !== roomId) {
        state.undoStack = [];
        state.redoStack = [];
        state.selectedIds = [];
      }
      state.roomId = roomId;
      state.elements = elements.filter((element) => !element.isDeleted);
    },
    addLocalElement(state, action) {
      const incoming = action.payload;
      const id = elementId(incoming);
      const before = findElement(state.elements, id);
      state.elements = upsert(state.elements, incoming);
      recordOperation(state, [id], before ? [snapshot(before)] : [], [snapshot(incoming)]);
    },
    setSelectedIds(state, action) {
      state.selectedIds = [...new Set(action.payload || [])];
    },
    toggleSelectedId(state, action) {
      const id = action.payload;
      state.selectedIds = state.selectedIds.includes(id)
        ? state.selectedIds.filter((selectedId) => selectedId !== id)
        : [...state.selectedIds, id];
    },
    applyLocalTransform(state, action) {
      const { id, properties } = action.payload;
      const element = findElement(state.elements, id);
      if (!element) return;
      const before = snapshot(element);
      element.properties = { ...element.properties, ...properties };
      recordOperation(state, [id], [before], [snapshot(element)]);
    },
    moveElementsBatch(state, action) {
      const updates = action.payload || [];
      const before = [];
      const after = [];
      for (const update of updates) {
        const element = findElement(state.elements, update.id);
        if (!element) continue;
        before.push(snapshot(element));
        element.properties = { ...element.properties, ...update.properties };
        after.push(snapshot(element));
      }
      if (after.length) recordOperation(state, after.map(elementId), before, after);
    },
    deleteSelectedElements(state, action) {
      const ids = action.payload || [];
      const before = [];
      const after = [];
      for (const id of ids) {
        const element = findElement(state.elements, id);
        if (!element || element.isDeleted) continue;
        before.push(snapshot(element));
        element.isDeleted = true;
        after.push(snapshot(element));
      }
      if (after.length) recordOperation(state, after.map(elementId), before, after);
      state.selectedIds = state.selectedIds.filter((id) => !ids.includes(id));
    },
    groupSelectedElements(state, action) {
      const { ids, groupId } = action.payload;
      const before = [];
      const after = [];
      for (const id of ids || []) {
        const element = findElement(state.elements, id);
        if (!element || element.isDeleted) continue;
        before.push(snapshot(element));
        element.groupId = groupId;
        after.push(snapshot(element));
      }
      if (after.length) recordOperation(state, after.map(elementId), before, after);
    },
    mergeRemoteElements(state, action) {
      for (const incoming of action.payload || []) {
        state.elements = upsert(state.elements, incoming);
      }
    },
    applyElementUpdate(state, action) {
      state.elements = upsert(state.elements, action.payload);
    },
    clearCanvas(state) {
      state.elements = [];
      state.selectedIds = [];
      state.undoStack = [];
      state.redoStack = [];
    },
    undoLocal(state) {
      const operation = state.undoStack.pop();
      if (!operation) return;
      restoreOperation(state, operation.ids, operation.before);
      state.redoStack.push(operation);
    },
    redoLocal(state) {
      const operation = state.redoStack.pop();
      if (!operation) return;
      restoreOperation(state, operation.ids, operation.after);
      state.undoStack.push(operation);
    }
  }
});

export const {
  setTool,
  setColor,
  setFillColor,
  setActiveColorSlot,
  setStrokeWidth,
  toggleFillEnabled,
  setFillEnabled,
  hydrateCanvas,
  addLocalElement,
  setSelectedIds,
  toggleSelectedId,
  applyLocalTransform,
  moveElementsBatch,
  deleteSelectedElements,
  groupSelectedElements,
  mergeRemoteElements,
  applyElementUpdate,
  clearCanvas,
  undoLocal,
  redoLocal
} = canvasSlice.actions;

export default canvasSlice.reducer;