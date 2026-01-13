/**
 * SessionManager - Manages multiple device sessions with automatic discovery.
 *
 * @packageDocumentation
 */

import type { ResourceManager } from '../resource-manager-types.js';
import type { ResourceInfo } from '../types.js';
import { matchResourcePattern } from '../resource-string.js';
import { createDeviceSession, type DeviceSessionInternal } from './device-session.js';
import type {
  SessionManager,
  SessionManagerOptions,
  DeviceSession,
  SessionAddedHandler,
  SessionRemovedHandler,
  SessionStateChangedHandler,
} from './types.js';

/**
 * Extended options for internal use.
 */
export interface SessionManagerConfig extends SessionManagerOptions {
  /** ResourceManager instance for device discovery and connection */
  resourceManager: ResourceManager;
}

type EventHandler = SessionAddedHandler | SessionRemovedHandler | SessionStateChangedHandler;

/**
 * Create a new SessionManager for managing multiple device sessions.
 *
 * @param config - Session manager configuration
 * @returns SessionManager instance
 */
export function createSessionManager(config: SessionManagerConfig): SessionManager {
  const {
    resourceManager,
    scanInterval = 5000,
    maxConsecutiveErrors = 5,
    autoReconnect = true,
    filter,
  } = config;

  const sessions = new Map<string, DeviceSessionInternal>();
  const eventHandlers = new Map<string, Set<EventHandler>>();
  let scanTimer: ReturnType<typeof setInterval> | null = null;
  let isRunning = false;

  function emit(event: string, arg: DeviceSession | string): void {
    const handlers = eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        (handler as (arg: DeviceSession | string) => void)(arg);
      }
    }
  }

  function matchesFilter(resourceString: string, info?: ResourceInfo): boolean {
    if (!filter) return true;

    if (typeof filter === 'string') {
      return matchResourcePattern(resourceString, filter);
    }

    if (filter instanceof RegExp) {
      return filter.test(resourceString);
    }

    if (typeof filter === 'function') {
      return filter(resourceString, info);
    }

    if (Array.isArray(filter)) {
      return filter.some((pattern) => matchResourcePattern(resourceString, pattern));
    }

    return true;
  }

  async function connectToResource(resourceString: string): Promise<DeviceSessionInternal | null> {
    const result = await resourceManager.openResource(resourceString);
    if (!result.ok) {
      return null;
    }

    const session = createDeviceSession({
      resourceString,
      resource: result.value,
      maxConsecutiveErrors,
      onReconnect: autoReconnect
        ? async () => resourceManager.openResource(resourceString)
        : undefined,
      onStateChange: () => {
        emit('session-state-changed', session);
      },
    });

    return session;
  }

  async function scan(): Promise<void> {
    try {
      const resources = await resourceManager.listResources();
      const currentResourceStrings = new Set(resources);

      // Find new resources
      for (const rs of resources) {
        if (!sessions.has(rs) && matchesFilter(rs)) {
          const session = await connectToResource(rs);
          if (session) {
            sessions.set(rs, session);
            emit('session-added', session);
          }
        }
      }

      // Find removed resources
      for (const [rs, session] of sessions) {
        if (!currentResourceStrings.has(rs)) {
          await session.close();
          sessions.delete(rs);
          emit('session-removed', rs);
        }
      }
    } catch {
      // Scan errors are ignored, will retry on next interval
    }
  }

  const manager: SessionManager = {
    get sessions(): Map<string, DeviceSession> {
      return new Map(sessions);
    },

    async start(): Promise<void> {
      if (isRunning) return;
      isRunning = true;

      await scan();

      scanTimer = setInterval(() => {
        void scan();
      }, scanInterval);
    },

    async stop(): Promise<void> {
      if (!isRunning) return;
      isRunning = false;

      if (scanTimer) {
        clearInterval(scanTimer);
        scanTimer = null;
      }

      // Close all sessions
      for (const [rs, session] of sessions) {
        await session.close();
        sessions.delete(rs);
      }
    },

    getSession(resourceString: string): DeviceSession | undefined {
      return sessions.get(resourceString);
    },

    listSessions(): string[] {
      return Array.from(sessions.keys());
    },

    on(event: string, handler: EventHandler): void {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, new Set());
      }
      eventHandlers.get(event)!.add(handler);
    },

    off(event: string, handler: EventHandler): void {
      const handlers = eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    },
  };

  return manager;
}
