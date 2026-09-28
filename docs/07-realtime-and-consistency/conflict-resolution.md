# Conflict Resolution

## Purpose
Document the strategy for concurrent editing and conflicting operations.

## Decision status
The repository currently uses room/session versions to reject stale writes. This is a basic conflict guard, not a merge strategy. Two broader approaches may be evaluated if product needs require them:
- Operational Transformation (OT)
- CRDTs

## OT
Pros: mature for centralized editors and ordered operations.
Cons: complex for highly concurrent room editing and version reconstruction.

## CRDTs
Pros: naturally supports concurrent updates and eventual convergence.
Cons: more complex model and state representation for canvas payloads.

## Follow-up decision scope
Load and product requirements should determine whether to retain stale-write rejection or adopt ordered operation IDs and a stronger merge model. OT or CRDT behavior is not currently implemented.

## Implementation status
Status: basic server-version conflict checks are implemented and tested; OT/CRDT selection remains open.

## Related
- [Drawing synchronization](drawing-synchronization.md)
- [Ordering and idempotency](ordering-and-idempotency.md)
- [Undo redo design](undo-redo-design.md)
