# Environment Configuration

## Purpose
Document expected environment variables and how configuration should be managed.

## Variables
| Name | Purpose | Required | Example |
| --- | --- | --- | --- |
| `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD` | Local Compose MongoDB root credentials | required by local Compose | development-only values in `.env.example` |
| `MONGO_DATABASE` | Local database name | used by Compose and backend defaults | `boardcollab` |
| `MONGO_HOST`, `MONGO_PORT` | MongoDB host/port | optional; defaults to `localhost:27017` for host-run backend | `mongo`, `27017` in Compose |
| `MONGODB_URI` | Full MongoDB connection string | required by production Compose | deployment secret |
| `REDIS_PASSWORD`, `REDIS_HOST`, `REDIS_PORT` | Local Redis credentials and address | required by local Compose | development-only values in `.env.example` |
| `REDIS_URL` | Full Redis connection string | required by production Compose; optional otherwise | deployment secret |
| `JWT_SECRET` | JWT signing secret | required by production startup; development has a fallback | use a unique high-entropy value |
| `JWT_EXPIRES_IN` | JWT validity lifetime | optional; defaults to `7d` | `7d` |
| `NODE_ENV` | runtime environment | optional; Compose defaults to `development` | `production` |
| `BACKEND_PORT`, `FRONTEND_PORT` | local published ports | optional | `5000`, `5173` |
| `CLIENT_ORIGIN` | allowed browser origin(s), comma-separated if needed | optional for development; required by production Compose | `http://localhost:5173` |
| `VITE_API_URL` | public API base URL, including `/api` | optional in development; required at production build | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | public Socket.IO origin | optional in development; required at production build | `http://localhost:5000` |
| `PUBLIC_HTTP_PORT` | production frontend loopback port | optional | `8080` |
| `VITE_ENABLE_SW` | disable service worker only when set to `false` | optional | `true` |

Optional backend controls (defaults are supplied in `backend/src/config/env.js`): `ROOM_MAX_ELEMENTS` (10,000), `STROKE_MAX_POINTS` (5,000), `COLLAB_UNDO_LIMIT` (50), `PERSISTENCE_FLUSH_INTERVAL_MS` (500 ms), `PERSISTENCE_BATCH_LIMIT` (100), `OFFLINE_SYNC_BATCH_LIMIT` (1,000), `AI_CONFIDENCE_THRESHOLD` (0.70), and `LOG_LEVEL` (`info`).

Backend `backend/src/config/env.js` validates `JWT_SECRET`: it throws in production and logs a warning in development. Other connection settings have defaults or fail when the service connection is attempted. Production Compose requires the database/cache URLs, CORS origin, JWT secret, and frontend build URLs at configuration time. The browser shape recognizer uses its own 0.70 confidence constant; `AI_CONFIDENCE_THRESHOLD` configures the backend recognizer.

Never store production secrets in version control. `VITE_*` variables are embedded in public browser assets and must not contain secrets.

## Implementation status
Status: development values are documented in [.env.example](../../.env.example); backend JWT validation and production Compose required-variable checks are implemented.

## Related
- [Docker architecture](docker-architecture.md)
- [Secrets management](../10-security/secrets-management.md)
- [Developer onboarding](../12-operations/developer-onboarding.md)
