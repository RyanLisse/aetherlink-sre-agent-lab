<!-- Source: github.com/RyanLisse/claude-code-skills-pack, examples/intent.md. License: MIT (see NOTICE.md). Hackathon use: copy this file to hackathon/intent.md and fill it in there; the root intent.md is the SRE lab intent that CLAUDE.md imports. -->

# intent.md

> Shared goal for this mob / support block. Humans write it. Agents work toward it.
> Rule: if it is not written here, it is not the shared goal.

## Problem (not the solution)
What hurts the team right now?

- …

## Outcome (done when)
What will be true when this intent is met?

- [ ] …
- [ ] Demoable evidence: …

## Constraints / stop rules
- No secrets, customer data, or PAT on screen
- No production mutations without named human approval
- Human review is the gate for tickets, code, and MR comments
- …

## Chosen blocker (one)
From Kahoot / refinement — pick **one**:

- Blocker: …
- Why this one today: …

## Success today vs series
- End of **today**: …
- End of **S1–S5 / series**: …

## Roster (this block)
| Role | Who | Notes |
| --- | --- | --- |
| Driver | | |
| Navigator | | |
| Researcher / tester | | |
| Remote advocate | | |
| Agent (draft / prep) | Claude Code | Shared memory + context; no solo judgment calls |
| Human judgment gate | | Named person for approvals |

## Artifact chain (this loop)
| Stage | Artifact | Owner |
| --- | --- | --- |
| Intent | `intent.md` (this file) | |
| Spec / plan | `spec.md` / `plan.md` (if needed) | |
| Change | branch / diff / tests | |
| Review | MR + human review | |
| Learn | end check-in notes | |

## Checks before a person finalizes
- [ ] Rubric / tests / second-pass review ran
- [ ] Diff is reviewable (ELI5 / visualize if large)
- [ ] Intent still matches what we built

## Carry forward
- Keep: …
- Drop: …
- Trust to widen next (gradual release): …
