# Export API Contract

## Purpose
Document room export behavior.

## Implemented endpoint
### POST /api/rooms/:id/export
- Purpose: create a board snapshot export in PNG or SVG format
- Auth required: yes
- Query params: `format=json|svg|png` (defaults to `json`)
- Response: downloadable JSON, SVG, or PNG body with `Content-Disposition` filename

## Validation
- room membership required
- requested format must be supported
- export generation should fail gracefully if state is empty or invalid

## Implementation status
Status: implemented at `POST /api/rooms/:id/export`; a bearer token and room access are required.

## Related
- [Export service](../03-backend/export-service.md)
- [Canvas element schema](../06-data-design/canvas-element-schema.md)
- [Feature status](../13-project-management/feature-status.md)
