# Concurrency Testing

## Purpose
Outline required testing for concurrent collaboration state.

## Scenarios
- two users drawing simultaneously in the same room
- same-shape edits arriving in different orders
- server-side retry leading to duplicate operation IDs
- room metadata updates while session state is changing

## Implementation status
Status: planned design only.

## Related
- [Conflict resolution](../07-realtime-and-consistency/conflict-resolution.md)
- [Ordering and idempotency](../07-realtime-and-consistency/ordering-and-idempotency.md)
- [Testing strategy](testing-strategy.md)
