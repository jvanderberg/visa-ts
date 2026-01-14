/**
 * Circuit simulation module for visa-ts.
 *
 * Provides pub/sub bus architecture for multi-device simulation
 * where instruments can interact with realistic physics.
 *
 * @packageDocumentation
 */

// Types
export type {
  Bus,
  BusOptions,
  BusParticipant,
  BusState,
  BusSubscriber,
  Unsubscribe,
} from './types.js';

// Bus factory
export { createBus } from './bus.js';

// Device factories
export { createPsu } from './psu.js';
export type { SimulatedPsu } from './psu.js';

export { createLoad } from './load.js';
export type { LoadMode, SimulatedLoad } from './load.js';
