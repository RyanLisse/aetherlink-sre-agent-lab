---
name: eli5
description: Explain complex code, diffs, errors, and tradeoffs simply for an intelligent beginner. Use when the user asks to ELI5, explain simply, onboard into unfamiliar code, or understand an incident/tradeoff before a deep dive.
argument-hint: "[topic or path]"
---

# ELI5 — explain like I'm new here

Explain $ARGUMENTS (or the current selection / open files / recent error) so an intelligent beginner can form a correct mental model fast. Preserve the real mechanism. Do not baby-talk.

## When to use

- Before changing unfamiliar modules: "how does this work?"
- Before re-litigating a decision: "why this tradeoff?"
- Before a postmortem deep dive: "what caused this?"
- Dense diffs, stack traces, type errors, or jargon-heavy docs

Skip when the user already wants precise API/reference detail with no onboarding.

## How to respond

1. **Scaffold first** — What problem does this solve? What must the reader notice first?
2. **Define only missing prerequisites** — Assume smart reader, zero shared context.
3. **Keep the mechanism** — Clear language, not wrong metaphors. If you use an analogy, say where it breaks.
4. **Layer** — Plain summary → how it works → optional deeper detail.
5. **End with one check** — One prediction, question, or tiny action that proves understanding.

### Output shape (default: chat)

```text
## In one sentence
...

## Why it exists
...

## How it works (the real mechanism)
...

## Words you might not know yet
- term: plain meaning

## Common mix-ups
- ...

## You should now be able to
- [one concrete check]
```

### Optional visual HTML

If the user asks for a visual / HTML artifact (or says "big pictures, few words"), produce a single self-contained HTML page: large simple diagram or labeled boxes, minimal text, same accuracy rules. Prefer SVG or CSS shapes over decorative fluff.

## Quality bar

| Prefer | Avoid |
|--------|--------|
| Accurate simplified mechanism | Cute metaphor that replaces the mechanism |
| Causal scaffold, prune side paths | Shortening every sentence equally |
| Respect; no talking down | "Simply", "just", "obviously", "as everyone knows" |
| Ends with a learner check | Stops when it merely sounds easy |

Never invent product behavior. If unsure, say what you verified vs. what needs a source.

## Mini examples

**Diff:** "This PR adds a cache key so repeated requests skip the DB. Before: every hit queried Postgres. After: first hit fills Redis; later hits read Redis until TTL."

**Error:** "TypeScript complains because `user` can be `null` after the optional chain. Fix: narrow with an early return, or handle the null case explicitly."

**Tradeoff:** "We chose eventual consistency for feed fan-out: writes stay fast, readers may see stale data for a few seconds. Strong consistency would serialize writers and slow peaks."

## Attribution (ideas, not copied text)

Inspired by public ELI5 skill discussions and docs-simplification practices:
- https://explainx.ai/blog/eli5-claude-code-skill-anthropic-melo-2026
- https://www.skills.sh/cloudflare/cloudflare-docs/eli5
