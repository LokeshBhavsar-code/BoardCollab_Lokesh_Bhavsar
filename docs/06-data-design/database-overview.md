# Database Overview

## Purpose
Document the durable data model and the division between MongoDB and Redis.

## Durable source of truth
MongoDB currently stores:
- user records
- room metadata
- sessions
- canvas elements

## Transient storage
Redis currently provides Socket.IO pub/sub fan-out when configured. It is not the durable room-state store and is not currently used as a general session cache or rate-limit store.

## Collection strategy
The implemented collections are:
- users collection
- rooms collection
- sessions collection
- elements collection keyed by room, session, and element ID

## Design note
For a board with 5,000-10,000 elements, the recommended direction is to isolate large canvas element sets into their own collection or a dedicated session document with careful page size management.

## Implementation status
Status: user, room, session, and canvas-element Mongoose models and indexes are implemented. Operation logs, migrations, and deployment data lifecycle tooling are not.

## Related
- [Entity relationship diagram](entity-relationship-diagram.md)
- [Room and session schema](room-and-session-schema.md)
- [MongoDB operations](../08-infrastructure/mongodb-operations.md)
