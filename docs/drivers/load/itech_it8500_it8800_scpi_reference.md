# ITECH Electronic Load SCPI Reference

> ITECH IT8500+ and IT8800 Series

## Supported Models

### IT8500+ Series (Entry/Mid Level)

| Model | Power | Voltage | Current | Features |
|-------|-------|---------|---------|----------|
| IT8511+ | 150W | 120V | 30A | Basic |
| IT8512+ | 120W | 120V | 30A | |
| IT8512B+ | 300W | 120V | 30A | |
| IT8512C+ | 120W | 500V | 15A | High voltage |
| IT8513A+ | 200W | 120V | 60A | |
| IT8513B+ | 400W | 120V | 60A | |
| IT8513C+ | 200W | 500V | 15A | High voltage |

### IT8800 Series (Professional)

| Model | Power | Voltage | Current | Features |
|-------|-------|---------|---------|----------|
| IT8811 | 150W | 150V | 30A | Single channel |
| IT8812 | 300W | 150V | 30A | |
| IT8812B | 300W | 150V | 60A | |
| IT8813 | 600W | 150V | 60A | |
| IT8814 | 600W | 150V | 120A | |
| IT8815 | 600W | 500V | 30A | High voltage |
| IT8816 | 1200W | 150V | 120A | |
| IT8817 | 1200W | 150V | 240A | |
| IT8818 | 1200W | 500V | 60A | High voltage |

**IT8800 Features:**
- High-speed transient (up to 25 kHz)
- List mode with 100 steps
- Battery test with logging
- CR-LED mode
- Parallel/series operation
- Voltage rise test (OVP test)
- Soft start time setting

---

## Connection Methods

| Interface | IT8500+ | IT8800 |
|-----------|---------|--------|
| USB | USB-TMC | USB-TMC |
| RS-232 | 9600-115200 | 9600-115200 |
| GPIB | Optional | Optional |
| LAN | Some models | Standard |

**Resource String Examples:**
```
USB0::0x2EC7::0x8800::IT8812345678::INSTR
TCPIP0::192.168.1.100::5025::SOCKET
GPIB0::1::INSTR
ASRL/dev/ttyUSB0::INSTR
```

---

## IEEE 488.2 Common Commands

```
*IDN?                → "ITECH,IT8812,IT8812345678,1.23-1.45"
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
*SAV <n>             → Save state (1-10)
*RCL <n>             → Recall state (1-10)
*TRG                 → Software trigger
*WAI                 → Wait for operations complete
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
FUNCtion {CURRent|VOLTage|RESistance|POWer}       → Set mode
FUNCtion?                                          → Query mode
```

**Short forms:** `CURR`, `VOLT`, `RES`, `POW`

---

## Constant Current (CC) Mode

### Current Setpoint

```
CURRent[:LEVel][:IMMediate] <current>             → Set current (A)
CURRent[:LEVel][:IMMediate]?                      → Query current
CURRent[:LEVel][:IMMediate]? MIN
CURRent[:LEVel][:IMMediate]? MAX
```

### Current Range

```
CURRent:RANGe {HIGH|LOW|<value>}                  → Set range
CURRent:RANGe?                                    → Query range
CURRent:RANGe:AUTO {ON|OFF}                       → Auto-range
```

### Current Slew Rate

```
CURRent:SLEW[:BOTH] <rate>                        → Set slew (A/s)
CURRent:SLEW?
CURRent:SLEW:POSitive <rate>                      → Rising slew
CURRent:SLEW:NEGative <rate>                      → Falling slew
```

**Note:** ITECH uses A/s (not A/µs) for slew rate.

### Current Protection (OCP)

```
CURRent:PROTection[:LEVel] <current>              → OCP threshold
CURRent:PROTection[:LEVel]?
CURRent:PROTection:STATe {ON|OFF}                 → Enable OCP
CURRent:PROTection:DELay <time>                   → OCP delay (s)
CURRent:PROTection:TRIPped?                       → Query trip
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
VOLTage:RANGe {HIGH|LOW|<value>}                  → Set range
VOLTage:RANGe?
```

### Voltage Protection

```
VOLTage:PROTection[:LEVel] <voltage>              → OVP threshold
VOLTage:PROTection:STATe {ON|OFF}                 → Enable OVP
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
RESistance:RANGe {HIGH|LOW|<value>}               → Set range
RESistance:RANGe?
```

---

## Constant Power (CP) Mode

### Power Setpoint

```
POWer[:LEVel][:IMMediate] <watts>                 → Set power (W)
POWer[:LEVel][:IMMediate]?                        → Query power
```

### Power Protection (OPP)

```
POWer:PROTection[:LEVel] <watts>                  → OPP threshold
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

## Dynamic Mode

### Dynamic Configuration

```
CURRent:DYNamic:L1 <current>                      → Level 1 (A)
CURRent:DYNamic:L1?
CURRent:DYNamic:L2 <current>                      → Level 2 (A)
CURRent:DYNamic:L2?
CURRent:DYNamic:T1 <time>                         → Time at L1 (s)
CURRent:DYNamic:T1?
CURRent:DYNamic:T2 <time>                         → Time at L2 (s)
CURRent:DYNamic:T2?
CURRent:DYNamic:RISE <time>                       → Rise time (s)
CURRent:DYNamic:RISE?
CURRent:DYNamic:FALL <time>                       → Fall time (s)
CURRent:DYNamic:FALL?
```

### Dynamic Mode Selection

```
CURRent:DYNamic:MODE {CONTinuous|PULSe|TOGGle}    → Dynamic type
CURRent:DYNamic:MODE?
```

### Enable Dynamic

```
DYNamic[:STATe] {ON|OFF}                          → Enable dynamic
DYNamic[:STATe]?
```

---

## List Mode

### List Configuration

```
LIST:MODE {CURRent|VOLTage|RESistance|POWer}      → List function
LIST:MODE?
LIST:COUNt <n>                                     → Repeat count (0 = infinite)
LIST:COUNt?
LIST:STEP <n>                                      → Number of steps (1-100)
LIST:STEP?
```

### Step Programming

```
LIST:CURRent <step>,<current>                     → Set step current
LIST:CURRent? <step>
LIST:VOLTage <step>,<voltage>                     → Set step voltage
LIST:RESistance <step>,<ohms>                     → Set step resistance
LIST:POWer <step>,<watts>                         → Set step power
LIST:WIDth <step>,<time>                          → Set step duration (s)
LIST:WIDth? <step>
LIST:SLEW <step>,<rate>                           → Set step slew (A/s)
LIST:SLEW? <step>
```

### List Control

```
LIST[:STATe] {ON|OFF}                             → Enable list mode
LIST[:STATe]?
LIST:SAVe <n>                                      → Save list (1-7)
LIST:RECall <n>                                    → Recall list (1-7)
```

---

## Battery Test Mode

### Battery Configuration

```
BATTery:MODE {CC|CV|CP|CR}                        → Discharge mode
BATTery:MODE?
BATTery:CURRent <current>                         → CC current (A)
BATTery:CURRent?
BATTery:VOLTage <voltage>                         → CV voltage (V)
BATTery:POWer <watts>                             → CP power (W)
BATTery:RESistance <ohms>                         → CR resistance (Ω)
```

### Stop Conditions

```
BATTery:STOPVolt <voltage>                        → Stop voltage (V)
BATTery:STOPVolt?
BATTery:CAPacity <Ah>                             → Stop capacity (Ah)
BATTery:CAPacity?
BATTery:TIMer <seconds>                           → Stop time (s)
BATTery:TIMer?
```

### Battery Measurements

```
BATTery:MEASure:CAPacity?                         → Discharged Ah
BATTery:MEASure:WH?                               → Discharged Wh
BATTery:MEASure:TIME?                             → Elapsed time
```

### Battery Control

```
BATTery[:STATe] {ON|OFF}                          → Start/stop test
BATTery[:STATe]?
BATTery:CLEar                                     → Clear data
```

---

## LED Test Mode

### LED Configuration

```
LED:VF <voltage>                                   → LED Vf (V)
LED:VF?
LED:RD <ohms>                                      → LED Rd (Ω)
LED:RD?
LED:IO <current>                                   → Operating current (A)
LED:IO?
```

### LED Mode Enable

```
LED[:STATe] {ON|OFF}                              → Enable LED mode
LED[:STATe]?
```

---

## CR-LED Mode

Combined CR and LED mode:

```
CRLED[:STATe] {ON|OFF}                            → Enable CR-LED
CRLED:RESistance <ohms>                           → CR resistance
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

## OVP Test Mode (IT8800)

Test power supply OVP trip point:

```
VRISe:MODE {NORMal|EXCursion}                     → Test mode
VRISe:STARt <voltage>                             → Start voltage
VRISe:END <voltage>                               → End voltage
VRISe:STEP <voltage>                              → Step size
VRISe:STEP:TIME <time>                            → Step time
VRISe:TRIP:VOLT?                                  → Trip voltage result
VRISe[:STATe] {ON|OFF}                            → Start test
```

---

## Soft Start

```
INPut:SOFTstart:TIME <time>                       → Soft start time (s)
INPut:SOFTstart:TIME?
```

---

## Trigger System

### Trigger Source

```
TRIGger[:SEQuence]:SOURce {IMMediate|EXTernal|BUS|HOLD|TIMer}
TRIGger[:SEQuence]:SOURce?
```

### Trigger Control

```
INITiate[:IMMediate]                              → Arm trigger
ABORt                                              → Abort
*TRG                                               → Software trigger
TRIGger[:SEQuence]:DELay <time>                   → Trigger delay
TRIGger[:SEQuence]:TIMer <period>                 → Timer period
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
SYSTem:KLOCk {ON|OFF}                             → Key lock
```

### Power-On State

```
SYSTem:PON:STATe {RST|RCL0|SAV0}                  → Power-on behavior
```

---

## LAN Configuration (IT8800)

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

---

## Programming Examples

### Basic CC Mode

```
*RST
FUNC CURR                        # CC mode
CURR 2.0                         # Set 2A
CURR:SLEW 1000                   # 1000 A/s slew
INP ON                           # Enable input
MEAS:VOLT?                       # Measure voltage
MEAS:POW?                        # Measure power
INP OFF                          # Disable
```

### Dynamic Load Test

```
*RST
FUNC CURR                        # CC mode
CURR:DYN:L1 0.5                  # Level 1 = 0.5A
CURR:DYN:L2 5.0                  # Level 2 = 5.0A
CURR:DYN:T1 0.001                # 1ms at L1
CURR:DYN:T2 0.001                # 1ms at L2
CURR:DYN:RISE 0.00001            # 10µs rise
CURR:DYN:FALL 0.00001            # 10µs fall
CURR:DYN:MODE CONT               # Continuous
DYN ON                           # Enable dynamic
INP ON                           # Start
```

### Battery Discharge Test

```
*RST
BATT:MODE CC                     # CC discharge
BATT:CURR 1.5                    # 1.5A discharge
BATT:STOPV 2.7                   # Stop at 2.7V
BATT:CAP 3.0                     # Stop at 3Ah
BATT:TIM 7200                    # Max 2 hours
BATT ON                          # Start
# ... wait ...
BATT:MEAS:CAP?                   # Query Ah
BATT:MEAS:WH?                    # Query Wh
BATT:MEAS:TIME?                  # Query time
BATT OFF                         # Stop
```

### LED Driver Test

```
*RST
LED:VF 3.0                       # LED Vf = 3.0V
LED:RD 1.0                       # LED Rd = 1.0Ω
LED:IO 0.5                       # Operating current = 0.5A
LED ON                           # Enable LED mode
INP ON                           # Enable input
MEAS:VOLT?                       # Measure voltage
MEAS:CURR?                       # Measure current
```

### List Mode Sequence

```
*RST
LIST:MODE CURR                   # CC list
LIST:STEP 5                      # 5 steps
LIST:CURR 1,0.5                  # Step 1: 0.5A
LIST:WID 1,1.0                   # Step 1: 1s
LIST:CURR 2,1.0                  # Step 2: 1.0A
LIST:WID 2,1.0
LIST:CURR 3,1.5                  # Step 3: 1.5A
LIST:WID 3,1.0
LIST:CURR 4,2.0                  # Step 4: 2.0A
LIST:WID 4,1.0
LIST:CURR 5,0.0                  # Step 5: 0A
LIST:WID 5,0.5
LIST:COUN 3                      # 3 repeats
LIST ON                          # Enable
INP ON                           # Start
```

### OVP Test (IT8800)

```
*RST
VRIS:MODE NORM                   # Normal mode
VRIS:STAR 5.0                    # Start at 5V
VRIS:END 15.0                    # End at 15V
VRIS:STEP 0.1                    # 100mV steps
VRIS:STEP:TIME 0.1               # 100ms per step
VRIS ON                          # Start test
*OPC?                            # Wait for completion
VRIS:TRIP:VOLT?                  # Query trip voltage
```

---

## Connection Examples

### Python Socket

```python
import socket
import time

def itech_query(host, command, port=5025):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(5)
        s.connect((host, port))
        s.sendall((command + '\n').encode())
        time.sleep(0.05)
        return s.recv(4096).decode().strip()

# Example
idn = itech_query('192.168.1.100', '*IDN?')
print(idn)

itech_query('192.168.1.100', 'FUNC CURR')
itech_query('192.168.1.100', 'CURR 2.0')
itech_query('192.168.1.100', 'INP ON')
voltage = float(itech_query('192.168.1.100', 'MEAS:VOLT?'))
print(f"Voltage: {voltage} V")
```

### TypeScript with visa-ts

```typescript
import { createResourceManager } from 'visa-ts';

async function testWithITECHLoad() {
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

1. **Slew Rate Units**: ITECH uses A/s for slew rate, not A/µs.

2. **Dynamic vs Transient**: ITECH uses `DYNamic` subsystem instead of `TRANsient`.

3. **IT8800 Features**: Higher dynamic frequency, OVP test mode, parallel operation.

4. **List Steps**: IT8800 supports 100 steps, IT8500+ varies by model.

5. **CR-LED Mode**: Available on IT8800 series for combined CR and LED testing.

6. **Soft Start**: IT8800 has programmable soft start time to prevent inrush.

7. **VRISe Mode**: Unique IT8800 feature for testing OVP trip points.

8. **Command Prefix**: Most commands don't require `:` prefix (e.g., `FUNC` not `:FUNC`).
