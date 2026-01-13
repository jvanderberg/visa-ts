/**
 * Discovery module tests
 *
 * @packageDocumentation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listSerialPorts, listUsbDevices } from '../src/discovery.js';

vi.mock('serialport', () => ({
  SerialPort: {
    list: vi.fn(),
  },
}));

vi.mock('usb', () => ({
  default: {
    getDeviceList: vi.fn(),
  },
}));

import { SerialPort } from 'serialport';
import usb from 'usb';

describe('discovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listSerialPorts', () => {
    it('returns serial ports', async () => {
      vi.mocked(SerialPort.list).mockResolvedValue([
        { path: '/dev/ttyUSB0' },
        { path: '/dev/ttyUSB1' },
        { path: 'COM3' },
      ] as Awaited<ReturnType<typeof SerialPort.list>>);

      const ports = await listSerialPorts();

      expect(ports).toEqual([{ path: '/dev/ttyUSB0' }, { path: '/dev/ttyUSB1' }, { path: 'COM3' }]);
    });

    it('maps only the path property', async () => {
      vi.mocked(SerialPort.list).mockResolvedValue([
        { path: '/dev/ttyUSB0', manufacturer: 'ACME', serialNumber: '12345' },
      ] as Awaited<ReturnType<typeof SerialPort.list>>);

      const ports = await listSerialPorts();

      expect(ports).toEqual([{ path: '/dev/ttyUSB0' }]);
    });

    it('returns empty array when no ports', async () => {
      vi.mocked(SerialPort.list).mockResolvedValue([]);

      const ports = await listSerialPorts();

      expect(ports).toEqual([]);
    });
  });

  describe('listUsbDevices', () => {
    it('returns devices with USB-TMC interface', async () => {
      vi.mocked(usb.getDeviceList).mockReturnValue([
        {
          deviceDescriptor: {
            idVendor: 0x1ab1,
            idProduct: 0x04ce,
            iSerialNumber: 0,
          },
          configDescriptor: {
            interfaces: [[{ bInterfaceClass: 0xfe, bInterfaceSubClass: 0x03 }]],
          },
        },
      ] as unknown as usb.Device[]);

      const devices = await listUsbDevices();

      expect(devices).toHaveLength(1);
      expect(devices[0]).toEqual({
        vendorId: 0x1ab1,
        productId: 0x04ce,
        serialNumber: undefined,
      });
    });

    it('filters out non-TMC devices', async () => {
      vi.mocked(usb.getDeviceList).mockReturnValue([
        {
          deviceDescriptor: {
            idVendor: 0x1234,
            idProduct: 0x5678,
            iSerialNumber: 0,
          },
          configDescriptor: {
            interfaces: [[{ bInterfaceClass: 0x08, bInterfaceSubClass: 0x06 }]],
          },
        },
      ] as unknown as usb.Device[]);

      const devices = await listUsbDevices();

      expect(devices).toEqual([]);
    });

    it('filters out devices without configDescriptor', async () => {
      vi.mocked(usb.getDeviceList).mockReturnValue([
        {
          deviceDescriptor: {
            idVendor: 0x1ab1,
            idProduct: 0x04ce,
            iSerialNumber: 0,
          },
          configDescriptor: undefined,
        },
      ] as unknown as usb.Device[]);

      const devices = await listUsbDevices();

      expect(devices).toEqual([]);
    });

    it('retrieves serial number when available', async () => {
      vi.mocked(usb.getDeviceList).mockReturnValue([
        {
          deviceDescriptor: {
            idVendor: 0x1ab1,
            idProduct: 0x04ce,
            iSerialNumber: 3,
          },
          configDescriptor: {
            interfaces: [[{ bInterfaceClass: 0xfe, bInterfaceSubClass: 0x03 }]],
          },
          open: vi.fn(),
          close: vi.fn(),
          getStringDescriptor: vi.fn(
            (_idx: number, cb: (err: Error | null, data?: string) => void) => {
              cb(null, 'DS1ZA123456789');
            }
          ),
        },
      ] as unknown as usb.Device[]);

      const devices = await listUsbDevices();

      expect(devices).toHaveLength(1);
      expect(devices[0].serialNumber).toBe('DS1ZA123456789');
    });

    it('returns undefined serial when open throws', async () => {
      vi.mocked(usb.getDeviceList).mockReturnValue([
        {
          deviceDescriptor: {
            idVendor: 0x1ab1,
            idProduct: 0x04ce,
            iSerialNumber: 3,
          },
          configDescriptor: {
            interfaces: [[{ bInterfaceClass: 0xfe, bInterfaceSubClass: 0x03 }]],
          },
          open: vi.fn(() => {
            throw new Error('Device busy');
          }),
          close: vi.fn(),
          getStringDescriptor: vi.fn(),
        },
      ] as unknown as usb.Device[]);

      const devices = await listUsbDevices();

      expect(devices).toHaveLength(1);
      expect(devices[0].serialNumber).toBeUndefined();
    });

    it('returns empty array when no devices', async () => {
      vi.mocked(usb.getDeviceList).mockReturnValue([]);

      const devices = await listUsbDevices();

      expect(devices).toEqual([]);
    });
  });
});
