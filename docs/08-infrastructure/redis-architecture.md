# Redis Architecture

## Purpose
Describe Redis responsibilities and its role in the BoardCollab runtime.

## Planned responsibilities
- store ephemeral room/session metadata cache
- support pub/sub for multi-instance broadcast fan-out
- store rate-limit counters or reconnect data
- provide low-latency lookups for active collaboration state

## Important note
Redis is not the durable source of truth. MongoDB remains authoritative for room and board data.

## Implementation status
Status: infrastructure provisioned in Docker Compose; business use is not yet implemented.

## Related
- [Docker compose services](docker-compose-services.md)
- [Socket scaling](../09-scalability-and-performance/socket-scaling.md)
- [Database overview](../06-data-design/database-overview.md)
