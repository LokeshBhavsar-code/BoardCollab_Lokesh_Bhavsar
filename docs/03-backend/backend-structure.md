# Backend Structure

## Purpose
Document the backend modular-monolith structure and how its implemented modules are organized.

## Proposed structure
```text
backend/
├── src/
│   ├── config/
│   ├── modules/
│   ├── sockets/
│   ├── services/
│   ├── middleware/
│   ├── app.js
│   └── server.js
├── Dockerfile
└── package.json
```

## Current implementation evidence
The codebase currently contains:
- `src/app.js`: Express app with CORS and health endpoint
- `src/server.js`: HTTP server and Socket.IO bootstrap
- no route modules or data models yet

## Module boundaries
- config: environment and infrastructure connectors
- modules: feature-specific auth and room logic
- sockets: connection lifecycle and room-specific event handling
- services: cross-cutting persistence and export operations
- middleware: auth, validation, and error handling

## Principles
- keep feature modules independent
- keep service logic outside HTTP handlers
- isolate socket code from REST controller details
- prefer explicit data ownership per module

## Implementation status
Status: auth, room, service, model, middleware, and socket modules are implemented. Additional proposed boundaries in this document are organizational guidance, not separate deployed services.

## Related
- [Module responsibilities](module-responsibilities.md)
- [Authentication and authorization](authentication-and-authorization.md)
- [Backend architecture](../02-architecture/backend-architecture.md)
