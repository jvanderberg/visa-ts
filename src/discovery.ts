/**
 * Device discovery functions for ResourceManager.
 *
 * @packageDocumentation
 */

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

/**
 * Default serial port listing implementation.
 * Uses serialport package if available.
 */
export async function listSerialPorts(): Promise<SerialPortInfo[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
    const { SerialPort } = require('serialport') as {
      SerialPort: { list(): Promise<Array<{ path: string }>> };
    };
    const ports = await SerialPort.list();
    return ports.map((p) => ({ path: p.path }));
  } catch {
    // serialport not available
    return [];
  }
}

// USB device type for the usb package
interface UsbDevice {
  deviceDescriptor: {
    idVendor: number;
    idProduct: number;
    bDeviceClass: number;
    iSerialNumber: number;
  };
  open(): void;
  close(): void;
  getStringDescriptor(
    index: number,
    callback: (error: Error | undefined, data?: string) => void
  ): void;
}

/**
 * Get the serial number string from a USB device.
 * Opens the device, reads the descriptor, and closes it.
 */
async function getUsbSerialNumber(device: UsbDevice): Promise<string | undefined> {
  const iSerialNumber = device.deviceDescriptor.iSerialNumber;
  if (iSerialNumber === 0) {
    return undefined;
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
      // Failed to open device - might be in use
      resolve(undefined);
    }
  });
}

/**
 * Default USB device listing implementation.
 * Uses usb package if available.
 */
export async function listUsbDevices(): Promise<UsbDeviceInfo[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
    const usb = require('usb') as {
      getDeviceList(): UsbDevice[];
    };

    const devices = usb.getDeviceList();
    const tmcDevices: UsbDeviceInfo[] = [];

    // Filter for USB-TMC devices
    for (const device of devices) {
      const desc = device.deviceDescriptor;
      if (isKnownTmcDevice(desc.idVendor)) {
        const serialNumber = await getUsbSerialNumber(device);
        tmcDevices.push({
          vendorId: desc.idVendor,
          productId: desc.idProduct,
          serialNumber,
        });
      }
    }

    return tmcDevices;
  } catch {
    // usb not available
    return [];
  }
}

/**
 * Check if a device is a known USB-TMC device by vendor ID.
 * This is a simplified check - in production we'd enumerate interfaces.
 */
function isKnownTmcDevice(vendorId: number): boolean {
  // Known USB-TMC vendor IDs
  const knownVendors = [
    0x1ab1, // Rigol
    0x0957, // Agilent/Keysight
    0x0699, // Tektronix
    0x0b21, // Yokogawa
    0x164e, // Siglent
  ];

  return knownVendors.includes(vendorId);
}
