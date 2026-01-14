/**
 * Circuit simulation bus implementation.
 *
 * Provides pub/sub communication between simulated devices.
 *
 * @packageDocumentation
 */

import type { Bus, BusOptions, BusState, BusSubscriber, Unsubscribe } from './types.js';

/**
 * Default maximum iterations for settlement loop.
 */
const DEFAULT_MAX_ITERATIONS = 100;

/**
 * Default epsilon for floating-point comparison.
 */
const DEFAULT_EPSILON = 1e-9;

/**
 * Check if two bus states are effectively equal within epsilon.
 */
function statesEqual(a: BusState, b: BusState, epsilon: number): boolean {
  return Math.abs(a.voltage - b.voltage) < epsilon && Math.abs(a.current - b.current) < epsilon;
}

/**
 * Create a new bus for circuit simulation.
 *
 * The bus enables devices to communicate through publish/subscribe.
 * When a device publishes a state change, all subscribers are notified.
 * The bus handles settlement automatically by iterating until all
 * devices reach equilibrium or maxIterations is reached.
 *
 * @param options - Bus configuration options
 * @returns A new Bus instance
 *
 * @example
 * ```typescript
 * const bus = createBus();
 *
 * // Subscribe to state changes
 * bus.subscribe((state) => {
 *   console.log(`V=${state.voltage}, I=${state.current}`);
 * });
 *
 * // Publish state
 * bus.publish({ voltage: 12, current: 1.5 });
 * ```
 */
export function createBus(options?: BusOptions): Bus {
  const maxIterations = options?.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const epsilon = options?.epsilon ?? DEFAULT_EPSILON;

  let state: BusState = { voltage: 0, current: 0 };
  const subscribers: BusSubscriber[] = [];
  let settling = false;

  return {
    get state(): BusState {
      // Return a copy to prevent external mutation
      return { ...state };
    },

    publish(newState: BusState): void {
      // Check if state is within epsilon (no meaningful change)
      if (statesEqual(newState, state, epsilon)) {
        return;
      }

      state = newState;

      // If already in settlement loop, don't start another
      if (settling) {
        return;
      }

      settling = true;
      let iterations = 0;

      while (iterations < maxIterations) {
        iterations++;
        const prevState = state;

        // Create a snapshot of subscribers to handle add/remove during iteration
        const currentSubscribers = [...subscribers];
        for (const subscriber of currentSubscribers) {
          // Check if still subscribed (may have been removed during iteration)
          if (subscribers.includes(subscriber)) {
            subscriber(state);
          }
        }

        // If state didn't change (same reference means no publish happened), we've settled
        if (state === prevState) {
          break;
        }
      }

      settling = false;
    },

    subscribe(callback: BusSubscriber): Unsubscribe {
      subscribers.push(callback);

      return () => {
        const index = subscribers.indexOf(callback);
        if (index >= 0) {
          subscribers.splice(index, 1);
        }
      };
    },
  };
}
