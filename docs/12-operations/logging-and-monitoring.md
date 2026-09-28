# Logging and Monitoring

## Purpose
Define the expected operational observability baseline for BoardCollab.

## Current state
Backend services use `backend/src/utils/logger.js` for level-filtered logs (key/value-style development output and JSON production output). Docker Compose exposes container logs and MongoDB/Redis health checks. There is no formal metrics, tracing, alerting, or centralized logging stack.

## Follow-up practices
- add request/socket metrics, tracing, alerts, and centralized retention
- capture container logs through Docker Compose during local development
- monitor API health and MongoDB/Redis health for service degradation

## Implementation status
Status: basic service logging and local health checks are implemented; production observability is not.

## Related
- [Troubleshooting](troubleshooting.md)
- [Incident response](incident-response.md)
