# Tektronix AFG Series AWG SCPI Reference

> Tektronix AFG1000, AFG3000C, AFG31000 Series Arbitrary Function Generators

## Supported Models

### AFG1000 Series (Entry Level)

| Model | Channels | Max Freq | Sample Rate | Arb Memory | Features |
|-------|----------|----------|-------------|------------|----------|
| AFG1022 | 2 | 25 MHz | 125 MSa/s | 8 kpts | USB/LAN |
| AFG1062 | 2 | 60 MHz | 300 MSa/s | 8 kpts | USB/LAN |

### AFG3000C Series (Mid-Range)

| Model | Channels | Max Freq | Sample Rate | Arb Memory | Features |
|-------|----------|----------|-------------|------------|----------|
| AFG3011C | 1 | 10 MHz | 250 MSa/s | 128 kpts | USB/LAN/GPIB |
| AFG3021C | 1 | 25 MHz | 250 MSa/s | 128 kpts | USB/LAN/GPIB |
| AFG3022C | 2 | 25 MHz | 250 MSa/s | 128 kpts | USB/LAN/GPIB |
| AFG3051C | 1 | 50 MHz | 250 MSa/s | 128 kpts | USB/LAN/GPIB |
| AFG3052C | 2 | 50 MHz | 250 MSa/s | 128 kpts | USB/LAN/GPIB |
| AFG3101C | 1 | 100 MHz | 1 GSa/s | 128 kpts | USB/LAN/GPIB |
| AFG3102C | 2 | 100 MHz | 1 GSa/s | 128 kpts | USB/LAN/GPIB |
| AFG3151C | 1 | 150 MHz | 1 GSa/s | 128 kpts | USB/LAN/GPIB |
| AFG3152C | 2 | 150 MHz | 1 GSa/s | 128 kpts | USB/LAN/GPIB |
| AFG3251C | 1 | 250 MHz | 2 GSa/s | 128 kpts | USB/LAN/GPIB |
| AFG3252C | 2 | 250 MHz | 2 GSa/s | 128 kpts | USB/LAN/GPIB |

### AFG31000 Series (High Performance)

| Model | Channels | Max Freq | Sample Rate | Arb Memory | Features |
|-------|----------|----------|-------------|------------|----------|
| AFG31021 | 1 | 25 MHz | 250 MSa/s | 16 Mpts | InstaView, USB/LAN |
| AFG31022 | 2 | 25 MHz | 250 MSa/s | 16 Mpts | InstaView, USB/LAN |
| AFG31051 | 1 | 50 MHz | 250 MSa/s | 16 Mpts | InstaView, USB/LAN |
| AFG31052 | 2 | 50 MHz | 250 MSa/s | 16 Mpts | InstaView, USB/LAN |
| AFG31101 | 1 | 100 MHz | 1 GSa/s | 16 Mpts | InstaView, USB/LAN |
| AFG31102 | 2 | 100 MHz | 1 GSa/s | 16 Mpts | InstaView, USB/LAN |
| AFG31151 | 1 | 150 MHz | 1 GSa/s | 16 Mpts | InstaView, USB/LAN |
| AFG31152 | 2 | 150 MHz | 1 GSa/s | 16 Mpts | InstaView, USB/LAN |
| AFG31251 | 1 | 250 MHz | 2 GSa/s | 16 Mpts | InstaView, USB/LAN |
| AFG31252 | 2 | 250 MHz | 2 GSa/s | 16 Mpts | InstaView, USB/LAN |

---

## Connection Methods

| Interface | Port/Settings | Resource String Example |
|-----------|---------------|-------------------------|
| USB-TMC | VID:PID 0699:0353 | `USB0::0x0699::0x0353::C012345::INSTR` |
| LAN (Raw Socket) | Port 4000 | `TCPIP0::192.168.1.50::4000::SOCKET` |
| LAN (VXI-11) | Port 111 | `TCPIP0::192.168.1.50::INSTR` |
| GPIB | Address 0-30 | `GPIB0::1::INSTR` |

**Note:** Tektronix uses port **4000** for raw socket connections (not 5025).

---

## IEEE 488.2 Common Commands

```
*IDN?                → "TEKTRONIX,AFG3102C,C012345,SCPI:99.0 FV:3.0.2"
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
*SAV <n>             → Save state to memory
*RCL <n>             → Recall state from memory
```

---

## Channel Addressing

Tektronix uses `SOURce<n>:` prefix for channel-specific commands:

```
SOURce1:...          → Channel 1 commands
SOURce2:...          → Channel 2 commands
SOUR1:...            → Short form
SOUR2:...            → Short form
```

**Note:** Tektronix often omits the leading colon (uses `SOURce` not `:SOURce`).

---

## Output Control

### Enable/Disable Output

```
OUTPut<n>:STATe {ON|OFF|1|0}                 → Enable/disable output
OUTPut<n>:STATe?                             → Query output state
OUTPut<n>:POLarity {NORMal|INVerted}         → Output polarity
OUTPut<n>:POLarity?                          → Query polarity
```

### Output Impedance

```
OUTPut<n>:IMPedance {<ohms>|INFinity|MINimum|MAXimum}
OUTPut<n>:IMPedance?                         → Query impedance
```

**Values:** 1Ω to 10kΩ, or `INFinity` for High-Z (50Ω typical)

---

## Waveform Selection

### Set Waveform Function

```
SOURce<n>:FUNCtion[:SHAPe] {SINusoid|SQUare|PULSe|RAMP|NOISe|DC|SINC|GAUSsian|LORentz|ERISe|EDECay|HAVersine|USER[1-4]|EMEMory|EFILe}
SOURce<n>:FUNCtion[:SHAPe]?                  → Query waveform type
```

### Waveform Type Values

| Waveform | Command Value | Notes |
|----------|---------------|-------|
| Sine | `SINusoid` | Standard sine |
| Square | `SQUare` | With duty cycle |
| Pulse | `PULSe` | With rise/fall |
| Ramp | `RAMP` | With symmetry |
| Noise | `NOISe` | Gaussian white |
| DC | `DC` | DC level |
| Sinc | `SINC` | Sin(x)/x |
| Gaussian | `GAUSsian` | Gaussian pulse |
| Lorentz | `LORentz` | Lorentzian pulse |
| Exp Rise | `ERISe` | Exponential rise |
| Exp Decay | `EDECay` | Exponential decay |
| Haversine | `HAVersine` | Raised cosine |
| User 1-4 | `USER1` to `USER4` | User memories |
| Edit Memory | `EMEMory` | Edit buffer |
| External File | `EFILe` | From USB/network |

---

## Frequency Settings

### Set/Query Frequency

```
SOURce<n>:FREQuency[:FIXed] <frequency>      → Set frequency (Hz)
SOURce<n>:FREQuency[:FIXed]?                 → Query frequency
SOURce<n>:FREQuency[:FIXed]? MINimum         → Query minimum
SOURce<n>:FREQuency[:FIXed]? MAXimum         → Query maximum
```

### Frequency Concurrent (Both Channels)

```
SOURce:FREQuency:CONCurrent[:STATe] {ON|OFF} → Lock channel frequencies
SOURce:FREQuency:CONCurrent[:STATe]?         → Query state
```

---

## Amplitude Settings

### Set Amplitude (Vpp)

```
SOURce<n>:VOLTage[:LEVel][:IMMediate][:AMPLitude] <vpp>
SOURce<n>:VOLTage[:LEVel][:IMMediate][:AMPLitude]?
SOURce<n>:VOLTage?                           → Short form query
```

### Amplitude Units

```
SOURce<n>:VOLTage:UNIT {VPP|VRMS|DBM}        → Set amplitude unit
SOURce<n>:VOLTage:UNIT?                      → Query unit
```

### High/Low Level (Alternative)

```
SOURce<n>:VOLTage:HIGH <voltage>             → Set high level (V)
SOURce<n>:VOLTage:HIGH?                      → Query high level
SOURce<n>:VOLTage:LOW <voltage>              → Set low level (V)
SOURce<n>:VOLTage:LOW?                       → Query low level
```

### Amplitude Concurrent (Both Channels)

```
SOURce:VOLTage:CONCurrent[:STATe] {ON|OFF}   → Lock channel amplitudes
```

---

## DC Offset

```
SOURce<n>:VOLTage:OFFSet <offset>            → Set DC offset (V)
SOURce<n>:VOLTage:OFFSet?                    → Query offset
```

---

## Phase Settings

```
SOURce<n>:PHASe[:ADJust] <degrees>           → Set phase (degrees)
SOURce<n>:PHASe[:ADJust]?                    → Query phase
SOURce<n>:PHASe:INITiate                     → Align phase to 0°
```

---

## Square Wave Parameters

### Duty Cycle

```
SOURce<n>:FUNCtion:SQUare:DCYCle <percent>   → Set duty cycle (%)
SOURce<n>:FUNCtion:SQUare:DCYCle?            → Query duty cycle
```

---

## Ramp Parameters

### Symmetry

```
SOURce<n>:FUNCtion:RAMP:SYMMetry <percent>   → Set symmetry (0-100%)
SOURce<n>:FUNCtion:RAMP:SYMMetry?            → Query symmetry
```

---

## Pulse Parameters

### Pulse Period

```
SOURce<n>:PULSe:PERiod <seconds>             → Pulse period
SOURce<n>:PULSe:PERiod?                      → Query period
```

### Pulse Width

```
SOURce<n>:PULSe:WIDTh <seconds>              → Pulse width
SOURce<n>:PULSe:WIDTh?                       → Query width
```

### Duty Cycle

```
SOURce<n>:PULSe:DCYCle <percent>             → Duty cycle
SOURce<n>:PULSe:DCYCle?                      → Query duty cycle
```

### Edge Times

```
SOURce<n>:PULSe:TRANsition:LEADing <seconds>    → Rise time
SOURce<n>:PULSe:TRANsition:LEADing?             → Query rise time
SOURce<n>:PULSe:TRANsition:TRAiling <seconds>   → Fall time
SOURce<n>:PULSe:TRANsition:TRAiling?            → Query fall time
SOURce<n>:PULSe:TRANsition:BOTH <seconds>       → Both edges
```

### Pulse Delay

```
SOURce<n>:PULSe:DELay <seconds>              → Pulse delay
SOURce<n>:PULSe:DELay?                       → Query delay
```

---

## Modulation

### AM (Amplitude Modulation)

```
SOURce<n>:AM:STATe {ON|OFF}                  → Enable/disable AM
SOURce<n>:AM:STATe?                          → Query state
SOURce<n>:AM[:DEPTh] <percent>               → Modulation depth (0-120%)
SOURce<n>:AM[:DEPTh]?                        → Query depth
SOURce<n>:AM:SOURce {INTernal|EXTernal}      → Modulation source
SOURce<n>:AM:SOURce?                         → Query source
SOURce<n>:AM:INTernal:FUNCtion {SINusoid|SQUare|RAMP|NRAMp|TRIangle|NOISe|USER[1-4]|EMEMory|EFILe}
SOURce<n>:AM:INTernal:FUNCtion?              → Query function
SOURce<n>:AM:INTernal:FREQuency <hz>         → Internal mod frequency
SOURce<n>:AM:INTernal:FREQuency?             → Query frequency
```

### FM (Frequency Modulation)

```
SOURce<n>:FM:STATe {ON|OFF}                  → Enable/disable FM
SOURce<n>:FM:DEViation <hz>                  → Frequency deviation
SOURce<n>:FM:DEViation?                      → Query deviation
SOURce<n>:FM:SOURce {INTernal|EXTernal}      → Modulation source
SOURce<n>:FM:INTernal:FUNCtion {SINusoid|SQUare|RAMP|NRAMp|TRIangle|NOISe|USER[1-4]|EMEMory|EFILe}
SOURce<n>:FM:INTernal:FREQuency <hz>         → Internal mod frequency
```

### PM (Phase Modulation)

```
SOURce<n>:PM:STATe {ON|OFF}                  → Enable/disable PM
SOURce<n>:PM:DEViation <degrees>             → Phase deviation
SOURce<n>:PM:DEViation?                      → Query deviation
SOURce<n>:PM:SOURce {INTernal|EXTernal}      → Modulation source
SOURce<n>:PM:INTernal:FUNCtion {SINusoid|SQUare|RAMP|NRAMp|TRIangle|NOISe|USER[1-4]|EMEMory|EFILe}
SOURce<n>:PM:INTernal:FREQuency <hz>         → Internal mod frequency
```

### FSK (Frequency Shift Keying)

```
SOURce<n>:FSKey:STATe {ON|OFF}               → Enable/disable FSK
SOURce<n>:FSKey:FREQuency <hz>               → Hop frequency
SOURce<n>:FSKey:FREQuency?                   → Query hop frequency
SOURce<n>:FSKey:SOURce {INTernal|EXTernal}   → Trigger source
SOURce<n>:FSKey:INTernal:RATE <hz>           → Internal rate
```

### PWM (Pulse Width Modulation)

```
SOURce<n>:PWM:STATe {ON|OFF}                 → Enable/disable PWM
SOURce<n>:PWM:DEViation {<seconds>|DCYCle <percent>}
SOURce<n>:PWM:DEViation?                     → Query deviation
SOURce<n>:PWM:SOURce {INTernal|EXTernal}     → Modulation source
SOURce<n>:PWM:INTernal:FUNCtion {SINusoid|SQUare|RAMP|NRAMp|TRIangle|NOISe|USER[1-4]|EMEMory|EFILe}
SOURce<n>:PWM:INTernal:FREQuency <hz>        → Internal mod frequency
```

---

## Sweep

### Enable/Configure Sweep

```
SOURce<n>:SWEep:STATe {ON|OFF}               → Enable/disable sweep
SOURce<n>:SWEep:STATe?                       → Query state
SOURce<n>:SWEep:SPACing {LINear|LOGarithmic} → Sweep type
SOURce<n>:SWEep:SPACing?                     → Query type
SOURce<n>:SWEep:MODE {AUTO|MANual}           → Sweep mode
```

### Frequency Range

```
SOURce<n>:FREQuency:STARt <hz>               → Start frequency
SOURce<n>:FREQuency:STARt?                   → Query start
SOURce<n>:FREQuency:STOP <hz>                → Stop frequency
SOURce<n>:FREQuency:STOP?                    → Query stop
SOURce<n>:FREQuency:CENTer <hz>              → Center frequency
SOURce<n>:FREQuency:SPAN <hz>                → Frequency span
```

### Sweep Timing

```
SOURce<n>:SWEep:TIME <seconds>               → Sweep time
SOURce<n>:SWEep:TIME?                        → Query sweep time
SOURce<n>:SWEep:HTIMe <seconds>              → Hold time
SOURce<n>:SWEep:RTIMe <seconds>              → Return time
```

### Sweep Trigger

```
TRIGger[:SEQuence]:SOURce {INTernal|EXTernal|TIMer}
TRIGger[:SEQuence]:SOURce?                   → Query trigger source
TRIGger[:SEQuence]:SLOPe {POSitive|NEGative} → External slope
TRIGger[:SEQuence]:TIMer <seconds>           → Timer period
TRIGger[:SEQuence][:IMMediate]               → Software trigger
```

---

## Burst Mode

### Enable/Configure Burst

```
SOURce<n>:BURSt:STATe {ON|OFF}               → Enable/disable burst
SOURce<n>:BURSt:STATe?                       → Query state
SOURce<n>:BURSt:MODE {TRIGgered|GATed}       → Burst mode
SOURce<n>:BURSt:MODE?                        → Query mode
```

### Burst Parameters

```
SOURce<n>:BURSt:NCYCles {<count>|INFinity}   → Number of cycles
SOURce<n>:BURSt:NCYCles?                     → Query count
SOURce<n>:BURSt:INTernal:PERiod <seconds>    → Internal burst period
SOURce<n>:BURSt:INTernal:PERiod?             → Query period
SOURce<n>:BURSt:PHASe <degrees>              → Start phase
SOURce<n>:BURSt:PHASe?                       → Query phase
SOURce<n>:BURSt:TDELay <seconds>             → Trigger delay
SOURce<n>:BURSt:TDELay?                      → Query delay
SOURce<n>:BURSt:IDLE {FPT|TOP|CENTer|BOTTom} → Idle level
```

### Burst Trigger

```
SOURce<n>:BURSt:TRIGger:SOURce {INTernal|EXTernal|TIMer}
SOURce<n>:BURSt:TRIGger:SLOPe {POSitive|NEGative}
SOURce<n>:BURSt:TRIGger[:IMMediate]          → Manual trigger
*TRG                                          → Software trigger
```

---

## Arbitrary Waveforms

### List Available Waveforms

```
SOURce<n>:FUNCtion:ARBitrary:CATalog?        → List waveforms
DATA:CATalog?                                 → Alternative
```

### Select Arbitrary Waveform

```
SOURce<n>:FUNCtion:ARBitrary "<name>"        → Select waveform
SOURce<n>:FUNCtion {USER1|USER2|USER3|USER4} → Select user memory
SOURce<n>:FUNCtion EMEMory                    → Select edit memory
SOURce<n>:FUNCtion EFILe                      → Select external file
```

### Edit Memory Operations

```
DATA:DEFine EMEMory,<length>                 → Define edit memory size
DATA:POINts EMEMory,<length>                 → Set number of points
DATA:DATA EMEMory,<data>                     → Load data to edit memory
TRACE EMEMory,<data>                         → Alternative load command
```

### Data Format

```
DATA:DATA EMEMory,#<header><binary_data>     → Binary block format
```

**Data values:** 14-bit unsigned (0-16383) or 16-bit signed (-32768 to +32767)

### Copy Waveforms

```
DATA:COPY USER1,EMEMory                      → Copy edit to user memory
DATA:COPY EMEMory,"<filename>"               → Copy file to edit memory
```

### Sample Rate / Frequency

For arbitrary waveforms, frequency is set using the standard frequency command:

```
SOURce<n>:FREQuency <hz>                     → Set output frequency
```

The sample rate is determined by: `Sample Rate = Frequency × Points`

### Arbitrary Marker

```
OUTPut<n>:TRIGger:ARBitrary:MARKer {ON|OFF}  → Enable marker
OUTPut<n>:TRIGger:ARBitrary:MARKer?          → Query marker state
```

---

## Trigger Output

### Trigger Output Enable

```
OUTPut<n>:TRIGger[:STATe] {ON|OFF}           → Enable trigger output
OUTPut<n>:TRIGger[:STATe]?                   → Query state
OUTPut<n>:TRIGger:POLarity {POSitive|NEGative}
OUTPut<n>:TRIGger:SLOPe {POSitive|NEGative}  → Alternative
```

---

## External Reference

### Reference Clock

```
SOURce:ROSCillator:SOURce {INTernal|EXTernal}    → Clock source
SOURce:ROSCillator:SOURce?                       → Query source
SOURce:ROSCillator:EXTernal:FREQuency <hz>       → External freq
```

---

## Noise Bandwidth (AFG31000)

```
SOURce<n>:NOISe:FUNCtion {GAUSsian|UNIForm}  → Noise type
SOURce<n>:NOISe:BANDwidth <hz>               → Bandwidth limit
SOURce<n>:NOISe:LEVel <percent>              → Noise level
```

---

## System Commands

### Error Query

```
SYSTem:ERRor[:NEXT]?                         → Get next error
*ESR?                                         → Event status register
```

### Beeper

```
SYSTem:BEEPer[:IMMediate]                    → Beep once
SYSTem:BEEPer:STATe {ON|OFF}                 → Enable/disable beeper
```

### Display

```
DISPlay[:WINDow][:STATe] {ON|OFF}            → Display on/off
DISPlay:BRIGhtness <percent>                 → Brightness (AFG31000)
```

### Remote/Local

```
SYSTem:LOCal                                 → Set local mode
SYSTem:REMote                                → Set remote mode
```

### Clock

```
SYSTem:DATE <year>,<month>,<day>             → Set date
SYSTem:TIME <hour>,<minute>,<second>         → Set time
```

---

## LAN Configuration

```
SYSTem:COMMunicate:LAN:IPADdress "<address>"
SYSTem:COMMunicate:LAN:IPADdress?
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
STATus:PRESet
```

---

## InstaView (AFG31000)

InstaView feature shows actual output waveform on display:

```
DISPlay:INSTaview[:STATe] {ON|OFF}           → Enable InstaView
DISPlay:INSTaview[:STATe]?                   → Query state
```

---

## Programming Examples

### Basic Sine Wave

```
*RST
SOUR1:FUNC SIN                      # Sine wave
SOUR1:FREQ 1000                     # 1 kHz
SOUR1:VOLT 2.0                      # 2 Vpp
SOUR1:VOLT:OFFS 0                   # No offset
OUTP1:STAT ON                       # Enable output
```

### Square Wave with Duty Cycle

```
*RST
SOUR1:FUNC SQU                      # Square wave
SOUR1:FREQ 10000                    # 10 kHz
SOUR1:VOLT 3.3                      # 3.3 Vpp
SOUR1:VOLT:OFFS 1.65                # 0-3.3V
SOUR1:FUNC:SQU:DCYC 25              # 25% duty cycle
OUTP1:IMP INF                       # High-Z
OUTP1:STAT ON
```

### Pulse Train

```
*RST
SOUR1:FUNC PULS                     # Pulse mode
SOUR1:PULS:PER 0.0001               # 100 µs period (10 kHz)
SOUR1:PULS:WIDT 0.00001             # 10 µs pulse width
SOUR1:PULS:TRAN:LEAD 1E-8           # 10 ns rise
SOUR1:PULS:TRAN:TRAI 1E-8           # 10 ns fall
SOUR1:VOLT 5.0
OUTP1:STAT ON
```

### Frequency Sweep

```
*RST
SOUR1:FUNC SIN
SOUR1:VOLT 1.0
SOUR1:FREQ:STAR 100                 # Start: 100 Hz
SOUR1:FREQ:STOP 10000               # Stop: 10 kHz
SOUR1:SWE:SPAC LIN                  # Linear sweep
SOUR1:SWE:TIME 5                    # 5 seconds
TRIG:SOUR INT                       # Internal trigger
SOUR1:SWE:STAT ON                   # Enable sweep
OUTP1:STAT ON
```

### Burst Mode

```
*RST
SOUR1:FUNC SIN
SOUR1:FREQ 10000                    # 10 kHz carrier
SOUR1:VOLT 2.0
SOUR1:BURS:MODE TRIG                # Triggered burst
SOUR1:BURS:NCYC 10                  # 10 cycles
SOUR1:BURS:TRIG:SOUR EXT            # External trigger
SOUR1:BURS:STAT ON                  # Enable burst
OUTP1:STAT ON
# Or trigger manually:
SOUR1:BURS:TRIG:SOUR INT
*TRG
```

### AM Modulation

```
*RST
SOUR1:FUNC SIN
SOUR1:FREQ 100000                   # 100 kHz carrier
SOUR1:VOLT 2.0
SOUR1:AM:SOUR INT                   # Internal modulation
SOUR1:AM:INT:FUNC SIN               # Sine modulating wave
SOUR1:AM:INT:FREQ 1000              # 1 kHz modulation
SOUR1:AM:DEPT 80                    # 80% depth
SOUR1:AM:STAT ON                    # Enable AM
OUTP1:STAT ON
```

### Load Arbitrary Waveform

```
*RST
# Define edit memory with 1000 points
DATA:DEF EMEM,1000

# Load data (example: simple ramp)
# Data values 0-16383 for 14-bit
DATA:DATA EMEM,#<binary_block>

# Copy to user memory
DATA:COPY USER1,EMEM

# Select and output
SOUR1:FUNC USER1
SOUR1:FREQ 1000                     # 1 kHz output
SOUR1:VOLT 2.0
OUTP1:STAT ON
```

### Dual Channel 90° Phase

```
*RST
SOUR1:FUNC SIN
SOUR1:FREQ 1000
SOUR1:VOLT 2.0
SOUR1:PHAS 0                        # CH1 at 0°

SOUR2:FUNC SIN
SOUR2:FREQ 1000
SOUR2:VOLT 2.0
SOUR2:PHAS 90                       # CH2 at 90°

SOUR1:PHAS:INIT                     # Align phases

OUTP1:STAT ON
OUTP2:STAT ON
```

---

## Connection Examples

### Python with pyvisa

```python
import pyvisa

rm = pyvisa.ResourceManager()
awg = rm.open_resource('TCPIP0::192.168.1.50::4000::SOCKET')
awg.read_termination = '\n'
awg.write_termination = '\n'

print(awg.query('*IDN?'))

# Configure 1 kHz sine wave
awg.write('SOUR1:FUNC SIN')
awg.write('SOUR1:FREQ 1000')
awg.write('SOUR1:VOLT 2.0')
awg.write('SOUR1:VOLT:OFFS 0')
awg.write('OUTP1:STAT ON')

# Query frequency
freq = awg.query('SOUR1:FREQ?')
print(f"Frequency: {freq}")

awg.close()
```

### TypeScript with visa-ts

```typescript
import { createResourceManager } from 'visa-ts';

async function generateWaveform() {
  const rm = createResourceManager();
  const awg = await rm.open('TCPIP0::192.168.1.50::4000::SOCKET');

  const idnResult = await awg.query('*IDN?');
  if (idnResult.ok) {
    console.log(`Connected to: ${idnResult.value}`);
  }

  await awg.write('SOUR1:FUNC SIN');
  await awg.write('SOUR1:FREQ 1000');
  await awg.write('SOUR1:VOLT 2.0');
  await awg.write('SOUR1:VOLT:OFFS 0');
  await awg.write('OUTP1:STAT ON');

  // Query settings
  const freqResult = await awg.query('SOUR1:FREQ?');
  if (freqResult.ok) {
    console.log(`Frequency: ${parseFloat(freqResult.value)} Hz`);
  }

  await awg.close();
}
```

### Upload Binary Arbitrary Data

```python
import struct

# Generate sine wave data (14-bit unsigned: 0-16383)
import math
points = 1000
data = []
for i in range(points):
    # Scale -1 to +1 to 0 to 16383
    value = int(8191.5 + 8191.5 * math.sin(2 * math.pi * i / points))
    data.append(value)

# Pack as binary (big-endian 16-bit unsigned)
binary_data = struct.pack(f'>{points}H', *data)

# Create IEEE 488.2 header
size_str = str(len(binary_data))
header = f'#{len(size_str)}{size_str}'

# Define memory and send data
awg.write(f'DATA:DEF EMEM,{points}')
awg.write_raw(f'DATA:DATA EMEM,{header}'.encode() + binary_data + b'\n')

# Copy to user memory and select
awg.write('DATA:COPY USER1,EMEM')
awg.write('SOUR1:FUNC USER1')
```

---

## Notes

1. **Port 4000**: Tektronix uses port 4000 for raw socket (not 5025).

2. **No Leading Colon**: Tektronix commands often omit the leading colon (`SOUR1:` not `:SOUR1:`).

3. **Output Impedance**: Default is 50Ω. Set to `INFinity` for high-Z.

4. **Built-in Waveforms**: Includes Sinc, Gaussian, Lorentz, exponential rise/decay, haversine.

5. **User Memories**: Four user memory slots (USER1-USER4) for arbitrary waveforms.

6. **Edit Memory**: EMEMory is a scratchpad for creating/modifying waveforms before copying.

7. **14-bit Resolution**: AFG3000C uses 14-bit DAC (0-16383 values).

8. **InstaView**: AFG31000 series can display actual output waveform on screen.

9. **Channel Concurrency**: Use `:CONCurrent` commands to lock channel parameters.

10. **Phase Init**: Use `SOURce<n>:PHASe:INITiate` to reset phase alignment.
