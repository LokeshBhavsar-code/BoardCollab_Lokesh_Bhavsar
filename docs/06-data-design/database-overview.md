# Database Overview

## Purpose
Document the durable data model and the division between MongoDB and Redis.

## Durable source of truth
MongoDB is intended to store:
- user records
- room metadata
- sessions
- canvas elements
- operation logs or versioned history
- persistence metadata

## Transient storage
Redis is intended to store:
- connection/session cache
- pub/sub messages for socket fan-out
- temporary throttling or rate-limit keys
- ephemeral join or token cache

## Collection strategy
A reasonable initial strategy is:
- users collection
- rooms collection
- sessions collection
- elements collection or embedded array if usage remains small

## Design note
For a board with 5,000-10,000 elements, the recommended direction is to isolate large canvas element sets into their own collection or a dedicated session document with careful page size management.

## Implementation status
Status: planned design; no schema models exist yet.

## Related
- [Entity relationship diagram](entity-relationship-diagram.md)
- [Room and session schema](room-and-session-schema.md)
- [MongoDB operations](../08-infrastructure/mongodb-operations.md)
