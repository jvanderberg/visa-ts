/**
 * Device discovery functions for ResourceManager.
 *
 * @packageDocumentation
 */

import { SerialPort } from 'serialport';
import usb from 'usb';

/**
 * Serial port info from discovery
 */
export interface SerialPortInfo {
  path: string;
}

/**
 * USB device info from discovery
 */
export interface UsbDeviceInfo {
  vendorId: number;
  productId: number;
  serialNumber?: string;
}

/** USB-TMC interface class (Application Specific) */
const USB_CLASS_APPLICATION_SPECIFIC = 0xfe;

/** USB-TMC interface subclass (Test and Measurement Class) */
const USB_SUBCLASS_TMC = 0x03;

/**
 * Check if a USB device has a USB-TMC interface.
 */
function isTmcDevice(device: usb.Device): boolean {
  const config = device.configDescriptor;
  if (!config) {
    return false;
  }

  for (const iface of config.interfaces) {
    for (const alt of iface) {
      if (
        alt.bInterfaceClass === USB_CLASS_APPLICATION_SPECIFIC &&
        alt.bInterfaceSubClass === USB_SUBCLASS_TMC
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get the serial number string from a USB device.
 */
function getUsbSerialNumber(device: usb.Device): Promise<string | undefined> {
  const iSerialNumber = device.deviceDescriptor.iSerialNumber;
  if (iSerialNumber === 0) {
    return Promise.resolve(undefined);
  }

  return new Promise((resolve) => {
    try {
      device.open();
      device.getStringDescriptor(iSerialNumber, (error, data) => {
        try {
          device.close();
        } catch {
          // Ignore close errors
        }
        if (error || !data) {
          resolve(undefined);
        } else {
          resolve(data);
        }
      });
    } catch {
      resolve(undefined);
    }
  });
}

/**
 * List available serial ports.
 */
export async function listSerialPorts(): Promise<SerialPortInfo[]> {
  const ports = await SerialPort.list();
  return ports.map((p) => ({ path: p.path }));
}

/**
 * List available USB-TMC devices.
 */
export async function listUsbDevices(): Promise<UsbDeviceInfo[]> {
  const devices = usb.getDeviceList();
  const tmcDevices: UsbDeviceInfo[] = [];

  for (const device of devices) {
    if (isTmcDevice(device)) {
      const desc = device.deviceDescriptor;
      const serialNumber = await getUsbSerialNumber(device);
      tmcDevices.push({
        vendorId: desc.idVendor,
        productId: desc.idProduct,
        serialNumber,
      });
    }
  }

  return tmcDevices;
}
