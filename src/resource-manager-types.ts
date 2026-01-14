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
   * @param device - SimulatedDevice configuration
   *
   * @example
   * ```typescript
   * rm.registerSimulatedDevice('PSU', simulatedPsu);
   * rm.registerSimulatedDevice('MY_DEVICE', {
   *   info: { manufacturer: 'Test', model: 'SIM-1' },
   *   properties: { voltage: { default: 0 } }
   * });
   * ```
   */
  registerSimulatedDevice(deviceType: string, device: SimulatedDevice): void;
}
