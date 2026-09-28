# Frontend Testing

## Purpose
Define the frontend testing approach for the React app and canvas interactions.

## Current gap and planned tests
- rendering of login and room screens
- toolbar selection behavior
- canvas element state propagation
- reconnection messaging and offline states

## Tooling
The repository includes React dependencies, but not a full established frontend test harness yet.

## Implementation status
Status: the frontend `node --test` command currently discovers zero test files. Component, browser, and canvas interaction tests remain planned; verify them with `npm run test:frontend` after adding coverage.

## Related
- [Testing strategy](testing-strategy.md)
- [Frontend structure](../04-frontend/frontend-structure.md)
- [State management](../04-frontend/state-management.md)
