# Power Supply Interface Proposal

> Comprehensive interface design based on SCPI capabilities across vendors

## Design Philosophy

The base interface should cover **most common functionality** across vendors. Devices that don't support a feature return `Err("Feature not supported")` rather than omitting the method. This allows:

1. Consistent API across all PSU drivers
2. Runtime feature discovery via error handling
3. No need for multiple extended interfaces for common features
4. Device-specific extensions only for truly unique capabilities

---

## Vendor Feature Matrix

| Feature | Rigol DP800 | Siglent SPD | Keysight E36xx | R&S HMP | BK 9100 | ITECH | Chroma |
|---------|-------------|-------------|----------------|---------|---------|-------|--------|
| Output enable | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| V/I setpoints | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| V/I/P measure | ✅ | ✅ | V/I only | ✅ | ✅ | ✅ | ✅ |
| CV/CC query | ✅ | ✅ (status bits) | ✅ (status bits) | ✅ | ✅ | ✅ | ✅ |
| OVP level | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| OVP enable | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | always on |
| OVP tripped | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| OVP clear | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| OCP level | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| OCP enable | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | always on |
| Slew rate | ❌ | ❌ | ✅ | ✅ (ramp) | ❌ | ✅ | ✅ |
| Save/Recall | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| All on/off | ❌ (loop) | ❌ (loop) | ✅ | ✅ | ❌ | ✅ | ✅ |
| Tracking mode | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sequence/List | ✅ (timer) | ✅ (timer) | ✅ (list) | ✅ (arb) | ✅ | ✅ | ✅ |
| 4-wire sense | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |

---

## Proposed Interface

```typescript
import type { Result } from '../../result.js';
import type { BaseInstrument } from './base.js';

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────

/**
 * Output regulation mode.
 */
export const RegulationMode = {
  /** Constant Voltage - output is voltage-regulated */
  CV: 'CV',
  /** Constant Current - output is current-limited */
  CC: 'CC',
  /** Unregulated - transitional state, neither CV nor CC */
  Unregulated: 'UR',
} as const;

export type RegulationMode = (typeof RegulationMode)[keyof typeof RegulationMode];

/**
 * Channel tracking/combination mode.
 */
export const TrackingMode = {
  /** Channels operate independently */
  Independent: 'INDEPENDENT',
  /** Channels combine in series (voltages add) */
  Series: 'SERIES',
  /** Channels combine in parallel (currents add) */
  Parallel: 'PARALLEL',
} as const;

export type TrackingMode = (typeof TrackingMode)[keyof typeof TrackingMode];

/**
 * Remote sensing mode.
 */
export const SenseMode = {
  /** Use internal sense (2-wire) */
  Internal: 'INTERNAL',
  /** Use remote sense terminals (4-wire) */
  External: 'EXTERNAL',
} as const;

export type SenseMode = (typeof SenseMode)[keyof typeof SenseMode];

// ─────────────────────────────────────────────────────────────────
// Sequence Types
// ─────────────────────────────────────────────────────────────────

/**
 * Sequence step definition.
 */
export interface SequenceStep {
  /** Voltage setpoint in V */
  voltage: number;
  /** Current limit in A */
  current: number;
  /** Duration in seconds */
  durationSeconds: number;
}

/**
 * Sequence execution options.
 */
export interface SequenceOptions {
  /** Number of times to repeat (0 = infinite) */
  repeatCount?: number;
  /** Trigger source */
  triggerSource?: 'IMMEDIATE' | 'BUS' | 'EXTERNAL' | 'MANUAL';
}

// ─────────────────────────────────────────────────────────────────
// Power Supply Channel
// ─────────────────────────────────────────────────────────────────

/**
 * Power supply channel interface.
 *
 * All methods are present on all channels. Unsupported features
 * return `Err("Feature not supported")`.
 */
export interface PowerSupplyChannel {
  /** Channel number (1-based) */
  readonly channelNumber: number;

  // ─────────────────────────────────────────────────────────────
  // Output Control
  // ─────────────────────────────────────────────────────────────

  /** Get output enabled state */
  getOutputEnabled(): Promise<Result<boolean, Error>>;

  /** Set output enabled state */
  setOutputEnabled(enabled: boolean): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Setpoints
  // ─────────────────────────────────────────────────────────────

  /** Get voltage setpoint in V */
  getVoltage(): Promise<Result<number, Error>>;

  /** Set voltage setpoint in V */
  setVoltage(volts: number): Promise<Result<void, Error>>;

  /** Get current limit in A */
  getCurrent(): Promise<Result<number, Error>>;

  /** Set current limit in A */
  setCurrent(amps: number): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Measurements
  // ─────────────────────────────────────────────────────────────

  /** Measure actual output voltage in V */
  getMeasuredVoltage(): Promise<Result<number, Error>>;

  /** Measure actual output current in A */
  getMeasuredCurrent(): Promise<Result<number, Error>>;

  /**
   * Measure actual output power in W.
   *
   * Some PSUs calculate V×I internally; others require driver to compute.
   * Returns Err if not supported.
   */
  getMeasuredPower(): Promise<Result<number, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Status
  // ─────────────────────────────────────────────────────────────

  /**
   * Get current regulation mode.
   *
   * CV = voltage regulated (current below limit)
   * CC = current limited (voltage below setpoint)
   * UR = unregulated (transitional)
   */
  getRegulationMode(): Promise<Result<RegulationMode, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Over-Voltage Protection (OVP)
  // ─────────────────────────────────────────────────────────────

  /** Get OVP threshold in V. Returns Err if not supported. */
  getOvpLevel(): Promise<Result<number, Error>>;

  /** Set OVP threshold in V. Returns Err if not supported. */
  setOvpLevel(volts: number): Promise<Result<void, Error>>;

  /** Get OVP enabled state. Returns Err if not supported. */
  getOvpEnabled(): Promise<Result<boolean, Error>>;

  /** Set OVP enabled state. Returns Err if not supported (or always-on). */
  setOvpEnabled(enabled: boolean): Promise<Result<void, Error>>;

  /** Check if OVP has tripped. Returns Err if not supported. */
  isOvpTripped(): Promise<Result<boolean, Error>>;

  /** Clear OVP trip condition. Returns Err if not supported. */
  clearOvp(): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Over-Current Protection (OCP)
  // ─────────────────────────────────────────────────────────────

  /** Get OCP threshold in A. Returns Err if not supported. */
  getOcpLevel(): Promise<Result<number, Error>>;

  /** Set OCP threshold in A. Returns Err if not supported. */
  setOcpLevel(amps: number): Promise<Result<void, Error>>;

  /** Get OCP enabled state. Returns Err if not supported. */
  getOcpEnabled(): Promise<Result<boolean, Error>>;

  /** Set OCP enabled state. Returns Err if not supported (or always-on). */
  setOcpEnabled(enabled: boolean): Promise<Result<void, Error>>;

  /** Check if OCP has tripped. Returns Err if not supported. */
  isOcpTripped(): Promise<Result<boolean, Error>>;

  /** Clear OCP trip condition. Returns Err if not supported. */
  clearOcp(): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Slew Rate
  // ─────────────────────────────────────────────────────────────

  /**
   * Get voltage slew rate in V/s.
   * Returns Err if not supported (most entry-level PSUs).
   */
  getVoltageSlewRate(): Promise<Result<number, Error>>;

  /**
   * Set voltage slew rate in V/s.
   * Returns Err if not supported.
   */
  setVoltageSlewRate(voltsPerSecond: number): Promise<Result<void, Error>>;

  /**
   * Get current slew rate in A/s.
   * Returns Err if not supported.
   */
  getCurrentSlewRate(): Promise<Result<number, Error>>;

  /**
   * Set current slew rate in A/s.
   * Returns Err if not supported.
   */
  setCurrentSlewRate(ampsPerSecond: number): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Remote Sensing (4-wire)
  // ─────────────────────────────────────────────────────────────

  /**
   * Get sense mode (internal/external).
   * Returns Err if not supported (no sense terminals).
   */
  getSenseMode(): Promise<Result<SenseMode, Error>>;

  /**
   * Set sense mode (internal/external).
   * Returns Err if not supported.
   */
  setSenseMode(mode: SenseMode): Promise<Result<void, Error>>;
}

// ─────────────────────────────────────────────────────────────────
// Power Supply
// ─────────────────────────────────────────────────────────────────

/**
 * Power supply instrument interface.
 *
 * All methods are present on all power supplies. Unsupported features
 * return `Err("Feature not supported")`.
 */
export interface PowerSupply extends BaseInstrument {
  /** Number of output channels */
  readonly channelCount: number;

  /**
   * Access a specific channel (1-indexed).
   * Throws RangeError if channel out of bounds.
   */
  channel(n: number): PowerSupplyChannel;

  // ─────────────────────────────────────────────────────────────
  // Global Output Control
  // ─────────────────────────────────────────────────────────────

  /**
   * Enable all outputs simultaneously.
   *
   * Uses master output command if available, otherwise enables each channel.
   */
  enableAllOutputs(): Promise<Result<void, Error>>;

  /**
   * Disable all outputs simultaneously.
   *
   * Uses master output command if available, otherwise disables each channel.
   */
  disableAllOutputs(): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Tracking/Combination Mode
  // ─────────────────────────────────────────────────────────────

  /**
   * Get channel tracking mode.
   * Returns Err if not supported (single-channel or no tracking feature).
   */
  getTrackingMode(): Promise<Result<TrackingMode, Error>>;

  /**
   * Set channel tracking mode.
   *
   * - INDEPENDENT: Each channel operates separately
   * - SERIES: CH1 + CH2 voltages add (doubled voltage range)
   * - PARALLEL: CH1 + CH2 currents add (doubled current range)
   *
   * Returns Err if not supported.
   */
  setTrackingMode(mode: TrackingMode): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // State Save/Recall
  // ─────────────────────────────────────────────────────────────

  /**
   * Save current state to memory slot.
   *
   * @param slot - Memory slot number (typically 1-10, varies by model)
   */
  saveState(slot: number): Promise<Result<void, Error>>;

  /**
   * Recall state from memory slot.
   *
   * @param slot - Memory slot number
   */
  recallState(slot: number): Promise<Result<void, Error>>;

  // ─────────────────────────────────────────────────────────────
  // Sequence/List Mode
  // ─────────────────────────────────────────────────────────────

  /**
   * Load a sequence of voltage/current steps.
   *
   * Different vendors call this "Timer", "List", "Sequence", or "Arbitrary".
   * The driver abstracts the differences.
   *
   * @param channel - Channel number to program
   * @param steps - Array of sequence steps
   * @param options - Execution options
   *
   * Returns Err if sequence mode not supported.
   */
  loadSequence(
    channel: number,
    steps: SequenceStep[],
    options?: SequenceOptions
  ): Promise<Result<void, Error>>;

  /**
   * Start sequence execution on a channel.
   * Returns Err if sequence mode not supported.
   */
  startSequence(channel: number): Promise<Result<void, Error>>;

  /**
   * Stop sequence execution and return to fixed mode.
   * Returns Err if sequence mode not supported.
   */
  stopSequence(channel: number): Promise<Result<void, Error>>;

  /**
   * Check if sequence is currently running.
   * Returns Err if sequence mode not supported.
   */
  isSequenceRunning(channel: number): Promise<Result<boolean, Error>>;
}
```

---

## Error Handling Pattern

For unsupported features, drivers should return a consistent error:

```typescript
import { Err } from '../../../result.js';

// Standard "not supported" error
function notSupported(feature: string): Result<never, Error> {
  return Err(new Error(`${feature} not supported on this device`));
}

// Usage in a driver that doesn't support OVP
class SiglentSPDChannel implements PowerSupplyChannel {
  async getOvpLevel(): Promise<Result<number, Error>> {
    return notSupported('OVP');
  }

  async setOvpLevel(volts: number): Promise<Result<void, Error>> {
    return notSupported('OVP');
  }

  // ... etc
}
```

Users can then handle this gracefully:

```typescript
const ovpResult = await psu.channel(1).getOvpLevel();
if (!ovpResult.ok) {
  if (ovpResult.error.message.includes('not supported')) {
    console.log('OVP not available on this PSU');
  } else {
    console.error('Communication error:', ovpResult.error);
  }
}
```

---

## Feature Detection Helper

Optional utility for checking capabilities:

```typescript
/**
 * Check if a PSU supports a feature by testing if it returns "not supported".
 */
async function supportsFeature(
  fn: () => Promise<Result<unknown, Error>>
): Promise<boolean> {
  const result = await fn();
  if (result.ok) return true;
  return !result.error.message.includes('not supported');
}

// Usage
const hasOvp = await supportsFeature(() => psu.channel(1).getOvpLevel());
const hasSlew = await supportsFeature(() => psu.channel(1).getVoltageSlewRate());
const hasTracking = await supportsFeature(() => psu.getTrackingMode());
```

---

## Migration Path

1. **Phase 1**: Update `PowerSupplyChannel` and `PowerSupply` interfaces
2. **Phase 2**: Update `DP832` driver to implement new interface (mostly done already)
3. **Phase 3**: Add helper functions (`notSupported`, `supportsFeature`)
4. **Phase 4**: Implement drivers for other vendors, returning `notSupported` where needed

---

## Comparison: Before vs After

### Before (minimal base)
```typescript
interface PowerSupplyChannel {
  getVoltage(): Promise<Result<number, Error>>;
  setVoltage(volts: number): Promise<Result<void, Error>>;
  getCurrent(): Promise<Result<number, Error>>;
  setCurrent(amps: number): Promise<Result<void, Error>>;
  getOutputEnabled(): Promise<Result<boolean, Error>>;
  setOutputEnabled(on: boolean): Promise<Result<void, Error>>;
  getMeasuredVoltage(): Promise<Result<number, Error>>;
  getMeasuredCurrent(): Promise<Result<number, Error>>;
  getMeasuredPower?(): Promise<Result<number, Error>>; // optional
}
```
**Problem**: OVP, OCP, regulation mode, slew rate all require device-specific interfaces.

### After (comprehensive base)
```typescript
interface PowerSupplyChannel {
  // ... all the same basic methods, plus:
  getRegulationMode(): Promise<Result<RegulationMode, Error>>;
  getOvpLevel(): Promise<Result<number, Error>>;
  setOvpLevel(volts: number): Promise<Result<void, Error>>;
  // ... full OVP/OCP/slew/sense support
}
```
**Benefit**: Consistent API. User code doesn't need to check which interface variant they have.

---

## Device-Specific Extensions

The base interface is comprehensive, but truly unique features still extend it:

```typescript
// Rigol-specific: analyzer/data logging
interface RigolDP832 extends PowerSupply {
  startAnalyzer(): Promise<Result<void, Error>>;
  stopAnalyzer(): Promise<Result<void, Error>>;
  getAnalyzerMaxCurrent(): Promise<Result<number, Error>>;
  getAnalyzerAveragePower(): Promise<Result<number, Error>>;
}

// ITECH-specific: battery simulation
interface ITechIT6000 extends PowerSupply {
  setBatteryType(type: 'LEAD' | 'NI' | 'LITH'): Promise<Result<void, Error>>;
  setBatteryCapacity(ah: number): Promise<Result<void, Error>>;
  setInternalResistance(ohms: number): Promise<Result<void, Error>>;
}

// Chroma-specific: constant power mode
interface Chroma62000P extends PowerSupply {
  setConstantPower(watts: number): Promise<Result<void, Error>>;
  getConstantPower(): Promise<Result<number, Error>>;
}
```

These are genuinely unique features that don't make sense in the base interface.
