# BoardCollab Engineering Documentation

## Purpose
This documentation set describes the current BoardCollab implementation and separates verified behavior from proposed design, operational guidance, and known gaps. Feature status is based on code and tests in this repository; architectural target documents are not evidence that a feature is complete.

## Documentation status legend
- Implemented: present in the codebase and covered by relevant tests or runtime wiring.
- Partial: some behavior exists, with documented limits or missing production guarantees.
- Planned: a target design or future work not currently provided by the application.

## Overview
BoardCollab is a real-time collaborative whiteboard implemented as a modular monolith: a React/Vite frontend, Express API, Socket.IO collaboration layer, MongoDB persistence, and optional Redis-backed Socket.IO fan-out. Docker Compose provides local development; a separate production Compose file builds the app containers and expects external MongoDB and Redis services.

## Recommended reading order
1. Start with the overview and architecture set.
2. Review backend and frontend architecture documents.
3. Read the API and data model contracts.
4. Examine realtime and consistency design.
5. Review infrastructure, security, and operations.
6. Use the roadmap and status pages for delivery planning.

## Catalog

### 01 Overview
- [Project overview](01-overview/project-overview.md) — purpose, scope, and repository baseline.
- [Requirements and scope](01-overview/requirements-and-scope.md) — product capability expectations and constraints.
- [System context](01-overview/system-context.md) — actors, systems, and trust boundaries.
- [Glossary](01-overview/glossary.md) — domain terminology for boards, rooms, sessions, and collaboration.

### 02 Architecture
- [System architecture](02-architecture/system-architecture.md) — responsibilities, boundaries, and runtime relationships.
- [Architecture diagrams](02-architecture/architecture-diagrams.md) — Mermaid diagrams for runtime flow and deployment.
- [Backend architecture](02-architecture/backend-architecture.md) — modular monolith boundaries and backend layering.
- [Frontend architecture](02-architecture/frontend-architecture.md) — React, state, canvas, and sockets.
- [Real-time communication](02-architecture/real-time-communication.md) — Socket.IO responsibilities and event model.
- [Deployment architecture](02-architecture/deployment-architecture.md) — Docker compose and environment boundaries.
- [Architecture decisions](02-architecture/architecture-decisions.md) — ADR catalog and pending decisions.

### 03 Backend
- [Backend structure](03-backend/backend-structure.md) — proposed module layout for the modular monolith.
- [Module responsibilities](03-backend/module-responsibilities.md) — route, controller, service, model, and socket responsibilities.
- [Authentication and authorization](03-backend/authentication-and-authorization.md) — required auth model and security boundaries.
- [Room lifecycle](03-backend/room-lifecycle.md) — room creation, membership, and lifecycle expectations.
- [Collaboration service](03-backend/collaboration-service.md) — drawing and real-time collaboration responsibilities.
- [Persistence service](03-backend/persistence-service.md) — MongoDB save queue and session durability work.
- [Export service](03-backend/export-service.md) — implemented JSON/PNG/SVG export behavior.

### 04 Frontend
- [Frontend structure](04-frontend/frontend-structure.md) — feature-oriented app layout.
- [Component architecture](04-frontend/component-architecture.md) — key UI responsibilities and props/data ownership.
- [Canvas rendering](04-frontend/canvas-rendering.md) — Konva/Vite canvas rendering assumptions.
- [State management](04-frontend/state-management.md) — Redux, React state, and socket-driven state boundaries.
- [Socket client](04-frontend/socket-client.md) — client connection lifecycle and event handling.
- [Offline and reconnection](04-frontend/offline-and-reconnection.md) — resilience behavior and recovery patterns.

### 05 API Contracts
- [API overview](05-api-contracts/README.md) — contract conventions and status of implemented endpoints.
- [Authentication API](05-api-contracts/authentication-api.md) — register/login contract design.
- [Rooms API](05-api-contracts/rooms-api.md) — room CRUD and metadata endpoints.
- [Export API](05-api-contracts/export-api.md) — canvas export contract.
- [Socket events](05-api-contracts/socket-events.md) — event contract table and payload shapes.
- [Error codes](05-api-contracts/error-codes.md) — standard HTTP and socket error conventions.
- [API examples](05-api-contracts/api-examples.md) — sample requests and responses.

### 06 Data Design
- [Database overview](06-data-design/database-overview.md) — MongoDB schema strategy and collection boundaries.
- [Entity relationship diagram](06-data-design/entity-relationship-diagram.md) — ER model and usage.
- [User schema](06-data-design/user-schema.md) — account and profile document design.
- [Room and session schema](06-data-design/room-and-session-schema.md) — board space, membership, and session data.
- [Canvas element schema](06-data-design/canvas-element-schema.md) — drawing primitive model and validation.
- [Indexes and constraints](06-data-design/indexes-and-constraints.md) — query support and uniqueness guidance.
- [Data retention and migrations](06-data-design/data-retention-and-migrations.md) — retention policies and migration planning.

### 07 Real-time and Consistency
- [Event lifecycle](07-realtime-and-consistency/event-lifecycle.md) — drawing operation lifecycle from client to persistence.
- [Drawing synchronization](07-realtime-and-consistency/drawing-synchronization.md) — operation propagation and room state sync.
- [Conflict resolution](07-realtime-and-consistency/conflict-resolution.md) — OT vs CRDT evaluation and chosen strategy.
- [Undo redo design](07-realtime-and-consistency/undo-redo-design.md) — user-scoped history and recovery.
- [Ordering and idempotency](07-realtime-and-consistency/ordering-and-idempotency.md) — event sequencing and dedupe strategy.
- [Persistence and recovery](07-realtime-and-consistency/persistence-and-recovery.md) — durable save flow and replay after disconnect.

### 08 Infrastructure
- [Docker architecture](08-infrastructure/docker-architecture.md) — service boundaries and container roles.
- [Docker compose services](08-infrastructure/docker-compose-services.md) — runtime services and dependencies.
- [Environment configuration](08-infrastructure/environment-configuration.md) — variables and validation expectations.
- [Networking and ports](08-infrastructure/networking-and-ports.md) — service discovery and host-vs-container access.
- [Redis architecture](08-infrastructure/redis-architecture.md) — cache, session state, and pub/sub role.
- [MongoDB operations](08-infrastructure/mongodb-operations.md) — operational guidance for local and containerized MongoDB.
- [Production deployment](08-infrastructure/production-deployment.md) — production considerations and deployment constraints.

### 09 Scalability and Performance
- [Scalability strategy](09-scalability-and-performance/scalability-strategy.md) — horizontal scaling direction.
- [Socket scaling](09-scalability-and-performance/socket-scaling.md) — shared WebSocket fan-out and room distribution.
- [Database write optimization](09-scalability-and-performance/database-write-optimization.md) — write batching and queueing.
- [Frontend performance](09-scalability-and-performance/frontend-performance.md) — canvas rendering optimization and re-renders.
- [Capacity planning](09-scalability-and-performance/capacity-planning.md) — 50-100+ room concurrency targets.
- [Performance benchmarks](09-scalability-and-performance/performance-benchmarks.md) — target metrics and benchmarking plan.

### 10 Security
- [Security architecture](10-security/security-architecture.md) — trust boundaries and security controls.
- [Authentication security](10-security/authentication-security.md) — JWT and credential handling.
- [Authorization and room isolation](10-security/authorization-and-room-isolation.md) — member-only access and room-level controls.
- [Secrets management](10-security/secrets-management.md) — env configuration and secret handling.
- [Threat model](10-security/threat-model.md) — abuse cases and security risks.

### 11 Testing and Quality
- [Testing strategy](11-testing-and-quality/testing-strategy.md) — project-wide quality approach.
- [Backend testing](11-testing-and-quality/backend-testing.md) — Node.js test strategy.
- [Frontend testing](11-testing-and-quality/frontend-testing.md) — React test approach.
- [Socket integration testing](11-testing-and-quality/socket-integration-testing.md) — collaboration flow validation.
- [Concurrency testing](11-testing-and-quality/concurrency-testing.md) — multi-user event ordering assumptions.
- [Acceptance criteria](11-testing-and-quality/acceptance-criteria.md) — exit criteria for feature completion.

### 12 Operations
- [Local development](12-operations/local-development.md) — repository startup commands and workflows.
- [Developer onboarding](12-operations/developer-onboarding.md) — setup and expectations for new contributors.
- [Troubleshooting](12-operations/troubleshooting.md) — common issues and diagnostic steps.
- [Logging and monitoring](12-operations/logging-and-monitoring.md) — service logs and operational observability.
- [Backup and recovery](12-operations/backup-and-recovery.md) — persistence restore and disaster recovery plan.
- [Incident response](12-operations/incident-response.md) — outage and severe issue handling.

### 13 Project Management
- [Implementation roadmap](13-project-management/implementation-roadmap.md) — phased delivery plan.
- [Feature status](13-project-management/feature-status.md) — implemented vs planned status registry.
- [Known limitations](13-project-management/known-limitations.md) — current repository constraints.
- [Technical debt](13-project-management/technical-debt.md) — architecture risks and refactoring backlog.

## Audience-specific navigation
- Backend engineers: start with [system architecture](02-architecture/system-architecture.md), [backend architecture](02-architecture/backend-architecture.md), [backend structure](03-backend/backend-structure.md), and [data design](06-data-design/database-overview.md).
- Frontend engineers: start with [frontend architecture](02-architecture/frontend-architecture.md), [frontend structure](04-frontend/frontend-structure.md), [canvas rendering](04-frontend/canvas-rendering.md), and [socket client](04-frontend/socket-client.md).
- DevOps and infrastructure: review [deployment architecture](02-architecture/deployment-architecture.md), [docker architecture](08-infrastructure/docker-architecture.md), and [environment configuration](08-infrastructure/environment-configuration.md).
- QA and test engineers: begin with [testing strategy](11-testing-and-quality/testing-strategy.md), [socket integration testing](11-testing-and-quality/socket-integration-testing.md), and [acceptance criteria](11-testing-and-quality/acceptance-criteria.md).
- New developers: begin with [local development](12-operations/local-development.md), [developer onboarding](12-operations/developer-onboarding.md), and [feature status](13-project-management/feature-status.md).

## Current implementation baseline

Implemented code includes:
- Registration, login, JWT-protected HTTP routes, request validation, rate limiting, and room ownership/member checks.
- Room creation, listing, joining, metadata updates, archival, and export/offline-sync endpoints.
- Konva canvas UI, Redux state, authenticated Socket.IO connections, room presence, drawing updates, version conflict rejection, and user-scoped undo/redo.
- IndexedDB caching and pending-operation replay support in the frontend.
- MongoDB models and batched element persistence; Redis connection and Socket.IO adapter with an in-memory fallback.
- SVG/PNG export services and client/server shape-recognition code.
- Docker development and production image configurations, plus Node test suites.

Important limits remain: Redis is optional and in-memory fallback supports only one backend process; production MongoDB/Redis, TLS, secrets, backups, and deployment operations are external responsibilities; frontend automated tests are not currently present. Read [known limitations](13-project-management/known-limitations.md) and individual design documents for finer status distinctions.

## Related repository files
- [README](../README.md)
- [docker-compose.yml](../docker-compose.yml)
- [docker-compose.prod.yml](../docker-compose.prod.yml)
- [backend/package.json](../backend/package.json)
- [frontend/package.json](../frontend/package.json)
- [.env.example](../.env.example)
