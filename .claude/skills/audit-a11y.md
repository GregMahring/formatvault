---
description: WCAG 2.1 AA accessibility audit of a component or page in formatvault. Usage: /audit-a11y <path/to/component or page name>
---

You are performing an accessibility audit for formatvault.

Target: $ARGUMENTS

## Step 1: Read the Component
Read the file at the specified path. Also read any CSS module or style file associated with it.

## Step 2: Static Analysis Checklist

### Semantic HTML
- [ ] Headings are used in a logical hierarchy (h1 → h2 → h3, never skipping levels)?
- [ ] Lists (`ul`, `ol`, `dl`) are used for groups of related items?
- [ ] `button` elements are used for actions and `a` elements for navigation?
- [ ] Form elements are wrapped in `form` with `fieldset`/`legend` where grouping helps?

### ARIA and Labeling
- [ ] Every `<input>` and `<textarea>` has an associated `<label>` via `htmlFor` or `aria-label`
- [ ] Icon-only buttons have `aria-label` describing the action
- [ ] `aria-required`, `aria-invalid`, and `aria-describedby` are set on validated form fields
- [ ] Dynamic content updates use `aria-live` regions (polite for non-critical, assertive for errors)
- [ ] Modals use `role="dialog"` with `aria-modal="true"`, `aria-labelledby`, and trap focus

### Keyboard Navigation
- [ ] All interactive elements are reachable via Tab
- [ ] Custom interactive widgets implement ARIA keyboard interaction patterns
- [ ] No `tabIndex > 0` (these break natural tab order)
- [ ] Visible focus indicators are present (not `outline: none` without a styled replacement)

### Color and Contrast
- [ ] No information conveyed by color alone (always paired with text or icon)
- [ ] Normal text: 4.5:1 contrast ratio minimum (WCAG AA)
- [ ] Large text (18px+ or 14px+ bold): 3:1 contrast ratio minimum
- [ ] UI components (borders, icons): 3:1 against adjacent color

### Images and Media
- [ ] All `<img>` elements have `alt`. Decorative images have `alt=""`
- [ ] `<video>` elements have captions
- [ ] SVGs used as meaningful images have `role="img"` and `<title>`

## Step 3: Report
Organize by WCAG criterion:
- **Fail**: File location and line number, WCAG criterion reference, specific fix required
- **Warning**: Potential issue requiring manual or visual verification
- **Pass**: What was checked and confirmed passing (be explicit)

## Step 4: Propose Fixes
For each Fail item, show the exact code change needed as a diff.
Ask: "Should I apply these accessibility fixes?"
Wait for confirmation before editing any file.
