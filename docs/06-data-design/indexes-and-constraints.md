# Indexes and Constraints

## Purpose
Document the database indexing and validation strategy expected for collaboration workloads.

## Recommended indexes
- unique index on users.email
- unique index on users.username
- index on rooms.ownerId
- index on room memberships by userId and roomId
- index on sessions.roomId and version
- index on elements.sessionId and updatedAt

## Constraints
- room membership must be validated before writes
- revisions should be monotonic per session
- duplicate operation IDs should be rejected or deduplicated

## Implementation status
Status: design-level guidance; no schema is yet created.

## Related
- [Database overview](database-overview.md)
- [Data retention and migrations](data-retention-and-migrations.md)
