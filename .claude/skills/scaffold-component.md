---
description: Scaffold a new React component with TypeScript following formatvault conventions. Usage: /scaffold-component <ComponentName> [optional: path/to/directory]
---

You are scaffolding a new React component for the formatvault project following its conventions.

Arguments: $ARGUMENTS
(First argument: ComponentName in PascalCase. Second argument: directory path, defaults to `src/components/`)

## Step 1: Validate Input
- Confirm the component name is PascalCase. If not, correct it and confirm with the user.
- Confirm the target directory exists or ask where to place it.
- Check if a component with this name already exists: search for `<ComponentName>.tsx` in `src/`.

## Step 2: Read Existing Conventions
Before generating, read 2-3 existing components in the target directory to understand:
- Import ordering convention
- Props interface naming and structure
- CSS module vs Tailwind vs styled-components usage
- Default export vs named export preference
- Whether barrel `index.ts` files are used

## Step 3: Generate Files

**`<ComponentName>.tsx`**
```typescript
import React from 'react'

export interface <ComponentName>Props {
  /** Accessible label for screen readers if the component has no visible label */
  'aria-label'?: string
  className?: string
  children?: React.ReactNode
}

export function <ComponentName>({ className, children, ...props }: <ComponentName>Props) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}
```

**`<ComponentName>.test.tsx`**
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { <ComponentName> } from './<ComponentName>'

describe('<ComponentName>', () => {
  it('renders without errors', () => {
    render(<<ComponentName> />)
  })

  it('renders children', () => {
    render(<<ComponentName>>test content</<ComponentName>>)
    expect(screen.getByText('test content')).toBeInTheDocument()
  })
})
```

**`index.ts`** (barrel export — only create if the directory already uses barrel files)
```typescript
export { <ComponentName> } from './<ComponentName>'
export type { <ComponentName>Props } from './<ComponentName>'
```

Adapt the generated code to match the conventions you found in Step 2.

## Step 4: Confirm Before Writing
Show the user:
1. The full content of each file with syntax highlighting
2. The exact paths where they will be created

Ask: "Should I create these files?"
Wait for confirmation before writing any file.
