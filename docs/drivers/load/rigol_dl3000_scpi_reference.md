# Rigol DL3000 Electronic Load SCPI Reference

> Rigol DL3021, DL3021A, DL3031, DL3031A Series

## Supported Models

| Model | Power | Voltage | Current | Resolution | Features |
|-------|-------|---------|---------|------------|----------|
| DL3021 | 200W | 150V | 40A | 0.1mA | Basic |
| DL3021A | 200W | 150V | 40A | 0.1mA | + Waveform display |
| DL3031 | 350W | 150V | 60A | 0.1mA | Higher power |
| DL3031A | 350W | 150V | 60A | 0.1mA | + Waveform display |

**Key Features (all models):**
- CC/CV/CR/CP operating modes
- Dynamic (transient) mode
- List (sequence) mode
- Battery discharge test
- LED test mode
- Short circuit simulation
- OCP/OVP/OPP/OTP protection

---

## Connection Methods

| Interface | Details |
|-----------|---------|
| USB | USB-TMC (VID: 0x1AB1) |
| LAN | Port **5555** (SCPI raw socket) |
| RS-232 | 9600-115200 baud |

**Resource String Examples:**
```
USB0::0x1AB1::0x0E11::DL3A000000000::INSTR
TCPIP0::192.168.1.100::5555::SOCKET
ASRL/dev/ttyUSB0::INSTR
```

**Note:** Rigol uses port 5555, not 5025.

---

## IEEE 488.2 Common Commands

```
*IDN?                → "RIGOL TECHNOLOGIES,DL3021A,DL3A000000000,00.01.00.00.00"
*RST                 → Reset to default state
*CLS                 → Clear status registers
*ESE <mask>          → Event status enable register
*ESE?                → Query event status enable
*ESR?                → Query event status register
*OPC                 → Set OPC bit when operations complete
*OPC?                → Returns "1" when operations complete
*SRE <mask>          → Service request enable register
*SRE?                → Query service request enable
*STB?                → Query status byte
*SAV <n>             → Save state to memory (1-10)
*RCL <n>             → Recall state from memory (1-10)
*TRG                 → Software trigger
*WAI                 → Wait for operations complete
*TST?                → Self-test (0 = pass)
```

---

## Input Control

### Enable/Disable Load Input

```
:INPut[:STATe] {ON|OFF|1|0}                       → Enable/disable input
:INPut[:STATe]?                                   → Query input state
```

**Returns:** `ON` or `OFF`

### Short Circuit Mode

```
:INPut:SHORt[:STATe] {ON|OFF|1|0}                 → Enable short circuit
:INPut:SHORt[:STATe]?                             → Query short state
```

Short circuit mode sinks maximum current (per range setting).

---

## Operating Mode

### Mode Selection

```
:SOURce:FUNCtion {CURRent|VOLTage|RESistance|POWer}
:SOURce:FUNCtion?
```

**Short forms accepted:** `CURR`, `VOLT`, `RES`, `POW`

### Query Current Operating Mode (CC/CV)

```
:SOURce:FUNCtion:MODE?                            → Returns actual mode
```

Returns `CC` or `CV` based on regulation state (not setpoint mode).

---

## Constant Current (CC) Mode

### Current Setpoint

```
:SOURce:CURRent[:LEVel][:IMMediate] <current>     → Set current (A)
:SOURce:CURRent[:LEVel][:IMMediate]?              → Query current setpoint
:SOURce:CURRent[:LEVel][:IMMediate]? MINimum      → Query minimum
:SOURce:CURRent[:LEVel][:IMMediate]? MAXimum      → Query maximum
```

### Current Range

```
:SOURce:CURRent:RANGe {<value>|MINimum|MAXimum}   → Set range
:SOURce:CURRent:RANGe?                            → Query range
```

**Available Ranges:**
- DL3021/DL3021A: 4A, 40A
- DL3031/DL3031A: 6A, 60A

### Current Slew Rate

```
:SOURce:CURRent:SLEW[:BOTH] <rate>                → Set slew rate (A/µs)
:SOURce:CURRent:SLEW[:BOTH]?                      → Query slew rate
:SOURce:CURRent:SLEW:POSitive <rate>              → Rising slew rate
:SOURce:CURRent:SLEW:POSitive?
:SOURce:CURRent:SLEW:NEGative <rate>              → Falling slew rate
:SOURce:CURRent:SLEW:NEGative?
```

**Range:** 0.001 to 2.5 A/µs (model dependent)

### Current Protection (OCP)

```
:SOURce:CURRent:PROTection:LEVel <current>        → OCP threshold (A)
:SOURce:CURRent:PROTection:LEVel?
:SOURce:CURRent:PROTection[:STATe] {ON|OFF}       → Enable OCP
:SOURce:CURRent:PROTection[:STATe]?
:SOURce:CURRent:PROTection:DELay <time>           → OCP delay (s)
:SOURce:CURRent:PROTection:DELay?
:SOURce:CURRent:PROTection:TRIPped?               → Query OCP trip
:SOURce:CURRent:PROTection:CLEar                  → Clear OCP trip
```

---

## Constant Voltage (CV) Mode

### Voltage Setpoint

```
:SOURce:VOLTage[:LEVel][:IMMediate] <voltage>     → Set voltage (V)
:SOURce:VOLTage[:LEVel][:IMMediate]?              → Query voltage setpoint
:SOURce:VOLTage[:LEVel][:IMMediate]? MINimum
:SOURce:VOLTage[:LEVel][:IMMediate]? MAXimum
```

### Voltage Range

```
:SOURce:VOLTage:RANGe {<value>|MINimum|MAXimum}   → Set range
:SOURce:VOLTage:RANGe?                            → Query range
```

**Available Ranges:** 15V, 150V

### Voltage Protection (OVP)

```
:SOURce:VOLTage:PROTection:LEVel <voltage>        → OVP threshold (V)
:SOURce:VOLTage:PROTection:LEVel?
:SOURce:VOLTage:PROTection[:STATe] {ON|OFF}       → Enable OVP
:SOURce:VOLTage:PROTection[:STATe]?
:SOURce:VOLTage:PROTection:TRIPped?               → Query OVP trip
:SOURce:VOLTage:PROTection:CLEar                  → Clear OVP trip
```

### Current Limit in CV Mode

```
:SOURce:VOLTage:ILIMit <current>                  → Current limit (A)
:SOURce:VOLTage:ILIMit?
```

---

## Constant Resistance (CR) Mode

### Resistance Setpoint

```
:SOURce:RESistance[:LEVel][:IMMediate] <ohms>     → Set resistance (Ω)
:SOURce:RESistance[:LEVel][:IMMediate]?           → Query resistance
:SOURce:RESistance[:LEVel][:IMMediate]? MINimum
:SOURce:RESistance[:LEVel][:IMMediate]? MAXimum
```

### Resistance Range

```
:SOURce:RESistance:RANGe {<value>|MINimum|MAXimum}
:SOURce:RESistance:RANGe?
```

**Available Ranges:** Varies by voltage/current range

---

## Constant Power (CP) Mode

### Power Setpoint

```
:SOURce:POWer[:LEVel][:IMMediate] <watts>         → Set power (W)
:SOURce:POWer[:LEVel][:IMMediate]?                → Query power
:SOURce:POWer[:LEVel][:IMMediate]? MINimum
:SOURce:POWer[:LEVel][:IMMediate]? MAXimum
```

### Power Protection (OPP)

```
:SOURce:POWer:PROTection:LEVel <watts>            → OPP threshold (W)
:SOURce:POWer:PROTection:LEVel?
:SOURce:POWer:PROTection[:STATe] {ON|OFF}         → Enable OPP
:SOURce:POWer:PROTection[:STATe]?
:SOURce:POWer:PROTection:TRIPped?                 → Query OPP trip
:SOURce:POWer:PROTection:CLEar                    → Clear OPP trip
```

---

## Measurements

### Immediate Measurements

```
:MEASure[:SCALar]:VOLTage[:DC]?                   → Measure voltage (V)
:MEASure[:SCALar]:CURRent[:DC]?                   → Measure current (A)
:MEASure[:SCALar]:POWer[:DC]?                     → Measure power (W)
:MEASure[:SCALar]:RESistance[:DC]?                → Calculate resistance (Ω)
:MEASure[:SCALar]:ALL[:DC]?                       → All measurements
```

**MEASure:ALL? Response:** `<voltage>,<current>,<power>,<resistance>`

### Fetch (Last Reading)

```
:FETCh[:SCALar]:VOLTage[:DC]?                     → Last voltage
:FETCh[:SCALar]:CURRent[:DC]?                     → Last current
:FETCh[:SCALar]:POWer[:DC]?                       → Last power
```

---

## Transient (Dynamic) Mode

### Transient Mode Selection

```
:SOURce:CURRent:TRANsient:MODE {CONTinuous|PULSe|TOGGle}
:SOURce:CURRent:TRANsient:MODE?
```

- **CONTinuous**: Repeating A↔B oscillation
- **PULSe**: Single A→B→A on trigger
- **TOGGle**: Alternate A↔B on each trigger

### Transient Levels

```
:SOURce:CURRent:TRANsient:ALEVel <current>        → Level A (A)
:SOURce:CURRent:TRANsient:ALEVel?
:SOURce:CURRent:TRANsient:BLEVel <current>        → Level B (A)
:SOURce:CURRent:TRANsient:BLEVel?
```

### Transient Timing

```
:SOURce:CURRent:TRANsient:AWIDth <time>           → Time at level A (s)
:SOURce:CURRent:TRANsient:AWIDth?
:SOURce:CURRent:TRANsient:BWIDth <time>           → Time at level B (s)
:SOURce:CURRent:TRANsient:BWIDth?
```

### Transient Slew Rates

```
:SOURce:CURRent:TRANsient:ARISe <rate>            → A→B slew (A/µs)
:SOURce:CURRent:TRANsient:ARISe?
:SOURce:CURRent:TRANsient:BFALl <rate>            → B→A slew (A/µs)
:SOURce:CURRent:TRANsient:BFALl?
```

### Enable Transient

```
:SOURce:TRANsient[:STATe] {ON|OFF}                → Enable transient mode
:SOURce:TRANsient[:STATe]?
```

---

## List (Sequence) Mode

### List Configuration

```
:SOURce:LIST:MODE {CURRent|VOLTage|RESistance|POWer}  → List mode type
:SOURce:LIST:MODE?
:SOURce:LIST:COUNt <n>                            → Loop count (0 = infinite)
:SOURce:LIST:COUNt?
:SOURce:LIST:STEP <n>                             → Number of steps (1-512)
:SOURce:LIST:STEP?
```

### List Step Programming

```
:SOURce:LIST:CURRent <step>,<current>             → Set step current (A)
:SOURce:LIST:CURRent? <step>                      → Query step current
:SOURce:LIST:VOLTage <step>,<voltage>             → Set step voltage (V)
:SOURce:LIST:VOLTage? <step>
:SOURce:LIST:RESistance <step>,<ohms>             → Set step resistance (Ω)
:SOURce:LIST:RESistance? <step>
:SOURce:LIST:POWer <step>,<watts>                 → Set step power (W)
:SOURce:LIST:POWer? <step>
:SOURce:LIST:WIDth <step>,<time>                  → Set step duration (s)
:SOURce:LIST:WIDth? <step>
:SOURce:LIST:SLEW <step>,<rate>                   → Set step slew (A/µs)
:SOURce:LIST:SLEW? <step>
```

### List Execution

```
:SOURce:LIST[:STATe] {ON|OFF}                     → Enable list mode
:SOURce:LIST[:STATe]?
:SOURce:LIST:SAVe <n>                             → Save list (1-7)
:SOURce:LIST:RECall <n>                           → Recall list (1-7)
```

---

## Battery Test Mode

### Battery Configuration

```
:SOURce:BATTery:MODE {CC|CR|CP}                   → Discharge mode
:SOURce:BATTery:MODE?
:SOURce:BATTery:CURRent <current>                 → CC discharge current (A)
:SOURce:BATTery:CURRent?
:SOURce:BATTery:RESistance <ohms>                 → CR discharge resistance (Ω)
:SOURce:BATTery:RESistance?
:SOURce:BATTery:POWer <watts>                     → CP discharge power (W)
:SOURce:BATTery:POWer?
```

### Battery Stop Conditions

```
:SOURce:BATTery:VOLTage <voltage>                 → Stop voltage (V)
:SOURce:BATTery:VOLTage?
:SOURce:BATTery:CAPacity <Ah>                     → Stop capacity (Ah)
:SOURce:BATTery:CAPacity?
:SOURce:BATTery:TIMeout <seconds>                 → Stop time (s)
:SOURce:BATTery:TIMeout?
```

### Battery Measurements

```
:SOURce:BATTery:DISCharge:CAPacity?               → Discharged capacity (Ah)
:SOURce:BATTery:DISCharge:TIME?                   → Discharge time (s)
:SOURce:BATTery:DISCharge:ENERgy?                 → Discharged energy (Wh)
```

### Battery Control

```
:SOURce:BATTery[:STATe] {ON|OFF}                  → Start/stop battery test
:SOURce:BATTery[:STATe]?
:SOURce:BATTery:CLEar                             → Clear battery data
```

---

## LED Test Mode

### LED Configuration

```
:SOURce:LED:MODE {CC|CV|CR}                       → LED test mode
:SOURce:LED:MODE?
:SOURce:LED:VD <voltage>                          → LED forward voltage (V)
:SOURce:LED:VD?
:SOURce:LED:RD <ohms>                             → LED dynamic resistance (Ω)
:SOURce:LED:RD?
:SOURce:LED:CURRent <current>                     → LED current (A)
:SOURce:LED:CURRent?
```

### LED Control

```
:SOURce:LED[:STATe] {ON|OFF}                      → Enable LED mode
:SOURce:LED[:STATe]?
```

---

## Trigger System

### Trigger Source

```
:TRIGger[:SEQuence]:SOURce {IMMediate|BUS|EXTernal|MANual}
:TRIGger[:SEQuence]:SOURce?
```

- **IMMediate**: Trigger immediately
- **BUS**: Wait for *TRG command
- **EXTernal**: External trigger input
- **MANual**: Front panel trigger button

### Trigger Control

```
:INITiate[:IMMediate]                             → Arm trigger
:ABORt                                            → Abort operation
*TRG                                              → Software trigger
```

---

## System Commands

### Error Query

```
:SYSTem:ERRor[:NEXT]?                             → Get next error
:SYSTem:ERRor:COUNt?                              → Error count
:SYSTem:ERRor:CLEar                               → Clear errors
```

### Beeper

```
:SYSTem:BEEPer[:STATe] {ON|OFF}                   → Enable beeper
:SYSTem:BEEPer:IMMediate                          → Beep once
```

### Remote/Local

```
:SYSTem:LOCal                                     → Local mode
:SYSTem:REMote                                    → Remote mode
:SYSTem:RWLock                                    → Remote with lockout
:SYSTem:KLOCk {ON|OFF}                            → Key lock
```

### Power-On State

```
:SYSTem:PON:STATe {RST|RCL0}                      → Power-on state
:SYSTem:PON:STATe?
```

- **RST**: Power on to default
- **RCL0**: Power on to last state

---

## LAN Configuration

```
:SYSTem:COMMunicate:LAN:IPADdress "<address>"     → Set IP
:SYSTem:COMMunicate:LAN:IPADdress?
:SYSTem:COMMunicate:LAN:SMASk "<mask>"            → Subnet mask
:SYSTem:COMMunicate:LAN:GATeway "<gateway>"       → Gateway
:SYSTem:COMMunicate:LAN:DHCP {ON|OFF}             → DHCP enable
:SYSTem:COMMunicate:LAN:MAC?                      → MAC address
:SYSTem:COMMunicate:LAN:APPLy                     → Apply settings
```

---

## Status System

### Status Registers

```
:STATus:QUEStionable[:EVENt]?                     → Questionable status
:STATus:QUEStionable:CONDition?                   → Condition register
:STATus:QUEStionable:ENABle <mask>                → Enable mask
:STATus:OPERation[:EVENt]?                        → Operation status
:STATus:OPERation:CONDition?
:STATus:OPERation:ENABle <mask>
```

### Questionable Status Bits

| Bit | Value | Meaning |
|-----|-------|---------|
| 0 | 1 | Over voltage (OVP) |
| 1 | 2 | Over current (OCP) |
| 2 | 4 | Over power (OPP) |
| 3 | 8 | Over temperature (OTP) |
| 4 | 16 | Reverse voltage |
| 9 | 512 | CC mode active |
| 10 | 1024 | CV mode active |

---

## Programming Examples

### Basic CC Mode

```
*RST                             # Reset
:SOUR:FUNC CURR                  # CC mode
:SOUR:CURR 1.5                   # Set 1.5A
:SOUR:CURR:SLEW 0.5              # 0.5 A/µs slew
:INP ON                          # Enable input
:MEAS:VOLT?                      # Measure voltage
:MEAS:CURR?                      # Measure current
:MEAS:POW?                       # Measure power
:INP OFF                         # Disable input
```

### CV Mode with Current Limit

```
*RST
:SOUR:FUNC VOLT                  # CV mode
:SOUR:VOLT 12.0                  # Set 12V
:SOUR:VOLT:ILIM 5.0              # 5A current limit
:INP ON
:MEAS:ALL?                       # Get all measurements
```

### Dynamic Load Test

```
*RST
:SOUR:FUNC CURR                  # CC mode
:SOUR:CURR:TRAN:MODE CONT        # Continuous oscillation
:SOUR:CURR:TRAN:ALEV 0.5         # Level A = 0.5A
:SOUR:CURR:TRAN:BLEV 2.0         # Level B = 2.0A
:SOUR:CURR:TRAN:AWID 0.001       # 1ms at level A
:SOUR:CURR:TRAN:BWID 0.001       # 1ms at level B
:SOUR:CURR:TRAN:ARIS 2.5         # Fast rise
:SOUR:CURR:TRAN:BFAL 2.5         # Fast fall
:SOUR:TRAN ON                    # Enable transient
:INP ON                          # Start
```

### Battery Discharge Test

```
*RST
:SOUR:BATT:MODE CC               # CC discharge
:SOUR:BATT:CURR 1.0              # 1A discharge
:SOUR:BATT:VOLT 2.8              # Stop at 2.8V
:SOUR:BATT:CAP 2.0               # Stop at 2Ah
:SOUR:BATT:TIM 7200              # Max 2 hours
:SOUR:BATT ON                    # Start test
# ... wait ...
:SOUR:BATT:DISCH:CAP?            # Query capacity
:SOUR:BATT:DISCH:TIME?           # Query time
:SOUR:BATT:DISCH:ENER?           # Query energy
:SOUR:BATT OFF                   # Stop test
```

### List Mode Sequence

```
*RST
:SOUR:LIST:MODE CURR             # CC list mode
:SOUR:LIST:STEP 5                # 5 steps
:SOUR:LIST:CURR 1,0.5            # Step 1: 0.5A
:SOUR:LIST:WID 1,1.0             # Step 1: 1s duration
:SOUR:LIST:CURR 2,1.0            # Step 2: 1.0A
:SOUR:LIST:WID 2,1.0             # Step 2: 1s
:SOUR:LIST:CURR 3,1.5            # Step 3: 1.5A
:SOUR:LIST:WID 3,1.0             # Step 3: 1s
:SOUR:LIST:CURR 4,2.0            # Step 4: 2.0A
:SOUR:LIST:WID 4,1.0             # Step 4: 1s
:SOUR:LIST:CURR 5,0.0            # Step 5: 0A
:SOUR:LIST:WID 5,0.5             # Step 5: 0.5s
:SOUR:LIST:COUN 3                # Repeat 3 times
:SOUR:LIST ON                    # Start list
:INP ON
```

---

## Connection Examples

### Python Socket

```python
import socket
import time

def rigol_load_query(host, command, port=5555):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(5)
        s.connect((host, port))
        s.sendall((command + '\n').encode())
        time.sleep(0.05)
        return s.recv(4096).decode().strip()

# Example
idn = rigol_load_query('192.168.1.100', '*IDN?')
print(idn)

# CC mode example
rigol_load_query('192.168.1.100', ':SOUR:FUNC CURR')
rigol_load_query('192.168.1.100', ':SOUR:CURR 2.0')
rigol_load_query('192.168.1.100', ':INP ON')
voltage = float(rigol_load_query('192.168.1.100', ':MEAS:VOLT?'))
print(f"Voltage: {voltage} V")
```

### TypeScript with visa-ts

```typescript
import { createResourceManager } from 'visa-ts';

async function testWithRigolLoad() {
  const rm = createResourceManager();
  const load = await rm.open('TCPIP0::192.168.1.100::5555::SOCKET');

  await load.write(':SOUR:FUNC CURR');
  await load.write(':SOUR:CURR 2.0');
  await load.write(':INP ON');

  const result = await load.query(':MEAS:ALL?');
  if (result.ok) {
    const [voltage, current, power, resistance] = result.value.split(',').map(parseFloat);
    console.log(`V: ${voltage}V, I: ${current}A, P: ${power}W, R: ${resistance}Ω`);
  }

  await load.write(':INP OFF');
  await load.close();
}
```

---

## Notes

1. **Port 5555**: Rigol uses port 5555 for SCPI socket connections.

2. **Slew Rate Units**: Rigol uses A/µs for current slew rate, not A/s.

3. **List Steps**: Maximum 512 steps in list mode.

4. **Colon Prefix**: Commands should start with colon (`:SOUR:FUNC`) for clarity.

5. **Battery Test**: Records Ah, Wh, and time; multiple stop conditions available.

6. **A Suffix Models**: DL3021A/DL3031A add waveform display capability.

7. **Transient Mode**: Use for testing power supply transient response.

8. **Protection**: OVP/OCP/OPP all have programmable thresholds and delays.
