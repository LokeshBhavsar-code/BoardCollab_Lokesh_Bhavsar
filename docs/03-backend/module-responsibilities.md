# Module Responsibilities

## Responsibility map
### `app.js`
Responsible for middleware setup, request parsing, and route mounting.

### `server.js`
Responsible for HTTP server creation, Socket.IO initialization, and process startup.

### `config/`
Responsible for environment variables and external connection configuration.

### `modules/auth/`
Responsible for user identity, registration/login, token issuance, and user lookup.

### `modules/rooms/`
Responsible for room creation, membership updates, and board metadata operations.

### `sockets/handlers/`
Responsible for room join, leave, drawing sync, history, and telemetry flows.

### `services/`
Responsible for export generation and durable persistence orchestration.

### `middleware/`
Responsible for authentication, request validation, and centralized failures.

## Public interfaces
- HTTP routes expose request/response contracts
- service classes or modules expose domain-level operations
- socket handlers expose event names and validation rules

## Testing boundaries
- route tests validate HTTP contracts
- service tests validate business logic
- socket tests validate event ordering and room authorization
- model tests validate schema constraints and field-level behavior

## Implementation status
Status: not yet implemented as a full module layout.

## Related
- [Backend structure](backend-structure.md)
- [Backend architecture](../02-architecture/backend-architecture.md)
- [Authentication and authorization](authentication-and-authorization.md)
