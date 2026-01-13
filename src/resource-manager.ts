/**
 * ResourceManager - Main entry point for discovering and opening instrument connections.
 *
 * @packageDocumentation
 */

import type { Transport } from './transports/transport.js';
import type {
  ResourceInfo,
  USBResourceInfo,
  SerialResourceInfo,
  TCPIPResourceInfo,
  SimulationResourceInfo,
  SerialOptions,
  TCPIPOptions,
  USBTMCOptions,
  OpenOptions,
  ParsedSimulationResource,
} from './types.js';
import type { SimulatedDevice } from './simulation/index.js';
import type { Result } from './result.js';
import { Ok, Err } from './result.js';
import { parseResourceString, matchResourcePattern } from './resource-string.js';
import { createMessageBasedResource } from './resources/message-based.js';
import type { MessageBasedResource } from './resources/message-based-resource.js';
import { createTcpipTransport } from './transports/tcpip.js';
import { createSerialTransport } from './transports/serial.js';
import { createUsbtmcTransport } from './transports/usbtmc.js';
import { createSimulationTransport } from './transports/simulation.js';
import { simulatedPsu, simulatedLoad } from './simulation/index.js';
import { listSerialPorts, listUsbDevices } from './discovery.js';
import type { UsbDeviceInfo } from './discovery.js';
import type { ResourceManager } from './resource-manager-types.js';
import { probeSerialPort } from './util/serial-probe.js';

// Re-export types for convenience
export type { ResourceManager } from './resource-manager-types.js';

// Built-in simulated device registry
const builtInDevices: Record<string, SimulatedDevice> = {
  PSU: simulatedPsu,
  LOAD: simulatedLoad,
};

/**
 * Create a new ResourceManager.
 *
 * @returns ResourceManager instance
 *
 * @example
 * const rm = createResourceManager();
 * const resources = await rm.listResources();
 */
export function createResourceManager(): ResourceManager {
  const openResourcesList: MessageBasedResource[] = [];
  const exclusiveResources = new Set<string>();
  const openCounts = new Map<string, number>();

  function removeFromOpenList(resource: MessageBasedResource, isExclusive: boolean): void {
    const index = openResourcesList.indexOf(resource);
    if (index !== -1) {
      openResourcesList.splice(index, 1);
    }
    const rs = resource.resourceString;
    if (isExclusive) {
      exclusiveResources.delete(rs);
    } else {
      const count = openCounts.get(rs) ?? 0;
      if (count <= 1) {
        openCounts.delete(rs);
      } else {
        openCounts.set(rs, count - 1);
      }
    }
  }

  function wrapResource(
    transport: Transport,
    resourceInfo: ResourceInfo,
    isExclusive: boolean
  ): MessageBasedResource {
    const baseResource = createMessageBasedResource(transport, resourceInfo);
    const originalClose = baseResource.close.bind(baseResource);
    const wrappedResource: MessageBasedResource = {
      ...baseResource,
      async close(): Promise<Result<void, Error>> {
        const result = await originalClose();
        removeFromOpenList(wrappedResource, isExclusive);
        return result;
      },
    };
    return wrappedResource;
  }

  function buildUsbResourceString(device: UsbDeviceInfo): string {
    const vendorHex = `0x${device.vendorId.toString(16).toUpperCase().padStart(4, '0')}`;
    const productHex = `0x${device.productId.toString(16).toUpperCase().padStart(4, '0')}`;
    if (device.serialNumber) {
      return `USB0::${vendorHex}::${productHex}::${device.serialNumber}::INSTR`;
    }
    return `USB0::${vendorHex}::${productHex}::INSTR`;
  }

  const manager: ResourceManager = {
    get openResources(): MessageBasedResource[] {
      return [...openResourcesList];
    },

    async listResources(query = '?*::INSTR'): Promise<string[]> {
      const resources: string[] = [];

      // List simulated devices
      for (const deviceType of Object.keys(builtInDevices)) {
        const resourceString = `SIM::${deviceType}::INSTR`;
        if (matchResourcePattern(resourceString, query)) {
          resources.push(resourceString);
        }
      }

      const serialPorts = await listSerialPorts();
      for (const port of serialPorts) {
        const resourceString = `ASRL${port.path}::INSTR`;
        if (matchResourcePattern(resourceString, query)) {
          resources.push(resourceString);
        }
      }

      const usbDevices = await listUsbDevices();
      for (const device of usbDevices) {
        const resourceString = buildUsbResourceString(device);
        if (matchResourcePattern(resourceString, query)) {
          resources.push(resourceString);
        }
      }

      return resources;
    },

    async listResourcesInfo(query = '?*::INSTR'): Promise<ResourceInfo[]> {
      const infoList: ResourceInfo[] = [];

      // List simulated devices
      for (const deviceType of Object.keys(builtInDevices)) {
        const resourceString = `SIM::${deviceType}::INSTR`;
        if (matchResourcePattern(resourceString, query)) {
          const info: SimulationResourceInfo = {
            resourceString,
            interfaceType: 'SIM',
            deviceType,
          };
          infoList.push(info);
        }
      }

      const serialPorts = await listSerialPorts();
      for (const port of serialPorts) {
        const resourceString = `ASRL${port.path}::INSTR`;
        if (matchResourcePattern(resourceString, query)) {
          const info: SerialResourceInfo = {
            resourceString,
            interfaceType: 'ASRL',
            portPath: port.path,
          };
          infoList.push(info);
        }
      }

      const usbDevices = await listUsbDevices();
      for (const device of usbDevices) {
        const resourceString = buildUsbResourceString(device);
        if (matchResourcePattern(resourceString, query)) {
          const info: USBResourceInfo = {
            resourceString,
            interfaceType: 'USB',
            vendorId: device.vendorId,
            productId: device.productId,
            serialNumber: device.serialNumber,
            usbClass: 0xfe,
          };
          infoList.push(info);
        }
      }

      return infoList;
    },

    async openResource(
      resourceString: string,
      openOptions?: OpenOptions
    ): Promise<Result<MessageBasedResource, Error>> {
      if (!resourceString || resourceString.trim() === '') {
        return Err(new Error('Resource string cannot be empty'));
      }

      const parseResult = parseResourceString(resourceString);
      if (!parseResult.ok) {
        return parseResult;
      }

      const isExclusive = openOptions?.exclusive ?? false;

      // Check exclusive mode constraints
      if (exclusiveResources.has(resourceString)) {
        return Err(new Error(`Resource ${resourceString} is already open in exclusive mode`));
      }
      if (isExclusive && (openCounts.get(resourceString) ?? 0) > 0) {
        return Err(
          new Error(`Cannot open ${resourceString} exclusively: resource is already open`)
        );
      }

      const parsed = parseResult.value;
      let transport: Transport;
      let resourceInfo: ResourceInfo;

      switch (parsed.interfaceType) {
        case 'TCPIP': {
          if (parsed.resourceClass === 'INSTR') {
            return Err(new Error('VXI-11 (TCPIP INSTR) is not supported. Use SOCKET instead.'));
          }
          const tcpipParsed = parsed as { host: string; port: number };
          const tcpipOptions = openOptions?.transport as TCPIPOptions | undefined;
          transport = createTcpipTransport({
            host: tcpipParsed.host,
            port: tcpipParsed.port,
            timeout: openOptions?.timeout,
            readTermination: openOptions?.readTermination,
            writeTermination: openOptions?.writeTermination,
            connectTimeout: tcpipOptions?.connectTimeout,
            keepAlive: tcpipOptions?.keepAlive,
            keepAliveInterval: tcpipOptions?.keepAliveInterval,
          });
          resourceInfo = {
            resourceString,
            interfaceType: 'TCPIP',
            host: tcpipParsed.host,
            port: tcpipParsed.port,
          } as TCPIPResourceInfo;
          break;
        }

        case 'ASRL': {
          const serialParsed = parsed as { portPath: string };
          const serialOptions = openOptions?.transport as SerialOptions | undefined;

          let baudRate = serialOptions?.baudRate;

          // Auto-baud detection if enabled
          if (serialOptions?.autoBaud?.enabled) {
            const probeResult = await probeSerialPort(serialParsed.portPath, {
              baudRates: serialOptions.autoBaud.baudRates,
              probeCommand: serialOptions.autoBaud.probeCommand,
              probeTimeout: serialOptions.autoBaud.probeTimeout,
              dataBits: serialOptions.dataBits,
              stopBits: serialOptions.stopBits,
              parity: serialOptions.parity,
              flowControl: serialOptions.flowControl,
              commandDelay: serialOptions.commandDelay,
            });

            if (!probeResult.ok) {
              return probeResult;
            }

            baudRate = probeResult.value.baudRate;
          }

          transport = createSerialTransport({
            path: serialParsed.portPath,
            timeout: openOptions?.timeout,
            readTermination: openOptions?.readTermination,
            writeTermination: openOptions?.writeTermination,
            baudRate,
            dataBits: serialOptions?.dataBits,
            stopBits: serialOptions?.stopBits,
            parity: serialOptions?.parity,
            flowControl: serialOptions?.flowControl,
            commandDelay: serialOptions?.commandDelay,
          });
          resourceInfo = {
            resourceString,
            interfaceType: 'ASRL',
            portPath: serialParsed.portPath,
          } as SerialResourceInfo;
          break;
        }

        case 'USB': {
          const usbParsed = parsed as {
            vendorId: number;
            productId: number;
            serialNumber?: string;
          };
          const usbOptions = openOptions?.transport as USBTMCOptions | undefined;
          transport = createUsbtmcTransport({
            vendorId: usbParsed.vendorId,
            productId: usbParsed.productId,
            serialNumber: usbParsed.serialNumber,
            timeout: openOptions?.timeout,
            readTermination: openOptions?.readTermination,
            writeTermination: openOptions?.writeTermination,
            quirks: usbOptions?.quirks,
          });
          resourceInfo = {
            resourceString,
            interfaceType: 'USB',
            vendorId: usbParsed.vendorId,
            productId: usbParsed.productId,
            serialNumber: usbParsed.serialNumber,
            usbClass: 0xfe,
          } as USBResourceInfo;
          break;
        }

        case 'SIM': {
          const simParsed = parsed as ParsedSimulationResource;
          const device = builtInDevices[simParsed.deviceType];
          if (!device) {
            return Err(
              new Error(
                `Unknown simulated device type: ${simParsed.deviceType}. ` +
                  `Available: ${Object.keys(builtInDevices).join(', ')}`
              )
            );
          }
          transport = createSimulationTransport({ device });
          resourceInfo = {
            resourceString,
            interfaceType: 'SIM',
            deviceType: simParsed.deviceType,
          } as SimulationResourceInfo;
          break;
        }

        default: {
          const unsupportedType: string = (parsed as { interfaceType: string }).interfaceType;
          return Err(new Error(`Unsupported interface type: ${unsupportedType}`));
        }
      }

      const openResult = await transport.open();
      if (!openResult.ok) {
        return openResult;
      }

      if (openOptions?.timeout !== undefined) {
        transport.timeout = openOptions.timeout;
      }
      if (openOptions?.readTermination !== undefined) {
        transport.readTermination = openOptions.readTermination;
      }
      if (openOptions?.writeTermination !== undefined) {
        transport.writeTermination = openOptions.writeTermination;
      }

      // Track exclusive mode
      if (isExclusive) {
        exclusiveResources.add(resourceString);
      } else {
        openCounts.set(resourceString, (openCounts.get(resourceString) ?? 0) + 1);
      }

      const resource = wrapResource(transport, resourceInfo, isExclusive);
      openResourcesList.push(resource);

      return Ok(resource);
    },

    async close(): Promise<void> {
      const resourcesToClose = [...openResourcesList];
      for (const resource of resourcesToClose) {
        await resource.close();
      }
    },
  };

  return manager;
}
