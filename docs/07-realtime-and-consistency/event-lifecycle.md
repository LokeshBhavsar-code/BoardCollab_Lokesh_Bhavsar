# Event Lifecycle

## Purpose
Explain how a collaborative drawing event flows from frontend interaction to server validation and persistent state.

## Implemented lifecycle
1. user draws on the canvas in the frontend
2. client generates a drawing element with an element ID
3. client updates local canvas optimistically
4. payload is sent over Socket.IO
5. server authenticates the socket and user
6. server validates membership and room context
7. server applies the room-version check and updates in-memory room state
8. server records user-scoped in-memory undo history
9. server broadcasts to room participants
10. operation is queued for persistence
11. MongoDB stores durable representation
12. client records ack and version state

## Limits
The persistence queue is in memory and flushes elements periodically; acknowledgements do not imply a durable MongoDB commit. Version checks reject stale element updates but do not transform operations. Offline queue replay is client-side and does not provide exactly-once delivery.

Status: the main drawing lifecycle is implemented across the canvas, socket handlers, collaboration service, and persistence service. Load and failure-recovery guarantees are still unverified.

## Related
- [Drawing synchronization](drawing-synchronization.md)
- [Socket events](../05-api-contracts/socket-events.md)
- [Persistence and recovery](persistence-and-recovery.md)
