# Collaboration Service

## Purpose
Describe the backend responsibilities for shared drafting and real-time concurrency within a room.

## Implemented responsibilities
- validate incoming drawing operations
- authorize operations against room membership
- order operations or attach sequence metadata
- apply conflict-resolution policy
- broadcast changes to room participants
- queue updates for persistence

## Operational boundaries
The collaboration service should not manage the React UI or browser-specific state. It should only manage room state transitions, authorization, and event dispatch.

## Dependencies
- room membership model
- socket server event handlers
- persistence service
- Redis for temporary coordination or pub/sub

## Implementation status
Status: implemented in `backend/src/services/collaboration.service.js`, with room and drawing handlers in `backend/src/sockets/handlers`. Version checks reject stale writes; there is no general OT/CRDT engine.

## Related
- [Real-time communication](../02-architecture/real-time-communication.md)
- [Drawing synchronization](../07-realtime-and-consistency/drawing-synchronization.md)
- [Socket events](../05-api-contracts/socket-events.md)
