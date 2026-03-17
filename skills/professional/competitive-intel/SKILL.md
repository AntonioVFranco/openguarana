# Competitive Intel Digest

Monitors configured sources and delivers a deduplicated weekly intelligence digest to your workspace channel.

## What this skill does

- Fetches items from Hacker News, RSS feeds, and LinkedIn
- Deduplicates by URL across the week to prevent repeated entries
- Builds a structured digest grouped by source
- Delivers the digest to the configured workspace channel on schedule

## Configuration

Add to `guarana.config.yaml`:

```yaml
skills:
  competitive-intel:
    sources:
      hackernews:
        enabled: true
        keywords: ["llm", "fintech", "b2b saas", "api"]
        min_points: 50
      rss:
        enabled: true
        feeds:
          - url: "https://hnrss.org/frontpage"
            name: "Hacker News Front Page"
          - url: "https://feeds.feedburner.com/techcrunch"
            name: "TechCrunch"
    schedule: "0 8 * * MON"    # every Monday at 08:00
    channel: "your-channel-id"  # workspace channel to deliver digest
    max_items_per_source: 10
```

## Commands

Ask OpenGuarana directly:

- "Run competitive intel digest" — fetch and deliver now
- "Show last week's competitive digest" — retrieve previous digest
- "Add RSS feed https://..." — add a new RSS source

## Digest format

```
## Competitive Intel — Week 2026-W12

### Hacker News (3 items)
- [Title](url) — summary
- ...

### RSS (2 items)
- [Title](url) — summary
- ...

Total: 5 items (deduplicated from 12 fetched)
```

## Implementation

Core deduplication and digest logic lives in:
`packages/professional/src/intel/digest.ts`

The `deduplicateItems` function removes duplicate URLs (keeping first occurrence).
The `buildWeeklyDigest` function groups deduplicated items by source and attaches an ISO week identifier.
