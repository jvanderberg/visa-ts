# Chroma Electronic Load SCPI Reference

> Chroma 63600 Series Programmable DC Electronic Loads

## Supported Models

### 63600 Series (Modular)

| Model | Power | Voltage | Current | Features |
|-------|-------|---------|---------|----------|
| 63600-2 | 200W | 80V | 20A | 2-slot frame |
| 63600-5 | 200W | 80V | 20A | 5-slot frame |
| 63610-80-20 | 200W | 80V | 20A | Load module |
| 63630-80-60 | 600W | 80V | 60A | |
| 63640-80-80 | 800W | 80V | 80A | |
| 63610-600-20 | 200W | 600V | 20A | High voltage |
| 63640-150-60 | 1200W | 150V | 60A | |

### 63200A Series (High Power)

| Model | Power | Voltage | Current | Features |
|-------|-------|---------|---------|----------|
| 63202A-150-200 | 2.6kW | 150V | 200A | |
| 63204A-150-400 | 5.2kW | 150V | 400A | |
| 63206A-150-600 | 7.8kW | 150V | 600A | |
| 63208A-600-210 | 10.4kW | 600V | 210A | High voltage |
| 63210A-600-420 | 20.8kW | 600V | 420A | |

**Key Features:**
- High/Low range for each mode (CCH/CCL, CVH/CVL, etc.)
- Dynamic mode up to 50 kHz
- OCP/OPP test modes
- Battery discharge simulation
- Parallel operation support
- CR+CC combined mode

---

## Connection Methods

| Interface | Details |
|-----------|---------|
| USB | USB-TMC |
| GPIB | IEEE-488.2 |
| RS-232 | 9600-115200 baud |
| LAN | Port 5025 |

**Resource String Examples:**
```
USB0::0x1698::0x0837::12345678::INSTR
GPIB0::1::INSTR
TCPIP0::192.168.1.100::5025::SOCKET
ASRL/dev/ttyUSB0::INSTR
```

---

## IEEE 488.2 Common Commands

```
*IDN?                → "Chroma,63600,12345678,1.00"
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
*SAV <n>             → Save state (0-9)
*RCL <n>             → Recall state (0-9)
*TRG                 → Software trigger
*WAI                 → Wait for operations complete
```

---

## Channel Selection (Modular Frames)

```
CHANnel <n>                                       → Select channel (1-5)
CHANnel?                                          → Query selected channel
```

---

## Input Control

### Enable/Disable Load

```
LOAD {ON|OFF|1|0}                                 → Enable/disable load
LOAD?                                             → Query load state
```

### Short Circuit Mode

```
LOAD:SHORt {ON|OFF}                               → Enable short circuit
LOAD:SHORt?                                       → Query short state
```

---

## Operating Mode

### Mode Selection (with Range)

Chroma uses combined mode/range commands:

```
MODE {CCL|CCH|CVL|CVH|CRL|CRH|CPL|CPH|CCDL|CCDH|CCFSL|CCFSH}
MODE?
```

**Mode Codes:**
- **CCL/CCH**: Constant Current Low/High range
- **CVL/CVH**: Constant Voltage Low/High range
- **CRL/CRH**: Constant Resistance Low/High range
- **CPL/CPH**: Constant Power Low/High range
- **CCDL/CCDH**: CC Dynamic Low/High range
- **CCFSL/CCFSH**: CC Fast Slew Low/High range

---

## Constant Current (CC) Mode

### Current Setpoint

```
CURRent[:STATic]:L1 <current>                     → Static level 1 (A)
CURRent[:STATic]:L1?
CURRent[:STATic]:L2 <current>                     → Static level 2 (A)
CURRent[:STATic]:L2?
```

### Current Slew Rate

```
CURRent[:STATic]:RISE <time>                      → Rise time (s)
CURRent[:STATic]:RISE?
CURRent[:STATic]:FALL <time>                      → Fall time (s)
CURRent[:STATic]:FALL?
CURRent[:STATic]:SLEW <rate>                      → Slew rate (A/µs)
CURRent[:STATic]:SLEW?
```

### Current Range

```
CURRent:RANGe {HIGH|LOW|<value>}                  → Set range
CURRent:RANGe?
```

---

## Constant Voltage (CV) Mode

### Voltage Setpoint

```
VOLTage[:STATic]:L1 <voltage>                     → Static level 1 (V)
VOLTage[:STATic]:L1?
VOLTage[:STATic]:L2 <voltage>                     → Static level 2 (V)
VOLTage[:STATic]:L2?
```

### Voltage Range

```
VOLTage:RANGe {HIGH|LOW|<value>}
VOLTage:RANGe?
```

### Current Limit in CV Mode

```
CURRent:LIMit <current>                           → Current limit (A)
CURRent:LIMit?
```

---

## Constant Resistance (CR) Mode

### Resistance Setpoint

```
RESistance[:STATic]:L1 <ohms>                     → Level 1 (Ω)
RESistance[:STATic]:L1?
RESistance[:STATic]:L2 <ohms>                     → Level 2 (Ω)
RESistance[:STATic]:L2?
```

### Resistance Range

```
RESistance:RANGe {HIGH|LOW|<value>}
RESistance:RANGe?
```

---

## Constant Power (CP) Mode

### Power Setpoint

```
POWer[:STATic]:L1 <watts>                         → Level 1 (W)
POWer[:STATic]:L1?
POWer[:STATic]:L2 <watts>                         → Level 2 (W)
POWer[:STATic]:L2?
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

### Dynamic Level Configuration

```
CURRent:DYNamic:L1 <current>                      → Low level (A)
CURRent:DYNamic:L1?
CURRent:DYNamic:L2 <current>                      → High level (A)
CURRent:DYNamic:L2?
```

### Dynamic Timing

```
CURRent:DYNamic:T1 <time>                         → Time at L1 (s)
CURRent:DYNamic:T1?
CURRent:DYNamic:T2 <time>                         → Time at L2 (s)
CURRent:DYNamic:T2?
```

### Dynamic Slew

```
CURRent:DYNamic:RISE <time>                       → Rise time (s)
CURRent:DYNamic:RISE?
CURRent:DYNamic:FALL <time>                       → Fall time (s)
CURRent:DYNamic:FALL?
```

### Dynamic Mode Control

```
CURRent:DYNamic:REPeat <n>                        → Repeat count
CURRent:DYNamic:REPeat?
```

---

## Sequence (Program) Mode

### Sequence Configuration

```
PROGram:MODE {CC|CV|CR|CP}                        → Sequence mode
PROGram:MODE?
PROGram:COUNt <n>                                 → Repeat count
PROGram:COUNt?
PROGram:STEP <n>                                  → Number of steps
PROGram:STEP?
```

### Step Configuration

```
PROGram:STATic:STEP<n>:LEVel <value>              → Step value
PROGram:STATic:STEP<n>:TIME <time>                → Step duration
PROGram:STATic:STEP<n>:SLEW <rate>                → Step slew
```

### Sequence Control

```
PROGram:RUN {ON|OFF}                              → Start/stop
PROGram:RUN?
PROGram:SAVE <n>                                  → Save sequence
PROGram:RECall <n>                                → Recall sequence
```

---

## OCP Test Mode

Automatic OCP trip point testing:

```
SPEC:TEST:ITEM OCP                                → Select OCP test
SPEC:OCP:STARt <current>                          → Start current
SPEC:OCP:END <current>                            → End current
SPEC:OCP:STEP <current>                           → Step size
SPEC:OCP:STEP:TIME <time>                         → Time per step
SPEC:OCP:TRIP:VOLT <voltage>                      → Trip detection voltage
SPEC:OCP:SPEC:HIGH <current>                      → Pass high limit
SPEC:OCP:SPEC:LOW <current>                       → Pass low limit
SPEC:OCP:RUN {ON|OFF}                             → Start/stop test
SPEC:OCP:TRIP:CURRent?                            → Query trip current
SPEC:OCP:JUDGement?                               → Pass/fail result
```

---

## OPP Test Mode

```
SPEC:TEST:ITEM OPP                                → Select OPP test
SPEC:OPP:STARt <power>                            → Start power
SPEC:OPP:END <power>                              → End power
SPEC:OPP:STEP <power>                             → Step size
SPEC:OPP:STEP:TIME <time>                         → Time per step
SPEC:OPP:RUN {ON|OFF}                             → Start/stop
SPEC:OPP:TRIP:POWer?                              → Query trip power
```

---

## Battery Test Mode

```
SPEC:TEST:ITEM BATT                               → Select battery test
BATTery:MODE {CC|CR|CP}                           → Discharge mode
BATTery:CURRent <current>                         → CC current
BATTery:RESistance <ohms>                         → CR resistance
BATTery:POWer <watts>                             → CP power
BATTery:STOPVolt <voltage>                        → Stop voltage
BATTery:CAPacity <Ah>                             → Stop capacity
BATTery:TIMer <seconds>                           → Stop time
BATTery:RUN {ON|OFF}                              → Start/stop
BATTery:CAPacity:MEASure?                         → Query Ah
BATTery:TIME:MEASure?                             → Query time
```

---

## CR+CC Mode

Combined CR and CC mode:

```
MODE CRCC                                         → Enable CR+CC
RESistance:CRCC <ohms>                            → CR setpoint
CURRent:CRCC <current>                            → CC limit
```

---

## Protection Settings

### Over Current Protection

```
CURRent:PROTection[:LEVel] <current>              → OCP threshold
CURRent:PROTection:STATe {ON|OFF}                 → Enable OCP
CURRent:PROTection:DELay <time>                   → OCP delay
```

### Over Voltage Protection

```
VOLTage:PROTection[:LEVel] <voltage>              → OVP threshold
VOLTage:PROTection:STATe {ON|OFF}                 → Enable OVP
```

### Over Power Protection

```
POWer:PROTection[:LEVel] <watts>                  → OPP threshold
POWer:PROTection:STATe {ON|OFF}                   → Enable OPP
```

### Clear Protection

```
PROTection:CLEar                                  → Clear all trips
```

---

## Trigger System

### Trigger Source

```
TRIGger[:SEQuence]:SOURce {IMMediate|EXTernal|BUS|HOLDoff|TIMer}
TRIGger[:SEQuence]:SOURce?
```

### Trigger Control

```
INITiate[:IMMediate]                              → Arm trigger
ABORt                                              → Abort
*TRG                                               → Software trigger
TRIGger[:SEQuence]:DELay <time>                   → Trigger delay
```

---

## System Commands

### Error Query

```
SYSTem:ERRor[:NEXT]?                              → Get next error
```

### Remote/Local

```
SYSTem:LOCal                                       → Local mode
SYSTem:REMote                                      → Remote mode
SYSTem:RWLock                                      → Remote with lockout
SYSTem:KLOCk {ON|OFF}                             → Key lock
```

### Beeper

```
SYSTem:BEEPer[:STATe] {ON|OFF}                    → Enable beeper
SYSTem:BEEPer:ERRor {ON|OFF}                      → Beep on error
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
| 5 | 32 | Max power limit |
| 8 | 256 | Remote inhibit |

---

## Programming Examples

### Basic CC Mode

```
*RST
MODE CCH                         # CC High range
CURR:STAT:L1 2.0                 # Set 2A
CURR:STAT:SLEW 1.0               # 1 A/µs slew
LOAD ON                          # Enable load
MEAS:VOLT?                       # Measure voltage
MEAS:POW?                        # Measure power
LOAD OFF                         # Disable
```

### Dynamic Load Test

```
*RST
MODE CCDH                        # CC Dynamic High range
CURR:DYN:L1 0.5                  # Low level 0.5A
CURR:DYN:L2 5.0                  # High level 5.0A
CURR:DYN:T1 0.001                # 1ms at L1
CURR:DYN:T2 0.001                # 1ms at L2
CURR:DYN:RISE 0.00001            # 10µs rise
CURR:DYN:FALL 0.00001            # 10µs fall
CURR:DYN:REP 0                   # Continuous
LOAD ON                          # Start
```

### OCP Test

```
*RST
SPEC:TEST:ITEM OCP               # OCP test mode
SPEC:OCP:STAR 0.5                # Start at 0.5A
SPEC:OCP:END 10.0                # End at 10A
SPEC:OCP:STEP 0.1                # 100mA steps
SPEC:OCP:STEP:TIME 0.5           # 500ms per step
SPEC:OCP:TRIP:VOLT 1.0           # Trip at <1V
SPEC:OCP:SPEC:HIGH 5.5           # Pass if <5.5A
SPEC:OCP:SPEC:LOW 4.5            # Pass if >4.5A
SPEC:OCP:RUN ON                  # Start test
*OPC?                            # Wait
SPEC:OCP:TRIP:CURR?              # Get trip current
SPEC:OCP:JUDG?                   # Get pass/fail
```

### Battery Discharge Test

```
*RST
SPEC:TEST:ITEM BATT              # Battery test mode
BATT:MODE CC                     # CC discharge
BATT:CURR 2.0                    # 2A discharge
BATT:STOPV 2.8                   # Stop at 2.8V
BATT:CAP 3.0                     # Stop at 3Ah
BATT:TIM 7200                    # Max 2 hours
BATT:RUN ON                      # Start
# ... wait ...
BATT:CAP:MEAS?                   # Query Ah
BATT:TIME:MEAS?                  # Query time
BATT:RUN OFF                     # Stop
```

### Sequence Mode

```
*RST
PROG:MODE CC                     # CC sequence
PROG:STEP 4                      # 4 steps
PROG:STAT:STEP1:LEV 0.5          # Step 1: 0.5A
PROG:STAT:STEP1:TIME 1.0         # 1 second
PROG:STAT:STEP2:LEV 1.0          # Step 2: 1.0A
PROG:STAT:STEP2:TIME 1.0
PROG:STAT:STEP3:LEV 2.0          # Step 3: 2.0A
PROG:STAT:STEP3:TIME 1.0
PROG:STAT:STEP4:LEV 0.0          # Step 4: 0A
PROG:STAT:STEP4:TIME 0.5
PROG:COUN 3                      # 3 repeats
PROG:RUN ON                      # Start
LOAD ON
```

### CR+CC Combined Mode

```
*RST
MODE CRCC                        # CR+CC mode
RES:CRCC 10.0                    # 10Ω CR setpoint
CURR:CRCC 5.0                    # 5A CC limit
LOAD ON
MEAS:CURR?                       # Will be limited to 5A
```

---

## Connection Examples

### Python Socket

```python
import socket
import time

def chroma_query(host, command, port=5025):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(5)
        s.connect((host, port))
        s.sendall((command + '\n').encode())
        time.sleep(0.05)
        return s.recv(4096).decode().strip()

# Example
idn = chroma_query('192.168.1.100', '*IDN?')
print(idn)

chroma_query('192.168.1.100', 'MODE CCH')
chroma_query('192.168.1.100', 'CURR:STAT:L1 2.0')
chroma_query('192.168.1.100', 'LOAD ON')
voltage = float(chroma_query('192.168.1.100', 'MEAS:VOLT?'))
print(f"Voltage: {voltage} V")
```

### TypeScript with visa-ts

```typescript
import { createResourceManager } from 'visa-ts';

async function testWithChromaLoad() {
  const rm = createResourceManager();
  const load = await rm.open('TCPIP0::192.168.1.100::5025::SOCKET');

  await load.write('MODE CCH');
  await load.write('CURR:STAT:L1 2.0');
  await load.write('LOAD ON');

  const voltageResult = await load.query('MEAS:VOLT?');
  const currentResult = await load.query('MEAS:CURR?');
  const powerResult = await load.query('MEAS:POW?');

  if (voltageResult.ok && currentResult.ok && powerResult.ok) {
    console.log(`V: ${parseFloat(voltageResult.value)}V`);
    console.log(`I: ${parseFloat(currentResult.value)}A`);
    console.log(`P: ${parseFloat(powerResult.value)}W`);
  }

  await load.write('LOAD OFF');
  await load.close();
}
```

---

## Notes

1. **Mode with Range**: Chroma uses combined mode/range commands (CCH, CCL, CVH, etc.).

2. **L1/L2 Levels**: Static and dynamic modes use L1/L2 for setpoints (not single value).

3. **LOAD vs INP**: Chroma uses `LOAD ON/OFF` instead of `INP ON/OFF`.

4. **OCP/OPP Test**: Built-in automated test modes for protection verification.

5. **CR+CC Mode**: Unique combined mode for complex load profiles.

6. **Modular System**: 63600 series uses channel selection for multi-module frames.

7. **Dynamic Frequency**: Up to 50 kHz dynamic operation on some models.

8. **SPEC Commands**: Special test modes accessed via SPEC subsystem.
