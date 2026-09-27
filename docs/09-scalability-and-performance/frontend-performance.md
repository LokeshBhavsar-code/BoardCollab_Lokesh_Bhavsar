# Frontend Performance

## Purpose
Document expected frontend performance constraints for a live canvas application.

## Key concerns
- large board redraw cost
- pointer event thrash during drawing
- overlay re-renders after each state change
- large participant list and room metadata updates

## Planned optimizations
- use memoized canvas elements
- batch draw events
- limit re-renders to visible or changed objects
- operate on a normalized board model rather than deeply cloned UI state

## Implementation status
Status: planned architecture with no measured benchmarks yet.

## Related
- [Canvas rendering](../04-frontend/canvas-rendering.md)
- [State management](../04-frontend/state-management.md)
- [Performance benchmarks](performance-benchmarks.md)
