# System Assumptions and Operating Limits

## Purpose
Explicitly document all technical assumptions, operational limits, and boundary parameters established for BoardCollab.

## Core Assumptions

### 1. Canvas Elements & Room Capacity
- **Max Elements per Room**: **10,000 elements**.
  - This is an enforced collaboration-service limit, not a load-tested performance threshold. Rendering performance at this size has not been benchmarked.
- **Max Stroke Points**: **5,000 points per individual stroke**.
  - Prevents pathological memory usage or packet size spikes from infinite drawing loops.
- **REST JSON Body Size**: **5 MB** via Express JSON middleware. Socket.IO uses its library default frame limit; this repository does not override it.

### 2. History & Undo/Redo Stacks
- **User Stack Depth**: **50 operations** per user per room.
  - Once the 51st reversible operation is performed, the oldest operation is pruned from memory.
  - Redo stack is immediately invalidated when a user performs a new drawing action after an undo.

### 3. Single-Region Architecture Assumption
- The primary deployment assumes a **single cloud region** (e.g., `us-east-1` or `eu-central-1`).
- Network latency for active WebSocket room participants is assumed to be **< 100ms**.
- For multi-region expansion, see [Scalability & Sharding Architecture](../02-architecture/scalability-and-sharding.md).

### 4. Durability & Persistence Cadence
- **Persistence Flush Interval**: **500ms** default periodic auto-flush in `PersistenceService`.
- High-frequency drawing strokes are aggregated in an in-memory queue and flushed via MongoDB `bulkWrite` upsert operations.
- Server shutdown invokes an emergency blocking flush before process termination.

### 5. Offline Storage Boundaries (IndexedDB)
- IndexedDB element and pending-operation records have no configured expiry or queue-length cap.
- The server accepts up to **1,000 offline operations per sync batch** by default (`OFFLINE_SYNC_BATCH_LIMIT`), not 1,000 queued items total.
- Conflict policy: stale writes with an outdated element version are rejected; this is not a general LWW merge or OT/CRDT system.

## Summary Table

| Parameter | Limit / Default | Configurable Via |
|---|---|---|
| Max Elements per Room | 10,000 | `ROOM_MAX_ELEMENTS` |
| Max Points per Stroke | 5,000 | `STROKE_MAX_POINTS` |
| Undo Stack Depth | 50 operations | `COLLAB_UNDO_LIMIT` |
| Persistence Flush Interval | 500 ms | `PERSISTENCE_FLUSH_INTERVAL_MS` |
| Offline Sync Batch Limit | 1,000 operations | `OFFLINE_SYNC_BATCH_LIMIT` |
| REST JSON Body Size | 5 MB | Express middleware configuration |
| AI Recognition Confidence | 0.70 default | backend: `AI_CONFIDENCE_THRESHOLD`; frontend: `frontend/src/ai/recognizerConfig.js` constant |

## Related
- [Capacity planning](../09-scalability-and-performance/capacity-planning.md)
- [Requirements and scope](requirements-and-scope.md)
- [Scalability and sharding](../02-architecture/scalability-and-sharding.md)
