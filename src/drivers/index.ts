/**
 * Driver abstraction layer exports.
 *
 * This module provides typed instrument drivers that abstract away
 * raw SCPI commands, offering type-safe APIs for controlling test
 * and measurement equipment.
 *
 * @packageDocumentation
 */

// Core driver types
export type {
  // Property definitions
  SupportedPropertyDef,
  UnsupportedPropertyDef,
  PropertyDef,
  // Command definitions
  SupportedCommandDef,
  UnsupportedCommandDef,
  CommandDef,
  // Channel specifications
  ChannelSpec,
  // Driver configuration
  DriverSettings,
  DriverContext,
  DriverHooks,
  MethodMap,
  DriverSpec,
  Driver,
} from './types.js';

// Type guards
export { isSupported, isCommandSupported } from './types.js';

// Driver factory
export { defineDriver } from './define-driver.js';
export type { DefinedDriver } from './define-driver.js';

// Equipment types
export type {
  // Base
  BaseInstrument,
  InstrumentIdentity,
  InstrumentError,
  // Oscilloscope
  Oscilloscope,
  OscilloscopeChannel,
  TimebaseMode,
  TriggerSource,
  TriggerSlope,
  TriggerMode,
  AcquisitionMode,
  Coupling,
  BandwidthLimit,
  MeasurementType,
  Protocol,
  WaveformData,
  // Power Supply
  PowerSupply,
  PowerSupplyChannel,
  RegulationMode,
  TrackingMode,
  CombineMode,
  VoltageRange,
  // Multimeter
  Multimeter,
  DmmFunction,
  AcBandwidth,
  DmmTriggerSource,
  DmmStatistics,
} from './equipment/index.js';

// Utility functions
export { parseIdentity, parseError } from './equipment/index.js';

// Features and type guards
export * from './features/index.js';
