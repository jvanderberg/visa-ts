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
import { listSerialPorts, listUsbDevices } from './discovery.js';
import type { UsbDeviceInfo } from './discovery.js';
import type { ResourceManager } from './resource-manager-types.js';
import { probeSerialPort } from './util/serial-probe.js';

// Re-export types for convenience
export type { ResourceManager } from './resource-manager-types.js';

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
  const simulatedDevices = new Map<string, SimulatedDevice>();

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

      // List registered simulated devices
      for (const deviceType of simulatedDevices.keys()) {
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

      // List registered simulated devices
      for (const deviceType of simulatedDevices.keys()) {
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
          // Type narrowing: parsed is ParsedTCPIPSocketResource | ParsedTCPIPInstrResource
          if (parsed.resourceClass === 'INSTR') {
            return Err(new Error('VXI-11 (TCPIP INSTR) is not supported. Use SOCKET instead.'));
          }
          // After the INSTR check, parsed is effectively ParsedTCPIPSocketResource
          // but TypeScript can't narrow this automatically, so we use a type assertion
          const socketParsed = parsed as { host: string; port: number };
          const tcpipOptions = openOptions?.transport as TCPIPOptions | undefined;
          transport = createTcpipTransport({
            host: socketParsed.host,
            port: socketParsed.port,
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
            host: socketParsed.host,
            port: socketParsed.port,
          } as TCPIPResourceInfo;
          break;
        }

        case 'ASRL': {
          // Type narrowing: parsed is ParsedSerialResource here
          const serialOptions = openOptions?.transport as SerialOptions | undefined;

          let baudRate = serialOptions?.baudRate;

          // Auto-baud detection if enabled
          if (serialOptions?.autoBaud?.enabled) {
            const probeResult = await probeSerialPort(parsed.portPath, {
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
            path: parsed.portPath,
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
            portPath: parsed.portPath,
          } as SerialResourceInfo;
          break;
        }

        case 'USB': {
          // Type narrowing: parsed is ParsedUSBResource here
          const usbOptions = openOptions?.transport as USBTMCOptions | undefined;
          transport = createUsbtmcTransport({
            vendorId: parsed.vendorId,
            productId: parsed.productId,
            serialNumber: parsed.serialNumber,
            timeout: openOptions?.timeout,
            readTermination: openOptions?.readTermination,
            writeTermination: openOptions?.writeTermination,
            quirks: usbOptions?.quirks,
          });
          resourceInfo = {
            resourceString,
            interfaceType: 'USB',
            vendorId: parsed.vendorId,
            productId: parsed.productId,
            serialNumber: parsed.serialNumber,
            usbClass: 0xfe,
          } as USBResourceInfo;
          break;
        }

        case 'SIM': {
          // Type narrowing: parsed is ParsedSimulationResource here
          const device = simulatedDevices.get(parsed.deviceType);
          if (!device) {
            const available = [...simulatedDevices.keys()];
            return Err(
              new Error(
                `Unknown simulated device type: ${parsed.deviceType}. ` +
                  (available.length > 0
                    ? `Available: ${available.join(', ')}`
                    : 'No simulated devices registered. Use rm.registerSimulatedDevice() first.')
              )
            );
          }
          transport = createSimulationTransport({ device });
          resourceInfo = {
            resourceString,
            interfaceType: 'SIM',
            deviceType: parsed.deviceType,
          } as SimulationResourceInfo;
          break;
        }

        default: {
          // This should be unreachable if all interface types are handled above.
          // The cast is needed because TypeScript narrows parsed to 'never' here.
          const exhaustiveCheck: never = parsed;
          return Err(
            new Error(
              `Unsupported interface type: ${(exhaustiveCheck as { interfaceType: string }).interfaceType}`
            )
          );
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

    registerSimulatedDevice(deviceType: string, device: SimulatedDevice): void {
      simulatedDevices.set(deviceType.toUpperCase(), device);
    },
  };

  return manager;
}
