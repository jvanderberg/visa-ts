/**
 * Simulation backend exports for visa-ts
 *
 * Provides TypeScript-native device simulation without hardware.
 *
 * @packageDocumentation
 */

// Types
export type {
  SimulatedDevice,
  DeviceInfo,
  EndOfMessage,
  Dialogue,
  Property,
  SimulationTransportConfig,
  SimulatedResourceManagerConfig,
  CommandResult,
} from './types.js';

// Device state management
export { createDeviceState } from './device-state.js';
export type { DeviceState } from './device-state.js';

// Command handler
export { createCommandHandler } from './command-handler.js';
export type { CommandHandler } from './command-handler.js';

// Example devices
export { simulatedPsu, simulatedLoad } from './devices/index.js';

// Circuit simulation
export { createCircuit, solveCircuit } from './circuit/index.js';
export type {
  Circuit,
  CircuitDevice,
  CircuitConnection,
  DevicePort,
  ConnectionOptions,
  CircuitNode,
  Connection,
  PsuState,
  LoadState,
  PsuMode,
  LoadMode,
  CircuitState,
  CircuitMeasurements,
} from './circuit/index.js';
