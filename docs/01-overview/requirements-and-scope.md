# Requirements and Scope

## Purpose
Document the functional and non-functional product expectations for BoardCollab and distinguish them from code that is already implemented.

## Audience
Product, architecture, QA, and engineering management.

## Scope
This document reflects the assignment requirements and the current repository maturity.

## Product requirements
The application is expected to support:
- user registration and login
- room creation and joining
- real-time freehand drawing
- rectangles, circles, and text elements
- concurrent room editing by multiple users
- undo and redo per participant
- canvas clear and export to PNG/SVG
- persistence and session recovery
- presence and reconnection
- target concurrency of 50-100+ users per room
- 5,000-10,000 canvas elements per session

## Current repository evidence
Implemented and tested behavior includes registration/login, protected room APIs, live canvas operations, authenticated sockets and room joining, batched persistence, per-user undo/redo, room export, offline batch sync, and local MongoDB/Redis composition. See the feature status page for partial behaviors and explicit out-of-scope items.

## Non-functional expectations
- secure JWT-based authentication
- room-isolated collaboration state
- low-latency drawing sync for active collaboration
- durable save of room state
- graceful reconnect after network interruption

## Implementation status
Status: Core interaction requirements are implemented; production-scale capacity targets and operational guarantees are not yet verified.

## Related
- [Project overview](project-overview.md)
- [System context](system-context.md)
- [System architecture](../02-architecture/system-architecture.md)
