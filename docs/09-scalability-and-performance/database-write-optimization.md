# Database Write Optimization

## Purpose
Document how drawing events and snapshots should be persisted efficiently.

## Current implementation and follow-up
- batch writes for multiple operations in a time window
- store session version metadata to avoid stale writes
- keep full snapshots and deltas separated if the board grows large
- avoid rewriting the entire session object for every stroke unless necessary

## Risks
- write amplification on large boards
- row or document locking issues under heavy concurrency
- stale writes if room version tracking is inaccurate

## Implementation status
Status: element writes are queued and batch-flushed with retry after write failure, and session/element versions reject stale writes. Durable queueing, full snapshots/deltas, and load-tested performance remain future work.

## Related
- [Persistence service](../03-backend/persistence-service.md)
- [Database overview](../06-data-design/database-overview.md)
- [Capacity planning](capacity-planning.md)
