# Frontend Structure

## Purpose
Describe the intended feature-oriented React structure for the BoardCollab client.

## Proposed feature modules
- auth feature: sign in, sign up, session restoration
- room feature: list, create, join, leave, metadata display
- canvas feature: board drawing, selection, and export
- toolbar: tool selection and shape config
- presence feature: participant list and status
- socket client: lifecycle, event handlers, reconnect logic

## Current evidence
The frontend currently contains a simple app shell and landing page only. It does not yet implement the feature structure indicated above.

## Design principles
- keep UI components thin and domain-driven
- avoid direct DB knowledge in components
- route server communication through an API layer
- treat Socket.IO as a low-level transport, not a UI dependency

## Implementation status
Status: partial foundation implemented.

## Related
- [Component architecture](component-architecture.md)
- [State management](state-management.md)
- [Socket client](socket-client.md)
