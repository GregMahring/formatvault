---
description: Analyze and optimize the Vite production bundle for formatvault. Usage: /optimize-bundle
---

You are analyzing and optimizing the formatvault production bundle.

$ARGUMENTS

## Step 1: Build with Stats

Run: `npx vite build --mode production 2>&1`

Capture and display:

- Total bundle size
- Individual chunk sizes
- Any warnings about large chunks (Vite warns above 500KB by default)

## Step 2: Visualize (if plugin available)

Check `package.json` for `rollup-plugin-visualizer`.
If present, build with the visualizer config and note which modules are largest.
If not present, recommend: "Consider adding `rollup-plugin-visualizer` as a dev dependency for visual analysis."

## Step 3: Identify Issues

Check for:

- Single chunks larger than 244KB (the recommended threshold for initial load)
- React and React-DOM not split into their own vendor chunk
- Duplicate dependencies appearing in multiple chunks
- Large utility libraries where only a subset of exports are used (lodash, date-fns, etc.)
- Assets (images, fonts) that are being inlined when they should be served as files

## Step 4: Propose Optimizations (in order of expected impact)

For each recommendation, include:

- Current state
- Proposed config or code change (exact diff)
- Expected impact (what it improves and by roughly how much)
- Risk (any behavior that could change)

Common interventions to consider:

1. `build.rollupOptions.output.manualChunks` to split vendor code
2. Dynamic `import()` at route boundaries for code splitting
3. `build.assetsInlineLimit` adjustment for asset handling
4. Switching from lodash to lodash-es for tree-shaking, or similar
5. `build.minify: 'esbuild'` if not already set

## Step 5: Confirm Before Applying

Present all recommendations ranked by impact.
Ask: "Which of these optimizations should I apply?"
Apply only the ones the user approves.

After applying, re-run `npx vite build --mode production` and compare chunk sizes before vs. after.
