# Export API Contract

## Purpose
Document room export behavior.

## Planned endpoint
### POST /api/rooms/:id/export
- Purpose: create a board snapshot export in PNG or SVG format
- Auth required: yes
- Query params: `format=png|svg`
- Response: export metadata plus download URL or binary payload

## Validation
- room membership required
- requested format must be supported
- export generation should fail gracefully if state is empty or invalid

## Implementation status
Status: planned, not implemented.

## Related
- [Export service](../03-backend/export-service.md)
- [Canvas element schema](../06-data-design/canvas-element-schema.md)
- [Feature status](../13-project-management/feature-status.md)
