/**
 * Discovery module tests
 *
 * @packageDocumentation
 */

import { describe, it, expect, vi } from 'vitest';
import {
  listSerialPorts,
  listUsbDevices,
  getUsbSerialNumber,
  isTmcDevice,
} from '../src/discovery.js';
import type { SerialPortModule, UsbDevice, UsbModule } from '../src/discovery.js';

/** Helper to create a mock USB device with TMC interface */
function createMockTmcDevice(options?: {
  vendorId?: number;
  productId?: number;
  iSerialNumber?: number;
  serialNumber?: string;
  openThrows?: boolean;
  closeThrows?: boolean;
  descriptorError?: boolean;
}): UsbDevice {
  return {
    deviceDescriptor: {
      idVendor: options?.vendorId ?? 0x1234,
      idProduct: options?.productId ?? 0x5678,
      bDeviceClass: 0,
      iSerialNumber: options?.iSerialNumber ?? 0,
    },
    configDescriptor: {
      interfaces: [
        [
          {
            descriptor: {
              bInterfaceClass: 0xfe, // Application Specific
              bInterfaceSubClass: 0x03, // USB-TMC
              bInterfaceProtocol: 0,
            },
          },
        ],
      ],
    },
    open: options?.openThrows
      ? vi.fn().mockImplementation(() => {
          throw new Error('Device busy');
        })
      : vi.fn(),
    close: options?.closeThrows
      ? vi.fn().mockImplementation(() => {
          throw new Error('Close failed');
        })
      : vi.fn(),
    getStringDescriptor: vi.fn(
      (_index: number, callback: (error: Error | undefined, data?: string) => void) => {
        if (options?.descriptorError) {
          callback(new Error('Failed to get descriptor'));
        } else {
          callback(undefined, options?.serialNumber);
        }
      }
    ),
  };
}

/** Helper to create a mock USB device without TMC interface */
function createMockNonTmcDevice(options?: {
  vendorId?: number;
  productId?: number;
  interfaceClass?: number;
  interfaceSubClass?: number;
}): UsbDevice {
  return {
    deviceDescriptor: {
      idVendor: options?.vendorId ?? 0x1234,
      idProduct: options?.productId ?? 0x5678,
      bDeviceClass: 0,
      iSerialNumber: 0,
    },
    configDescriptor: {
      interfaces: [
        [
          {
            descriptor: {
              bInterfaceClass: options?.interfaceClass ?? 0x08, // Mass Storage
              bInterfaceSubClass: options?.interfaceSubClass ?? 0x06,
              bInterfaceProtocol: 0,
            },
          },
        ],
      ],
    },
    open: vi.fn(),
    close: vi.fn(),
    getStringDescriptor: vi.fn(),
  };
}

describe('discovery', () => {
  describe('listSerialPorts', () => {
    it('returns empty array when serialport package is not available', async () => {
      const ports = await listSerialPorts();
      expect(ports).toEqual([]);
    });

    it('returns serial ports when serialport module is provided', async () => {
      const mockSerialPort: SerialPortModule = {
        list: vi
          .fn()
          .mockResolvedValue([
            { path: '/dev/ttyUSB0' },
            { path: '/dev/ttyUSB1' },
            { path: 'COM3' },
          ]),
      };

      const ports = await listSerialPorts({ _serialPort: mockSerialPort });

      expect(ports).toEqual([{ path: '/dev/ttyUSB0' }, { path: '/dev/ttyUSB1' }, { path: 'COM3' }]);
      expect(mockSerialPort.list).toHaveBeenCalled();
    });

    it('returns empty array when SerialPort.list() throws', async () => {
      const mockSerialPort: SerialPortModule = {
        list: vi.fn().mockRejectedValue(new Error('List failed')),
      };

      const ports = await listSerialPorts({ _serialPort: mockSerialPort });

      expect(ports).toEqual([]);
    });

    it('maps only the path property from port objects', async () => {
      const mockSerialPort: SerialPortModule = {
        list: vi
          .fn()
          .mockResolvedValue([
            { path: '/dev/ttyUSB0', manufacturer: 'ACME', serialNumber: '12345' },
          ]),
      };

      const ports = await listSerialPorts({ _serialPort: mockSerialPort });

      expect(ports).toEqual([{ path: '/dev/ttyUSB0' }]);
    });
  });

  describe('listUsbDevices', () => {
    it('returns empty array when usb package is not available', async () => {
      const devices = await listUsbDevices();
      expect(devices).toEqual([]);
    });

    it('returns devices with USB-TMC interface class', async () => {
      const mockDevice = createMockTmcDevice({
        vendorId: 0x1ab1,
        productId: 0x04ce,
      });

      const mockUsb: UsbModule = {
        getDeviceList: vi.fn().mockReturnValue([mockDevice]),
      };

      const devices = await listUsbDevices({ _usb: mockUsb });

      expect(devices).toHaveLength(1);
      expect(devices[0]).toEqual({
        vendorId: 0x1ab1,
        productId: 0x04ce,
        serialNumber: undefined,
      });
    });

    it('filters out devices without USB-TMC interface', async () => {
      const mockDevice = createMockNonTmcDevice({
        vendorId: 0x1234,
        productId: 0x5678,
      });

      const mockUsb: UsbModule = {
        getDeviceList: vi.fn().mockReturnValue([mockDevice]),
      };

      const devices = await listUsbDevices({ _usb: mockUsb });

      expect(devices).toEqual([]);
    });

    it('returns only TMC devices from mixed device list', async () => {
      const tmcDevice = createMockTmcDevice({ vendorId: 0x1ab1, productId: 0x04ce });
      const nonTmcDevice = createMockNonTmcDevice({ vendorId: 0x0781, productId: 0x5567 });

      const mockUsb: UsbModule = {
        getDeviceList: vi.fn().mockReturnValue([tmcDevice, nonTmcDevice]),
      };

      const devices = await listUsbDevices({ _usb: mockUsb });

      expect(devices).toHaveLength(1);
      expect(devices[0].vendorId).toBe(0x1ab1);
    });

    it('retrieves serial number when iSerialNumber is non-zero', async () => {
      const mockDevice = createMockTmcDevice({
        vendorId: 0x1ab1,
        productId: 0x04ce,
        iSerialNumber: 3,
        serialNumber: 'DS1ZA123456789',
      });

      const mockUsb: UsbModule = {
        getDeviceList: vi.fn().mockReturnValue([mockDevice]),
      };

      const devices = await listUsbDevices({ _usb: mockUsb });

      expect(devices).toHaveLength(1);
      expect(devices[0].serialNumber).toBe('DS1ZA123456789');
      expect(mockDevice.open).toHaveBeenCalled();
      expect(mockDevice.getStringDescriptor).toHaveBeenCalledWith(3, expect.any(Function));
      expect(mockDevice.close).toHaveBeenCalled();
    });

    it('returns undefined serial number when getStringDescriptor returns error', async () => {
      const mockDevice = createMockTmcDevice({
        iSerialNumber: 3,
        descriptorError: true,
      });

      const mockUsb: UsbModule = {
        getDeviceList: vi.fn().mockReturnValue([mockDevice]),
      };

      const devices = await listUsbDevices({ _usb: mockUsb });

      expect(devices).toHaveLength(1);
      expect(devices[0].serialNumber).toBeUndefined();
    });

    it('returns undefined serial number when device.open() throws', async () => {
      const mockDevice = createMockTmcDevice({
        iSerialNumber: 3,
        openThrows: true,
      });

      const mockUsb: UsbModule = {
        getDeviceList: vi.fn().mockReturnValue([mockDevice]),
      };

      const devices = await listUsbDevices({ _usb: mockUsb });

      expect(devices).toHaveLength(1);
      expect(devices[0].serialNumber).toBeUndefined();
    });

    it('handles device.close() throwing without failing', async () => {
      const mockDevice = createMockTmcDevice({
        iSerialNumber: 3,
        serialNumber: 'SERIAL123',
        closeThrows: true,
      });

      const mockUsb: UsbModule = {
        getDeviceList: vi.fn().mockReturnValue([mockDevice]),
      };

      const devices = await listUsbDevices({ _usb: mockUsb });

      expect(devices).toHaveLength(1);
      expect(devices[0].serialNumber).toBe('SERIAL123');
    });

    it('returns empty array when getDeviceList throws', async () => {
      const mockUsb: UsbModule = {
        getDeviceList: vi.fn().mockImplementation(() => {
          throw new Error('USB error');
        }),
      };

      const devices = await listUsbDevices({ _usb: mockUsb });

      expect(devices).toEqual([]);
    });
  });

  describe('getUsbSerialNumber', () => {
    it('returns undefined when iSerialNumber is 0', async () => {
      const mockDevice = createMockTmcDevice({ iSerialNumber: 0 });

      const serialNumber = await getUsbSerialNumber(mockDevice);

      expect(serialNumber).toBeUndefined();
      expect(mockDevice.open).not.toHaveBeenCalled();
    });

    it('opens device, gets descriptor, and closes device', async () => {
      const mockDevice = createMockTmcDevice({
        iSerialNumber: 5,
        serialNumber: 'MY_SERIAL',
      });

      const serialNumber = await getUsbSerialNumber(mockDevice);

      expect(serialNumber).toBe('MY_SERIAL');
      expect(mockDevice.open).toHaveBeenCalledOnce();
      expect(mockDevice.getStringDescriptor).toHaveBeenCalledWith(5, expect.any(Function));
      expect(mockDevice.close).toHaveBeenCalledOnce();
    });
  });

  describe('isTmcDevice', () => {
    it('returns true for device with USB-TMC interface (class=0xFE, subclass=0x03)', () => {
      const device = createMockTmcDevice();
      expect(isTmcDevice(device)).toBe(true);
    });

    it('returns false for device without configDescriptor', () => {
      const device: UsbDevice = {
        deviceDescriptor: {
          idVendor: 0x1234,
          idProduct: 0x5678,
          bDeviceClass: 0,
          iSerialNumber: 0,
        },
        configDescriptor: undefined,
        open: vi.fn(),
        close: vi.fn(),
        getStringDescriptor: vi.fn(),
      };

      expect(isTmcDevice(device)).toBe(false);
    });

    it('returns false for device with wrong interface class', () => {
      const device = createMockNonTmcDevice({
        interfaceClass: 0x08, // Mass Storage
        interfaceSubClass: 0x03,
      });

      expect(isTmcDevice(device)).toBe(false);
    });

    it('returns false for device with wrong interface subclass', () => {
      const device = createMockNonTmcDevice({
        interfaceClass: 0xfe, // Application Specific
        interfaceSubClass: 0x01, // Not TMC
      });

      expect(isTmcDevice(device)).toBe(false);
    });

    it('returns true when TMC interface is in second interface group', () => {
      const device: UsbDevice = {
        deviceDescriptor: {
          idVendor: 0x1234,
          idProduct: 0x5678,
          bDeviceClass: 0,
          iSerialNumber: 0,
        },
        configDescriptor: {
          interfaces: [
            [
              {
                descriptor: {
                  bInterfaceClass: 0x08,
                  bInterfaceSubClass: 0x06,
                  bInterfaceProtocol: 0,
                },
              },
            ],
            [
              {
                descriptor: {
                  bInterfaceClass: 0xfe,
                  bInterfaceSubClass: 0x03,
                  bInterfaceProtocol: 0,
                },
              },
            ],
          ],
        },
        open: vi.fn(),
        close: vi.fn(),
        getStringDescriptor: vi.fn(),
      };

      expect(isTmcDevice(device)).toBe(true);
    });

    it('returns true when TMC interface is alternate setting', () => {
      const device: UsbDevice = {
        deviceDescriptor: {
          idVendor: 0x1234,
          idProduct: 0x5678,
          bDeviceClass: 0,
          iSerialNumber: 0,
        },
        configDescriptor: {
          interfaces: [
            [
              {
                descriptor: {
                  bInterfaceClass: 0x08,
                  bInterfaceSubClass: 0x06,
                  bInterfaceProtocol: 0,
                },
              },
              {
                descriptor: {
                  bInterfaceClass: 0xfe,
                  bInterfaceSubClass: 0x03,
                  bInterfaceProtocol: 0,
                },
              },
            ],
          ],
        },
        open: vi.fn(),
        close: vi.fn(),
        getStringDescriptor: vi.fn(),
      };

      expect(isTmcDevice(device)).toBe(true);
    });
  });
});
