# Known Limitations

## Purpose
Capture the non-functional and delivery gaps currently visible in the codebase.

## Limitations
- offline operation replay is limited to supported drawing operations and is not a general durable event log
- the in-memory persistence queue can lose unflushed writes if a process terminates unexpectedly
- without Redis, socket communication works only within one backend process
- server version checks reject stale operations but do not implement OT/CRDT merging
- production MongoDB/Redis, secret delivery, TLS/reverse proxy, backups, and rollout are operator-provided
- no frontend automated tests or browser-level end-to-end suite currently exists; the frontend test command discovers zero tests
- documented concurrency targets have not been verified with load testing

## Implementation status
Status: core collaboration workflows are implemented, but the repository alone does not provide a production-operated service or validated scale guarantees.

## Related
- [Feature status](feature-status.md)
- [Technical debt](technical-debt.md)
- [Implementation roadmap](implementation-roadmap.md)
