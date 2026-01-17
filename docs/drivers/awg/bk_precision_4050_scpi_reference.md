# BK Precision 4050 Series AWG SCPI Reference

> BK Precision 4050, 4060, 4070 Series Function/Arbitrary Waveform Generators

## Supported Models

### 4050 Series (Entry/Basic)

| Model | Channels | Max Freq | Sample Rate | Arb Memory | Features |
|-------|----------|----------|-------------|------------|----------|
| 4052 | 2 | 5 MHz | 125 MSa/s | 16 kpts | USB |
| 4053 | 2 | 10 MHz | 125 MSa/s | 16 kpts | USB |
| 4054B | 2 | 15 MHz | 150 MSa/s | 16 kpts | USB/LAN |
| 4055B | 2 | 30 MHz | 150 MSa/s | 16 kpts | USB/LAN |

### 4060 Series (Mid-Range)

| Model | Channels | Max Freq | Sample Rate | Arb Memory | Features |
|-------|----------|----------|-------------|------------|----------|
| 4063B | 2 | 40 MHz | 200 MSa/s | 512 kpts | USB/LAN |
| 4064B | 2 | 60 MHz | 200 MSa/s | 512 kpts | USB/LAN |
| 4065B | 2 | 80 MHz | 200 MSa/s | 512 kpts | USB/LAN |

### 4070 Series (High Performance)

| Model | Channels | Max Freq | Sample Rate | Arb Memory | Features |
|-------|----------|----------|-------------|------------|----------|
| 4075B | 2 | 50 MHz | 500 MSa/s | 16 Mpts | USB/LAN |
| 4078B | 2 | 80 MHz | 500 MSa/s | 16 Mpts | USB/LAN |

---

## Connection Methods

| Interface | Port/Settings | Resource String Example |
|-----------|---------------|-------------------------|
| USB-TMC | VID:PID 0C97:0016 | `USB0::0x0C97::0x0016::12345678::INSTR` |
| LAN (Raw Socket) | Port 5025 | `TCPIP0::192.168.1.50::5025::SOCKET` |
| LAN (VXI-11) | Port 111 | `TCPIP0::192.168.1.50::INSTR` |

**Note:** BK Precision uses standard port **5025** for raw socket connections.

---

## IEEE 488.2 Common Commands

```
*IDN?                → "B&K Precision,4055B,12345678,1.02"
*RST                 → Reset to default state
*CLS                 → Clear status registers
*ESE <mask>          → Event status enable register
*ESE?                → Query event status enable
*ESR?                → Query event status register
*OPC                 → Operation complete
*OPC?                → Query operation complete (returns 1)
*SRE <mask>          → Service request enable register
*SRE?                → Query service request enable
*STB?                → Query status byte
*TRG                 → Software trigger
*TST?                → Self-test (0 = pass)
*WAI                 → Wait for operations complete
*SAV <n>             → Save state to memory (1-16)
*RCL <n>             → Recall state from memory (1-16)
```

---

## Channel Selection

BK Precision uses `:SOURce<n>:` prefix for channel-specific commands:

```
:SOURce1:...         → Channel 1 commands
:SOURce2:...         → Channel 2 commands
:SOUR1:...           → Short form
:SOUR2:...           → Short form
```

---

## Output Control

### Enable/Disable Output

```
:OUTPut<n>[:STATe] {ON|OFF|1|0}              → Enable/disable output
:OUTPut<n>[:STATe]?                          → Query output state
:OUTPut<n>:POLarity {NORMal|INVerted}        → Output polarity
:OUTPut<n>:POLarity?                         → Query polarity
```

### Output Load Impedance

```
:OUTPut<n>:LOAD {<ohms>|INFinity|MINimum|MAXimum}
:OUTPut<n>:LOAD?                             → Query load setting
```

**Values:** 1Ω to 10kΩ, or `INFinity` for High-Z

---

## Waveform Selection

### Set Waveform Function

```
:SOURce<n>:FUNCtion[:SHAPe] {SINusoid|SQUare|RAMP|PULSe|NOISe|DC|USER}
:SOURce<n>:FUNCtion[:SHAPe]?                 → Query waveform type
```

### Waveform Type Values

| Waveform | Command Value | Abbreviation |
|----------|---------------|--------------|
| Sine | `SINusoid` | `SIN` |
| Square | `SQUare` | `SQU` |
| Ramp | `RAMP` | `RAMP` |
| Pulse | `PULSe` | `PULS` |
| Noise | `NOISe` | `NOIS` |
| DC | `DC` | `DC` |
| Arbitrary | `USER` | `USER` |

---

## Frequency Settings

### Set/Query Frequency

```
:SOURce<n>:FREQuency[:FIXed] <frequency>     → Set frequency (Hz)
:SOURce<n>:FREQuency[:FIXed]?                → Query frequency
:SOURce<n>:FREQuency[:FIXed]? MINimum        → Query minimum
:SOURce<n>:FREQuency[:FIXed]? MAXimum        → Query maximum
```

### Period (Alternative)

```
:SOURce<n>:PERiod[:FIXed] <seconds>          → Set period
:SOURce<n>:PERiod[:FIXed]?                   → Query period
```

---

## Amplitude Settings

### Set Amplitude (Vpp)

```
:SOURce<n>:VOLTage[:LEVel][:IMMediate][:AMPLitude] <vpp>
:SOURce<n>:VOLTage[:LEVel][:IMMediate][:AMPLitude]?
:SOURce<n>:VOLTage?                          → Short form query
```

### Amplitude Units

```
:SOURce<n>:VOLTage:UNIT {VPP|VRMS|DBM}       → Set amplitude unit
:SOURce<n>:VOLTage:UNIT?                     → Query unit
```

### High/Low Level (Alternative)

```
:SOURce<n>:VOLTage:HIGH <voltage>            → Set high level (V)
:SOURce<n>:VOLTage:HIGH?                     → Query high level
:SOURce<n>:VOLTage:LOW <voltage>             → Set low level (V)
:SOURce<n>:VOLTage:LOW?                      → Query low level
```

---

## DC Offset

```
:SOURce<n>:VOLTage:OFFSet <offset>           → Set DC offset (V)
:SOURce<n>:VOLTage:OFFSet?                   → Query offset
```

---

## Phase Settings

```
:SOURce<n>:PHASe[:ADJust] <degrees>          → Set phase (0-360°)
:SOURce<n>:PHASe[:ADJust]?                   → Query phase
:SOURce<n>:PHASe:SYNChronize                 → Synchronize channel phases
```

---

## Square Wave Parameters

### Duty Cycle

```
:SOURce<n>:FUNCtion:SQUare:DCYCle <percent>  → Set duty cycle (1-99%)
:SOURce<n>:FUNCtion:SQUare:DCYCle?           → Query duty cycle
```

---

## Ramp Parameters

### Symmetry

```
:SOURce<n>:FUNCtion:RAMP:SYMMetry <percent>  → Set symmetry (0-100%)
:SOURce<n>:FUNCtion:RAMP:SYMMetry?           → Query symmetry
```

---

## Pulse Parameters

### Pulse Width

```
:SOURce<n>:PULSe:WIDTh <seconds>             → Pulse width
:SOURce<n>:PULSe:WIDTh?                      → Query width
```

### Duty Cycle (Alternative)

```
:SOURce<n>:PULSe:DCYCle <percent>            → Duty cycle
:SOURce<n>:PULSe:DCYCle?                     → Query duty cycle
```

### Edge Times

```
:SOURce<n>:PULSe:TRANsition[:LEADing] <seconds>    → Rise time
:SOURce<n>:PULSe:TRANsition[:LEADing]?             → Query rise time
:SOURce<n>:PULSe:TRANsition:TRAiling <seconds>    → Fall time
:SOURce<n>:PULSe:TRANsition:TRAiling?             → Query fall time
```

### Pulse Delay

```
:SOURce<n>:PULSe:DELay <seconds>             → Delay from trigger
:SOURce<n>:PULSe:DELay?                      → Query delay
```

---

## Modulation

### AM (Amplitude Modulation)

```
:SOURce<n>:AM:STATe {ON|OFF}                 → Enable/disable AM
:SOURce<n>:AM:STATe?                         → Query state
:SOURce<n>:AM[:DEPTh] <percent>              → Modulation depth (0-120%)
:SOURce<n>:AM[:DEPTh]?                       → Query depth
:SOURce<n>:AM:SOURce {INTernal|EXTernal}     → Modulation source
:SOURce<n>:AM:SOURce?                        → Query source
:SOURce<n>:AM:INTernal:FUNCtion {SINusoid|SQUare|RAMP|TRIangle|NOISe|USER}
:SOURce<n>:AM:INTernal:FREQuency <hz>        → Internal mod frequency
```

### FM (Frequency Modulation)

```
:SOURce<n>:FM:STATe {ON|OFF}                 → Enable/disable FM
:SOURce<n>:FM:DEViation <hz>                 → Frequency deviation
:SOURce<n>:FM:DEViation?                     → Query deviation
:SOURce<n>:FM:SOURce {INTernal|EXTernal}     → Modulation source
:SOURce<n>:FM:INTernal:FUNCtion {SINusoid|SQUare|RAMP|TRIangle|NOISe|USER}
:SOURce<n>:FM:INTernal:FREQuency <hz>        → Internal mod frequency
```

### PM (Phase Modulation)

```
:SOURce<n>:PM:STATe {ON|OFF}                 → Enable/disable PM
:SOURce<n>:PM:DEViation <degrees>            → Phase deviation
:SOURce<n>:PM:DEViation?                     → Query deviation
:SOURce<n>:PM:SOURce {INTernal|EXTernal}     → Modulation source
:SOURce<n>:PM:INTernal:FUNCtion {SINusoid|SQUare|RAMP|TRIangle|NOISe|USER}
:SOURce<n>:PM:INTernal:FREQuency <hz>        → Internal mod frequency
```

### FSK (Frequency Shift Keying)

```
:SOURce<n>:FSKey:STATe {ON|OFF}              → Enable/disable FSK
:SOURce<n>:FSKey:FREQuency <hz>              → Hop frequency
:SOURce<n>:FSKey:FREQuency?                  → Query hop frequency
:SOURce<n>:FSKey:SOURce {INTernal|EXTernal}  → Trigger source
:SOURce<n>:FSKey:INTernal:RATE <hz>          → Internal rate
```

### PWM (Pulse Width Modulation)

```
:SOURce<n>:PWM:STATe {ON|OFF}                → Enable/disable PWM
:SOURce<n>:PWM:DEViation {<seconds>|DCYCle <percent>}
:SOURce<n>:PWM:DEViation?                    → Query deviation
:SOURce<n>:PWM:SOURce {INTernal|EXTernal}    → Modulation source
:SOURce<n>:PWM:INTernal:FUNCtion {SINusoid|SQUare|RAMP|TRIangle|NOISe|USER}
:SOURce<n>:PWM:INTernal:FREQuency <hz>       → Internal mod frequency
```

---

## Sweep

### Enable/Configure Sweep

```
:SOURce<n>:SWEep:STATe {ON|OFF}              → Enable/disable sweep
:SOURce<n>:SWEep:STATe?                      → Query state
:SOURce<n>:SWEep:SPACing {LINear|LOGarithmic}  → Sweep type
:SOURce<n>:SWEep:SPACing?                    → Query type
```

### Frequency Range

```
:SOURce<n>:FREQuency:STARt <hz>              → Start frequency
:SOURce<n>:FREQuency:STARt?                  → Query start
:SOURce<n>:FREQuency:STOP <hz>               → Stop frequency
:SOURce<n>:FREQuency:STOP?                   → Query stop
:SOURce<n>:FREQuency:CENTer <hz>             → Center frequency
:SOURce<n>:FREQuency:SPAN <hz>               → Frequency span
```

### Sweep Timing

```
:SOURce<n>:SWEep:TIME <seconds>              → Sweep time
:SOURce<n>:SWEep:TIME?                       → Query sweep time
:SOURce<n>:SWEep:HTIMe <seconds>             → Hold time
:SOURce<n>:SWEep:RTIMe <seconds>             → Return time
```

### Sweep Trigger

```
:SOURce<n>:SWEep:TRIGger:SOURce {INTernal|EXTernal|MANual}
:SOURce<n>:SWEep:TRIGger:SOURce?             → Query trigger source
:SOURce<n>:SWEep:TRIGger:SLOPe {POSitive|NEGative}
:SOURce<n>:SWEep:TRIGger[:IMMediate]         → Manual trigger
```

### Sweep Marker

```
:SOURce<n>:MARKer:FREQuency <hz>             → Marker frequency
:SOURce<n>:MARKer:FREQuency?                 → Query marker
:SOURce<n>:MARKer[:STATe] {ON|OFF}           → Enable marker output
```

---

## Burst Mode

### Enable/Configure Burst

```
:SOURce<n>:BURSt:STATe {ON|OFF}              → Enable/disable burst
:SOURce<n>:BURSt:STATe?                      → Query state
:SOURce<n>:BURSt:MODE {TRIGgered|GATed|INFinity}  → Burst mode
:SOURce<n>:BURSt:MODE?                       → Query mode
```

### Burst Parameters

```
:SOURce<n>:BURSt:NCYCles {<count>|INFinity}  → Number of cycles
:SOURce<n>:BURSt:NCYCles?                    → Query count
:SOURce<n>:BURSt:INTernal:PERiod <seconds>   → Internal burst period
:SOURce<n>:BURSt:INTernal:PERiod?            → Query period
:SOURce<n>:BURSt:PHASe <degrees>             → Start phase
:SOURce<n>:BURSt:PHASe?                      → Query phase
:SOURce<n>:BURSt:TDELay <seconds>            → Trigger delay
:SOURce<n>:BURSt:TDELay?                     → Query delay
```

### Burst Trigger

```
:SOURce<n>:BURSt:TRIGger:SOURce {INTernal|EXTernal|MANual}
:SOURce<n>:BURSt:TRIGger:SOURce?             → Query trigger source
:SOURce<n>:BURSt:TRIGger:SLOPe {POSitive|NEGative}
:SOURce<n>:BURSt:TRIGger[:IMMediate]         → Manual trigger
*TRG                                          → Software trigger
```

### Gated Burst

```
:SOURce<n>:BURSt:GATE:POLarity {NORMal|INVerted}
:SOURce<n>:BURSt:IDLE {FPT|TOP|CENTer|BOTTom}  → Idle level
```

---

## Arbitrary Waveforms

### List Available Waveforms

```
:SOURce<n>:FUNCtion:USER:CATalog?            → List user waveforms
:DATA:CATalog?                                → Alternative
```

### Select Arbitrary Waveform

```
:SOURce<n>:FUNCtion:USER "<name>"            → Select waveform
:SOURce<n>:FUNCtion:USER?                    → Query selected
:SOURce<n>:FUNCtion USER                     → Switch to arb mode
```

### Upload Waveform Data

```
:DATA:DATA VOLATILE,<data>                   → Upload float data (-1.0 to +1.0)
:DATA:DAC VOLATILE,#<binary_block>           → Upload DAC values
```

**Data Formats:**
- Float: Comma-separated values from -1.0 to +1.0
- DAC: IEEE 488.2 binary block with 14-bit or 16-bit values

### Sample Rate

```
:SOURce<n>:FUNCtion:ARBitrary:SRATe <rate>   → Set sample rate (Sa/s)
:SOURce<n>:FUNCtion:ARBitrary:SRATe?         → Query sample rate
```

### Delete Waveform

```
:DATA:DELete "<name>"                        → Delete named waveform
:DATA:DELete:ALL                             → Delete all user waveforms
```

### Copy Waveform

```
:DATA:COPY "<dest>",VOLATILE                 → Copy volatile to named
```

---

## Sync Output

### Sync Enable

```
:OUTPut<n>:SYNC[:STATe] {ON|OFF}             → Enable sync output
:OUTPut<n>:SYNC[:STATe]?                     → Query sync state
:OUTPut<n>:SYNC:POLarity {NORMal|INVerted}   → Sync polarity
```

---

## Counter Function (4060/4070 Series)

### Enable Counter

```
:COUNter:STATe {ON|OFF}                      → Enable frequency counter
:COUNter:STATe?                              → Query state
```

### Counter Measurements

```
:COUNter:MEASure:FREQuency?                  → Measure frequency (Hz)
:COUNter:MEASure:PERiod?                     → Measure period (s)
:COUNter:MEASure:DCYCle?                     → Measure duty cycle (%)
:COUNter:MEASure:PWIDth?                     → Measure positive width
:COUNter:MEASure:NWIDth?                     → Measure negative width
```

### Counter Configuration

```
:COUNter:COUPling {AC|DC}                    → Input coupling
:COUNter:SENSitivity {LOW|MEDium|HIGH}       → Trigger sensitivity
:COUNter:TRIGger:LEVel <voltage>             → Trigger level
:COUNter:HF[:STATe] {ON|OFF}                 → High frequency mode
```

---

## System Commands

### Error Query

```
:SYSTem:ERRor[:NEXT]?                        → Get next error
:SYSTem:ERRor:COUNt?                         → Error count
```

### Beeper

```
:SYSTem:BEEPer[:IMMediate]                   → Beep once
:SYSTem:BEEPer:STATe {ON|OFF}                → Enable/disable beeper
```

### Display

```
:DISPlay:BRIGhtness <0-100>                  → Set brightness
:DISPlay:BRIGhtness?                         → Query brightness
:DISPlay[:WINDow]:TEXT "<message>"           → Display message
:DISPlay[:WINDow]:TEXT:CLEar                 → Clear message
```

### Remote/Local

```
:SYSTem:REMote                               → Set remote mode
:SYSTem:LOCal                                → Set local mode
:SYSTem:KLOCk {ON|OFF}                       → Keyboard lock
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
:STATus:QUEStionable[:EVENt]?
:STATus:QUEStionable:CONDition?
:STATus:QUEStionable:ENABle <mask>
:STATus:OPERation[:EVENt]?
:STATus:OPERation:CONDition?
:STATus:OPERation:ENABle <mask>
:STATus:PRESet                               → Preset status system
```

---

## Programming Examples

### Basic Sine Wave

```
*RST
:SOUR1:FUNC SIN                     # Sine wave
:SOUR1:FREQ 1000                    # 1 kHz
:SOUR1:VOLT 2.0                     # 2 Vpp
:SOUR1:VOLT:OFFS 0                  # No offset
:OUTP1 ON                           # Enable output
```

### Square Wave with Duty Cycle

```
*RST
:SOUR1:FUNC SQU                     # Square wave
:SOUR1:FREQ 10000                   # 10 kHz
:SOUR1:VOLT 3.3                     # 3.3 Vpp
:SOUR1:VOLT:OFFS 1.65               # 0-3.3V (TTL compatible)
:SOUR1:FUNC:SQU:DCYC 25             # 25% duty cycle
:OUTP1:LOAD INF                     # High-Z load
:OUTP1 ON
```

### Pulse Train

```
*RST
:SOUR1:FUNC PULS                    # Pulse mode
:SOUR1:FREQ 100000                  # 100 kHz
:SOUR1:PULS:WIDT 0.000002           # 2 µs width
:SOUR1:PULS:TRAN:LEAD 1E-8          # 10 ns rise
:SOUR1:PULS:TRAN:TRAI 1E-8          # 10 ns fall
:SOUR1:VOLT 5.0
:OUTP1 ON
```

### Frequency Sweep

```
*RST
:SOUR1:FUNC SIN
:SOUR1:VOLT 1.0
:SOUR1:FREQ:STAR 100                # Start: 100 Hz
:SOUR1:FREQ:STOP 10000              # Stop: 10 kHz
:SOUR1:SWE:SPAC LIN                 # Linear sweep
:SOUR1:SWE:TIME 5                   # 5 seconds
:SOUR1:SWE:TRIG:SOUR INT            # Internal trigger
:SOUR1:SWE:STAT ON                  # Enable sweep
:OUTP1 ON
```

### Burst Mode

```
*RST
:SOUR1:FUNC SIN
:SOUR1:FREQ 10000                   # 10 kHz carrier
:SOUR1:VOLT 2.0
:SOUR1:BURS:MODE TRIG               # Triggered burst
:SOUR1:BURS:NCYC 10                 # 10 cycles
:SOUR1:BURS:TRIG:SOUR MAN           # Manual trigger
:SOUR1:BURS:STAT ON                 # Enable burst
:OUTP1 ON
:SOUR1:BURS:TRIG                    # Trigger burst
```

### AM Modulation

```
*RST
:SOUR1:FUNC SIN
:SOUR1:FREQ 100000                  # 100 kHz carrier
:SOUR1:VOLT 2.0
:SOUR1:AM:SOUR INT                  # Internal modulation
:SOUR1:AM:INT:FUNC SIN              # Sine modulating wave
:SOUR1:AM:INT:FREQ 1000             # 1 kHz modulation
:SOUR1:AM:DEPT 80                   # 80% depth
:SOUR1:AM:STAT ON                   # Enable AM
:OUTP1 ON
```

### Arbitrary Waveform Upload

```
*RST
# Upload simple staircase waveform
:DATA:DATA VOLATILE,-1.0,-0.5,0.0,0.5,1.0
:DATA:COPY "STAIR",VOLATILE         # Save as "STAIR"
:SOUR1:FUNC:USER "STAIR"            # Select waveform
:SOUR1:FUNC USER                    # Switch to arb mode
:SOUR1:FUNC:ARB:SRAT 100000         # 100 kSa/s
:SOUR1:VOLT 2.0                     # 2 Vpp
:OUTP1 ON
```

### Dual Channel 90° Phase

```
*RST
:SOUR1:FUNC SIN
:SOUR1:FREQ 1000
:SOUR1:VOLT 2.0
:SOUR1:PHAS 0                       # CH1 at 0°

:SOUR2:FUNC SIN
:SOUR2:FREQ 1000
:SOUR2:VOLT 2.0
:SOUR2:PHAS 90                      # CH2 at 90°

:SOUR:PHAS:SYNC                     # Synchronize phases

:OUTP1 ON
:OUTP2 ON
```

---

## Connection Examples

### Python with pyvisa

```python
import pyvisa

rm = pyvisa.ResourceManager()
awg = rm.open_resource('TCPIP0::192.168.1.50::5025::SOCKET')
awg.read_termination = '\n'
awg.write_termination = '\n'

print(awg.query('*IDN?'))

# Configure 1 kHz sine wave
awg.write(':SOUR1:FUNC SIN')
awg.write(':SOUR1:FREQ 1000')
awg.write(':SOUR1:VOLT 2.0')
awg.write(':SOUR1:VOLT:OFFS 0')
awg.write(':OUTP1 ON')

# Query frequency
freq = awg.query(':SOUR1:FREQ?')
print(f"Frequency: {freq}")

awg.close()
```

### TypeScript with visa-ts

```typescript
import { createResourceManager } from 'visa-ts';

async function generateWaveform() {
  const rm = createResourceManager();
  const awg = await rm.open('TCPIP0::192.168.1.50::5025::SOCKET');

  const idnResult = await awg.query('*IDN?');
  if (idnResult.ok) {
    console.log(`Connected to: ${idnResult.value}`);
  }

  await awg.write(':SOUR1:FUNC SIN');
  await awg.write(':SOUR1:FREQ 1000');
  await awg.write(':SOUR1:VOLT 2.0');
  await awg.write(':SOUR1:VOLT:OFFS 0');
  await awg.write(':OUTP1 ON');

  // Query settings
  const freqResult = await awg.query(':SOUR1:FREQ?');
  if (freqResult.ok) {
    console.log(`Frequency: ${parseFloat(freqResult.value)} Hz`);
  }

  await awg.close();
}
```

### Upload Arbitrary Waveform with Binary Data

```python
import struct
import math

# Generate sine wave data (14-bit: 0-16383)
points = 1000
data = []
for i in range(points):
    value = int(8191.5 + 8191.5 * math.sin(2 * math.pi * i / points))
    data.append(value)

# Pack as binary (big-endian 16-bit unsigned)
binary_data = struct.pack(f'>{points}H', *data)

# Create IEEE 488.2 header
size_str = str(len(binary_data))
header = f'#{len(size_str)}{size_str}'

# Send to instrument
awg.write_raw(f':DATA:DAC VOLATILE,{header}'.encode() + binary_data + b'\n')

# Copy and select
awg.write(':DATA:COPY "MYSINE",VOLATILE')
awg.write(':SOUR1:FUNC:USER "MYSINE"')
awg.write(':SOUR1:FUNC USER')
```

---

## Notes

1. **Standard SCPI**: BK Precision uses standard SCPI syntax similar to Rigol/Keysight.

2. **Port 5025**: Uses standard port 5025 for LAN socket connections.

3. **Memory Slots**: 16 save/recall locations (1-16).

4. **Arb Memory**: Varies by model - 16 kpts (4050), 512 kpts (4060), 16 Mpts (4070).

5. **Counter Function**: Available on 4060B and 4070B series only.

6. **USB VID**: 0x0C97 (BK Precision vendor ID).

7. **Phase Sync**: Use `:SOURce:PHASe:SYNChronize` to align channels.

8. **Modulation Priority**: Only one modulation type active per channel.

9. **Sweep/Burst**: Mutually exclusive with continuous operation.

10. **Waveform Names**: User waveforms stored with alphanumeric names in quotes.
