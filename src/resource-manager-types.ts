/**
 * ResourceManager types and interfaces.
 *
 * @packageDocumentation
 */

import type { OpenOptions, ResourceInfo } from './types.js';
import type { Result } from './result.js';
import type { MessageBasedResource } from './resources/message-based-resource.js';
import type { SimulatedDevice } from './simulation/types.js';

/**
 * Options for registering a simulated device
 */
export interface RegisterSimulatedDeviceOptions {
  /**
   * Circuit bus name for physics simulation.
   *
   * Devices on the same bus interact electrically (e.g., PSU and Load).
   * Defaults to 'default'. Use different bus names to isolate devices.
   *
   * @example
   * ```typescript
   * rm.registerSimulatedDevice('PSU', psu, { bus: 'bench1' });
   * rm.registerSimulatedDevice('LOAD', load, { bus: 'bench1' });
   * rm.registerSimulatedDevice('PSU2', psu2, { bus: 'bench2' }); // isolated
   * ```
   */
  bus?: string;
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

  /**
   * Register a simulated device.
   *
   * Registered devices appear in listResources() with SIM::deviceType::INSTR
   * resource strings and can be opened like any other resource.
   *
   * @param deviceType - Device type identifier (e.g., 'PSU', 'DMM')
   * @param device - SimulatedDevice instance
   * @param options - Optional registration options
   *
   * @example
   * ```typescript
   * rm.registerSimulatedDevice('PSU', createSimulatedPsu());
   * rm.registerSimulatedDevice('LOAD', createSimulatedLoad());
   * ```
   */
  registerSimulatedDevice(
    deviceType: string,
    device: SimulatedDevice,
    options?: RegisterSimulatedDeviceOptions
  ): void;
}
