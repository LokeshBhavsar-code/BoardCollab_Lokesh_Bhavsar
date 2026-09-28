# Socket Events Contract

## Purpose
Document collaboration events expected by clients and server.

## Implemented client-to-server events
Every connection must authenticate with a JWT. Room access is checked when `join-room` is handled.

| Event | Purpose |
| --- | --- |
| `join-room` | Join by room ID/code; receives `room:state` and an acknowledgement. |
| `leave-room` | Leave the active room and update presence. |
| `draw-stroke` | Apply a drawing element; stale versions and capacity limits can reject the write. |
| `element:updated` | Delete an element; owner/editor role required. |
| `undo`, `redo` | Apply user-scoped history operations. |
| `clear-canvas` | Clear a room; owner/editor role required. |
| `sync-offline-batch` | Replay a batch of offline operations. |
| `cursor:move` | Broadcast transient cursor coordinates. |
| `heartbeat` | Return a timestamp acknowledgement. |

## Implemented server-to-client events
`server-ready`, `room:state`, `draw-stroke`, `element:updated`, `room:batch-updated`, `canvas:cleared`, `presence:update`, `cursor:update`, `room:error`, and `room:archived`.

Acknowledgements are supplied for room joins and mutating events when the client provides a callback. Errors use `{ error: { code, message } }` and may also be emitted as `room:error`.

## Implementation status
Status: implemented in `backend/src/sockets/index.js` and `backend/src/sockets/handlers`. This contract summarizes event names; handler code remains authoritative for payload details.

## Related
- [Real-time communication](../02-architecture/real-time-communication.md)
- [Event lifecycle](../07-realtime-and-consistency/event-lifecycle.md)
- [Ordering and idempotency](../07-realtime-and-consistency/ordering-and-idempotency.md)
