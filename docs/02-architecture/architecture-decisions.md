# Architecture Decisions

## Purpose
Record the major design directions for the project and the current implementation status.

## ADR index
- ADR-001: Use modular monolith for backend organization.
- ADR-002: Use React + Vite for frontend UI.
- ADR-003: Use Socket.IO for real-time collaboration.
- ADR-004: Use MongoDB + Redis as the data and cache layer.
- ADR-005: Use Docker Compose for local development orchestration.
- ADR-006: Select Konva or Fabric for canvas rendering. Decision pending.
- ADR-007: Define event ordering and conflict resolution strategy. Pending.

## Status
The repository implements the base runtime service composition, but several architecture decisions remain pending.

## Related
- [System architecture](system-architecture.md)
- [Deployment architecture](deployment-architecture.md)
- [Scalability strategy](../09-scalability-and-performance/scalability-strategy.md)
