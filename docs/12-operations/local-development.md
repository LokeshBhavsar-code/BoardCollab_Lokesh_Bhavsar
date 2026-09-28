# Local Development

## Purpose
Explain how to bring the project up locally from the repository root.

## Setup steps
1. Copy `.env.example` to `.env` in the repository root.
2. Run `docker compose up --build` from the repository root.
3. Open `http://localhost:5173` and register a development account.
4. Check `http://localhost:5000/api/health` for API/database/cache status.

Run `npm test` for the workspace test suites and `npm run build` for the frontend production bundle. `npm run seed` inserts fixed development test accounts; use it only with a disposable local database.

## Current verified state
Compose is the supported full-stack local workflow. It mounts frontend/backend source for hot reload; MongoDB and Redis persist in named volumes.

## Implementation status
Status: local development is implemented. See the root README for shutdown, volume cleanup, workspace commands, and the production container template.

## Related
- [Developer onboarding](developer-onboarding.md)
- [Troubleshooting](troubleshooting.md)
- [Environment configuration](../08-infrastructure/environment-configuration.md)
