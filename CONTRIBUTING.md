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

## Test-Driven Development (TDD) - CRITICAL

**This project mandates strict Red/Green TDD. This is a non-negotiable requirement.**

### The TDD Cycle

Every feature and bug fix must follow this cycle:

1. **RED** - Write a failing test first
   - The test must fail
   - The test must fail for the right reason (not syntax errors)
   - Run the test and verify it fails

2. **GREEN** - Write minimal code to pass
   - Write only enough code to make the test pass
   - Do not add extra functionality
   - Run the test and verify it passes

3. **REFACTOR** - Clean up while green
   - Improve code quality
   - Remove duplication
   - Tests must stay green throughout

### Test Quality Requirements

Tests must be meaningful and comprehensive:

```typescript
// ✅ GOOD - Tests specific behavior
it('returns Err when read times out after specified duration', async () => {
  const transport = createMockTransport({ readDelay: 1000 });
  const resource = createMessageBasedResource(transport, 'USB0::...');
  resource.timeout = 100;

  const result = await resource.read();

  expect(result.ok).toBe(false);
  expect(result.error.message).toContain('timeout');
});

// ✅ GOOD - Tests error path explicitly
it('returns Err with device info when connection fails', async () => {
  const result = await rm.openResource('USB0::0xFFFF::0xFFFF::INVALID::INSTR');

  expect(result.ok).toBe(false);
  expect(result.error.message).toContain('0xFFFF');
});

// ❌ BAD - Snapshot test (not meaningful)
it('matches snapshot', () => {
  expect(result).toMatchSnapshot();
});

// ❌ BAD - Tests implementation, not behavior
it('calls internal method', () => {
  expect(spy).toHaveBeenCalledTimes(1);
});

// ❌ BAD - No assertion on error content
it('fails', async () => {
  const result = await resource.read();
  expect(result.ok).toBe(false);  // What error? Why?
});
```

### Coverage Requirements

Every function must have tests for:

- **Happy path** - Normal successful operation
- **Error cases** - Every `Err()` return must have a corresponding test
- **Edge cases** - Empty inputs, boundary values, null/undefined
- **Corner cases** - Unusual but valid combinations

### Test File Organization

```
test/
├── result.test.ts           # Unit tests for Result type
├── resource-string.test.ts  # Unit tests for parser
├── transports/
│   ├── usbtmc.test.ts       # USB-TMC transport tests
│   ├── serial.test.ts       # Serial transport tests
│   └── tcpip.test.ts        # TCP/IP transport tests
└── integration/
    └── real-device.test.ts  # Hardware tests (optional)
```

---

## Code Guidelines

### TypeScript

- Use strict TypeScript settings
- Prefer explicit types over `any`
- Document public APIs with JSDoc comments

### Error Handling

**NEVER THROW.** All errors must be returned via `Result<T, Error>`. This is a strict rule - no exceptions.

```typescript
// CORRECT - Return errors via Result
async function query(cmd: string): Promise<Result<string, Error>> {
  try {
    const response = await transport.query(cmd);
    return Ok(response);
  } catch (e) {
    // Wrap any exceptions from dependencies
    return Err(e instanceof Error ? e : new Error(String(e)));
  }
}

// WRONG - Never throw
async function query(cmd: string): Promise<string> {
  throw new Error('Connection failed');  // ❌ NEVER DO THIS
}

// WRONG - Never let exceptions propagate
async function query(cmd: string): Promise<Result<string, Error>> {
  const response = await transport.query(cmd);  // ❌ Could throw!
  return Ok(response);
}
```

When calling external libraries that may throw, always wrap in try/catch:

```typescript
// Wrap external library calls
function openPort(path: string): Result<SerialPort, Error> {
  try {
    const port = new SerialPort({ path, baudRate: 9600 });
    return Ok(port);
  } catch (e) {
    return Err(e instanceof Error ? e : new Error(String(e)));
  }
}
```

### File Size and Modularity

- **Keep files under 300 lines** - If a file exceeds this, split it
- Extract reusable utilities to `src/util/` (e.g., `binary-block.ts`, `ascii-values.ts`)
- Each file should have a single, clear responsibility
- Prefer many small, focused modules over few large ones
- When in doubt, split it out

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

1. **Tests must exist first** - PRs without tests will be rejected
2. Ensure all tests pass
3. Tests must cover happy paths, error cases, and edge cases
4. Update documentation if needed
5. Follow the code style guidelines (no throw, no classes)
6. Write a clear PR description

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
