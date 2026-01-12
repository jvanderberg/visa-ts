# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working on this codebase.

## Project Overview

visa-ts is a TypeScript implementation of the VISA (Virtual Instrument Software Architecture) standard for communicating with test and measurement instruments. It's inspired by PyVISA and provides a similar API for Node.js/TypeScript applications.

## Architecture

```
src/
├── index.ts                    # Public API exports
├── types.ts                    # Core interfaces
├── result.ts                   # Result<T,E> error handling
├── resource-manager.ts         # ResourceManager (main entry point)
├── resource-string.ts          # VISA resource string parser
├── resources/
│   ├── base.ts                 # Resource base class
│   └── message-based.ts        # MessageBasedResource
├── transports/
│   ├── transport.ts            # Transport interface
│   ├── usbtmc.ts               # USB-TMC implementation
│   ├── serial.ts               # Serial port implementation
│   └── tcpip.ts                # TCP/IP socket (LXI)
└── util/
    └── scpi-parser.ts          # SCPI response parsing
```

## Key Patterns

### Result Type

All I/O operations return `Result<T, Error>` instead of throwing exceptions:

```typescript
const result = await instr.query('*IDN?');
if (result.ok) {
  console.log(result.value);
} else {
  console.error(result.error);
}
```

### Transport Interface

All transports implement the same interface:

```typescript
interface Transport {
  open(): Promise<Result<void, Error>>;
  close(): Promise<Result<void, Error>>;
  query(cmd: string): Promise<Result<string, Error>>;
  write(cmd: string): Promise<Result<void, Error>>;
  // ...
}
```

### Resource Strings

VISA resource strings follow the standard format:
- USB: `USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR`
- Serial: `ASRL/dev/ttyUSB0::INSTR`
- TCP/IP: `TCPIP0::192.168.1.100::5025::SOCKET`

## Development Commands

```bash
npm install          # Install dependencies
npm run build        # Build TypeScript
npm run test         # Run tests
npm run lint         # Run linter
```

## Testing - CRITICAL DIRECTIVE

**This project follows strict Red/Green TDD. This is non-negotiable.**

### Red/Green/Refactor Cycle

1. **RED**: Write a failing test first. The test must fail for the right reason.
2. **GREEN**: Write the minimum code to make the test pass.
3. **REFACTOR**: Clean up the code while keeping tests green.

**Never write implementation code without a failing test first.**

### Test Requirements

- **Test behavior, not implementation** - Tests should verify what the code does, not how it does it
- **No snapshot tests** - Every assertion must be intentional and meaningful
- **Cover all code paths** - Including error cases, edge cases, and corner cases
- **Test error handling explicitly** - Every `Err()` return path needs a test
- **Use descriptive test names** - `it('returns Err when device disconnects during read')`

### Test Structure

```typescript
describe('parseResourceString', () => {
  describe('USB resources', () => {
    it('parses valid USB resource string with all fields', () => {
      const result = parseResourceString('USB0::0x1AB1::0x04CE::DS1ZA123::INSTR');
      expect(result.ok).toBe(true);
      expect(result.value.type).toBe('USB');
      expect(result.value.vendorId).toBe(0x1AB1);
    });

    it('returns Err for malformed USB resource string', () => {
      const result = parseResourceString('USB0::invalid');
      expect(result.ok).toBe(false);
      expect(result.error.message).toContain('Invalid USB resource');
    });
  });
});
```

### Tools

- Unit tests use vitest
- Mock transports available for testing without hardware
- Integration tests require actual instruments (optional)

## Code Style

- Use TypeScript strict mode
- **NEVER THROW** - All errors must be returned via `Result<T, Error>`
  - No `throw` statements anywhere in the codebase
  - No relying on exceptions from dependencies - wrap in try/catch and return `Err()`
  - This makes error handling explicit and composable
- All public APIs should be documented with JSDoc
- **AVOID CLASSES** - Use factory functions and interfaces instead
  - Use `createResourceManager()` not `new ResourceManager()`
  - Use closures for private state, not private class fields
  - Return plain objects implementing interfaces
  - This improves tree-shaking, testing, and composition
