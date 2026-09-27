# Authentication API Contract

## Purpose
Document the registration and login contract for BoardCollab.

## Planned endpoints
### POST /api/auth/register
- Purpose: create a new user account
- Auth required: no
- Request body:
```json
{
  "email": "user@example.com",
  "username": "boarduser",
  "password": "StrongPass123!"
}
```
- Response: `201 Created` with user summary and JWT token
- Errors: 400 validation, 409 duplicate user

### POST /api/auth/login
- Purpose: authenticate a registered user
- Auth required: no
- Request body:
```json
{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```
- Response: `200 OK` with JWT token and user metadata

## Implementation status
Status: planned, not implemented in the repo.

## Related
- [API overview](README.md)
- [Authentication and authorization](../03-backend/authentication-and-authorization.md)
- [Error codes](error-codes.md)
