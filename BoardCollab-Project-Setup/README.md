# BoardCollab

Real-time collaborative whiteboard built with the MERN stack. This repository is the initial project foundation; core collaboration features will be implemented incrementally.

## Stack

- Frontend: React, Vite, Konva, Redux Toolkit, Socket.IO client
- Backend: Node.js, Express, Socket.IO, Mongoose, JWT
- Data/infra: MongoDB, Redis, Docker Compose
- Tests: Node.js test runner initially; API/UI test suites will be expanded

## Repository layout

```text
BoardCollab/
├── backend/
│   ├── src/
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── docs/
│   ├── architecture.md
│   └── decisions.md
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Docker Desktop with Docker Compose
- Git

## Run locally

1. Copy `.env.example` to `.env`.
2. Change the local placeholder passwords/secrets in `.env`.
3. Start the stack:

   ```bash
   docker compose up --build
   ```

4. Open the frontend at http://localhost:5173.
5. Check the backend at http://localhost:5000/api/health.

Stop containers:

```bash
docker compose down
```

Remove containers **and local database/cache volumes** (destructive):

```bash
docker compose down -v
```

## Environment variables

See `.env.example`. Never commit `.env` or production secrets.

## Current status

- [x] Monorepo skeleton
- [x] Docker Compose for frontend, backend, MongoDB, and Redis
- [x] Express health endpoint and basic React landing page
- [ ] JWT registration/login and protected room access
- [ ] Canvas drawing tools and Socket.IO room synchronization
- [ ] Conflict resolution, per-user undo/redo, persistence batching
- [ ] Automated API/UI tests and performance benchmarks

## Documentation

- [Architecture](docs/architecture.md)
- [Architecture decisions](docs/decisions.md)
