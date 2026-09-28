# Room and Session Schema

## Purpose
Describe the data model for collaborative rooms and room state snapshots.

## Room document fields
- `id`
- `name`
- `description`
- `ownerId`
- `visibility`
- `code`
- `members` (`userId`, role, `joinedAt`)
- `isArchived`
- `createdAt`
- `updatedAt`
- `isArchived`

## Session document fields
- `id`
- `roomId`
- `version`
- `snapshotAt`
- `lastOperationAt`
- `canvasStateRef`
- `status`

## Relationships
- one room may have one active session and historical sessions
- session is the durable baseline for recovery and rollback

## Example
```json
{
  "_id": "room_123",
  "name": "Sprint Planning",
  "ownerId": "user_456",
  "visibility": "private",
  "createdAt": "2026-09-27T00:00:00Z"
}
```

## Implementation status
Status: implemented by `backend/src/models/room.model.js` and `session.model.js`. A room has one active session selected by query logic; historical session retention is not yet an operational guarantee.

## Related
- [Canvas element schema](canvas-element-schema.md)
- [Room lifecycle](../03-backend/room-lifecycle.md)
- [Database overview](database-overview.md)
