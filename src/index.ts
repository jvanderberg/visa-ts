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
export type { SimulationTransport } from './transports/simulation.js';

export { createDeviceState, createCommandHandler } from './simulation/index.js';
export type {
  SimulatedDevice,
  DeviceInfo,
  EndOfMessage,
  Dialogue,
  Property,
  SimulationTransportConfig,
  SimulatedResourceManagerConfig,
  CommandResult,
  DeviceState,
  CommandHandler,
} from './simulation/index.js';
