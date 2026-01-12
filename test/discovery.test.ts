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
  isKnownTmcDevice,
} from '../src/discovery.js';
import type { SerialPortModule, UsbDevice, UsbModule } from '../src/discovery.js';

describe('discovery', () => {
  describe('listSerialPorts', () => {
    it('returns empty array when serialport package is not available', async () => {
      // Without _serialPort option, it tries to require('serialport') which will fail
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
      // Without _usb option, it tries to require('usb') which will fail
      const devices = await listUsbDevices();
      expect(devices).toEqual([]);
    });

    it('returns USB-TMC devices from known vendors', async () => {
      const mockUsb: UsbModule = {
        getDeviceList: vi.fn().mockReturnValue([
          {
            deviceDescriptor: {
              idVendor: 0x1ab1, // Rigol
              idProduct: 0x04ce,
              bDeviceClass: 0,
              iSerialNumber: 0,
            },
            open: vi.fn(),
            close: vi.fn(),
            getStringDescriptor: vi.fn(),
          },
        ]),
      };

      const devices = await listUsbDevices({ _usb: mockUsb });

      expect(devices).toHaveLength(1);
      expect(devices[0]).toEqual({
        vendorId: 0x1ab1,
        productId: 0x04ce,
        serialNumber: undefined,
      });
    });

    it('filters out devices from unknown vendors', async () => {
      const mockUsb: UsbModule = {
        getDeviceList: vi.fn().mockReturnValue([
          {
            deviceDescriptor: {
              idVendor: 0x1234, // Unknown vendor
              idProduct: 0x5678,
              bDeviceClass: 0,
              iSerialNumber: 0,
            },
            open: vi.fn(),
            close: vi.fn(),
            getStringDescriptor: vi.fn(),
          },
        ]),
      };

      const devices = await listUsbDevices({ _usb: mockUsb });

      expect(devices).toEqual([]);
    });

    it('includes devices from all known TMC vendors', async () => {
      const knownVendors = [
        { id: 0x1ab1, name: 'Rigol' },
        { id: 0x0957, name: 'Agilent/Keysight' },
        { id: 0x0699, name: 'Tektronix' },
        { id: 0x0b21, name: 'Yokogawa' },
        { id: 0x164e, name: 'Siglent' },
      ];

      const mockDevices = knownVendors.map((vendor) => ({
        deviceDescriptor: {
          idVendor: vendor.id,
          idProduct: 0x0001,
          bDeviceClass: 0,
          iSerialNumber: 0,
        },
        open: vi.fn(),
        close: vi.fn(),
        getStringDescriptor: vi.fn(),
      }));

      const mockUsb: UsbModule = {
        getDeviceList: vi.fn().mockReturnValue(mockDevices),
      };

      const devices = await listUsbDevices({ _usb: mockUsb });

      expect(devices).toHaveLength(5);
      knownVendors.forEach((vendor, index) => {
        expect(devices[index].vendorId).toBe(vendor.id);
      });
    });

    it('retrieves serial number when iSerialNumber is non-zero', async () => {
      const mockDevice: UsbDevice = {
        deviceDescriptor: {
          idVendor: 0x1ab1, // Rigol
          idProduct: 0x04ce,
          bDeviceClass: 0,
          iSerialNumber: 3, // Non-zero indicates serial number available
        },
        open: vi.fn(),
        close: vi.fn(),
        getStringDescriptor: vi.fn(
          (_index: number, callback: (error: Error | undefined, data?: string) => void) => {
            callback(undefined, 'DS1ZA123456789');
          }
        ),
      };

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
      const mockDevice: UsbDevice = {
        deviceDescriptor: {
          idVendor: 0x1ab1,
          idProduct: 0x04ce,
          bDeviceClass: 0,
          iSerialNumber: 3,
        },
        open: vi.fn(),
        close: vi.fn(),
        getStringDescriptor: vi.fn(
          (_index: number, callback: (error: Error | undefined, data?: string) => void) => {
            callback(new Error('Failed to get descriptor'));
          }
        ),
      };

      const mockUsb: UsbModule = {
        getDeviceList: vi.fn().mockReturnValue([mockDevice]),
      };

      const devices = await listUsbDevices({ _usb: mockUsb });

      expect(devices).toHaveLength(1);
      expect(devices[0].serialNumber).toBeUndefined();
    });

    it('returns undefined serial number when getStringDescriptor returns no data', async () => {
      const mockDevice: UsbDevice = {
        deviceDescriptor: {
          idVendor: 0x1ab1,
          idProduct: 0x04ce,
          bDeviceClass: 0,
          iSerialNumber: 3,
        },
        open: vi.fn(),
        close: vi.fn(),
        getStringDescriptor: vi.fn(
          (_index: number, callback: (error: Error | undefined, data?: string) => void) => {
            callback(undefined, undefined);
          }
        ),
      };

      const mockUsb: UsbModule = {
        getDeviceList: vi.fn().mockReturnValue([mockDevice]),
      };

      const devices = await listUsbDevices({ _usb: mockUsb });

      expect(devices).toHaveLength(1);
      expect(devices[0].serialNumber).toBeUndefined();
    });

    it('returns undefined serial number when device.open() throws', async () => {
      const mockDevice: UsbDevice = {
        deviceDescriptor: {
          idVendor: 0x1ab1,
          idProduct: 0x04ce,
          bDeviceClass: 0,
          iSerialNumber: 3,
        },
        open: vi.fn().mockImplementation(() => {
          throw new Error('Device busy');
        }),
        close: vi.fn(),
        getStringDescriptor: vi.fn(),
      };

      const mockUsb: UsbModule = {
        getDeviceList: vi.fn().mockReturnValue([mockDevice]),
      };

      const devices = await listUsbDevices({ _usb: mockUsb });

      expect(devices).toHaveLength(1);
      expect(devices[0].serialNumber).toBeUndefined();
    });

    it('handles device.close() throwing without failing', async () => {
      const mockDevice: UsbDevice = {
        deviceDescriptor: {
          idVendor: 0x1ab1,
          idProduct: 0x04ce,
          bDeviceClass: 0,
          iSerialNumber: 3,
        },
        open: vi.fn(),
        close: vi.fn().mockImplementation(() => {
          throw new Error('Close failed');
        }),
        getStringDescriptor: vi.fn(
          (_index: number, callback: (error: Error | undefined, data?: string) => void) => {
            callback(undefined, 'SERIAL123');
          }
        ),
      };

      const mockUsb: UsbModule = {
        getDeviceList: vi.fn().mockReturnValue([mockDevice]),
      };

      const devices = await listUsbDevices({ _usb: mockUsb });

      // Should still succeed and return the serial number
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
      const mockDevice: UsbDevice = {
        deviceDescriptor: {
          idVendor: 0x1ab1,
          idProduct: 0x04ce,
          bDeviceClass: 0,
          iSerialNumber: 0,
        },
        open: vi.fn(),
        close: vi.fn(),
        getStringDescriptor: vi.fn(),
      };

      const serialNumber = await getUsbSerialNumber(mockDevice);

      expect(serialNumber).toBeUndefined();
      expect(mockDevice.open).not.toHaveBeenCalled();
    });

    it('opens device, gets descriptor, and closes device', async () => {
      const mockDevice: UsbDevice = {
        deviceDescriptor: {
          idVendor: 0x1ab1,
          idProduct: 0x04ce,
          bDeviceClass: 0,
          iSerialNumber: 5,
        },
        open: vi.fn(),
        close: vi.fn(),
        getStringDescriptor: vi.fn(
          (_index: number, callback: (error: Error | undefined, data?: string) => void) => {
            callback(undefined, 'MY_SERIAL');
          }
        ),
      };

      const serialNumber = await getUsbSerialNumber(mockDevice);

      expect(serialNumber).toBe('MY_SERIAL');
      expect(mockDevice.open).toHaveBeenCalledOnce();
      expect(mockDevice.getStringDescriptor).toHaveBeenCalledWith(5, expect.any(Function));
      expect(mockDevice.close).toHaveBeenCalledOnce();
    });
  });

  describe('isKnownTmcDevice', () => {
    it('returns true for Rigol vendor ID', () => {
      expect(isKnownTmcDevice(0x1ab1)).toBe(true);
    });

    it('returns true for Agilent/Keysight vendor ID', () => {
      expect(isKnownTmcDevice(0x0957)).toBe(true);
    });

    it('returns true for Tektronix vendor ID', () => {
      expect(isKnownTmcDevice(0x0699)).toBe(true);
    });

    it('returns true for Yokogawa vendor ID', () => {
      expect(isKnownTmcDevice(0x0b21)).toBe(true);
    });

    it('returns true for Siglent vendor ID', () => {
      expect(isKnownTmcDevice(0x164e)).toBe(true);
    });

    it('returns false for unknown vendor ID', () => {
      expect(isKnownTmcDevice(0x1234)).toBe(false);
    });

    it('returns false for vendor ID 0', () => {
      expect(isKnownTmcDevice(0)).toBe(false);
    });
  });
});
