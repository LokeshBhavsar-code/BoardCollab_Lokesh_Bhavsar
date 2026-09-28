# Technical Debt

## Purpose
Document the architecture choices and deferred work that will require follow-up as the product matures.

## Current debt areas
- the persistence write queue is in-memory and needs a documented durability/recovery guarantee
- current version-based conflict rejection may need stronger merge semantics for concurrent editing
- Redis-backed multi-instance behavior and sticky-session/network requirements need deployment testing
- production configuration validation, secret management, backup/restore, migrations, and rollout automation need operational ownership
- frontend and browser-level test coverage is missing; deployment capacity targets need load-test evidence

## Management guidance
- preserve current route/socket contracts with tests when extending behavior
- validate role and room access behavior across HTTP and Socket.IO paths
- prioritize persistence recovery, scale testing, and browser-level coverage before production commitments

## Implementation status
Status: remaining operational and scalability work is tracked here; core authentication, room, drawing, persistence, and export code already exists.

## Related
- [Implementation roadmap](implementation-roadmap.md)
- [Known limitations](known-limitations.md)
- [Architecture decisions](../02-architecture/architecture-decisions.md)
