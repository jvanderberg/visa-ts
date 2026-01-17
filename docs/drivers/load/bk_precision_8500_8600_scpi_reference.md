# BK Precision Electronic Load SCPI Reference

> BK Precision 8500 and 8600 Series

## Supported Models

### 8500 Series (Entry Level)

| Model | Power | Voltage | Current | Features |
|-------|-------|---------|---------|----------|
| 8500 | 150W | 120V | 30A | Basic |
| 8502 | 300W | 120V | 30A | |
| 8510 | 120W | 120V | 15A | |
| 8512 | 600W | 120V | 30A | |
| 8514 | 1200W | 120V | 240A | |
| 8518 | 1200W | 60V | 240A | |
| 8520 | 2400W | 120V | 240A | |
| 8522 | 2400W | 60V | 240A | |
| 8524 | 5000W | 120V | 500A | |
| 8526 | 5000W | 60V | 500A | |

### 8600 Series (High Performance)

| Model | Power | Voltage | Current | Features |
|-------|-------|---------|---------|----------|
| 8600 | 150W | 120V | 30A | High slew rate |
| 8601 | 200W | 120V | 40A | |
| 8602 | 200W | 500V | 15A | High voltage |
| 8610 | 750W | 120V | 150A | |
| 8612 | 750W | 500V | 30A | High voltage |
| 8614 | 750W | 120V | 150A | |
| 8616 | 750W | 500V | 30A | High voltage |

**8600 Series Features:**
- Higher slew rates (up to 2.5 A/µs)
- Battery test with data logging
- LED test mode
- Transient mode with external trigger
- CR-LED mode (combined CR and LED)

---

## Connection Methods

| Interface | 8500 Series | 8600 Series |
|-----------|-------------|-------------|
| USB | USB-TMC | USB-TMC |
| RS-232 | 9600-115200 | 9600-115200 |
| GPIB | Optional | Optional |
| LAN | Some models | Some models |

**Resource String Examples:**
```
USB0::0x0C97::0x8600::000000000::INSTR
GPIB0::5::INSTR
ASRL/dev/ttyUSB0::INSTR
TCPIP0::192.168.1.100::5025::SOCKET
```

---

## IEEE 488.2 Common Commands

```
*IDN?                → "BK Precision,8600,000000000,1.00"
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
*SAV <n>             → Save state (1-25)
*RCL <n>             → Recall state (1-25)
*TRG                 → Software trigger
*TST?                → Self-test
```

---

## Input Control

### Enable/Disable Load

```
INPut[:STATe] {ON|OFF|1|0}                        → Enable/disable input
INPut[:STATe]?                                    → Query input state
```

### Short Circuit Mode

```
INPut:SHORt[:STATe] {ON|OFF}                      → Enable short circuit
INPut:SHORt[:STATe]?                              → Query short state
```

---

## Operating Mode

### Mode Selection

```
MODE {CURRent|VOLTage|RESistance|POWer}           → Set mode
MODE?                                              → Query mode
```

**Alternative syntax:**
```
MODE:CURRent                                       → CC mode
MODE:VOLTage                                       → CV mode
MODE:RESistance                                    → CR mode
MODE:POWer                                         → CP mode
```

---

## Constant Current (CC) Mode

### Current Setpoint

```
CURRent[:LEVel][:IMMediate] <current>             → Set current (A)
CURRent[:LEVel][:IMMediate]?                      → Query current
CURRent[:LEVel][:IMMediate]? MINimum
CURRent[:LEVel][:IMMediate]? MAXimum
```

### Current Range

```
CURRent:RANGe {<value>|HIGH|LOW|MINimum|MAXimum}  → Set range
CURRent:RANGe?                                     → Query range
CURRent:RANGe:AUTO {ON|OFF}                        → Auto-range
```

### Current Slew Rate

```
CURRent:SLEW[:BOTH] <rate>                        → Set slew (A/µs)
CURRent:SLEW?
CURRent:SLEW:POSitive <rate>                      → Rising slew
CURRent:SLEW:NEGative <rate>                      → Falling slew
```

**8600 Series Slew Range:** 0.001 to 2.5 A/µs

### Current Protection

```
CURRent:PROTection:LEVel <current>                → OCP level
CURRent:PROTection:LEVel?
CURRent:PROTection:STATe {ON|OFF}                 → Enable OCP
CURRent:PROTection:DELay <time>                   → OCP delay (s)
CURRent:PROTection:TRIPped?                       → Query trip status
CURRent:PROTection:CLEar                          → Clear trip
```

---

## Constant Voltage (CV) Mode

### Voltage Setpoint

```
VOLTage[:LEVel][:IMMediate] <voltage>             → Set voltage (V)
VOLTage[:LEVel][:IMMediate]?                      → Query voltage
```

### Voltage Range

```
VOLTage:RANGe {<value>|HIGH|LOW}                  → Set range
VOLTage:RANGe?
```

### Voltage Protection

```
VOLTage:PROTection:LEVel <voltage>                → OVP level
VOLTage:PROTection:STATe {ON|OFF}                 → Enable OVP
VOLTage:PROTection:TRIPped?
VOLTage:PROTection:CLEar
```

### Current Limit in CV Mode

```
VOLTage:LIMit:CURRent <current>                   → Current limit (A)
VOLTage:LIMit:CURRent?
```

---

## Constant Resistance (CR) Mode

### Resistance Setpoint

```
RESistance[:LEVel][:IMMediate] <ohms>             → Set resistance (Ω)
RESistance[:LEVel][:IMMediate]?                   → Query resistance
```

### Resistance Range

```
RESistance:RANGe {<value>|HIGH|LOW}               → Set range
RESistance:RANGe?
```

---

## Constant Power (CP) Mode

### Power Setpoint

```
POWer[:LEVel][:IMMediate] <watts>                 → Set power (W)
POWer[:LEVel][:IMMediate]?                        → Query power
```

### Power Protection

```
POWer:PROTection:LEVel <watts>                    → OPP level
POWer:PROTection:STATe {ON|OFF}                   → Enable OPP
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

---

## Transient (Dynamic) Mode

### Transient Mode Configuration

```
TRANsient:MODE {CONTinuous|PULSe|TOGGle}          → Transient type
TRANsient:MODE?
```

### Transient Levels (CC Mode)

```
CURRent:TRANsient:LEVel:HIGH <current>            → High level (A)
CURRent:TRANsient:LEVel:LOW <current>             → Low level (A)
CURRent:TRANsient:WIDth:HIGH <time>               → High time (s)
CURRent:TRANsient:WIDth:LOW <time>                → Low time (s)
CURRent:TRANsient:SLEW:RISe <rate>                → Rise slew (A/µs)
CURRent:TRANsient:SLEW:FALL <rate>                → Fall slew (A/µs)
```

### Enable Transient

```
TRANsient[:STATe] {ON|OFF}                        → Enable transient
TRANsient[:STATe]?
```

---

## List Mode

### List Configuration (Array Style)

```
LIST:MODE {CURRent|VOLTage|RESistance|POWer}      → List function
LIST:MODE?
LIST:COUNt <n>                                     → Repeat count (0 = infinite)
LIST:COUNt?
LIST:STEP <n>                                      → Number of steps
LIST:STEP?
```

### List Data (Array Format)

```
LIST:CURRent <val1>,<val2>,<val3>,...             → Current array
LIST:CURRent?
LIST:VOLTage <val1>,<val2>,...                    → Voltage array
LIST:RESistance <val1>,<val2>,...                 → Resistance array
LIST:POWer <val1>,<val2>,...                      → Power array
LIST:DWELl <t1>,<t2>,<t3>,...                     → Dwell times (s)
LIST:DWELl?
LIST:SLEW <s1>,<s2>,...                           → Slew rates
```

### List Control

```
LIST[:STATe] {ON|OFF}                             → Enable list
LIST[:STATe]?
LIST:SAVe <n>                                      → Save list
LIST:RECall <n>                                    → Recall list
```

---

## Battery Test Mode (8600 Series)

### Battery Configuration

```
BATTery:MODE {CC|CR|CP}                           → Discharge mode
BATTery:MODE?
BATTery:CURRent <current>                         → CC discharge (A)
BATTery:RESistance <ohms>                         → CR discharge (Ω)
BATTery:POWer <watts>                             → CP discharge (W)
```

### Stop Conditions

```
BATTery:DISCharge:VOLTage <voltage>               → Stop voltage (V)
BATTery:DISCharge:CAPacity <Ah>                   → Stop capacity (Ah)
BATTery:DISCharge:TIME <seconds>                  → Stop time (s)
```

### Battery Measurements

```
BATTery:CAPacity?                                  → Discharged Ah
BATTery:TIME?                                      → Elapsed time
BATTery:ENERgy?                                    → Discharged Wh
```

### Battery Control

```
BATTery[:STATe] {ON|OFF}                          → Start/stop test
BATTery:CLEar                                      → Clear data
```

---

## LED Test Mode (8600 Series)

### LED Configuration

```
LED:VF <voltage>                                   → LED Vf (V)
LED:VF?
LED:RD <ohms>                                      → LED Rd (Ω)
LED:RD?
LED:IFORward <current>                             → LED If (A)
LED:IFORward?
```

### LED Mode Enable

```
LED[:STATe] {ON|OFF}                              → Enable LED mode
LED[:STATe]?
```

---

## CR-LED Mode (8600 Series)

Combined CR and LED mode:

```
CRLED[:STATe] {ON|OFF}                            → Enable CR-LED
CRLED:RESistance <ohms>                           → CR setpoint
CRLED:VF <voltage>                                → LED Vf
CRLED:RD <ohms>                                   → LED Rd
```

---

## Von/Voff Control

```
VOLTage:ON <voltage>                              → Von threshold (V)
VOLTage:ON?
VOLTage:OFF <voltage>                             → Voff threshold (V)
VOLTage:OFF?
```

---

## Trigger System

### Trigger Source

```
TRIGger[:SEQuence]:SOURce {IMMediate|EXTernal|BUS|HOLD}
TRIGger[:SEQuence]:SOURce?
```

### Trigger Control

```
INITiate[:IMMediate]                              → Arm trigger
ABORt                                              → Abort
*TRG                                               → Software trigger
TRIGger[:SEQuence][:IMMediate]                    → Immediate trigger
```

### External Trigger (8600)

```
TRIGger:EXTernal:SLOPe {RISe|FALL}                → Trigger edge
TRIGger:EXTernal:SLOPe?
```

---

## System Commands

### Error Query

```
SYSTem:ERRor[:NEXT]?                              → Get next error
SYSTem:ERRor:COUNt?                               → Error count
```

### Beeper

```
SYSTem:BEEPer[:STATe] {ON|OFF}                    → Enable beeper
SYSTem:BEEPer:IMMediate                           → Beep once
```

### Remote/Local

```
SYSTem:LOCal                                       → Local mode
SYSTem:REMote                                      → Remote mode
SYSTem:RWLock                                      → Remote with lockout
```

### Power-On State

```
SYSTem:PON:STATe {RST|RCL0}                       → Power-on behavior
```

### Communication Settings

```
SYSTem:COMMunicate:SERial:BAUD {4800|9600|19200|38400|57600|115200}
SYSTem:COMMunicate:GPIB:ADDRess <1-30>
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

### Questionable Status Bits

| Bit | Value | Meaning |
|-----|-------|---------|
| 0 | 1 | OVP |
| 1 | 2 | OCP |
| 2 | 4 | OPP |
| 3 | 8 | OTP |
| 4 | 16 | Reverse voltage |

---

## Programming Examples

### Basic CC Mode

```
*RST                             # Reset
MODE CURR                        # CC mode
CURR 2.5                         # Set 2.5A
CURR:SLEW 1.0                    # 1 A/µs slew
INP ON                           # Enable input
MEAS:VOLT?                       # Measure voltage
MEAS:POW?                        # Measure power
INP OFF                          # Disable
```

### High-Speed Transient Test

```
*RST
MODE CURR                        # CC mode
CURR:TRAN:LEV:LOW 0.5            # Low level 0.5A
CURR:TRAN:LEV:HIGH 5.0           # High level 5.0A
CURR:TRAN:WID:LOW 0.0001         # 100µs low
CURR:TRAN:WID:HIGH 0.0001        # 100µs high
CURR:TRAN:SLEW:RIS 2.5           # Max slew
CURR:TRAN:SLEW:FALL 2.5
TRAN:MODE CONT                   # Continuous
TRAN ON                          # Enable
INP ON                           # Start
```

### Battery Discharge Test (8600)

```
*RST
BATT:MODE CC                     # CC discharge
BATT:CURR 2.0                    # 2A discharge
BATT:DISCH:VOLT 2.8              # Stop at 2.8V
BATT:DISCH:CAP 2.5               # Stop at 2.5Ah
BATT:DISCH:TIME 3600             # Max 1 hour
BATT ON                          # Start
# ... wait ...
BATT:CAP?                        # Query Ah
BATT:ENER?                       # Query Wh
BATT:TIME?                       # Query time
BATT OFF                         # Stop
```

### LED Driver Test (8600)

```
*RST
LED:VF 3.2                       # LED Vf = 3.2V
LED:RD 0.5                       # LED Rd = 0.5Ω
LED:IFOR 1.0                     # Forward current = 1A
LED ON                           # Enable LED mode
INP ON                           # Enable input
MEAS:VOLT?                       # Measure actual voltage
MEAS:CURR?                       # Measure current
```

### List Mode Sequence

```
*RST
LIST:MODE CURR                   # CC list mode
LIST:STEP 4                      # 4 steps
LIST:CURR 0.5,1.0,2.0,0.0        # Current values
LIST:DWEL 1.0,1.0,1.0,0.5        # Dwell times
LIST:COUN 5                      # Repeat 5 times
LIST ON                          # Enable list
INP ON                           # Start
```

---

## Connection Examples

### Python with pySerial

```python
import serial
import time

class BKLoad:
    def __init__(self, port, baud=9600):
        self.ser = serial.Serial(port, baud, timeout=2)
        time.sleep(0.5)

    def write(self, cmd):
        self.ser.write((cmd + '\n').encode())
        time.sleep(0.05)

    def query(self, cmd):
        self.write(cmd)
        return self.ser.readline().decode().strip()

    def close(self):
        self.ser.close()

# Example
load = BKLoad('/dev/ttyUSB0', 9600)
print(load.query('*IDN?'))

load.write('MODE CURR')
load.write('CURR 2.0')
load.write('INP ON')
voltage = float(load.query('MEAS:VOLT?'))
print(f"Voltage: {voltage} V")

load.write('INP OFF')
load.close()
```

### TypeScript with visa-ts

```typescript
import { createResourceManager } from 'visa-ts';

async function testWithBKLoad() {
  const rm = createResourceManager();
  const load = await rm.open('GPIB0::5::INSTR');

  await load.write('MODE CURR');
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

1. **Command Prefix**: BK Precision commands typically don't require the `:` prefix (e.g., `CURR` not `:CURR`).

2. **List Arrays**: List data is specified as comma-separated arrays, not individual step commands.

3. **8600 vs 8500**: 8600 series has higher slew rates, battery test, LED test, and CR-LED modes.

4. **Memory Locations**: 25 save/recall locations available.

5. **Slew Rate Units**: A/µs for current slew rate.

6. **External Trigger**: 8600 series supports edge-triggered external input.

7. **High Voltage Models**: 8602, 8612, 8616 support up to 500V input.

8. **CR-LED Mode**: 8600 unique feature combining CR and LED simulation.
