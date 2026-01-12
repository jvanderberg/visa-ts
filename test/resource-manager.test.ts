/**
 * ResourceManager tests
 *
 * @packageDocumentation
 */

import { describe, it, expect } from 'vitest';
import type { Transport } from '../src/transports/transport.js';
import type { Result } from '../src/result.js';
import { Ok, Err } from '../src/result.js';

// Mock transport factory
function createMockTransport(options?: {
  openFails?: boolean;
  openError?: Error;
  queryResponse?: string;
  queryFails?: boolean;
}): Transport {
  let state: 'closed' | 'open' = 'closed';

  return {
    get state() {
      return state;
    },
    get isOpen() {
      return state === 'open';
    },
    timeout: 2000,
    readTermination: '\n',
    writeTermination: '\n',

    async open(): Promise<Result<void, Error>> {
      if (options?.openFails) {
        return Err(options.openError ?? new Error('Failed to open'));
      }
      state = 'open';
      return Ok(undefined);
    },

    async close(): Promise<Result<void, Error>> {
      state = 'closed';
      return Ok(undefined);
    },

    async write(): Promise<Result<void, Error>> {
      if (state !== 'open') {
        return Err(new Error('Transport is not open'));
      }
      return Ok(undefined);
    },

    async read(): Promise<Result<string, Error>> {
      if (state !== 'open') {
        return Err(new Error('Transport is not open'));
      }
      return Ok(options?.queryResponse ?? '');
    },

    async query(): Promise<Result<string, Error>> {
      if (state !== 'open') {
        return Err(new Error('Transport is not open'));
      }
      if (options?.queryFails) {
        return Err(new Error('Query failed'));
      }
      return Ok(options?.queryResponse ?? 'RIGOL,DS1104Z,DS1ZA123456789,00.04.04');
    },

    async writeRaw(): Promise<Result<number, Error>> {
      if (state !== 'open') {
        return Err(new Error('Transport is not open'));
      }
      return Ok(0);
    },

    async readRaw(): Promise<Result<Buffer, Error>> {
      if (state !== 'open') {
        return Err(new Error('Transport is not open'));
      }
      return Ok(Buffer.alloc(0));
    },

    async readBytes(): Promise<Result<Buffer, Error>> {
      if (state !== 'open') {
        return Err(new Error('Transport is not open'));
      }
      return Ok(Buffer.alloc(0));
    },

    async clear(): Promise<Result<void, Error>> {
      if (state !== 'open') {
        return Err(new Error('Transport is not open'));
      }
      return Ok(undefined);
    },

    async trigger(): Promise<Result<void, Error>> {
      if (state !== 'open') {
        return Err(new Error('Transport is not open'));
      }
      return Ok(undefined);
    },

    async readStb(): Promise<Result<number, Error>> {
      if (state !== 'open') {
        return Err(new Error('Transport is not open'));
      }
      return Ok(0);
    },
  };
}

describe('ResourceManager', () => {
  describe('createResourceManager', () => {
    it('returns a ResourceManager object', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const rm = createResourceManager();

      expect(rm).toBeDefined();
      expect(typeof rm.listResources).toBe('function');
      expect(typeof rm.listResourcesInfo).toBe('function');
      expect(typeof rm.openResource).toBe('function');
      expect(typeof rm.close).toBe('function');
      expect(Array.isArray(rm.openResources)).toBe(true);
    });

    it('starts with no open resources', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const rm = createResourceManager();

      expect(rm.openResources).toHaveLength(0);
    });
  });

  describe('openResource', () => {
    it('returns Err for empty resource string', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const rm = createResourceManager();

      const result = await rm.openResource('');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('empty');
      }
    });

    it('returns Err for invalid resource string format', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const rm = createResourceManager();

      const result = await rm.openResource('INVALID::RESOURCE');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBeDefined();
      }
    });

    it('returns Err for unsupported interface type (GPIB)', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const rm = createResourceManager();

      const result = await rm.openResource('GPIB0::1::INSTR');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('GPIB');
      }
    });

    it('opens a TCP/IP socket resource with mock transport', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const mockTransport = createMockTransport();

      const rm = createResourceManager({
        _createTcpipTransport: () => mockTransport,
      });

      const result = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.resourceString).toBe('TCPIP0::192.168.1.100::5025::SOCKET');
        expect(result.value.isOpen).toBe(true);
        expect(result.value.resourceInfo.interfaceType).toBe('TCPIP');
      }
    });

    it('returns Err when transport open fails', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const mockTransport = createMockTransport({
        openFails: true,
        openError: new Error('Connection refused'),
      });

      const rm = createResourceManager({
        _createTcpipTransport: () => mockTransport,
      });

      const result = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Connection refused');
      }
    });

    it('applies OpenOptions to transport', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const mockTransport = createMockTransport();

      const rm = createResourceManager({
        _createTcpipTransport: () => mockTransport,
      });

      const result = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET', {
        timeout: 5000,
        readTermination: '\r\n',
        writeTermination: '\r\n',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.timeout).toBe(5000);
        expect(result.value.readTermination).toBe('\r\n');
        expect(result.value.writeTermination).toBe('\r\n');
      }
    });

    it('adds opened resource to openResources list', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const mockTransport = createMockTransport();

      const rm = createResourceManager({
        _createTcpipTransport: () => mockTransport,
      });

      await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');
      expect(rm.openResources).toHaveLength(1);
    });

    it('opens USB resource with mock transport', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const mockTransport = createMockTransport();

      const rm = createResourceManager({
        _createUsbtmcTransport: () => mockTransport,
      });

      const result = await rm.openResource('USB0::0x1AB1::0x04CE::DS1ZA123::INSTR');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.resourceInfo.interfaceType).toBe('USB');
      }
    });

    it('opens serial resource with mock transport', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const mockTransport = createMockTransport();

      const rm = createResourceManager({
        _createSerialTransport: () => mockTransport,
      });

      const result = await rm.openResource('ASRL/dev/ttyUSB0::INSTR');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.resourceInfo.interfaceType).toBe('ASRL');
      }
    });

    it('returns Err for TCP/IP INSTR (VXI-11 not supported)', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const rm = createResourceManager();

      const result = await rm.openResource('TCPIP0::192.168.1.100::INSTR');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('VXI-11');
      }
    });
  });

  describe('listResources', () => {
    it('returns empty array when no transports have devices', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const rm = createResourceManager({
        _listSerialPorts: async () => [],
        _listUsbDevices: async () => [],
      });

      const resources = await rm.listResources();
      expect(resources).toEqual([]);
    });

    it('returns discovered serial ports', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const rm = createResourceManager({
        _listSerialPorts: async () => [{ path: '/dev/ttyUSB0' }, { path: '/dev/ttyUSB1' }],
        _listUsbDevices: async () => [],
      });

      const resources = await rm.listResources();
      expect(resources).toContain('ASRL/dev/ttyUSB0::INSTR');
      expect(resources).toContain('ASRL/dev/ttyUSB1::INSTR');
    });

    it('returns discovered USB-TMC devices', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const rm = createResourceManager({
        _listSerialPorts: async () => [],
        _listUsbDevices: async () => [
          { vendorId: 0x1ab1, productId: 0x04ce, serialNumber: 'DS1ZA123456789' },
        ],
      });

      const resources = await rm.listResources();
      expect(resources).toContain('USB0::0x1AB1::0x04CE::DS1ZA123456789::INSTR');
    });

    it('filters resources by pattern', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const rm = createResourceManager({
        _listSerialPorts: async () => [{ path: '/dev/ttyUSB0' }],
        _listUsbDevices: async () => [
          { vendorId: 0x1ab1, productId: 0x04ce, serialNumber: 'DS1ZA123' },
        ],
      });

      const usbOnly = await rm.listResources('USB?*::INSTR');
      expect(usbOnly).toHaveLength(1);
      expect(usbOnly[0]).toContain('USB0');

      const serialOnly = await rm.listResources('ASRL?*::INSTR');
      expect(serialOnly).toHaveLength(1);
      expect(serialOnly[0]).toContain('ASRL');
    });

    it('returns USB devices without serial number', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const rm = createResourceManager({
        _listSerialPorts: async () => [],
        _listUsbDevices: async () => [{ vendorId: 0x1ab1, productId: 0x04ce }],
      });

      const resources = await rm.listResources();
      expect(resources).toContain('USB0::0x1AB1::0x04CE::INSTR');
    });
  });

  describe('listResourcesInfo', () => {
    it('returns empty array when no devices found', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const rm = createResourceManager({
        _listSerialPorts: async () => [],
        _listUsbDevices: async () => [],
      });

      const info = await rm.listResourcesInfo();
      expect(info).toEqual([]);
    });

    it('returns ResourceInfo for discovered devices', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const rm = createResourceManager({
        _listSerialPorts: async () => [{ path: '/dev/ttyUSB0' }],
        _listUsbDevices: async () => [
          { vendorId: 0x1ab1, productId: 0x04ce, serialNumber: 'DS1ZA123' },
        ],
      });

      const info = await rm.listResourcesInfo();
      expect(info).toHaveLength(2);

      const usbInfo = info.find((i) => i.interfaceType === 'USB');
      expect(usbInfo).toBeDefined();
      expect(usbInfo?.resourceString).toContain('USB0');

      const serialInfo = info.find((i) => i.interfaceType === 'ASRL');
      expect(serialInfo).toBeDefined();
      expect(serialInfo?.resourceString).toContain('ASRL');
    });

    it('filters ResourceInfo by pattern', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const rm = createResourceManager({
        _listSerialPorts: async () => [{ path: '/dev/ttyUSB0' }],
        _listUsbDevices: async () => [
          { vendorId: 0x1ab1, productId: 0x04ce, serialNumber: 'DS1ZA123' },
        ],
      });

      const usbOnly = await rm.listResourcesInfo('USB?*::INSTR');
      expect(usbOnly).toHaveLength(1);
      expect(usbOnly[0].interfaceType).toBe('USB');
    });
  });

  describe('close', () => {
    it('closes all open resources', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const mockTransport1 = createMockTransport();
      const mockTransport2 = createMockTransport();
      let transportIndex = 0;

      const rm = createResourceManager({
        _createTcpipTransport: () => {
          return transportIndex++ === 0 ? mockTransport1 : mockTransport2;
        },
      });

      await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');
      await rm.openResource('TCPIP0::192.168.1.101::5025::SOCKET');

      expect(rm.openResources).toHaveLength(2);

      await rm.close();

      expect(rm.openResources).toHaveLength(0);
      expect(mockTransport1.isOpen).toBe(false);
      expect(mockTransport2.isOpen).toBe(false);
    });

    it('removes resources from openResources when individually closed', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const mockTransport = createMockTransport();

      const rm = createResourceManager({
        _createTcpipTransport: () => mockTransport,
      });

      const result = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');
      expect(rm.openResources).toHaveLength(1);

      if (result.ok) {
        await result.value.close();
      }

      expect(rm.openResources).toHaveLength(0);
    });
  });

  describe('openResources', () => {
    it('returns immutable copy of open resources array', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const mockTransport = createMockTransport();

      const rm = createResourceManager({
        _createTcpipTransport: () => mockTransport,
      });

      await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');

      const resources1 = rm.openResources;
      const resources2 = rm.openResources;

      // Should return a new array each time (defensive copy)
      expect(resources1).not.toBe(resources2);
      expect(resources1).toEqual(resources2);
    });
  });

  describe('edge cases', () => {
    it('handles double close on ResourceManager gracefully', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const mockTransport = createMockTransport();

      const rm = createResourceManager({
        _createTcpipTransport: () => mockTransport,
      });

      await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');
      expect(rm.openResources).toHaveLength(1);

      // First close
      await rm.close();
      expect(rm.openResources).toHaveLength(0);

      // Second close should be safe (no resources to close)
      await rm.close();
      expect(rm.openResources).toHaveLength(0);
    });

    it('can open multiple resources with same address', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      let transportCount = 0;

      const rm = createResourceManager({
        _createTcpipTransport: () => {
          transportCount++;
          return createMockTransport();
        },
      });

      // Open same resource twice - should create two connections
      const result1 = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');
      const result2 = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      expect(rm.openResources).toHaveLength(2);
      expect(transportCount).toBe(2);
    });

    it('continues closing other resources if one close fails', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');

      let closeCallCount = 0;
      const failingTransport: Transport = {
        ...createMockTransport(),
        async close(): Promise<Result<void, Error>> {
          closeCallCount++;
          return Err(new Error('Close failed'));
        },
      };
      const successTransport = createMockTransport();

      let transportIndex = 0;
      const rm = createResourceManager({
        _createTcpipTransport: () => {
          return transportIndex++ === 0 ? failingTransport : successTransport;
        },
      });

      await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');
      await rm.openResource('TCPIP0::192.168.1.101::5025::SOCKET');

      expect(rm.openResources).toHaveLength(2);

      // Close should attempt both even if first fails
      await rm.close();

      // Both should be removed from open list even if close failed
      expect(rm.openResources).toHaveLength(0);
      expect(closeCallCount).toBe(1);
    });

    it('passes TCP/IP specific options to transport factory', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');

      let capturedConfig: Record<string, unknown> | null = null;
      const rm = createResourceManager({
        _createTcpipTransport: (config) => {
          capturedConfig = config;
          return createMockTransport();
        },
      });

      await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET', {
        timeout: 10000,
        transport: {
          connectTimeout: 3000,
          keepAlive: false,
          keepAliveInterval: 5000,
        },
      });

      expect(capturedConfig).not.toBeNull();
      expect(capturedConfig!.timeout).toBe(10000);
      expect(capturedConfig!.connectTimeout).toBe(3000);
      expect(capturedConfig!.keepAlive).toBe(false);
      expect(capturedConfig!.keepAliveInterval).toBe(5000);
    });

    it('passes Serial specific options to transport factory', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');

      let capturedConfig: Record<string, unknown> | null = null;
      const rm = createResourceManager({
        _createSerialTransport: (config) => {
          capturedConfig = config;
          return createMockTransport();
        },
      });

      await rm.openResource('ASRL/dev/ttyUSB0::INSTR', {
        timeout: 5000,
        transport: {
          baudRate: 115200,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          flowControl: 'hardware',
          commandDelay: 50,
        },
      });

      expect(capturedConfig).not.toBeNull();
      expect(capturedConfig!.timeout).toBe(5000);
      expect(capturedConfig!.baudRate).toBe(115200);
      expect(capturedConfig!.dataBits).toBe(8);
      expect(capturedConfig!.stopBits).toBe(1);
      expect(capturedConfig!.parity).toBe('none');
      expect(capturedConfig!.flowControl).toBe('hardware');
      expect(capturedConfig!.commandDelay).toBe(50);
    });

    it('passes USB-TMC specific options to transport factory', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');

      let capturedConfig: Record<string, unknown> | null = null;
      const rm = createResourceManager({
        _createUsbtmcTransport: (config) => {
          capturedConfig = config;
          return createMockTransport();
        },
      });

      await rm.openResource('USB0::0x1AB1::0x04CE::DS1ZA123::INSTR', {
        timeout: 8000,
        transport: {
          quirks: 'rigol',
        },
      });

      expect(capturedConfig).not.toBeNull();
      expect(capturedConfig!.timeout).toBe(8000);
      expect(capturedConfig!.quirks).toBe('rigol');
      expect(capturedConfig!.vendorId).toBe(0x1ab1);
      expect(capturedConfig!.productId).toBe(0x04ce);
      expect(capturedConfig!.serialNumber).toBe('DS1ZA123');
    });
  });

  describe('exclusive mode', () => {
    it('allows opening resource in exclusive mode', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');
      const mockTransport = createMockTransport();

      const rm = createResourceManager({
        _createTcpipTransport: () => mockTransport,
      });

      const result = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET', {
        exclusive: true,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.isOpen).toBe(true);
      }
    });

    it('prevents second connection when first is exclusive', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');

      const rm = createResourceManager({
        _createTcpipTransport: () => createMockTransport(),
      });

      // First open with exclusive
      const result1 = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET', {
        exclusive: true,
      });
      expect(result1.ok).toBe(true);

      // Second open should fail
      const result2 = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');
      expect(result2.ok).toBe(false);
      if (!result2.ok) {
        expect(result2.error.message).toContain('exclusive');
      }
    });

    it('prevents exclusive connection when resource already open', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');

      const rm = createResourceManager({
        _createTcpipTransport: () => createMockTransport(),
      });

      // First open without exclusive
      const result1 = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');
      expect(result1.ok).toBe(true);

      // Second open with exclusive should fail
      const result2 = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET', {
        exclusive: true,
      });
      expect(result2.ok).toBe(false);
      if (!result2.ok) {
        expect(result2.error.message).toContain('already open');
      }
    });

    it('allows reopening after exclusive connection is closed', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');

      const rm = createResourceManager({
        _createTcpipTransport: () => createMockTransport(),
      });

      // First open with exclusive
      const result1 = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET', {
        exclusive: true,
      });
      expect(result1.ok).toBe(true);

      // Close it
      if (result1.ok) {
        await result1.value.close();
      }

      // Should be able to open again
      const result2 = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET');
      expect(result2.ok).toBe(true);
    });

    it('tracks exclusive mode per resource string', async () => {
      const { createResourceManager } = await import('../src/resource-manager.js');

      const rm = createResourceManager({
        _createTcpipTransport: () => createMockTransport(),
      });

      // Open first resource exclusively
      const result1 = await rm.openResource('TCPIP0::192.168.1.100::5025::SOCKET', {
        exclusive: true,
      });
      expect(result1.ok).toBe(true);

      // Should be able to open different resource
      const result2 = await rm.openResource('TCPIP0::192.168.1.101::5025::SOCKET');
      expect(result2.ok).toBe(true);
    });
  });
});
