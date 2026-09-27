# Backup and Recovery

## Purpose
Define a baseline backup and restore strategy for durable board state.

## Durable data
- MongoDB stores room state and board metadata
- Redis carries transient cache state and message transport data

## Baseline plan
- back up MongoDB data on a schedule
- verify restores in a non-production environment
- preserve room snapshot metadata for recovery processing
- treat Redis as ephemeral and rebuildable from MongoDB state if needed

## Implementation status
Status: planned design only.

## Related
- [Persistence and recovery](../07-realtime-and-consistency/persistence-and-recovery.md)
- [MongoDB operations](../08-infrastructure/mongodb-operations.md)
- [Incident response](incident-response.md)
