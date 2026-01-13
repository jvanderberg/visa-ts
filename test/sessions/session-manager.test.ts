/**
 * Tests for SessionManager factory.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSessionManager } from '../../src/sessions/session-manager.js';
import type { ResourceManager } from '../../src/resource-manager-types.js';
import type { MessageBasedResource } from '../../src/resources/message-based-resource.js';
import type { ResourceInfo } from '../../src/types.js';
import { Ok, Err } from '../../src/result.js';

function createMockResource(resourceString: string): MessageBasedResource {
  const resourceInfo: ResourceInfo = {
    resourceString,
    interfaceType: 'USB',
  };

  return {
    resourceString,
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
  };
}

function createMockResourceManager(
  resources: string[] = [],
  openResults: Map<string, MessageBasedResource> = new Map()
): ResourceManager {
  return {
    openResources: [],
    listResources: vi.fn().mockResolvedValue(resources),
    listResourcesInfo: vi.fn().mockResolvedValue(
      resources.map((rs) => ({
        resourceString: rs,
        interfaceType: 'USB' as const,
      }))
    ),
    openResource: vi.fn().mockImplementation(async (rs: string) => {
      const resource = openResults.get(rs);
      if (resource) {
        return Ok(resource);
      }
      return Err(new Error(`Cannot open ${rs}`));
    }),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

describe('createSessionManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts with empty sessions', () => {
      const rm = createMockResourceManager();
      const manager = createSessionManager({ resourceManager: rm });

      expect(manager.sessions.size).toBe(0);
      expect(manager.listSessions()).toEqual([]);
    });

    it('getSession returns undefined for unknown resource', () => {
      const rm = createMockResourceManager();
      const manager = createSessionManager({ resourceManager: rm });

      expect(manager.getSession('USB0::0x1AB1::0x04CE::DS1ZA123::INSTR')).toBeUndefined();
    });
  });

  describe('start and stop', () => {
    it('discovers and connects to available resources on start', async () => {
      const rs = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const resource = createMockResource(rs);
      const openResults = new Map([[rs, resource]]);
      const rm = createMockResourceManager([rs], openResults);
      const manager = createSessionManager({ resourceManager: rm });

      await manager.start();

      expect(manager.sessions.size).toBe(1);
      expect(manager.getSession(rs)).toBeDefined();
      expect(manager.getSession(rs)?.state).toBe('connected');

      await manager.stop();
    });

    it('closes all sessions on stop', async () => {
      const rs = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const resource = createMockResource(rs);
      const openResults = new Map([[rs, resource]]);
      const rm = createMockResourceManager([rs], openResults);
      const manager = createSessionManager({ resourceManager: rm });

      await manager.start();
      expect(manager.sessions.size).toBe(1);

      await manager.stop();

      expect(manager.sessions.size).toBe(0);
      expect(resource.close).toHaveBeenCalled();
    });

    it('stops scanning on stop', async () => {
      const rm = createMockResourceManager();
      const manager = createSessionManager({ resourceManager: rm, scanInterval: 1000 });

      await manager.start();
      await manager.stop();

      (rm.listResources as ReturnType<typeof vi.fn>).mockClear();

      await vi.advanceTimersByTimeAsync(5000);

      expect(rm.listResources).not.toHaveBeenCalled();
    });
  });

  describe('scanning', () => {
    it('periodically scans for new devices', async () => {
      const rm = createMockResourceManager();
      const manager = createSessionManager({ resourceManager: rm, scanInterval: 1000 });

      await manager.start();
      expect(rm.listResources).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1000);
      expect(rm.listResources).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(1000);
      expect(rm.listResources).toHaveBeenCalledTimes(3);

      await manager.stop();
    });

    it('adds session when new device appears', async () => {
      const rs = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const resource = createMockResource(rs);
      const openResults = new Map([[rs, resource]]);
      const rm = createMockResourceManager([], openResults);
      const manager = createSessionManager({ resourceManager: rm, scanInterval: 1000 });

      await manager.start();
      expect(manager.sessions.size).toBe(0);

      // Device appears on next scan
      (rm.listResources as ReturnType<typeof vi.fn>).mockResolvedValue([rs]);

      await vi.advanceTimersByTimeAsync(1000);

      expect(manager.sessions.size).toBe(1);
      expect(manager.getSession(rs)).toBeDefined();

      await manager.stop();
    });

    it('removes session when device disappears', async () => {
      const rs = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const resource = createMockResource(rs);
      const openResults = new Map([[rs, resource]]);
      const rm = createMockResourceManager([rs], openResults);
      const manager = createSessionManager({ resourceManager: rm, scanInterval: 1000 });

      await manager.start();
      expect(manager.sessions.size).toBe(1);

      // Device disappears on next scan
      (rm.listResources as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await vi.advanceTimersByTimeAsync(1000);

      expect(manager.sessions.size).toBe(0);
      expect(resource.close).toHaveBeenCalled();

      await manager.stop();
    });
  });

  describe('filtering', () => {
    it('filters resources with string pattern', async () => {
      const usbRs = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const serialRs = 'ASRL/dev/ttyUSB0::INSTR';
      const usbResource = createMockResource(usbRs);
      const serialResource = createMockResource(serialRs);
      const openResults = new Map([
        [usbRs, usbResource],
        [serialRs, serialResource],
      ]);
      const rm = createMockResourceManager([usbRs, serialRs], openResults);
      const manager = createSessionManager({
        resourceManager: rm,
        filter: 'USB?*::INSTR',
      });

      await manager.start();

      expect(manager.sessions.size).toBe(1);
      expect(manager.getSession(usbRs)).toBeDefined();
      expect(manager.getSession(serialRs)).toBeUndefined();

      await manager.stop();
    });

    it('filters resources with RegExp', async () => {
      const rigolRs = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const otherRs = 'USB0::0x0957::0x1234::MY123::INSTR';
      const rigolResource = createMockResource(rigolRs);
      const otherResource = createMockResource(otherRs);
      const openResults = new Map([
        [rigolRs, rigolResource],
        [otherRs, otherResource],
      ]);
      const rm = createMockResourceManager([rigolRs, otherRs], openResults);
      const manager = createSessionManager({
        resourceManager: rm,
        filter: /0x1AB1/,
      });

      await manager.start();

      expect(manager.sessions.size).toBe(1);
      expect(manager.getSession(rigolRs)).toBeDefined();
      expect(manager.getSession(otherRs)).toBeUndefined();

      await manager.stop();
    });

    it('filters resources with function', async () => {
      const rs1 = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const rs2 = 'USB0::0x1AB1::0x04CE::DS1ZA456::INSTR';
      const resource1 = createMockResource(rs1);
      const resource2 = createMockResource(rs2);
      const openResults = new Map([
        [rs1, resource1],
        [rs2, resource2],
      ]);
      const rm = createMockResourceManager([rs1, rs2], openResults);
      const manager = createSessionManager({
        resourceManager: rm,
        filter: (rs) => rs.includes('DS1ZA123'),
      });

      await manager.start();

      expect(manager.sessions.size).toBe(1);
      expect(manager.getSession(rs1)).toBeDefined();
      expect(manager.getSession(rs2)).toBeUndefined();

      await manager.stop();
    });

    it('filters resources with array of patterns', async () => {
      const usbRs = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const tcpRs = 'TCPIP0::192.168.1.100::5025::SOCKET';
      const serialRs = 'ASRL/dev/ttyUSB0::INSTR';
      const usbResource = createMockResource(usbRs);
      const tcpResource = createMockResource(tcpRs);
      const serialResource = createMockResource(serialRs);
      const openResults = new Map([
        [usbRs, usbResource],
        [tcpRs, tcpResource],
        [serialRs, serialResource],
      ]);
      const rm = createMockResourceManager([usbRs, tcpRs, serialRs], openResults);
      const manager = createSessionManager({
        resourceManager: rm,
        filter: ['USB?*::INSTR', 'TCPIP?*::SOCKET'],
      });

      await manager.start();

      expect(manager.sessions.size).toBe(2);
      expect(manager.getSession(usbRs)).toBeDefined();
      expect(manager.getSession(tcpRs)).toBeDefined();
      expect(manager.getSession(serialRs)).toBeUndefined();

      await manager.stop();
    });
  });

  describe('events', () => {
    it('emits session-added event when session is added', async () => {
      const rs = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const resource = createMockResource(rs);
      const openResults = new Map([[rs, resource]]);
      const rm = createMockResourceManager([rs], openResults);
      const manager = createSessionManager({ resourceManager: rm });

      const handler = vi.fn();
      manager.on('session-added', handler);

      await manager.start();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ resourceString: rs }));

      await manager.stop();
    });

    it('emits session-removed event when session is removed', async () => {
      const rs = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const resource = createMockResource(rs);
      const openResults = new Map([[rs, resource]]);
      const rm = createMockResourceManager([rs], openResults);
      const manager = createSessionManager({ resourceManager: rm, scanInterval: 1000 });

      const handler = vi.fn();
      manager.on('session-removed', handler);

      await manager.start();
      expect(handler).not.toHaveBeenCalled();

      (rm.listResources as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await vi.advanceTimersByTimeAsync(1000);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(rs);

      await manager.stop();
    });

    it('emits session-state-changed event when session state changes', async () => {
      const rs = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const resource = createMockResource(rs);
      const openResults = new Map([[rs, resource]]);
      const rm = createMockResourceManager([rs], openResults);
      const manager = createSessionManager({
        resourceManager: rm,
        scanInterval: 1000,
        maxConsecutiveErrors: 2,
      });

      const handler = vi.fn();
      manager.on('session-state-changed', handler);

      await manager.start();

      const session = manager.getSession(rs)!;

      // Force errors to trigger state change
      (resource.query as ReturnType<typeof vi.fn>).mockResolvedValue(
        Err(new Error('Device error'))
      );

      await session.execute(async (r) => {
        const result = await r.query('*IDN?');
        if (!result.ok) throw result.error;
        return result.value;
      });

      await session.execute(async (r) => {
        const result = await r.query('*IDN?');
        if (!result.ok) throw result.error;
        return result.value;
      });

      expect(handler).toHaveBeenCalled();

      await manager.stop();
    });

    it('supports off to unsubscribe from events', async () => {
      const rs = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const resource = createMockResource(rs);
      const openResults = new Map([[rs, resource]]);
      const rm = createMockResourceManager([rs], openResults);
      const manager = createSessionManager({ resourceManager: rm, scanInterval: 1000 });

      const handler = vi.fn();
      manager.on('session-removed', handler);
      manager.off('session-removed', handler);

      await manager.start();

      (rm.listResources as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await vi.advanceTimersByTimeAsync(1000);

      expect(handler).not.toHaveBeenCalled();

      await manager.stop();
    });
  });

  describe('auto-reconnect', () => {
    it('reconnects when autoReconnect is enabled and device reappears', async () => {
      const rs = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const resource1 = createMockResource(rs);
      const resource2 = createMockResource(rs);
      let callCount = 0;
      const rm: ResourceManager = {
        openResources: [],
        listResources: vi.fn().mockResolvedValue([rs]),
        listResourcesInfo: vi
          .fn()
          .mockResolvedValue([{ resourceString: rs, interfaceType: 'USB' }]),
        openResource: vi.fn().mockImplementation(async () => {
          callCount++;
          return callCount === 1 ? Ok(resource1) : Ok(resource2);
        }),
        close: vi.fn().mockResolvedValue(undefined),
      };
      const manager = createSessionManager({
        resourceManager: rm,
        scanInterval: 1000,
        autoReconnect: true,
      });

      await manager.start();
      expect(manager.getSession(rs)?.resource).toBe(resource1);

      // Device disappears
      (rm.listResources as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      await vi.advanceTimersByTimeAsync(1000);
      expect(manager.sessions.size).toBe(0);

      // Device reappears
      (rm.listResources as ReturnType<typeof vi.fn>).mockResolvedValue([rs]);
      await vi.advanceTimersByTimeAsync(1000);

      expect(manager.sessions.size).toBe(1);
      expect(manager.getSession(rs)?.resource).toBe(resource2);

      await manager.stop();
    });
  });

  describe('listSessions', () => {
    it('returns all active session resource strings', async () => {
      const rs1 = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const rs2 = 'USB0::0x1AB1::0x0E11::DL3A456::INSTR';
      const resource1 = createMockResource(rs1);
      const resource2 = createMockResource(rs2);
      const openResults = new Map([
        [rs1, resource1],
        [rs2, resource2],
      ]);
      const rm = createMockResourceManager([rs1, rs2], openResults);
      const manager = createSessionManager({ resourceManager: rm });

      await manager.start();

      const sessions = manager.listSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions).toContain(rs1);
      expect(sessions).toContain(rs2);

      await manager.stop();
    });
  });

  describe('error handling', () => {
    it('handles failed connection attempts gracefully', async () => {
      const rs = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const rm: ResourceManager = {
        openResources: [],
        listResources: vi.fn().mockResolvedValue([rs]),
        listResourcesInfo: vi
          .fn()
          .mockResolvedValue([{ resourceString: rs, interfaceType: 'USB' }]),
        openResource: vi.fn().mockResolvedValue(Err(new Error('Connection failed'))),
        close: vi.fn().mockResolvedValue(undefined),
      };
      const manager = createSessionManager({ resourceManager: rm });

      await manager.start();

      // Session should not be created if connection fails
      expect(manager.sessions.size).toBe(0);

      await manager.stop();
    });

    it('handles scan errors gracefully', async () => {
      const rm: ResourceManager = {
        openResources: [],
        listResources: vi.fn().mockRejectedValue(new Error('Scan failed')),
        listResourcesInfo: vi.fn().mockResolvedValue([]),
        openResource: vi.fn(),
        close: vi.fn().mockResolvedValue(undefined),
      };
      const manager = createSessionManager({ resourceManager: rm, scanInterval: 1000 });

      // Should not throw
      await manager.start();

      // Should continue scanning despite errors
      await vi.advanceTimersByTimeAsync(1000);
      expect(rm.listResources).toHaveBeenCalledTimes(2);

      await manager.stop();
    });
  });

  describe('disconnected session reconnection', () => {
    it('reconnects a disconnected session when device is still available', async () => {
      const rs = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const resource1 = createMockResource(rs);
      const resource2 = createMockResource(rs);
      let callCount = 0;
      const rm: ResourceManager = {
        openResources: [],
        listResources: vi.fn().mockResolvedValue([rs]),
        listResourcesInfo: vi
          .fn()
          .mockResolvedValue([{ resourceString: rs, interfaceType: 'USB' }]),
        openResource: vi.fn().mockImplementation(async () => {
          callCount++;
          return callCount === 1 ? Ok(resource1) : Ok(resource2);
        }),
        close: vi.fn().mockResolvedValue(undefined),
      };
      const manager = createSessionManager({
        resourceManager: rm,
        scanInterval: 1000,
      });

      await manager.start();
      const session = manager.getSession(rs);
      expect(session?.state).toBe('connected');
      expect(session?.resource).toBe(resource1);

      // Simulate session becoming disconnected (e.g., from timeout)
      // We need to access the internal session to trigger disconnect
      const internalSession = session as unknown as {
        setResource: (r: null) => void;
      };
      internalSession.setResource(null);

      expect(session?.state).toBe('disconnected');
      expect(session?.resource).toBeNull();

      // Next scan should reconnect with fresh resource
      await vi.advanceTimersByTimeAsync(1000);

      expect(session?.state).toBe('connected');
      expect(session?.resource).toBe(resource2);
      expect(callCount).toBe(2);

      await manager.stop();
    });

    it('emits session-state-changed when session reconnects', async () => {
      const rs = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const resource1 = createMockResource(rs);
      const resource2 = createMockResource(rs);
      let callCount = 0;
      const rm: ResourceManager = {
        openResources: [],
        listResources: vi.fn().mockResolvedValue([rs]),
        listResourcesInfo: vi
          .fn()
          .mockResolvedValue([{ resourceString: rs, interfaceType: 'USB' }]),
        openResource: vi.fn().mockImplementation(async () => {
          callCount++;
          return callCount === 1 ? Ok(resource1) : Ok(resource2);
        }),
        close: vi.fn().mockResolvedValue(undefined),
      };
      const manager = createSessionManager({
        resourceManager: rm,
        scanInterval: 1000,
      });

      const stateHandler = vi.fn();
      manager.on('session-state-changed', stateHandler);

      await manager.start();
      const session = manager.getSession(rs);

      // Simulate disconnect
      const internalSession = session as unknown as {
        setResource: (r: null) => void;
      };
      internalSession.setResource(null);

      stateHandler.mockClear();

      // Reconnect on next scan
      await vi.advanceTimersByTimeAsync(1000);

      // Should have emitted state change for reconnection
      expect(stateHandler).toHaveBeenCalled();
      expect(session?.state).toBe('connected');

      await manager.stop();
    });

    it('does not reconnect if device is no longer available', async () => {
      const rs = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const resource1 = createMockResource(rs);
      const rm: ResourceManager = {
        openResources: [],
        listResources: vi.fn().mockResolvedValue([rs]),
        listResourcesInfo: vi
          .fn()
          .mockResolvedValue([{ resourceString: rs, interfaceType: 'USB' }]),
        openResource: vi.fn().mockResolvedValue(Ok(resource1)),
        close: vi.fn().mockResolvedValue(undefined),
      };
      const manager = createSessionManager({
        resourceManager: rm,
        scanInterval: 1000,
      });

      await manager.start();
      const session = manager.getSession(rs);

      // Simulate disconnect
      const internalSession = session as unknown as {
        setResource: (r: null) => void;
      };
      internalSession.setResource(null);

      // Device disappears from scan
      (rm.listResources as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await vi.advanceTimersByTimeAsync(1000);

      // Session should be removed, not reconnected
      expect(manager.sessions.size).toBe(0);

      await manager.stop();
    });

    it('handles reconnection failure gracefully', async () => {
      const rs = 'USB0::0x1AB1::0x04CE::DS1ZA123::INSTR';
      const resource1 = createMockResource(rs);
      let callCount = 0;
      const rm: ResourceManager = {
        openResources: [],
        listResources: vi.fn().mockResolvedValue([rs]),
        listResourcesInfo: vi
          .fn()
          .mockResolvedValue([{ resourceString: rs, interfaceType: 'USB' }]),
        openResource: vi.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) return Ok(resource1);
          return Err(new Error('Reconnection failed'));
        }),
        close: vi.fn().mockResolvedValue(undefined),
      };
      const manager = createSessionManager({
        resourceManager: rm,
        scanInterval: 1000,
      });

      await manager.start();
      const session = manager.getSession(rs);

      // Simulate disconnect
      const internalSession = session as unknown as {
        setResource: (r: null) => void;
      };
      internalSession.setResource(null);

      // Reconnection attempt fails
      await vi.advanceTimersByTimeAsync(1000);

      // Session should still exist but remain disconnected
      expect(manager.getSession(rs)).toBeDefined();
      expect(session?.state).toBe('disconnected');

      await manager.stop();
    });
  });
});
