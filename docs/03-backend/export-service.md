# Export Service

## Purpose
Describe the planned export pipeline for board snapshots.

## Planned capabilities
- export current board state as PNG or SVG
- serialize canvas elements into a renderable document
- include metadata such as room ID, timestamp, and author
- generate a downloadable artifact for the user

## Dependencies
- room/session model
- canvas element storage
- serialization logic
- file generation service

## Implementation status
Status: planned, not implemented.

## Related
- [Export API](../05-api-contracts/export-api.md)
- [Canvas element schema](../06-data-design/canvas-element-schema.md)
- [Feature status](../13-project-management/feature-status.md)
