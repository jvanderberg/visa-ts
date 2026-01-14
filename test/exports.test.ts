/**
 * Tests for package exports - verifies all public API exports work correctly.
 *
 * These tests ensure:
 * 1. Main entry point exports all expected symbols
 * 2. Subpath exports (/sessions, /simulation) work correctly
 * 3. Type exports are available
 */

import { describe, it, expect } from 'vitest';

describe('Package exports', () => {
  describe('main entry point (visa-ts)', () => {
    it('exports Result type helpers', async () => {
      const { Ok, Err, isOk, isErr, unwrapOr, unwrapOrElse, map, mapErr } =
        await import('../src/index.js');
      expect(Ok).toBeDefined();
      expect(Err).toBeDefined();
      expect(isOk).toBeDefined();
      expect(isErr).toBeDefined();
      expect(unwrapOr).toBeDefined();
      expect(unwrapOrElse).toBeDefined();
      expect(map).toBeDefined();
      expect(mapErr).toBeDefined();
    });

    it('exports resource string functions', async () => {
      const { parseResourceString, buildResourceString, matchResourcePattern } =
        await import('../src/index.js');
      expect(parseResourceString).toBeDefined();
      expect(buildResourceString).toBeDefined();
      expect(matchResourcePattern).toBeDefined();
    });

    it('exports transport factories', async () => {
      const { createTcpipTransport, createSerialTransport, createUsbtmcTransport } =
        await import('../src/index.js');
      expect(createTcpipTransport).toBeDefined();
      expect(createSerialTransport).toBeDefined();
      expect(createUsbtmcTransport).toBeDefined();
    });

    it('exports resource and manager factories', async () => {
      const { createMessageBasedResource, createResourceManager } = await import('../src/index.js');
      expect(createMessageBasedResource).toBeDefined();
      expect(createResourceManager).toBeDefined();
    });

    it('exports SCPI utilities', async () => {
      const {
        parseScpiNumber,
        parseScpiBool,
        parseScpiEnum,
        parseDefiniteLengthBlock,
        parseArbitraryBlock,
      } = await import('../src/index.js');
      expect(parseScpiNumber).toBeDefined();
      expect(parseScpiBool).toBeDefined();
      expect(parseScpiEnum).toBeDefined();
      expect(parseDefiniteLengthBlock).toBeDefined();
      expect(parseArbitraryBlock).toBeDefined();
    });

    it('exports serial probe utility', async () => {
      const { probeSerialPort } = await import('../src/index.js');
      expect(probeSerialPort).toBeDefined();
    });

    it('exports simulation backend', async () => {
      const {
        createSimulationTransport,
        createDeviceState,
        createCommandHandler,
        simulatedPsu,
        simulatedLoad,
      } = await import('../src/index.js');
      expect(createSimulationTransport).toBeDefined();
      expect(createDeviceState).toBeDefined();
      expect(createCommandHandler).toBeDefined();
      expect(simulatedPsu).toBeDefined();
      expect(simulatedLoad).toBeDefined();
    });
  });

  describe('sessions subpath (visa-ts/sessions)', () => {
    it('exports session manager factory', async () => {
      const { createSessionManager } = await import('../src/sessions/index.js');
      expect(createSessionManager).toBeDefined();
    });

    it('exports device session factory', async () => {
      const { createDeviceSession } = await import('../src/sessions/index.js');
      expect(createDeviceSession).toBeDefined();
    });
  });

  describe('simulation subpath (visa-ts/simulation)', () => {
    it('exports device state factory', async () => {
      const { createDeviceState } = await import('../src/simulation/index.js');
      expect(createDeviceState).toBeDefined();
    });

    it('exports command handler factory', async () => {
      const { createCommandHandler } = await import('../src/simulation/index.js');
      expect(createCommandHandler).toBeDefined();
    });

    it('exports example device definitions', async () => {
      const { simulatedPsu, simulatedLoad } = await import('../src/simulation/index.js');
      expect(simulatedPsu).toBeDefined();
      expect(simulatedLoad).toBeDefined();
    });

    it('simulatedPsu has correct structure', async () => {
      const { simulatedPsu } = await import('../src/simulation/index.js');
      expect(simulatedPsu.device).toBeDefined();
      expect(simulatedPsu.device.manufacturer).toBe('VISA-TS');
      expect(simulatedPsu.device.model).toBe('SIM-PSU');
      expect(simulatedPsu.properties).toBeDefined();
      expect(simulatedPsu.properties?.voltage).toBeDefined();
      expect(simulatedPsu.properties?.current).toBeDefined();
      expect(simulatedPsu.properties?.output).toBeDefined();
    });

    it('simulatedLoad has correct structure', async () => {
      const { simulatedLoad } = await import('../src/simulation/index.js');
      expect(simulatedLoad.device).toBeDefined();
      expect(simulatedLoad.device.manufacturer).toBe('VISA-TS');
      expect(simulatedLoad.device.model).toBe('SIM-LOAD');
      expect(simulatedLoad.properties).toBeDefined();
      expect(simulatedLoad.properties?.mode).toBeDefined();
      expect(simulatedLoad.properties?.current).toBeDefined();
      expect(simulatedLoad.properties?.input).toBeDefined();
    });
  });
});
