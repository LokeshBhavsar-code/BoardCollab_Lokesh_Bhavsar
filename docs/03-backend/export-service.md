# Export Service

## Purpose
Describe the board snapshot export pipeline currently used by the API.

## Supported formats
- export current board state as PNG or SVG
- serialize canvas elements into a renderable document
- generate a downloadable response with a filename and content type

## Dependencies
- room/session model
- canvas element storage
- serialization logic
- file generation service

## Implementation status
Status: implemented for JSON, SVG, and PNG output through the authenticated room export endpoint. Export membership follows room-read access checks.

## Related
- [Export API](../05-api-contracts/export-api.md)
- [Canvas element schema](../06-data-design/canvas-element-schema.md)
- [Feature status](../13-project-management/feature-status.md)
