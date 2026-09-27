# Troubleshooting

## Purpose
Capture common operational problems and likely resolution paths.

## Common issues
- backend not starting: check env file and port conflicts
- frontend cannot reach the API: verify `VITE_API_URL` and backend status
- MongoDB unhealthy: review credentials and startup order
- Redis unhealthy: verify password and append-only configuration

## Diagnostic commands
- `docker compose ps`
- `docker compose logs backend`
- `docker compose logs mongo`
- `docker compose logs redis`

## Implementation status
Status: troubleshooting guide is intentionally conservative and grounded in current repo behavior.

## Related
- [Logging and monitoring](logging-and-monitoring.md)
- [Incident response](incident-response.md)
- [Local development](local-development.md)
