# Developer Documentation

Welcome to the developer documentation for this Deno + Hono application using
vertical slice architecture with clean architecture principles.

## Quick Navigation

### 🏗️ Architecture

Understanding the system structure and design decisions.

| Document                                                             | Description                                                         |
| -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [Architecture Overview](./architecture/architecture-overview.md)     | High-level system structure, technology stack, project layout       |
| [Architecture Principles](./architecture/architecture-principles.md) | Core design principles: dependency rule, Result type, soft deletion |
| [System Context](./architecture/system-context.md)                   | External interfaces, Deno runtime, database patterns                |
| [Architecture Rules](./architecture/architecture-rules.md)           | Required/prohibited patterns with DO/DON'T examples                 |
| [Module Boundaries](./architecture/module-boundaries.md)             | Layer dependencies, import rules, cross-slice communication         |

### 📖 Guides

Getting started and contributing to the project.

| Document                                             | Description                                             |
| ---------------------------------------------------- | ------------------------------------------------------- |
| [Developer Guide](./guides/developer-guide.md)       | Environment setup, running the app, project structure   |
| [Contribution Guide](./guides/contribution-guide.md) | PR workflow, commit conventions, code review process    |
| [Coding Guidelines](./guides/coding-guidelines.md)   | TypeScript conventions, naming, error handling, testing |

### ✅ Process

Checklists and rules for development workflows.

| Document                                                                    | Description                                              |
| --------------------------------------------------------------------------- | -------------------------------------------------------- |
| [Code Review Checklist](./process/code-review-checklist.md)                 | Review criteria for architecture, errors, tests, quality |
| [Feature Development Checklist](./process/feature-development-checklist.md) | Step-by-step guide for building new features             |
| [Release & Deployment Checklist](./process/release-deployment-checklist.md) | Version management, release process, deployment          |
| [Branching Rules](./process/branching-rules.md)                             | Branch naming, protection rules, merge strategy          |

## Getting Started

1. **New to the project?** Start with the
   [Developer Guide](./guides/developer-guide.md)
2. **Building a feature?** Follow the
   [Feature Development Checklist](./process/feature-development-checklist.md)
3. **Submitting changes?** Read the
   [Contribution Guide](./guides/contribution-guide.md)
4. **Reviewing code?** Use the
   [Code Review Checklist](./process/code-review-checklist.md)

## Technology Stack

| Technology     | Purpose                          |
| -------------- | -------------------------------- |
| **Deno**       | Runtime with built-in TypeScript |
| **Hono**       | Web framework for HTTP routing   |
| **Kysely**     | Type-safe SQL query builder      |
| **Zod**        | Schema validation                |
| **fast-check** | Property-based testing           |

## Key Concepts

- **Vertical Slice Architecture**: Features organized as self-contained slices
- **Clean Architecture**: Dependencies point inward toward domain
- **Result Type**: Explicit error handling without exceptions
- **Soft Deletion**: Records marked as deleted, never physically removed
- **Case Mapping**: snake_case (database) ↔ camelCase (TypeScript)

## Common Commands

```bash
# Development
deno task dev          # Start with hot reload

# Testing
deno task test         # Run all tests

# Production
deno task start        # Start production server
```
