# Security Architecture

## Purpose
Describe the expected baseline security controls and trust boundaries for BoardCollab.

## Trust boundaries
- browser users interact with the frontend over HTTPS in production
- backend validates requests and authorizes room actions
- MongoDB and Redis sit behind authenticated service access
- Docker network isolates service-to-service traffic in development

## Controls in place
- Docker Compose service credentials are defined in environment files
- CORS is configured in `app.js`
- the repo includes JWT secret values in environment config

## Planned controls
- room access enforcement
- password hashing
- input validation and rate limiting
- secure secret rotation and environment separation

## Implementation status
Status: partial foundation exists; full security controls remain planned.

## Related
- [Authentication security](authentication-security.md)
- [Authorization and room isolation](authorization-and-room-isolation.md)
- [Threat model](threat-model.md)
