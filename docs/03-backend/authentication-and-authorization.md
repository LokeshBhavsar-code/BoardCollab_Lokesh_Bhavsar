# Authentication and Authorization

## Purpose
Describe the required auth design for BoardCollab and identify the current implementation gap.

## Current evidence
The repo includes JWT secret and expiration env variables in [.env.example](../../.env.example), but no authentication implementation exists yet.

## Planned design
- register a new user with email or username and password
- validate password hashing using bcrypt or equivalent
- issue JWT access token after successful authentication
- attach auth data to HTTP and websocket requests
- enforce room membership for collaborative actions

## Authorization model
- any authenticated user may create a room or join an allowed room
- only room owners or authorized members may manage room settings
- drawing events require membership and valid session context

## Security considerations
- do not trust client-provided room IDs without verification
- token validation must occur before socket join authorization
- reject malformed payloads before business logic execution

## Implementation status
Status: planned design, not implemented.

## Related
- [Backend structure](backend-structure.md)
- [Security architecture](../10-security/security-architecture.md)
- [Authentication API](../05-api-contracts/authentication-api.md)
