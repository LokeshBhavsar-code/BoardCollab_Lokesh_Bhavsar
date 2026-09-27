# Local Development

## Purpose
Explain how to bring the project up locally from the repository root.

## Setup steps
1. copy `.env.example` to `.env` and review values
2. run `docker compose up --build`
3. open the frontend at http://localhost:5173
4. check the backend health endpoint at http://localhost:5000/api/health

## Current verified state
The repo includes a working health endpoint and Docker service configuration, but not a complete app feature set.

## Implementation status
Status: local environment is configured and bootstrapped; collaborative features remain planned.

## Related
- [Developer onboarding](developer-onboarding.md)
- [Troubleshooting](troubleshooting.md)
- [Environment configuration](../08-infrastructure/environment-configuration.md)
