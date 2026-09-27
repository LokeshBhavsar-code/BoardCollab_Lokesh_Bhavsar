# Canvas Element Schema

## Purpose
Define how drawing objects and shapes should be represented.

## Proposed element fields
- `id`
- `sessionId`
- `type`: `path`, `rect`, `circle`, `text`
- `createdBy`
- `createdAt`
- `updatedAt`
- `properties`: geometric data and styling
- `version`

## Validation rules
- persistent data should include type and coordinates
- shape properties must match the element type
- user IDs must map back to valid room participants

## Example
```json
{
  "_id": "element_001",
  "sessionId": "session_123",
  "type": "path",
  "createdBy": "user_456",
  "properties": {
    "points": [[0, 0], [10, 12], [20, 30]],
    "stroke": "#1d4ed8",
    "strokeWidth": 3
  },
  "version": 1
}
```

## Implementation status
Status: planned design only.

## Related
- [Room and session schema](room-and-session-schema.md)
- [Export service](../03-backend/export-service.md)
- [Database overview](database-overview.md)
