/**
 * Session management for visa-ts.
 *
 * Optional higher-level abstraction for applications that want managed
 * connections with automatic reconnection, polling, and state tracking.
 *
 * @packageDocumentation
 */

// Types
export type {
  SessionState,
  ExecuteOptions,
  ResourceFilter,
  SessionManagerOptions,
  SessionManagerEvent,
  DeviceSession,
  SessionAddedHandler,
  SessionRemovedHandler,
  SessionStateChangedHandler,
  SessionManager,
} from './types.js';

// Factories
export { createSessionManager } from './session-manager.js';
export type { SessionManagerConfig } from './session-manager.js';

export { createDeviceSession } from './device-session.js';
export type { DeviceSessionConfig, DeviceSessionInternal } from './device-session.js';
