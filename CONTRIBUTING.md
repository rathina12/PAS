# Contributing

Thanks for contributing to PAS.

## Local setup
1. Install backend dependencies with `cd backend && npm ci`.
2. Install frontend dependencies with `cd frontend && npm ci`.
3. Copy environment examples if provided and configure local values.
4. Run backend and frontend in separate terminals.

## Contribution workflow
- Create a focused branch for one bug, feature, refactor, or documentation change.
- Reproduce bugs before changing code and describe the reproduction steps.
- Keep API contract changes backward-compatible where possible.
- Validate authentication, authorization, and role-specific workflows for backend changes.
- Build the frontend before submitting a change.

## Pull request checklist
- [ ] Change has a clear purpose and scope.
- [ ] Existing behavior is not broken unintentionally.
- [ ] Edge cases and validation paths were checked.
- [ ] Documentation is updated when behavior changes.
- [ ] No credentials, tokens, or private data are committed.
