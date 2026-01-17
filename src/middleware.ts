/**
 * Middleware for intercepting and transforming SCPI communication.
 *
 * Middleware wraps a MessageBasedResource to intercept query/write operations.
 * Use cases include logging, debugging, retrying, and patching device quirks.
 *
 * @packageDocumentation
 */

import { Ok, type Result } from './result.js';
import type { MessageBasedResource } from './resources/message-based-resource.js';

/**
 * Middleware function type.
 *
 * Middleware intercepts SCPI commands and can:
 * - Log commands and responses
 * - Transform commands before sending
 * - Transform responses before returning
 * - Retry failed operations
 * - Add delays or other side effects
 *
 * @param cmd - The SCPI command being sent
 * @param next - Function to call the next middleware (or the actual resource)
 * @returns The result from the operation
 *
 * @example
 * ```typescript
 * const loggingMiddleware: Middleware = async (cmd, next) => {
 *   console.log('>', cmd);
 *   const result = await next(cmd);
 *   if (result.ok) console.log('<', result.value);
 *   return result;
 * };
 * ```
 */
export type Middleware = (
  cmd: string,
  next: (cmd: string) => Promise<Result<unknown, Error>>
) => Promise<Result<unknown, Error>>;

/**
 * Wrap a MessageBasedResource with middleware.
 *
 * Returns a new resource that passes all query/write operations through
 * the middleware chain. The original resource is not modified.
 *
 * @param resource - The resource to wrap
 * @param middleware - Array of middleware functions (executed in order)
 * @returns A new resource with middleware applied
 *
 * @example
 * ```typescript
 * const debugResource = withMiddleware(resource, [
 *   loggingMiddleware(),
 *   retryMiddleware({ maxRetries: 3 }),
 * ]);
 *
 * const psu = await driver.connect(debugResource);
 * ```
 */
export function withMiddleware(
  resource: MessageBasedResource,
  middleware: Middleware[]
): MessageBasedResource {
  // Create a next function for a specific position in the chain
  const createQueryNext = (index: number): ((cmd: string) => Promise<Result<unknown, Error>>) => {
    return (cmd: string) => {
      const mw = middleware[index];
      if (mw) {
        // Each middleware gets a fresh next that starts from the next position
        return mw(cmd, createQueryNext(index + 1));
      }
      // End of chain - call actual resource
      return resource.query(cmd) as Promise<Result<unknown, Error>>;
    };
  };

  const chainQuery = (cmd: string): Promise<Result<string, Error>> => {
    return createQueryNext(0)(cmd) as Promise<Result<string, Error>>;
  };

  // Create a next function for write operations
  const createWriteNext = (index: number): ((cmd: string) => Promise<Result<unknown, Error>>) => {
    return (cmd: string) => {
      const mw = middleware[index];
      if (mw) {
        // Each middleware gets a fresh next that starts from the next position
        return mw(cmd, createWriteNext(index + 1));
      }
      // End of chain - call actual resource
      return resource.write(cmd) as Promise<Result<unknown, Error>>;
    };
  };

  const chainWrite = (cmd: string): Promise<Result<void, Error>> => {
    return createWriteNext(0)(cmd) as Promise<Result<void, Error>>;
  };

  // Return a proxy that intercepts query/write
  return {
    // Pass through all properties
    get resourceString() {
      return resource.resourceString;
    },
    get resourceInfo() {
      return resource.resourceInfo;
    },
    get timeout() {
      return resource.timeout;
    },
    set timeout(value: number) {
      resource.timeout = value;
    },
    get writeTermination() {
      return resource.writeTermination;
    },
    set writeTermination(value: string) {
      resource.writeTermination = value;
    },
    get readTermination() {
      return resource.readTermination;
    },
    set readTermination(value: string) {
      resource.readTermination = value;
    },
    get chunkSize() {
      return resource.chunkSize;
    },
    set chunkSize(value: number) {
      resource.chunkSize = value;
    },
    get isOpen() {
      return resource.isOpen;
    },

    // Intercepted methods
    query: (cmd, options) => {
      // If options provided, pass through without middleware
      // (middleware doesn't handle options)
      if (options) {
        return resource.query(cmd, options);
      }
      return chainQuery(cmd);
    },

    write: (cmd) => chainWrite(cmd),

    // Pass through all other methods unchanged
    read: () => resource.read(),
    queryBinaryValues: ((command: string, datatype?: unknown, container?: unknown) =>
      resource.queryBinaryValues(
        command,
        datatype as Parameters<MessageBasedResource['queryBinaryValues']>[1],
        container as Parameters<MessageBasedResource['queryBinaryValues']>[2]
      )) as MessageBasedResource['queryBinaryValues'],
    writeBinaryValues: ((command: string, values: unknown, datatype?: unknown) =>
      resource.writeBinaryValues(
        command,
        values as Parameters<MessageBasedResource['writeBinaryValues']>[1],
        datatype as Parameters<MessageBasedResource['writeBinaryValues']>[2]
      )) as MessageBasedResource['writeBinaryValues'],
    queryBinary: (cmd) => resource.queryBinary(cmd),
    readBinary: () => resource.readBinary(),
    queryAsciiValues: (...args: Parameters<MessageBasedResource['queryAsciiValues']>) =>
      resource.queryAsciiValues(...args),
    readAsciiValues: (...args: Parameters<MessageBasedResource['readAsciiValues']>) =>
      resource.readAsciiValues(...args),
    writeAsciiValues: (...args: Parameters<MessageBasedResource['writeAsciiValues']>) =>
      resource.writeAsciiValues(...args),
    writeRaw: (data) => resource.writeRaw(data),
    readRaw: (size) => resource.readRaw(size),
    readBytes: (count) => resource.readBytes(count),
    clear: () => resource.clear(),
    trigger: () => resource.trigger(),
    readStb: () => resource.readStb(),
    close: () => resource.close(),
  };
}

// ─────────────────────────────────────────────────────────────────
// Built-in Middleware
// ─────────────────────────────────────────────────────────────────

/**
 * Options for the logging middleware.
 */
export interface LoggingMiddlewareOptions {
  /**
   * Custom log function. Defaults to console.log.
   */
  log?: (message: string) => void;

  /**
   * Prefix for outgoing commands. Defaults to '>'.
   */
  sendPrefix?: string;

  /**
   * Prefix for incoming responses. Defaults to '<'.
   */
  receivePrefix?: string;

  /**
   * Whether to log errors. Defaults to true.
   */
  logErrors?: boolean;

  /**
   * Whether to include timestamps. Defaults to false.
   */
  timestamps?: boolean;
}

/**
 * Create a logging middleware that logs all SCPI traffic.
 *
 * @param options - Logging options
 * @returns Middleware function
 *
 * @example
 * ```typescript
 * // Basic usage
 * const debugResource = withMiddleware(resource, [loggingMiddleware()]);
 *
 * // Custom options
 * const debugResource = withMiddleware(resource, [
 *   loggingMiddleware({
 *     log: (msg) => myLogger.debug(msg),
 *     timestamps: true,
 *   }),
 * ]);
 * ```
 */
export function loggingMiddleware(options: LoggingMiddlewareOptions = {}): Middleware {
  const {
    log = console.log,
    sendPrefix = '>',
    receivePrefix = '<',
    logErrors = true,
    timestamps = false,
  } = options;

  const formatMessage = (prefix: string, message: string): string => {
    if (timestamps) {
      const ts = new Date().toISOString();
      return `[${ts}] ${prefix} ${message}`;
    }
    return `${prefix} ${message}`;
  };

  return async (cmd, next) => {
    log(formatMessage(sendPrefix, cmd));

    const result = await next(cmd);

    if (result.ok) {
      // Only log if there's a response (queries return string, writes return void)
      if (result.value !== undefined) {
        const response = String(result.value);
        // Truncate very long responses
        const displayResponse = response.length > 200 ? response.slice(0, 200) + '...' : response;
        log(formatMessage(receivePrefix, displayResponse));
      }
    } else if (logErrors) {
      log(formatMessage('!', `Error: ${result.error.message}`));
    }

    return result;
  };
}

/**
 * Options for the retry middleware.
 */
export interface RetryMiddlewareOptions {
  /**
   * Maximum number of retry attempts. Defaults to 3.
   */
  maxRetries?: number;

  /**
   * Delay between retries in milliseconds. Defaults to 100.
   */
  retryDelay?: number;

  /**
   * Function to determine if an error is retryable.
   * Defaults to retrying all errors.
   */
  isRetryable?: (error: Error) => boolean;

  /**
   * Callback when a retry occurs.
   */
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Create a retry middleware that retries failed operations.
 *
 * @param options - Retry options
 * @returns Middleware function
 *
 * @example
 * ```typescript
 * const reliableResource = withMiddleware(resource, [
 *   retryMiddleware({
 *     maxRetries: 3,
 *     retryDelay: 100,
 *     isRetryable: (err) => err.message.includes('timeout'),
 *   }),
 * ]);
 * ```
 */
export function retryMiddleware(options: RetryMiddlewareOptions = {}): Middleware {
  const { maxRetries = 3, retryDelay = 100, isRetryable = () => true, onRetry } = options;

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  return async (cmd, next) => {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await next(cmd);

      if (result.ok) {
        return result;
      }

      lastError = result.error;

      // Check if we should retry
      if (attempt < maxRetries && isRetryable(result.error)) {
        onRetry?.(result.error, attempt + 1);
        await delay(retryDelay);
      } else {
        return result;
      }
    }

    // Should never reach here, but TypeScript needs it
    return { ok: false, error: lastError! } as Result<unknown, Error>;
  };
}

/**
 * Create a middleware that transforms responses.
 *
 * @param transform - Function to transform the response string
 * @returns Middleware function
 *
 * @example
 * ```typescript
 * // Trim whitespace from responses
 * const cleanResource = withMiddleware(resource, [
 *   responseTransformMiddleware((resp) => resp.trim()),
 * ]);
 *
 * // Fix device that returns wrong line endings
 * const fixedResource = withMiddleware(resource, [
 *   responseTransformMiddleware((resp) => resp.replace(/\r\n/g, '\n')),
 * ]);
 * ```
 */
export function responseTransformMiddleware(transform: (response: string) => string): Middleware {
  return async (cmd, next) => {
    const result = await next(cmd);

    if (result.ok && typeof result.value === 'string') {
      return Ok(transform(result.value));
    }

    return result;
  };
}

/**
 * Create a middleware that transforms commands before sending.
 *
 * @param transform - Function to transform the command string
 * @returns Middleware function
 *
 * @example
 * ```typescript
 * // Add prefix to all commands
 * const prefixedResource = withMiddleware(resource, [
 *   commandTransformMiddleware((cmd) => `:SYST:${cmd}`),
 * ]);
 * ```
 */
export function commandTransformMiddleware(transform: (cmd: string) => string): Middleware {
  return async (cmd, next) => {
    return next(transform(cmd));
  };
}
