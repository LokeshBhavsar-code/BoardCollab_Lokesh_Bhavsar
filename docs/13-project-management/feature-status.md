# Feature Status

## Purpose
Summarize implemented, partial, and planned features.

## Implemented
- registration, login, JWT-protected HTTP and Socket.IO connections
- room create/list/join/read/update/archive and access checks
- Konva board tools, live drawing, presence/cursor updates, and user-scoped undo/redo
- versioned writes, stale-version rejection, canvas clearing, and configured element/stroke limits
- MongoDB models and batched element persistence with retry on failed writes
- IndexedDB element cache and queued offline drawing replay
- JSON, SVG, and PNG room export
- client/server shape recognition
- local development Compose, production app image targets, and backend Node test suite

## Partially implemented
- Redis-backed Socket.IO adapter with in-memory single-process fallback
- service-worker offline shell and IndexedDB replay; Background Sync has a handler but the app does not register the sync tag
- room version checks provide stale-write rejection, not general OT/CRDT conflict resolution
- frontend test script exists but currently discovers no tests

## Planned
- frontend automated and browser-level testing
- production secret management, TLS, backups, migration/restore procedures, and rollout automation
- capacity/load testing and validated multi-instance behavior
- stronger conflict/replay guarantees if required by product scale

## Implementation status
Status: core whiteboard functionality is implemented; production operations and scale guarantees remain incomplete.

## Related
- [Implementation roadmap](implementation-roadmap.md)
- [Known limitations](known-limitations.md)
- [Technical debt](technical-debt.md)
