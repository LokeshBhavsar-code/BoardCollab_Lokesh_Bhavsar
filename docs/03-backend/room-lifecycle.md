# Room Lifecycle

## Purpose
Outline how a collaboration room is created, joined, modified, and retired.

## Planned lifecycle
1. user authenticates
2. user creates a room or joins with invite or code
3. system creates default room metadata and session state
4. user is added to membership list and presence state
5. room emits current board snapshot to connected users
6. room continues until archived or deleted

## Events
- room created
- member joined
- member left
- room archived
- session reset

## Ownership and responsibilities
- room owner controls permissions and archival actions
- members receive state updates and can collaborate within allowed scope
- persistence layer stores metadata and latest snapshot

## Implementation status
Status: planned; no room endpoints or models currently exist.

## Related
- [Module responsibilities](module-responsibilities.md)
- [Rooms API](../05-api-contracts/rooms-api.md)
- [Room and session schema](../06-data-design/room-and-session-schema.md)
