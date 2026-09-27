# Scalability Strategy

## Purpose
Define the likely horizontal and vertical scaling direction for BoardCollab.

## Target design
- room-based partitioning for collaboration flows
- Redis-based pub/sub for global socket fan-out across backend instances
- MongoDB for durable data and session snapshots
- frontend optimization to avoid excessive re-renders in large boards

## Constraints
- room-level concurrency targets are product goals, not measured benchmarks
- no scaling test has been run yet

## Implementation status
Status: design-level strategy only.

## Related
- [Socket scaling](socket-scaling.md)
- [Capacity planning](capacity-planning.md)
- [Performance benchmarks](performance-benchmarks.md)
