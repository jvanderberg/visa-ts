# Rigol DG Series AWG SCPI Reference

> Rigol DG800, DG1000Z, DG2000, DG4000 Series Function/Arbitrary Waveform Generators

## Supported Models

### DG800 Series (Entry Level)

| Model | Channels | Max Freq | Sample Rate | Arb Memory | Features |
|-------|----------|----------|-------------|------------|----------|
| DG811 | 1 | 10 MHz | 125 MSa/s | 16 kpts | Basic AFG |
| DG812 | 2 | 10 MHz | 125 MSa/s | 16 kpts | Dual channel |
| DG821 | 1 | 25 MHz | 125 MSa/s | 16 kpts | |
| DG822 | 2 | 25 MHz | 125 MSa/s | 16 kpts | |
| DG831 | 1 | 35 MHz | 125 MSa/s | 16 kpts | |
| DG832 | 2 | 35 MHz | 125 MSa/s | 16 kpts | |

### DG1000Z Series (Popular Entry)

| Model | Channels | Max Freq | Sample Rate | Arb Memory | Features |
|-------|----------|----------|-------------|------------|----------|
| DG1022Z | 2 | 25 MHz | 200 MSa/s | 2 Mpts | USB/LAN |
| DG1032Z | 2 | 30 MHz | 200 MSa/s | 2 Mpts | USB/LAN |
| DG1062Z | 2 | 60 MHz | 200 MSa/s | 2 Mpts | USB/LAN |

### DG2000 Series (Mid-Range)

| Model | Channels | Max Freq | Sample Rate | Arb Memory | Features |
|-------|----------|----------|-------------|------------|----------|
| DG2052 | 2 | 50 MHz | 250 MSa/s | 2 Mpts | |
| DG2072 | 2 | 70 MHz | 250 MSa/s | 2 Mpts | |
| DG2102 | 2 | 100 MHz | 250 MSa/s | 2 Mpts | |

### DG4000 Series (High Performance)

| Model | Channels | Max Freq | Sample Rate | Arb Memory | Features |
|-------|----------|----------|-------------|------------|----------|
| DG4062 | 2 | 60 MHz | 500 MSa/s | 14 bits | |
| DG4102 | 2 | 100 MHz | 500 MSa/s | 14 bits | |
| DG4162 | 2 | 160 MHz | 500 MSa/s | 14 bits | |
| DG4202 | 2 | 200 MHz | 500 MSa/s | 14 bits | |

---

## Connection Methods

| Interface | Port/Settings | Resource String Example |
|-----------|---------------|-------------------------|
| USB-TMC | VID:PID 1AB1:0641 | `USB0::0x1AB1::0x0641::DG1ZA123456::INSTR` |
| LAN (Raw Socket) | Port 5555 | `TCPIP0::192.168.1.50::5555::SOCKET` |
| LAN (VXI-11) | Port 111 | `TCPIP0::192.168.1.50::INSTR` |

**Note:** Rigol uses port **5555** for raw socket connections (not 5025).

---

## IEEE 488.2 Common Commands

```
*IDN?                → "RIGOL TECHNOLOGIES,DG1062Z,DG1ZA123456,00.01.02"
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
*SAV <n>             → Save state to memory (1-10)
*RCL <n>             → Recall state from memory (1-10)
```

---

## Channel Addressing

Rigol uses `:SOURce<n>:` prefix for channel-specific commands:

```
:SOURce1:...         → Channel 1 commands
:SOURce2:...         → Channel 2 commands
:SOUR1:...           → Short form
:SOUR2:...           → Short form
```

For single-channel models, `:SOURce1:` or just `:SOURce:` works.

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

**Note:** This affects displayed amplitude. 50Ω = terminated, INF = open-circuit (2× voltage).

---

## Waveform Selection

### Set Waveform Function

```
:SOURce<n>:FUNCtion[:SHAPe] {SINusoid|SQUare|RAMP|PULSe|NOISe|DC|USER|HARMonic|ARBitrary}
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
| User/Arbitrary | `USER` or `ARBitrary` | `USER`, `ARB` |
| Harmonic | `HARMonic` | `HARM` |

---

## Frequency Settings

### Set/Query Frequency

```
:SOURce<n>:FREQuency[:FIXed] <frequency>     → Set frequency (Hz)
:SOURce<n>:FREQuency[:FIXed]?                → Query frequency
:SOURce<n>:FREQuency[:FIXed]? MINimum        → Query minimum
:SOURce<n>:FREQuency[:FIXed]? MAXimum        → Query maximum
```

**Range:** Depends on model and waveform type (µHz to max rated frequency)

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

**Range:** Limited by amplitude setting to keep signal within output range.

---

## Phase Settings

```
:SOURce<n>:PHASe[:ADJust] <degrees>          → Set phase (0-360°)
:SOURce<n>:PHASe[:ADJust]?                   → Query phase
:SOURce<n>:PHASe:INITiate                    → Align phase to 0° point
:SOURce<n>:PHASe:SYNChronize                 → Sync CH1 and CH2 phases
```

---

## Square Wave Parameters

### Duty Cycle

```
:SOURce<n>:FUNCtion:SQUare:DCYCle <percent>  → Set duty cycle (0.01-99.99%)
:SOURce<n>:FUNCtion:SQUare:DCYCle?           → Query duty cycle
```

**Note:** Maximum duty cycle range decreases at higher frequencies.

---

## Ramp/Triangle Parameters

### Symmetry

```
:SOURce<n>:FUNCtion:RAMP:SYMMetry <percent>  → Set symmetry (0-100%)
:SOURce<n>:FUNCtion:RAMP:SYMMetry?           → Query symmetry
```

**Values:**
- 50% = Triangle wave
- 0% = Negative ramp (sawtooth down)
- 100% = Positive ramp (sawtooth up)

---

## Pulse Parameters

### Pulse Width

```
:SOURce<n>:PULSe:WIDTh <seconds>             → Set pulse width
:SOURce<n>:PULSe:WIDTh?                      → Query pulse width
```

### Duty Cycle (Alternative)

```
:SOURce<n>:PULSe:DCYCle <percent>            → Set duty cycle
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
:SOURce<n>:PULSe:DELay <seconds>             → Set delay from trigger
:SOURce<n>:PULSe:DELay?                      → Query delay
```

---

## Noise

### Bandwidth Limit

```
:SOURce<n>:FUNCtion:NOISe:BANDwidth <hz>     → Noise bandwidth
:SOURce<n>:FUNCtion:NOISe:BANDwidth?         → Query bandwidth
```

---

## Harmonic Generation

### Configure Harmonics

```
:SOURce<n>:FUNCtion:HARMonic:ORDer <n>       → Number of harmonics (2-16)
:SOURce<n>:FUNCtion:HARMonic:ORDer?          → Query order
:SOURce<n>:FUNCtion:HARMonic:TYPE {EVEN|ODD|ALL|USER}
:SOURce<n>:FUNCtion:HARMonic:TYPE?           → Query type
:SOURce<n>:FUNCtion:HARMonic:AMPLitude <n>,<amplitude>  → Set nth harmonic
:SOURce<n>:FUNCtion:HARMonic:PHASe <n>,<degrees>        → Set nth phase
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
:SOURce<n>:AM:INTernal:FUNCtion {SINusoid|SQUare|RAMP|NRAMp|TRIangle|NOISe|USER}
:SOURce<n>:AM:INTernal:FREQuency <hz>        → Internal mod frequency
```

### FM (Frequency Modulation)

```
:SOURce<n>:FM:STATe {ON|OFF}                 → Enable/disable FM
:SOURce<n>:FM:DEViation <hz>                 → Frequency deviation
:SOURce<n>:FM:DEViation?                     → Query deviation
:SOURce<n>:FM:SOURce {INTernal|EXTernal}     → Modulation source
:SOURce<n>:FM:INTernal:FUNCtion {SINusoid|SQUare|RAMP|NRAMp|TRIangle|NOISe|USER}
:SOURce<n>:FM:INTernal:FREQuency <hz>        → Internal mod frequency
```

### PM (Phase Modulation)

```
:SOURce<n>:PM:STATe {ON|OFF}                 → Enable/disable PM
:SOURce<n>:PM:DEViation <degrees>            → Phase deviation (0-360°)
:SOURce<n>:PM:DEViation?                     → Query deviation
:SOURce<n>:PM:SOURce {INTernal|EXTernal}     → Modulation source
:SOURce<n>:PM:INTernal:FUNCtion {SINusoid|SQUare|RAMP|NRAMp|TRIangle|NOISe|USER}
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

### ASK (Amplitude Shift Keying)

```
:SOURce<n>:ASKey:STATe {ON|OFF}              → Enable/disable ASK
:SOURce<n>:ASKey:AMPLitude <vpp>             → Modulated amplitude
:SOURce<n>:ASKey:SOURce {INTernal|EXTernal}  → Trigger source
:SOURce<n>:ASKey:INTernal:RATE <hz>          → Internal rate
```

### PSK (Phase Shift Keying)

```
:SOURce<n>:PSKey:STATe {ON|OFF}              → Enable/disable PSK
:SOURce<n>:PSKey:PHASe <degrees>             → Phase shift
:SOURce<n>:PSKey:SOURce {INTernal|EXTernal}  → Trigger source
:SOURce<n>:PSKey:INTernal:RATE <hz>          → Internal rate
```

### PWM (Pulse Width Modulation)

```
:SOURce<n>:PWM:STATe {ON|OFF}                → Enable/disable PWM
:SOURce<n>:PWM:DEViation {<seconds>|DCYCle <percent>}  → Deviation
:SOURce<n>:PWM:DEViation?                    → Query deviation
:SOURce<n>:PWM:SOURce {INTernal|EXTernal}    → Modulation source
:SOURce<n>:PWM:INTernal:FUNCtion {SINusoid|SQUare|RAMP|NRAMp|TRIangle|NOISe|USER}
:SOURce<n>:PWM:INTernal:FREQuency <hz>       → Internal mod frequency
```

---

## Sweep

### Enable/Configure Sweep

```
:SOURce<n>:SWEep:STATe {ON|OFF}              → Enable/disable sweep
:SOURce<n>:SWEep:STATe?                      → Query state
:SOURce<n>:SWEep:SPACing {LINear|LOGarithmic|STEP}  → Sweep type
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
:SOURce<n>:SWEep:HTIMe <seconds>             → Hold time at endpoints
:SOURce<n>:SWEep:RTIMe <seconds>             → Return time
```

### Sweep Trigger

```
:SOURce<n>:SWEep:TRIGger:SOURce {INTernal|EXTernal|MANual}
:SOURce<n>:SWEep:TRIGger:SOURce?             → Query trigger source
:SOURce<n>:SWEep:TRIGger:SLOPe {POSitive|NEGative}  → External slope
:SOURce<n>:SWEep:TRIGger[:IMMediate]         → Manual trigger
```

### Marker

```
:SOURce<n>:MARKer:FREQuency <hz>             → Marker frequency
:SOURce<n>:MARKer:FREQuency?                 → Query marker
:SOURce<n>:MARKer:STATe {ON|OFF}             → Enable marker output
```

---

## Burst Mode

### Enable/Configure Burst

```
:SOURce<n>:BURSt:STATe {ON|OFF}              → Enable/disable burst
:SOURce<n>:BURSt:STATe?                      → Query state
:SOURce<n>:BURSt:MODE {TRIGgered|INFinity|GATed}  → Burst mode
:SOURce<n>:BURSt:MODE?                       → Query mode
```

### Burst Parameters

```
:SOURce<n>:BURSt:NCYCles {<count>|INFinity}  → Number of cycles (1-1M or INF)
:SOURce<n>:BURSt:NCYCles?                    → Query count
:SOURce<n>:BURSt:INTernal:PERiod <seconds>   → Internal burst period
:SOURce<n>:BURSt:INTernal:PERiod?            → Query period
:SOURce<n>:BURSt:PHASe <degrees>             → Start phase (0-360°)
:SOURce<n>:BURSt:PHASe?                      → Query phase
:SOURce<n>:BURSt:TDELay <seconds>            → Trigger delay
:SOURce<n>:BURSt:TDELay?                     → Query delay
```

### Burst Trigger

```
:SOURce<n>:BURSt:TRIGger:SOURce {INTernal|EXTernal|MANual}
:SOURce<n>:BURSt:TRIGger:SOURce?             → Query trigger source
:SOURce<n>:BURSt:TRIGger:SLOPe {POSitive|NEGative}  → External slope
:SOURce<n>:BURSt:TRIGger[:IMMediate]         → Manual trigger
*TRG                                          → Software trigger
```

### Gated Burst

```
:SOURce<n>:BURSt:GATE:POLarity {NORMal|INVerted}  → Gate polarity
:SOURce<n>:BURSt:IDLE {FPT|TOP|CENTER|BOTTOM}     → Idle level
```

---

## Arbitrary Waveforms

### List Waveforms

```
:SOURce<n>:FUNCtion:ARBitrary:CATalog?       → List built-in waveforms
:DATA:VOLatile:CATalog?                       → List volatile waveforms
```

### Select Waveform

```
:SOURce<n>:FUNCtion:ARBitrary "<name>"       → Select arbitrary waveform
:SOURce<n>:FUNCtion:ARBitrary?               → Query selected waveform
:SOURce<n>:FUNCtion USER                     → Switch to arb mode
```

### Upload Waveform Data

```
:SOURce<n>:TRACe:DATA VOLATILE,<data>        → Upload float data (-1.0 to +1.0)
:SOURce<n>:TRACe:DATA:DAC VOLATILE,<data>    → Upload DAC values (model-dependent)
:SOURce<n>:TRACe:DATA:DAC16 VOLATILE,#<binary_block>  → 16-bit binary
```

**Data Format:**
- Float: Comma-separated values from -1.0 to +1.0
- DAC: Integer values (0-16383 for 14-bit, 0-65535 for 16-bit)
- Binary: IEEE 488.2 arbitrary block format

### Sample Rate

```
:SOURce<n>:FUNCtion:ARBitrary:SRATe <rate>   → Set sample rate (Sa/s)
:SOURce<n>:FUNCtion:ARBitrary:SRATe?         → Query sample rate
```

### Delete Waveform

```
:SOURce<n>:TRACe:DELete "<name>"             → Delete named waveform
:SOURce<n>:TRACe:DELete:ALL                  → Delete all user waveforms
```

### Points Interpolation

```
:SOURce<n>:FUNCtion:ARBitrary:INTerpolate {ON|OFF}  → Enable interpolation
:SOURce<n>:FUNCtion:ARBitrary:FILTer {STEP|LINear|SINC}  → Filter type
```

---

## Sync/Trigger Output

### Sync Output

```
:OUTPut<n>:SYNC[:STATe] {ON|OFF}             → Enable sync output
:OUTPut<n>:SYNC[:STATe]?                     → Query sync state
:OUTPut<n>:SYNC:POLarity {POSitive|NEGative} → Sync polarity
:OUTPut<n>:SYNC:POLarity?                    → Query polarity
:OUTPut<n>:SYNC:MODE {NORMal|CARRier|MODulation}  → Sync mode
```

---

## Coupling (Dual Channel)

### Channel Coupling

```
:COUPling:STATe {ON|OFF}                     → Enable coupling
:COUPling:STATe?                             → Query state
:COUPling:MODE {FREQuency|AMPLitude|PHASe}   → Coupling mode
:COUPling:BASe {CH1|CH2}                     → Base channel
:COUPling:FREQuency:MODE {OFFSet|RATio}      → Freq coupling mode
:COUPling:FREQuency:OFFSet <hz>              → Frequency offset
:COUPling:FREQuency:RATio <ratio>            → Frequency ratio
:COUPling:AMPLitude:MODE {OFFSet|RATio}      → Amp coupling mode
:COUPling:PHASe:MODE {OFFSet|RATio}          → Phase coupling mode
```

---

## Counter Function

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
:COUNter:COUPling?                           → Query coupling
:COUNter:SENSitivity {LOW|MEDium|HIGH}       → Trigger sensitivity
:COUNter:TRIGger:LEVel <voltage>             → Trigger level
:COUNter:TRIGger:LEVel?                      → Query level
:COUNter:HF[:STATe] {ON|OFF}                 → High frequency mode
```

---

## System Commands

### Error Query

```
:SYSTem:ERRor[:NEXT]?                        → Get next error
:SYSTem:ERRor:CLEar                          → Clear error queue
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
:DISPlay[:WINDow]:TEXT:STATe {ON|OFF}        → Enable text display
:DISPlay[:WINDow]:TEXT:DATA "<message>"      → Display message
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
:SYSTem:COMMunicate:LAN:APPLy                → Apply LAN settings
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
:SOUR1:BURS:NCYC 10                 # 10 cycles per burst
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
:SOUR1:AM:INT:FREQ 1000             # 1 kHz modulation freq
:SOUR1:AM:DEPT 80                   # 80% depth
:SOUR1:AM:STAT ON                   # Enable AM
:OUTP1 ON
```

### Arbitrary Waveform Upload

```
*RST
# Upload staircase waveform (5 steps)
:SOUR1:TRAC:DATA VOLATILE,-1.0,-0.5,0.0,0.5,1.0
:SOUR1:FUNC:ARB VOLATILE            # Select uploaded waveform
:SOUR1:FUNC ARB                     # Switch to arb mode
:SOUR1:FUNC:ARB:SRAT 100000         # 100 kSa/s sample rate
:SOUR1:VOLT 2.0                     # 2 Vpp
:OUTP1 ON
```

### Dual Channel 90° Phase Shift

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
awg = rm.open_resource('TCPIP0::192.168.1.50::5555::SOCKET')
awg.read_termination = '\n'
awg.write_termination = '\n'

print(awg.query('*IDN?'))

# Configure 1 kHz sine wave
awg.write(':SOUR1:FUNC SIN')
awg.write(':SOUR1:FREQ 1000')
awg.write(':SOUR1:VOLT 2.0')
awg.write(':SOUR1:VOLT:OFFS 0')
awg.write(':OUTP1 ON')

awg.close()
```

### TypeScript with visa-ts

```typescript
import { createResourceManager } from 'visa-ts';

async function generateSineWave() {
  const rm = createResourceManager();
  const awg = await rm.open('TCPIP0::192.168.1.50::5555::SOCKET');

  const idnResult = await awg.query('*IDN?');
  if (idnResult.ok) {
    console.log(`Connected to: ${idnResult.value}`);
  }

  await awg.write(':SOUR1:FUNC SIN');
  await awg.write(':SOUR1:FREQ 1000');
  await awg.write(':SOUR1:VOLT 2.0');
  await awg.write(':SOUR1:VOLT:OFFS 0');
  await awg.write(':OUTP1 ON');

  await awg.close();
}
```

---

## Notes

1. **Port 5555**: Rigol uses port 5555 for raw socket connections, not the common 5025.

2. **Channel Prefix**: Always use `:SOURce<n>:` or `:SOUR<n>:` prefix for channel-specific commands.

3. **Amplitude & Load**: The displayed amplitude depends on the load setting. High-Z shows open-circuit voltage (2× the 50Ω terminated value).

4. **Phase Sync**: After changing frequencies, use `:SOURce:PHASe:SYNChronize` to realign channels.

5. **Arbitrary Memory**: DG1000Z has 2 Mpts, DG800 has 16 kpts per channel.

6. **Modulation Priority**: Only one modulation type can be active at a time per channel.

7. **Sweep/Burst**: Sweep and burst modes are mutually exclusive.

8. **Memory Slots**: 10 save/recall locations (1-10).

9. **Counter Input**: The counter function uses an external input connector (varies by model).

10. **Built-in Waveforms**: Rigol includes many built-in arbitrary waveforms (exponential, sinc, cardiac, etc.).
