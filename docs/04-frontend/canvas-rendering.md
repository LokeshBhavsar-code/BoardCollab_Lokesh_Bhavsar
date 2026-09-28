# Canvas Rendering

## Purpose
Document the expected canvas rendering architecture for collaborative drawing.

## Technologies
The project uses `react-konva` and `konva` in `CanvasBoard.jsx` to render and interact with board elements.

## Implemented and follow-up responsibilities
- render shapes and strokes on a board surface
- manage selected drawing tool state
- support preview before commit
- batch redraws to reduce unnecessary re-render work
- handle zoom, pan, and pointer interaction as needed

## Performance considerations
- prefer object-level re-renders over full canvas reconstruction
- debounce state sync when users draw quickly
- keep shape-level data normalized for efficient updates

## Implementation status
Status: canvas drawing, element rendering, and tool controls are implemented. Advanced selection and viewport performance tuning remain follow-up work.

## Related
- [Frontend structure](frontend-structure.md)
- [State management](state-management.md)
- [Frontend performance](../09-scalability-and-performance/frontend-performance.md)
