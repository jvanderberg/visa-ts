# Keysight Electronic Load SCPI Reference

> Keysight N3300A Mainframe with Modules, and EL34243A Bench Load

## Supported Models

### N3300A Modular System

| Module | Power | Voltage | Current | Features |
|--------|-------|---------|---------|----------|
| N3302A | 150W | 60V | 10A | Low current |
| N3303A | 250W | 60V | 10A | |
| N3304A | 300W | 60V | 60A | High current |
| N3305A | 500W | 60V | 60A | |
| N3306A | 600W | 60V | 120A | |
| N3307A | 500W | 150V | 10A | High voltage |

**N3300A Mainframe:** 6 slots, up to 3000W total

### EL34243A Bench Load

| Model | Power | Voltage | Current | Features |
|-------|-------|---------|---------|----------|
| EL34243A | 350W | 150V | 35A | Single unit |

---

## Connection Methods

| Interface | N3300A | EL34243A |
|-----------|--------|----------|
| GPIB | Standard | Standard |
| LAN | Optional | Standard |
| USB | Via adapter | Standard |
| RS-232 | Standard | N/A |

**Resource String Examples:**
```
GPIB0::5::INSTR
TCPIP0::192.168.1.100::5025::SOCKET
USB0::0x0957::0x2307::MY12345678::INSTR
```

---

## IEEE 488.2 Common Commands

```
*IDN?                → "Keysight Technologies,N3300A,MY12345678,A.02.00"
*RST                 → Reset to default state
*CLS                 → Clear status registers
*ESE <mask>          → Event status enable register
*ESE?                → Query event status enable
*ESR?                → Query event status register
*OPC                 → Operation complete
*OPC?                → Query operation complete
*SRE <mask>          → Service request enable register
*SRE?                → Query service request enable
*STB?                → Query status byte
*SAV <n>             → Save state (0-3)
*RCL <n>             → Recall state (0-3)
*TRG                 → Software trigger
*WAI                 → Wait for operations complete
*TST?                → Self-test
```

---

## Channel Selection (N3300A)

For N3300A modular system, prefix commands with channel:

```
INSTrument:SELect {CH1|CH2|CH3|CH4|CH5|CH6|<slot>}
INSTrument:SELect?
INSTrument:NSELect <1-6>                          → Select by number
INSTrument:NSELect?
INSTrument:CATalog?                               → List installed modules
```

Or use coupled commands:
```
INSTrument:COUPle[:TRIGger] {ALL|NONE|<list>}     → Couple channels
```

---

## Input Control

### Enable/Disable Load

```
INPut[:STATe] {ON|OFF|1|0}                        → Enable/disable input
INPut[:STATe]?                                    → Query input state
```

### Protection Clear

```
INPut:PROTection:CLEar                            → Clear protection trips
```

---

## Operating Mode

### Mode Selection

```
FUNCtion {CURRent|VOLTage|RESistance}             → Set mode
FUNCtion?                                          → Query mode
```

**Note:** Keysight loads typically do not have CP (Constant Power) mode via SCPI.

### Query Operating Mode

```
STATus:OPERation:CONDition?                       → Actual CC/CV status
```

Bit 10 = CV mode active, Bit 11 = CC mode active

---

## Constant Current (CC) Mode

### Current Setpoint

```
[SOURce:]CURRent[:LEVel][:IMMediate] <current>    → Set current (A)
[SOURce:]CURRent[:LEVel][:IMMediate]?             → Query current
[SOURce:]CURRent[:LEVel][:IMMediate]? MIN
[SOURce:]CURRent[:LEVel][:IMMediate]? MAX
```

### Triggered Current

```
[SOURce:]CURRent[:LEVel]:TRIGgered <current>      → Triggered level
[SOURce:]CURRent[:LEVel]:TRIGgered?
```

### Current Range

```
[SOURce:]CURRent:RANGe {<value>|MINimum|MAXimum}  → Set range
[SOURce:]CURRent:RANGe?
```

### Current Slew Rate

```
[SOURce:]CURRent:SLEW[:BOTH] <rate>               → Slew rate (A/s)
[SOURce:]CURRent:SLEW?
[SOURce:]CURRent:SLEW:MAXimum                     → Maximum slew
```

**Note:** Keysight uses A/s for slew rate.

### Current Protection (OCP)

```
[SOURce:]CURRent:PROTection[:LEVel] <current>     → OCP threshold
[SOURce:]CURRent:PROTection[:LEVel]?
[SOURce:]CURRent:PROTection:STATe {ON|OFF}        → Enable OCP
[SOURce:]CURRent:PROTection:DELay <time>          → OCP delay (s)
```

---

## Constant Voltage (CV) Mode

### Voltage Setpoint

```
[SOURce:]VOLTage[:LEVel][:IMMediate] <voltage>    → Set voltage (V)
[SOURce:]VOLTage[:LEVel][:IMMediate]?             → Query voltage
```

### Triggered Voltage

```
[SOURce:]VOLTage[:LEVel]:TRIGgered <voltage>      → Triggered level
[SOURce:]VOLTage[:LEVel]:TRIGgered?
```

### Voltage Range

```
[SOURce:]VOLTage:RANGe {<value>|MINimum|MAXimum}  → Set range
[SOURce:]VOLTage:RANGe?
```

### Voltage Protection (OVP)

```
[SOURce:]VOLTage:PROTection[:LEVel] <voltage>     → OVP threshold
[SOURce:]VOLTage:PROTection:STATe {ON|OFF}        → Enable OVP
```

### Current Limit in CV Mode

```
[SOURce:]CURRent:LIMit[:LEVel] <current>          → Current limit (A)
[SOURce:]CURRent:LIMit[:LEVel]?
```

---

## Constant Resistance (CR) Mode

### Resistance Setpoint

```
[SOURce:]RESistance[:LEVel][:IMMediate] <ohms>    → Set resistance (Ω)
[SOURce:]RESistance[:LEVel][:IMMediate]?          → Query resistance
```

### Triggered Resistance

```
[SOURce:]RESistance[:LEVel]:TRIGgered <ohms>      → Triggered level
[SOURce:]RESistance[:LEVel]:TRIGgered?
```

### Resistance Range

```
[SOURce:]RESistance:RANGe {<value>|MINimum|MAXimum}
[SOURce:]RESistance:RANGe?
```

---

## Measurements

### Immediate Measurements

```
MEASure[:SCALar]:VOLTage[:DC]?                    → Measure voltage (V)
MEASure[:SCALar]:CURRent[:DC]?                    → Measure current (A)
MEASure[:SCALar]:POWer[:DC]?                      → Measure power (W)
```

### Fetch (Last Reading)

```
FETCh[:SCALar]:VOLTage[:DC]?
FETCh[:SCALar]:CURRent[:DC]?
FETCh[:SCALar]:POWer[:DC]?
```

### Measurement Array (N3300A)

```
MEASure:ARRay:VOLTage[:DC]?                       → All channel voltages
MEASure:ARRay:CURRent[:DC]?                       → All channel currents
MEASure:ARRay:POWer[:DC]?                         → All channel powers
```

---

## Transient Mode

### Transient Configuration

```
[SOURce:]CURRent:TRANsient:MODE {CONTinuous|PULSe|TOGGle}
[SOURce:]CURRent:TRANsient:MODE?
```

### Transient Levels

```
[SOURce:]CURRent:TRANsient:ALEVel <current>       → Level A (A)
[SOURce:]CURRent:TRANsient:ALEVel?
[SOURce:]CURRent:TRANsient:BLEVel <current>       → Level B (A)
[SOURce:]CURRent:TRANsient:BLEVel?
```

### Transient Timing

```
[SOURce:]CURRent:TRANsient:AWIDth <time>          → A width (s)
[SOURce:]CURRent:TRANsient:BWIDth <time>          → B width (s)
```

### Transient Frequency (Alternative)

```
[SOURce:]CURRent:TRANsient:FREQuency <freq>       → Frequency (Hz)
[SOURce:]CURRent:TRANsient:DCYCle <percent>       → Duty cycle (%)
```

### Enable Transient

```
[SOURce:]TRANsient[:STATe] {ON|OFF}               → Enable transient
[SOURce:]TRANsient[:STATe]?
```

---

## List Mode

### List Configuration

```
LIST:COUNt <n>                                     → Repeat count (0 = infinite)
LIST:COUNt?
LIST:STEP <n>                                      → Number of steps
LIST:STEP?
```

### List Data (Array Format)

```
LIST:CURRent <val1>,<val2>,<val3>,...             → Current values (A)
LIST:CURRent?
LIST:VOLTage <val1>,<val2>,...                    → Voltage values (V)
LIST:RESistance <val1>,<val2>,...                 → Resistance values (Ω)
LIST:DWELl <t1>,<t2>,<t3>,...                     → Dwell times (s)
LIST:DWELl?
```

### List Control

```
LIST[:STATe] {ON|OFF}                             → Enable list
LIST[:STATe]?
```

---

## Trigger System

### Trigger Source

```
TRIGger[:SEQuence]:SOURce {IMMediate|EXTernal|BUS}
TRIGger[:SEQuence]:SOURce?
```

### Trigger Control

```
INITiate[:IMMediate]                              → Arm trigger system
ABORt                                              → Abort
*TRG                                               → Software trigger
TRIGger[:SEQuence][:IMMediate]                    → Immediate trigger
```

### Trigger Delay

```
TRIGger[:SEQuence]:DELay <time>                   → Trigger delay (s)
TRIGger[:SEQuence]:DELay?
```

---

## System Commands

### Error Query

```
SYSTem:ERRor[:NEXT]?                              → Get next error
SYSTem:ERRor:COUNt?                               → Error count
```

### Remote/Local

```
SYSTem:LOCal                                       → Local mode
SYSTem:REMote                                      → Remote mode
SYSTem:RWLock                                      → Remote with lockout
```

### Display

```
DISPlay[:WINDow][:STATe] {ON|OFF}                 → Display on/off
DISPlay:TEXT "<message>"                           → Display text
DISPlay:TEXT:CLEar                                 → Clear text
```

### Beeper

```
SYSTem:BEEPer[:IMMediate]                         → Beep once
SYSTem:BEEPer:STATe {ON|OFF}                      → Enable beeper
```

---

## LAN Configuration

```
SYSTem:COMMunicate:LAN:IPADdress "<address>"
SYSTem:COMMunicate:LAN:SMASk "<mask>"
SYSTem:COMMunicate:LAN:GATeway "<gateway>"
SYSTem:COMMunicate:LAN:DHCP {ON|OFF}
SYSTem:COMMunicate:LAN:MAC?
```

---

## Status System

### Status Registers

```
STATus:QUEStionable[:EVENt]?
STATus:QUEStionable:CONDition?
STATus:QUEStionable:ENABle <mask>
STATus:OPERation[:EVENt]?
STATus:OPERation:CONDition?
STATus:OPERation:ENABle <mask>
```

### Operation Status Bits

| Bit | Value | Meaning |
|-----|-------|---------|
| 5 | 32 | Waiting for trigger |
| 10 | 1024 | CV mode |
| 11 | 2048 | CC mode |

### Questionable Status Bits

| Bit | Value | Meaning |
|-----|-------|---------|
| 0 | 1 | Voltage limit |
| 1 | 2 | Current limit |
| 4 | 16 | Over temperature |
| 9 | 512 | Power limit |

---

## Programming Examples

### Basic CC Mode

```
*RST
FUNC CURR                        # CC mode
CURR 2.5                         # Set 2.5A
CURR:SLEW 1000                   # 1000 A/s slew
INP ON                           # Enable input
MEAS:VOLT?                       # Measure voltage
MEAS:POW?                        # Measure power
INP OFF                          # Disable
```

### CV Mode with Current Limit

```
*RST
FUNC VOLT                        # CV mode
VOLT 12.0                        # Set 12V
CURR:LIM 5.0                     # 5A limit
INP ON
MEAS:CURR?                       # Measure current
MEAS:POW?                        # Measure power
```

### Transient Test

```
*RST
FUNC CURR
CURR:TRAN:MODE CONT              # Continuous
CURR:TRAN:ALEV 0.5               # 0.5A
CURR:TRAN:BLEV 3.0               # 3.0A
CURR:TRAN:AWID 0.001             # 1ms
CURR:TRAN:BWID 0.001             # 1ms
TRAN ON                          # Enable transient
INP ON                           # Start
```

### List Mode

```
*RST
FUNC CURR
LIST:CURR 0.5,1.0,1.5,2.0,0.0    # Current steps
LIST:DWEL 1.0,1.0,1.0,1.0,0.5    # Dwell times
LIST:COUN 5                      # 5 repeats
LIST ON                          # Enable
INP ON                           # Start
```

### N3300A Multi-Channel

```
*RST
INST:SEL CH1                     # Select channel 1
FUNC CURR
CURR 1.0
INST:SEL CH2                     # Select channel 2
FUNC CURR
CURR 2.0
INST:COUP ALL                    # Couple all channels
INP ON                           # Enable all
MEAS:ARR:VOLT?                   # Measure all voltages
MEAS:ARR:CURR?                   # Measure all currents
```

### Triggered Operation

```
*RST
FUNC CURR
CURR 1.0                         # Initial current
CURR:TRIG 3.0                    # Triggered current
TRIG:SOUR BUS                    # Bus trigger
INP ON
INIT                             # Arm
*TRG                             # Trigger to 3.0A
```

---

## Connection Examples

### Python with pyvisa

```python
import pyvisa

rm = pyvisa.ResourceManager()
load = rm.open_resource('GPIB0::5::INSTR')

print(load.query('*IDN?'))

load.write('FUNC CURR')
load.write('CURR 2.0')
load.write('INP ON')

voltage = float(load.query('MEAS:VOLT?'))
current = float(load.query('MEAS:CURR?'))
power = float(load.query('MEAS:POW?'))

print(f"V: {voltage}V, I: {current}A, P: {power}W")

load.write('INP OFF')
load.close()
```

### TypeScript with visa-ts

```typescript
import { createResourceManager } from 'visa-ts';

async function testWithKeysightLoad() {
  const rm = createResourceManager();
  const load = await rm.open('TCPIP0::192.168.1.100::5025::SOCKET');

  await load.write('FUNC CURR');
  await load.write('CURR 2.0');
  await load.write('INP ON');

  const voltageResult = await load.query('MEAS:VOLT?');
  const currentResult = await load.query('MEAS:CURR?');
  const powerResult = await load.query('MEAS:POW?');

  if (voltageResult.ok && currentResult.ok && powerResult.ok) {
    console.log(`V: ${parseFloat(voltageResult.value)}V`);
    console.log(`I: ${parseFloat(currentResult.value)}A`);
    console.log(`P: ${parseFloat(powerResult.value)}W`);
  }

  await load.write('INP OFF');
  await load.close();
}
```

---

## Notes

1. **No CP Mode**: Keysight loads do not have constant power mode via SCPI.

2. **Modular System**: N3300A requires channel selection for multi-module operation.

3. **Slew Rate Units**: Keysight uses A/s for slew rate.

4. **Triggered Levels**: Supports triggered setpoint changes (separate from transient mode).

5. **Array Measurements**: N3300A can query all channels at once with MEASure:ARRay.

6. **Channel Coupling**: N3300A supports coupled channel operation for synchronized triggers.

7. **Memory Locations**: 4 save/recall locations (0-3).

8. **GPIB Primary**: N3300A is primarily GPIB controlled; LAN is optional.
