# Production Deployment

## Purpose
Capture the major deployment concerns for moving BoardCollab beyond local Docker Compose.

## Requirements
- managed MongoDB and Redis instances
- private secrets management
- environment-specific config validation
- reverse proxy or load balancer for frontend and API
- health checks and safe rollout strategy

## Key risks
- direct exposure of internal DB or cache ports
- JWT secret leakage
- stale room or drawing payloads during rolling deploys

## Implementation status
Status: planned, not yet implemented.

## Related
- [Deployment architecture](../02-architecture/deployment-architecture.md)
- [Environment configuration](environment-configuration.md)
- [Security architecture](../10-security/security-architecture.md)
