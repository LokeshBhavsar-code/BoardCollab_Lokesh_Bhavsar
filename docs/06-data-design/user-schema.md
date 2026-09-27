# User Schema

## Purpose
Describe the logical structure of the primary user document.

## Proposed fields
- `id`: ObjectId or string identifier
- `email`: unique login key
- `username`: unique display name
- `passwordHash`: hash of password
- `createdAt`: created timestamp
- `updatedAt`: last modification timestamp
- `lastSeenAt`: presence tracking

## Constraints
- unique email and username
- password hash never stored in plain text
- timestamps required

## Example document
```json
{
  "_id": "user_123",
  "email": "user@example.com",
  "username": "boarduser",
  "passwordHash": "$2a$10$...",
  "createdAt": "2026-09-27T00:00:00Z",
  "updatedAt": "2026-09-27T00:00:00Z"
}
```

## Implementation status
Status: planned design only.

## Related
- [Database overview](database-overview.md)
- [Room and session schema](room-and-session-schema.md)
- [Authentication security](../10-security/authentication-security.md)
