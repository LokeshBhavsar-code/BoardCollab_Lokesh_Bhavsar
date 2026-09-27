# Ordering and Idempotency

## Purpose
Document how events should be sequenced and why duplicates must be handled consistently.

## Required properties
- each event should have an operation ID
- each room should maintain a monotonic version or sequence marker
- duplicate events should be deduplicated
- retries should not create double-write state

## Recommended patterns
- server acknowledges operations with version metadata
- client tracks pending operations and resends on reconnect if needed
- event processors should check for operation IDs before applying mutation

## Implementation status
Status: planned; no event or versioning model is implemented yet.

## Related
- [Conflict resolution](conflict-resolution.md)
- [Socket events](../05-api-contracts/socket-events.md)
- [Persistence and recovery](persistence-and-recovery.md)
