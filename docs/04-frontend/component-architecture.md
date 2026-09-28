# Component Architecture

## Purpose
Describe the likely component layout for a collaborative whiteboard UI.

## Key components
- AppShell
- AuthPanel
- RoomList
- CreateRoomDialog
- BoardWorkspace
- Toolbar
- ToolbarButton
- ParticipantList
- PresenceBadge
- ToastRegion

## Data ownership
- presentational state belongs in components
- domain state belongs in Redux or the socket client
- shared room and canvas state should not be duplicated across unrelated components

## Diagram
```mermaid
flowchart TD
  AppShell --> AuthPanel
  AppShell --> RoomList
  AppShell --> BoardWorkspace
  BoardWorkspace --> Toolbar
  BoardWorkspace --> ParticipantList
  BoardWorkspace --> SocketBridge
```

## Implementation status
Status: authentication, room entry, board/canvas, toolbar, and participant components are implemented. The document's remaining component boundaries are guidance for future extraction and extension.

## Related
- [Frontend structure](frontend-structure.md)
- [Canvas rendering](canvas-rendering.md)
- [State management](state-management.md)
