# Git Commit Skill

Use this skill when you have completed a unit of work (feature, fix, refactor, etc.) and need to save your changes.

## 1. Verify Status

Run these commands in parallel to understand the current state:

```bash
git status
git diff --cached
git diff
```

## 2. Stage Changes

Use `.` for the changes.

```bash
git add .
```

## 3. Commit

Create a commit message following the Conventional Commits format: `<type>(<scope>): <subject>`

Types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation

Example:

```bash
git commit -m "fix(writer): resolve stack overflow in large excel generation"
```

## 4. Verification

Verify the commit was successful:

```bash
git log -1
git status
```
