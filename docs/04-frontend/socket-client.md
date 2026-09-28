# Socket Client

## Purpose
Describe the expected role of the browser-side Socket.IO client in a collaborative session.

## Responsibilities
- establish and maintain a WebSocket connection
- authenticate or re-authenticate session access
- join and leave room channels
- send drawing actions and ack requests
- process server broadcasts and presence updates
- handle reconnect and resync logic

## Boundary
The socket client should not directly manipulate the database or business layer. It should translate browser actions into socket events and propagate server-driven changes into the frontend state layer.

## Implementation status
Status: `frontend/src/hooks/useSocket.js` owns the authenticated socket lifecycle and dispatches room, drawing, presence, and reconnection events into application state.

## Related
- [Real-time communication](../02-architecture/real-time-communication.md)
- [Socket events](../05-api-contracts/socket-events.md)
- [Offline and reconnection](offline-and-reconnection.md)
