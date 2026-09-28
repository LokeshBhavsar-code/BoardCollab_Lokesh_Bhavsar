# Redis Architecture

## Purpose
Describe Redis responsibilities and its role in the BoardCollab runtime.

## Current responsibilities
- provide Socket.IO pub/sub fan-out across backend instances through `@socket.io/redis-adapter`
- authenticate Redis connections using `REDIS_URL` or the host/port/password settings
- fall back to Socket.IO's in-process adapter when Redis is unavailable

## Important note
Redis is not the durable source of truth. MongoDB remains authoritative for room and board data.

## Implementation status
Status: Redis connectivity and the Socket.IO adapter are implemented. Redis is not currently used as a general room-state cache or durable store; fallback mode is single-process only.

## Related
- [Docker compose services](docker-compose-services.md)
- [Socket scaling](../09-scalability-and-performance/socket-scaling.md)
- [Database overview](../06-data-design/database-overview.md)
