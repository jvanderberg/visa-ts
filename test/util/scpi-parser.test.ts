/**
 * Tests for SCPI parser utilities
 */

import { describe, it, expect } from 'vitest';
import { ScpiParser } from '../../src/util/scpi-parser.js';

describe('ScpiParser', () => {
  describe('parseNumber', () => {
    it('parses a simple integer', () => {
      expect(ScpiParser.parseNumber('123')).toBe(123);
    });

    it('parses a simple float', () => {
      expect(ScpiParser.parseNumber('1.234')).toBe(1.234);
    });

    it('parses scientific notation with positive exponent', () => {
      expect(ScpiParser.parseNumber('1.234E+03')).toBe(1234);
    });

    it('parses scientific notation with negative exponent', () => {
      expect(ScpiParser.parseNumber('1.234E-03')).toBeCloseTo(0.001234, 6);
    });

    it('parses lowercase scientific notation', () => {
      expect(ScpiParser.parseNumber('1.234e+03')).toBe(1234);
    });

    it('parses negative numbers', () => {
      expect(ScpiParser.parseNumber('-5.5')).toBe(-5.5);
    });

    it('returns Infinity for SCPI overflow value 9.9E37', () => {
      expect(ScpiParser.parseNumber('9.9E37')).toBe(Infinity);
    });

    it('returns Infinity for SCPI overflow value 9.9E+37', () => {
      expect(ScpiParser.parseNumber('9.9E+37')).toBe(Infinity);
    });

    it('returns -Infinity for negative overflow -9.9E37', () => {
      expect(ScpiParser.parseNumber('-9.9E37')).toBe(-Infinity);
    });

    it('returns Infinity for explicit plus sign +9.9E37', () => {
      expect(ScpiParser.parseNumber('+9.9E37')).toBe(Infinity);
    });

    it('returns Infinity for lowercase overflow 9.9e37', () => {
      expect(ScpiParser.parseNumber('9.9e37')).toBe(Infinity);
    });

    it('returns NaN for whitespace-only string', () => {
      expect(ScpiParser.parseNumber('   ')).toBeNaN();
    });

    it('returns NaN for asterisks (invalid measurement)', () => {
      expect(ScpiParser.parseNumber('****')).toBeNaN();
    });

    it('returns NaN for empty string', () => {
      expect(ScpiParser.parseNumber('')).toBeNaN();
    });

    it('returns NaN for non-numeric string', () => {
      expect(ScpiParser.parseNumber('abc')).toBeNaN();
    });

    it('trims whitespace before parsing', () => {
      expect(ScpiParser.parseNumber('  1.5  ')).toBe(1.5);
    });

    it('handles leading plus sign', () => {
      expect(ScpiParser.parseNumber('+3.14')).toBe(3.14);
    });
  });

  describe('parseBool', () => {
    it('returns true for "1"', () => {
      expect(ScpiParser.parseBool('1')).toBe(true);
    });

    it('returns true for "ON"', () => {
      expect(ScpiParser.parseBool('ON')).toBe(true);
    });

    it('returns true for lowercase "on"', () => {
      expect(ScpiParser.parseBool('on')).toBe(true);
    });

    it('returns true for "TRUE"', () => {
      expect(ScpiParser.parseBool('TRUE')).toBe(true);
    });

    it('returns true for lowercase "true"', () => {
      expect(ScpiParser.parseBool('true')).toBe(true);
    });

    it('returns false for "0"', () => {
      expect(ScpiParser.parseBool('0')).toBe(false);
    });

    it('returns false for "OFF"', () => {
      expect(ScpiParser.parseBool('OFF')).toBe(false);
    });

    it('returns false for lowercase "off"', () => {
      expect(ScpiParser.parseBool('off')).toBe(false);
    });

    it('returns false for "FALSE"', () => {
      expect(ScpiParser.parseBool('FALSE')).toBe(false);
    });

    it('returns false for lowercase "false"', () => {
      expect(ScpiParser.parseBool('false')).toBe(false);
    });

    it('trims whitespace before parsing', () => {
      expect(ScpiParser.parseBool('  1  ')).toBe(true);
      expect(ScpiParser.parseBool('  ON  ')).toBe(true);
    });

    it('returns null for unrecognized values', () => {
      expect(ScpiParser.parseBool('invalid')).toBeNull();
      expect(ScpiParser.parseBool('')).toBeNull();
      expect(ScpiParser.parseBool('2')).toBeNull();
    });
  });

  describe('parseEnum', () => {
    const modes = { VOLT: 'voltage', CURR: 'current', RES: 'resistance' };

    it('maps known enum values', () => {
      expect(ScpiParser.parseEnum('VOLT', modes)).toBe('voltage');
      expect(ScpiParser.parseEnum('CURR', modes)).toBe('current');
      expect(ScpiParser.parseEnum('RES', modes)).toBe('resistance');
    });

    it('handles case-insensitive matching', () => {
      expect(ScpiParser.parseEnum('volt', modes)).toBe('voltage');
      expect(ScpiParser.parseEnum('Volt', modes)).toBe('voltage');
    });

    it('trims whitespace before parsing', () => {
      expect(ScpiParser.parseEnum('  VOLT  ', modes)).toBe('voltage');
    });

    it('returns null for unknown enum values', () => {
      expect(ScpiParser.parseEnum('UNKNOWN', modes)).toBeNull();
      expect(ScpiParser.parseEnum('', modes)).toBeNull();
    });

    it('works with numeric string keys', () => {
      const numericModes = { '0': 'auto', '1': 'manual', '2': 'remote' };
      expect(ScpiParser.parseEnum('0', numericModes)).toBe('auto');
      expect(ScpiParser.parseEnum('1', numericModes)).toBe('manual');
    });
  });

  describe('parseDefiniteLengthBlock', () => {
    it('parses single-digit length header', () => {
      // #15 means 5 bytes of data (1 digit specifying length)
      const buffer = Buffer.from('#15hello');
      const result = ScpiParser.parseDefiniteLengthBlock(buffer);
      expect(result).not.toBeNull();
      expect(result?.header).toBe(3); // # + 1 + "5"
      expect(result?.length).toBe(5);
    });

    it('parses multi-digit length header', () => {
      // #3100 means 100 bytes of data (3 digits specifying length)
      const buffer = Buffer.from('#3100' + 'x'.repeat(100));
      const result = ScpiParser.parseDefiniteLengthBlock(buffer);
      expect(result).not.toBeNull();
      expect(result?.header).toBe(5); // # + 3 + "100"
      expect(result?.length).toBe(100);
    });

    it('parses 9-digit length header', () => {
      // #9000001200 means 1200 bytes of data
      const buffer = Buffer.from('#9000001200');
      const result = ScpiParser.parseDefiniteLengthBlock(buffer);
      expect(result).not.toBeNull();
      expect(result?.header).toBe(11); // # + 9 + "000001200"
      expect(result?.length).toBe(1200);
    });

    it('returns null for buffer without # prefix', () => {
      const buffer = Buffer.from('invalid');
      expect(ScpiParser.parseDefiniteLengthBlock(buffer)).toBeNull();
    });

    it('returns null for empty buffer', () => {
      const buffer = Buffer.alloc(0);
      expect(ScpiParser.parseDefiniteLengthBlock(buffer)).toBeNull();
    });

    it('returns null for buffer too short for header', () => {
      const buffer = Buffer.from('#3');
      expect(ScpiParser.parseDefiniteLengthBlock(buffer)).toBeNull();
    });

    it('returns null for indefinite length block (#0)', () => {
      // #0 is indefinite length - parseDefiniteLengthBlock should reject it
      const buffer = Buffer.from('#0somedata\n');
      expect(ScpiParser.parseDefiniteLengthBlock(buffer)).toBeNull();
    });

    it('returns null for invalid digit count', () => {
      const buffer = Buffer.from('#a123');
      expect(ScpiParser.parseDefiniteLengthBlock(buffer)).toBeNull();
    });

    it('returns null for buffer with only # character', () => {
      const buffer = Buffer.from('#');
      expect(ScpiParser.parseDefiniteLengthBlock(buffer)).toBeNull();
    });

    it('returns null when length digits contain non-numeric characters', () => {
      const buffer = Buffer.from('#3abc'); // 3 digits but "abc" is not a number
      expect(ScpiParser.parseDefiniteLengthBlock(buffer)).toBeNull();
    });
  });

  describe('parseArbitraryBlock', () => {
    it('parses indefinite length block with newline terminator', () => {
      const buffer = Buffer.from('#0hello world\n');
      const result = ScpiParser.parseArbitraryBlock(buffer);
      expect(result).not.toBeNull();
      expect(result?.header).toBe(2); // #0
      expect(result?.length).toBe(11); // "hello world"
    });

    it('handles data without newline (assumes rest is data)', () => {
      const buffer = Buffer.from('#0somedata');
      const result = ScpiParser.parseArbitraryBlock(buffer);
      expect(result).not.toBeNull();
      expect(result?.header).toBe(2);
      expect(result?.length).toBe(8); // "somedata"
    });

    it('returns null for buffer without # prefix', () => {
      const buffer = Buffer.from('invalid');
      expect(ScpiParser.parseArbitraryBlock(buffer)).toBeNull();
    });

    it('returns null for definite length block', () => {
      // This is a definite length block - parseArbitraryBlock should reject it
      const buffer = Buffer.from('#15hello');
      expect(ScpiParser.parseArbitraryBlock(buffer)).toBeNull();
    });

    it('returns null for empty buffer', () => {
      const buffer = Buffer.alloc(0);
      expect(ScpiParser.parseArbitraryBlock(buffer)).toBeNull();
    });

    it('returns null for buffer with only # character', () => {
      const buffer = Buffer.from('#');
      expect(ScpiParser.parseArbitraryBlock(buffer)).toBeNull();
    });

    it('handles empty data in indefinite block (#0 followed by newline)', () => {
      const buffer = Buffer.from('#0\n');
      const result = ScpiParser.parseArbitraryBlock(buffer);
      expect(result).not.toBeNull();
      expect(result?.header).toBe(2);
      expect(result?.length).toBe(0);
    });
  });
});
