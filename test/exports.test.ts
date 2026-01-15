/**
 * Tests for package exports - verifies all public API exports work correctly.
 *
 * These tests ensure:
 * 1. Main entry point exports all expected symbols
 * 2. Subpath exports (/sessions, /simulation) work correctly
 * 3. Exported functions are callable and work as expected
 */

import { describe, it, expect } from 'vitest';

describe('Package exports', () => {
  describe('main entry point (visa-ts)', () => {
    it('exports Result type helpers as functions', async () => {
      const { Ok, Err, isOk, isErr, unwrapOr, unwrapOrElse, map, mapErr } =
        await import('../src/index.js');

      // Verify all are functions
      expect(typeof Ok).toBe('function');
      expect(typeof Err).toBe('function');
      expect(typeof isOk).toBe('function');
      expect(typeof isErr).toBe('function');
      expect(typeof unwrapOr).toBe('function');
      expect(typeof unwrapOrElse).toBe('function');
      expect(typeof map).toBe('function');
      expect(typeof mapErr).toBe('function');

      // Functional verification
      const okResult = Ok(42);
      const errResult = Err(new Error('test'));
      expect(isOk(okResult)).toBe(true);
      expect(isErr(okResult)).toBe(false);
      expect(isOk(errResult)).toBe(false);
      expect(isErr(errResult)).toBe(true);
      expect(unwrapOr(okResult, 0)).toBe(42);
      expect(unwrapOr(errResult, 0)).toBe(0);
    });

    it('exports resource string functions', async () => {
      const { parseResourceString, buildResourceString, matchResourcePattern } =
        await import('../src/index.js');

      // Verify all are functions
      expect(typeof parseResourceString).toBe('function');
      expect(typeof buildResourceString).toBe('function');
      expect(typeof matchResourcePattern).toBe('function');

      // Functional verification
      const parsed = parseResourceString('USB0::0x1234::0x5678::SN001::INSTR');
      expect(parsed.ok).toBe(true);

      // matchResourcePattern(resourceString, pattern) - note argument order
      const pattern = matchResourcePattern('USB0::0x1234::0x5678::SN001::INSTR', 'USB?*::INSTR');
      expect(pattern).toBe(true);
    });

    it('exports transport factories as functions', async () => {
      const { createTcpipTransport, createSerialTransport, createUsbtmcTransport } =
        await import('../src/index.js');

      expect(typeof createTcpipTransport).toBe('function');
      expect(typeof createSerialTransport).toBe('function');
      expect(typeof createUsbtmcTransport).toBe('function');
    });

    it('exports resource and manager factories as functions', async () => {
      const { createMessageBasedResource, createResourceManager } = await import('../src/index.js');

      expect(typeof createMessageBasedResource).toBe('function');
      expect(typeof createResourceManager).toBe('function');

      // Functional verification - createResourceManager should return an object
      const rm = createResourceManager();
      expect(rm).toBeDefined();
      expect(typeof rm.listResources).toBe('function');
      expect(typeof rm.openResource).toBe('function');
      expect(typeof rm.close).toBe('function');
    });

    it('exports SCPI utilities as functions', async () => {
      const {
        parseScpiNumber,
        parseScpiBool,
        parseScpiEnum,
        parseDefiniteLengthBlock,
        parseArbitraryBlock,
      } = await import('../src/index.js');

      expect(typeof parseScpiNumber).toBe('function');
      expect(typeof parseScpiBool).toBe('function');
      expect(typeof parseScpiEnum).toBe('function');
      expect(typeof parseDefiniteLengthBlock).toBe('function');
      expect(typeof parseArbitraryBlock).toBe('function');

      // Functional verification
      expect(parseScpiNumber('123.45').ok).toBe(true);
      expect(parseScpiBool('ON').ok).toBe(true);
      // parseScpiEnum takes a mapping object, not an array
      expect(parseScpiEnum('HIGH', { LOW: 1, MEDIUM: 2, HIGH: 3 }).ok).toBe(true);
    });

    it('exports serial probe utility as function', async () => {
      const { probeSerialPort } = await import('../src/index.js');
      expect(typeof probeSerialPort).toBe('function');
    });

    it('exports simulation backend', async () => {
      const {
        createSimulationTransport,
        createCommandHandler,
        createSimulatedPsu,
        createSimulatedLoad,
        createSimulatedDmm,
      } = await import('../src/index.js');

      // Verify factories are functions
      expect(typeof createSimulationTransport).toBe('function');
      expect(typeof createCommandHandler).toBe('function');
      expect(typeof createSimulatedPsu).toBe('function');
      expect(typeof createSimulatedLoad).toBe('function');
      expect(typeof createSimulatedDmm).toBe('function');

      // Verify device factories return objects with expected structure
      const psu = createSimulatedPsu();
      const load = createSimulatedLoad();
      expect(psu.device).toBeDefined();
      expect(load.device).toBeDefined();
    });
  });

  describe('sessions subpath (visa-ts/sessions)', () => {
    it('exports session manager factory as function', async () => {
      const { createSessionManager } = await import('../src/sessions/index.js');
      expect(typeof createSessionManager).toBe('function');
    });

    it('exports device session factory as function', async () => {
      const { createDeviceSession } = await import('../src/sessions/index.js');
      expect(typeof createDeviceSession).toBe('function');
    });
  });

  describe('simulation subpath (visa-ts/simulation)', () => {
    it('exports command handler factory as function', async () => {
      const { createCommandHandler, createSimulatedPsu } =
        await import('../src/simulation/index.js');
      expect(typeof createCommandHandler).toBe('function');

      // Functional verification - createCommandHandler takes a SimulatedDevice
      const psu = createSimulatedPsu();
      const handler = createCommandHandler(psu);
      expect(handler).toBeDefined();
      expect(typeof handler.handleCommand).toBe('function');
    });

    it('exports device factory functions', async () => {
      const { createSimulatedPsu, createSimulatedLoad, createSimulatedDmm } =
        await import('../src/simulation/index.js');

      expect(typeof createSimulatedPsu).toBe('function');
      expect(typeof createSimulatedLoad).toBe('function');
      expect(typeof createSimulatedDmm).toBe('function');
    });

    it('createSimulatedPsu returns device with correct structure', async () => {
      const { createSimulatedPsu } = await import('../src/simulation/index.js');

      const psu = createSimulatedPsu();
      expect(psu.device).toBeDefined();
      expect(psu.device.manufacturer).toBe('VISA-TS');
      expect(psu.device.model).toBe('SIM-PSU');
      expect(psu.device.serial).toBe('PSU001');

      expect(psu.properties).toBeDefined();
      expect(psu.properties?.voltage).toBeDefined();
      expect(psu.properties?.voltage?.get()).toBe(0);
      expect(psu.properties?.current).toBeDefined();
      expect(psu.properties?.output).toBeDefined();
      expect(psu.properties?.output?.get()).toBe(false);
    });

    it('createSimulatedLoad returns device with correct structure', async () => {
      const { createSimulatedLoad } = await import('../src/simulation/index.js');

      const load = createSimulatedLoad();
      expect(load.device).toBeDefined();
      expect(load.device.manufacturer).toBe('VISA-TS');
      expect(load.device.model).toBe('SIM-LOAD');
      expect(load.device.serial).toBe('LOAD001');

      expect(load.properties).toBeDefined();
      expect(load.properties?.mode).toBeDefined();
      expect(load.properties?.mode?.get()).toBe('CC');
      expect(load.properties?.current).toBeDefined();
      expect(load.properties?.input).toBeDefined();
      expect(load.properties?.input?.get()).toBe(false);
    });
  });
});
