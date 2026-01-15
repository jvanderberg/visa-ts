/**
 * Buffered reader utility for stream-based transports
 *
 * Shared logic for serial and TCP/IP transports that handle async buffered reads
 * with termination detection, raw reads, and byte count reads.
 *
 * @packageDocumentation
 */

import type { Result } from '../result.js';
import { Ok, Err } from '../result.js';

/**
 * Pending read request state
 */
export interface PendingRead {
  resolve: (result: Result<Buffer, Error>) => void;
  type: 'termination' | 'raw' | 'bytes';
  bytesNeeded?: number;
  termination?: string;
  timeoutId?: ReturnType<typeof setTimeout>;
}

/**
 * Buffered reader configuration
 */
export interface BufferedReaderConfig {
  /** Maximum buffer size in bytes */
  maxBufferSize: number;
  /** Default read termination string */
  getReadTermination: () => string;
}

/**
 * Buffered reader state and operations
 */
export interface BufferedReader {
  /** Handle incoming data from the stream */
  handleData(data: Buffer): void;
  /** Handle stream close event */
  handleClose(errorMessage: string): void;
  /** Handle stream error event */
  handleError(error: Error): void;
  /** Get current buffer contents */
  getBuffer(): Buffer;
  /** Set buffer contents */
  setBuffer(buffer: Buffer<ArrayBufferLike>): void;
  /** Clear the buffer */
  clearBuffer(): void;
  /** Get pending read state */
  getPendingRead(): PendingRead | null;
  /** Set pending read state */
  setPendingRead(pending: PendingRead | null): void;
  /** Check if pending read can be satisfied */
  checkPendingRead(): void;
}

/**
 * Creates a buffered reader for stream-based transports.
 *
 * @param config - Reader configuration
 * @returns BufferedReader instance
 */
export function createBufferedReader(config: BufferedReaderConfig): BufferedReader {
  let readBuffer = Buffer.alloc(0);
  let pendingRead: PendingRead | null = null;

  function checkPendingRead(): void {
    if (!pendingRead) return;

    if (pendingRead.type === 'termination') {
      const termBytes = Buffer.from(pendingRead.termination ?? config.getReadTermination());
      const termIndex = readBuffer.indexOf(termBytes);

      if (termIndex !== -1) {
        const result = readBuffer.subarray(0, termIndex);
        readBuffer = readBuffer.subarray(termIndex + termBytes.length);

        if (pendingRead.timeoutId) {
          clearTimeout(pendingRead.timeoutId);
        }

        const resolve = pendingRead.resolve;
        pendingRead = null;
        resolve(Ok(result));
      }
    } else if (pendingRead.type === 'raw') {
      if (readBuffer.length > 0) {
        const result = readBuffer;
        readBuffer = Buffer.alloc(0);

        if (pendingRead.timeoutId) {
          clearTimeout(pendingRead.timeoutId);
        }

        const resolve = pendingRead.resolve;
        pendingRead = null;
        resolve(Ok(result));
      }
    } else if (pendingRead.type === 'bytes') {
      const bytesNeeded = pendingRead.bytesNeeded ?? 0;

      if (readBuffer.length >= bytesNeeded) {
        const result = readBuffer.subarray(0, bytesNeeded);
        readBuffer = readBuffer.subarray(bytesNeeded);

        if (pendingRead.timeoutId) {
          clearTimeout(pendingRead.timeoutId);
        }

        const resolve = pendingRead.resolve;
        pendingRead = null;
        resolve(Ok(result));
      }
    }
  }

  function handleData(data: Buffer): void {
    // Check for buffer overflow before adding data
    if (readBuffer.length + data.length > config.maxBufferSize) {
      // Trigger buffer overflow error
      if (pendingRead) {
        if (pendingRead.timeoutId) {
          clearTimeout(pendingRead.timeoutId);
        }
        const pending = pendingRead;
        pendingRead = null;
        readBuffer = Buffer.alloc(0); // Clear buffer
        pending.resolve(
          Err(new Error(`Read buffer overflow: exceeded ${config.maxBufferSize} bytes`))
        );
      }
      return;
    }

    readBuffer = Buffer.concat([readBuffer, data]);

    if (pendingRead) {
      checkPendingRead();
    }
  }

  function handleClose(errorMessage: string): void {
    if (pendingRead) {
      if (pendingRead.timeoutId) {
        clearTimeout(pendingRead.timeoutId);
      }

      const resolve = pendingRead.resolve;
      pendingRead = null;
      resolve(Err(new Error(errorMessage)));
    }
  }

  function handleError(error: Error): void {
    if (pendingRead) {
      if (pendingRead.timeoutId) {
        clearTimeout(pendingRead.timeoutId);
      }

      const resolve = pendingRead.resolve;
      pendingRead = null;
      resolve(Err(error));
    }
  }

  return {
    handleData,
    handleClose,
    handleError,
    getBuffer: () => readBuffer,
    setBuffer: (buffer: Buffer<ArrayBufferLike>) => {
      readBuffer = Buffer.from(buffer);
    },
    clearBuffer: () => {
      readBuffer = Buffer.alloc(0);
    },
    getPendingRead: () => pendingRead,
    setPendingRead: (pending: PendingRead | null) => {
      pendingRead = pending;
    },
    checkPendingRead,
  };
}
