# Authentication Security

## Purpose
Document the expected security model for login and token handling.

## Implemented controls
- password hashing before storage
- JWT signing with a secret configured in environment variables
- token expiration enforcement

## Remaining work
- token refresh/rotation strategy if required
- production secret provisioning and rotation

## Risks
- weak or leaked JWT secret
- no token rotation in production
- accepting invalid or expired tokens

## Implementation status
Status: bcrypt password hashing and expiring JWT validation are implemented. There is no refresh-token flow; production secret management remains external.

## Related
- [Security architecture](security-architecture.md)
- [Authentication and authorization](../03-backend/authentication-and-authorization.md)
- [Secrets management](secrets-management.md)
