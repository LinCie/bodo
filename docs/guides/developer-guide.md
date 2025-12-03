# Developer Guide

Environment setup and daily development workflow.

## Prerequisites

### Install Deno

**macOS/Linux:**
```bash
curl -fsSL https://deno.land/install.sh | sh
```

**Windows (PowerShell):**
```powershell
irm https://deno.land/install.ps1 | iex
```

**Verify installation:**
```bash
deno --version
```

### IDE Setup

**VS Code** (Recommended):
1. Install the [Deno extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno)
2. Enable Deno for the workspace (Cmd/Ctrl+Shift+P → "Deno: Initialize Workspace Configuration")

The project includes VS Code settings in `.vscode/` for consistent configuration.

## Repository Setup

```bash
# Clone the repository
git clone <repository-url>
cd <project-name>

# Cache dependencies (optional, happens automatically on first run)
deno cache src/server.ts
```

## Running the Application

### Development Mode

```bash
deno task dev
```

This starts the server with:
- File watching (auto-restart on changes)
- Pretty-printed logs via pino-pretty
- Required permissions (`--allow-net`, `--allow-env`, `--allow-sys`)

### Production Mode

```bash
deno task start
```

Runs with minimal permissions (`--allow-net` only).

## Running Tests

### All Tests

```bash
deno task test
```

### Specific Test File

```bash
deno test --allow-all test/shared/domain/result.test.ts
```

### Watch Mode (for development)

```bash
deno test --allow-all --watch
```

### Test Coverage

```bash
deno test --allow-all --coverage=coverage
deno coverage coverage
```

## Project Structure

```
.
├── deno.json              # Deno configuration, tasks, import map
├── deno.lock              # Dependency lock file
├── src/
│   ├── server.ts          # Application entry point
│   ├── features/          # Feature slices
│   │   ├── auth/          # Authentication feature
│   │   │   ├── domain/        # Entities, value objects
│   │   │   ├── application/   # Use cases, DTOs
│   │   │   ├── infrastructure/# Repositories
│   │   │   └── presentation/  # HTTP handlers
│   │   └── items/         # Items feature
│   │       └── ...
│   └── shared/            # Shared code
│       ├── domain/        # BaseEntity, Result, errors
│       ├── application/   # Validation utilities
│       ├── infrastructure/# Mappers, middlewares
│       └── presentation/  # Common HTTP utilities
├── test/                  # Test files (mirrors src/ structure)
│   └── shared/
│       ├── domain/
│       └── application/
└── docs/                  # Documentation
```

## Key Files

| File | Purpose |
|------|---------|
| `deno.json` | Tasks, import map, compiler options |
| `src/server.ts` | Hono app setup, middleware, routes |
| `src/shared/domain/entity.ts` | BaseEntity class |
| `src/shared/domain/result.ts` | Result type for error handling |
| `src/shared/domain/errors.ts` | Domain error classes |
| `src/shared/domain/repository.ts` | BaseRepository interface |
| `src/shared/application/validation.ts` | Zod validation helper |
| `src/shared/infrastructure/mappers/` | Case conversion utilities |

## Common Tasks

### Adding a New Feature

See [Feature Development Checklist](../process/feature-development-checklist.md) for step-by-step guide.

### Import Aliases

Use `#/` for imports from `src/`:

```typescript
import { Result } from "#/shared/domain/result.ts";
import { validate } from "#/shared/application/validation.ts";
```

### Debugging

Deno supports Chrome DevTools debugging:

```bash
deno run --inspect-brk --allow-all src/server.ts
```

Then open `chrome://inspect` in Chrome.

## Environment Variables

Configure via environment variables or `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | 8000 |
| `DATABASE_URL` | Database connection string | - |
| `LOG_LEVEL` | Logging level | info |

## Troubleshooting

### Permission Errors

Ensure you're running with required permissions:
```bash
deno run --allow-net --allow-env --allow-sys src/server.ts
```

### Import Errors

Clear the Deno cache:
```bash
deno cache --reload src/server.ts
```

### Type Errors

Ensure the Deno extension is enabled in VS Code and restart the TypeScript server.
