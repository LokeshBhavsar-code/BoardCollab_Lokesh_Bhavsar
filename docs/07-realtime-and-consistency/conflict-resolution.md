# Conflict Resolution

## Purpose
Document the strategy for concurrent editing and conflicting operations.

## Decision status
The repository does not yet implement a proven conflict strategy. Two common approaches must be evaluated:
- Operational Transformation (OT)
- CRDTs

## OT
Pros: mature for centralized editors and ordered operations.
Cons: complex for highly concurrent room editing and version reconstruction.

## CRDTs
Pros: naturally supports concurrent updates and eventual convergence.
Cons: more complex model and state representation for canvas payloads.

## Recommended decision scope
A practical production approach is likely a hybrid: central authoritative server ordering with client-generated operation IDs and dedupe metadata, while preserving a room-snapshot reconciliation model.

## Implementation status
Status: pending architectural decision.

## Related
- [Drawing synchronization](drawing-synchronization.md)
- [Ordering and idempotency](ordering-and-idempotency.md)
- [Undo redo design](undo-redo-design.md)
