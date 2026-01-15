/**
 * DriverContext implementation for driver hooks and custom methods.
 *
 * @packageDocumentation
 */

import type { Result } from '../result.js';
import type { MessageBasedResource } from '../resources/message-based-resource.js';
import type { DriverContext, DriverSettings } from './types.js';

/**
 * Creates a DriverContext for use in hooks and custom methods.
 *
 * @param resource - The underlying MessageBasedResource
 * @param settings - Optional settings for timing adjustments
 * @returns DriverContext implementation
 */
export function createDriverContext(
  resource: MessageBasedResource,
  settings: DriverSettings = {}
): DriverContext {
  const delay = (ms: number): Promise<void> => {
    if (ms <= 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const write = async (command: string): Promise<Result<void, Error>> => {
    const result = await resource.write(command);
    if (result.ok && settings.postCommandDelay) {
      await delay(settings.postCommandDelay);
    }
    return result;
  };

  const query = async (command: string): Promise<Result<string, Error>> => {
    const options = settings.postQueryDelay ? { delay: settings.postQueryDelay } : undefined;
    return resource.query(command, options);
  };

  return {
    resource,
    settings,
    write,
    query,
    delay,
  };
}
