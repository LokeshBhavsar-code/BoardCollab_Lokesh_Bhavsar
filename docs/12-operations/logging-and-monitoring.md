# Logging and Monitoring

## Purpose
Define the expected operational observability baseline for BoardCollab.

## Current state
The repository does not yet include a formal monitoring stack or centralized logs.

## Planned practices
- emit structured backend logs for requests, auth failures, and socket disconnects
- capture container logs through Docker Compose
- track rate of room joins, failed auth, and drawing operations
- monitor MongoDB and Redis health checks for service degradation

## Implementation status
Status: planned.

## Related
- [Troubleshooting](troubleshooting.md)
- [Incident response](incident-response.md)
