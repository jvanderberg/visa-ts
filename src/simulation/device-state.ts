/**
 * Device state management for simulation backend.
 *
 * Manages stateful properties for simulated devices with validation.
 *
 * @packageDocumentation
 */

import { Ok, Err, type Result } from '../result.js';
import type { Property } from './types.js';

/**
 * Interface for device state management
 */
export interface DeviceState {
  /**
   * Get the current value of a property.
   *
   * @param name - Property name
   * @returns Current value or undefined if property doesn't exist
   */
  get<T>(name: string): T | undefined;

  /**
   * Set a property value with validation.
   *
   * @param name - Property name
   * @param value - New value
   * @returns Result indicating success or validation/existence error
   */
  set<T>(name: string, value: T): Result<void, Error>;

  /**
   * Reset property/properties to default values.
   *
   * @param name - Optional property name. If omitted, resets all properties.
   */
  reset(name?: string): void;

  /**
   * Get all current property values.
   *
   * @returns Copy of all property values
   */
  getAllValues(): Record<string, unknown>;

  /**
   * Check if a property exists.
   *
   * @param name - Property name
   * @returns True if property is defined
   */
  hasProperty(name: string): boolean;

  /**
   * Get the property definition.
   *
   * @param name - Property name
   * @returns Property definition or undefined
   */
  getPropertyDefinition(name: string): Property | undefined;
}

/**
 * Create a device state manager.
 *
 * @param properties - Property definitions with defaults and validation
 * @returns DeviceState instance
 */
export function createDeviceState(properties: Record<string, Property>): DeviceState {
  // Store current values
  const values: Record<string, unknown> = {};

  // Initialize with defaults
  for (const [name, prop] of Object.entries(properties)) {
    values[name] = prop.default;
  }

  return {
    get<T>(name: string): T | undefined {
      if (!(name in values)) {
        return undefined;
      }
      return values[name] as T;
    },

    set<T>(name: string, value: T): Result<void, Error> {
      // Check property exists
      const prop = properties[name];
      if (!prop) {
        return Err(new Error(`Unknown property: ${name}`));
      }

      // Validate if validator exists
      if (prop.validate) {
        const isValid = prop.validate(value as never);
        if (!isValid) {
          return Err(new Error(`Property validation failed for: ${name}`));
        }
      }

      values[name] = value;
      return Ok(undefined);
    },

    reset(name?: string): void {
      if (name !== undefined) {
        // Reset specific property
        const prop = properties[name];
        if (prop) {
          values[name] = prop.default;
        }
      } else {
        // Reset all properties
        for (const [propName, prop] of Object.entries(properties)) {
          values[propName] = prop.default;
        }
      }
    },

    getAllValues(): Record<string, unknown> {
      return { ...values };
    },

    hasProperty(name: string): boolean {
      return name in properties;
    },

    getPropertyDefinition(name: string): Property | undefined {
      return properties[name];
    },
  };
}
