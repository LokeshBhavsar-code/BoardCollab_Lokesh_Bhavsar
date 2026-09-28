# Socket Scaling

## Purpose
Document how Socket.IO may be scaled horizontally in a future deployment.

## Current approach and constraints
- multiple backend nodes behind a load balancer
- Redis adapter for pub/sub and cross-instance message propagation
- room-based fan-out to keep message routing localized
- sticky sessions or shared Redis adapter depending on transport constraints

## Important notes
- socket connection limits and room fan-out should be benchmarked before claims of support
- not all client reconnection patterns are equivalent under polling or websocket failover

## Implementation status
Status: the Redis adapter is wired into the server when Redis is ready. The in-memory fallback is single-process; multi-instance deployment, load-balancer affinity, and capacity remain unverified.

## Related
- [Scalability strategy](scalability-strategy.md)
- [Redis architecture](../08-infrastructure/redis-architecture.md)
- [Real-time communication](../02-architecture/real-time-communication.md)
