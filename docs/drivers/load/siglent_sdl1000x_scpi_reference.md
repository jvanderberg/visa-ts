# Siglent SDL1000X Electronic Load SCPI Reference

> Siglent SDL1020X, SDL1020X-E, SDL1030X, SDL1030X-E Series

## Supported Models

| Model | Power | Voltage | Current | Resolution | Features |
|-------|-------|---------|---------|------------|----------|
| SDL1020X-E | 200W | 150V | 30A | 0.1mA | Basic |
| SDL1020X | 200W | 150V | 30A | 0.1mA | + Transient waveform |
| SDL1030X-E | 300W | 150V | 30A | 0.1mA | Higher power |
| SDL1030X | 300W | 150V | 30A | 0.1mA | + Transient waveform |

**Key Features (all models):**
- CC/CV/CR/CP/LED operating modes
- Dynamic (transient) mode
- List (sequence) mode up to 512 steps
- Battery discharge test with Ah/Wh logging
- Short circuit simulation
- OCP/OVP/OPP/OTP protection
- Von/Voff voltage thresholds

---

## Connection Methods

| Interface | Details |
|-----------|---------|
| USB | USB-TMC (VID: 0xF4EC) |
| LAN | Port **5025** (SCPI raw socket) |

**Resource String Examples:**
```
USB0::0xF4EC::0x1430::SDL1XXXXXXXXX::INSTR
TCPIP0::192.168.1.100::5025::SOCKET
TCPIP0::192.168.1.100::inst0::INSTR
```

---

## IEEE 488.2 Common Commands

```
*IDN?                → "Siglent Technologies,SDL1030X,SDL1XXXXXXXXX,1.1.1.5"
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
*SAV <n>             → Save state to memory (0-9)
*RCL <n>             → Recall state from memory (0-9)
*TRG                 → Software trigger
*WAI                 → Wait for operations complete
```

---

## Input Control

### Enable/Disable Load Input

```
:INPut[:STATe] {ON|OFF|1|0}                       → Enable/disable input
:INPut[:STATe]?                                   → Query input state
```

### Short Circuit Mode

```
:SOURce:SHORt[:STATe] {ON|OFF}                    → Enable short circuit
:SOURce:SHORt[:STATe]?                            → Query short state
```

**Note:** Siglent uses `:SOURce:SHORt` not `:INPut:SHORt`.

---

## Operating Mode

### Mode Selection

```
:SOURce:FUNCtion {CURRent|VOLTage|RESistance|POWer|LED}
:SOURce:FUNCtion?
```

**Short forms:** `CURR`, `VOLT`, `RES`, `POW`, `LED`

---

## Constant Current (CC) Mode

### Current Setpoint

```
:SOURce:CURRent[:LEVel][:IMMediate] <current>     → Set current (A)
:SOURce:CURRent[:LEVel][:IMMediate]?              → Query current
:SOURce:CURRent[:LEVel][:IMMediate]? MINimum
:SOURce:CURRent[:LEVel][:IMMediate]? MAXimum
```

### Current Range

```
:SOURce:CURRent:RANGe {HIGH|LOW|<value>}          → Set range
:SOURce:CURRent:RANGe?                            → Query range
```

**Available Ranges:**
- LOW: 3A (0-3A, higher resolution)
- HIGH: 30A (0-30A)

### Current Slew Rate

```
:SOURce:CURRent:SLEW[:BOTH] <rate>                → Set slew rate (A/µs)
:SOURce:CURRent:SLEW[:BOTH]?                      → Query slew rate
:SOURce:CURRent:SLEW:RISe <rate>                  → Rising slew
:SOURce:CURRent:SLEW:FALL <rate>                  → Falling slew
```

**Range:** 0.001 to 2.5 A/µs

### Current Protection (OCP)

```
:SOURce:CURRent:PROTection[:LEVel] <current>      → OCP threshold
:SOURce:CURRent:PROTection[:LEVel]?
:SOURce:CURRent:PROTection:STATe {ON|OFF}         → Enable OCP
:SOURce:CURRent:PROTection:STATe?
:SOURce:CURRent:PROTection:DELay <time>           → OCP delay (s)
:SOURce:CURRent:PROTection:DELay?
```

---

## Constant Voltage (CV) Mode

### Voltage Setpoint

```
:SOURce:VOLTage[:LEVel][:IMMediate] <voltage>     → Set voltage (V)
:SOURce:VOLTage[:LEVel][:IMMediate]?              → Query voltage
:SOURce:VOLTage[:LEVel][:IMMediate]? MINimum
:SOURce:VOLTage[:LEVel][:IMMediate]? MAXimum
```

### Voltage Range

```
:SOURce:VOLTage:RANGe {HIGH|LOW|<value>}          → Set range
:SOURce:VOLTage:RANGe?
```

**Available Ranges:**
- LOW: 36V (higher resolution)
- HIGH: 150V

### Voltage Protection (OVP)

```
:SOURce:VOLTage:PROTection[:LEVel] <voltage>      → OVP threshold
:SOURce:VOLTage:PROTection:STATe {ON|OFF}         → Enable OVP
:SOURce:VOLTage:PROTection:DELay <time>           → OVP delay
```

### Current Limit in CV Mode

```
:SOURce:VOLTage:LIMit:CURRent <current>           → Max current (A)
:SOURce:VOLTage:LIMit:CURRent?
```

---

## Constant Resistance (CR) Mode

### Resistance Setpoint

```
:SOURce:RESistance[:LEVel][:IMMediate] <ohms>     → Set resistance (Ω)
:SOURce:RESistance[:LEVel][:IMMediate]?           → Query resistance
```

### Resistance Range

```
:SOURce:RESistance:RANGe {HIGH|LOW|<value>}       → Set range
:SOURce:RESistance:RANGe?
```

---

## Constant Power (CP) Mode

### Power Setpoint

```
:SOURce:POWer[:LEVel][:IMMediate] <watts>         → Set power (W)
:SOURce:POWer[:LEVel][:IMMediate]?                → Query power
```

### Power Protection (OPP)

```
:SOURce:POWer:PROTection[:LEVel] <watts>          → OPP threshold
:SOURce:POWer:PROTection:STATe {ON|OFF}           → Enable OPP
```

---

## LED Test Mode

LED mode simulates LED driver loading:

### LED Configuration

```
:SOURce:LED:MODE {CC|CV|CR|CP}                    → LED test mode
:SOURce:LED:MODE?
:SOURce:LED:VD <voltage>                          → LED Vf (V)
:SOURce:LED:VD?
:SOURce:LED:RD <ohms>                             → LED Rd (Ω)
:SOURce:LED:RD?
:SOURce:LED:IAuto {ON|OFF}                        → Auto current
:SOURce:LED:IAuto?
```

### Enable LED Mode

```
:SOURce:LED[:STATe] {ON|OFF}                      → Enable LED mode
:SOURce:LED[:STATe]?
```

---

## Von/Voff Thresholds

Control when load activates based on input voltage:

```
:SOURce:VOLTage:ON <voltage>                      → Von threshold (V)
:SOURce:VOLTage:ON?
:SOURce:VOLTage:OFF <voltage>                     → Voff threshold (V)
:SOURce:VOLTage:OFF?
```

- **Von**: Voltage above which load activates
- **Voff**: Voltage below which load deactivates

---

## Measurements

### Immediate Measurements

```
:MEASure[:SCALar]:VOLTage[:DC]?                   → Measure voltage (V)
:MEASure[:SCALar]:CURRent[:DC]?                   → Measure current (A)
:MEASure[:SCALar]:POWer[:DC]?                     → Measure power (W)
:MEASure[:SCALar]:RESistance[:DC]?                → Calculate resistance (Ω)
```

### Fetch (Last Reading)

```
:FETCh[:SCALar]:VOLTage[:DC]?
:FETCh[:SCALar]:CURRent[:DC]?
:FETCh[:SCALar]:POWer[:DC]?
```

---

## Transient (Dynamic) Mode

### Transient Mode Selection

```
:SOURce:CURRent:TRANsient:MODE {CONTinuous|PULSe|TOGGle}
:SOURce:CURRent:TRANsient:MODE?
```

### Transient Levels

```
:SOURce:CURRent:TRANsient:ALEVel <current>        → Level A (A)
:SOURce:CURRent:TRANsient:ALEVel?
:SOURce:CURRent:TRANsient:BLEVel <current>        → Level B (A)
:SOURce:CURRent:TRANsient:BLEVel?
```

### Transient Timing

```
:SOURce:CURRent:TRANsient:AWIDth <time>           → Time at A (s)
:SOURce:CURRent:TRANsient:BWIDth <time>           → Time at B (s)
```

### Transient Slew

```
:SOURce:CURRent:TRANsient:ARISe <rate>            → A→B slew (A/µs)
:SOURce:CURRent:TRANsient:BFALl <rate>            → B→A slew (A/µs)
```

### Enable Transient

```
:SOURce:TRANsient[:STATe] {ON|OFF}                → Enable transient
:SOURce:TRANsient[:STATe]?
```

---

## List (Sequence) Mode

### List Configuration

```
:SOURce:LIST:MODE {CURRent|VOLTage|RESistance|POWer}
:SOURce:LIST:MODE?
:SOURce:LIST:COUNt <n>                            → Loop count (0 = infinite)
:SOURce:LIST:COUNt?
:SOURce:LIST:STEP <n>                             → Number of steps (1-512)
:SOURce:LIST:STEP?
```

### Step Programming

```
:SOURce:LIST:CURRent <step>,<current>             → Set step current
:SOURce:LIST:CURRent? <step>
:SOURce:LIST:VOLTage <step>,<voltage>             → Set step voltage
:SOURce:LIST:VOLTage? <step>
:SOURce:LIST:RESistance <step>,<ohms>             → Set step resistance
:SOURce:LIST:RESistance? <step>
:SOURce:LIST:POWer <step>,<watts>                 → Set step power
:SOURce:LIST:POWer? <step>
:SOURce:LIST:WIDth <step>,<time>                  → Set step duration (s)
:SOURce:LIST:WIDth? <step>
:SOURce:LIST:SLEW <step>,<rate>                   → Set step slew
:SOURce:LIST:SLEW? <step>
```

### List Control

```
:SOURce:LIST[:STATe] {ON|OFF}                     → Enable list mode
:SOURce:LIST[:STATe]?
:SOURce:LIST:SAVe <n>                             → Save list (1-10)
:SOURce:LIST:RECall <n>                           → Recall list (1-10)
```

---

## Battery Test Mode

### Battery Configuration

```
:SOURce:BATTery:LEVel <current>                   → Discharge current (A)
:SOURce:BATTery:LEVel?
:SOURce:BATTery:VOLTage <voltage>                 → Stop voltage (V)
:SOURce:BATTery:VOLTage?
:SOURce:BATTery:CAP <Ah>                          → Stop capacity (Ah)
:SOURce:BATTery:CAP?
:SOURce:BATTery:TIMer <seconds>                   → Stop time (s)
:SOURce:BATTery:TIMer?
```

### Battery Measurements

```
:SOURce:BATTery:AH?                               → Discharged Ah
:SOURce:BATTery:WH?                               → Discharged Wh
:SOURce:BATTery:RUNTime?                          → Elapsed time (s)
```

### Battery Control

```
:SOURce:BATTery[:STATe] {ON|OFF}                  → Start/stop test
:SOURce:BATTery[:STATe]?
```

---

## Trigger System

### Trigger Source

```
:TRIGger[:SEQuence]:SOURce {IMMediate|BUS|EXTernal}
:TRIGger[:SEQuence]:SOURce?
```

### Trigger Control

```
:INITiate[:IMMediate]                             → Arm trigger
:ABORt                                            → Abort
*TRG                                              → Software trigger
```

---

## System Commands

### Error Query

```
:SYSTem:ERRor[:NEXT]?                             → Get next error
```

### Beeper

```
:SYSTem:BEEPer[:STATe] {ON|OFF}                   → Enable beeper
:SYSTem:BEEPer[:STATe]?
```

### Remote/Local

```
:SYSTem:LOCal                                     → Local mode
:SYSTem:REMote                                    → Remote mode
:SYSTem:KLOCk {ON|OFF}                            → Key lock
```

### Display

```
:DISPlay:BRIGhtness <0-100>                       → Set brightness
:DISPlay:BRIGhtness?
```

---

## LAN Configuration

```
:SYSTem:COMMunicate:LAN:IPADdress "<address>"
:SYSTem:COMMunicate:LAN:IPADdress?
:SYSTem:COMMunicate:LAN:SMASk "<mask>"
:SYSTem:COMMunicate:LAN:GATeway "<gateway>"
:SYSTem:COMMunicate:LAN:DHCP {ON|OFF}
:SYSTem:COMMunicate:LAN:MAC?
```

---

## Status System

### Status Registers

```
:STATus:QUEStionable[:EVENt]?                     → Questionable status
:STATus:QUEStionable:CONDition?
:STATus:QUEStionable:ENABle <mask>
:STATus:OPERation[:EVENt]?                        → Operation status
:STATus:OPERation:CONDition?
:STATus:OPERation:ENABle <mask>
```

---

## Programming Examples

### Basic CC Mode

```
*RST                             # Reset
:SOUR:FUNC CURR                  # CC mode
:SOUR:CURR:RANG HIGH             # 30A range
:SOUR:CURR 2.0                   # Set 2A
:INP ON                          # Enable input
:MEAS:VOLT?                      # Measure voltage
:MEAS:POW?                       # Measure power
:INP OFF                         # Disable input
```

### CV Mode with Current Limit

```
*RST
:SOUR:FUNC VOLT                  # CV mode
:SOUR:VOLT 12.0                  # Set 12V
:SOUR:VOLT:LIM:CURR 5.0          # 5A max current
:INP ON
:MEAS:CURR?                      # Measure current
```

### LED Driver Test

```
*RST
:SOUR:FUNC LED                   # LED mode
:SOUR:LED:MODE CC                # CC in LED mode
:SOUR:LED:VD 3.0                 # LED Vf = 3V
:SOUR:LED:RD 1.5                 # LED Rd = 1.5Ω
:SOUR:LED ON                     # Enable LED mode
:INP ON                          # Enable input
:MEAS:VOLT?                      # Measure actual voltage
:MEAS:CURR?                      # Measure current
```

### Dynamic Load Test

```
*RST
:SOUR:FUNC CURR
:SOUR:CURR:TRAN:MODE CONT        # Continuous
:SOUR:CURR:TRAN:ALEV 0.5         # 0.5A
:SOUR:CURR:TRAN:BLEV 2.0         # 2.0A
:SOUR:CURR:TRAN:AWID 0.001       # 1ms
:SOUR:CURR:TRAN:BWID 0.001       # 1ms
:SOUR:CURR:TRAN:ARIS 2.5         # Fast slew
:SOUR:CURR:TRAN:BFAL 2.5
:SOUR:TRAN ON                    # Enable transient
:INP ON                          # Start
```

### Battery Discharge Test

```
*RST
:SOUR:BATT:LEV 1.0               # 1A discharge
:SOUR:BATT:VOLT 2.8              # Stop at 2.8V
:SOUR:BATT:CAP 2.0               # Stop at 2Ah
:SOUR:BATT:TIM 7200              # Max 2 hours
:SOUR:BATT ON                    # Start test
# ... wait ...
:SOUR:BATT:AH?                   # Query Ah
:SOUR:BATT:WH?                   # Query Wh
:SOUR:BATT:RUNT?                 # Query time
:SOUR:BATT OFF                   # Stop
```

### Von/Voff Power Supply Startup Test

```
*RST
:SOUR:FUNC CURR
:SOUR:CURR 2.0                   # 2A load
:SOUR:VOLT:ON 4.5                # Activate above 4.5V
:SOUR:VOLT:OFF 4.0               # Deactivate below 4.0V
:INP ON
# Load will automatically activate when PSU reaches 4.5V
# and deactivate if PSU drops below 4.0V
```

---

## Connection Examples

### Python Socket

```python
import socket
import time

def siglent_load_query(host, command, port=5025):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(5)
        s.connect((host, port))
        s.sendall((command + '\n').encode())
        time.sleep(0.05)
        return s.recv(4096).decode().strip()

# Example
idn = siglent_load_query('192.168.1.100', '*IDN?')
print(idn)

# CC mode example
siglent_load_query('192.168.1.100', ':SOUR:FUNC CURR')
siglent_load_query('192.168.1.100', ':SOUR:CURR 2.0')
siglent_load_query('192.168.1.100', ':INP ON')
voltage = float(siglent_load_query('192.168.1.100', ':MEAS:VOLT?'))
print(f"Voltage: {voltage} V")
```

### TypeScript with visa-ts

```typescript
import { createResourceManager } from 'visa-ts';

async function testWithSiglentLoad() {
  const rm = createResourceManager();
  const load = await rm.open('TCPIP0::192.168.1.100::5025::SOCKET');

  await load.write(':SOUR:FUNC CURR');
  await load.write(':SOUR:CURR 2.0');
  await load.write(':INP ON');

  const voltageResult = await load.query(':MEAS:VOLT?');
  const currentResult = await load.query(':MEAS:CURR?');
  const powerResult = await load.query(':MEAS:POW?');

  if (voltageResult.ok && currentResult.ok && powerResult.ok) {
    console.log(`V: ${parseFloat(voltageResult.value)}V`);
    console.log(`I: ${parseFloat(currentResult.value)}A`);
    console.log(`P: ${parseFloat(powerResult.value)}W`);
  }

  await load.write(':INP OFF');
  await load.close();
}
```

---

## Notes

1. **Port 5025**: Siglent uses standard port 5025 (same as Keysight).

2. **Short Circuit**: Use `:SOURce:SHORt` not `:INPut:SHORt`.

3. **LED Mode**: Unique mode for testing LED drivers with Vf/Rd parameters.

4. **Von/Voff**: Useful for testing power supply startup/shutdown behavior.

5. **X vs X-E Models**: Non-E models include transient waveform display.

6. **List Steps**: Maximum 512 steps per list sequence.

7. **Slew Rate**: Specified in A/µs (microseconds).

8. **Battery Test**: Logs both Ah and Wh during discharge.
