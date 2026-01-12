import { describe, it, expect } from 'vitest';
import {
  parseResourceString,
  buildResourceString,
  matchResourcePattern,
} from '../src/resource-string.js';
import type {
  ParsedUSBResource,
  ParsedSerialResource,
  ParsedTCPIPSocketResource,
  ParsedTCPIPInstrResource,
} from '../src/types.js';

describe('parseResourceString', () => {
  describe('USB resources', () => {
    it('parses valid USB resource string with all fields', () => {
      const result = parseResourceString('USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedUSBResource;
        expect(parsed.interfaceType).toBe('USB');
        expect(parsed.boardNumber).toBe(0);
        expect(parsed.vendorId).toBe(0x1ab1);
        expect(parsed.productId).toBe(0x04ce);
        expect(parsed.serialNumber).toBe('DS1ZA123456789');
        expect(parsed.resourceClass).toBe('INSTR');
      }
    });

    it('parses USB resource string without serial number', () => {
      const result = parseResourceString('USB0::0x1AB1::0x04CE::INSTR');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedUSBResource;
        expect(parsed.interfaceType).toBe('USB');
        expect(parsed.vendorId).toBe(0x1ab1);
        expect(parsed.productId).toBe(0x04ce);
        expect(parsed.serialNumber).toBeUndefined();
        expect(parsed.resourceClass).toBe('INSTR');
      }
    });

    it('parses USB resource string with decimal vendor/product IDs', () => {
      const result = parseResourceString('USB0::6827::1230::SN12345::INSTR');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedUSBResource;
        expect(parsed.vendorId).toBe(6827);
        expect(parsed.productId).toBe(1230);
      }
    });

    it('parses USB resource string without board number', () => {
      const result = parseResourceString('USB::0x1AB1::0x04CE::DS1ZA123::INSTR');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedUSBResource;
        expect(parsed.boardNumber).toBe(0);
        expect(parsed.vendorId).toBe(0x1ab1);
      }
    });

    it('parses USB resource string with higher board number', () => {
      const result = parseResourceString('USB2::0x1AB1::0x04CE::DS1ZA123::INSTR');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedUSBResource;
        expect(parsed.boardNumber).toBe(2);
      }
    });

    it('returns Err for USB resource with missing vendor ID', () => {
      const result = parseResourceString('USB0::::0x04CE::INSTR');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Invalid');
      }
    });

    it('returns Err for USB resource with invalid hex format', () => {
      const result = parseResourceString('USB0::0xZZZZ::0x04CE::INSTR');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Invalid');
      }
    });

    it('returns Err for USB resource with too few fields', () => {
      const result = parseResourceString('USB0::0x1AB1::INSTR');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Invalid');
      }
    });

    it('preserves original resource string', () => {
      const original = 'USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR';
      const result = parseResourceString(original);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.resourceString).toBe(original);
      }
    });

    it('handles lowercase hex values', () => {
      const result = parseResourceString('USB0::0x1ab1::0x04ce::SERIAL::INSTR');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedUSBResource;
        expect(parsed.vendorId).toBe(0x1ab1);
        expect(parsed.productId).toBe(0x04ce);
      }
    });

    it('handles mixed case hex values', () => {
      const result = parseResourceString('USB0::0x1Ab1::0x04Ce::SERIAL::INSTR');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedUSBResource;
        expect(parsed.vendorId).toBe(0x1ab1);
        expect(parsed.productId).toBe(0x04ce);
      }
    });
  });

  describe('Serial (ASRL) resources', () => {
    it('parses Linux USB serial port path', () => {
      const result = parseResourceString('ASRL/dev/ttyUSB0::INSTR');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedSerialResource;
        expect(parsed.interfaceType).toBe('ASRL');
        expect(parsed.portPath).toBe('/dev/ttyUSB0');
        expect(parsed.resourceClass).toBe('INSTR');
        expect(parsed.boardNumber).toBe(0);
      }
    });

    it('parses macOS USB serial port path', () => {
      const result = parseResourceString('ASRL/dev/tty.usbserial-A50285BI::INSTR');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedSerialResource;
        expect(parsed.portPath).toBe('/dev/tty.usbserial-A50285BI');
      }
    });

    it('parses Windows COM port (full format)', () => {
      const result = parseResourceString('ASRLCOM3::INSTR');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedSerialResource;
        expect(parsed.portPath).toBe('COM3');
      }
    });

    it('parses Windows COM port (shorthand format)', () => {
      const result = parseResourceString('ASRL3::INSTR');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedSerialResource;
        expect(parsed.portPath).toBe('COM3');
      }
    });

    it('parses double-digit COM port shorthand', () => {
      const result = parseResourceString('ASRL12::INSTR');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedSerialResource;
        expect(parsed.portPath).toBe('COM12');
      }
    });

    it('returns Err for ASRL resource without port', () => {
      const result = parseResourceString('ASRL::INSTR');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Invalid');
      }
    });

    it('returns Err for ASRL resource without INSTR suffix', () => {
      const result = parseResourceString('ASRL/dev/ttyUSB0');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Invalid');
      }
    });

    it('preserves original resource string for serial', () => {
      const original = 'ASRL/dev/ttyUSB0::INSTR';
      const result = parseResourceString(original);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.resourceString).toBe(original);
      }
    });
  });

  describe('TCP/IP SOCKET resources', () => {
    it('parses TCP/IP socket with IP address', () => {
      const result = parseResourceString('TCPIP0::192.168.1.100::5025::SOCKET');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedTCPIPSocketResource;
        expect(parsed.interfaceType).toBe('TCPIP');
        expect(parsed.boardNumber).toBe(0);
        expect(parsed.host).toBe('192.168.1.100');
        expect(parsed.port).toBe(5025);
        expect(parsed.resourceClass).toBe('SOCKET');
      }
    });

    it('parses TCP/IP socket with hostname', () => {
      const result = parseResourceString('TCPIP0::scope.local::5025::SOCKET');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedTCPIPSocketResource;
        expect(parsed.host).toBe('scope.local');
        expect(parsed.port).toBe(5025);
      }
    });

    it('parses TCP/IP socket without board number', () => {
      const result = parseResourceString('TCPIP::192.168.1.100::5025::SOCKET');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedTCPIPSocketResource;
        expect(parsed.boardNumber).toBe(0);
        expect(parsed.host).toBe('192.168.1.100');
      }
    });

    it('parses TCP/IP socket with custom port', () => {
      const result = parseResourceString('TCPIP0::10.0.0.50::5555::SOCKET');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedTCPIPSocketResource;
        expect(parsed.port).toBe(5555);
      }
    });

    it('returns Err for TCP/IP socket with missing port', () => {
      const result = parseResourceString('TCPIP0::192.168.1.100::SOCKET');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Invalid');
      }
    });

    it('returns Err for TCP/IP socket with invalid port', () => {
      const result = parseResourceString('TCPIP0::192.168.1.100::abc::SOCKET');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Invalid');
      }
    });

    it('returns Err for TCP/IP socket with port out of range', () => {
      const result = parseResourceString('TCPIP0::192.168.1.100::70000::SOCKET');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('port');
      }
    });
  });

  describe('TCP/IP INSTR resources (VXI-11)', () => {
    it('parses TCP/IP INSTR with default LAN device', () => {
      const result = parseResourceString('TCPIP0::192.168.1.100::INSTR');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedTCPIPInstrResource;
        expect(parsed.interfaceType).toBe('TCPIP');
        expect(parsed.host).toBe('192.168.1.100');
        expect(parsed.lanDeviceName).toBe('inst0');
        expect(parsed.resourceClass).toBe('INSTR');
      }
    });

    it('parses TCP/IP INSTR with explicit LAN device name', () => {
      const result = parseResourceString('TCPIP0::192.168.1.100::inst0::INSTR');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedTCPIPInstrResource;
        expect(parsed.lanDeviceName).toBe('inst0');
      }
    });

    it('parses TCP/IP INSTR with custom LAN device name', () => {
      const result = parseResourceString('TCPIP0::192.168.1.100::gpib0,1::INSTR');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedTCPIPInstrResource;
        expect(parsed.lanDeviceName).toBe('gpib0,1');
      }
    });

    it('parses TCP/IP INSTR without board number', () => {
      const result = parseResourceString('TCPIP::192.168.1.100::INSTR');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const parsed = result.value as ParsedTCPIPInstrResource;
        expect(parsed.boardNumber).toBe(0);
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('returns Err for empty string', () => {
      const result = parseResourceString('');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('empty');
      }
    });

    it('returns Err for unknown interface type', () => {
      const result = parseResourceString('GPIB0::1::INSTR');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Unsupported');
      }
    });

    it('returns Err for malformed resource string', () => {
      const result = parseResourceString('not-a-valid-resource');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Invalid');
      }
    });

    it('handles whitespace in resource string', () => {
      const result = parseResourceString('  USB0::0x1AB1::0x04CE::DS1ZA123::INSTR  ');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.interfaceType).toBe('USB');
      }
    });

    it('is case insensitive for interface type', () => {
      const result = parseResourceString('usb0::0x1AB1::0x04CE::DS1ZA123::INSTR');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.interfaceType).toBe('USB');
      }
    });

    it('is case insensitive for resource class', () => {
      const result = parseResourceString('USB0::0x1AB1::0x04CE::DS1ZA123::instr');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.resourceClass).toBe('INSTR');
      }
    });
  });
});

describe('buildResourceString', () => {
  describe('USB resources', () => {
    it('builds USB resource string with all fields', () => {
      const resource: ParsedUSBResource = {
        interfaceType: 'USB',
        boardNumber: 0,
        vendorId: 0x1ab1,
        productId: 0x04ce,
        serialNumber: 'DS1ZA123456789',
        resourceClass: 'INSTR',
        resourceString: '',
      };

      const result = buildResourceString(resource);

      expect(result).toBe('USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR');
    });

    it('builds USB resource string without serial number', () => {
      const resource: ParsedUSBResource = {
        interfaceType: 'USB',
        boardNumber: 0,
        vendorId: 0x1ab1,
        productId: 0x04ce,
        resourceClass: 'INSTR',
        resourceString: '',
      };

      const result = buildResourceString(resource);

      expect(result).toBe('USB0::0x1AB1::0x04CE::INSTR');
    });

    it('builds USB resource string with non-zero board number', () => {
      const resource: ParsedUSBResource = {
        interfaceType: 'USB',
        boardNumber: 2,
        vendorId: 0x1ab1,
        productId: 0x04ce,
        serialNumber: 'SN123',
        resourceClass: 'INSTR',
        resourceString: '',
      };

      const result = buildResourceString(resource);

      expect(result).toBe('USB2::0x1AB1::0x04CE::SN123::INSTR');
    });
  });

  describe('Serial resources', () => {
    it('builds serial resource string with Linux path', () => {
      const resource: ParsedSerialResource = {
        interfaceType: 'ASRL',
        boardNumber: 0,
        portPath: '/dev/ttyUSB0',
        resourceClass: 'INSTR',
        resourceString: '',
      };

      const result = buildResourceString(resource);

      expect(result).toBe('ASRL/dev/ttyUSB0::INSTR');
    });

    it('builds serial resource string with Windows COM port', () => {
      const resource: ParsedSerialResource = {
        interfaceType: 'ASRL',
        boardNumber: 0,
        portPath: 'COM3',
        resourceClass: 'INSTR',
        resourceString: '',
      };

      const result = buildResourceString(resource);

      expect(result).toBe('ASRLCOM3::INSTR');
    });
  });

  describe('TCP/IP SOCKET resources', () => {
    it('builds TCP/IP socket resource string', () => {
      const resource: ParsedTCPIPSocketResource = {
        interfaceType: 'TCPIP',
        boardNumber: 0,
        host: '192.168.1.100',
        port: 5025,
        resourceClass: 'SOCKET',
        resourceString: '',
      };

      const result = buildResourceString(resource);

      expect(result).toBe('TCPIP0::192.168.1.100::5025::SOCKET');
    });
  });

  describe('TCP/IP INSTR resources', () => {
    it('builds TCP/IP INSTR resource string with LAN device', () => {
      const resource: ParsedTCPIPInstrResource = {
        interfaceType: 'TCPIP',
        boardNumber: 0,
        host: '192.168.1.100',
        lanDeviceName: 'inst0',
        resourceClass: 'INSTR',
        resourceString: '',
      };

      const result = buildResourceString(resource);

      expect(result).toBe('TCPIP0::192.168.1.100::inst0::INSTR');
    });
  });
});

describe('matchResourcePattern', () => {
  const resources = [
    'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
    'USB0::0x1AB1::0x0E11::DL3A456::INSTR',
    'USB1::0x0957::0x0907::MY12345::INSTR',
    'ASRL/dev/ttyUSB0::INSTR',
    'ASRL/dev/ttyUSB1::INSTR',
    'TCPIP0::192.168.1.100::5025::SOCKET',
  ];

  it('matches all resources with default pattern', () => {
    const matches = resources.filter((r) => matchResourcePattern(r, '?*::INSTR'));

    expect(matches).toHaveLength(5);
    expect(matches).not.toContain('TCPIP0::192.168.1.100::5025::SOCKET');
  });

  it('matches all USB instruments', () => {
    const matches = resources.filter((r) => matchResourcePattern(r, 'USB?*::INSTR'));

    expect(matches).toHaveLength(3);
    expect(matches).toContain('USB0::0x1AB1::0x04CE::DS1ZA123::INSTR');
    expect(matches).toContain('USB0::0x1AB1::0x0E11::DL3A456::INSTR');
    expect(matches).toContain('USB1::0x0957::0x0907::MY12345::INSTR');
  });

  it('matches all Rigol USB devices by vendor ID', () => {
    const matches = resources.filter((r) => matchResourcePattern(r, 'USB?*::0x1AB1::?*::INSTR'));

    expect(matches).toHaveLength(2);
    expect(matches).toContain('USB0::0x1AB1::0x04CE::DS1ZA123::INSTR');
    expect(matches).toContain('USB0::0x1AB1::0x0E11::DL3A456::INSTR');
  });

  it('matches all serial ports', () => {
    const matches = resources.filter((r) => matchResourcePattern(r, 'ASRL?*::INSTR'));

    expect(matches).toHaveLength(2);
    expect(matches).toContain('ASRL/dev/ttyUSB0::INSTR');
    expect(matches).toContain('ASRL/dev/ttyUSB1::INSTR');
  });

  it('matches TCP/IP sockets', () => {
    const matches = resources.filter((r) => matchResourcePattern(r, 'TCPIP?*::SOCKET'));

    expect(matches).toHaveLength(1);
    expect(matches).toContain('TCPIP0::192.168.1.100::5025::SOCKET');
  });

  it('matches using ? for single character', () => {
    const matches = resources.filter((r) => matchResourcePattern(r, 'USB?::0x1AB1::?*::INSTR'));

    expect(matches).toHaveLength(2);
  });

  it('matches using * for any characters', () => {
    const matches = resources.filter((r) => matchResourcePattern(r, '*::INSTR'));

    expect(matches).toHaveLength(5);
  });

  it('returns false for non-matching pattern', () => {
    const result = matchResourcePattern('USB0::0x1AB1::0x04CE::DS1ZA123::INSTR', 'GPIB?*::INSTR');

    expect(result).toBe(false);
  });

  it('handles pattern with no wildcards (exact match)', () => {
    const result = matchResourcePattern(
      'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
      'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR'
    );

    expect(result).toBe(true);
  });

  it('is case insensitive', () => {
    const result = matchResourcePattern('USB0::0x1AB1::0x04CE::DS1ZA123::INSTR', 'usb?*::instr');

    expect(result).toBe(true);
  });
});
