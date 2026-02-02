# AI Agent Instructions

> **CRITICAL**: These rules are NON-NEGOTIABLE. Context compaction does not exempt you.
> Re-read this file if context was truncated. Run `bunx tsc --noEmit` before completing ANY task.

## Skills (Load with `skill` tool)

| Skill                 | When to Use                              |
| --------------------- | ---------------------------------------- |
| `codebase-navigation` | Finding code, understanding structure    |
| `git-commit`          | Committing changes after task completion |

In case failed to retrieve the skill, register it from @.opencode/skills/

## Architecture Laws

### File Size Limits

- **MAX 300 lines per file** - Split at 250 lines proactively
- **Monolithic = FAILURE** - One file doing multiple things is a bug
- When file exceeds limit → create `<name>-impl/` directory with submodules

### Module Structure Pattern

```
src/lib/feature.ts              ← Facade (10-20 lines, re-exports only)
src/lib/feature-impl/
  ├── index.ts                  ← Barrel exports + AI AGENT WARNING
  ├── types.ts                  ← Type definitions
  ├── <concern-1>.ts            ← Single responsibility
  ├── <concern-2>.ts            ← Single responsibility
  └── ...
```

### AI Agent Warning Header (REQUIRED in every index.ts)

```typescript
/**
 * <Module Name>
 *
 * ⚠️ AI AGENTS: This module is split into submodules:
 * - types.ts: Type definitions
 * - <file>.ts: <description>
 * Do NOT create monolithic files. Follow the pattern.
 */
```

## Bun Runtime (NOT Node.js)

| Use                | Don't Use             |
| ------------------ | --------------------- |
| `bun <file>`       | `node`, `ts-node`     |
| `bun test`         | `jest`, `vitest`      |
| `bun install`      | `npm`, `yarn`, `pnpm` |
| `bun run <script>` | `npm run`             |
| `Bun.file()`       | `fs.readFile()`       |
| `Bun.sql`          | `pg`, `postgres.js`   |
| `Bun.redis`        | `ioredis`             |
| `WebSocket`        | `ws`                  |
| `Bun.$\`cmd\``     | `execa`               |

Bun auto-loads `.env` - no dotenv needed.

## Verification Commands (RUN BEFORE COMPLETING TASK)

```bash
bunx tsc --noEmit    # Type check - MUST PASS
```

## Code Discovery Protocol

Before writing ANY code:

1. `grep -r "pattern" src/` - Find existing implementations
2. Read 3-5 similar files - Match patterns exactly
3. Check `src/lib/` for utilities - Don't reinvent
4. Check types in `src/lib/*/types.ts` - Reuse, don't duplicate

## Naming Conventions

| Element          | Pattern               | Example                 |
| ---------------- | --------------------- | ----------------------- |
| Files            | kebab-case            | `email-filter.ts`       |
| Functions        | camelCase, verb-first | `parseEmailHeaders()`   |
| Types/Interfaces | PascalCase            | `EmailAttachment`       |
| Constants        | SCREAMING_SNAKE       | `MAX_RETRY_COUNT`       |
| Directories      | kebab-case            | `ingestion-email-impl/` |

## Type Safety Rules

- **Explicit return types** on all exported functions
- **No `any`** - Use `unknown` + type guards
- **No `as` casts** - Use proper narrowing
- **No `!` assertions** - Handle null/undefined properly

## Error Handling Pattern

```typescript
// GOOD - Specific, typed, propagates context
class EmailFetchError extends Error {
  constructor(public code: string, message: string, public cause?: Error) {
    super(`[${code}] ${message}`);
  }
}

// BAD - Generic, loses context
catch (err) { console.log(err); }
```

## Testing Pattern

```typescript
import { test, expect, describe } from "bun:test";

describe("ModuleName", () => {
  test("should <expected behavior> when <condition>", () => {
    // Arrange
    // Act
    // Assert with specific expectations
  });
});
```

Tests must:

- Reflect real usage
- Be verbose for debugging
- Reveal flaws, not just pass

## Git Operations & Automation

### Automation Rule

**AFTER COMPLETING A TASK:**

1. Run verification (`bunx tsc --noEmit && bun run build`)
2. If successful, AUTOMATICALLY load the `git-commit` skill
3. Perform the commit without waiting for user prompt
4. Report the commit hash and message to the user

### Commit Style

Format: `<type>(<scope>): <subject>`

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`

```bash
# Good
feat(email): add attachment download retry logic
fix(workflow): handle null edge case in scheduler
refactor(sftp): split into submodules

# Bad
update code
fix bug
wip
```

## ABSOLUTE PROHIBITIONS

| Violation                     | Why It's Wrong             |
| ----------------------------- | -------------------------- |
| `// TODO`, `// FIXME`         | Ship complete code         |
| `// simplified for now`       | No partial implementations |
| Magic numbers/strings         | Use named constants        |
| `catch(e) { console.log(e) }` | Handle errors properly     |
| Duplicating functions         | Search first, reuse        |
| Files > 300 lines             | Split into submodules      |
| `any` type                    | Use proper types           |
| Dead code                     | Delete it                  |
| Inconsistent APIs             | Match existing patterns    |
| Callback hell                 | Use async/await            |

## Context Recovery Checklist

If context was compacted, verify:

- [ ] Read this file completely
- [ ] Understand module structure from `src/lib/*/index.ts` headers
- [ ] Run `bunx tsc --noEmit` before changes
- [ ] Run `bun run build` after changes
- [ ] Check file line counts - split if > 250

## Quick Reference

```bash
# Development
bun run dev              # Start dev server
bunx tsc --noEmit        # Type check

# File structure check
wc -l src/lib/**/*.ts | sort -n      # Find large files
```
