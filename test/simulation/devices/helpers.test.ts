/**
 * Tests for shared device simulation helpers
 */

import { describe, it, expect } from 'vitest';
import {
  parseNumber,
  parseBooleanState,
  parseString,
  formatFixed,
  formatBooleanState,
  formatString,
  validateRange,
  type PropertyValue,
} from '../../../src/simulation/devices/helpers.js';

describe('device helpers', () => {
  describe('parseNumber', () => {
    it('parses integer from match group', () => {
      const match = ['VOLT 12', '12'] as unknown as RegExpMatchArray;
      expect(parseNumber(match)).toBe(12);
    });

    it('parses floating point from match group', () => {
      const match = ['VOLT 3.14159', '3.14159'] as unknown as RegExpMatchArray;
      expect(parseNumber(match)).toBeCloseTo(3.14159);
    });

    it('parses scientific notation', () => {
      const match = ['VOLT 1.5e-3', '1.5e-3'] as unknown as RegExpMatchArray;
      expect(parseNumber(match)).toBeCloseTo(0.0015);
    });

    it('returns 0 for missing match group', () => {
      const match = ['VOLT'] as unknown as RegExpMatchArray;
      expect(parseNumber(match)).toBe(0);
    });

    it('returns NaN for non-numeric string', () => {
      const match = ['VOLT abc', 'abc'] as unknown as RegExpMatchArray;
      expect(parseNumber(match)).toBeNaN();
    });
  });

  describe('parseBooleanState', () => {
    it('parses ON as true', () => {
      const match = ['OUTP ON', 'ON'] as unknown as RegExpMatchArray;
      expect(parseBooleanState(match)).toBe(true);
    });

    it('parses OFF as false', () => {
      const match = ['OUTP OFF', 'OFF'] as unknown as RegExpMatchArray;
      expect(parseBooleanState(match)).toBe(false);
    });

    it('parses 1 as true', () => {
      const match = ['OUTP 1', '1'] as unknown as RegExpMatchArray;
      expect(parseBooleanState(match)).toBe(true);
    });

    it('parses 0 as false', () => {
      const match = ['OUTP 0', '0'] as unknown as RegExpMatchArray;
      expect(parseBooleanState(match)).toBe(false);
    });

    it('is case insensitive', () => {
      const match = ['OUTP on', 'on'] as unknown as RegExpMatchArray;
      expect(parseBooleanState(match)).toBe(true);
    });

    it('returns false for missing match group', () => {
      const match = ['OUTP'] as unknown as RegExpMatchArray;
      expect(parseBooleanState(match)).toBe(false);
    });
  });

  describe('parseString', () => {
    it('parses string and uppercases it', () => {
      const match = ['MODE cc', 'cc'] as unknown as RegExpMatchArray;
      expect(parseString(match)).toBe('CC');
    });

    it('returns empty string for missing match group', () => {
      const match = ['MODE'] as unknown as RegExpMatchArray;
      expect(parseString(match)).toBe('');
    });
  });

  describe('formatFixed', () => {
    it('formats number with 3 decimal places', () => {
      const formatter = formatFixed(3);
      expect(formatter(1.23456)).toBe('1.235');
    });

    it('formats number with 6 decimal places', () => {
      const formatter = formatFixed(6);
      expect(formatter(0.001)).toBe('0.001000');
    });

    it('pads with zeros', () => {
      const formatter = formatFixed(3);
      expect(formatter(5)).toBe('5.000');
    });

    it('handles negative numbers', () => {
      const formatter = formatFixed(3);
      expect(formatter(-1.5)).toBe('-1.500');
    });
  });

  describe('formatBooleanState', () => {
    it('formats true as ON', () => {
      expect(formatBooleanState(true)).toBe('ON');
    });

    it('formats false as OFF', () => {
      expect(formatBooleanState(false)).toBe('OFF');
    });

    it('formats truthy number as ON', () => {
      expect(formatBooleanState(1 as PropertyValue)).toBe('ON');
    });

    it('formats falsy number as OFF', () => {
      expect(formatBooleanState(0 as PropertyValue)).toBe('OFF');
    });
  });

  describe('formatString', () => {
    it('returns string as-is', () => {
      expect(formatString('CHAN1')).toBe('CHAN1');
    });
  });

  describe('validateRange', () => {
    it('returns true for value within range', () => {
      const validator = validateRange(0, 10);
      expect(validator(5)).toBe(true);
    });

    it('returns true for value at lower bound', () => {
      const validator = validateRange(0, 10);
      expect(validator(0)).toBe(true);
    });

    it('returns true for value at upper bound', () => {
      const validator = validateRange(0, 10);
      expect(validator(10)).toBe(true);
    });

    it('returns false for value below range', () => {
      const validator = validateRange(0, 10);
      expect(validator(-1)).toBe(false);
    });

    it('returns false for value above range', () => {
      const validator = validateRange(0, 10);
      expect(validator(11)).toBe(false);
    });

    it('works with negative ranges', () => {
      const validator = validateRange(-100, 100);
      expect(validator(-50)).toBe(true);
      expect(validator(-101)).toBe(false);
    });

    it('works with floating point values', () => {
      const validator = validateRange(0.001, 10);
      expect(validator(0.0005)).toBe(false);
      expect(validator(0.001)).toBe(true);
    });
  });
});
