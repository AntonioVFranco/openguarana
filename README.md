<img width="2160" height="1080" alt="54354235" src="https://github.com/user-attachments/assets/d489a07d-9f33-41ac-b1ff-c374bac06324" />

# OpenGuarana

**A secure, team-native AI assistant runtime.**

OpenGuarana is a hardened fork of OpenClaw that fixes three structural failures of the original: no security sandbox for third-party skills, no multi-user support, and no persistent team intelligence. It is 100% MIT, fully self-hosted, and model-agnostic.

---

## Why OpenGuarana

OpenClaw is a powerful single-user AI assistant. But when you try to use it in a team, or install skills from its public registry, cracks appear fast:

| Problem | OpenClaw | OpenGuarana |
|---|---|---|
| Third-party skills run with full OS access | No sandboxing | Node.js 22 Permission Model + Semgrep SAST scan before install |
| No tamper-evident record of what skills did | No audit trail | HMAC-chained audit log — every install and execution is recorded and verifiable |
| Single-user architecture | Shared secrets, no roles | Team workspaces with owner / admin / member / viewer RBAC |
| Decisions made in chat, lost forever | No memory | Event-sourced decision store — searchable, linkable, outcome-tracked |
| No engineering metrics | — | DORA metrics (deployment frequency, lead time, MTTR, change failure rate) |
| No structured knowledge memory | Markdown diary only | SQLite knowledge graph with semantic search via sqlite-vec |
| Not usable as a Claude Code tool | — | Full MCP server — decisions, memory, workspace, DORA, and skills as native tools |

---

## Architecture

OpenGuarana is a **pnpm monorepo** with five packages and a CLI app.

```
openguarana/
├── packages/
│   ├── core/           Gateway server (Hono, Zod, Pino) — drop-in OpenClaw replacement
│   ├── security/       Skill sandbox, SAST scanner, HMAC audit log, RBAC engine
│   ├── professional/   Team workspaces, decision intelligence, DORA metrics, intel digest
│   ├── memory/         SQLite knowledge graph with sqlite-vec semantic layer
│   └── mcp/            MCP server exposing all capabilities to Claude Code and Claude Desktop
├── apps/
│   └── cli/            guarana CLI (start, migrate)
└── skills/
    └── professional/   Built-in skills (competitive intel digest, ...)
```

### `@openguarana/core`

Drop-in replacement for OpenClaw's Gateway. Hono replaces the HTTP layer for better performance and composability. Config is validated with Zod against a strict schema. Structured logging via Pino.

### `@openguarana/security`

The security package operates at three layers:

1. **Static analysis** — every skill is scanned with Semgrep before installation using a custom ruleset that catches hardcoded secrets, unsafe `eval()`, dynamic `require()`, subprocess exec, and potential data exfiltration patterns. Skills score 0–100; anything below 70 is blocked.

2. **Runtime sandbox** — skills are executed as child processes with Node.js 22's `--experimental-permission` flag. Each skill declares a permission manifest (`fs.read`, `fs.write`, `network.allow`, `env`) and gets exactly those permissions — nothing more. Wildcard network access is rejected at parse time.

3. **Audit log** — every skill installation and execution writes an entry to a tamper-evident SQLite log. Each entry is HMAC-SHA256 hashed using the previous entry's hash as input (blockchain-style chain). `verifyChain()` detects any tampering. The behavioral detector also monitors declared vs actual network and filesystem access at runtime.

Sigstore/cosign signature verification is supported: signed skills receive a `verified` badge; unsigned skills receive `unverified` but are still allowed through.

### `@openguarana/professional`

Three capabilities for teams and founders:

- **Team workspaces** — SQLite-backed workspace store with owner/admin/member/viewer roles. `hasPermission(role, action)` enforces RBAC across all operations. Full foreign-key integrity with cascade deletes.

- **Decision intelligence** — immutable, event-sourced decision store. Every architectural or strategic decision is recorded as a `DecisionRecorded` event with `what`, `why`, `tradeoffs`, and `who`. Decisions can be linked, superseded, and given outcomes with a 1–5 rating. This creates a permanent, queryable record of why your system is the way it is.

- **DORA metrics** — classify your team's engineering performance into elite / high / medium / low bands based on deployment frequency, change lead time, change failure rate, and time to restore. `classifyDoraBand()` takes a snapshot of all four metrics and returns the overall band (bottlenecked by the weakest metric).

- **Competitive intel digest** — weekly deduplication engine that aggregates items from Hacker News, RSS feeds, and LinkedIn. Items are deduplicated by URL across the week, grouped by source, and tagged with an ISO 8601 week identifier.

- **CEO dashboards** — fundraising tracker (investors, last contact, overdue detection) and investor update draft builder that reads recent decision events and workspace activity to produce structured win/blocker/metrics/ask drafts.

### `@openguarana/memory`

An opt-in SQLite knowledge graph that sits on top of OpenClaw-compatible Markdown diary memory.

- **Entities** — typed nodes (technology, project, person, decision, ...) with summary and timestamps
- **Observations** — facts attached to entities with source attribution
- **Relations** — typed edges between entities (`uses`, `depends_on`, `conflicts_with`, ...)
- **Semantic layer** — entity embeddings stored in a `vec0` virtual table via sqlite-vec, enabling `findSimilar(text, topK)` queries
- **Graph traversal** — recursive CTE-based `findRelated(entityId, depth)` that returns all entities reachable within N hops

### `@openguarana/mcp`

An MCP (Model Context Protocol) server that exposes OpenGuarana's capabilities as native tools to Claude Code and Claude Desktop.

| Tool | Description |
|---|---|
| `decisions_record` | Record a team decision with what, why, tradeoffs, and who |
| `decisions_query` | List all recorded decisions |
| `memory_search` | Search the knowledge graph for an entity by name |
| `workspace_members` | List members of a workspace with their roles |
| `dora_report` | Get the current DORA performance band |
| `skills_install` | Trigger scan + install for a skill path |

---

## Getting Started

### Requirements

- Node.js 22+
- pnpm 9+

### Install

```bash
git clone https://github.com/AntonioVFranco/openguarana.git
cd openguarana
pnpm install
pnpm build
```

### Configure

```bash
cp guarana.config.yaml.example guarana.config.yaml
# edit guarana.config.yaml as needed
```

Minimal config:

```yaml
gateway:
  port: 18789
memory:
  diary: true
  graph: false
professional:
  enabled: false
```

### Start

```bash
node apps/cli/dist/index.js start
# or after global install: guarana start
```

Verify:

```bash
curl http://localhost:18789/health
# {"status":"ok","version":"0.1.0"}
```

### Migrate from OpenClaw

If you have an existing `openclaw.config.yaml`:

```bash
guarana migrate
# produces guarana.config.yaml preserving all your existing settings
```

---

## Claude Code Integration (MCP)

OpenGuarana ships with a `.mcp.json` at the project root. When you open this repository in Claude Code, the `openguarana` MCP server is automatically available — no manual configuration needed.

To use it from any Claude Code session, add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "openguarana": {
      "command": "node",
      "args": ["/path/to/openguarana/packages/mcp/dist/index.js"],
      "env": {
        "GUARANA_DB": "/home/youruser/.openguarana/data.db"
      }
    }
  }
}
```

Then use it naturally:

```
Record a decision: we're adopting OpenGuarana instead of OpenClaw because of the security sandbox and RBAC.
```

---

## Running Tests

```bash
pnpm test                              # all packages
pnpm -F @openguarana/core test         # single package
pnpm -F @openguarana/security test
pnpm -F @openguarana/professional test
pnpm -F @openguarana/memory test
pnpm -F @openguarana/mcp test
```

61 tests across 18 test files. All green.

---

## Skills

Skills extend OpenGuarana's capabilities. They live in `skills/` and follow the OpenClaw SKILL.md format — fully compatible.

Every skill is scanned with Semgrep before installation and executed in a Node.js 22 Permission Model sandbox with only the permissions declared in its manifest. There is no wildcard network access.

Built-in skills:

| Skill | Location | Description |
|---|---|---|
| Competitive Intel Digest | `skills/professional/competitive-intel/` | Weekly deduplicated intel digest from HN, RSS, and LinkedIn |

---

## Roadmap

- [ ] GitHub App integration for live DORA metrics
- [ ] Semantic decision search via sqlite-vec embeddings
- [ ] Skill signature verification with Sigstore cosign
- [ ] Multi-channel support (Telegram, Discord, Slack)
- [ ] Academic vertical (spaced repetition, active recall, FSRS scheduling)
- [ ] Web UI for workspace and decision management

---

## License

MIT — fork it, modify it, ship it.

---

## Contact

Antonio Franco — [contact@antoniovfranco.com](mailto:contact@antoniovfranco.com)

GitHub: [github.com/AntonioVFranco](https://github.com/AntonioVFranco)
