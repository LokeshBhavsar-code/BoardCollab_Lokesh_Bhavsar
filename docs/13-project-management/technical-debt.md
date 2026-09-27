# Technical Debt

## Purpose
Document the architecture choices and deferred work that will require follow-up as the product matures.

## Current debt areas
- auth and session model are still open design decisions
- conflict resolution strategy is not yet chosen
- persistence queue and autosave are not yet implemented
- scaling architecture remains conceptual
- security controls are partially specified only

## Management guidance
- decide on the canvas engine and coordination pattern before building business logic
- define API and socket contracts before broader UI implementation
- implement tests alongside the core collaboration flow

## Implementation status
Status: acknowledged as part of the initial project foundation.

## Related
- [Implementation roadmap](implementation-roadmap.md)
- [Known limitations](known-limitations.md)
- [Architecture decisions](../02-architecture/architecture-decisions.md)
