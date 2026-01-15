/**
 * Circuit simulation module for visa-ts.
 *
 * Provides circuit solving for multi-device simulation where
 * instruments can interact with realistic physics.
 *
 * @packageDocumentation
 */

// Solver
export { solveCircuit } from './solver.js';
export type { CircuitDevice, DeviceBehavior } from './solver.js';
