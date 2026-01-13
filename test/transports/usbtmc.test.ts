import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock types for USB device
interface MockInEndpoint {
  transfer: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
}

interface MockOutEndpoint {
  transfer: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
}

interface MockInterface {
  claim: ReturnType<typeof vi.fn>;
  release: ReturnType<typeof vi.fn>;
  endpoints: (MockInEndpoint | MockOutEndpoint)[];
  endpoint: (addr: number) => MockInEndpoint | MockOutEndpoint | undefined;
  isKernelDriverActive: ReturnType<typeof vi.fn>;
  detachKernelDriver: ReturnType<typeof vi.fn>;
}

interface MockDevice {
  open: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  interface: (num: number) => MockInterface;
  controlTransfer: ReturnType<typeof vi.fn>;
  deviceDescriptor: {
    idVendor: number;
    idProduct: number;
    iSerialNumber: number;
  };
  getStringDescriptor: ReturnType<typeof vi.fn>;
}

let mockDevice: MockDevice;
let mockInterface: MockInterface;
let mockInEndpoint: MockInEndpoint;
let mockOutEndpoint: MockOutEndpoint;
let mockFindByIds: ReturnType<typeof vi.fn>;

vi.mock('usb', () => ({
  default: {
    findByIds: vi.fn(),
  },
}));

import { createUsbtmcTransport, type UsbtmcTransportConfig } from '../../src/transports/usbtmc.js';
import usb from 'usb';

describe('USB-TMC Transport', () => {
  beforeEach(() => {
    mockInEndpoint = {
      transfer: vi.fn((length: number, callback: (err: Error | null, data?: Buffer) => void) => {
        // Default: return empty data
        callback(null, Buffer.alloc(0));
      }),
      on: vi.fn(),
    };

    mockOutEndpoint = {
      transfer: vi.fn((data: Buffer, callback: (err: Error | null) => void) => {
        callback(null);
      }),
      on: vi.fn(),
    };

    mockInterface = {
      claim: vi.fn(),
      release: vi.fn((callback?: (err: Error | null) => void) => {
        if (callback) callback(null);
      }),
      endpoints: [mockInEndpoint, mockOutEndpoint],
      endpoint: vi.fn((addr: number) => {
        // IN endpoints have bit 7 set (0x80 | addr)
        if (addr & 0x80) {
          return mockInEndpoint;
        }
        return mockOutEndpoint;
      }),
      isKernelDriverActive: vi.fn(() => false),
      detachKernelDriver: vi.fn(),
    };

    mockDevice = {
      open: vi.fn(),
      close: vi.fn(),
      interface: vi.fn(() => mockInterface),
      controlTransfer: vi.fn(
        (
          bmRequestType: number,
          bRequest: number,
          wValue: number,
          wIndex: number,
          dataOrLength: Buffer | number,
          callback: (err: Error | null, data?: Buffer) => void
        ) => {
          // Default: return USB-TMC capabilities response
          if (bRequest === 7) {
            // GET_CAPABILITIES
            const capabilities = Buffer.alloc(24);
            capabilities[0] = 0x01; // Status: success
            capabilities[4] = 0x01; // USB-TMC interface version
            callback(null, capabilities);
          } else {
            callback(null, Buffer.alloc(1));
          }
        }
      ),
      deviceDescriptor: {
        idVendor: 0x1ab1,
        idProduct: 0x04ce,
        iSerialNumber: 3,
      },
      getStringDescriptor: vi.fn(
        (index: number, callback: (err: Error | null, str?: string) => void) => {
          callback(null, 'DS1ZA123456789');
        }
      ),
    };

    mockFindByIds = vi.fn(() => mockDevice);
    vi.mocked(usb.findByIds).mockImplementation(mockFindByIds);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create config
  function createConfig(overrides: Partial<UsbtmcTransportConfig> = {}): UsbtmcTransportConfig {
    return {
      vendorId: 0x1ab1,
      productId: 0x04ce,
      ...overrides,
    };
  }

  describe('createUsbtmcTransport', () => {
    it('creates a transport with default configuration', () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      expect(transport).toBeDefined();
      expect(transport.state).toBe('closed');
      expect(transport.isOpen).toBe(false);
      expect(transport.timeout).toBe(2000);
      expect(transport.readTermination).toBe('\n');
      expect(transport.writeTermination).toBe('\n');
    });

    it('creates a transport with custom configuration', () => {
      const config = createConfig({
        timeout: 5000,
        readTermination: '\r\n',
        writeTermination: '\r\n',
        quirks: 'rigol',
      });
      const transport = createUsbtmcTransport(config);

      expect(transport.timeout).toBe(5000);
      expect(transport.readTermination).toBe('\r\n');
      expect(transport.writeTermination).toBe('\r\n');
    });
  });

  describe('open', () => {
    it('opens a USB-TMC device successfully', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(true);
      expect(transport.state).toBe('open');
      expect(transport.isOpen).toBe(true);
      expect(mockFindByIds).toHaveBeenCalledWith(0x1ab1, 0x04ce);
      expect(mockDevice.open).toHaveBeenCalled();
      expect(mockInterface.claim).toHaveBeenCalled();
    });

    it('returns Err when device is not found', async () => {
      mockFindByIds.mockReturnValueOnce(undefined);

      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
      expect(transport.state).toBe('error');
    });

    it('returns Err when device open fails', async () => {
      mockDevice.open.mockImplementationOnce(() => {
        throw new Error('USB open failed');
      });

      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('USB open failed');
      }
    });

    it('detaches kernel driver if active', async () => {
      mockInterface.isKernelDriverActive.mockReturnValueOnce(true);

      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      await transport.open();

      expect(mockInterface.detachKernelDriver).toHaveBeenCalled();
    });

    it('returns Err when already open', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      await transport.open();
      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('already open');
      }
    });

    it('filters by serial number when provided', async () => {
      const config = createConfig({ serialNumber: 'DS1ZA123456789' });
      const transport = createUsbtmcTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(true);
      expect(mockDevice.getStringDescriptor).toHaveBeenCalled();
    });

    it('returns Err when serial number does not match', async () => {
      mockDevice.getStringDescriptor.mockImplementationOnce(
        (_index: number, callback: (err: Error | null, str?: string) => void) => {
          callback(null, 'DIFFERENT_SERIAL');
        }
      );

      const config = createConfig({ serialNumber: 'DS1ZA123456789' });
      const transport = createUsbtmcTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message.toLowerCase()).toContain('serial');
      }
    });
  });

  describe('close', () => {
    it('closes an open device successfully', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      await transport.open();
      const result = await transport.close();

      expect(result.ok).toBe(true);
      expect(transport.state).toBe('closed');
      expect(transport.isOpen).toBe(false);
      expect(mockInterface.release).toHaveBeenCalled();
      expect(mockDevice.close).toHaveBeenCalled();
    });

    it('returns Ok when closing an already closed transport', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      const result = await transport.close();

      expect(result.ok).toBe(true);
    });
  });

  describe('write', () => {
    it('writes data with USB-TMC header', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      await transport.open();
      const result = await transport.write('*IDN?');

      expect(result.ok).toBe(true);
      expect(mockOutEndpoint.transfer).toHaveBeenCalled();

      // Verify USB-TMC header was included
      const transferCall = mockOutEndpoint.transfer.mock.calls[0];
      const sentData = transferCall[0] as Buffer;
      expect(sentData[0]).toBe(1); // DEV_DEP_MSG_OUT
      expect(sentData.length).toBeGreaterThan(12); // Header + payload
    });

    it('writes data with termination character', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      await transport.open();
      await transport.write('*RST');

      const transferCall = mockOutEndpoint.transfer.mock.calls[0];
      const sentData = transferCall[0] as Buffer;
      // Find the payload (after 12-byte header)
      const payload = sentData.subarray(12);
      expect(payload.toString()).toContain('*RST\n');
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      const result = await transport.write('*IDN?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });

    it('returns Err when write fails', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      await transport.open();

      mockOutEndpoint.transfer.mockImplementationOnce(
        (_data: Buffer, callback: (err: Error | null) => void) => {
          callback(new Error('USB write error'));
        }
      );

      const result = await transport.write('*IDN?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('USB write error');
      }
    });
  });

  describe('read', () => {
    it('reads data with USB-TMC header processing', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      await transport.open();

      // Set up mock to return USB-TMC response
      const responseData = 'RIGOL TECHNOLOGIES,DS1054Z\n';
      const responseBuffer = Buffer.alloc(12 + responseData.length);
      responseBuffer[0] = 2; // DEV_DEP_MSG_IN
      responseBuffer[1] = 1; // bTag
      responseBuffer[4] = responseData.length & 0xff; // Transfer size (low byte)
      responseBuffer[5] = (responseData.length >> 8) & 0xff;
      responseBuffer[8] = 0x01; // EOM flag
      responseBuffer.write(responseData, 12);

      mockInEndpoint.transfer.mockImplementationOnce(
        (_length: number, callback: (err: Error | null, data?: Buffer) => void) => {
          callback(null, responseBuffer);
        }
      );

      const result = await transport.read();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('RIGOL TECHNOLOGIES,DS1054Z');
      }
    });

    it('returns Err when read times out', async () => {
      const config = createConfig({ timeout: 100 });
      const transport = createUsbtmcTransport(config);

      await transport.open();

      // Mock transfer that never responds
      mockInEndpoint.transfer.mockImplementationOnce(
        (_length: number, callback: (err: Error | null, data?: Buffer) => void) => {
          setTimeout(() => callback(new Error('LIBUSB_TRANSFER_TIMED_OUT')), 200);
        }
      );

      const result = await transport.read();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      const result = await transport.read();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('query', () => {
    it('writes command and reads response', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      await transport.open();

      // Set up read response
      const responseData = 'RIGOL TECHNOLOGIES,DS1054Z\n';
      const responseBuffer = Buffer.alloc(12 + responseData.length);
      responseBuffer[0] = 2; // DEV_DEP_MSG_IN
      responseBuffer[1] = 1;
      responseBuffer[4] = responseData.length & 0xff;
      responseBuffer[8] = 0x01;
      responseBuffer.write(responseData, 12);

      mockInEndpoint.transfer.mockImplementationOnce(
        (_length: number, callback: (err: Error | null, data?: Buffer) => void) => {
          callback(null, responseBuffer);
        }
      );

      const result = await transport.query('*IDN?');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('RIGOL TECHNOLOGIES,DS1054Z');
      }
      expect(mockOutEndpoint.transfer).toHaveBeenCalled();
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      const result = await transport.query('*IDN?');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('writeRaw', () => {
    it('writes raw bytes without termination', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      await transport.open();

      const data = Buffer.from([0x01, 0x02, 0x03]);
      const result = await transport.writeRaw(data);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(3);
      }
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      const result = await transport.writeRaw(Buffer.from([0x01]));

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('readRaw', () => {
    it('reads raw bytes', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      await transport.open();

      const responseBuffer = Buffer.alloc(17);
      responseBuffer[0] = 2; // DEV_DEP_MSG_IN
      responseBuffer[4] = 5; // 5 bytes of data
      responseBuffer[8] = 0x01; // EOM
      responseBuffer[12] = 0x01;
      responseBuffer[13] = 0x02;
      responseBuffer[14] = 0x03;
      responseBuffer[15] = 0x04;
      responseBuffer[16] = 0x05;

      mockInEndpoint.transfer.mockImplementationOnce(
        (_length: number, callback: (err: Error | null, data?: Buffer) => void) => {
          callback(null, responseBuffer);
        }
      );

      const result = await transport.readRaw();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]));
      }
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      const result = await transport.readRaw();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('readBytes', () => {
    it('reads exact number of bytes', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      await transport.open();

      const responseBuffer = Buffer.alloc(22);
      responseBuffer[0] = 2;
      responseBuffer[4] = 10;
      responseBuffer[8] = 0x01;
      for (let i = 0; i < 10; i++) {
        responseBuffer[12 + i] = i + 1;
      }

      mockInEndpoint.transfer.mockImplementationOnce(
        (_length: number, callback: (err: Error | null, data?: Buffer) => void) => {
          callback(null, responseBuffer);
        }
      );

      const result = await transport.readBytes(5);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(Buffer.from([1, 2, 3, 4, 5]));
        expect(result.value.length).toBe(5);
      }
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      const result = await transport.readBytes(5);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('clear', () => {
    it('sends INITIATE_CLEAR control request', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      await transport.open();

      // Mock successful clear
      mockDevice.controlTransfer.mockImplementation(
        (
          bmRequestType: number,
          bRequest: number,
          wValue: number,
          wIndex: number,
          dataOrLength: Buffer | number,
          callback: (err: Error | null, data?: Buffer) => void
        ) => {
          if (bRequest === 5) {
            // INITIATE_CLEAR
            callback(null, Buffer.from([0x01])); // STATUS_SUCCESS
          } else if (bRequest === 6) {
            // CHECK_CLEAR_STATUS
            callback(null, Buffer.from([0x01, 0x00])); // SUCCESS, no pending
          } else {
            callback(null, Buffer.alloc(24));
          }
        }
      );

      const result = await transport.clear();

      expect(result.ok).toBe(true);
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      const result = await transport.clear();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('trigger', () => {
    it('sends trigger message', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      await transport.open();

      const result = await transport.trigger();

      expect(result.ok).toBe(true);
      expect(mockOutEndpoint.transfer).toHaveBeenCalled();

      // Verify trigger message type
      const transferCall = mockOutEndpoint.transfer.mock.calls[0];
      const sentData = transferCall[0] as Buffer;
      expect(sentData[0]).toBe(128); // TRIGGER message type
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      const result = await transport.trigger();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('readStb', () => {
    it('reads status byte via control transfer', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      await transport.open();

      mockDevice.controlTransfer.mockImplementation(
        (
          bmRequestType: number,
          bRequest: number,
          wValue: number,
          wIndex: number,
          dataOrLength: Buffer | number,
          callback: (err: Error | null, data?: Buffer) => void
        ) => {
          if (bRequest === 128) {
            // READ_STATUS_BYTE
            callback(null, Buffer.from([0x01, 0x10, 0x00])); // STATUS_SUCCESS, STB=16
          } else {
            callback(null, Buffer.alloc(24));
          }
        }
      );

      const result = await transport.readStb();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(16);
      }
    });

    it('returns Err when not connected', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      const result = await transport.readStb();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not open');
      }
    });
  });

  describe('input validation', () => {
    it('returns Err on open when vendorId exceeds 16 bits', async () => {
      const config = createConfig({ vendorId: 0x10000 });
      const transport = createUsbtmcTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('vendorId');
      }
    });

    it('returns Err on open when productId exceeds 16 bits', async () => {
      const config = createConfig({ productId: 0x10000 });
      const transport = createUsbtmcTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('productId');
      }
    });

    it('returns Err on open when timeout is not positive', async () => {
      const config = createConfig({ timeout: 0 });
      const transport = createUsbtmcTransport(config);

      const result = await transport.open();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
    });
  });

  describe('Rigol quirks mode', () => {
    it('strips trailing null bytes from responses in rigol mode', async () => {
      const config = createConfig({ quirks: 'rigol' });
      const transport = createUsbtmcTransport(config);

      await transport.open();

      // Rigol devices sometimes add trailing null bytes
      const responseWithNulls = Buffer.alloc(24);
      responseWithNulls[0] = 2; // DEV_DEP_MSG_IN
      responseWithNulls[4] = 12; // Transfer size (includes nulls)
      responseWithNulls[8] = 0x01; // EOM
      // Payload: "RIGOL\n" followed by null bytes
      Buffer.from('RIGOL\n\0\0\0\0\0\0').copy(responseWithNulls, 12);

      mockInEndpoint.transfer.mockImplementationOnce(
        (_length: number, callback: (err: Error | null, data?: Buffer) => void) => {
          callback(null, responseWithNulls);
        }
      );

      const result = await transport.read();

      expect(result.ok).toBe(true);
      if (result.ok) {
        // In rigol mode, trailing nulls should be stripped
        expect(result.value).toBe('RIGOL');
        expect(result.value).not.toContain('\0');
      }
    });

    it('does not strip trailing nulls in normal mode', async () => {
      const config = createConfig({ quirks: 'none' });
      const transport = createUsbtmcTransport(config);

      await transport.open();

      // Response with embedded null bytes followed by termination
      const responseWithNulls = Buffer.alloc(24);
      responseWithNulls[0] = 2; // DEV_DEP_MSG_IN
      responseWithNulls[4] = 9; // Transfer size: "DATA\0\0\0\0\n" = 9 bytes
      responseWithNulls[8] = 0x01; // EOM
      // Payload: "DATA\0\0\0\0\n" - nulls embedded in data, termination at end
      Buffer.from('DATA\0\0\0\0\n').copy(responseWithNulls, 12);

      mockInEndpoint.transfer.mockImplementationOnce(
        (_length: number, callback: (err: Error | null, data?: Buffer) => void) => {
          callback(null, responseWithNulls);
        }
      );

      const result = await transport.read();

      expect(result.ok).toBe(true);
      if (result.ok) {
        // In normal mode, embedded nulls are preserved (only termination stripped)
        expect(result.value).toBe('DATA\0\0\0\0');
      }
    });

    it('continues reading when EOM is false in rigol mode', async () => {
      const config = createConfig({ quirks: 'rigol', timeout: 5000 });
      const transport = createUsbtmcTransport(config);

      await transport.open();

      // First response: partial data, EOM = false
      const response1 = Buffer.alloc(20);
      response1[0] = 2; // DEV_DEP_MSG_IN
      response1[4] = 5; // Transfer size
      response1[8] = 0x00; // EOM = false (more data coming)
      Buffer.from('HELLO').copy(response1, 12);

      // Second response: remaining data with termination, EOM = true
      const response2 = Buffer.alloc(20);
      response2[0] = 2; // DEV_DEP_MSG_IN
      response2[4] = 7; // Transfer size
      response2[8] = 0x01; // EOM = true
      Buffer.from(' WORLD\n').copy(response2, 12);

      let readCount = 0;
      mockInEndpoint.transfer.mockImplementation(
        (_length: number, callback: (err: Error | null, data?: Buffer) => void) => {
          readCount++;
          if (readCount === 1) {
            callback(null, response1);
          } else {
            callback(null, response2);
          }
        }
      );

      const result = await transport.read();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('HELLO WORLD');
      }
    });

    it('exposes quirks mode via getter', () => {
      const rigolConfig = createConfig({ quirks: 'rigol' });
      const normalConfig = createConfig({ quirks: 'none' });
      const defaultConfig = createConfig();

      const rigolTransport = createUsbtmcTransport(rigolConfig);
      const normalTransport = createUsbtmcTransport(normalConfig);
      const defaultTransport = createUsbtmcTransport(defaultConfig);

      expect(rigolTransport.quirks).toBe('rigol');
      expect(normalTransport.quirks).toBe('none');
      expect(defaultTransport.quirks).toBe('none');
    });
  });

  describe('timeout modification', () => {
    it('allows modifying timeout after creation', async () => {
      const config = createConfig({ timeout: 1000 });
      const transport = createUsbtmcTransport(config);

      expect(transport.timeout).toBe(1000);

      transport.timeout = 5000;

      expect(transport.timeout).toBe(5000);
    });
  });

  describe('termination modification', () => {
    it('allows modifying read termination after creation', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      expect(transport.readTermination).toBe('\n');

      transport.readTermination = '\r\n';

      expect(transport.readTermination).toBe('\r\n');
    });

    it('allows modifying write termination after creation', async () => {
      const config = createConfig();
      const transport = createUsbtmcTransport(config);

      expect(transport.writeTermination).toBe('\n');

      transport.writeTermination = '\r\n';

      expect(transport.writeTermination).toBe('\r\n');
    });
  });
});
