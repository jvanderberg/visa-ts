/**
 * Equipment type exports.
 *
 * @packageDocumentation
 */

// Base instrument
export type { BaseInstrument, InstrumentIdentity, InstrumentError } from './base.js';
export { parseIdentity, parseError } from './base.js';

// Oscilloscope
export type {
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
} from './oscilloscope.js';

// Power Supply
export type {
  PowerSupply,
  PowerSupplyChannel,
  RegulationMode,
  TrackingMode,
  CombineMode,
  VoltageRange,
} from './power-supply.js';

// Multimeter
export type {
  Multimeter,
  DmmFunction,
  AcBandwidth,
  DmmTriggerSource,
  DmmStatistics,
} from './multimeter.js';

// Electronic Load
export type {
  ElectronicLoad,
  ElectronicLoadChannel,
  ListStep,
  ListModeOptions,
} from './electronic-load.js';
export { LoadMode } from './electronic-load.js';
