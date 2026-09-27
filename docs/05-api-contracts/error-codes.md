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
- emit a structured `error` or `room:error` event with `code` and `message`
- include `retryable` flag when appropriate
- keep client-visible errors human-readable and safe for UI rendering

## Implementation status
Status: design-level contract only.

## Related
- [Authentication API](authentication-api.md)
- [Rooms API](rooms-api.md)
- [Socket events](socket-events.md)
