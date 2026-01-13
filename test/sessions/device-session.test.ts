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

    it('waits for reconnection when disconnected', async () => {
      const newResource = createMockResource({
        query: vi.fn().mockResolvedValue(Ok('RIGOL TECHNOLOGIES')),
      });
      const reconnectFn = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return Ok(newResource);
      });

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource: null, // Start disconnected
        onReconnect: reconnectFn,
      });

      expect(session.state).toBe('disconnected');

      // Execute while disconnected - should wait for reconnection
      const executePromise = session.execute(
        async (res) => {
          const result = await res.query('*IDN?');
          if (!result.ok) throw result.error;
          return result.value;
        },
        { timeout: 5000 }
      );

      // Reconnection happens
      await vi.advanceTimersByTimeAsync(150);

      const result = await executePromise;

      expect(reconnectFn).toHaveBeenCalled();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('RIGOL TECHNOLOGIES');
      }
    });

    it('times out if reconnection takes too long', async () => {
      const reconnectFn = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return Ok(createMockResource());
      });

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource: null,
        onReconnect: reconnectFn,
      });

      const executePromise = session.execute(async (res) => res.query('*IDN?'), { timeout: 100 });

      await vi.advanceTimersByTimeAsync(150);

      const result = await executePromise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
    });

    it('fails immediately when disconnected with no reconnect handler', async () => {
      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource: null,
        // No onReconnect
      });

      const result = await session.execute(async (res) => res.query('*IDN?'));

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not connected');
      }
    });

    it('executes queued commands after reconnection', async () => {
      const newResource = createMockResource({
        query: vi.fn().mockResolvedValue(Ok('response')),
      });
      const reconnectFn = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return Ok(newResource);
      });

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource: null,
        onReconnect: reconnectFn,
      });

      // Queue multiple commands while disconnected
      const promise1 = session.execute(async (res) => {
        await res.query('CMD1');
        return 'first';
      });
      const promise2 = session.execute(async (res) => {
        await res.query('CMD2');
        return 'second';
      });

      // Reconnection happens
      await vi.advanceTimersByTimeAsync(150);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      // Should only reconnect once, not per command
      expect(reconnectFn).toHaveBeenCalledTimes(1);
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

    it('immediately disconnects on timeout (fail-fast)', async () => {
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

      expect(session.state).toBe('connected');
      expect(session.resource).not.toBeNull();

      // Execute operation that will timeout
      const executePromise = session.execute(
        async (res) => {
          return res.query('*IDN?');
        },
        { timeout: 100 }
      );

      // Advance time to trigger timeout
      await vi.advanceTimersByTimeAsync(150);

      const result = await executePromise;

      // Should have timed out and immediately disconnected
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
      // Timeout is fatal - immediately disconnects (not error state)
      expect(session.state).toBe('disconnected');
      expect(session.resource).toBeNull();
      expect(session.lastError?.message).toContain('timeout');
    });

    it('closes resource on timeout-triggered disconnect', async () => {
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
      await executePromise;

      // Resource should have been closed
      expect(resource.close).toHaveBeenCalled();
    });

    it('subsequent execute calls fail immediately after timeout disconnect', async () => {
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

      // First call times out
      const promise1 = session.execute(async (res) => res.query('*IDN?'), { timeout: 100 });

      await vi.advanceTimersByTimeAsync(150);
      await promise1;

      expect(session.state).toBe('disconnected');

      // Second call should fail immediately (not connected)
      const result2 = await session.execute(async (res) => res.query('*IDN?'));

      expect(result2.ok).toBe(false);
      if (!result2.ok) {
        expect(result2.error.message).toContain('not connected');
      }
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

  describe('polling', () => {
    it('calls pollFn at pollInterval when connected', async () => {
      const resource = createMockResource();
      const pollFn = vi.fn().mockResolvedValue({ voltage: 12.5 });

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
        pollFn,
        pollInterval: 250,
      });

      expect(pollFn).not.toHaveBeenCalled();

      // First poll happens immediately after creation
      await vi.advanceTimersByTimeAsync(0);
      expect(pollFn).toHaveBeenCalledTimes(1);
      expect(pollFn).toHaveBeenCalledWith(resource);

      // Second poll after interval
      await vi.advanceTimersByTimeAsync(250);
      expect(pollFn).toHaveBeenCalledTimes(2);

      // Third poll
      await vi.advanceTimersByTimeAsync(250);
      expect(pollFn).toHaveBeenCalledTimes(3);

      await session.close();
    });

    it('updates status with pollFn result', async () => {
      const resource = createMockResource();
      const pollFn = vi.fn().mockResolvedValue({ voltage: 12.5, current: 1.5 });
      const statusHandler = vi.fn();

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
        pollFn,
        pollInterval: 250,
      });

      session.onStatus(statusHandler);

      await vi.advanceTimersByTimeAsync(0);

      expect(session.status).toEqual({ voltage: 12.5, current: 1.5 });
      expect(statusHandler).toHaveBeenCalledWith({ voltage: 12.5, current: 1.5 });

      await session.close();
    });

    it('transitions to polling state during poll', async () => {
      const resource = createMockResource();
      const states: SessionState[] = [];
      let resolveSlowPoll: () => void;
      const slowPollPromise = new Promise<void>((resolve) => {
        resolveSlowPoll = resolve;
      });

      const pollFn = vi.fn().mockImplementation(async () => {
        await slowPollPromise;
        return { voltage: 12.5 };
      });

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
        pollFn,
        pollInterval: 250,
        onStateChange: (state) => states.push(state),
      });

      // Trigger first poll
      await vi.advanceTimersByTimeAsync(0);

      expect(session.state).toBe('polling');

      // Complete the poll
      resolveSlowPoll!();
      await vi.advanceTimersByTimeAsync(0);

      expect(session.state).toBe('connected');
      expect(states).toContain('polling');

      await session.close();
    });

    it('does not poll when disconnected', async () => {
      const pollFn = vi.fn().mockResolvedValue({ voltage: 12.5 });

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        // No resource = disconnected
        pollFn,
        pollInterval: 250,
      });

      await vi.advanceTimersByTimeAsync(500);

      expect(pollFn).not.toHaveBeenCalled();

      await session.close();
    });

    it('stops polling when session is closed', async () => {
      const resource = createMockResource();
      const pollFn = vi.fn().mockResolvedValue({ voltage: 12.5 });

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
        pollFn,
        pollInterval: 250,
      });

      await vi.advanceTimersByTimeAsync(0);
      expect(pollFn).toHaveBeenCalledTimes(1);

      await session.close();

      await vi.advanceTimersByTimeAsync(500);
      expect(pollFn).toHaveBeenCalledTimes(1); // No more polls after close
    });

    it('stops polling when resource is set to null', async () => {
      const resource = createMockResource();
      const pollFn = vi.fn().mockResolvedValue({ voltage: 12.5 });

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
        pollFn,
        pollInterval: 250,
      });

      await vi.advanceTimersByTimeAsync(0);
      expect(pollFn).toHaveBeenCalledTimes(1);

      session.setResource(null);

      await vi.advanceTimersByTimeAsync(500);
      expect(pollFn).toHaveBeenCalledTimes(1);

      await session.close();
    });

    it('resumes polling when resource is reconnected', async () => {
      const resource1 = createMockResource();
      const resource2 = createMockResource();
      const pollFn = vi.fn().mockResolvedValue({ voltage: 12.5 });

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource: resource1,
        pollFn,
        pollInterval: 250,
      });

      await vi.advanceTimersByTimeAsync(0);
      expect(pollFn).toHaveBeenCalledTimes(1);

      // Disconnect
      session.setResource(null);
      await vi.advanceTimersByTimeAsync(500);
      expect(pollFn).toHaveBeenCalledTimes(1);

      // Reconnect
      session.setResource(resource2);
      await vi.advanceTimersByTimeAsync(0);
      expect(pollFn).toHaveBeenCalledTimes(2);
      expect(pollFn).toHaveBeenLastCalledWith(resource2);

      await session.close();
    });

    it('handles poll errors gracefully', async () => {
      const resource = createMockResource();
      let callCount = 0;
      const pollFn = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Poll failed');
        }
        return { voltage: 12.5 };
      });

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
        pollFn,
        pollInterval: 250,
        maxConsecutiveErrors: 5,
      });

      // First poll succeeds
      await vi.advanceTimersByTimeAsync(0);
      expect(session.state).toBe('connected');

      // Second poll fails
      await vi.advanceTimersByTimeAsync(250);
      expect(session.lastError?.message).toBe('Poll failed');

      // Polling continues after error
      await vi.advanceTimersByTimeAsync(250);
      expect(pollFn).toHaveBeenCalledTimes(3);

      await session.close();
    });

    it('disconnects after maxConsecutiveErrors poll failures', async () => {
      const resource = createMockResource();
      const pollFn = vi.fn().mockRejectedValue(new Error('Poll failed'));

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
        pollFn,
        pollInterval: 100,
        maxConsecutiveErrors: 3,
      });

      // Run polls until error state
      for (let i = 0; i < 3; i++) {
        await vi.advanceTimersByTimeAsync(100);
      }

      expect(session.state).toBe('error');

      await session.close();
    });

    it('waits for in-flight poll to complete on close', async () => {
      const resource = createMockResource();
      let resolveSlowPoll: () => void;
      const slowPollPromise = new Promise<void>((resolve) => {
        resolveSlowPoll = resolve;
      });

      const pollFn = vi.fn().mockImplementation(async () => {
        await slowPollPromise;
        return { voltage: 12.5 };
      });

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
        pollFn,
        pollInterval: 250,
      });

      // Start poll
      await vi.advanceTimersByTimeAsync(0);
      expect(session.state).toBe('polling');

      // Close while polling
      const closePromise = session.close();

      // Poll is still in progress
      expect(session.state).toBe('polling');

      // Complete the poll
      resolveSlowPoll!();
      await vi.advanceTimersByTimeAsync(0);

      await closePromise;
      expect(session.state).toBe('disconnected');
    });

    it('does not start polling if pollFn is not provided', async () => {
      const resource = createMockResource();

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
        pollInterval: 250,
        // No pollFn
      });

      await vi.advanceTimersByTimeAsync(500);

      // Should stay connected, not crash
      expect(session.state).toBe('connected');

      await session.close();
    });

    it('uses default pollInterval of 250ms', async () => {
      const resource = createMockResource();
      const pollFn = vi.fn().mockResolvedValue({ voltage: 12.5 });

      const session = createDeviceSession({
        resourceString: 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR',
        resource,
        pollFn,
        // No pollInterval specified
      });

      await vi.advanceTimersByTimeAsync(0);
      expect(pollFn).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(200);
      expect(pollFn).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(50); // Total 250ms
      expect(pollFn).toHaveBeenCalledTimes(2);

      await session.close();
    });
  });
});
