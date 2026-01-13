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

// Circuit simulation types
export type {
  PsuMode,
  LoadMode,
  PsuState,
  LoadState,
  CircuitNode,
  Connection,
  ConnectOptions,
  CircuitSolution,
} from './circuit-types.js';

// Circuit simulation
export { createCircuit } from './circuit.js';
export type { Circuit, CircuitDevice, CircuitDeviceConfig } from './circuit.js';

// Physics models
export { extractPsuState, resolvePsuWithLoad } from './psu-physics.js';
export { extractLoadState, calculateLoadCurrentDemand } from './load-physics.js';

// Circuit solver
export { solveCircuit } from './solver.js';
export type { CircuitParameters } from './solver.js';
