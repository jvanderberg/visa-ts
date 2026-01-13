/**
 * Circuit simulation exports for visa-ts.
 *
 * Provides multi-instrument circuit simulation with realistic physics.
 *
 * @packageDocumentation
 */

// Circuit factory
export { createCircuit } from './circuit.js';
export type {
  Circuit,
  CircuitDevice,
  CircuitConnection,
  DevicePort,
  ConnectionOptions,
} from './circuit.js';

// Circuit solver
export { solveCircuit } from './solver.js';

// Circuit types
export type {
  CircuitNode,
  Connection,
  PsuState,
  LoadState,
  PsuMode,
  LoadMode,
  CircuitState,
  CircuitMeasurements,
} from './types.js';
