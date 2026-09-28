# Docker Compose Services

## Purpose
Summarize the Compose services and their roles.

## Service definitions
| Service | Image / Build | Role | Port mapping |
| --- | --- | --- | --- |
| mongo | `mongo:7` | durable document store | 27017 |
| redis | `redis:7-alpine` | cache and pub/sub | 6379 |
| backend | `backend/Dockerfile`, development target | Express API and Socket.IO server | 5000 |
| frontend | `frontend/Dockerfile`, development target | React + Vite development server | 5173 |

## Dependencies
- backend depends on mongo and redis health checks
- frontend waits for backend health

## Implementation status
Status: this file describes local development. Production app containers use `docker-compose.prod.yml`, external MongoDB/Redis URLs, a static Nginx frontend, and no source mounts.

## Related
- [Docker architecture](docker-architecture.md)
- [Networking and ports](networking-and-ports.md)
- [Deployment architecture](../02-architecture/deployment-architecture.md)
