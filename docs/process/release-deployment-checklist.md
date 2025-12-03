# Release and Deployment Checklist

Consistent process for releases and deployments.

## Pre-Release Checklist

### Code Quality

- [ ] All tests passing
  ```bash
  deno task test
  ```
- [ ] No linting errors
  ```bash
  deno lint
  ```
- [ ] Code formatted
  ```bash
  deno fmt --check
  ```
- [ ] No TypeScript errors
  ```bash
  deno check src/server.ts
  ```

### Version Management

- [ ] Version number updated in `deno.json` (if applicable)
- [ ] Version follows [Semantic Versioning](https://semver.org/):
  - MAJOR: Breaking changes
  - MINOR: New features (backward compatible)
  - PATCH: Bug fixes (backward compatible)

### Documentation

- [ ] CHANGELOG.md updated with:
  - Version number and date
  - Added features
  - Changed behavior
  - Fixed bugs
  - Breaking changes (if any)
- [ ] README.md updated (if needed)
- [ ] API documentation updated (if endpoints changed)

### Dependencies

- [ ] Dependencies reviewed for security vulnerabilities
- [ ] Lock file (`deno.lock`) committed
- [ ] No unnecessary dependency updates in this release

## Release Process

### 1. Create Release Branch

```bash
git checkout main
git pull origin main
git checkout -b release/v1.2.0
```

### 2. Final Verification

- [ ] Run full test suite
- [ ] Manual smoke testing
- [ ] Review all changes since last release

### 3. Tag Version

```bash
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

### 4. Create GitHub Release

- [ ] Go to GitHub Releases
- [ ] Click "Draft a new release"
- [ ] Select the version tag
- [ ] Add release title: `v1.2.0`
- [ ] Copy changelog entries to release notes
- [ ] Publish release

### 5. Merge to Main

```bash
git checkout main
git merge release/v1.2.0
git push origin main
```

## Deployment Checklist

### Pre-Deployment

- [ ] Backup current deployment (if applicable)
- [ ] Verify environment variables are set
- [ ] Check database migrations (if any)
- [ ] Notify team of deployment

### Deployment

- [ ] Deploy to staging environment first
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Verify deployment successful

### Post-Deployment

- [ ] Verify application is running
  ```bash
  curl https://your-app.com/health
  ```
- [ ] Check application logs for errors
- [ ] Monitor error rates and performance
- [ ] Verify critical user flows work

## Rollback Procedure

If issues are discovered after deployment:

### 1. Assess Severity

- **Critical**: Immediate rollback
- **High**: Rollback within 1 hour
- **Medium**: Fix forward if possible
- **Low**: Fix in next release

### 2. Rollback Steps

```bash
# Revert to previous version
git checkout v1.1.0

# Or revert the merge commit
git revert -m 1 <merge-commit-hash>
```

### 3. Post-Rollback

- [ ] Verify rollback successful
- [ ] Notify team
- [ ] Create issue for the problem
- [ ] Investigate root cause

## Changelog Format

```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added

- New user authentication feature (#123)
- Password reset functionality (#124)

### Changed

- Improved error messages for validation (#125)

### Fixed

- Fixed null pointer in item creation (#126)

### Breaking Changes

- Removed deprecated `/api/v1/users` endpoint
```

## Version History

| Version | Date       | Notes               |
| ------- | ---------- | ------------------- |
| 1.2.0   | 2024-01-15 | Added auth features |
| 1.1.0   | 2024-01-01 | Added items feature |
| 1.0.0   | 2023-12-15 | Initial release     |
