# Skill: Refactor Large File

## When to Use

When a file exceeds 250 lines or has multiple responsibilities.

## Steps

1. **Create impl directory**

```bash
mkdir src/lib/<module>-impl
```

2. **Extract types first**

```
src/lib/<module>-impl/types.ts
```

3. **Split by responsibility**

- One concern per file
- Max 200 lines each
- Clear, specific names

4. **Create barrel index with AI warning**

```typescript
/**
 * <Module Name>
 *
 * ⚠️ AI AGENTS: This module is split into submodules:
 * - types.ts: Type definitions
 * - <file>.ts: <description>
 * Do NOT create monolithic files.
 */

export { ... } from "./types";
export { ... } from "./<submodule>";
```

5. **Replace original with facade**

```typescript
/**
 * ⚠️ AI AGENTS: This file is a facade.
 * Implementation is in <module>-impl/
 */
export { ... } from "./<module>-impl";
```

6. **Verify**

```bash
bunx tsc --noEmit && bun run build
```
