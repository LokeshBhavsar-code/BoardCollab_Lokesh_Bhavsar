# Persistence Service

## Purpose
Define how board and session state transitions are stored durably.

## Responsibilities
- flush room state snapshots after a batch of operations
- store durable canvas data in MongoDB
- record version metadata and operation references
- support recovery after reconnect or server restart
- expose write queue behavior and retries

## Design constraints
- Redis is for transient data and should not be treated as durable state
- MongoDB is the durable source of truth
- persistence should avoid full-document rewrites for every tiny operation in a high-frequency drawing session

## Implementation status
Status: an in-memory batched write queue persists canvas elements through the MongoDB model and retries failed batches. MongoDB is the durable store; the queue itself is not durable across process loss before flush.

## Related
- [Persistence and recovery](../07-realtime-and-consistency/persistence-and-recovery.md)
- [Database overview](../06-data-design/database-overview.md)
- [MongoDB operations](../08-infrastructure/mongodb-operations.md)
