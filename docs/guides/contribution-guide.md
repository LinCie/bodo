# Contribution Guide

Workflow for submitting changes to the project.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd <repo-name>
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/<org>/<repo-name>.git
   ```

## Branch Workflow

### Create a Feature Branch

Always branch from `main`:

```bash
git checkout main
git pull upstream main
git checkout -b feature/<ticket-id>-<short-description>
```

### Branch Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<ticket-id>-<description>` | `feature/123-user-authentication` |
| Bug fix | `fix/<ticket-id>-<description>` | `fix/456-login-validation` |
| Documentation | `docs/<description>` | `docs/api-reference` |
| Refactor | `refactor/<description>` | `refactor/user-repository` |

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style (formatting, semicolons) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |

### Examples

```bash
# Feature
git commit -m "feat(auth): add password reset functionality"

# Bug fix
git commit -m "fix(items): handle null description in item creation"

# Documentation
git commit -m "docs: update API endpoint documentation"

# With body
git commit -m "feat(auth): implement JWT refresh tokens

- Add refresh token generation
- Store refresh tokens in database
- Add token rotation on refresh

Closes #123"
```

## Pull Request Process

### Before Submitting

1. Ensure all tests pass:
   ```bash
   deno task test
   ```

2. Check for linting issues:
   ```bash
   deno lint
   ```

3. Format code:
   ```bash
   deno fmt
   ```

4. Update documentation if needed

### Creating a Pull Request

1. Push your branch:
   ```bash
   git push origin feature/<ticket-id>-<description>
   ```

2. Open a Pull Request on GitHub

3. Fill out the PR template:
   - Description of changes
   - Related issue/ticket
   - Type of change (feature, fix, etc.)
   - Testing performed
   - Checklist items

### PR Title Format

Follow the same convention as commit messages:

```
feat(auth): add password reset functionality
fix(items): handle null description in item creation
```

## Code Review Process

### For Authors

- Respond to feedback promptly
- Make requested changes in new commits (don't force-push during review)
- Mark conversations as resolved when addressed
- Request re-review after making changes

### For Reviewers

Use the [Code Review Checklist](../process/code-review-checklist.md) to ensure consistency.

Review for:
- Architecture compliance
- Error handling patterns
- Test coverage
- Code quality and readability
- Documentation

### Approval Requirements

- At least 1 approval required
- All CI checks must pass
- No unresolved conversations

## Merge Strategy

We use **squash and merge**:

- All commits in a PR are squashed into a single commit
- The PR title becomes the commit message
- Keeps main branch history clean

After merge:
- Delete your feature branch
- Pull latest main:
  ```bash
  git checkout main
  git pull upstream main
  ```

## Keeping Your Fork Updated

```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

## Questions?

- Check existing documentation
- Search closed issues/PRs
- Open a discussion or issue
