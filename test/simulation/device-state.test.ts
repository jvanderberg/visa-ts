import { describe, it, expect } from 'vitest';
import { createDeviceState } from '../../src/simulation/device-state.js';
import type { Property } from '../../src/simulation/types.js';

describe('createDeviceState', () => {
  describe('initialization', () => {
    it('creates empty state when no properties defined', () => {
      const state = createDeviceState({});

      expect(state.getAllValues()).toEqual({});
    });

    it('initializes properties with default values', () => {
      const properties: Record<string, Property> = {
        voltage: { default: 12.0 },
        enabled: { default: false },
        mode: { default: 'DC' },
      };

      const state = createDeviceState(properties);

      expect(state.get('voltage')).toBe(12.0);
      expect(state.get('enabled')).toBe(false);
      expect(state.get('mode')).toBe('DC');
    });

    it('returns undefined for non-existent properties', () => {
      const state = createDeviceState({
        voltage: { default: 12.0 },
      });

      expect(state.get('nonexistent')).toBeUndefined();
    });
  });

  describe('set', () => {
    it('updates property value', () => {
      const state = createDeviceState({
        voltage: { default: 12.0 },
      });

      const result = state.set('voltage', 24.0);

      expect(result.ok).toBe(true);
      expect(state.get('voltage')).toBe(24.0);
    });

    it('returns Err when setting non-existent property', () => {
      const state = createDeviceState({
        voltage: { default: 12.0 },
      });

      const result = state.set('nonexistent', 5.0);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('nonexistent');
      }
    });

    it('validates value when validate function is provided', () => {
      const state = createDeviceState({
        voltage: {
          default: 12.0,
          validate: (v) => v >= 0 && v <= 30,
        },
      });

      const validResult = state.set('voltage', 20.0);
      expect(validResult.ok).toBe(true);
      expect(state.get('voltage')).toBe(20.0);

      const invalidResult = state.set('voltage', 50.0);
      expect(invalidResult.ok).toBe(false);
      if (!invalidResult.ok) {
        expect(invalidResult.error.message).toContain('validation');
      }
      // Value should remain unchanged after failed validation
      expect(state.get('voltage')).toBe(20.0);
    });

    it('accepts any value when no validate function', () => {
      const state = createDeviceState({
        voltage: { default: 12.0 },
      });

      const result = state.set('voltage', -999);

      expect(result.ok).toBe(true);
      expect(state.get('voltage')).toBe(-999);
    });
  });

  describe('reset', () => {
    it('resets all properties to default values', () => {
      const state = createDeviceState({
        voltage: { default: 12.0 },
        enabled: { default: false },
      });

      state.set('voltage', 24.0);
      state.set('enabled', true);

      state.reset();

      expect(state.get('voltage')).toBe(12.0);
      expect(state.get('enabled')).toBe(false);
    });

    it('resets specific property to default value', () => {
      const state = createDeviceState({
        voltage: { default: 12.0 },
        enabled: { default: false },
      });

      state.set('voltage', 24.0);
      state.set('enabled', true);

      state.reset('voltage');

      expect(state.get('voltage')).toBe(12.0);
      expect(state.get('enabled')).toBe(true); // unchanged
    });
  });

  describe('getAllValues', () => {
    it('returns copy of all current values', () => {
      const state = createDeviceState({
        voltage: { default: 12.0 },
        enabled: { default: false },
      });

      state.set('voltage', 24.0);
      const values = state.getAllValues();

      expect(values).toEqual({
        voltage: 24.0,
        enabled: false,
      });

      // Verify it's a copy, not a reference
      values['voltage'] = 999;
      expect(state.get('voltage')).toBe(24.0);
    });
  });

  describe('hasProperty', () => {
    it('returns true for existing properties', () => {
      const state = createDeviceState({
        voltage: { default: 12.0 },
      });

      expect(state.hasProperty('voltage')).toBe(true);
    });

    it('returns false for non-existent properties', () => {
      const state = createDeviceState({
        voltage: { default: 12.0 },
      });

      expect(state.hasProperty('nonexistent')).toBe(false);
    });
  });

  describe('getPropertyDefinition', () => {
    it('returns property definition for existing property', () => {
      const voltageProp: Property<number> = {
        default: 12.0,
        validate: (v) => v >= 0,
      };
      const state = createDeviceState({
        voltage: voltageProp,
      });

      const def = state.getPropertyDefinition('voltage');

      expect(def).toBeDefined();
      expect(def?.default).toBe(12.0);
      expect(def?.validate).toBeDefined();
    });

    it('returns undefined for non-existent property', () => {
      const state = createDeviceState({
        voltage: { default: 12.0 },
      });

      expect(state.getPropertyDefinition('nonexistent')).toBeUndefined();
    });
  });
});
