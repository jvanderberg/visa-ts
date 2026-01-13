/**
 * Tests for SCPI parser utilities
 */

import { describe, it, expect } from 'vitest';
import {
  parseScpiNumber,
  parseScpiBool,
  parseScpiEnum,
  parseDefiniteLengthBlock,
  parseArbitraryBlock,
} from '../../src/util/scpi-parser.js';
import { isOk, isErr } from '../../src/result.js';

describe('parseScpiNumber', () => {
  it('parses a simple integer', () => {
    const result = parseScpiNumber('123');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(123);
  });

  it('parses a simple float', () => {
    const result = parseScpiNumber('1.234');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(1.234);
  });

  it('parses scientific notation with positive exponent', () => {
    const result = parseScpiNumber('1.234E+03');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(1234);
  });

  it('parses scientific notation with negative exponent', () => {
    const result = parseScpiNumber('1.234E-03');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBeCloseTo(0.001234, 6);
  });

  it('parses lowercase scientific notation', () => {
    const result = parseScpiNumber('1.234e+03');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(1234);
  });

  it('parses negative numbers', () => {
    const result = parseScpiNumber('-5.5');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(-5.5);
  });

  it('returns Err for SCPI overflow value 9.9E37', () => {
    const result = parseScpiNumber('9.9E37');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toContain('Overflow');
  });

  it('returns Err for SCPI overflow value 9.9E+37', () => {
    const result = parseScpiNumber('9.9E+37');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toContain('Overflow');
  });

  it('returns Err for negative overflow -9.9E37', () => {
    const result = parseScpiNumber('-9.9E37');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toContain('Overflow');
  });

  it('returns Err for explicit plus sign +9.9E37', () => {
    const result = parseScpiNumber('+9.9E37');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toContain('Overflow');
  });

  it('returns Err for lowercase overflow 9.9e37', () => {
    const result = parseScpiNumber('9.9e37');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toContain('Overflow');
  });

  it('returns Err for whitespace-only string', () => {
    const result = parseScpiNumber('   ');
    expect(isErr(result)).toBe(true);
  });

  it('returns Err for asterisks (invalid measurement)', () => {
    const result = parseScpiNumber('****');
    expect(isErr(result)).toBe(true);
  });

  it('returns Err for empty string', () => {
    const result = parseScpiNumber('');
    expect(isErr(result)).toBe(true);
  });

  it('returns Err for non-numeric string', () => {
    const result = parseScpiNumber('abc');
    expect(isErr(result)).toBe(true);
  });

  it('trims whitespace before parsing', () => {
    const result = parseScpiNumber('  1.5  ');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(1.5);
  });

  it('handles leading plus sign', () => {
    const result = parseScpiNumber('+3.14');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(3.14);
  });

  it('returns Err for line noise with leading digits', () => {
    const result = parseScpiNumber('123garbage');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toContain('Invalid number format');
  });

  it('returns Err for line noise with embedded numbers', () => {
    const result = parseScpiNumber('abc123def');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toContain('Invalid number format');
  });

  it('returns Err for Infinity string', () => {
    const result = parseScpiNumber('Infinity');
    expect(isErr(result)).toBe(true);
  });

  it('returns Err for -Infinity string', () => {
    const result = parseScpiNumber('-Infinity');
    expect(isErr(result)).toBe(true);
  });

  it('returns Err for NaN string', () => {
    const result = parseScpiNumber('NaN');
    expect(isErr(result)).toBe(true);
  });

  it('parses numbers with leading zeros', () => {
    const result = parseScpiNumber('007');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(7);
  });

  it('parses decimal with leading zeros', () => {
    const result = parseScpiNumber('00.123');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(0.123);
  });

  it('returns Err for numbers exceeding JavaScript limits', () => {
    const result = parseScpiNumber('1e309');
    expect(isErr(result)).toBe(true);
  });

  it('parses numbers at MAX_VALUE boundary', () => {
    const result = parseScpiNumber('1.7976931348623157e+308');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(Number.isFinite(result.value)).toBe(true);
  });

  it('parses zero', () => {
    const result = parseScpiNumber('0');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(0);
  });

  it('parses negative zero', () => {
    const result = parseScpiNumber('-0');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(Object.is(result.value, -0)).toBe(true);
  });

  it('parses numbers with leading decimal', () => {
    const result = parseScpiNumber('.5');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(0.5);
  });

  it('parses negative numbers with leading decimal', () => {
    const result = parseScpiNumber('-.5');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(-0.5);
  });
});

describe('parseScpiBool', () => {
  it('returns Ok(true) for "1"', () => {
    const result = parseScpiBool('1');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(true);
  });

  it('returns Ok(true) for "ON"', () => {
    const result = parseScpiBool('ON');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(true);
  });

  it('returns Ok(true) for lowercase "on"', () => {
    const result = parseScpiBool('on');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(true);
  });

  it('returns Ok(true) for "TRUE"', () => {
    const result = parseScpiBool('TRUE');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(true);
  });

  it('returns Ok(true) for lowercase "true"', () => {
    const result = parseScpiBool('true');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(true);
  });

  it('returns Ok(false) for "0"', () => {
    const result = parseScpiBool('0');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(false);
  });

  it('returns Ok(false) for "OFF"', () => {
    const result = parseScpiBool('OFF');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(false);
  });

  it('returns Ok(false) for lowercase "off"', () => {
    const result = parseScpiBool('off');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(false);
  });

  it('returns Ok(false) for "FALSE"', () => {
    const result = parseScpiBool('FALSE');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(false);
  });

  it('returns Ok(false) for lowercase "false"', () => {
    const result = parseScpiBool('false');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(false);
  });

  it('trims whitespace before parsing', () => {
    const result1 = parseScpiBool('  1  ');
    expect(isOk(result1)).toBe(true);
    if (isOk(result1)) expect(result1.value).toBe(true);

    const result2 = parseScpiBool('  ON  ');
    expect(isOk(result2)).toBe(true);
    if (isOk(result2)) expect(result2.value).toBe(true);
  });

  it('returns Ok(true) for mixed case "TrUe"', () => {
    const result = parseScpiBool('TrUe');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(true);
  });

  it('returns Ok(false) for mixed case "FaLsE"', () => {
    const result = parseScpiBool('FaLsE');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe(false);
  });

  it('returns Err for unrecognized values', () => {
    const result1 = parseScpiBool('invalid');
    expect(isErr(result1)).toBe(true);
    if (isErr(result1)) expect(result1.error.message).toContain('Unknown boolean value');

    const result2 = parseScpiBool('');
    expect(isErr(result2)).toBe(true);

    const result3 = parseScpiBool('2');
    expect(isErr(result3)).toBe(true);
  });
});

describe('parseScpiEnum', () => {
  const modes = { VOLT: 'voltage', CURR: 'current', RES: 'resistance' };

  it('maps known enum values', () => {
    const result1 = parseScpiEnum('VOLT', modes);
    expect(isOk(result1)).toBe(true);
    if (isOk(result1)) expect(result1.value).toBe('voltage');

    const result2 = parseScpiEnum('CURR', modes);
    expect(isOk(result2)).toBe(true);
    if (isOk(result2)) expect(result2.value).toBe('current');

    const result3 = parseScpiEnum('RES', modes);
    expect(isOk(result3)).toBe(true);
    if (isOk(result3)) expect(result3.value).toBe('resistance');
  });

  it('handles case-insensitive matching', () => {
    const result1 = parseScpiEnum('volt', modes);
    expect(isOk(result1)).toBe(true);
    if (isOk(result1)) expect(result1.value).toBe('voltage');

    const result2 = parseScpiEnum('Volt', modes);
    expect(isOk(result2)).toBe(true);
    if (isOk(result2)) expect(result2.value).toBe('voltage');
  });

  it('trims whitespace before parsing', () => {
    const result = parseScpiEnum('  VOLT  ', modes);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe('voltage');
  });

  it('returns Err for unknown enum values', () => {
    const result1 = parseScpiEnum('UNKNOWN', modes);
    expect(isErr(result1)).toBe(true);
    if (isErr(result1)) {
      expect(result1.error.message).toContain('Unknown enum value');
      expect(result1.error.message).toContain('VOLT, CURR, RES');
    }

    const result2 = parseScpiEnum('', modes);
    expect(isErr(result2)).toBe(true);
  });

  it('works with numeric string keys', () => {
    const numericModes = { '0': 'auto', '1': 'manual', '2': 'remote' };
    const result1 = parseScpiEnum('0', numericModes);
    expect(isOk(result1)).toBe(true);
    if (isOk(result1)) expect(result1.value).toBe('auto');

    const result2 = parseScpiEnum('1', numericModes);
    expect(isOk(result2)).toBe(true);
    if (isOk(result2)) expect(result2.value).toBe('manual');
  });

  it('returns Err with empty valid values list for empty mapping', () => {
    const result = parseScpiEnum('VOLT', {});
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toContain('Unknown enum value');
  });

  it('handles mixed-case keys in mapping', () => {
    const mixedCaseMapping = { VoLt: 'voltage', CuRr: 'current' };
    const result = parseScpiEnum('volt', mixedCaseMapping);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe('voltage');
  });
});

describe('parseDefiniteLengthBlock', () => {
  it('parses single-digit length header', () => {
    // #15 means 5 bytes of data (1 digit specifying length)
    const buffer = Buffer.from('#15hello');
    const result = parseDefiniteLengthBlock(buffer);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.header).toBe(3); // # + 1 + "5"
      expect(result.value.length).toBe(5);
    }
  });

  it('parses multi-digit length header', () => {
    // #3100 means 100 bytes of data (3 digits specifying length)
    const buffer = Buffer.from('#3100' + 'x'.repeat(100));
    const result = parseDefiniteLengthBlock(buffer);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.header).toBe(5); // # + 3 + "100"
      expect(result.value.length).toBe(100);
    }
  });

  it('parses 9-digit length header', () => {
    // #9000001200 means 1200 bytes of data
    const buffer = Buffer.from('#9000001200');
    const result = parseDefiniteLengthBlock(buffer);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.header).toBe(11); // # + 9 + "000001200"
      expect(result.value.length).toBe(1200);
    }
  });

  it('returns Err for buffer without # prefix', () => {
    const buffer = Buffer.from('invalid');
    const result = parseDefiniteLengthBlock(buffer);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toContain('missing # prefix');
  });

  it('returns Err for empty buffer', () => {
    const buffer = Buffer.alloc(0);
    const result = parseDefiniteLengthBlock(buffer);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toContain('empty buffer');
  });

  it('returns Err for buffer too short for header', () => {
    const buffer = Buffer.from('#3');
    const result = parseDefiniteLengthBlock(buffer);
    expect(isErr(result)).toBe(true);
  });

  it('returns Err for indefinite length block (#0)', () => {
    // #0 is indefinite length - parseDefiniteLengthBlock should reject it
    const buffer = Buffer.from('#0somedata\n');
    const result = parseDefiniteLengthBlock(buffer);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toContain('indefinite length');
  });

  it('returns Err for invalid digit count', () => {
    const buffer = Buffer.from('#a123');
    const result = parseDefiniteLengthBlock(buffer);
    expect(isErr(result)).toBe(true);
  });

  it('returns Err for buffer with only # character', () => {
    const buffer = Buffer.from('#');
    const result = parseDefiniteLengthBlock(buffer);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toContain('buffer too short');
  });

  it('returns Err when length digits contain non-numeric characters', () => {
    const buffer = Buffer.from('#3abc'); // 3 digits but "abc" is not a number
    const result = parseDefiniteLengthBlock(buffer);
    expect(isErr(result)).toBe(true);
  });

  it('correctly calculates length with binary data containing newlines', () => {
    const buffer = Buffer.from('#15he\nlo'); // length says 5 bytes
    const result = parseDefiniteLengthBlock(buffer);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.length).toBe(5);
    }
  });

  it('handles binary data with null bytes', () => {
    const buffer = Buffer.concat([Buffer.from('#15'), Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04])]);
    const result = parseDefiniteLengthBlock(buffer);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.length).toBe(5);
    }
  });
});

describe('parseArbitraryBlock', () => {
  it('parses indefinite length block with newline terminator', () => {
    const buffer = Buffer.from('#0hello world\n');
    const result = parseArbitraryBlock(buffer);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.header).toBe(2); // #0
      expect(result.value.length).toBe(11); // "hello world"
    }
  });

  it('handles data without newline (assumes rest is data)', () => {
    const buffer = Buffer.from('#0somedata');
    const result = parseArbitraryBlock(buffer);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.header).toBe(2);
      expect(result.value.length).toBe(8); // "somedata"
    }
  });

  it('returns Err for buffer without # prefix', () => {
    const buffer = Buffer.from('invalid');
    const result = parseArbitraryBlock(buffer);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toContain('missing # prefix');
  });

  it('returns Err for definite length block', () => {
    // This is a definite length block - parseArbitraryBlock should reject it
    const buffer = Buffer.from('#15hello');
    const result = parseArbitraryBlock(buffer);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toContain('expected #0');
  });

  it('returns Err for empty buffer', () => {
    const buffer = Buffer.alloc(0);
    const result = parseArbitraryBlock(buffer);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toContain('empty buffer');
  });

  it('returns Err for buffer with only # character', () => {
    const buffer = Buffer.from('#');
    const result = parseArbitraryBlock(buffer);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toContain('buffer too short');
  });

  it('handles empty data in indefinite block (#0 followed by newline)', () => {
    const buffer = Buffer.from('#0\n');
    const result = parseArbitraryBlock(buffer);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.header).toBe(2);
      expect(result.value.length).toBe(0);
    }
  });
});
