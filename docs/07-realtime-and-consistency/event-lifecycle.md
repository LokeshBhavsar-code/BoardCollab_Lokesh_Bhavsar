# Event Lifecycle

## Purpose
Explain how a collaborative drawing event flows from frontend interaction to server validation and persistent state.

## Planned lifecycle
1. user draws on the canvas in the frontend
2. client generates a drawing event payload with client operation ID
3. client updates local canvas optimistically
4. payload is sent over Socket.IO
5. server authenticates the socket and user
6. server validates membership and room context
7. server orders or queues the operation
8. server applies conflict-resolution policy
9. server broadcasts to room participants
10. operation is queued for persistence
11. MongoDB stores durable representation
12. client records ack and version state

## Mixed implementation status
- implemented: socket server bootstrap and health handshake
- planned: full event lifecycle, persistence queue, and room join auth

## Related
- [Drawing synchronization](drawing-synchronization.md)
- [Socket events](../05-api-contracts/socket-events.md)
- [Persistence and recovery](persistence-and-recovery.md)
