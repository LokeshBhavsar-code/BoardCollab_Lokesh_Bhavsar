# Networking and Ports

## Purpose
Summarize internal and external network topology.

## Port layout
| Service | Internal name | Host port | Purpose |
| --- | --- | --- | --- |
| Frontend | `frontend` | `5173` | browser access |
| Backend | `backend` | `5000` | REST and socket API |
| MongoDB | `mongo` | `27017` | database service |
| Redis | `redis` | `6379` | cache and messaging |

## Access guidance
- browser calls should target the frontend host port for local dev
- backend services should use service names over container-local hostnames in Docker
- do not rely on `localhost` from inside a container to reach backend or database services

## Implementation status
Status: implemented in Compose and environment variables.

## Related
- [Docker compose services](docker-compose-services.md)
- [Environment configuration](environment-configuration.md)
- [Production deployment](production-deployment.md)
