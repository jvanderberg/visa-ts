/**
 * Tests for generic circuit equilibrium solver.
 *
 * @packageDocumentation
 */

import { describe, it, expect } from 'vitest';
import { solveCircuit, type CircuitDevice } from '../../../src/simulation/circuit/solver.js';

describe('solveCircuit', () => {
  describe('source disabled', () => {
    it('returns zero voltage and current', () => {
      const source: CircuitDevice = {
        enabled: false,
        behavior: { type: 'voltage-source', voltage: 12, currentLimit: 5 },
      };
      const load: CircuitDevice = {
        enabled: true,
        behavior: { type: 'resistance', resistance: 10 },
      };

      const result = solveCircuit(source, load);

      expect(result.voltage).toBe(0);
      expect(result.current).toBe(0);
    });
  });

  describe('load disabled', () => {
    it('returns source voltage with zero current', () => {
      const source: CircuitDevice = {
        enabled: true,
        behavior: { type: 'voltage-source', voltage: 12, currentLimit: 5 },
      };
      const load: CircuitDevice = {
        enabled: false,
        behavior: { type: 'resistance', resistance: 10 },
      };

      const result = solveCircuit(source, load);

      expect(result.voltage).toBe(12);
      expect(result.current).toBe(0);
    });
  });

  describe('resistance behavior', () => {
    it('computes I = V/R when within current limit', () => {
      const source: CircuitDevice = {
        enabled: true,
        behavior: { type: 'voltage-source', voltage: 12, currentLimit: 5 },
      };
      const load: CircuitDevice = {
        enabled: true,
        behavior: { type: 'resistance', resistance: 6 },
      };

      const result = solveCircuit(source, load);

      expect(result.voltage).toBe(12);
      expect(result.current).toBe(2); // 12V / 6Ω = 2A
    });

    it('sags voltage when current-limited: V = I_limit × R', () => {
      const source: CircuitDevice = {
        enabled: true,
        behavior: { type: 'voltage-source', voltage: 12, currentLimit: 2 },
      };
      const load: CircuitDevice = {
        enabled: true,
        behavior: { type: 'resistance', resistance: 4 },
      };

      const result = solveCircuit(source, load);

      // Would want 12V/4Ω = 3A, but limited to 2A
      // V = 2A × 4Ω = 8V
      expect(result.voltage).toBe(8);
      expect(result.current).toBe(2);
    });

    it('handles various resistance values with current limiting', () => {
      const source: CircuitDevice = {
        enabled: true,
        behavior: { type: 'voltage-source', voltage: 12, currentLimit: 2 },
      };

      // R=3Ω: would want 4A, limited to 2A, V = 2×3 = 6V
      const load3: CircuitDevice = {
        enabled: true,
        behavior: { type: 'resistance', resistance: 3 },
      };
      expect(solveCircuit(source, load3)).toEqual({ voltage: 6, current: 2 });

      // R=2Ω: would want 6A, limited to 2A, V = 2×2 = 4V
      const load2: CircuitDevice = {
        enabled: true,
        behavior: { type: 'resistance', resistance: 2 },
      };
      expect(solveCircuit(source, load2)).toEqual({ voltage: 4, current: 2 });

      // R=1Ω: would want 12A, limited to 2A, V = 2×1 = 2V
      const load1: CircuitDevice = {
        enabled: true,
        behavior: { type: 'resistance', resistance: 1 },
      };
      expect(solveCircuit(source, load1)).toEqual({ voltage: 2, current: 2 });
    });

    it('handles zero resistance', () => {
      const source: CircuitDevice = {
        enabled: true,
        behavior: { type: 'voltage-source', voltage: 12, currentLimit: 5 },
      };
      const load: CircuitDevice = {
        enabled: true,
        behavior: { type: 'resistance', resistance: 0 },
      };

      const result = solveCircuit(source, load);

      expect(result.voltage).toBe(0);
      expect(result.current).toBe(0);
    });
  });

  describe('current-sink behavior', () => {
    it('draws requested current when within limit', () => {
      const source: CircuitDevice = {
        enabled: true,
        behavior: { type: 'voltage-source', voltage: 12, currentLimit: 5 },
      };
      const load: CircuitDevice = {
        enabled: true,
        behavior: { type: 'current-sink', current: 2 },
      };

      const result = solveCircuit(source, load);

      expect(result.voltage).toBe(12);
      expect(result.current).toBe(2);
    });

    it('collapses voltage when current-limited', () => {
      const source: CircuitDevice = {
        enabled: true,
        behavior: { type: 'voltage-source', voltage: 12, currentLimit: 2 },
      };
      const load: CircuitDevice = {
        enabled: true,
        behavior: { type: 'current-sink', current: 5 },
      };

      const result = solveCircuit(source, load);

      // Current sink goes to min resistance, V = I × R_min = 2 × 0.001 = 0.002V
      expect(result.voltage).toBeCloseTo(0.002, 5);
      expect(result.current).toBe(2);
    });

    it('draws exactly the limit when demand equals limit', () => {
      const source: CircuitDevice = {
        enabled: true,
        behavior: { type: 'voltage-source', voltage: 12, currentLimit: 2 },
      };
      const load: CircuitDevice = {
        enabled: true,
        behavior: { type: 'current-sink', current: 2 },
      };

      const result = solveCircuit(source, load);

      expect(result.voltage).toBe(12);
      expect(result.current).toBe(2);
    });
  });

  describe('power-sink behavior', () => {
    it('draws I = P/V when within limit', () => {
      const source: CircuitDevice = {
        enabled: true,
        behavior: { type: 'voltage-source', voltage: 12, currentLimit: 5 },
      };
      const load: CircuitDevice = {
        enabled: true,
        behavior: { type: 'power-sink', power: 24 },
      };

      const result = solveCircuit(source, load);

      expect(result.voltage).toBe(12);
      expect(result.current).toBe(2); // 24W / 12V = 2A
    });

    it('reduces power when current-limited', () => {
      const source: CircuitDevice = {
        enabled: true,
        behavior: { type: 'voltage-source', voltage: 12, currentLimit: 2 },
      };
      const load: CircuitDevice = {
        enabled: true,
        behavior: { type: 'power-sink', power: 60 },
      };

      const result = solveCircuit(source, load);

      // Would want 60W/12V = 5A, limited to 2A
      // Actual power = 12V × 2A = 24W
      expect(result.voltage).toBe(12);
      expect(result.current).toBe(2);
    });

    it('handles zero power', () => {
      const source: CircuitDevice = {
        enabled: true,
        behavior: { type: 'voltage-source', voltage: 12, currentLimit: 5 },
      };
      const load: CircuitDevice = {
        enabled: true,
        behavior: { type: 'power-sink', power: 0 },
      };

      const result = solveCircuit(source, load);

      expect(result.voltage).toBe(12);
      expect(result.current).toBe(0);
    });
  });

  describe('open behavior', () => {
    it('returns source voltage with zero current', () => {
      const source: CircuitDevice = {
        enabled: true,
        behavior: { type: 'voltage-source', voltage: 12, currentLimit: 5 },
      };
      const load: CircuitDevice = {
        enabled: true,
        behavior: { type: 'open' },
      };

      const result = solveCircuit(source, load);

      expect(result.voltage).toBe(12);
      expect(result.current).toBe(0);
    });
  });

  describe('comprehensive test matrix', () => {
    const testCases = [
      // Resistance - not limited
      {
        sourceV: 12,
        sourceI: 5,
        loadType: 'resistance' as const,
        r: 24,
        expectedV: 12,
        expectedI: 0.5,
      },
      {
        sourceV: 12,
        sourceI: 5,
        loadType: 'resistance' as const,
        r: 12,
        expectedV: 12,
        expectedI: 1,
      },
      {
        sourceV: 12,
        sourceI: 5,
        loadType: 'resistance' as const,
        r: 6,
        expectedV: 12,
        expectedI: 2,
      },
      // Resistance - limited
      {
        sourceV: 12,
        sourceI: 2,
        loadType: 'resistance' as const,
        r: 4,
        expectedV: 8,
        expectedI: 2,
      },
      {
        sourceV: 12,
        sourceI: 2,
        loadType: 'resistance' as const,
        r: 3,
        expectedV: 6,
        expectedI: 2,
      },
      {
        sourceV: 12,
        sourceI: 2,
        loadType: 'resistance' as const,
        r: 2,
        expectedV: 4,
        expectedI: 2,
      },
      {
        sourceV: 12,
        sourceI: 2,
        loadType: 'resistance' as const,
        r: 1,
        expectedV: 2,
        expectedI: 2,
      },
      // Current sink - not limited
      {
        sourceV: 12,
        sourceI: 5,
        loadType: 'current-sink' as const,
        loadI: 1,
        expectedV: 12,
        expectedI: 1,
      },
      {
        sourceV: 12,
        sourceI: 5,
        loadType: 'current-sink' as const,
        loadI: 2,
        expectedV: 12,
        expectedI: 2,
      },
      // Current sink - limited (voltage collapses)
      {
        sourceV: 12,
        sourceI: 2,
        loadType: 'current-sink' as const,
        loadI: 5,
        expectedV: 0.002,
        expectedI: 2,
      },
      // Power sink - not limited
      {
        sourceV: 12,
        sourceI: 5,
        loadType: 'power-sink' as const,
        p: 12,
        expectedV: 12,
        expectedI: 1,
      },
      {
        sourceV: 12,
        sourceI: 5,
        loadType: 'power-sink' as const,
        p: 24,
        expectedV: 12,
        expectedI: 2,
      },
      // Power sink - limited
      {
        sourceV: 12,
        sourceI: 2,
        loadType: 'power-sink' as const,
        p: 60,
        expectedV: 12,
        expectedI: 2,
      },
    ];

    for (const tc of testCases) {
      const desc =
        tc.loadType === 'resistance'
          ? `resistance R=${tc.r}Ω: ${tc.sourceV}V/${tc.sourceI}A → ${tc.expectedV}V, ${tc.expectedI}A`
          : tc.loadType === 'current-sink'
            ? `current-sink I=${tc.loadI}A: ${tc.sourceV}V/${tc.sourceI}A → ${tc.expectedV}V, ${tc.expectedI}A`
            : `power-sink P=${tc.p}W: ${tc.sourceV}V/${tc.sourceI}A → ${tc.expectedV}V, ${tc.expectedI}A`;

      it(desc, () => {
        const source: CircuitDevice = {
          enabled: true,
          behavior: { type: 'voltage-source', voltage: tc.sourceV, currentLimit: tc.sourceI },
        };

        let behavior;
        if (tc.loadType === 'resistance') {
          behavior = { type: 'resistance' as const, resistance: tc.r! };
        } else if (tc.loadType === 'current-sink') {
          behavior = { type: 'current-sink' as const, current: tc.loadI! };
        } else {
          behavior = { type: 'power-sink' as const, power: tc.p! };
        }

        const load: CircuitDevice = { enabled: true, behavior };

        const result = solveCircuit(source, load);

        expect(result.voltage).toBeCloseTo(tc.expectedV, 3);
        expect(result.current).toBeCloseTo(tc.expectedI, 3);
      });
    }
  });
});
