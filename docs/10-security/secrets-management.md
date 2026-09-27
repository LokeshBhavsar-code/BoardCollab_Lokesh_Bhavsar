# Secrets Management

## Purpose
Explain how secrets should be handled in development, testing, and production.

## Current evidence
Environment variables are declared in [.env.example](../../.env.example), and Docker Compose uses them for service config.

## Required practices
- never commit `.env` to source control
- store production secrets in a managed secret store
- rotate JWT and database credentials regularly
- validate environment requirements at startup

## Implementation status
Status: baseline config exists; full secret management is a deployment requirement.

## Related
- [Environment configuration](../08-infrastructure/environment-configuration.md)
- [Authentication security](authentication-security.md)
- [Production deployment](../08-infrastructure/production-deployment.md)
