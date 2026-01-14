/**
 * Circuit simulation types for visa-ts
 *
 * Provides pub/sub bus architecture for multi-device simulation
 * where instruments can interact with realistic physics.
 *
 * @packageDocumentation
 */

/**
 * Electrical state on the bus.
 *
 * Represents the voltage and current at a single electrical node.
 */
export interface BusState {
  /** Voltage in volts */
  voltage: number;
  /** Current in amps */
  current: number;
}

/**
 * Callback function for bus state subscriptions.
 */
export type BusSubscriber = (state: BusState) => void;

/**
 * Unsubscribe function returned by subscribe.
 */
export type Unsubscribe = () => void;

/**
 * Bus for device communication.
 *
 * Devices publish their state to the bus and subscribe to receive
 * state changes from other devices. The bus handles settlement
 * automatically by iterating until all devices reach equilibrium.
 */
export interface Bus {
  /** Current bus state (read-only) */
  readonly state: BusState;

  /**
   * Publish a new state to the bus.
   * Triggers subscribers and handles settlement automatically.
   * @param state - The new bus state
   */
  publish(state: BusState): void;

  /**
   * Subscribe to bus state changes.
   * @param callback - Function called when bus state changes
   * @returns Unsubscribe function to remove the subscription
   */
  subscribe(callback: BusSubscriber): Unsubscribe;
}

/**
 * Configuration options for createBus.
 */
export interface BusOptions {
  /**
   * Maximum iterations for settlement loop.
   * Prevents infinite loops in pathological cases.
   * @default 100
   */
  maxIterations?: number;

  /**
   * Epsilon for floating-point comparison.
   * Values within epsilon are considered equal (damping for convergence).
   * @default 1e-9
   */
  epsilon?: number;
}

/**
 * Device with physics behavior that can participate on a bus.
 */
export interface BusParticipant {
  /**
   * Compute device's desired bus state given current bus state.
   * Each device implements its own physics logic.
   *
   * @param bus - Current bus state
   * @returns Device's desired bus state
   */
  physics(bus: BusState): BusState;
}
