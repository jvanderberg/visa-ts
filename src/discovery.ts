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
 * USB interface descriptor
 * @internal
 */
export interface UsbInterfaceDescriptor {
  bInterfaceClass: number;
  bInterfaceSubClass: number;
  bInterfaceProtocol: number;
}

/**
 * USB interface from the usb package
 * @internal
 */
export interface UsbInterface {
  descriptor: UsbInterfaceDescriptor;
}

/**
 * USB configuration from the usb package
 * @internal
 */
export interface UsbConfiguration {
  interfaces: UsbInterface[][];
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
  configDescriptor?: UsbConfiguration;
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

/** USB-TMC interface class (Application Specific) */
const USB_CLASS_APPLICATION_SPECIFIC = 0xfe;

/** USB-TMC interface subclass (Test and Measurement Class) */
const USB_SUBCLASS_TMC = 0x03;

/**
 * Check if a USB device has a USB-TMC interface.
 * USB-TMC devices have bInterfaceClass=0xFE and bInterfaceSubClass=0x03.
 */
export function isTmcDevice(device: UsbDevice): boolean {
  const config = device.configDescriptor;
  if (!config) {
    return false;
  }

  for (const ifaceGroup of config.interfaces) {
    for (const iface of ifaceGroup) {
      if (
        iface.descriptor.bInterfaceClass === USB_CLASS_APPLICATION_SPECIFIC &&
        iface.descriptor.bInterfaceSubClass === USB_SUBCLASS_TMC
      ) {
        return true;
      }
    }
  }

  return false;
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

    // Filter for USB-TMC devices by interface class
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
  } catch {
    // usb not available
    return [];
  }
}
