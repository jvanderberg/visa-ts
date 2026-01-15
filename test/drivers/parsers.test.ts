import { describe, it, expect } from 'vitest';
import {
  parseScpiNumber,
  parseScpiBool,
  parseScpiString,
  formatScpiNumber,
  formatScpiBool,
  formatScpiString,
} from '../../src/drivers/parsers.js';

describe('SCPI Parsers', () => {
  describe('parseScpiNumber', () => {
    it('parses integer response', () => {
      expect(parseScpiNumber('42')).toBe(42);
    });

    it('parses floating point response', () => {
      expect(parseScpiNumber('3.14159')).toBeCloseTo(3.14159, 5);
    });

    it('parses scientific notation response', () => {
      expect(parseScpiNumber('1.5E-3')).toBeCloseTo(0.0015, 6);
    });

    it('parses negative number', () => {
      expect(parseScpiNumber('-123.45')).toBeCloseTo(-123.45, 2);
    });

    it('parses number with leading/trailing whitespace', () => {
      expect(parseScpiNumber('  42.5  \n')).toBeCloseTo(42.5, 1);
    });

    it('parses number with leading plus sign', () => {
      expect(parseScpiNumber('+10.0')).toBe(10.0);
    });

    it('returns NaN for non-numeric strings', () => {
      expect(parseScpiNumber('abc')).toBeNaN();
    });

    it('returns NaN for empty string', () => {
      expect(parseScpiNumber('')).toBeNaN();
    });

    it('parses very small scientific notation', () => {
      expect(parseScpiNumber('1.234567E-9')).toBeCloseTo(1.234567e-9, 15);
    });

    it('parses very large scientific notation', () => {
      expect(parseScpiNumber('9.999E+12')).toBeCloseTo(9.999e12, 0);
    });
  });

  describe('parseScpiBool', () => {
    it('parses "1" as true', () => {
      expect(parseScpiBool('1')).toBe(true);
    });

    it('parses "0" as false', () => {
      expect(parseScpiBool('0')).toBe(false);
    });

    it('parses "ON" as true (case insensitive)', () => {
      expect(parseScpiBool('ON')).toBe(true);
      expect(parseScpiBool('on')).toBe(true);
      expect(parseScpiBool('On')).toBe(true);
    });

    it('parses "OFF" as false (case insensitive)', () => {
      expect(parseScpiBool('OFF')).toBe(false);
      expect(parseScpiBool('off')).toBe(false);
      expect(parseScpiBool('Off')).toBe(false);
    });

    it('parses "TRUE" as true (case insensitive)', () => {
      expect(parseScpiBool('TRUE')).toBe(true);
      expect(parseScpiBool('true')).toBe(true);
    });

    it('parses "FALSE" as false (case insensitive)', () => {
      expect(parseScpiBool('FALSE')).toBe(false);
      expect(parseScpiBool('false')).toBe(false);
    });

    it('parses with leading/trailing whitespace', () => {
      expect(parseScpiBool('  1  \n')).toBe(true);
      expect(parseScpiBool('  OFF  \n')).toBe(false);
    });

    it('returns false for unrecognized strings', () => {
      expect(parseScpiBool('invalid')).toBe(false);
      expect(parseScpiBool('')).toBe(false);
    });
  });

  describe('parseScpiString', () => {
    it('removes leading and trailing whitespace', () => {
      expect(parseScpiString('  hello  ')).toBe('hello');
    });

    it('removes trailing newline', () => {
      expect(parseScpiString('hello\n')).toBe('hello');
    });

    it('removes double quotes', () => {
      expect(parseScpiString('"hello world"')).toBe('hello world');
    });

    it('removes single quotes', () => {
      expect(parseScpiString("'hello world'")).toBe('hello world');
    });

    it('returns empty string as-is', () => {
      expect(parseScpiString('')).toBe('');
    });

    it('handles string with only whitespace', () => {
      expect(parseScpiString('   ')).toBe('');
    });

    it('handles mixed quote and whitespace', () => {
      expect(parseScpiString('  "test"  \n')).toBe('test');
    });
  });

  describe('formatScpiNumber', () => {
    it('formats integer', () => {
      expect(formatScpiNumber(42)).toBe('42');
    });

    it('formats floating point with reasonable precision', () => {
      expect(formatScpiNumber(3.14159)).toBe('3.14159');
    });

    it('formats small number in scientific notation', () => {
      const result = formatScpiNumber(0.000001);
      expect(parseFloat(result)).toBeCloseTo(0.000001, 9);
    });

    it('formats large number in scientific notation', () => {
      const result = formatScpiNumber(1000000000);
      expect(parseFloat(result)).toBeCloseTo(1000000000, 0);
    });

    it('formats negative number', () => {
      expect(formatScpiNumber(-42.5)).toBe('-42.5');
    });

    it('formats zero', () => {
      expect(formatScpiNumber(0)).toBe('0');
    });
  });

  describe('formatScpiBool', () => {
    it('formats true as "ON"', () => {
      expect(formatScpiBool(true)).toBe('ON');
    });

    it('formats false as "OFF"', () => {
      expect(formatScpiBool(false)).toBe('OFF');
    });
  });

  describe('formatScpiString', () => {
    it('formats simple string', () => {
      expect(formatScpiString('hello')).toBe('hello');
    });

    it('adds quotes for string with spaces', () => {
      expect(formatScpiString('hello world')).toBe('"hello world"');
    });

    it('adds quotes for string with special characters', () => {
      expect(formatScpiString('test,value')).toBe('"test,value"');
    });

    it('handles empty string', () => {
      expect(formatScpiString('')).toBe('');
    });
  });
});
