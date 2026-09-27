# Docker Compose Services

## Purpose
Summarize the Compose services and their roles.

## Service definitions
| Service | Image / Build | Role | Port mapping |
| --- | --- | --- | --- |
| mongo | `mongo:7` | durable document store | 27017 |
| redis | `redis:7-alpine` | cache and pub/sub | 6379 |
| backend | local Dockerfile | Express API and socket server | 5000 |
| frontend | local Dockerfile | React + Vite client | 5173 |

## Dependencies
- backend depends on mongo and redis health checks
- frontend depends on backend startup

## Implementation status
Status: implemented based on repository config.

## Related
- [Docker architecture](docker-architecture.md)
- [Networking and ports](networking-and-ports.md)
- [Deployment architecture](../02-architecture/deployment-architecture.md)
