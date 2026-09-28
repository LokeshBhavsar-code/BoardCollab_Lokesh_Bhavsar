# State Management

## Purpose
Define how state should be split between UI, shared workspace, and socket-driven sources.

## Recommended model
### React state
- form validation
- modal visibility
- transient UI interactions

### Redux Toolkit
- current room metadata
- participant membership
- board metadata
- undo/redo history
- socket connection status

### Socket client state
- connection health
- reconnect attempts
- pending acknowledgments
- event queue and deduplication metadata

### Browser persistence
- remember user session or drafts if required
- avoid storing server-authoritative state in browser storage for the live board

## Implementation status
Status: Redux Toolkit slices manage room/session and canvas state. IndexedDB stores offline room elements and queued operations; verify the current store and sync implementation when changing these boundaries.

## Related
- [Frontend architecture](../02-architecture/frontend-architecture.md)
- [Socket client](socket-client.md)
- [Offline and reconnection](offline-and-reconnection.md)
