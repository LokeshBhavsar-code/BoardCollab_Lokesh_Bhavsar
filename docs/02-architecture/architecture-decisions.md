# Architecture Decisions

## Purpose
Record the major design directions for the project and the current implementation status.

## ADR index
- ADR-001: Use modular monolith for backend organization.
- ADR-002: Use React + Vite for frontend UI.
- ADR-003: Use Socket.IO for real-time collaboration.
- ADR-004: Use MongoDB + Redis as the data and cache layer.
- ADR-005: Use Docker Compose for local development orchestration.
- ADR-006: Use Konva with React Konva for canvas rendering (implemented).
- ADR-007: Use server room versions to reject stale drawing writes; this is not a full OT or CRDT implementation.

## Status
The repository implements the listed framework and runtime choices. Production capacity, deployment topology, and whether conflict handling needs a stronger OT/CRDT model remain open decisions.

## Related
- [System architecture](system-architecture.md)
- [Deployment architecture](deployment-architecture.md)
- [Scalability strategy](../09-scalability-and-performance/scalability-strategy.md)
