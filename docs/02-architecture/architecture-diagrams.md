# Architecture Diagrams

## Purpose
Capture the key runtime and deployment views of the design.

## 1. System context
```mermaid
flowchart LR
  User[End user] --> FE[Frontend React app]
  FE --> API[Backend Express API]
  FE --> WS[Socket.IO realtime]
  API --> M[(MongoDB)]
  WS --> R[(Redis)]
  API --> R
```

## 2. Container and service architecture
```mermaid
flowchart TB
  subgraph Docker[Docker Compose]
    FE[frontend container]
    BE[backend container]
    M[(mongo container)]
    R[(redis container)]
  end
  FE --> BE
  BE --> M
  BE --> R
  FE --> M
```

## 3. Backend module dependencies
```mermaid
flowchart LR
  Routes[Routes] --> Controller[Controllers]
  Controller --> Services[Services]
  Services --> Models[Models]
  Services --> Redis[(Redis)]
  Services --> Mongo[(MongoDB)]
  SocketHandlers[Socket handlers] --> Services
```

## 4. Frontend component architecture
```mermaid
flowchart TB
  App[App shell] --> Auth[Auth feature]
  App --> Rooms[Room feature]
  App --> Canvas[Canvas feature]
  Canvas --> Toolbar[Toolbar]
  Canvas --> Sockets[Socket client]
  Rooms --> Store[Redux state]
  Canvas --> Store
```

## 5. Deployment architecture
```mermaid
flowchart LR
  LB[Ingress / reverse proxy optional] --> FE[Frontend container]
  FE --> BE[Backend container]
  BE --> M[(MongoDB)]
  BE --> R[(Redis)]
```

## 6. Real-time drawing sequence
```mermaid
sequenceDiagram
  participant ClientA as Client A
  participant WS as Socket.IO server
  participant Room as Room state
  participant Mongo as MongoDB
  ClientA->>WS: draw-stroke
  WS->>Room: validate / authorize
  WS-->>ClientA: optimistic ack
  WS-->>Room: broadcast event
  Room->>Mongo: persist batch
```

## 7. Room join and auth
```mermaid
sequenceDiagram
  participant Client
  participant API
  participant JWT
  participant Room
  Client->>API: POST /api/auth/login
  API->>JWT: issue token
  JWT-->>Client: JWT
  Client->>API: GET /api/rooms/:id
  API->>Room: verify membership
  Room-->>Client: room details
```

## 8. Persistence and recovery
```mermaid
sequenceDiagram
  participant Client
  participant WS
  participant Queue as Persist queue
  participant Mongo
  Client->>WS: drawing event
  WS->>Queue: enqueue durable state update
  Queue->>Mongo: save snapshot / operation
  Mongo-->>Queue: ack
  WS-->>Client: server ack + recovery metadata
```

## 9. Database entity relationships
```mermaid
erDiagram
  User ||--o{ Membership : has
  Room ||--o{ Membership : contains
  Room ||--o{ Session : owns
  Room ||--o{ CanvasElement : contains
  User ||--o{ CanvasElement : authored
  Session ||--o{ Operation : stores
```

## Implementation status
Status: design diagrams are documentation artifacts; runtime features are still planned.

## Related
- [System architecture](system-architecture.md)
- [Real-time communication](real-time-communication.md)
- [Entity relationship diagram](../06-data-design/entity-relationship-diagram.md)
