/**
 * ResourceManager types and interfaces.
 *
 * @packageDocumentation
 */

import type { OpenOptions, ResourceInfo } from './types.js';
import type { Result } from './result.js';
import type { MessageBasedResource } from './resources/message-based-resource.js';

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
