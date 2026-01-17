# Keysight Trueform AWG SCPI Reference

> Keysight 33500B and 33600A Series Trueform Waveform Generators

## Supported Models

### 33500B Series (Entry Trueform)

| Model | Channels | Max Freq | Sample Rate | Arb Memory | Features |
|-------|----------|----------|-------------|------------|----------|
| 33509B | 1 | 20 MHz | 250 MSa/s | 1 Mpts | Basic Trueform |
| 33510B | 2 | 20 MHz | 250 MSa/s | 1 Mpts | Dual channel |
| 33511B | 1 | 20 MHz | 250 MSa/s | 16 Mpts | Extended memory |
| 33512B | 2 | 20 MHz | 250 MSa/s | 16 Mpts | Extended memory |
| 33519B | 1 | 30 MHz | 250 MSa/s | 1 Mpts | |
| 33520B | 2 | 30 MHz | 250 MSa/s | 1 Mpts | |
| 33521B | 1 | 30 MHz | 250 MSa/s | 16 Mpts | Extended memory |
| 33522B | 2 | 30 MHz | 250 MSa/s | 16 Mpts | Extended memory |

### 33600A Series (High Performance)

| Model | Channels | Max Freq | Sample Rate | Arb Memory | Features |
|-------|----------|----------|-------------|------------|----------|
| 33611A | 1 | 80 MHz | 1 GSa/s | 16 Mpts | |
| 33612A | 2 | 80 MHz | 1 GSa/s | 16 Mpts | |
| 33621A | 1 | 120 MHz | 1 GSa/s | 64 Mpts | Extended memory |
| 33622A | 2 | 120 MHz | 1 GSa/s | 64 Mpts | Extended memory |

**Key Features:**
- Trueform technology with point-by-point DDS
- 16-bit vertical resolution
- Ultra-low jitter (<1 ps)
- Variable sample rate in arb mode

---

## Connection Methods

| Interface | Port/Settings | Resource String Example |
|-----------|---------------|-------------------------|
| USB-TMC | VID:PID 0957:2B07 | `USB0::0x0957::0x2B07::MY12345678::INSTR` |
| LAN (Raw Socket) | Port 5025 | `TCPIP0::192.168.1.50::5025::SOCKET` |
| LAN (VXI-11) | Port 111 | `TCPIP0::192.168.1.50::INSTR` |
| GPIB | Address 0-30 | `GPIB0::10::INSTR` |

**Note:** Keysight uses standard port **5025** for raw socket connections.

---

## IEEE 488.2 Common Commands

```
*IDN?                → "Keysight Technologies,33522B,MY12345678,3.05-1.19-2.00-58-00"
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
*SAV <n>             → Save state to memory (0-4)
*RCL <n>             → Recall state from memory (0-4)
```

---

## Channel Selection

### Channel Addressing

For dual-channel models, use `[SOURce<n>]:` prefix or select channel:

```
[SOURce[1]]:...      → Channel 1 (default if omitted)
[SOURce2]:...        → Channel 2
:SOURce1:...         → Explicit channel 1
:SOURce2:...         → Explicit channel 2
```

### Select Active Channel

```
:INSTrument:SELect {CH1|CH2}                 → Select active channel
:INSTrument:SELect?                          → Query selected channel
```

---

## Output Control

### Enable/Disable Output

```
:OUTPut[<n>][:STATe] {ON|OFF|1|0}            → Enable/disable output
:OUTPut[<n>][:STATe]?                        → Query output state
:OUTPut[<n>]:POLarity {NORMal|INVerted}      → Output polarity
:OUTPut[<n>]:POLarity?                       → Query polarity
```

### Output Load Impedance

```
:OUTPut[<n>]:LOAD {<ohms>|INFinity|MINimum|MAXimum}
:OUTPut[<n>]:LOAD?                           → Query load setting
```

**Values:** 1Ω to 10kΩ, or `INFinity` for High-Z

---

## Waveform Selection

### Set Waveform Function

```
[SOURce<n>:]FUNCtion[:SHAPe] {SINusoid|SQUare|RAMP|PULSe|NOISe|DC|PRBS|ARBitrary}
[SOURce<n>:]FUNCtion[:SHAPe]?                → Query waveform type
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
| PRBS | `PRBS` | `PRBS` |
| Arbitrary | `ARBitrary` | `ARB` |

---

## Frequency Settings

### Set/Query Frequency

```
[SOURce<n>:]FREQuency[:FIXed] <frequency>    → Set frequency (Hz)
[SOURce<n>:]FREQuency[:FIXed]?               → Query frequency
[SOURce<n>:]FREQuency[:FIXed]? MINimum       → Query minimum
[SOURce<n>:]FREQuency[:FIXed]? MAXimum       → Query maximum
```

### Period (Alternative)

```
[SOURce<n>:]FUNCtion:PERiod <seconds>        → Set period
[SOURce<n>:]FUNCtion:PERiod?                 → Query period
```

---

## Amplitude Settings

### Set Amplitude

```
[SOURce<n>:]VOLTage[:LEVel][:IMMediate][:AMPLitude] <vpp>
[SOURce<n>:]VOLTage[:LEVel][:IMMediate][:AMPLitude]?
[SOURce<n>:]VOLTage?                         → Short form query
```

### Amplitude Units

```
[SOURce<n>:]VOLTage:UNIT {VPP|VRMS|DBM}      → Set amplitude unit
[SOURce<n>:]VOLTage:UNIT?                    → Query unit
```

### High/Low Level (Alternative)

```
[SOURce<n>:]VOLTage:HIGH <voltage>           → Set high level (V)
[SOURce<n>:]VOLTage:HIGH?                    → Query high level
[SOURce<n>:]VOLTage:LOW <voltage>            → Set low level (V)
[SOURce<n>:]VOLTage:LOW?                     → Query low level
```

### Amplitude Range (Auto/Manual)

```
[SOURce<n>:]VOLTage:RANGe:AUTO {ON|OFF|ONCE} → Auto-ranging
[SOURce<n>:]VOLTage:RANGe:AUTO?              → Query auto-range state
```

---

## DC Offset

```
[SOURce<n>:]VOLTage:OFFSet <offset>          → Set DC offset (V)
[SOURce<n>:]VOLTage:OFFSet?                  → Query offset
```

---

## Phase Settings

```
[SOURce<n>:]PHASe[:ADJust] <degrees>         → Set phase (0-360°)
[SOURce<n>:]PHASe[:ADJust]?                  → Query phase
[SOURce<n>:]PHASe:SYNChronize                → Synchronize channel phases
```

---

## Square Wave Parameters

### Duty Cycle

```
[SOURce<n>:]FUNCtion:SQUare:DCYCle <percent> → Set duty cycle (0.01-99.99%)
[SOURce<n>:]FUNCtion:SQUare:DCYCle?          → Query duty cycle
```

---

## Ramp Parameters

### Symmetry

```
[SOURce<n>:]FUNCtion:RAMP:SYMMetry <percent> → Set symmetry (0-100%)
[SOURce<n>:]FUNCtion:RAMP:SYMMetry?          → Query symmetry
```

---

## Pulse Parameters

### Pulse Width

```
[SOURce<n>:]FUNCtion:PULSe:WIDTh <seconds>   → Set pulse width
[SOURce<n>:]FUNCtion:PULSe:WIDTh?            → Query pulse width
```

### Duty Cycle (Alternative)

```
[SOURce<n>:]FUNCtion:PULSe:DCYCle <percent>  → Set duty cycle
[SOURce<n>:]FUNCtion:PULSe:DCYCle?           → Query duty cycle
```

### Edge Times

```
[SOURce<n>:]FUNCtion:PULSe:TRANsition[:LEADing] <seconds>   → Rise time
[SOURce<n>:]FUNCtion:PULSe:TRANsition[:LEADing]?            → Query rise time
[SOURce<n>:]FUNCtion:PULSe:TRANsition:TRAiling <seconds>   → Fall time
[SOURce<n>:]FUNCtion:PULSe:TRANsition:TRAiling?            → Query fall time
[SOURce<n>:]FUNCtion:PULSe:TRANsition:BOTH <seconds>       → Set both edges
```

### Pulse Delay (Hold Time)

```
[SOURce<n>:]FUNCtion:PULSe:HOLD {WIDTh|DCYC} → Hold width or duty cycle
[SOURce<n>:]FUNCtion:PULSe:HOLD?             → Query hold mode
```

---

## Noise Parameters

### Bandwidth

```
[SOURce<n>:]FUNCtion:NOISe:BANDwidth <hz>    → Noise bandwidth
[SOURce<n>:]FUNCtion:NOISe:BANDwidth?        → Query bandwidth
[SOURce<n>:]FUNCtion:NOISe:BANDwidth? MINimum
[SOURce<n>:]FUNCtion:NOISe:BANDwidth? MAXimum
```

---

## PRBS (Pseudo-Random Bit Sequence)

### Configure PRBS

```
[SOURce<n>:]FUNCtion:PRBS:DATA {PN7|PN9|PN11|PN15|PN20|PN23}
[SOURce<n>:]FUNCtion:PRBS:DATA?              → Query PRBS type
[SOURce<n>:]FUNCtion:PRBS:BRATe <rate>       → Bit rate (bps)
[SOURce<n>:]FUNCtion:PRBS:BRATe?             → Query bit rate
[SOURce<n>:]FUNCtion:PRBS:TRANsition <seconds>  → Edge time
[SOURce<n>:]FUNCtion:PRBS:TRANsition?        → Query edge time
```

---

## Modulation

### AM (Amplitude Modulation)

```
[SOURce<n>:]AM:STATe {ON|OFF}                → Enable/disable AM
[SOURce<n>:]AM:STATe?                        → Query state
[SOURce<n>:]AM[:DEPTh] <percent>             → Modulation depth (0-120%)
[SOURce<n>:]AM[:DEPTh]?                      → Query depth
[SOURce<n>:]AM:SOURce {INTernal|EXTernal}    → Modulation source
[SOURce<n>:]AM:SOURce?                       → Query source
[SOURce<n>:]AM:INTernal:FUNCtion {SINusoid|SQUare|RAMP|NRAMp|TRIangle|NOISe|PRBS|ARBitrary}
[SOURce<n>:]AM:INTernal:FREQuency <hz>       → Internal mod frequency
[SOURce<n>:]AM:DSSC {ON|OFF}                 → Double-sideband suppressed carrier
```

### FM (Frequency Modulation)

```
[SOURce<n>:]FM:STATe {ON|OFF}                → Enable/disable FM
[SOURce<n>:]FM:DEViation <hz>                → Frequency deviation
[SOURce<n>:]FM:DEViation?                    → Query deviation
[SOURce<n>:]FM:SOURce {INTernal|EXTernal}    → Modulation source
[SOURce<n>:]FM:INTernal:FUNCtion {SINusoid|SQUare|RAMP|NRAMp|TRIangle|NOISe|PRBS|ARBitrary}
[SOURce<n>:]FM:INTernal:FREQuency <hz>       → Internal mod frequency
```

### PM (Phase Modulation)

```
[SOURce<n>:]PM:STATe {ON|OFF}                → Enable/disable PM
[SOURce<n>:]PM:DEViation <degrees>           → Phase deviation (0-360°)
[SOURce<n>:]PM:DEViation?                    → Query deviation
[SOURce<n>:]PM:SOURce {INTernal|EXTernal}    → Modulation source
[SOURce<n>:]PM:INTernal:FUNCtion {SINusoid|SQUare|RAMP|NRAMp|TRIangle|NOISe|PRBS|ARBitrary}
[SOURce<n>:]PM:INTernal:FREQuency <hz>       → Internal mod frequency
```

### FSK (Frequency Shift Keying)

```
[SOURce<n>:]FSKey:STATe {ON|OFF}             → Enable/disable FSK
[SOURce<n>:]FSKey:FREQuency <hz>             → Hop frequency
[SOURce<n>:]FSKey:FREQuency?                 → Query hop frequency
[SOURce<n>:]FSKey:SOURce {INTernal|EXTernal} → Trigger source
[SOURce<n>:]FSKey:INTernal:RATE <hz>         → Internal rate
```

### BPSK (Binary Phase Shift Keying)

```
[SOURce<n>:]BPSK:STATe {ON|OFF}              → Enable/disable BPSK
[SOURce<n>:]BPSK:PHASe <degrees>             → Phase shift
[SOURce<n>:]BPSK:SOURce {INTernal|EXTernal}  → Trigger source
[SOURce<n>:]BPSK:INTernal:RATE <hz>          → Internal rate
```

### PWM (Pulse Width Modulation)

```
[SOURce<n>:]PWM:STATe {ON|OFF}               → Enable/disable PWM
[SOURce<n>:]PWM:DEViation {<seconds>|DCYCle <percent>}
[SOURce<n>:]PWM:DEViation?                   → Query deviation
[SOURce<n>:]PWM:SOURce {INTernal|EXTernal}   → Modulation source
[SOURce<n>:]PWM:INTernal:FUNCtion {SINusoid|SQUare|RAMP|NRAMp|TRIangle|NOISe|PRBS|ARBitrary}
[SOURce<n>:]PWM:INTernal:FREQuency <hz>      → Internal mod frequency
```

### SUM Modulation (Add signal to output)

```
[SOURce<n>:]SUM:STATe {ON|OFF}               → Enable/disable SUM
[SOURce<n>:]SUM:AMPLitude <percent>          → Added signal amplitude
[SOURce<n>:]SUM:SOURce {INTernal|EXTernal}   → Signal source
[SOURce<n>:]SUM:INTernal:FUNCtion {SINusoid|SQUare|RAMP|NRAMp|TRIangle|NOISe|PRBS|ARBitrary}
[SOURce<n>:]SUM:INTernal:FREQuency <hz>      → Internal frequency
```

---

## Sweep

### Enable/Configure Sweep

```
[SOURce<n>:]SWEep:STATe {ON|OFF}             → Enable/disable sweep
[SOURce<n>:]SWEep:STATe?                     → Query state
[SOURce<n>:]SWEep:SPACing {LINear|LOGarithmic}  → Sweep type
[SOURce<n>:]SWEep:SPACing?                   → Query type
```

### Frequency Range

```
[SOURce<n>:]FREQuency:STARt <hz>             → Start frequency
[SOURce<n>:]FREQuency:STARt?                 → Query start
[SOURce<n>:]FREQuency:STOP <hz>              → Stop frequency
[SOURce<n>:]FREQuency:STOP?                  → Query stop
[SOURce<n>:]FREQuency:CENTer <hz>            → Center frequency
[SOURce<n>:]FREQuency:SPAN <hz>              → Frequency span
```

### Sweep Timing

```
[SOURce<n>:]SWEep:TIME <seconds>             → Sweep time
[SOURce<n>:]SWEep:TIME?                      → Query sweep time
[SOURce<n>:]SWEep:HTIMe <seconds>            → Hold time
[SOURce<n>:]SWEep:RTIMe <seconds>            → Return time
```

### Sweep Trigger

```
:TRIGger[<n>]:SOURce {IMMediate|EXTernal|TIMer|BUS}
:TRIGger[<n>]:SOURce?                        → Query trigger source
:TRIGger[<n>]:SLOPe {POSitive|NEGative}      → External slope
:TRIGger[<n>]:TIMer <seconds>                → Timer period
:TRIGger[<n>][:IMMediate]                    → Software trigger
```

### Marker

```
[SOURce<n>:]MARKer:FREQuency <hz>            → Marker frequency
[SOURce<n>:]MARKer:FREQuency?                → Query marker
[SOURce<n>:]MARKer[:STATe] {ON|OFF}          → Enable marker output
```

---

## Burst Mode

### Enable/Configure Burst

```
[SOURce<n>:]BURSt:STATe {ON|OFF}             → Enable/disable burst
[SOURce<n>:]BURSt:STATe?                     → Query state
[SOURce<n>:]BURSt:MODE {TRIGgered|GATed}     → Burst mode
[SOURce<n>:]BURSt:MODE?                      → Query mode
```

### Burst Parameters

```
[SOURce<n>:]BURSt:NCYCles {<count>|INFinity} → Number of cycles
[SOURce<n>:]BURSt:NCYCles?                   → Query count
[SOURce<n>:]BURSt:INTernal:PERiod <seconds>  → Internal burst period
[SOURce<n>:]BURSt:INTernal:PERiod?           → Query period
[SOURce<n>:]BURSt:PHASe <degrees>            → Start phase
[SOURce<n>:]BURSt:PHASe?                     → Query phase
```

### Trigger Delay

```
:TRIGger[<n>]:DELay <seconds>                → Trigger delay
:TRIGger[<n>]:DELay?                         → Query delay
```

### Burst Trigger

```
:TRIGger[<n>]:SOURce {IMMediate|EXTernal|TIMer|BUS}
:TRIGger[<n>][:IMMediate]                    → Software trigger
*TRG                                          → IEEE 488.2 trigger
```

### Gated Burst

```
[SOURce<n>:]BURSt:GATE:POLarity {NORMal|INVerted}
```

---

## Arbitrary Waveforms

### List Available Waveforms

```
:DATA:VOLatile:CATalog?                      → List volatile waveforms
:DATA:ARBitrary:CATalog?                     → List all waveforms
```

### Select Arbitrary Waveform

```
[SOURce<n>:]FUNCtion:ARBitrary "<name>"      → Select waveform
[SOURce<n>:]FUNCtion:ARBitrary?              → Query selected
[SOURce<n>:]FUNCtion ARBitrary               → Switch to arb mode
```

### Upload Waveform Data

```
:DATA:ARBitrary <name>,<data>                → Upload float data (-1.0 to +1.0)
:DATA:ARBitrary:DAC <name>,#<binary_block>   → Upload DAC values (16-bit)
```

**Data Formats:**
- Float: Comma-separated values from -1.0 to +1.0
- DAC: IEEE 488.2 binary block with 16-bit signed integers (-32768 to +32767)

### Sample Rate

```
[SOURce<n>:]FUNCtion:ARBitrary:SRATe <rate>  → Set sample rate (Sa/s)
[SOURce<n>:]FUNCtion:ARBitrary:SRATe?        → Query sample rate
[SOURce<n>:]FUNCtion:ARBitrary:SRATe? MINimum
[SOURce<n>:]FUNCtion:ARBitrary:SRATe? MAXimum
```

### Frequency (Alternative to Sample Rate)

```
[SOURce<n>:]FUNCtion:ARBitrary:FREQuency <hz>
[SOURce<n>:]FUNCtion:ARBitrary:FREQuency?
```

### Points Interpolation

```
[SOURce<n>:]FUNCtion:ARBitrary:FILTer {NORMal|STEP|OFF}
[SOURce<n>:]FUNCtion:ARBitrary:FILTer?       → Query filter
```

### Delete Waveform

```
:DATA:DELete "<name>"                        → Delete named waveform
:DATA:DELete:ALL                             → Delete all user waveforms
```

### Advance Sequencing (33600A only)

```
:DATA:SEQuence:CATalog?                      → List sequences
:DATA:SEQuence #<n>,"<name1>",<rep1>,"<name2>",<rep2>,...
[SOURce<n>:]FUNCtion:ARBitrary:ADVance {TRIGger|SRATe}
[SOURce<n>:]FUNCtion:ARBitrary:ADVance?
```

---

## Sync/Trigger Output

### Sync Output

```
:OUTPut:SYNC[:STATe] {ON|OFF}                → Enable sync output
:OUTPut:SYNC[:STATe]?                        → Query sync state
:OUTPut:SYNC:POLarity {NORMal|INVerted}      → Sync polarity
:OUTPut:SYNC:MODE {NORMal|CARRier|MARKer}    → Sync source
```

### Trigger Output

```
:OUTPut:TRIGger[:STATe] {ON|OFF}             → Enable trigger output
:OUTPut:TRIGger:SLOPe {POSitive|NEGative}    → Output slope
```

---

## Channel Coupling (Dual Channel)

### Track Mode

```
:TRACk:STATe {ON|OFF}                        → Enable tracking
:TRACk:STATe?                                → Query state
:TRACk:TYPE {INVerted|MIRRor}                → Track type
```

### Combine Channels

```
:COMBine:FEED {CH1|CH2|NONE}                 → Channel to combine
:COMBine:FEED?                               → Query combined channel
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
:DISPlay[:WINDow]:TEXT "<message>"           → Display message
:DISPlay[:WINDow]:TEXT:CLEar                 → Clear message
:DISPlay[:WINDow][:STATe] {ON|OFF}           → Display on/off
```

### Remote/Local

```
:SYSTem:LOCal                                → Set local mode
:SYSTem:REMote                               → Set remote mode
:SYSTem:RWLock                               → Remote with lockout
```

### Security

```
:SYSTem:SECurity:IMMediate                   → Secure erase (NISPOM)
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
:SYSTem:COMMunicate:LAN:UPDate
```

---

## Status System

### Status Registers

```
:STATus:QUEStionable[:EVENt]?
:STATus:QUEStionable:CONDition?
:STATus:QUEStionable:ENABle <mask>
:STATus:QUEStionable:ENABle?
:STATus:OPERation[:EVENt]?
:STATus:OPERation:CONDition?
:STATus:OPERation:ENABle <mask>
:STATus:PRESet                               → Preset status system
```

### Questionable Status Bits

| Bit | Value | Meaning |
|-----|-------|---------|
| 3 | 8 | Calibration |
| 4 | 16 | Voltage overload |
| 5 | 32 | Frequency |
| 9 | 512 | Hardware error |
| 11 | 2048 | Temperature |
| 12 | 4096 | Self-test failed |

---

## Programming Examples

### Basic Sine Wave

```
*RST
:FUNC SIN                           # Sine wave
:FREQ 1000                          # 1 kHz
:VOLT 2.0                           # 2 Vpp
:VOLT:OFFS 0                        # No offset
:OUTP ON                            # Enable output
```

### Dual Channel with Phase Offset

```
*RST
:SOUR1:FUNC SIN
:SOUR1:FREQ 1000
:SOUR1:VOLT 2.0
:SOUR1:PHAS 0

:SOUR2:FUNC SIN
:SOUR2:FREQ 1000
:SOUR2:VOLT 2.0
:SOUR2:PHAS 90

:PHAS:SYNC                          # Synchronize phases

:OUTP1 ON
:OUTP2 ON
```

### Square Wave with Duty Cycle

```
*RST
:FUNC SQU                           # Square wave
:FREQ 10000                         # 10 kHz
:VOLT 3.3                           # 3.3 Vpp
:VOLT:OFFS 1.65                     # 0-3.3V
:FUNC:SQU:DCYC 25                   # 25% duty cycle
:OUTP:LOAD INF                      # High-Z
:OUTP ON
```

### Frequency Sweep

```
*RST
:FUNC SIN
:VOLT 1.0
:FREQ:STAR 100                      # Start: 100 Hz
:FREQ:STOP 10000                    # Stop: 10 kHz
:SWE:SPAC LIN                       # Linear sweep
:SWE:TIME 5                         # 5 seconds
:TRIG:SOUR IMM                      # Immediate trigger
:SWE:STAT ON                        # Enable sweep
:OUTP ON
```

### Burst Mode

```
*RST
:FUNC SIN
:FREQ 10000                         # 10 kHz carrier
:VOLT 2.0
:BURS:MODE TRIG                     # Triggered burst
:BURS:NCYC 10                       # 10 cycles
:TRIG:SOUR BUS                      # Bus trigger
:BURS:STAT ON                       # Enable burst
:OUTP ON
*TRG                                # Trigger burst
```

### AM Modulation

```
*RST
:FUNC SIN
:FREQ 100000                        # 100 kHz carrier
:VOLT 2.0
:AM:SOUR INT                        # Internal modulation
:AM:INT:FUNC SIN                    # Sine modulating wave
:AM:INT:FREQ 1000                   # 1 kHz modulation
:AM:DEPT 80                         # 80% depth
:AM:STAT ON                         # Enable AM
:OUTP ON
```

### Upload Arbitrary Waveform

```
*RST
# Upload simple ramp waveform
:DATA:ARB mywave,0.0,0.25,0.5,0.75,1.0,0.75,0.5,0.25
:FUNC:ARB "mywave"                  # Select waveform
:FUNC ARB                           # Switch to arb mode
:FUNC:ARB:SRAT 100000               # 100 kSa/s
:VOLT 2.0                           # 2 Vpp
:OUTP ON
```

### PRBS Signal

```
*RST
:FUNC PRBS                          # PRBS mode
:FUNC:PRBS:DATA PN9                 # PN9 sequence
:FUNC:PRBS:BRAT 1E6                 # 1 Mbps
:FUNC:PRBS:TRAN 5E-9                # 5 ns edges
:VOLT 1.0                           # 1 Vpp
:VOLT:OFFS 0.5                      # 0-1V
:OUTP ON
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
awg.write(':FUNC SIN')
awg.write(':FREQ 1000')
awg.write(':VOLT 2.0')
awg.write(':VOLT:OFFS 0')
awg.write(':OUTP ON')

# Query frequency
freq = awg.query(':FREQ?')
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

  await awg.write(':FUNC SIN');
  await awg.write(':FREQ 1000');
  await awg.write(':VOLT 2.0');
  await awg.write(':VOLT:OFFS 0');
  await awg.write(':OUTP ON');

  // Query settings
  const freqResult = await awg.query(':FREQ?');
  if (freqResult.ok) {
    console.log(`Frequency: ${parseFloat(freqResult.value)} Hz`);
  }

  await awg.close();
}
```

### Upload Binary Arbitrary Waveform

```python
import struct

# Generate sine wave data (16-bit signed)
import math
points = 1000
data = []
for i in range(points):
    value = int(32767 * math.sin(2 * math.pi * i / points))
    data.append(value)

# Pack as binary
binary_data = struct.pack(f'>{points}h', *data)

# Create IEEE 488.2 header
header = f'#{len(str(len(binary_data)))}{len(binary_data)}'

# Send to instrument
awg.write_raw(f':DATA:ARB:DAC mywave,{header}'.encode() + binary_data)
```

---

## Notes

1. **Trueform Technology**: Point-by-point DDS provides better signal fidelity than traditional DDS.

2. **Channel Addressing**: For single-channel commands, `[SOURce1]:` is optional. For dual-channel, always specify.

3. **Amplitude & Load**: Set load impedance to match actual load for correct amplitude display.

4. **Phase Sync**: Use `:PHASe:SYNChronize` after changing frequencies to realign channels.

5. **Arb Memory**: 33500B standard has 1 Mpts, -MEM option adds 16 Mpts. 33600A has 16-64 Mpts.

6. **Sample Rate vs Frequency**: In arb mode, set either sample rate or output frequency, not both.

7. **PRBS**: Built-in pseudo-random bit sequence generator for digital testing.

8. **Sequencing**: 33600A supports advanced waveform sequencing for complex patterns.

9. **Memory Slots**: 5 save/recall locations (0-4).

10. **Security**: NISPOM secure erase available for sensitive applications.
