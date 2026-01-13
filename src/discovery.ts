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
 * SerialPort-like interface for discovery
 * @internal
 */
export interface SerialPortModule {
  list(): Promise<Array<{ path: string }>>;
}

/**
 * USB device type for the usb package
 * @internal
 */
export interface UsbDevice {
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
 * USB module interface for discovery
 * @internal
 */
export interface UsbModule {
  getDeviceList(): UsbDevice[];
}

/**
 * Options for listSerialPorts (for testing)
 * @internal
 */
export interface ListSerialPortsOptions {
  /** @internal Injected SerialPort module for testing */
  _serialPort?: SerialPortModule;
}

/**
 * Options for listUsbDevices (for testing)
 * @internal
 */
export interface ListUsbDevicesOptions {
  /** @internal Injected usb module for testing */
  _usb?: UsbModule;
}

/**
 * Default serial port listing implementation.
 * Uses serialport package if available.
 *
 * @param options - Internal options for testing
 */
export async function listSerialPorts(options?: ListSerialPortsOptions): Promise<SerialPortInfo[]> {
  try {
    let SerialPort: SerialPortModule;
    if (options?._serialPort) {
      SerialPort = options._serialPort;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
      SerialPort = (require('serialport') as { SerialPort: SerialPortModule }).SerialPort;
    }
    const ports = await SerialPort.list();
    return ports.map((p) => ({ path: p.path }));
  } catch {
    // serialport not available
    return [];
  }
}

/**
 * Get the serial number string from a USB device.
 * Opens the device, reads the descriptor, and closes it.
 */
export async function getUsbSerialNumber(device: UsbDevice): Promise<string | undefined> {
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
 * Known USB-TMC vendor IDs.
 * This is a simplified check - in production we'd enumerate interfaces.
 */
const KNOWN_TMC_VENDORS = new Set([
  0x1ab1, // Rigol
  0x0957, // Agilent/Keysight
  0x0699, // Tektronix
  0x0b21, // Yokogawa
  0x164e, // Siglent
]);

/**
 * Check if a device is a known USB-TMC device by vendor ID.
 */
export function isKnownTmcDevice(vendorId: number): boolean {
  return KNOWN_TMC_VENDORS.has(vendorId);
}

/**
 * Default USB device listing implementation.
 * Uses usb package if available.
 *
 * @param options - Internal options for testing
 */
export async function listUsbDevices(options?: ListUsbDevicesOptions): Promise<UsbDeviceInfo[]> {
  try {
    let usb: UsbModule;
    if (options?._usb) {
      usb = options._usb;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
      usb = require('usb') as UsbModule;
    }

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
