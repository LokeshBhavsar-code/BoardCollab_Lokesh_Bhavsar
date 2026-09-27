# API Examples

## Purpose
Provide sample payloads for the planned API contract.

## Example: register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "boarduser",
  "password": "StrongPass123!"
}
```

## Example: room creation
```http
POST /api/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Sprint Planning",
  "description": "Roadmap session",
  "visibility": "private"
}
```

## Example: socket join
```json
{
  "roomId": "room_123",
  "token": "jwt-token"
}
```

## Implementation status
Status: examples are design references only.

## Related
- [Authentication API](authentication-api.md)
- [Rooms API](rooms-api.md)
- [Socket events](socket-events.md)
