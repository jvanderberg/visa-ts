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

/**
 * Default USB device listing implementation.
 * Uses usb package if available.
 */
export async function listUsbDevices(): Promise<UsbDeviceInfo[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
    const usb = require('usb') as {
      getDeviceList(): Array<{
        deviceDescriptor: {
          idVendor: number;
          idProduct: number;
          bDeviceClass: number;
          iSerialNumber: number;
        };
      }>;
    };

    const devices = usb.getDeviceList();
    const tmcDevices: UsbDeviceInfo[] = [];

    // Filter for USB-TMC devices (class 0xFE, subclass 0x03)
    for (const device of devices) {
      const desc = device.deviceDescriptor;
      // USB-TMC class is 0xFE (Application Specific)
      // For now, we look for common test equipment vendors
      // In production, we'd check interface descriptors for TMC subclass
      if (isKnownTmcDevice(desc.idVendor)) {
        tmcDevices.push({
          vendorId: desc.idVendor,
          productId: desc.idProduct,
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
