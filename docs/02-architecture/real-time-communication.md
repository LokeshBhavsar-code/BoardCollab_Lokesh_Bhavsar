# Real-time Communication

## Purpose
Describe the live collaboration layer and required event patterns.

## Current evidence
The repository includes an authenticated Socket.IO server in [backend/src/sockets/index.js](../../backend/src/sockets/index.js), with room and drawing handlers registered on connection. It emits `server-ready`; handlers also implement room state, drawing, undo/redo, clear, presence, and offline-sync events.

## Runtime behavior
- authenticated connection per user
- room membership checks before collaboration access
- broadcast of drawings and presence updates
- durable event queue for later persistence
- room-level event names with client/server validation

## Communication model
- Client -> Server: join room, draw stroke, undo, redo, heartbeat
- Server -> Client: room state, ack, errors, presence updates, reconnect guidance

## Design risks
- duplicate events from reconnect or retry
- out-of-order operations on high-latency client connections
- stale client state after lost network

## Implementation status
Status: collaboration events and authentication are implemented. Redis-backed fan-out is enabled when Redis connects; the fallback is single-process and does not provide cross-instance delivery.

## Related
- [Socket events](../05-api-contracts/socket-events.md)
- [Event lifecycle](../07-realtime-and-consistency/event-lifecycle.md)
- [Drawing synchronization](../07-realtime-and-consistency/drawing-synchronization.md)
