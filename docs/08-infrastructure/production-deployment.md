# Production Deployment

## Purpose
Capture the major deployment concerns for moving BoardCollab beyond local Docker Compose.

## Requirements
- managed MongoDB and Redis instances
- private secrets management
- environment-specific config validation
- reverse proxy or load balancer for frontend and API
- health checks and safe rollout strategy

## Repository deployment template
The `docker-compose.prod.yml` file builds the backend `production` target and the static Nginx frontend. It requires `MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`, `VITE_API_URL`, and `VITE_SOCKET_URL` to be supplied through the environment or a protected, untracked env file. MongoDB and Redis are external to this Compose file. App ports bind to `127.0.0.1` by default so a host reverse proxy can terminate TLS.

```sh
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

Frontend API and socket URLs are build-time values. Rebuild the frontend image when they change. Do not use `.env.example` credentials, seed data, or the development Compose file in production.

## Key risks
- direct exposure of internal DB or cache ports
- JWT secret leakage
- stale room or drawing payloads during rolling deploys

## Implementation status
Status: production app images and a Compose template are implemented; secure infrastructure provisioning and operational readiness are not supplied by this repository.

## Related
- [Deployment architecture](../02-architecture/deployment-architecture.md)
- [Environment configuration](environment-configuration.md)
- [Security architecture](../10-security/security-architecture.md)
