# Rooms API Contract

## Purpose
Document the expected room API contract.

## Planned endpoints
### POST /api/rooms
- Purpose: create a new collaboration room
- Auth required: yes
- Request body: { name, description, visibility }
- Response: room metadata and initial session information

### GET /api/rooms/:id
- Purpose: fetch room details and current membership
- Auth required: yes
- Path parameters: `id`
- Response: room record and session snapshot metadata

## Validation expectations
- room names must be valid and non-empty
- membership checks must be enforced for protected room access
- invalid IDs return 404

## Implementation status
Status: planned, not implemented.

## Related
- [Room lifecycle](../03-backend/room-lifecycle.md)
- [Room and session schema](../06-data-design/room-and-session-schema.md)
- [Error codes](error-codes.md)
