/**
 * MessageBasedResource factory - Creates high-level SCPI instrument connections.
 *
 * @packageDocumentation
 */

import type { Transport } from '../transports/transport.js';
import type { ResourceInfo, QueryOptions, AsciiValuesOptions, BinaryDatatype } from '../types.js';
import type { Result } from '../result.js';
import { Ok } from '../result.js';
import {
  createBlockHeader,
  binaryToArray,
  arrayToBinary,
  readBinaryBlock,
} from '../util/binary-block.js';
import { parseAsciiValues } from '../util/ascii-values.js';
import type { MessageBasedResource } from './message-based-resource.js';

// Re-export the interface for convenience
export type { MessageBasedResource } from './message-based-resource.js';

/**
 * Default read buffer size in bytes.
 * 64KB is a reasonable balance between efficiency (fewer reads for waveform data)
 * and memory usage. This matches common instrument buffer sizes and is a power
 * of 2 for efficient allocation.
 */
const DEFAULT_CHUNK_SIZE = 65536;

/**
 * Creates a MessageBasedResource wrapping a transport.
 *
 * @param transport - The underlying transport for I/O operations
 * @param resourceInfo - Information about the resource
 * @returns MessageBasedResource interface
 */
export function createMessageBasedResource(
  transport: Transport,
  resourceInfo: ResourceInfo
): MessageBasedResource {
  let chunkSize = DEFAULT_CHUNK_SIZE;

  const resource: MessageBasedResource = {
    get resourceString() {
      return resourceInfo.resourceString;
    },

    get resourceInfo() {
      return resourceInfo;
    },

    get timeout() {
      return transport.timeout;
    },

    set timeout(value: number) {
      transport.timeout = value;
    },

    get writeTermination() {
      return transport.writeTermination;
    },

    set writeTermination(value: string) {
      transport.writeTermination = value;
    },

    get readTermination() {
      return transport.readTermination;
    },

    set readTermination(value: string) {
      transport.readTermination = value;
    },

    get chunkSize() {
      return chunkSize;
    },

    set chunkSize(value: number) {
      chunkSize = value;
    },

    get isOpen() {
      return transport.isOpen;
    },

    // Basic I/O
    async query(command: string, options?: QueryOptions): Promise<Result<string, Error>> {
      return transport.query(command, options?.delay);
    },

    async write(command: string): Promise<Result<void, Error>> {
      return transport.write(command);
    },

    async read(): Promise<Result<string, Error>> {
      return transport.read();
    },

    // Raw I/O
    async writeRaw(data: Buffer): Promise<Result<number, Error>> {
      return transport.writeRaw(data);
    },

    async readRaw(size?: number): Promise<Result<Buffer, Error>> {
      return transport.readRaw(size ?? chunkSize);
    },

    async readBytes(count: number): Promise<Result<Buffer, Error>> {
      return transport.readBytes(count);
    },

    // Control
    async clear(): Promise<Result<void, Error>> {
      return transport.clear();
    },

    async trigger(): Promise<Result<void, Error>> {
      return transport.trigger();
    },

    async readStb(): Promise<Result<number, Error>> {
      return transport.readStb();
    },

    async close(): Promise<Result<void, Error>> {
      return transport.close();
    },

    // ASCII Values
    async queryAsciiValues(
      command: string,
      options?: AsciiValuesOptions
    ): Promise<Result<number[], Error>> {
      const result = await transport.query(command);
      if (!result.ok) {
        return result;
      }
      return Ok(parseAsciiValues(result.value, options));
    },

    async readAsciiValues(options?: AsciiValuesOptions): Promise<Result<number[], Error>> {
      const result = await transport.read();
      if (!result.ok) {
        return result;
      }
      return Ok(parseAsciiValues(result.value, options));
    },

    async writeAsciiValues(
      command: string,
      values: number[],
      options?: AsciiValuesOptions
    ): Promise<Result<void, Error>> {
      const separator = typeof options?.separator === 'string' ? options.separator : ',';
      const valueStr = values.join(separator);
      return transport.write(`${command} ${valueStr}`);
    },

    // Binary I/O - Implementation handles both overloads
    queryBinaryValues: (async (
      command: string,
      datatype: BinaryDatatype = 'B',
      container: 'array' | 'buffer' = 'array'
    ): Promise<Result<number[] | Buffer, Error>> => {
      // Write the command
      const writeResult = await transport.write(command);
      if (!writeResult.ok) {
        return writeResult;
      }

      // Read complete binary block (handles multi-read for large data)
      const dataResult = await readBinaryBlock(transport, chunkSize);
      if (!dataResult.ok) {
        return dataResult;
      }

      if (container === 'buffer') {
        return Ok(dataResult.value);
      }

      return Ok(binaryToArray(dataResult.value, datatype));
    }) as MessageBasedResource['queryBinaryValues'],

    async writeBinaryValues(
      command: string,
      values: number[] | Buffer,
      datatype: BinaryDatatype = 'B'
    ): Promise<Result<void, Error>> {
      // Convert values to binary if needed
      const data = Buffer.isBuffer(values) ? values : arrayToBinary(values, datatype);

      // Create the IEEE 488.2 header
      const header = createBlockHeader(data.length);

      // Combine command, header, and data
      const fullData = Buffer.concat([Buffer.from(command + ' ' + header), data]);

      const result = await transport.writeRaw(fullData);
      if (!result.ok) {
        return result;
      }

      return Ok(undefined);
    },

    async queryBinary(command: string): Promise<Result<Buffer, Error>> {
      // Write the command
      const writeResult = await transport.write(command);
      if (!writeResult.ok) {
        return writeResult;
      }

      // Read complete binary block (handles multi-read for large data)
      return readBinaryBlock(transport, chunkSize);
    },

    async readBinary(): Promise<Result<Buffer, Error>> {
      // Read complete binary block (handles multi-read for large data)
      return readBinaryBlock(transport, chunkSize);
    },
  };

  return resource;
}
