# Threat Model

## Purpose
Identify likely abuse patterns in a collaborative whiteboard system.

## Threats
- unauthorized room access
- flooding the socket server with malformed payloads
- malicious drawing data causing excessive memory or CPU use
- token theft or replay
- stale state injection after disconnect

## Mitigations
- validate JWT and room membership
- reject invalid payload shapes
- rate-limit high-frequency actions
- preserve durable version metadata for stale event handling

## Implementation status
Status: conceptual risk model; production mitigations remain pending.

## Related
- [Security architecture](security-architecture.md)
- [Authorization and room isolation](authorization-and-room-isolation.md)
- [Testing strategy](../11-testing-and-quality/testing-strategy.md)
