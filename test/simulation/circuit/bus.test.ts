/**
 * Tests for the circuit simulation bus.
 *
 * @packageDocumentation
 */

import { describe, it, expect, vi } from 'vitest';
import { createBus } from '../../../src/simulation/circuit/bus.js';

describe('createBus', () => {
  describe('initial state', () => {
    it('starts with voltage and current at zero', () => {
      const bus = createBus();
      expect(bus.state).toEqual({ voltage: 0, current: 0 });
    });

    it('returns a new state object each time state is accessed', () => {
      const bus = createBus();
      const state1 = bus.state;
      const state2 = bus.state;
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
    });
  });

  describe('publish', () => {
    it('updates the bus state', () => {
      const bus = createBus();
      bus.publish({ voltage: 12, current: 1.5 });
      expect(bus.state).toEqual({ voltage: 12, current: 1.5 });
    });

    it('overwrites previous state', () => {
      const bus = createBus();
      bus.publish({ voltage: 5, current: 0.5 });
      bus.publish({ voltage: 12, current: 2 });
      expect(bus.state).toEqual({ voltage: 12, current: 2 });
    });

    it('does not trigger subscribers when state is within epsilon', () => {
      const bus = createBus({ epsilon: 1e-9 });
      const subscriber = vi.fn();
      bus.subscribe(subscriber);

      bus.publish({ voltage: 12, current: 1 });
      expect(subscriber).toHaveBeenCalledTimes(1);

      // Publish nearly identical state
      bus.publish({ voltage: 12 + 1e-10, current: 1 + 1e-10 });
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('triggers subscribers when state changes beyond epsilon', () => {
      const bus = createBus({ epsilon: 1e-9 });
      const subscriber = vi.fn();
      bus.subscribe(subscriber);

      bus.publish({ voltage: 12, current: 1 });
      bus.publish({ voltage: 12.001, current: 1 });
      expect(subscriber).toHaveBeenCalledTimes(2);
    });
  });

  describe('subscribe', () => {
    it('calls subscriber immediately when state changes via publish', () => {
      const bus = createBus();
      const subscriber = vi.fn();
      bus.subscribe(subscriber);

      bus.publish({ voltage: 5, current: 1 });
      expect(subscriber).toHaveBeenCalledWith({ voltage: 5, current: 1 });
    });

    it('supports multiple subscribers', () => {
      const bus = createBus();
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();

      bus.subscribe(subscriber1);
      bus.subscribe(subscriber2);

      bus.publish({ voltage: 5, current: 1 });
      expect(subscriber1).toHaveBeenCalledWith({ voltage: 5, current: 1 });
      expect(subscriber2).toHaveBeenCalledWith({ voltage: 5, current: 1 });
    });

    it('returns an unsubscribe function', () => {
      const bus = createBus();
      const subscriber = vi.fn();
      const unsubscribe = bus.subscribe(subscriber);

      bus.publish({ voltage: 5, current: 1 });
      expect(subscriber).toHaveBeenCalledTimes(1);

      unsubscribe();
      bus.publish({ voltage: 10, current: 2 });
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('allows unsubscribe to be called multiple times safely', () => {
      const bus = createBus();
      const subscriber = vi.fn();
      const unsubscribe = bus.subscribe(subscriber);

      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('settlement', () => {
    it('settles when subscriber publishes back until no change', () => {
      const bus = createBus();
      let iterations = 0;

      // Subscriber that reduces current by half each iteration until < 0.1
      bus.subscribe((state) => {
        iterations++;
        if (state.current >= 0.1) {
          bus.publish({ voltage: state.voltage, current: state.current / 2 });
        }
      });

      bus.publish({ voltage: 12, current: 10 });

      // Should settle: 10 -> 5 -> 2.5 -> 1.25 -> 0.625 -> 0.3125 -> 0.15625 -> 0.078125
      // After 8 iterations, current < 0.1, no more publishes
      expect(iterations).toBe(8);
      expect(bus.state.current).toBeLessThan(0.1);
    });

    it('respects maxIterations to prevent infinite loops', () => {
      const bus = createBus({ maxIterations: 10 });
      let iterations = 0;

      // Subscriber that always changes state (would loop forever)
      bus.subscribe((state) => {
        iterations++;
        bus.publish({ voltage: state.voltage, current: state.current + 0.1 });
      });

      bus.publish({ voltage: 12, current: 0 });

      // Should stop after maxIterations
      expect(iterations).toBe(10);
    });

    it('handles multiple subscribers during settlement', () => {
      const bus = createBus();
      const order: string[] = [];

      // PSU-like behavior: sets voltage when triggered
      bus.subscribe((state) => {
        order.push(`psu: V=${state.voltage}, I=${state.current}`);
        // When we see a small trigger voltage, PSU sets its output
        if (state.voltage === 0.001 && state.current === 0) {
          bus.publish({ voltage: 12, current: 0 });
        }
      });

      // Load-like behavior: draws current when voltage present
      bus.subscribe((state) => {
        order.push(`load: V=${state.voltage}, I=${state.current}`);
        if (state.voltage === 12 && state.current === 0) {
          bus.publish({ voltage: 12, current: 1.5 });
        }
      });

      // Initial publish triggers settlement (non-zero to differ from initial state)
      bus.publish({ voltage: 0.001, current: 0 });

      expect(bus.state).toEqual({ voltage: 12, current: 1.5 });
    });

    it('converges with epsilon damping', () => {
      const bus = createBus({ epsilon: 0.01 });
      let iterations = 0;

      // Subscriber that makes tiny adjustments
      bus.subscribe((state) => {
        iterations++;
        if (Math.abs(state.current - 1.0) > 0.001) {
          const newCurrent = state.current + (1.0 - state.current) * 0.5;
          bus.publish({ voltage: state.voltage, current: newCurrent });
        }
      });

      bus.publish({ voltage: 12, current: 0 });

      // Should converge within reasonable iterations due to epsilon damping
      expect(iterations).toBeLessThan(20);
      expect(bus.state.current).toBeCloseTo(1.0, 1);
    });
  });

  describe('edge cases', () => {
    it('handles publish with zero values', () => {
      const bus = createBus();
      bus.publish({ voltage: 5, current: 1 });
      bus.publish({ voltage: 0, current: 0 });
      expect(bus.state).toEqual({ voltage: 0, current: 0 });
    });

    it('handles negative values', () => {
      const bus = createBus();
      bus.publish({ voltage: -5, current: -1 });
      expect(bus.state).toEqual({ voltage: -5, current: -1 });
    });

    it('handles very large values', () => {
      const bus = createBus();
      bus.publish({ voltage: 1e9, current: 1e6 });
      expect(bus.state).toEqual({ voltage: 1e9, current: 1e6 });
    });

    it('handles very small values above epsilon', () => {
      const bus = createBus({ epsilon: 1e-12 });
      bus.publish({ voltage: 1e-6, current: 1e-9 });
      expect(bus.state).toEqual({ voltage: 1e-6, current: 1e-9 });
    });

    it('handles subscriber that throws', () => {
      const bus = createBus();
      const goodSubscriber = vi.fn();

      bus.subscribe(() => {
        throw new Error('Subscriber error');
      });
      bus.subscribe(goodSubscriber);

      // Bus should continue operating despite error
      expect(() => bus.publish({ voltage: 5, current: 1 })).toThrow('Subscriber error');
    });

    it('handles subscribing during publish', () => {
      const bus = createBus();
      const laterSubscriber = vi.fn();

      bus.subscribe((state) => {
        if (state.voltage === 5) {
          bus.subscribe(laterSubscriber);
        }
      });

      bus.publish({ voltage: 5, current: 1 });

      // Later subscriber is added but doesn't receive the current publish
      expect(laterSubscriber).not.toHaveBeenCalled();

      // But it receives subsequent publishes
      bus.publish({ voltage: 10, current: 2 });
      expect(laterSubscriber).toHaveBeenCalledWith({ voltage: 10, current: 2 });
    });

    it('handles unsubscribing during publish', () => {
      const bus = createBus();
      const subscriber2 = vi.fn();
      // Using an object to hold the unsubscribe function allows proper typing
      const holder: { unsubscribe: () => void } = { unsubscribe: () => {} };

      bus.subscribe(() => {
        // Unsubscribe the second subscriber during the first's callback
        holder.unsubscribe();
      });
      holder.unsubscribe = bus.subscribe(subscriber2);

      bus.publish({ voltage: 5, current: 1 });

      // Subscriber2 should not be called because it was unsubscribed
      expect(subscriber2).not.toHaveBeenCalled();
    });
  });

  describe('options', () => {
    it('uses default maxIterations of 100', () => {
      const bus = createBus();
      let iterations = 0;

      bus.subscribe(() => {
        iterations++;
        // Always publish a changing value to keep iteration going
        bus.publish({ voltage: iterations, current: iterations });
      });

      // Initial publish triggers iteration (non-zero to differ from initial state)
      bus.publish({ voltage: 0.001, current: 0 });
      expect(iterations).toBe(100);
    });

    it('uses custom maxIterations', () => {
      const bus = createBus({ maxIterations: 5 });
      let iterations = 0;

      bus.subscribe(() => {
        iterations++;
        // Always publish a changing value to keep iteration going
        bus.publish({ voltage: iterations, current: iterations });
      });

      // Initial publish triggers iteration (non-zero to differ from initial state)
      bus.publish({ voltage: 0.001, current: 0 });
      expect(iterations).toBe(5);
    });

    it('uses default epsilon of 1e-9', () => {
      const bus = createBus();
      const subscriber = vi.fn();
      bus.subscribe(subscriber);

      bus.publish({ voltage: 1, current: 1 });
      expect(subscriber).toHaveBeenCalledTimes(1);

      // Change less than 1e-9 should not trigger
      bus.publish({ voltage: 1 + 1e-10, current: 1 });
      expect(subscriber).toHaveBeenCalledTimes(1);

      // Change more than 1e-9 should trigger
      bus.publish({ voltage: 1 + 1e-8, current: 1 });
      expect(subscriber).toHaveBeenCalledTimes(2);
    });

    it('uses custom epsilon', () => {
      const bus = createBus({ epsilon: 0.1 });
      const subscriber = vi.fn();
      bus.subscribe(subscriber);

      bus.publish({ voltage: 1, current: 1 });
      expect(subscriber).toHaveBeenCalledTimes(1);

      // Change less than 0.1 should not trigger
      bus.publish({ voltage: 1.05, current: 1 });
      expect(subscriber).toHaveBeenCalledTimes(1);

      // Change more than 0.1 should trigger
      bus.publish({ voltage: 1.2, current: 1 });
      expect(subscriber).toHaveBeenCalledTimes(2);
    });
  });
});
