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

// Example devices (static definitions)
export { simulatedPsu, simulatedLoad } from './devices/index.js';

// Circuit simulation (physics-based devices with bus connectivity)
export { createBus, createPsu, createLoad } from './circuit/index.js';

export type {
  Bus,
  BusOptions,
  BusParticipant,
  BusState,
  BusSubscriber,
  Unsubscribe,
  SimulatedPsu,
  SimulatedLoad,
  LoadMode,
} from './circuit/index.js';
