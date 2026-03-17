# OpenGuarana

A secure, team-native AI assistant runtime. Fork of OpenClaw with security hardening, team RBAC, decision intelligence, and knowledge graph memory.

100% MIT. Self-hosted. Model-agnostic.

## Packages

- `packages/core` — Gateway (Hono + Zod + Pino, OpenClaw-compatible)
- `packages/security` — Skill sandboxing, SAST scanner, HMAC audit log
- `packages/professional` — Team workspaces, decision intelligence, DORA metrics
- `packages/memory` — Knowledge graph engine (sqlite-vec)
- `packages/mcp` — MCP server for Claude Code integration

## License

MIT
