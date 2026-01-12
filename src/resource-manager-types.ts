/**
 * ResourceManager types and interfaces.
 *
 * @packageDocumentation
 */

import type { Transport } from './transports/transport.js';
import type { OpenOptions, ResourceInfo } from './types.js';
import type { Result } from './result.js';
import type { MessageBasedResource } from './resources/message-based-resource.js';
import type { SerialPortInfo, UsbDeviceInfo } from './discovery.js';

/**
 * Internal options for ResourceManager (supports dependency injection for testing)
 */
export interface ResourceManagerOptions {
  /** @internal Factory for TCP/IP transports (for testing) */
  _createTcpipTransport?: (config: {
    host: string;
    port: number;
    timeout?: number;
    readTermination?: string;
    writeTermination?: string;
    connectTimeout?: number;
    keepAlive?: boolean;
    keepAliveInterval?: number;
  }) => Transport;

  /** @internal Factory for Serial transports (for testing) */
  _createSerialTransport?: (config: {
    path: string;
    timeout?: number;
    readTermination?: string;
    writeTermination?: string;
    baudRate?: number;
    dataBits?: 5 | 6 | 7 | 8;
    stopBits?: 1 | 1.5 | 2;
    parity?: 'none' | 'even' | 'odd' | 'mark' | 'space';
    flowControl?: 'none' | 'hardware' | 'software';
    commandDelay?: number;
  }) => Transport;

  /** @internal Factory for USB-TMC transports (for testing) */
  _createUsbtmcTransport?: (config: {
    vendorId: number;
    productId: number;
    serialNumber?: string;
    timeout?: number;
    readTermination?: string;
    writeTermination?: string;
    quirks?: 'rigol' | 'none';
  }) => Transport;

  /** @internal Function to list serial ports (for testing) */
  _listSerialPorts?: () => Promise<SerialPortInfo[]>;

  /** @internal Function to list USB devices (for testing) */
  _listUsbDevices?: () => Promise<UsbDeviceInfo[]>;
}

/**
 * ResourceManager interface for discovering and opening instrument connections.
 */
export interface ResourceManager {
  /**
   * List available resources matching a pattern.
   *
   * @param query - VISA resource pattern (default: '?*::INSTR')
   * @returns Array of resource strings
   */
  listResources(query?: string): Promise<string[]>;

  /**
   * Get detailed information about available resources.
   *
   * @param query - VISA resource pattern
   * @returns Array of ResourceInfo objects
   */
  listResourcesInfo(query?: string): Promise<ResourceInfo[]>;

  /**
   * Open a connection to an instrument.
   *
   * @param resourceString - VISA resource string
   * @param options - Connection options
   * @returns MessageBasedResource for communication
   */
  openResource(
    resourceString: string,
    options?: OpenOptions
  ): Promise<Result<MessageBasedResource, Error>>;

  /**
   * Close all open resources and release the resource manager.
   */
  close(): Promise<void>;

  /**
   * Get list of currently open resources.
   */
  readonly openResources: MessageBasedResource[];
}
