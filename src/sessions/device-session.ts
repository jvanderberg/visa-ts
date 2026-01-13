/**
 * DeviceSession - Managed device session with command queuing and state tracking.
 *
 * @packageDocumentation
 */

import type { Result } from '../result.js';
import { Ok, Err } from '../result.js';
import type { MessageBasedResource } from '../resources/message-based-resource.js';
import type { DeviceSession, SessionState, ExecuteOptions } from './types.js';

// Re-export types for convenience
export type { SessionState, ExecuteOptions };

/**
 * Configuration for creating a DeviceSession.
 */
export interface DeviceSessionConfig {
  /** VISA resource string for this session */
  resourceString: string;

  /** Initial resource connection (null if disconnected) */
  resource?: MessageBasedResource | null;

  /** Max consecutive errors before marking as error state (default: 5) */
  maxConsecutiveErrors?: number;

  /** Callback for reconnection attempts */
  onReconnect?: () => Promise<Result<MessageBasedResource, Error>>;

  /** Callback when state changes */
  onStateChange?: (state: SessionState) => void;
}

/**
 * Extended DeviceSession interface with internal methods.
 */
export interface DeviceSessionInternal extends DeviceSession {
  /** Set the current status (for polling) */
  setStatus(status: unknown): void;

  /** Set or clear the resource connection */
  setResource(resource: MessageBasedResource | null): void;

  /** Close the session and underlying resource */
  close(): Promise<Result<void, Error>>;
}

interface QueuedTask<T> {
  fn: (resource: MessageBasedResource) => Promise<T>;
  timeout: number;
  resolve: (result: Result<T, Error>) => void;
}

/**
 * Create a new DeviceSession for managing a single device connection.
 *
 * @param config - Session configuration
 * @returns DeviceSession instance
 */
export function createDeviceSession(config: DeviceSessionConfig): DeviceSessionInternal {
  const {
    resourceString,
    resource: initialResource = null,
    maxConsecutiveErrors = 5,
    onReconnect,
    onStateChange,
  } = config;

  let resource: MessageBasedResource | null = initialResource;
  let state: SessionState = initialResource ? 'connected' : 'disconnected';
  let lastError: Error | null = null;
  let status: unknown = undefined;
  let consecutiveErrors = 0;

  const statusHandlers = new Set<(status: unknown) => void>();
  const taskQueue: QueuedTask<unknown>[] = [];
  let isProcessing = false;

  function setState(newState: SessionState): void {
    if (state !== newState) {
      state = newState;
      onStateChange?.(newState);
    }
  }

  function setError(error: Error): void {
    lastError = error;
    consecutiveErrors++;
    if (consecutiveErrors >= maxConsecutiveErrors) {
      setState('error');
    }
  }

  function resetErrors(): void {
    consecutiveErrors = 0;
    lastError = null;
  }

  async function disconnect(error: Error): Promise<void> {
    lastError = error;
    if (resource) {
      const currentResource = resource;
      resource = null;
      setState('disconnected');
      await currentResource.close();
    } else {
      setState('disconnected');
    }
  }

  async function processQueue(): Promise<void> {
    if (isProcessing) return;
    isProcessing = true;

    while (taskQueue.length > 0) {
      const task = taskQueue.shift()!;
      const result = await executeTask(task);
      task.resolve(result);
    }

    isProcessing = false;
  }

  async function executeTask<T>(task: QueuedTask<T>): Promise<Result<T, Error>> {
    const currentResource = resource;
    if (!currentResource) {
      return Err(new Error('Device not connected'));
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    let timedOut = false;
    const timeoutPromise = new Promise<Result<T, Error>>((resolve) => {
      timeoutId = setTimeout(() => {
        void (async () => {
          timedOut = true;
          const err = new Error(`Operation timeout after ${task.timeout}ms`);
          // Timeout is fatal - immediately disconnect (fail-fast)
          await disconnect(err);
          resolve(Err(err));
        })();
      }, task.timeout);
    });

    const taskPromise = (async (): Promise<Result<T, Error>> => {
      try {
        const result = await task.fn(currentResource);
        if (!timedOut) {
          resetErrors();
        }
        return Ok(result);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        if (!timedOut) {
          setError(err);
        }
        return Err(err);
      }
    })();

    try {
      return await Promise.race([taskPromise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId!);
    }
  }

  const session: DeviceSessionInternal = {
    get resource(): MessageBasedResource | null {
      return resource;
    },

    get resourceString(): string {
      return resourceString;
    },

    get state(): SessionState {
      return state;
    },

    get lastError(): Error | null {
      return lastError;
    },

    get status(): unknown {
      return status;
    },

    onStatus(handler: (status: unknown) => void): () => void {
      statusHandlers.add(handler);
      return () => {
        statusHandlers.delete(handler);
      };
    },

    setStatus(newStatus: unknown): void {
      status = newStatus;
      for (const handler of statusHandlers) {
        handler(newStatus);
      }
    },

    setResource(newResource: MessageBasedResource | null): void {
      resource = newResource;
      if (newResource) {
        setState('connected');
        resetErrors();
      } else {
        setState('disconnected');
      }
    },

    async execute<T>(
      fn: (resource: MessageBasedResource) => Promise<T>,
      options?: ExecuteOptions
    ): Promise<Result<T, Error>> {
      const timeout = options?.timeout ?? 30000;

      return new Promise((resolve) => {
        taskQueue.push({
          fn: fn as (resource: MessageBasedResource) => Promise<unknown>,
          timeout,
          resolve: resolve as (result: Result<unknown, Error>) => void,
        });
        void processQueue();
      });
    },

    async reconnect(): Promise<Result<void, Error>> {
      if (!onReconnect) {
        return Err(new Error('No reconnect handler configured'));
      }

      setState('connecting');

      const result = await onReconnect();
      if (result.ok) {
        resource = result.value;
        setState('connected');
        resetErrors();
        return Ok(undefined);
      } else {
        lastError = result.error;
        setState('error');
        return Err(result.error);
      }
    },

    async close(): Promise<Result<void, Error>> {
      if (resource) {
        const closeResult = await resource.close();
        resource = null;
        setState('disconnected');
        if (!closeResult.ok) {
          return closeResult;
        }
      } else {
        setState('disconnected');
      }
      return Ok(undefined);
    },
  };

  return session;
}
