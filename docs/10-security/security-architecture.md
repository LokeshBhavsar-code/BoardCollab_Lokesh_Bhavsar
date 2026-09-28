# Security Architecture

## Purpose
Describe the expected baseline security controls and trust boundaries for BoardCollab.

## Trust boundaries
- browser users interact with the frontend over HTTPS in production
- backend validates requests and authorizes room actions
- MongoDB and Redis sit behind authenticated service access
- Docker network isolates service-to-service traffic in development

## Controls in place
- Helmet security headers, CORS, JSON size limits, request validation, and global/auth rate limits are configured in the Express app/routes
- bcrypt password hashes and JWT authentication protect HTTP and Socket.IO access
- room and canvas actions apply access/role checks
- MongoDB and Redis local credentials are supplied through the untracked environment file

## Remaining controls
- production secret provisioning/rotation, TLS, data-service network policy, backups, and incident response are operator responsibilities
- security tests cover selected API and socket boundaries; a full threat-model validation is still needed

## Implementation status
Status: core application security controls are implemented; production infrastructure and operational controls remain external requirements.

## Related
- [Authentication security](authentication-security.md)
- [Authorization and room isolation](authorization-and-room-isolation.md)
- [Threat model](threat-model.md)
