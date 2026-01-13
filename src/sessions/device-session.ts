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

  /** Function to poll device status (optional) */
  pollFn?: (resource: MessageBasedResource) => Promise<unknown>;

  /** Interval between polls in ms (default: 250) */
  pollInterval?: number;
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
    pollFn,
    pollInterval = 250,
  } = config;

  let resource: MessageBasedResource | null = initialResource;
  let state: SessionState = initialResource ? 'connected' : 'disconnected';
  let lastError: Error | null = null;
  let status: unknown = undefined;
  let consecutiveErrors = 0;

  const statusHandlers = new Set<(status: unknown) => void>();
  const taskQueue: QueuedTask<unknown>[] = [];
  let isProcessing = false;

  // Polling state
  let pollTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let isPolling = false;
  let pollPromise: Promise<void> | null = null;
  let isClosed = false;

  // Reconnection state
  let reconnectPromise: Promise<Result<void, Error>> | null = null;

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
    stopPolling();
    if (resource) {
      const currentResource = resource;
      resource = null;
      setState('disconnected');
      await currentResource.close();
    } else {
      setState('disconnected');
    }
  }

  function stopPolling(): void {
    if (pollTimeoutId !== null) {
      clearTimeout(pollTimeoutId);
      pollTimeoutId = null;
    }
  }

  function scheduleNextPoll(): void {
    if (isClosed || !pollFn || !resource || state === 'error') return;
    pollTimeoutId = setTimeout(() => {
      void doPoll();
    }, pollInterval);
  }

  async function doPoll(): Promise<void> {
    pollTimeoutId = null;
    if (isClosed || !pollFn || !resource) return;

    const currentResource = resource;
    isPolling = true;
    const previousState = state;
    setState('polling');

    pollPromise = (async () => {
      try {
        const result = await pollFn(currentResource);
        if (!isClosed && resource === currentResource) {
          status = result;
          for (const handler of statusHandlers) {
            handler(result);
          }
          resetErrors();
          setState('connected');
        }
      } catch (error) {
        if (!isClosed && resource === currentResource) {
          const err = error instanceof Error ? error : new Error(String(error));
          setError(err);
          // If we hit maxConsecutiveErrors, state is already 'error' - stop polling
          if (consecutiveErrors >= maxConsecutiveErrors) {
            stopPolling();
            return;
          }
          setState(previousState === 'polling' ? 'connected' : previousState);
        }
      } finally {
        isPolling = false;
        pollPromise = null;
        scheduleNextPoll();
      }
    })();

    await pollPromise;
  }

  function startPolling(): void {
    if (pollFn && resource && !isClosed && pollTimeoutId === null && !isPolling) {
      // Schedule first poll immediately (next tick), then subsequent polls after interval
      pollTimeoutId = setTimeout(() => {
        void doPoll();
      }, 0);
    }
  }

  async function attemptReconnect(): Promise<Result<void, Error>> {
    if (!onReconnect) {
      return Err(new Error('Device not connected (no reconnect handler configured)'));
    }

    // If already reconnecting, wait for that attempt
    if (reconnectPromise) {
      return reconnectPromise;
    }

    setState('connecting');

    reconnectPromise = (async (): Promise<Result<void, Error>> => {
      try {
        const result = await onReconnect();
        if (result.ok) {
          resource = result.value;
          setState('connected');
          resetErrors();
          startPolling();
          return Ok(undefined);
        } else {
          lastError = result.error;
          setState('error');
          return Err(result.error);
        }
      } finally {
        reconnectPromise = null;
      }
    })();

    return reconnectPromise;
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
      // If disconnected, attempt reconnection first
      if (!resource) {
        const reconnectResult = await attemptReconnect();
        if (!reconnectResult.ok) {
          return Err(reconnectResult.error);
        }
      }

      const currentResource = resource;
      if (!currentResource) {
        return Err(new Error('Device not connected'));
      }

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
        startPolling();
      } else {
        stopPolling();
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
      return attemptReconnect();
    },

    async close(): Promise<Result<void, Error>> {
      isClosed = true;
      stopPolling();

      // Wait for in-flight poll to complete
      if (pollPromise) {
        await pollPromise;
      }

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

  // Start polling if we have an initial resource and pollFn
  if (initialResource && pollFn) {
    startPolling();
  }

  return session;
}
