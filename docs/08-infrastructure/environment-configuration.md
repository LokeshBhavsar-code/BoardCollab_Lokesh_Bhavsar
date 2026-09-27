# Environment Configuration

## Purpose
Document expected environment variables and how configuration should be managed.

## Variables
| Name | Purpose | Required | Example |
| --- | --- | --- | --- |
| `MONGO_ROOT_USERNAME` | MongoDB admin user | yes | `boardcollab` |
| `MONGO_ROOT_PASSWORD` | MongoDB admin password | yes | `change_me_local_only` |
| `MONGO_DATABASE` | database name | yes | `boardcollab` |
| `REDIS_PASSWORD` | Redis password | yes | `change_me_redis_local` |
| `JWT_SECRET` | signing secret | yes | `replace_with_a_long_random_secret` |
| `JWT_EXPIRES_IN` | JWT validity lifetime | yes | `1d` |
| `BACKEND_PORT` | backend port | yes | `5000` |
| `FRONTEND_PORT` | frontend port | yes | `5173` |
| `CLIENT_ORIGIN` | allowed CORS origin | yes | `http://localhost:5173` |
| `VITE_API_URL` | frontend API endpoint | yes | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | frontend socket endpoint | yes | `http://localhost:5000` |

## Validation expectations
- all required variables should be validated at startup
- production deployments must never store secrets in version control

## Implementation status
Status: variable definitions exist in [.env.example](../../.env.example); validation logic is not yet implemented.

## Related
- [Docker architecture](docker-architecture.md)
- [Secrets management](../10-security/secrets-management.md)
- [Developer onboarding](../12-operations/developer-onboarding.md)
