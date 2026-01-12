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
