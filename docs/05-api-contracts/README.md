# API Contracts Overview

## Purpose
Describe the HTTP and socket contract conventions in a single place.

## Contract status
- Implemented: `GET /api/health`
- Planned: registration, login, room endpoints, exports, and collaboration events

## HTTP API conventions
- base path prefix: `/api`
- JSON request and response bodies
- standard HTTP status codes
- JWT in `Authorization: Bearer <token>` for protected endpoints
- authentication and authorization failures return 401/403

## Socket conventions
- events are namespaced by room or user context
- payloads are validated before state mutation
- failure responses are surfaced through acknowledgments or emits with a reason code

## Related
- [Authentication API](authentication-api.md)
- [Rooms API](rooms-api.md)
- [Socket events](socket-events.md)
