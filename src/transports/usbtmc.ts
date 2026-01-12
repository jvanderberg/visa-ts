/**
 * USB-TMC (USB Test & Measurement Class) transport for VISA instruments
 *
 * @packageDocumentation
 */

import type { Transport, TransportState, TransportConfig } from './transport.js';
import type { Result } from '../result.js';
import { Ok, Err } from '../result.js';

// USB-TMC Message Types
const DEV_DEP_MSG_OUT = 1;
const DEV_DEP_MSG_IN = 2;
const TRIGGER = 128;

// USB-TMC Control Requests
const INITIATE_CLEAR = 5;
const CHECK_CLEAR_STATUS = 6;
const GET_CAPABILITIES = 7;
const READ_STATUS_BYTE = 128;

// USB-TMC Status values
const STATUS_SUCCESS = 0x01;

// USB request types
const USB_REQUEST_TYPE_IN = 0xa1;

// Type definitions for usb module (peer dependency)
interface UsbEndpoint {
  transfer(
    lengthOrData: number | Buffer,
    callback: (err: Error | null, data?: Buffer) => void
  ): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
}

interface UsbInterface {
  claim(): void;
  release(callback?: (err: Error | null) => void): void;
  endpoints: UsbEndpoint[];
  endpoint(address: number): UsbEndpoint | undefined;
  isKernelDriverActive(): boolean;
  detachKernelDriver(): void;
}

interface UsbDevice {
  open(): void;
  close(): void;
  interface(number: number): UsbInterface;
  controlTransfer(
    bmRequestType: number,
    bRequest: number,
    wValue: number,
    wIndex: number,
    dataOrLength: Buffer | number,
    callback: (err: Error | null, data?: Buffer) => void
  ): void;
  deviceDescriptor: {
    idVendor: number;
    idProduct: number;
    iSerialNumber: number;
  };
  getStringDescriptor(index: number, callback: (err: Error | null, str?: string) => void): void;
}

interface UsbModule {
  findByIds(vendorId: number, productId: number): UsbDevice | undefined;
}

/**
 * Configuration options for USB-TMC transport
 */
export interface UsbtmcTransportConfig extends TransportConfig {
  /** USB Vendor ID (16-bit) */
  vendorId: number;
  /** USB Product ID (16-bit) */
  productId: number;
  /** Device serial number (optional, for filtering) */
  serialNumber?: string;
  /** Enable quirk mode for non-compliant devices */
  quirks?: 'rigol' | 'none';
  /** USB interface number (default: 0) */
  interfaceNumber?: number;
  /** @internal USB module for testing - do not use in production */
  _usbModule?: UsbModule;
}

/**
 * USB-TMC transport with additional quirks property
 */
export interface UsbtmcTransport extends Transport {
  /** Current quirks mode */
  readonly quirks: 'rigol' | 'none';
}

const DEFAULT_TIMEOUT = 2000;
const DEFAULT_CHUNK_SIZE = 65536;
const USB_TMC_HEADER_SIZE = 12;

/**
 * Creates a USB-TMC transport for communicating with USB test equipment.
 *
 * @param config - Transport configuration
 * @returns Transport instance
 */
export function createUsbtmcTransport(config: UsbtmcTransportConfig): Transport {
  let state: TransportState = 'closed';
  let device: UsbDevice | null = null;
  let usbInterface: UsbInterface | null = null;
  let inEndpoint: UsbEndpoint | null = null;
  let outEndpoint: UsbEndpoint | null = null;
  let bTag = 1;

  let timeout = config.timeout ?? DEFAULT_TIMEOUT;
  let readTermination = config.readTermination ?? '\n';
  let writeTermination = config.writeTermination ?? '\n';

  const interfaceNumber = config.interfaceNumber ?? 0;
  const quirks = config.quirks ?? 'none';

  function nextTag(): number {
    const tag = bTag;
    bTag = (bTag % 255) + 1;
    return tag;
  }

  function createBulkOutHeader(msgType: number, transferSize: number, isEom: boolean): Buffer {
    const header = Buffer.alloc(USB_TMC_HEADER_SIZE);
    const tag = nextTag();

    header[0] = msgType;
    header[1] = tag;
    header[2] = ~tag & 0xff;
    header[3] = 0; // Reserved

    // Transfer size (32-bit little-endian)
    header[4] = transferSize & 0xff;
    header[5] = (transferSize >> 8) & 0xff;
    header[6] = (transferSize >> 16) & 0xff;
    header[7] = (transferSize >> 24) & 0xff;

    // bmTransferAttributes
    header[8] = isEom ? 0x01 : 0x00;

    // Reserved
    header[9] = 0;
    header[10] = 0;
    header[11] = 0;

    return header;
  }

  function parseBulkInHeader(data: Buffer): {
    msgType: number;
    tag: number;
    transferSize: number;
    isEom: boolean;
  } {
    return {
      msgType: data.readUInt8(0),
      tag: data.readUInt8(1),
      transferSize: data.readUInt32LE(4),
      isEom: (data.readUInt8(8) & 0x01) !== 0,
    };
  }

  async function bulkOut(data: Buffer): Promise<Result<void, Error>> {
    if (!outEndpoint) {
      return Err(new Error('No output endpoint'));
    }

    return new Promise((resolve) => {
      outEndpoint!.transfer(data, (err) => {
        if (err) {
          resolve(Err(err));
        } else {
          resolve(Ok(undefined));
        }
      });
    });
  }

  async function bulkIn(size: number): Promise<Result<Buffer, Error>> {
    if (!inEndpoint) {
      return Err(new Error('No input endpoint'));
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(Err(new Error(`Read timeout after ${timeout}ms`)));
      }, timeout);

      inEndpoint!.transfer(size, (err, data) => {
        clearTimeout(timeoutId);
        if (err) {
          if (err.message.includes('TIMED_OUT')) {
            resolve(Err(new Error(`Read timeout after ${timeout}ms`)));
          } else {
            resolve(Err(err));
          }
        } else if (data) {
          resolve(Ok(data));
        } else {
          resolve(Ok(Buffer.alloc(0)));
        }
      });
    });
  }

  async function controlIn(
    bRequest: number,
    wValue: number,
    wIndex: number,
    length: number
  ): Promise<Result<Buffer, Error>> {
    if (!device) {
      return Err(new Error('Device not open'));
    }

    return new Promise((resolve) => {
      device!.controlTransfer(
        USB_REQUEST_TYPE_IN,
        bRequest,
        wValue,
        wIndex,
        length,
        (err, data) => {
          if (err) {
            resolve(Err(err));
          } else if (data) {
            resolve(Ok(data));
          } else {
            resolve(Ok(Buffer.alloc(0)));
          }
        }
      );
    });
  }

  const transport: UsbtmcTransport = {
    get state() {
      return state;
    },

    get isOpen() {
      return state === 'open';
    },

    get timeout() {
      return timeout;
    },

    set timeout(value: number) {
      timeout = value;
    },

    get readTermination() {
      return readTermination;
    },

    set readTermination(value: string) {
      readTermination = value;
    },

    get writeTermination() {
      return writeTermination;
    },

    set writeTermination(value: string) {
      writeTermination = value;
    },

    get quirks() {
      return quirks;
    },

    async open(): Promise<Result<void, Error>> {
      if (state === 'open') {
        return Err(new Error('Transport is already open'));
      }

      // Input validation
      if (config.vendorId < 0 || config.vendorId > 0xffff) {
        return Err(
          new Error(
            `Invalid vendorId: 0x${config.vendorId.toString(16)}. Must be 16-bit (0x0000-0xFFFF)`
          )
        );
      }
      if (config.productId < 0 || config.productId > 0xffff) {
        return Err(
          new Error(
            `Invalid productId: 0x${config.productId.toString(16)}. Must be 16-bit (0x0000-0xFFFF)`
          )
        );
      }
      if (timeout <= 0) {
        return Err(new Error(`Invalid timeout: ${timeout}. Must be positive`));
      }

      state = 'opening';

      try {
        // Get USB module
        let usb: UsbModule;
        if (config._usbModule) {
          usb = config._usbModule;
        } else {
          // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
          usb = require('usb') as UsbModule;
        }

        // Find device
        device = usb.findByIds(config.vendorId, config.productId) ?? null;
        if (!device) {
          state = 'error';
          return Err(
            new Error(
              `USB device not found: VID=0x${config.vendorId.toString(16)}, PID=0x${config.productId.toString(16)}`
            )
          );
        }

        // Check serial number if specified
        if (config.serialNumber) {
          const serialResult = await new Promise<Result<string, Error>>((resolve) => {
            device!.getStringDescriptor(device!.deviceDescriptor.iSerialNumber, (err, str) => {
              if (err) {
                resolve(Err(err));
              } else {
                resolve(Ok(str ?? ''));
              }
            });
          });

          if (!serialResult.ok) {
            state = 'error';
            return serialResult;
          }

          if (serialResult.value !== config.serialNumber) {
            state = 'error';
            return Err(
              new Error(
                `Serial number mismatch: expected ${config.serialNumber}, got ${serialResult.value}`
              )
            );
          }
        }

        // Open device
        device.open();

        // Get interface
        usbInterface = device.interface(interfaceNumber);

        // Detach kernel driver if active
        if (usbInterface.isKernelDriverActive()) {
          usbInterface.detachKernelDriver();
        }

        // Claim interface
        usbInterface.claim();

        // Find endpoints
        for (const endpoint of usbInterface.endpoints) {
          // Check endpoint direction - IN endpoints have address >= 0x80
          const epAddr = (endpoint as unknown as { address: number }).address;
          if (epAddr !== undefined) {
            if (epAddr & 0x80) {
              inEndpoint = endpoint;
            } else {
              outEndpoint = endpoint;
            }
          }
        }

        // If we couldn't get endpoints from the array, try endpoint() method
        if (!inEndpoint) {
          inEndpoint = usbInterface.endpoint(0x81) ?? usbInterface.endpoint(0x82) ?? null;
        }
        if (!outEndpoint) {
          outEndpoint = usbInterface.endpoint(0x01) ?? usbInterface.endpoint(0x02) ?? null;
        }

        if (!inEndpoint || !outEndpoint) {
          state = 'error';
          return Err(new Error('Could not find USB-TMC endpoints'));
        }

        // Get capabilities (optional, don't fail if it doesn't work)
        await controlIn(GET_CAPABILITIES, 0, interfaceNumber, 24);

        state = 'open';
        return Ok(undefined);
      } catch (err) {
        state = 'error';
        return Err(err instanceof Error ? err : new Error(String(err)));
      }
    },

    async close(): Promise<Result<void, Error>> {
      if (state === 'closed' || !device) {
        state = 'closed';
        return Ok(undefined);
      }

      state = 'closing';

      return new Promise((resolve) => {
        try {
          if (usbInterface) {
            usbInterface.release((err) => {
              if (err) {
                // Ignore release errors
              }
              try {
                device?.close();
              } catch {
                // Ignore close errors
              }
              device = null;
              usbInterface = null;
              inEndpoint = null;
              outEndpoint = null;
              state = 'closed';
              resolve(Ok(undefined));
            });
          } else {
            try {
              device?.close();
            } catch {
              // Ignore close errors
            }
            device = null;
            state = 'closed';
            resolve(Ok(undefined));
          }
        } catch (err) {
          state = 'error';
          resolve(Err(err instanceof Error ? err : new Error(String(err))));
        }
      });
    },

    async write(data: string): Promise<Result<void, Error>> {
      if (state !== 'open' || !outEndpoint) {
        return Err(new Error('Transport is not open'));
      }

      const payload = Buffer.from(data + writeTermination);
      const header = createBulkOutHeader(DEV_DEP_MSG_OUT, payload.length, true);

      // Pad to 4-byte alignment
      const totalLen = USB_TMC_HEADER_SIZE + payload.length;
      const paddedLen = Math.ceil(totalLen / 4) * 4;
      const packet = Buffer.alloc(paddedLen);
      header.copy(packet, 0);
      payload.copy(packet, USB_TMC_HEADER_SIZE);

      return bulkOut(packet);
    },

    async read(): Promise<Result<string, Error>> {
      if (state !== 'open' || !inEndpoint) {
        return Err(new Error('Transport is not open'));
      }

      const chunks: Buffer[] = [];
      let isComplete = false;

      while (!isComplete) {
        // Request data
        const requestHeader = createBulkOutHeader(DEV_DEP_MSG_IN, DEFAULT_CHUNK_SIZE, false);
        requestHeader[8] = 0x00; // Request attributes
        requestHeader[9] = 0x00; // TermChar (not used when bit 1 of attributes is 0)

        const sendResult = await bulkOut(requestHeader);
        if (!sendResult.ok) {
          return sendResult;
        }

        // Read response
        const readResult = await bulkIn(DEFAULT_CHUNK_SIZE);
        if (!readResult.ok) {
          return readResult;
        }

        const response = readResult.value;
        if (response.length < USB_TMC_HEADER_SIZE) {
          return Err(new Error('Invalid USB-TMC response: too short'));
        }

        const header = parseBulkInHeader(response);
        if (header.msgType !== DEV_DEP_MSG_IN) {
          return Err(new Error(`Unexpected USB-TMC message type: ${header.msgType}`));
        }

        const payload = response.subarray(
          USB_TMC_HEADER_SIZE,
          USB_TMC_HEADER_SIZE + header.transferSize
        );

        chunks.push(payload);

        // In rigol mode, continue reading until EOM is set
        // In normal mode, a single read is sufficient
        if (quirks === 'rigol') {
          isComplete = header.isEom;
        } else {
          isComplete = true;
        }
      }

      // Combine all chunks
      const fullPayload = Buffer.concat(chunks);
      let result = fullPayload.toString();

      // In rigol mode, strip trailing null bytes first (before termination check)
      // Rigol devices often pad responses with nulls after the termination
      if (quirks === 'rigol') {
        result = result.replace(/\0+$/, '');
      }

      // Strip termination
      if (result.endsWith(readTermination)) {
        result = result.slice(0, -readTermination.length);
      }

      return Ok(result);
    },

    async query(command: string, delay?: number): Promise<Result<string, Error>> {
      if (state !== 'open' || !outEndpoint) {
        return Err(new Error('Transport is not open'));
      }

      const writeResult = await transport.write(command);
      if (!writeResult.ok) {
        return writeResult;
      }

      if (delay && delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }

      return transport.read();
    },

    async writeRaw(data: Buffer): Promise<Result<number, Error>> {
      if (state !== 'open' || !outEndpoint) {
        return Err(new Error('Transport is not open'));
      }

      const header = createBulkOutHeader(DEV_DEP_MSG_OUT, data.length, true);

      // Pad to 4-byte alignment
      const totalLen = USB_TMC_HEADER_SIZE + data.length;
      const paddedLen = Math.ceil(totalLen / 4) * 4;
      const packet = Buffer.alloc(paddedLen);
      header.copy(packet, 0);
      data.copy(packet, USB_TMC_HEADER_SIZE);

      const result = await bulkOut(packet);
      if (!result.ok) {
        return result;
      }

      return Ok(data.length);
    },

    async readRaw(size?: number): Promise<Result<Buffer, Error>> {
      if (state !== 'open' || !inEndpoint) {
        return Err(new Error('Transport is not open'));
      }

      const maxSize = size ?? DEFAULT_CHUNK_SIZE;

      // Request data
      const requestHeader = createBulkOutHeader(DEV_DEP_MSG_IN, maxSize, false);

      const sendResult = await bulkOut(requestHeader);
      if (!sendResult.ok) {
        return sendResult;
      }

      // Read response
      const readResult = await bulkIn(maxSize + USB_TMC_HEADER_SIZE);
      if (!readResult.ok) {
        return readResult;
      }

      const response = readResult.value;
      if (response.length < USB_TMC_HEADER_SIZE) {
        return Err(new Error('Invalid USB-TMC response: too short'));
      }

      const header = parseBulkInHeader(response);
      const payload = response.subarray(
        USB_TMC_HEADER_SIZE,
        USB_TMC_HEADER_SIZE + header.transferSize
      );

      return Ok(Buffer.from(payload));
    },

    async readBytes(count: number): Promise<Result<Buffer, Error>> {
      if (state !== 'open' || !inEndpoint) {
        return Err(new Error('Transport is not open'));
      }

      // readRaw already handles the USB-TMC header internally
      const result = await transport.readRaw(count);
      if (!result.ok) {
        return result;
      }

      // Return only requested bytes (in case readRaw returned more)
      return Ok(result.value.subarray(0, count));
    },

    async clear(): Promise<Result<void, Error>> {
      if (state !== 'open' || !device) {
        return Err(new Error('Transport is not open'));
      }

      // INITIATE_CLEAR
      const initResult = await controlIn(INITIATE_CLEAR, 0, interfaceNumber, 1);
      if (!initResult.ok) {
        return initResult;
      }

      if (initResult.value.readUInt8(0) !== STATUS_SUCCESS) {
        return Err(new Error('INITIATE_CLEAR failed'));
      }

      // CHECK_CLEAR_STATUS
      let attempts = 0;
      while (attempts < 10) {
        const statusResult = await controlIn(CHECK_CLEAR_STATUS, 0, interfaceNumber, 2);
        if (!statusResult.ok) {
          return statusResult;
        }

        if (statusResult.value.readUInt8(0) === STATUS_SUCCESS) {
          return Ok(undefined);
        }

        // Wait before retry
        await new Promise((r) => setTimeout(r, 50));
        attempts++;
      }

      return Err(new Error('Clear operation timed out'));
    },

    async trigger(): Promise<Result<void, Error>> {
      if (state !== 'open' || !outEndpoint) {
        return Err(new Error('Transport is not open'));
      }

      const header = createBulkOutHeader(TRIGGER, 0, true);
      return bulkOut(header);
    },

    async readStb(): Promise<Result<number, Error>> {
      if (state !== 'open' || !device) {
        return Err(new Error('Transport is not open'));
      }

      const tag = nextTag();
      const result = await controlIn(READ_STATUS_BYTE, tag, interfaceNumber, 3);

      if (!result.ok) {
        return result;
      }

      if (result.value.readUInt8(0) !== STATUS_SUCCESS) {
        return Err(new Error('READ_STATUS_BYTE failed'));
      }

      return Ok(result.value.readUInt8(1));
    },
  };

  return transport;
}
