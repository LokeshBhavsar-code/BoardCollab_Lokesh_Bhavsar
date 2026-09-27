# Data Retention and Migrations

## Purpose
Define expected data lifecycle and schema migration practices.

## Retention policy
- active room and session data should persist while a room remains active
- retired rooms should be archived or deleted based on product policy
- audit or undo history should be time-bounded to prevent unbounded growth

## Migration approach
- use explicit schema versioning for room and session records
- keep migration scripts idempotent and testable
- preserve compatibility for older client versions during rollout

## Implementation status
Status: planned design only.

## Related
- [Indexes and constraints](indexes-and-constraints.md)
- [Persistence and recovery](../07-realtime-and-consistency/persistence-and-recovery.md)
- [Production deployment](../08-infrastructure/production-deployment.md)
