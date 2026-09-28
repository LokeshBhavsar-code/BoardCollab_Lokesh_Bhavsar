# Backend Testing

## Purpose
Document backend test expectations for Express, services, and socket access control.

## Test types
- route/contract tests
- service business logic tests
- model validation tests
- auth middleware assertions
- queue and persistence logic tests

## Implementation status
Status: a Node test suite exists under `backend/tests`, currently 69 tests covering auth, collaboration, export security/output, health, OT/version conflicts and canvas clearing, persistence, rooms, shape recognition, socket security, and request validation. Run it with `npm run test:backend` from the repository root.

## Related
- [Testing strategy](testing-strategy.md)
- [Module responsibilities](../03-backend/module-responsibilities.md)
- [Authentication API](../05-api-contracts/authentication-api.md)
