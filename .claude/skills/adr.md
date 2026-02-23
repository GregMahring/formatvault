---
description: Create an Architecture Decision Record for formatvault. Usage: /adr <title of the decision>
---

You are creating an Architecture Decision Record (ADR) for formatvault.

Decision title: $ARGUMENTS

## Step 1: Find Existing ADRs

Check `docs/adr/` for existing ADRs to determine:

- The next ADR number (ADR-NNNN, zero-padded to 4 digits)
- The naming convention in use (e.g., `0001-use-react.md`)
- The template format if a custom one exists

If `docs/adr/` does not exist, note it must be created and use `0001` as the first number.

## Step 2: Gather Context

Ask the user:

1. What is the specific decision being made? (Not the problem — the actual chosen direction.)
2. What alternatives were considered?
3. What drove the decision? (Key constraints, requirements, or data points.)
4. What are the known trade-offs or downsides?
5. Does this decision have SOC2/security implications?
6. Is this decision reversible? If yes, what circumstances would trigger revisiting it?

## Step 3: Generate the ADR

```markdown
# ADR-[NNNN]: [Title]

**Status**: Proposed
**Date**: [YYYY-MM-DD]
**Authors**: [name]

## Context

[2-4 sentences describing the situation that necessitates this decision. What problem are we solving? What constraints exist?]

## Decision

[1-3 sentences stating clearly what we are doing. Imperative voice: "We will use...", "We will not..."]

## Alternatives Considered

### [Alternative 1]

[What it is and why it was not chosen]

### [Alternative 2]

[What it is and why it was not chosen]

## Consequences

### Positive

- ...

### Negative

- ...

### Risks

- ...

## Compliance Notes

[Any SOC2, security, or regulatory implications. Write "None identified." if none apply.]

## Review Trigger

[What circumstances would cause us to revisit this decision?]
```

## Step 4: Confirm and Create

Show the full ADR content.
Confirm the file path: `docs/adr/[NNNN]-[kebab-case-title].md`

Ask: "Should I create this ADR at `docs/adr/[NNNN]-[kebab-case-title].md`?"
Wait for confirmation before writing the file.

After writing, note that the status should be changed from "Proposed" to "Accepted" when the team formally agrees.
