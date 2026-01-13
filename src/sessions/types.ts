/**
 * Session management types for visa-ts.
 *
 * @packageDocumentation
 */

import type { Result } from '../result.js';
import type { MessageBasedResource } from '../resources/message-based-resource.js';
import type { ResourceInfo } from '../types.js';

/**
 * Session state indicating the current connection status.
 */
export type SessionState = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Options for command execution through a session.
 */
export interface ExecuteOptions {
  /**
   * Max time (ms) for the entire operation (including any reconnect wait).
   * Default: 30000ms
   */
  timeout?: number;
}

/**
 * Resource filter for selecting which devices to manage.
 *
 * Can be:
 * - VISA pattern string: 'USB?*::INSTR', 'ASRL?*::INSTR'
 * - RegExp: /^USB.*0x1AB1/
 * - Function: (resourceString, info?) => boolean
 * - Array of patterns: ['USB?*::INSTR', 'TCPIP?*::INSTR']
 */
export type ResourceFilter =
  | string
  | RegExp
  | ((resourceString: string, info?: ResourceInfo) => boolean)
  | string[];

/**
 * Options for SessionManager configuration.
 */
export interface SessionManagerOptions {
  /** How often to scan for new/reconnected devices (ms, default: 5000) */
  scanInterval?: number;

  /** Max consecutive errors before marking disconnected (default: 5) */
  maxConsecutiveErrors?: number;

  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean;

  /** Filter which devices to connect to */
  filter?: ResourceFilter;
}

/**
 * Event types emitted by SessionManager.
 */
export type SessionManagerEvent = 'session-added' | 'session-removed' | 'session-state-changed';

/**
 * Represents a managed device session with automatic reconnection and command queuing.
 */
export interface DeviceSession {
  /** The underlying resource (null if disconnected) */
  readonly resource: MessageBasedResource | null;

  /** Resource string for this session */
  readonly resourceString: string;

  /** Current connection state */
  readonly state: SessionState;

  /** Last error if state is 'error' */
  readonly lastError: Error | null;

  /** Latest polled status (application-defined) */
  readonly status: unknown;

  /**
   * Subscribe to status updates.
   * @param handler - Callback for status updates
   * @returns Unsubscribe function
   */
  onStatus(handler: (status: unknown) => void): () => void;

  /**
   * Execute a command (queued, handles reconnection).
   * @param fn - Function to execute with the resource
   * @param options - Execution options
   * @returns Result of the operation
   */
  execute<T>(
    fn: (resource: MessageBasedResource) => Promise<T>,
    options?: ExecuteOptions
  ): Promise<Result<T, Error>>;

  /**
   * Manually trigger reconnection attempt.
   * @returns Result indicating success or failure
   */
  reconnect(): Promise<Result<void, Error>>;
}

/**
 * Event handler type for session-added events.
 */
export type SessionAddedHandler = (session: DeviceSession) => void;

/**
 * Event handler type for session-removed events.
 */
export type SessionRemovedHandler = (resourceString: string) => void;

/**
 * Event handler type for session-state-changed events.
 */
export type SessionStateChangedHandler = (session: DeviceSession) => void;

/**
 * Manages multiple device sessions with automatic discovery and reconnection.
 */
export interface SessionManager {
  /** Start scanning and managing sessions */
  start(): Promise<void>;

  /** Stop all sessions and scanning */
  stop(): Promise<void>;

  /** Get all active sessions as a Map */
  readonly sessions: Map<string, DeviceSession>;

  /**
   * Get session by resource string.
   * @param resourceString - VISA resource string
   * @returns DeviceSession or undefined if not found
   */
  getSession(resourceString: string): DeviceSession | undefined;

  /** Get all resource strings for active sessions */
  listSessions(): string[];

  /** Subscribe to session events */
  on(event: 'session-added', handler: SessionAddedHandler): void;
  on(event: 'session-removed', handler: SessionRemovedHandler): void;
  on(event: 'session-state-changed', handler: SessionStateChangedHandler): void;

  /** Unsubscribe from session events */
  off(event: 'session-added', handler: SessionAddedHandler): void;
  off(event: 'session-removed', handler: SessionRemovedHandler): void;
  off(event: 'session-state-changed', handler: SessionStateChangedHandler): void;
}
