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
The following are verified from the codebase:
- a React app shell exists
- an Express health endpoint exists
- Docker services for MongoDB and Redis are configured
- environment variables for backend and frontend are defined

The following remain planned:
- protected auth and room APIs
- collaborative canvas operations
- persistence queue
- socket auth and room join logic

## Non-functional expectations
- secure JWT-based authentication
- room-isolated collaboration state
- low-latency drawing sync for active collaboration
- durable save of room state
- graceful reconnect after network interruption

## Implementation status
Status: Planned architecture with partial foundation.

## Related
- [Project overview](project-overview.md)
- [System context](system-context.md)
- [System architecture](../02-architecture/system-architecture.md)
