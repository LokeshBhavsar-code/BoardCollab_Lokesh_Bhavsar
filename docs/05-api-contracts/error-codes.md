# Error Codes

## Purpose
Define common API and socket error semantics.

## HTTP status codes
- 400: malformed request or validation failure
- 401: missing or invalid authentication
- 403: authenticated user not allowed in room or action
- 404: resource not found
- 409: duplicate user or conflicting state
- 429: rate limit exceeded
- 500: server-side failure

## Socket error conventions
- errors use `{ code, message }` and are emitted as `room:error` for most handler failures
- callback acknowledgements, when supplied, return `{ error }`; successful mutations return `{ success: true, ... }`
- generic internal socket errors are masked; known application errors may be forwarded

## Implementation status
Status: centralized HTTP error handling and socket error shaping are implemented. This page lists common semantics, not an exhaustive error-code registry.

## Related
- [Authentication API](authentication-api.md)
- [Rooms API](rooms-api.md)
- [Socket events](socket-events.md)
