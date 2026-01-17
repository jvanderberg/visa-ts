# Oscilloscope Driver Implementation Plan

> Plan to close the gap between current driver model and comprehensive SCPI capabilities

## Current State

- **Base interface** (`src/drivers/equipment/oscilloscope.ts`): Minimal - only covers enable, scale, offset, coupling, basic measurements, timebase, run/stop
- **Rigol implementation** (`src/drivers/implementations/rigol/scope.ts`): Extended with trigger, waveform capture, screenshot, many measurements
- **Documentation**: Comprehensive SCPI references for 5 vendors created

## Target State

A comprehensive `Oscilloscope` interface that covers common functionality across vendors, with unsupported features returning `Err("not supported")`.

---

## Vendor Feature Matrix

| Feature | Rigol DS1000Z | Siglent SDS | Keysight | Tektronix | R&S RTx |
|---------|---------------|-------------|----------|-----------|---------|
| **Channel** |
| Enable/Scale/Offset | ✓ | ✓ | ✓ | ✓ | ✓ |
| Coupling (AC/DC/GND) | ✓ | ✓ | AC/DC only | ✓ | ACLimit/DCLimit/GND |
| Probe attenuation | ✓ | ✓ | ✓ | ✓ (gain) | ✓ |
| Bandwidth limit | ✓ (20M) | ✓ (20/200M) | ✓ (25M) | ✓ (any) | ✓ (20/200M) |
| Input impedance | — | ✓ | ✓ | ✓ | ✓ |
| Invert | ✓ | ✓ | ✓ | ✓ | ✓ (polarity) |
| Label | ✓ | ✓ | ✓ | ✓ | ✓ |
| Skew/Deskew | — | ✓ | — | ✓ | ✓ |
| **Timebase** |
| Scale (s/div) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Position/Offset | ✓ | ✓ | ✓ | ✓ (% or sec) | ✓ |
| Mode (MAIN/XY/ROLL) | ✓ | ✓ | ✓ | via settings | ✓ |
| Reference position | — | ✓ | ✓ | ✓ | ✓ |
| **Acquisition** |
| Mode (Normal/Avg/Peak/HiRes) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Average count | ✓ | ✓ | ✓ | ✓ | ✓ |
| Memory depth | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sample rate (query) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Running state | ✓ | ✓ | via register | ✓ | ✓ |
| Segmented memory | — | ✓ | ✓ | — | ✓ |
| **Trigger** |
| Edge source/level/slope | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mode (Auto/Normal/Single) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Coupling | ✓ | ✓ | ✓ | ✓ | ✓ |
| Holdoff | ✓ | ✓ | ✓ | ✓ | ✓ |
| Force trigger | ✓ | ✓ | ✓ | ✓ | ✓ |
| Status query | ✓ | ✓ | via register | ✓ | ✓ |
| Pulse/Width trigger | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Measurements** |
| Frequency/Period | ✓ | ✓ | ✓ | ✓ | ✓ |
| Vpp/Vmax/Vmin/Vavg/Vrms | ✓ | ✓ | ✓ | ✓ | ✓ |
| Vtop/Vbase/Vamp | ✓ | ✓ | ✓ | ✓ | ✓ |
| Rise/Fall time | ✓ | ✓ | ✓ | ✓ | ✓ |
| Pulse width (+/-) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Duty cycle (+/-) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Overshoot/Preshoot | ✓ | ✓ | ✓ | ✓ | ✓ |
| Phase/Delay | ✓ | ✓ | — | — | — |
| Counter | ✓ | — | ✓ | — | — |
| **Data Transfer** |
| Waveform data | ✓ | ✓ | ✓ | ✓ | ✓ |
| Screenshot | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Commands** |
| Run/Stop | ✓ | ✓ | ✓ | ✓ | ✓ |
| Single | ✓ | ✓ | ✓ | ✓ | ✓ |
| Auto scale | ✓ | ✓ | — | — | — |
| **Display** |
| Persistence | ✓ | ✓ | ✓ | ✓ | ✓ |
| Grid/Graticule | ✓ | ✓ | ✓ | ✓ | — |
| **Math** |
| Basic math (+/-/×/÷) | ✓ | ✓ | ✓ | ✓ | ✓ |
| FFT | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Serial Decode** |
| I2C/SPI/UART | ✓ | ✓ | ✓ | ✓ | ✓ |
| **TCP Port** | 5555 | 5025 | 5025 | 4000 | 5025 |

---

## Gap Analysis

### Current vs Missing Features

**Base `OscilloscopeChannel` - Currently Has:**
- ✓ enable, scale, offset, coupling
- ✓ frequency, period, vpp, vmax, vmin, vavg, vrms measurements

**Base `OscilloscopeChannel` - Missing:**
- ✗ Probe attenuation
- ✗ Bandwidth limit
- ✗ Input impedance
- ✗ Invert
- ✗ Label
- ✗ Rise/fall time measurements
- ✗ Pulse width measurements
- ✗ Duty cycle measurements
- ✗ Overshoot/preshoot measurements
- ✗ Vtop/Vbase/Vamp measurements

**Base `Oscilloscope` - Currently Has:**
- ✓ channelCount, channel(n)
- ✓ timebase (scale only)
- ✓ run, stop

**Base `Oscilloscope` - Missing:**
- ✗ Timebase offset/position
- ✗ Timebase mode
- ✗ Sample rate query
- ✗ Memory depth query/set
- ✗ Acquisition mode (Normal/Average/Peak/HiRes)
- ✗ Average count
- ✗ Running state query
- ✗ Single acquisition
- ✗ Force trigger
- ✗ Trigger configuration (source, level, slope, mode, coupling, holdoff)
- ✗ Waveform capture
- ✗ Screenshot capture
- ✗ Auto scale

---

## Implementation Phases

### Phase 1: Update Base Interface Types

**File:** `src/drivers/equipment/oscilloscope.ts`

**Changes:**

1. Add constants with runtime values:
   ```typescript
   export const AcquisitionMode = {
     Normal: 'NORMAL',
     Average: 'AVERAGE',
     Peak: 'PEAK',
     HighRes: 'HIGHRES',
   } as const;

   export const TriggerSweep = {
     Auto: 'AUTO',
     Normal: 'NORMAL',
     Single: 'SINGLE',
   } as const;

   export const TimebaseMode = {
     Main: 'MAIN',
     XY: 'XY',
     Roll: 'ROLL',
     Window: 'WINDOW',
   } as const;

   export const TriggerCoupling = {
     AC: 'AC',
     DC: 'DC',
     LFReject: 'LFREJECT',
     HFReject: 'HFREJECT',
   } as const;

   export const InputImpedance = {
     OneMeg: 'ONEMEG',
     Fifty: 'FIFTY',
   } as const;
   ```

2. `WaveformData` is already well-defined - keep as is.

---

### Phase 2: Expand OscilloscopeChannel Interface

**File:** `src/drivers/equipment/oscilloscope.ts`

**Add to `OscilloscopeChannel`:**

```typescript
export interface OscilloscopeChannel {
  // Existing...
  readonly channelNumber: number;
  getEnabled(): Promise<Result<boolean, Error>>;
  setEnabled(on: boolean): Promise<Result<void, Error>>;
  getScale(): Promise<Result<number, Error>>;
  setScale(voltsPerDiv: number): Promise<Result<void, Error>>;
  getOffset(): Promise<Result<number, Error>>;
  setOffset(volts: number): Promise<Result<void, Error>>;
  getCoupling(): Promise<Result<Coupling, Error>>;
  setCoupling(coupling: Coupling): Promise<Result<void, Error>>;

  // NEW: Probe settings
  getProbeAttenuation(): Promise<Result<number, Error>>;
  setProbeAttenuation(ratio: number): Promise<Result<void, Error>>;

  // NEW: Bandwidth limit
  getBandwidthLimit(): Promise<Result<BandwidthLimit, Error>>;
  setBandwidthLimit(limit: BandwidthLimit): Promise<Result<void, Error>>;

  // NEW: Input impedance (returns notSupported on scopes without 50Ω)
  getInputImpedance(): Promise<Result<InputImpedance, Error>>;
  setInputImpedance(impedance: InputImpedance): Promise<Result<void, Error>>;

  // NEW: Invert
  getInverted(): Promise<Result<boolean, Error>>;
  setInverted(inverted: boolean): Promise<Result<void, Error>>;

  // NEW: Label
  getLabel(): Promise<Result<string, Error>>;
  setLabel(label: string): Promise<Result<void, Error>>;

  // Existing measurements...
  getMeasuredFrequency(): Promise<Result<number, Error>>;
  getMeasuredPeriod(): Promise<Result<number, Error>>;
  getMeasuredVpp(): Promise<Result<number, Error>>;
  getMeasuredVmax(): Promise<Result<number, Error>>;
  getMeasuredVmin(): Promise<Result<number, Error>>;
  getMeasuredVavg(): Promise<Result<number, Error>>;
  getMeasuredVrms(): Promise<Result<number, Error>>;

  // NEW: Additional voltage measurements
  getMeasuredVtop(): Promise<Result<number, Error>>;
  getMeasuredVbase(): Promise<Result<number, Error>>;
  getMeasuredVamp(): Promise<Result<number, Error>>;

  // NEW: Timing measurements
  getMeasuredRiseTime(): Promise<Result<number, Error>>;
  getMeasuredFallTime(): Promise<Result<number, Error>>;
  getMeasuredPositiveWidth(): Promise<Result<number, Error>>;
  getMeasuredNegativeWidth(): Promise<Result<number, Error>>;
  getMeasuredPositiveDuty(): Promise<Result<number, Error>>;
  getMeasuredNegativeDuty(): Promise<Result<number, Error>>;

  // NEW: Overshoot/preshoot (as percentage)
  getMeasuredOvershoot(): Promise<Result<number, Error>>;
  getMeasuredPreshoot(): Promise<Result<number, Error>>;
}
```

---

### Phase 3: Expand Oscilloscope Interface

**File:** `src/drivers/equipment/oscilloscope.ts`

**Add to `Oscilloscope`:**

```typescript
export interface Oscilloscope extends BaseInstrument {
  // Existing...
  readonly channelCount: number;
  channel(n: number): OscilloscopeChannel;
  getTimebase(): Promise<Result<number, Error>>;
  setTimebase(secPerDiv: number): Promise<Result<void, Error>>;
  run(): Promise<Result<void, Error>>;
  stop(): Promise<Result<void, Error>>;

  // NEW: Timebase extended
  getTimebaseOffset(): Promise<Result<number, Error>>;
  setTimebaseOffset(seconds: number): Promise<Result<void, Error>>;
  getTimebaseMode(): Promise<Result<TimebaseMode, Error>>;
  setTimebaseMode(mode: TimebaseMode): Promise<Result<void, Error>>;

  // NEW: Acquisition settings
  getSampleRate(): Promise<Result<number, Error>>;
  getMemoryDepth(): Promise<Result<number, Error>>;
  setMemoryDepth(points: number | 'AUTO'): Promise<Result<void, Error>>;
  getAcquisitionMode(): Promise<Result<AcquisitionMode, Error>>;
  setAcquisitionMode(mode: AcquisitionMode): Promise<Result<void, Error>>;
  getAverageCount(): Promise<Result<number, Error>>;
  setAverageCount(count: number): Promise<Result<void, Error>>;

  // NEW: Acquisition state
  getRunning(): Promise<Result<boolean, Error>>;
  single(): Promise<Result<void, Error>>;

  // NEW: Trigger configuration
  getTriggerSource(): Promise<Result<TriggerSource, Error>>;
  setTriggerSource(source: TriggerSource): Promise<Result<void, Error>>;
  getTriggerLevel(): Promise<Result<number, Error>>;
  setTriggerLevel(volts: number): Promise<Result<void, Error>>;
  getTriggerSlope(): Promise<Result<TriggerSlope, Error>>;
  setTriggerSlope(slope: TriggerSlope): Promise<Result<void, Error>>;
  getTriggerMode(): Promise<Result<TriggerSweep, Error>>;
  setTriggerMode(mode: TriggerSweep): Promise<Result<void, Error>>;
  getTriggerCoupling(): Promise<Result<TriggerCoupling, Error>>;
  setTriggerCoupling(coupling: TriggerCoupling): Promise<Result<void, Error>>;
  getTriggerHoldoff(): Promise<Result<number, Error>>;
  setTriggerHoldoff(seconds: number): Promise<Result<void, Error>>;
  forceTrigger(): Promise<Result<void, Error>>;

  // NEW: Waveform capture
  captureWaveform(channel: number | string): Promise<Result<WaveformData, Error>>;

  // NEW: Screenshot
  captureScreenshot(format?: 'PNG' | 'BMP'): Promise<Result<Buffer, Error>>;

  // NEW: Auto scale (returns notSupported on some scopes)
  autoScale(): Promise<Result<void, Error>>;

  // NEW: Save/recall
  saveSetup(slot: number): Promise<Result<void, Error>>;
  recallSetup(slot: number): Promise<Result<void, Error>>;
}
```

---

### Phase 4: Update Rigol Scope Driver

**File:** `src/drivers/implementations/rigol/scope.ts`

**Changes:**

1. Remove extended interface - all features now in base
2. Implement all base interface methods
3. For unsupported features (e.g., input impedance), return `notSupported()`

---

### Phase 5: Implement Siglent SDS Driver

**File:** `src/drivers/implementations/siglent/sds.ts` (new)

**Key differences from Rigol:**
- Different command syntax: `C1:TRA ON` vs `:CHAN1:DISP ON`
- Waveform query: `C1:WF? DAT2` with WAVEDESC header
- Port 5025 vs Rigol's 5555
- Supports input impedance (50Ω/1MΩ)
- Different trigger commands: `:TRIGger:RUN` vs `:RUN`

**Reference:** `docs/drivers/osc/siglent_sds_scpi_reference.md`

---

### Phase 6: Implement Keysight InfiniiVision Driver

**File:** `src/drivers/implementations/keysight/infiniivision.ts` (new)

**Key differences:**
- Standard SCPI syntax, closest to Rigol
- Uses `:DIGitize` for reliable single acquisition
- Supports HiSLIP (port 4880) for high speed
- No GND coupling (only AC/DC)
- Different measurement query format

**Reference:** `docs/drivers/osc/keysight_infiniivision_scpi_reference.md`

---

### Phase 7: Implement Tektronix MSO Driver

**File:** `src/drivers/implementations/tektronix/mso.ts` (new)

**Key differences:**
- No leading colon in commands
- Run/stop: `ACQuire:STATE RUN` vs `:RUN`
- Single: `ACQuire:STOPAfter SEQuence` + `ACQuire:STATE RUN`
- Waveform: `CURVe?` instead of `:WAVeform:DATA?`
- Probe uses GAIN (reciprocal of attenuation)
- Port 4000

**Reference:** `docs/drivers/osc/tektronix_mso_scpi_reference.md`

---

### Phase 8: Implement R&S RTx Driver (Optional)

**File:** `src/drivers/implementations/rohde-schwarz/rtx.ts` (new)

**Key differences:**
- Uses `ACLimit`/`DCLimit` instead of AC/DC for coupling
- `RUN`/`RUNSingle`/`STOP` commands
- Probe attenuation via `PROBe<n>:SETup:ATTenuation:MANual`
- Waveform via `CHANnel<n>:DATA?`

**Reference:** `docs/drivers/osc/rohde_schwarz_rtx_scpi_reference.md`

---

## Helper Updates

**File:** `src/drivers/helpers.ts`

Ensure `notSupported()` helper exists (should already from PSU/Load plans).

---

## Type Normalization

### TriggerSource
Different vendors use different channel naming:
- Rigol: `CHAN1`, `CHAN2`, `EXT`, `ACLine`
- Siglent: `C1`, `C2`, `EXT`, `LINE`
- Keysight: `CHANnel1`, `EXTernal`, `LINE`
- Tektronix: `CH1`, `AUX`, `LINE`

**Solution:** Use canonical form in interface (`CH1`, `CH2`, `EXT`, `LINE`), drivers translate.

### BandwidthLimit
Different vendors have different options:
- Rigol: OFF, 20M
- Siglent: OFF, 20M, 200M
- Keysight: OFF, 25M (ON)
- Tektronix: FULL, any frequency

**Solution:** Use string union with common values, drivers map to device-specific:
```typescript
export type BandwidthLimit = 'OFF' | '20MHZ' | '100MHZ' | '200MHZ' | 'FULL';
```

### Coupling
- Rigol/Tektronix: AC, DC, GND
- Keysight: AC, DC only
- R&S: ACLimit, DCLimit, GND

**Solution:** Keep `'AC' | 'DC' | 'GND'`, Keysight returns `notSupported()` for GND.

---

## Test Strategy

### Unit Tests
- Each driver has mock-based tests
- Test both supported and unsupported feature paths
- Verify `notSupported()` returns correct error format

### Integration Tests (optional, requires hardware)
- Real device communication
- Tagged with `@hardware` for skip in CI

### Type Tests
- Ensure interfaces compile correctly
- Verify driver implementations satisfy interface

---

## File Structure After Implementation

```
src/drivers/
├── equipment/
│   ├── oscilloscope.ts          # Updated comprehensive interface
│   └── oscilloscope.test.ts     # Interface tests
├── helpers.ts                    # notSupported, supportsFeature
├── helpers.test.ts
└── implementations/
    ├── rigol/
    │   ├── scope.ts             # Updated (implements base interface)
    │   └── scope.test.ts
    ├── siglent/
    │   ├── sds.ts               # New
    │   └── sds.test.ts
    ├── keysight/
    │   ├── infiniivision.ts     # New
    │   └── infiniivision.test.ts
    ├── tektronix/
    │   ├── mso.ts               # New
    │   └── mso.test.ts
    └── rohde-schwarz/
        ├── rtx.ts               # New (optional)
        └── rtx.test.ts
```

---

## Priority Order

1. **Phase 1-3** - Update base interface (unblocks everything else)
2. **Phase 4** - Rigol scope update (validates interface design, we have hardware)
3. **Phase 5** - Siglent SDS (validates different SCPI dialect)
4. **Phase 6** - Keysight (validates professional scope, standard SCPI)
5. **Phase 7** - Tektronix (validates unique command structure)
6. **Phase 8** - R&S (optional, lowest priority)

---

## Open Questions

1. **TriggerSource type**: Should it be a union of strings or an enum-like const? Current uses string union which is verbose. Consider:
   ```typescript
   export const TriggerSource = {
     CH1: 'CH1', CH2: 'CH2', CH3: 'CH3', CH4: 'CH4',
     EXT: 'EXT', EXT5: 'EXT5', LINE: 'LINE',
   } as const;
   ```

2. **Waveform channel parameter**: Should `captureWaveform(channel)` take a number or string? Rigol uses `'CHAN1'`, `'MATH'`. Recommend number for analog channels, keep string for math/digital.

3. **Measurement methods vs generic measure()**: Current approach has individual methods (`getMeasuredFrequency()`). Alternative:
   ```typescript
   measure(type: MeasurementType): Promise<Result<number, Error>>;
   ```
   Pro: Fewer methods. Con: Less discoverable, no per-measurement documentation.

4. **Segmented memory**: Support now or defer? Only Siglent, Keysight, and R&S have it.

5. **Math/FFT**: Include in base interface or as optional extended interface?

6. **Serial decode**: Definitely defer - model-specific and complex.

---

## Command Syntax Quick Reference

| Operation | Rigol | Siglent | Keysight | Tektronix | R&S |
|-----------|-------|---------|----------|-----------|-----|
| Run | `:RUN` | `:TRIGger:RUN` | `:RUN` | `ACQ:STATE RUN` | `RUN` |
| Stop | `:STOP` | `:TRIGger:STOP` | `:STOP` | `ACQ:STATE STOP` | `STOP` |
| Single | `:SINGle` | `:TRIGger:SINGle` | `:SINGle` | `ACQ:STOPA SEQ;ACQ:STATE RUN` | `RUNS` |
| V/div | `:CHAN1:SCAL` | `:CHAN1:SCALe` | `:CHAN1:SCALe` | `CH1:SCAle` | `CHAN1:SCALe` |
| T/div | `:TIM:SCAL` | `:TIMebase:SCALe` | `:TIM:SCALe` | `HOR:SCAle` | `TIM:SCALe` |
| Trig level | `:TRIG:EDG:LEV` | `:TRIG:EDGE:LEVel` | `:TRIG:LEV` | `TRIG:A:LEV:CH1` | `TRIG:A:LEV1` |
| Measure | `:MEAS:ITEM? FREQ,CH1` | `:MEAS:ITEM? FREQ,C1` | `:MEAS:FREQ? CHAN1` | `MEAS:MEAS1:VAL?` | `MEAS1:RES?` |
| Waveform | `:WAV:DATA?` | `:WAV:DATA?` | `:WAV:DATA?` | `CURV?` | `CHAN1:DATA?` |
| Screenshot | `:DISP:DATA? ON,OFF,PNG` | `:PRINt? PNG` | `:DISP:DATA? PNG` | `SAV:IMAG` | `HCOP:DATA?` |
