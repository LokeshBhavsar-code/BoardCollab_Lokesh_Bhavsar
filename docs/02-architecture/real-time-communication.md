# Real-time Communication

## Purpose
Describe the live collaboration layer and required event patterns.

## Current evidence
The repository includes a Socket.IO server bootstrap in [backend/src/server.js](../../backend/src/server.js) that emits a `server-ready` event upon connection.

## Planned architecture
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
Status: bootstrapped but not yet implemented as full collaboration protocol.

## Related
- [Socket events](../05-api-contracts/socket-events.md)
- [Event lifecycle](../07-realtime-and-consistency/event-lifecycle.md)
- [Drawing synchronization](../07-realtime-and-consistency/drawing-synchronization.md)
