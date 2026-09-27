# Scalability Strategy

## Purpose
Define the horizontal and vertical scaling roadmap for BoardCollab, establishing baseline deployment constraints and sharding patterns.

## 1. Single-Region Architecture Baseline
- **Primary Assumption**: The system is designed to operate within a **single primary cloud region** with sub-50ms round-trip latency between microservices.
- **Benefits**: Simplifies real-time event ordering, eliminates cross-region WAN split-brain risks, and avoids expensive distributed transactions.

## 2. Horizontal Scaling Layers
1. **Application Layer (Express + Socket.IO)**:
   - Stateless backend nodes scaled horizontally behind a Layer 7 Load Balancer.
   - Redis Pub/Sub coordinates room event fan-out across instances.
2. **Persistence Layer (MongoDB)**:
   - Sharded cluster when data exceeds a single replica set.
   - Shard key: `{ roomId: "hashed" }` to evenly distribute rooms while co-locating all elements of a room on a single shard.
3. **Cache & Ephemeral Presence (Redis)**:
   - Redis Cluster / Sentinel for presence tracking and temporary coordination.

## 3. Operating Limits
- **Max Elements per Room**: 10,000 active elements.
- **Max Stroke Length**: 5,000 points.
- **Undo History Limit**: 50 actions per user per room.
- **Persistence Debounce**: 500ms batch flush.

## Related
- [Scalability and sharding](../02-architecture/scalability-and-sharding.md)
- [System assumptions and limits](../01-overview/system-assumptions-and-limits.md)
- [Capacity planning](capacity-planning.md)
