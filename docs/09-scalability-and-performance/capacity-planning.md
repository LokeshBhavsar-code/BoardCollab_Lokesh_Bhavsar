# Capacity Planning

## Purpose
Translate the product targets into projected engineering capacity assumptions.

## Product targets
- 50-100+ concurrent users per room
- 5,000-10,000 canvas elements per session
- room-level draw event bursts during collaborative editing

## Capacity assumptions
- backend must handle frequent broadcasting within a room
- MongoDB should be tuned for write batching and indexing
- Redis must be sized for fan-out and transient session metadata

## Caveat
These are design targets, not verified performance results.

## Related
- [Scalability strategy](scalability-strategy.md)
- [Socket scaling](socket-scaling.md)
- [Performance benchmarks](performance-benchmarks.md)
