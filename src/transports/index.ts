/**
 * Transport layer exports for visa-ts
 *
 * @packageDocumentation
 */

// Transport interface
export type { Transport, TransportState, TransportConfig, TransportFactory } from './transport.js';

// TCP/IP transport
export { createTcpipTransport } from './tcpip.js';
export type { TcpipTransportConfig } from './tcpip.js';

// Serial transport
export { createSerialTransport } from './serial.js';
export type { SerialTransportConfig } from './serial.js';

// USB-TMC transport
export { createUsbtmcTransport } from './usbtmc.js';
export type { UsbtmcTransportConfig } from './usbtmc.js';
