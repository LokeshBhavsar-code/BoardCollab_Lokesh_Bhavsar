# Authentication Security

## Purpose
Document the expected security model for login and token handling.

## Planned controls
- password hashing before storage
- JWT signing with a secret configured in environment variables
- token expiration enforcement
- token refresh strategy after decision and if necessary

## Risks
- weak or leaked JWT secret
- no token rotation in production
- accepting invalid or expired tokens

## Implementation status
Status: environment variables exist; auth logic is not implemented.

## Related
- [Security architecture](security-architecture.md)
- [Authentication and authorization](../03-backend/authentication-and-authorization.md)
- [Secrets management](secrets-management.md)
