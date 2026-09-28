# MongoDB Operations

## Purpose
Define baseline operational guidance for MongoDB in local and deployed environments.

## Local operations
- confirm the service is healthy with `mongosh` or a database client
- inspect database names and collections after room logic is implemented
- validate read/write latency under load before production deployment

## Production notes
- enable backup and access restrictions
- rotate credentials and secure admin access
- keep MongoDB behind a private network or managed service boundary

## Implementation status
Status: Mongoose schemas and indexes are implemented; backup/restore, migration, and production maintenance tooling remain operator responsibilities.

## Related
- [Database overview](../06-data-design/database-overview.md)
- [Production deployment](production-deployment.md)
- [Backup and recovery](../12-operations/backup-and-recovery.md)
