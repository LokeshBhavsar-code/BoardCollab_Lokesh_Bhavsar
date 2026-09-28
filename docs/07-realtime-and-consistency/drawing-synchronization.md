# Drawing Synchronization

## Purpose
Describe how drawing actions are synchronized across collaborators.

## Flow
- each stroke or shape is represented as a room event
- server validates room membership and uniqueness
- room-level broadcast transmits the event to all peers
- clients apply the event to their local canvas model
- any unresolved state is reconciled on reconnect

## Failure modes
- lost network events
- duplicate delivery
- stale version state
- malicious payload injection

## Implementation status
Status: authenticated room join, snapshot hydration, drawing broadcast, presence, and offline batch paths are implemented. Snapshot size and concurrent-load behavior have not been benchmarked.

## Related
- [Event lifecycle](event-lifecycle.md)
- [Conflict resolution](conflict-resolution.md)
- [Socket events](../05-api-contracts/socket-events.md)
