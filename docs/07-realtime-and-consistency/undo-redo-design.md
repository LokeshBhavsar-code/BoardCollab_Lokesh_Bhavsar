# Undo and Redo Design

## Purpose
Define how user-scoped history and board state recovery should be designed.

## Requirements
- each user should have independent undo and redo history
- actions should be represented as operations and not only raw strokes
- undo should be room-aware and version-aware
- redo should fail cleanly when the room state has changed beyond the local history

## Design notes
- maintain a per-user stack for reversible actions
- store operation IDs with each event
- clear or invalidate redo when a new conflicting action occurs

## Implementation status
Status: planned design only.

## Related
- [Conflict resolution](conflict-resolution.md)
- [Event lifecycle](event-lifecycle.md)
- [Ordering and idempotency](ordering-and-idempotency.md)
