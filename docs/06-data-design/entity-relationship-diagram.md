# Entity Relationship Diagram

## Purpose
Show the logical relationships across the main board domain entities.

```mermaid
erDiagram
  USER ||--o{ ROOM_MEMBER : belongs_to
  ROOM ||--o{ ROOM_MEMBER : has
  ROOM ||--|| SESSION : current_session
  SESSION ||--o{ CANVAS_ELEMENT : contains
  USER ||--o{ CANVAS_ELEMENT : authored
  USER ||--o{ OPERATION : creates
  ROOM ||--o{ OPERATION : records
```

## Notes
- a user may belong to many rooms
- a room can own many sessions over time
- the canvas is persisted as elements and/or operation history
- ownership and membership must be enforced at the API and socket layers

## Implementation status
Status: conceptual model only.

## Related
- [Database overview](database-overview.md)
- [User schema](user-schema.md)
- [Room and session schema](room-and-session-schema.md)
