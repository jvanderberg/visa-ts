/**
 * Tests for DeviceSession factory.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDeviceSession } from '../../src/sessions/device-session.js';
import type { MessageBasedResource } from '../../src/resources/message-based-resource.js';
import type { ResourceInfo } from '../../src/types.js';
import { Ok, Err } from '../../src/result.js';
import type { SessionState } from '../../src/sessions/device-session.js';

function createMockResource(overrides?: Partial<MessageBasedResource>): MessageBasedResource {
  const resourceInfo: ResourceInfo = {
    resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
    interfaceType: 'USB',
  };

  return {
    resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
    resourceInfo,
    timeout: 2000,
    writeTermination: '\n',
    readTermination: '\n',
    chunkSize: 65536,
    isOpen: true,
    query: vi.fn().mockResolvedValue(Ok('response')),
    write: vi.fn().mockResolvedValue(Ok(undefined)),
    read: vi.fn().mockResolvedValue(Ok('response')),
    queryBinaryValues: vi.fn().mockResolvedValue(Ok([1, 2, 3])),
    writeBinaryValues: vi.fn().mockResolvedValue(Ok(undefined)),
    queryBinary: vi.fn().mockResolvedValue(Ok(Buffer.from([1, 2, 3]))),
    readBinary: vi.fn().mockResolvedValue(Ok(Buffer.from([1, 2, 3]))),
    queryAsciiValues: vi.fn().mockResolvedValue(Ok([1.0, 2.0, 3.0])),
    readAsciiValues: vi.fn().mockResolvedValue(Ok([1.0, 2.0, 3.0])),
    writeAsciiValues: vi.fn().mockResolvedValue(Ok(undefined)),
    writeRaw: vi.fn().mockResolvedValue(Ok(10)),
    readRaw: vi.fn().mockResolvedValue(Ok(Buffer.from([1, 2, 3]))),
    readBytes: vi.fn().mockResolvedValue(Ok(Buffer.from([1, 2, 3]))),
    clear: vi.fn().mockResolvedValue(Ok(undefined)),
    trigger: vi.fn().mockResolvedValue(Ok(undefined)),
    readStb: vi.fn().mockResolvedValue(Ok(0)),
    close: vi.fn().mockResolvedValue(Ok(undefined)),
    ...overrides,
  };
}

describe('createDeviceSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts in connected state when resource is provided', () => {
      const resource = createMockResource();
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
      });

      expect(session.state).toBe('connected');
      expect(session.resource).toBe(resource);
      expect(session.resourceString).toBe('USB0::0x1AB1::0x04CE::DS1ZA123::INSTR');
    });

    it('starts in disconnected state when no resource is provided', () => {
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
      });

      expect(session.state).toBe('disconnected');
      expect(session.resource).toBeNull();
    });

    it('has null lastError initially', () => {
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource: createMockResource(),
      });

      expect(session.lastError).toBeNull();
    });

    it('has undefined status initially', () => {
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource: createMockResource(),
      });

      expect(session.status).toBeUndefined();
    });
  });

  describe('execute', () => {
    it('executes function with connected resource', async () => {
      const resource = createMockResource();
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
      });

      const result = await session.execute(async (res) => {
        const queryResult = await res.query('*IDN?');
        return queryResult.ok ? queryResult.value : 'error';
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('response');
      }
    });

    it('returns Err when no resource is connected', async () => {
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
      });

      const result = await session.execute(async (res) => {
        return res.query('*IDN?');
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not connected');
      }
    });

    it('returns Err when function throws', async () => {
      const resource = createMockResource();
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
      });

      const result = await session.execute(async () => {
        throw new Error('Test error');
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Test error');
      }
    });

    it('respects timeout option', async () => {
      const resource = createMockResource({
        query: vi.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return Ok('response');
        }),
      });
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
      });

      const executePromise = session.execute(
        async (res) => {
          return res.query('*IDN?');
        },
        { timeout: 100 }
      );

      await vi.advanceTimersByTimeAsync(150);

      const result = await executePromise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
    });

    it('queues concurrent execute calls', async () => {
      const callOrder: number[] = [];
      const resource = createMockResource({
        query: vi.fn().mockImplementation(async (_cmd: string) => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return Ok('response');
        }),
      });
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
      });

      const promise1 = session.execute(async (res) => {
        callOrder.push(1);
        await res.query('CMD1');
        callOrder.push(2);
        return 'first';
      });

      const promise2 = session.execute(async (res) => {
        callOrder.push(3);
        await res.query('CMD2');
        callOrder.push(4);
        return 'second';
      });

      await vi.advanceTimersByTimeAsync(250);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      expect(callOrder).toEqual([1, 2, 3, 4]);
    });
  });

  describe('state transitions', () => {
    it('transitions to error state on consecutive errors', async () => {
      const resource = createMockResource({
        query: vi.fn().mockResolvedValue(Err(new Error('Device error'))),
      });
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
        maxConsecutiveErrors: 3,
      });

      for (let i = 0; i < 3; i++) {
        await session.execute(async (res) => {
          const result = await res.query('*IDN?');
          if (!result.ok) throw result.error;
          return result.value;
        });
      }

      expect(session.state).toBe('error');
      expect(session.lastError).not.toBeNull();
    });

    it('resets error count on successful operation', async () => {
      let callCount = 0;
      const resource = createMockResource({
        query: vi.fn().mockImplementation(async () => {
          callCount++;
          if (callCount < 3) {
            return Err(new Error('Device error'));
          }
          return Ok('success');
        }),
      });
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
        maxConsecutiveErrors: 5,
      });

      // Two errors
      await session.execute(async (res) => {
        const result = await res.query('*IDN?');
        if (!result.ok) throw result.error;
        return result.value;
      });
      await session.execute(async (res) => {
        const result = await res.query('*IDN?');
        if (!result.ok) throw result.error;
        return result.value;
      });

      expect(session.state).toBe('connected');

      // Success resets count
      const result = await session.execute(async (res) => {
        const queryResult = await res.query('*IDN?');
        if (!queryResult.ok) throw queryResult.error;
        return queryResult.value;
      });

      expect(result.ok).toBe(true);
      expect(session.state).toBe('connected');
    });

    it('transitions to error state on consecutive timeouts', async () => {
      const resource = createMockResource({
        query: vi.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return Ok('response');
        }),
      });
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
        maxConsecutiveErrors: 3,
      });

      // Execute 3 operations that will timeout
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          session.execute(
            async (res) => {
              return res.query('*IDN?');
            },
            { timeout: 100 }
          )
        );
      }

      // Advance time to trigger all timeouts
      await vi.advanceTimersByTimeAsync(500);

      const results = await Promise.all(promises);

      // All should have timed out
      expect(results.every((r) => !r.ok)).toBe(true);
      expect(session.state).toBe('error');
      expect(session.lastError?.message).toContain('timeout');
    });
  });

  describe('onStatus', () => {
    it('notifies subscribers of status updates', () => {
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource: createMockResource(),
      });

      const handler = vi.fn();
      session.onStatus(handler);

      session.setStatus({ voltage: 12.5 });

      expect(handler).toHaveBeenCalledWith({ voltage: 12.5 });
      expect(session.status).toEqual({ voltage: 12.5 });
    });

    it('returns unsubscribe function', () => {
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource: createMockResource(),
      });

      const handler = vi.fn();
      const unsubscribe = session.onStatus(handler);

      session.setStatus({ voltage: 12.5 });
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      session.setStatus({ voltage: 13.0 });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('supports multiple subscribers', () => {
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource: createMockResource(),
      });

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      session.onStatus(handler1);
      session.onStatus(handler2);

      session.setStatus({ voltage: 12.5 });

      expect(handler1).toHaveBeenCalledWith({ voltage: 12.5 });
      expect(handler2).toHaveBeenCalledWith({ voltage: 12.5 });
    });
  });

  describe('reconnect', () => {
    it('returns Err when no reconnect function provided', async () => {
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
      });

      const result = await session.reconnect();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('reconnect');
      }
    });

    it('calls reconnect function and updates resource on success', async () => {
      const newResource = createMockResource();
      const reconnectFn = vi.fn().mockResolvedValue(Ok(newResource));

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        onReconnect: reconnectFn,
      });

      expect(session.state).toBe('disconnected');

      const result = await session.reconnect();

      expect(result.ok).toBe(true);
      expect(session.state).toBe('connected');
      expect(session.resource).toBe(newResource);
    });

    it('updates state to error when reconnect fails', async () => {
      const reconnectFn = vi.fn().mockResolvedValue(Err(new Error('Connection failed')));

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        onReconnect: reconnectFn,
      });

      const result = await session.reconnect();

      expect(result.ok).toBe(false);
      expect(session.state).toBe('error');
      expect(session.lastError?.message).toBe('Connection failed');
    });

    it('sets state to connecting during reconnect attempt', async () => {
      let capturedState: SessionState | undefined;
      const reconnectFn = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return Ok(createMockResource());
      });

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        onReconnect: reconnectFn,
        onStateChange: (state) => {
          if (state === 'connecting') {
            capturedState = state;
          }
        },
      });

      const promise = session.reconnect();
      expect(session.state).toBe('connecting');
      capturedState = session.state;

      await vi.advanceTimersByTimeAsync(150);
      await promise;

      expect(capturedState).toBe('connecting');
      expect(session.state).toBe('connected');
    });
  });

  describe('setResource', () => {
    it('updates resource and transitions to connected state', () => {
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
      });

      expect(session.state).toBe('disconnected');

      const resource = createMockResource();
      session.setResource(resource);

      expect(session.state).toBe('connected');
      expect(session.resource).toBe(resource);
    });

    it('transitions to disconnected when setting null resource', () => {
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource: createMockResource(),
      });

      expect(session.state).toBe('connected');

      session.setResource(null);

      expect(session.state).toBe('disconnected');
      expect(session.resource).toBeNull();
    });
  });

  describe('close', () => {
    it('closes the underlying resource', async () => {
      const resource = createMockResource();
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
      });

      await session.close();

      expect(resource.close).toHaveBeenCalled();
      expect(session.state).toBe('disconnected');
      expect(session.resource).toBeNull();
    });

    it('handles close when already disconnected', async () => {
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
      });

      const result = await session.close();

      expect(result.ok).toBe(true);
      expect(session.state).toBe('disconnected');
    });

    it('returns Err when resource.close() fails', async () => {
      const resource = createMockResource({
        close: vi.fn().mockResolvedValue(Err(new Error('Close failed'))),
      });
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
      });

      const result = await session.close();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Close failed');
      }
      expect(session.state).toBe('disconnected');
      expect(session.resource).toBeNull();
    });
  });

  describe('state change callbacks', () => {
    it('calls onStateChange when state changes', () => {
      const onStateChange = vi.fn();
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        onStateChange,
      });

      const resource = createMockResource();
      session.setResource(resource);

      expect(onStateChange).toHaveBeenCalledWith('connected');
    });

    it('does not call onStateChange when state stays the same', () => {
      const onStateChange = vi.fn();
      const resource = createMockResource();
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
        onStateChange,
      });

      onStateChange.mockClear();

      session.setResource(resource);

      expect(onStateChange).not.toHaveBeenCalled();
    });
  });
});
