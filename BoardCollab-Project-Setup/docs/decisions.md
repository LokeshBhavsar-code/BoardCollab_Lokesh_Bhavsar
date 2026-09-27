# Architecture Decision Records

## ADR-001: Monorepo
**Decision:** Keep frontend, backend, infrastructure, tests, and docs in one repository.  
**Reason:** Simplifies local setup and keeps API/client changes coordinated.

## ADR-002: MERN with Socket.IO
**Decision:** React, Node.js/Express, MongoDB, and Socket.IO.  
**Reason:** Matches the assignment's mandatory stack and real-time collaboration workflow.

## ADR-003: Docker Compose for local development
**Decision:** Use Compose to run frontend, backend, MongoDB, and Redis locally.  
**Reason:** Reproducible developer environment. Production deployment configuration will be handled separately.
