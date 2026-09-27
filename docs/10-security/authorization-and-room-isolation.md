# Authorization and Room Isolation

## Purpose
Describe how room access and user actions should be isolated.

## Design rules
- room membership must be checked before drawing or state read operations
- only owners can change room-level metadata or delete rooms
- unauthorized users cannot join or see room state without approval
- socket event handlers must revalidate membership before mutating room state

## Abuse cases
- malicious room ID guessing
- unauthorized join attempts
- forged socket payloads with invalid user context

## Implementation status
Status: planned design only.

## Related
- [Security architecture](security-architecture.md)
- [Room lifecycle](../03-backend/room-lifecycle.md)
- [Threat model](threat-model.md)
