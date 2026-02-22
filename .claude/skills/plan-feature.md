---
description: Decompose a feature into sequenced, dependency-ordered implementation tasks for formatvault. Usage: /plan-feature <feature description>
---

You are creating an implementation plan for a formatvault feature.

Feature: $ARGUMENTS

## Step 1: Context Gathering
Before planning, read:
- `CLAUDE.md` for project conventions and SOC2 requirements
- Any relevant existing source files if the feature touches known areas
- Existing ADRs in `docs/adr/` if they exist and are relevant

## Step 2: Ask Clarifying Questions
Do not produce a plan until these questions are answered:
1. Who is the user of this feature? (end user, admin, developer?)
2. What is the single most important outcome this feature enables?
3. Are there any constraints? (must use specific tech, must not break existing behavior)
4. Does this feature touch user data? (triggers SOC2 consideration)
5. Does this feature have any UI? (triggers accessibility consideration)
6. Is there an existing pattern in the codebase this should follow?

## Step 3: Produce the Plan
```
## Feature: [Name]

### Assumptions
[List explicitly — anything not confirmed by the user]

### Out of Scope
[What this plan does NOT cover]

### Tasks (dependency order)

#### Task 1: [Imperative summary]
What: [One sentence]
Why: [How this enables the feature]
Acceptance Criteria:
  - [ ] [Specific, verifiable condition]
  - [ ] ...
Dependencies: none
Security/A11y note: [if applicable, otherwise omit]

#### Task 2: [Imperative summary]
...
```

## Step 4: Review Pass
After generating the plan, verify:
- Every task is independently verifiable
- The dependency order is correct (no task depends on something not yet done)
- No task mixes concerns (e.g., "build the API and the UI" should be two tasks)
- SOC2-relevant tasks have a security note

Present the plan and ask: "Does this plan match your intent? Any tasks to add, remove, or resequence?"
