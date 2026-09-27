# Socket Events Contract

## Purpose
Document collaboration events expected by clients and server.

## Event table
| Event | Direction | Auth | Purpose | Persistence |
| --- | --- | --- | --- | --- |
| `join-room` | client -> server | yes | join or rejoin a room session | no |
| `draw-stroke` | client -> server | yes | send a drawing operation | yes |
| `undo` | client -> server | yes | revert latest action for a user | yes |
| `redo` | client -> server | yes | reapply latest undo | yes |
| `heartbeat` | client -> server | yes | connection liveness signal | no |
| `presence:update` | server -> client | yes | user presence changes | no |
| `room:state` | server -> client | yes | current room snapshot | no |

## Validation expectations
- ensure room membership before accepting events
- reject malformed payloads with explicit error codes
- enforce dedupe or sequence checks for retry scenarios

## Acknowledgment behavior
Server acknowledgments are expected to carry success or failure status and optional metadata.

## Implementation status
Status: planned; only `server-ready` is implemented in [backend/src/server.js](../../backend/src/server.js).

## Related
- [Real-time communication](../02-architecture/real-time-communication.md)
- [Event lifecycle](../07-realtime-and-consistency/event-lifecycle.md)
- [Ordering and idempotency](../07-realtime-and-consistency/ordering-and-idempotency.md)
