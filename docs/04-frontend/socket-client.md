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
Status: socket client dependency exists, but connection logic is not implemented.

## Related
- [Real-time communication](../02-architecture/real-time-communication.md)
- [Socket events](../05-api-contracts/socket-events.md)
- [Offline and reconnection](offline-and-reconnection.md)
