# Developer Onboarding

## Purpose
Enable a new developer to start working on BoardCollab without needing extra tribal knowledge.

## Prerequisites
- Docker Desktop or Docker Engine
- Git
- Node.js 22 or newer and npm 10+ for host workspace commands (Docker can run the app without a host Node install)

## Setup checklist
- clone the repository and change to its root directory
- copy `.env.example` to `.env`
- start the stack with `docker compose up --build`
- open `http://localhost:5173` and register an account
- run `npm test` before submitting changes

## Implementation status
Status: see the repository root [README](../../README.md) for the complete clone, setup, development, testing, and deployment steps.

## Related
- [Local development](local-development.md)
- [Troubleshooting](troubleshooting.md)
- [Implementation roadmap](../13-project-management/implementation-roadmap.md)
