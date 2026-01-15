/**
 * Simulation backend exports for visa-ts
 *
 * Provides TypeScript-native device simulation without hardware.
 *
 * @packageDocumentation
 */

// Types
export type { SimulatedDevice, Property, DeviceInfo, Dialogue, CommandResult } from './types.js';

// Command handler
export { createCommandHandler } from './command-handler.js';
export type { CommandHandler } from './command-handler.js';

// Device factories
export { createSimulatedPsu, createSimulatedLoad, createSimulatedDmm } from './devices/index.js';

// Circuit solver
export { solveCircuit } from './circuit/solver.js';
export type { DeviceBehavior, CircuitDevice } from './circuit/solver.js';
