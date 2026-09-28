# Testing Strategy

## Purpose
Define a testing strategy aligned to a collaborative real-time system.

## Current and planned layers
- unit tests for auth and room logic
- API integration tests for HTTP contract validation
- frontend component tests for UI logic and form validation
- socket integration tests for room join and draw events
- concurrency tests for duplicate or out-of-order event handling
- recovery tests for reconnect and replay scenarios

## Coverage target
A practical target for this project is approximately 70% coverage across the backend and service logic, but this should be validated with actual test runs before being claimed.

## Implementation status
Status: Node's built-in test runner currently discovers 69 backend tests covering auth, collaboration, export, health, persistence, rooms, recognition, socket security, and validation. The frontend test command currently discovers zero tests. Browser-level and load/concurrency testing remain follow-up work. Run all current suites with `npm test` from the repository root.

## Related
- [Backend testing](backend-testing.md)
- [Frontend testing](frontend-testing.md)
- [Socket integration testing](socket-integration-testing.md)
