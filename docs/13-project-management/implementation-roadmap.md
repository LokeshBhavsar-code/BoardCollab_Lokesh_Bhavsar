# Implementation Roadmap

## Purpose
Outline a staged delivery plan for the BoardCollab system.

## Delivered: foundation and core application
- monorepo setup and container baseline
- environment config
- health endpoints and local service startup
- authentication APIs
- room creation and membership
- room metadata persistence
- drawing primitives
- Socket.IO room events
- local optimistic UI updates
- session persistence
- operation queueing
- reconnect and replay logic

## Remaining: production readiness
- scaling review
- security hardening
- tests and performance validation
- durable queue/recovery guarantees, browser tests, backups, migrations, and rollout automation

## Implementation status
Status: core identity, rooms, collaboration, persistence, and recovery foundations are implemented. Production readiness remains open as described in [known limitations](known-limitations.md).

## Related
- [Feature status](feature-status.md)
- [Technical debt](technical-debt.md)
- [Known limitations](known-limitations.md)
