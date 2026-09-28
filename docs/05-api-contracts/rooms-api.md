# Rooms API Contract

## Purpose
Document the expected room API contract.

## Implemented endpoints
All room routes require `Authorization: Bearer <token>`.

| Method and path | Behavior |
| --- | --- |
| `POST /api/rooms` | Create a room; accepts `name`, optional `description`, and optional `visibility`. |
| `GET /api/rooms?page=&limit=` | List visible rooms with pagination (limit is capped at 100). |
| `GET /api/rooms/:id` | Fetch a room and current session/snapshot. `:id` accepts a room ID or six-character code. |
| `POST /api/rooms/:id/join` | Add the authenticated user as a room member. |
| `PATCH /api/rooms/:id` | Update owner-controlled room fields. |
| `DELETE /api/rooms/:id` | Archive the room (soft delete); owner only. |
| `POST /api/rooms/:id/export?format=json|svg|png` | Download a room export; defaults to JSON. |
| `POST /api/rooms/:id/sync` | Submit an offline operation batch. |

The sync request accepts `operations` and `clientBaseVersion` in its JSON body. The service returns server version and applied/rejected operation details. Payload validation and access checks are defined by the route, controller, and service implementation.

## Validation expectations
- room names must be valid and non-empty
- membership checks must be enforced for protected room access
- invalid IDs return 404
- offline batch size cannot exceed configured operational limits

## Implementation status
Status: implemented in `backend/src/modules/rooms/rooms.routes.js`, `rooms.controller.js`, and `rooms.service.js`.

## Related
- [Room lifecycle](../03-backend/room-lifecycle.md)
- [Room and session schema](../06-data-design/room-and-session-schema.md)
- [Error codes](error-codes.md)
