/**
 * visa-ts - TypeScript VISA library for instrument communication
 *
 * @packageDocumentation
 */

// Result type and helpers
export { Ok, Err, isOk, isErr, unwrapOr, unwrapOrElse, map, mapErr } from './result.js';
export type { Result } from './result.js';

// Resource string parsing
export {
  parseResourceString,
  buildResourceString,
  matchResourcePattern,
} from './resource-string.js';

// Core types
export type {
  InterfaceType,
  ResourceInfo,
  USBResourceInfo,
  SerialResourceInfo,
  TCPIPResourceInfo,
  SimulationResourceInfo,
  OpenOptions,
  TransportOptions,
  USBTMCOptions,
  SerialOptions,
  AutoBaudOptions,
  TCPIPOptions,
  QueryOptions,
  AsciiValuesOptions,
  BinaryDatatype,
  ParsedResourceString,
  ParsedUSBResource,
  ParsedSerialResource,
  ParsedTCPIPSocketResource,
  ParsedTCPIPInstrResource,
  ParsedSimulationResource,
  ParsedResource,
} from './types.js';

// Transport layer
export type {
  Transport,
  TransportState,
  TransportConfig,
  TransportFactory,
} from './transports/transport.js';

export { createTcpipTransport } from './transports/tcpip.js';
export type { TcpipTransportConfig } from './transports/tcpip.js';

export { createSerialTransport } from './transports/serial.js';
export type { SerialTransportConfig } from './transports/serial.js';

export { createUsbtmcTransport } from './transports/usbtmc.js';
export type { UsbtmcTransportConfig } from './transports/usbtmc.js';

// Resource layer
export { createMessageBasedResource } from './resources/message-based.js';
export type { MessageBasedResource } from './resources/message-based.js';

// Resource Manager
export { createResourceManager } from './resource-manager.js';
export type { ResourceManager } from './resource-manager.js';

// SCPI utilities
export {
  parseScpiNumber,
  parseScpiBool,
  parseScpiEnum,
  parseDefiniteLengthBlock,
  parseArbitraryBlock,
} from './util/scpi-parser.js';
export type { ScpiBlockInfo } from './util/scpi-parser.js';

// Serial probe utility
export { probeSerialPort } from './util/serial-probe.js';
export type { SerialProbeOptions, SerialProbeResult } from './util/serial-probe.js';

// Simulation backend
export { createSimulationTransport } from './transports/simulation.js';
export type { SimulationTransport, SimulationTransportConfig } from './transports/simulation.js';

export {
  createCommandHandler,
  createSimulatedPsu,
  createSimulatedLoad,
  createSimulatedDmm,
  solveCircuit,
} from './simulation/index.js';
export type {
  SimulatedDevice,
  Property,
  CommandHandler,
  DeviceInfo,
  Dialogue,
  CommandResult,
  DeviceBehavior,
  CircuitDevice,
} from './simulation/index.js';

// Driver abstraction layer
export { defineDriver, parseIdentity, parseError } from './drivers/index.js';
export type {
  // Core driver types
  PropertyDef,
  PropertyMap,
  CommandDef,
  CommandMap,
  ChannelSpec,
  QuirkConfig,
  DriverContext,
  DriverHooks,
  MethodMap,
  DriverSpec,
  Driver,
  DefinedDriver,
  // Equipment types
  BaseInstrument,
  InstrumentIdentity,
  InstrumentError,
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
  OscilloscopeCapability,
  WaveformData,
  PowerSupply,
  PowerSupplyChannel,
  RegulationMode,
  TrackingMode,
  CombineMode,
  VoltageRange,
  PowerSupplyCapability,
  Multimeter,
  MultimeterDisplay,
  DmmFunction,
  AcBandwidth,
  DmmTriggerSource,
  DmmStatistics,
} from './drivers/index.js';
