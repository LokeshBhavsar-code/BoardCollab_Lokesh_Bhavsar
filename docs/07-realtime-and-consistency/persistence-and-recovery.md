# Persistence and Recovery

## Purpose
Detail the durable save strategy and recovery behavior after disconnect or restart.

## Durable data
- room metadata and session state in MongoDB
- transient cache and message transport data in Redis

## Recovery model
- on reconnect, client requests current room state or joins room snapshot
- server resolves pending or duplicate operations
- session version is used to compare local client state with server state
- stale client events are rejected if they are older than the current room version

## Failure behavior
- Redis restart should not erase durable mongo state
- backend restart should rebuild room state from the latest durable snapshot if necessary
- pending writes should be retried or idempotently applied

## Implementation status
Status: planned design only.

## Related
- [Persistence service](../03-backend/persistence-service.md)
- [Event lifecycle](event-lifecycle.md)
- [Backup and recovery](../12-operations/backup-and-recovery.md)
