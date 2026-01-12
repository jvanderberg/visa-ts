# Contributing to visa-ts

Thank you for your interest in contributing to visa-ts!

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/visa-ts.git
   cd visa-ts
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Building

```bash
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Linting

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

## Code Guidelines

### TypeScript

- Use strict TypeScript settings
- Prefer explicit types over `any`
- Document public APIs with JSDoc comments

### Error Handling

Use the `Result<T, E>` pattern instead of throwing exceptions:

```typescript
// Good
async function query(cmd: string): Promise<Result<string, Error>> {
  try {
    const response = await this.transport.query(cmd);
    return Ok(response);
  } catch (e) {
    return Err(e instanceof Error ? e : new Error(String(e)));
  }
}

// Avoid
async function query(cmd: string): Promise<string> {
  // Throwing exceptions for expected errors
  throw new Error('Connection failed');
}
```

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Classes/Interfaces**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`

### Commit Messages

Use conventional commits:

```
feat: add TCP/IP transport for LXI instruments
fix: handle timeout in USB-TMC binary reads
docs: update README with serial port examples
test: add unit tests for resource string parser
refactor: extract common transport logic
```

## Adding a New Transport

1. Create `src/transports/your-transport.ts`
2. Implement the `Transport` interface
3. Add factory function to create the transport
4. Register in `ResourceManager` for discovery
5. Add tests
6. Update documentation

Example structure:

```typescript
// src/transports/your-transport.ts
import type { Transport } from './transport.js';
import type { Result } from '../result.js';
import { Ok, Err } from '../result.js';

export interface YourTransportConfig {
  // Configuration options
}

export function createYourTransport(config: YourTransportConfig): Transport {
  return {
    async open() { /* ... */ },
    async close() { /* ... */ },
    async query(cmd) { /* ... */ },
    async write(cmd) { /* ... */ },
    isOpen() { /* ... */ },
  };
}
```

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add tests for new functionality
4. Follow the code style guidelines
5. Write a clear PR description

## Testing with Hardware

If you have test instruments available:

1. Connect your instrument
2. Run integration tests:
   ```bash
   npm run test:integration
   ```
3. Document any device-specific quirks you discover

## Questions?

Open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
