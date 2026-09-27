# System Assumptions and Operating Limits

## Purpose
Explicitly document all technical assumptions, operational limits, and boundary parameters established for BoardCollab.

## Core Assumptions

### 1. Canvas Elements & Room Capacity
- **Max Elements per Room**: **10,000 elements**.
  - *Rationale*: Beyond 10,000 active vector nodes, browser canvas rendering (Konva/HTML5 Canvas) degrades below 60fps without spatial viewport culling.
  - *Mitigation*: Canvas culling renders only elements intersecting the visible viewport; archiving older sessions resets the active element count.
- **Max Stroke Points**: **5,000 points per individual stroke**.
  - Prevents pathological memory usage or packet size spikes from infinite drawing loops.
- **Max Payload Size**: **5 MB** for REST request payloads and **1 MB** for WebSocket frames.

### 2. History & Undo/Redo Stacks
- **User Stack Depth**: **50 operations** per user per room.
  - Once the 51st reversible operation is performed, the oldest operation is pruned from memory.
  - Redo stack is immediately invalidated when a user performs a new drawing action after an undo.

### 3. Single-Region Architecture Assumption
- The primary deployment assumes a **single cloud region** (e.g., `us-east-1` or `eu-central-1`).
- Network latency for active WebSocket room participants is assumed to be **< 100ms**.
- For multi-region expansion, see [Scalability & Sharding Architecture](../02-architecture/scalability-and-sharding.md).

### 4. Durability & Persistence Cadence
- **Persistence Flush Window**: **500ms** auto-flush debounce in `PersistenceService`.
- High-frequency drawing strokes are aggregated in an in-memory queue and flushed via MongoDB `bulkWrite` upsert operations.
- Server shutdown invokes an emergency blocking flush before process termination.

### 5. Offline Storage Boundaries (IndexedDB)
- **Offline Cache Retention**: 30 days of cached room snapshots.
- **Max Offline Pending Operations**: Up to 1,000 queued operations per room prior to reconnection.
- Conflict policy: Last-Write-Wins (LWW) based on monotonic room sequence versions.

## Summary Table

| Parameter | Limit / Default | Configurable Via |
|---|---|---|
| Max Elements per Room | 10,000 | `ROOM_MAX_ELEMENTS` |
| Max Points per Stroke | 5,000 | `STROKE_MAX_POINTS` |
| Undo Stack Depth | 50 operations | `COLLAB_UNDO_LIMIT` |
| Persistence Flush Interval | 500 ms | `PERSISTENCE_FLUSH_INTERVAL_MS` |
| Max REST Body Size | 5 MB | `EXPRESS_BODY_LIMIT` |
| Max Socket Payload | 1 MB | `SOCKET_MAX_HTTP_BUFFER_SIZE` |
| AI Confidence Threshold | 0.70 | `VITE_AI_CONFIDENCE_THRESHOLD` |

## Related
- [Capacity planning](../09-scalability-and-performance/capacity-planning.md)
- [Requirements and scope](requirements-and-scope.md)
- [Scalability and sharding](../02-architecture/scalability-and-sharding.md)
