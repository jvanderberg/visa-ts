import { describe, it, expect } from 'vitest';
import type { Transport, TransportState } from '../../src/transports/transport.js';

describe('Transport interface', () => {
  describe('TransportState', () => {
    it('defines all expected states', () => {
      const validStates: TransportState[] = ['closed', 'opening', 'open', 'closing', 'error'];

      validStates.forEach((state) => {
        // TypeScript compile-time check
        const testState: TransportState = state;
        expect(testState).toBe(state);
      });
    });
  });

  describe('Transport interface shape', () => {
    it('defines the expected properties and methods', () => {
      // This test verifies the interface shape by creating a mock that satisfies it
      const mockTransport: Transport = {
        state: 'closed',
        isOpen: false,
        timeout: 2000,
        writeTermination: '\n',
        readTermination: '\n',
        open: async () => ({ ok: true, value: undefined }),
        close: async () => ({ ok: true, value: undefined }),
        write: async () => ({ ok: true, value: undefined }),
        read: async () => ({ ok: true, value: 'test' }),
        query: async () => ({ ok: true, value: 'response' }),
        writeRaw: async () => ({ ok: true, value: 5 }),
        readRaw: async () => ({ ok: true, value: Buffer.from([]) }),
        readBytes: async () => ({ ok: true, value: Buffer.from([]) }),
        clear: async () => ({ ok: true, value: undefined }),
        trigger: async () => ({ ok: true, value: undefined }),
        readStb: async () => ({ ok: true, value: 0 }),
      };

      expect(mockTransport.state).toBe('closed');
      expect(mockTransport.isOpen).toBe(false);
      expect(mockTransport.timeout).toBe(2000);
      expect(mockTransport.writeTermination).toBe('\n');
      expect(mockTransport.readTermination).toBe('\n');
      expect(typeof mockTransport.open).toBe('function');
      expect(typeof mockTransport.close).toBe('function');
      expect(typeof mockTransport.write).toBe('function');
      expect(typeof mockTransport.read).toBe('function');
      expect(typeof mockTransport.query).toBe('function');
      expect(typeof mockTransport.writeRaw).toBe('function');
      expect(typeof mockTransport.readRaw).toBe('function');
      expect(typeof mockTransport.readBytes).toBe('function');
      expect(typeof mockTransport.clear).toBe('function');
      expect(typeof mockTransport.trigger).toBe('function');
      expect(typeof mockTransport.readStb).toBe('function');
    });
  });
});
