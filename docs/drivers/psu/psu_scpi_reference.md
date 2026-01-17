# Power Supply (PSU) SCPI Command Reference

> Comprehensive multi-vendor SCPI reference for programmable DC power supplies
> Covers entry-level through professional-grade instruments

## Instrument Coverage

### Entry Level ($200-$600)

| Vendor | Model Series | Channels | Voltage | Current | Interface | Notes |
|--------|--------------|----------|---------|---------|-----------|-------|
| Rigol | DP832/DP832A | 3 | 30V/30V/5V | 3A/3A/3A | USB/LAN/RS232 | Popular entry PSU |
| Rigol | DP831/DP821A | 3 | 8V/30V/-30V | 5A/2A/2A | USB/LAN | With negative rail |
| Rigol | DP811/DP811A | 1 | 40V | 10A | USB/LAN | 200W single |
| Siglent | SPD3303X | 3 | 32V/32V/5V | 3.2A | USB/LAN | Series/parallel modes |
| Siglent | SPD1168X | 1 | 16V | 8A | USB/LAN | 128W compact |
| BK Precision | 9130B | 3 | 30V/30V/5V | 3A/3A/3A | USB/LAN/GPIB | Workhorse 195W |
| BK Precision | 9140 | 3 | 32V/32V/6V | 10A/6A/5A | USB/LAN/GPIB | 300W |

### Mid-Range ($600-$2000)

| Vendor | Model Series | Channels | Voltage | Current | Interface | Notes |
|--------|--------------|----------|---------|---------|-----------|-------|
| GW Instek | GPD-4303S | 4 | 30V/30V/5V/15V | 3A/3A/3A/1A | USB/LAN | 4-channel |
| GW Instek | GPP-4323 | 4 | 32V×2 + 5V/15V | 3A | USB/LAN | Isolated channels |
| ITECH | IT6322 | 3 | 30V/30V/5V | 3A/3A/3A | USB/LAN/GPIB | 195W total |
| ITECH | IT6302 | 3 | 30V/30V/5V | 3A/3A/3A | USB/RS232 | Budget ITECH |
| BK Precision | 9200 | 1 | 60V/100V | 10A/5A | USB/LAN/GPIB | 600W programmable |
| Korad | KA3005P | 1 | 30V | 5A | USB | Popular hobbyist |
| RND | 320-KD3005P | 1 | 30V | 5A | USB | Korad OEM |

### Professional ($2000+)

| Vendor | Model Series | Channels | Voltage | Current | Interface | Notes |
|--------|--------------|----------|---------|---------|-----------|-------|
| Keysight | E3631A | 3 | 6V/25V/-25V | 5A/1A/1A | GPIB | Legacy triple |
| Keysight | E36312A | 3 | 6V/25V/25V | 5A/1A/1A | USB/LAN/GPIB | Modern triple |
| Keysight | E36313A | 3 | 6V/25V/25V | 10A/2A/2A | USB/LAN/GPIB | Higher current |
| Keysight | N6700C | 4 slots | Modular | Modular | USB/LAN/GPIB | Mainframe system |
| Keysight | N6705C | 4 slots | Modular | Modular | USB/LAN/GPIB | DC power analyzer |
| R&S | NGE102B | 2 | 32V | 3A | USB/LAN | 66W dual |
| R&S | HMP4040 | 4 | 32V | 10A | USB/LAN/GPIB | 384W quad |
| R&S | HMP2030 | 3 | 32V/32V/5.5V | 5A/5A/5A | USB/LAN | 188W triple |
| Chroma | 62012P-80-60 | 1 | 80V | 60A | USB/LAN/GPIB | 1200W |
| Chroma | 62024P-100-50 | 1 | 100V | 50A | USB/LAN/GPIB | 2400W |

---

## IEEE 488.2 Common Commands (Universal)

All SCPI-compliant power supplies support:

```
*IDN?                → Instrument identification
*RST                 → Reset to default state
*CLS                 → Clear status registers
*ESE <mask>          → Event status enable register
*ESE?                → Query event status enable
*ESR?                → Query event status register
*OPC                 → Operation complete (set bit when done)
*OPC?                → Query operation complete (returns 1)
*SRE <mask>          → Service request enable register
*SRE?                → Query service request enable
*STB?                → Query status byte
*TST?                → Self-test (0=pass)
*WAI                 → Wait for operations complete
*SAV <n>             → Save state to memory n
*RCL <n>             → Recall state from memory n
```

---

## Channel Selection

Different vendors use different channel addressing schemes:

### Rigol DP800 Series
```
:INSTrument[:SELect] CH{1|2|3}      → Select channel
:INSTrument[:SELect]?               → Query selected channel
:INSTrument:NSELect {1|2|3}         → Select by number
:INSTrument:NSELect?                → Query channel number
```

### Siglent SPD Series
```
INSTrument {CH1|CH2}                → Select channel
INSTrument?                         → Query selected channel
```
Or use prefix: `CH1:VOLTage`, `CH2:CURRent`

### Keysight E36xx Series
```
INSTrument:SELect {OUTPut1|OUTPut2|OUTPut3|P6V|P25V|N25V}
INSTrument:NSELect {1|2|3}
```
Alias names (E3631A): `P6V`, `P25V`, `N25V`

### R&S HMP/NGE Series
```
INSTrument:SELect {OUTPut1|OUTPut2|...}
INSTrument:NSELect {1|2|3|4}
INSTrument[:SELect]?
```

### BK Precision 9130
```
INSTrument {CH1|CH2|CH3}
INSTrument?
```

### Chroma 62000P
```
CHAN:SEL {1|2|...}        → Select channel (multi-channel models)
CHAN:SEL?                 → Query selected channel
```

---

## Voltage Commands

### Set Voltage

| Vendor | Command | Notes |
|--------|---------|-------|
| Rigol | `[:SOURce[<n>]]:VOLTage[:LEVel][:IMMediate][:AMPLitude] <volts>` | Full SCPI |
| Rigol | `CH1:VOLT 12.0` | Short form |
| Siglent | `[CH{1|2}:]VOLTage <volts>` | Optional prefix |
| Keysight E36xx | `[SOURce:]VOLTage[:LEVel][:IMMediate][:AMPLitude] <volts>` | On selected channel |
| Keysight | `VOLTage <volts>,(@1)` | With channel list |
| R&S | `[SOURce:]VOLTage[:LEVel][:IMMediate][:AMPLitude] <volts>` | Standard SCPI |
| BK Precision | `[SOURce:]VOLTage <volts>` | On selected channel |
| GW Instek | `[SOURce<n>:]VOLTage <volts>` | Numeric suffix |
| ITECH | `[SOURce:]VOLTage <volts>` | Standard SCPI |
| Chroma | `[SOURce:]VOLTage <volts>` | Standard SCPI |

### Query Voltage Setpoint

| Vendor | Command | Response |
|--------|---------|----------|
| All | `VOLTage?` or `VOLT?` | `<volts>` (float) |
| Rigol | `:SOURce1:VOLTage?` | `12.000` |
| Keysight | `VOLTage? (@1,2,3)` | Multiple channels |

### Voltage Limits (Protection)

| Vendor | Command | Notes |
|--------|---------|-------|
| Rigol | `VOLTage:PROTection <volts>` | OVP setpoint |
| Rigol | `VOLTage:PROTection:STATe {ON|OFF}` | Enable OVP |
| Rigol | `VOLTage:PROTection:TRIPped?` | Query if tripped |
| Rigol | `VOLTage:PROTection:CLEar` | Clear OVP trip |
| Siglent | (Not available via SCPI - front panel only) | |
| Keysight | `VOLTage:PROTection[:LEVel] <volts>` | OVP level |
| Keysight | `VOLTage:PROTection:STATe {ON|OFF|0|1}` | Enable |
| Keysight | `VOLTage:PROTection:TRIPped?` | `0` or `1` |
| Keysight | `VOLTage:PROTection:CLEar` | Reset trip |
| R&S | `VOLTage:PROTection[:LEVel] <volts>` | |
| R&S | `VOLTage:PROTection:MODE {MEASured|SOURce}` | Trip reference |
| BK | `VOLTage:LIMit[:HIGH] <volts>` | Soft limit |
| Chroma | `VOLTage:PROTection:LEVel <volts>` | OVP |

### Voltage Range Selection (High-Power Units)

Some supplies have switchable voltage ranges:
```
# Keysight N6700 modules
VOLTage:RANGe {LOW|HIGH}
VOLTage:RANGe?

# Chroma 62000P
VOLTage:RANGe {HIGH|LOW|AUTO}
```

---

## Current Commands

### Set Current Limit

| Vendor | Command | Notes |
|--------|---------|-------|
| Rigol | `[:SOURce[<n>]]:CURRent[:LEVel][:IMMediate][:AMPLitude] <amps>` | |
| Rigol | `CH1:CURR 1.5` | Short form |
| Siglent | `[CH{1|2}:]CURRent <amps>` | |
| Keysight | `[SOURce:]CURRent[:LEVel][:IMMediate][:AMPLitude] <amps>` | |
| R&S | `[SOURce:]CURRent[:LEVel][:IMMediate][:AMPLitude] <amps>` | |
| BK | `[SOURce:]CURRent <amps>` | |
| ITECH | `[SOURce:]CURRent <amps>` | |
| Chroma | `[SOURce:]CURRent <amps>` | |

### Query Current Setpoint

```
CURRent?                → Returns current limit setpoint
:SOURce1:CURRent?       → Channel-specific (Rigol)
CURR? (@1,2,3)          → Multiple channels (Keysight)
```

### Over-Current Protection

| Vendor | Command | Notes |
|--------|---------|-------|
| Rigol | `CURRent:PROTection <amps>` | OCP level |
| Rigol | `CURRent:PROTection:STATe {ON|OFF}` | Enable |
| Rigol | `CURRent:PROTection:TRIPped?` | |
| Rigol | `CURRent:PROTection:CLEar` | |
| Keysight | `CURRent:PROTection[:LEVel] <amps>` | |
| Keysight | `CURRent:PROTection:STATe {ON|OFF}` | |
| Keysight | `CURRent:PROTection:DELay <seconds>` | Trip delay |
| R&S | `CURRent:PROTection[:LEVel] <amps>` | |
| R&S | `FUSE:LINK {1|2|3|4}` | Channel linking |
| Chroma | `CURRent:PROTection:LEVel <amps>` | |

---

## Measurement Commands

### Measure Voltage

| Vendor | Command | Response |
|--------|---------|----------|
| Rigol | `:MEASure[:SCALar]:VOLTage[:DC]?` | Measured V |
| Rigol | `:MEASure:VOLTage? CH1` | With channel |
| Siglent | `MEASure:VOLTage? [CH{1|2}]` | |
| Keysight | `MEASure[:SCALar]:VOLTage[:DC]?` | |
| Keysight | `MEASure:VOLTage? (@1,2,3)` | Multiple |
| R&S | `MEASure[:SCALar]:VOLTage[:DC]?` | |
| BK | `MEASure:VOLTage?` | |
| ITECH | `MEASure:VOLTage?` | |
| Chroma | `MEASure:VOLTage?` | |

### Measure Current

| Vendor | Command | Response |
|--------|---------|----------|
| Rigol | `:MEASure[:SCALar]:CURRent[:DC]?` | Measured A |
| Rigol | `:MEASure:CURRent? CH1` | With channel |
| Siglent | `MEASure:CURRent? [CH{1|2}]` | |
| Keysight | `MEASure[:SCALar]:CURRent[:DC]?` | |
| Keysight | `MEASure:CURRent? (@1,2,3)` | Multiple |
| R&S | `MEASure[:SCALar]:CURRent[:DC]?` | |
| BK | `MEASure:CURRent?` | |
| ITECH | `MEASure:CURRent?` | |
| Chroma | `MEASure:CURRent?` | |

### Measure Power

| Vendor | Command | Notes |
|--------|---------|-------|
| Rigol | `:MEASure:POWEr[:DC]?` | Returns watts |
| Siglent | `MEASure:POWEr? [CH{1|2}]` | |
| Keysight E36xx | (Calculate: V × I) | Not direct |
| Keysight N6700 | `MEASure:POWEr?` | Available |
| R&S | `MEASure:POWEr?` | |
| Chroma | `MEASure:POWEr?` | |

### Measure All (Combined Query)

```
# Rigol - returns voltage, current, power
:MEASure:ALL[:DC]?              → <V>,<A>,<W>

# Keysight - parallel measurement
MEASure:VOLTage? (@1,2,3);CURRent? (@1,2,3)

# R&S
MEASure:ALL?                    → Voltage, current
```

---

## Output Control

### Enable/Disable Output

| Vendor | Command | Notes |
|--------|---------|-------|
| Rigol | `:OUTPut[:STATe] {ON|OFF|1|0}` | Selected channel |
| Rigol | `:OUTPut:STATe CH1,{ON|OFF}` | Specific channel |
| Siglent | `OUTPut {CH1|CH2|CH3},{ON|OFF}` | |
| Keysight | `OUTPut[:STATe] {ON|OFF|1|0}` | Selected channel |
| Keysight | `OUTPut:STATe {ON|OFF},(@1,2,3)` | Multiple |
| R&S | `OUTPut[:STATe] {ON|OFF|1|0}` | |
| R&S | `OUTPut:GENeral[:STATe] {ON|OFF}` | Master output |
| BK | `OUTPut[:STATe] {ON|OFF}` | |
| ITECH | `OUTPut[:STATe] {ON|OFF}` | |
| Chroma | `OUTPut[:STATe] {ON|OFF}` | |
| Chroma | `CONFigure:OUTPut {ON|OFF}` | Alternate |

### Query Output State

```
OUTPut[:STATe]?               → Returns 0 or 1
OUTPut:STATe? (@1,2)          → Multiple channels (Keysight)
```

### All Outputs On/Off (Master)

| Vendor | Command | Notes |
|--------|---------|-------|
| Rigol | `:OUTPut:OCP:VALue {ON|OFF}` | Global enable |
| Keysight N6700 | `OUTPut:STATe {ON|OFF},(@1,2,3,4)` | All channels |
| R&S | `OUTPut:GENeral[:STATe] {ON|OFF}` | Master switch |
| R&S | `OUTPut:MASTer[:STATe] {ON|OFF}` | Some models |
| Chroma | `OUTPut:ALL {ON|OFF}` | |

### Output Coupling/Tracking

| Vendor | Command | Notes |
|--------|---------|-------|
| Rigol | `:OUTPut:TRACk {ON|OFF}` | CH1/CH2 track |
| Siglent | `OUTPut:TRACK {0|1|2}` | 0=indep, 1=series, 2=parallel |
| R&S | `INSTrument:COUPle:TRACking[:STATe] {ON|OFF}` | |
| Keysight | `OUTPut:COUPle:CHANnel:STATe {ON|OFF}` | |
| GW Instek | `OUTPut:TRACk:MODE {INDependent|SERies|PARallel}` | |

### Output Mode Query (CV/CC)

```
# Rigol
:OUTPut:CVCC?                 → Returns CV or CC

# Keysight
STATus:QUEStionable:INSTrument:ISUMmary<n>:CONDition?
  Bit 0 = CV, Bit 1 = CC

# R&S
STATus:QUEStionable:INSTrument:ISUMmary<n>?

# BK
STATus:OPERation:CONDition?
  Bit 8 = CC mode
```

---

## Slew Rate / Ramp Control

For supplies supporting programmable rise/fall times:

### Rigol DP800 (Limited)
```
# Not directly supported - output changes immediately
```

### Keysight E36300/N6700
```
[SOURce:]VOLTage:SLEW[:IMMediate] <V/s>     → Set slew rate
[SOURce:]VOLTage:SLEW?                       → Query slew rate
[SOURce:]VOLTage:SLEW:MAXimum?              → Max supported
[SOURce:]CURRent:SLEW[:IMMediate] <A/s>
```

### R&S HMP/NGE
```
SOURce:VOLTage:RAMP[:STATe] {ON|OFF}
SOURce:VOLTage:RAMP:DURation <seconds>
SOURce:CURRent:RAMP[:STATe] {ON|OFF}
SOURce:CURRent:RAMP:DURation <seconds>
```

### Chroma 62000P
```
SOURce:VOLTage:SLEW:RISing <V/ms>
SOURce:VOLTage:SLEW:FALLing <V/ms>
SOURce:CURRent:SLEW:RISing <A/ms>
SOURce:CURRent:SLEW:FALLing <A/ms>
```

---

## List/Sequence Mode

For programmed voltage/current sequences:

### Rigol DP800 (Timer)
```
:TIMEr:PARameters <n>,<V>,<A>,<time_sec>    → Set step n
:TIMEr:PARameters? <n>                      → Query step
:TIMEr[:STATe] {ON|OFF}                     → Enable/disable
:TIMEr:CYCLes {N|INFinity}                  → Repeat count
```

### Siglent SPD (Timer)
```
TIMEr:SET {CH1|CH2},<step>,<V>,<A>,<time>   → Set step
TIMEr:SET? {CH1|CH2},<step>                 → Query
TIMEr {CH1|CH2},{ON|OFF}                    → Enable
```

### Keysight E36300/N6700 (List)
```
[SOURce:]LIST:VOLTage <v1>,<v2>,<v3>,...    → Voltage list
[SOURce:]LIST:CURRent <i1>,<i2>,<i3>,...    → Current list
[SOURce:]LIST:DWELl <t1>,<t2>,<t3>,...      → Dwell times
[SOURce:]LIST:COUNt <n>                     → Iterations
TRIGger:SOURce {IMMediate|BUS|EXTernal}
INITiate[:IMMediate]                        → Start
```

### R&S (Arbitrary)
```
ARBitrary:VOLTage[:DATA] <v1>,<v2>,...
ARBitrary:CURRent[:DATA] <i1>,<i2>,...
ARBitrary:DWELl[:DATA] <t1>,<t2>,...
ARBitrary:REPetitions {<n>|INFinity}
ARBitrary[:STATe] {ON|OFF}
```

### Chroma 62000P (Sequence)
```
SEQuence:STEP <n>,<V>,<I>,<time>
SEQuence:COUNt <n>
SEQuence:MODE {ONCE|REPeat}
SEQuence:STATe {ON|OFF}
```

---

## Trigger System

### Basic Trigger

| Vendor | Command | Notes |
|--------|---------|-------|
| Rigol | `:TRIGger[:SEQuence]:SOURce {IMMediate|BUS|EXTernal}` | |
| Rigol | `:TRIGger[:SEQuence]:DELay <seconds>` | |
| Rigol | `*TRG` or `:TRIGger[:SEQuence]:IMMediate` | Execute |
| Keysight | `TRIGger:SOURce {IMMediate|BUS|EXTernal}` | |
| Keysight | `TRIGger:DELay <seconds>` | |
| Keysight | `INITiate[:IMMediate]` | Arm |
| Keysight | `*TRG` | Software trigger |
| R&S | `TRIGger:SOURce {IMMediate|BUS|EXTernal}` | |
| Chroma | `TRIGger:SOURce {IMMediate|BUS|EXTernal|MANual}` | |

### Transient Mode (For Step Changes)

```
# Keysight - Toggle between two levels on trigger
[SOURce:]VOLTage:TRIGgered[:IMMediate] <volts>   → Triggered level
[SOURce:]VOLTage:MODE {FIXed|STEP|LIST|ARB}
TRIGger:SOURce BUS
INITiate
*TRG                                              → Step to triggered level

# R&S
SOURce:VOLTage:TRIGgered <volts>
SOURce:FUNCtion:MODE {FIXed|LIST|ARBitrary}
```

---

## System Commands

### Status and Errors

```
# All vendors (IEEE 488.2)
SYSTem:ERRor[:NEXT]?            → Returns error code and message
                                   0,"No error" = OK
SYSTem:ERRor:COUNt?             → Number of errors in queue

# Rigol
:SYSTem:VERSion?                → Firmware version
:SYSTem:SERial?                 → Serial number (some models)

# Keysight
SYSTem:VERSion?                 → SCPI version
SYSTem:HELP:HEADers?            → List all commands
SYSTem:CAPability?              → Device capabilities

# R&S
SYSTem:VERSion?
SYSTem:DEVice?                  → Full device info
```

### State Save/Recall

```
# All vendors
*SAV {1|2|3|4|5}                → Save to slot
*RCL {1|2|3|4|5}                → Recall from slot

# Keysight extended
MEMory:STATe:NAME <slot>,"<name>"
MEMory:STATe:DELete <slot>
MEMory:STATe:VALid? <slot>

# R&S
*SAV {0|1|2|3|4|5|6|7|8|9}      → More slots
*RCL {0|1|2|3|4|5|6|7|8|9}
```

### Remote/Local Control

```
# Switch to remote mode (lock front panel)
SYSTem:REMote                   → Some vendors
SYSTem:RWLock                   → Remote with lock (Keysight)

# Return to local control
SYSTem:LOCal                    → Enable front panel
GTL (GPIB)                      → Go to local

# Keysight specific
SYSTem:COMMunicate:RLSTate {LOCal|REMote|RWLock}
```

### Display Control

```
# Rigol
:DISPlay[:WINDow]:TEXT[:DATA] "<message>"
:DISPlay[:WINDow]:TEXT:CLEar
:DISPlay:FOCUs {V|I}            → Voltage or current focus

# Keysight
DISPlay[:WINDow]:TEXT[:DATA] "<message>"
DISPlay[:WINDow]:TEXT:CLEar
DISPlay[:WINDow]:STATe {ON|OFF}  → Screen on/off

# R&S
DISPlay:BRIGhtness <0-1>
```

---

## Vendor-Specific Features

### Rigol DP800 Special

```
# Analyzer function (DP831/832)
:ANALyzer:STARt                 → Start data logging
:ANALyzer:STOP                  → Stop logging
:ANALyzer:CURRent:MAX?          → Max current during logging
:ANALyzer:POWer:AVER?           → Average power

# OTP (Over-Temperature Protection)
:SYSTem:OTP?                    → Query OTP state
:SYSTem:OTP:CLEar               → Clear OTP trip

# Delay on power-up
:OUTPut:DELay:STATe {ON|OFF}
:OUTPut:DELay CH1,<seconds>     → Turn-on delay
```

### Siglent SPD Series Special

```
# Status register
SYSTem:STATus?                  → Returns hex status word
  Bit 0: CH1 CV/CC
  Bit 1: CH2 CV/CC
  Bit 4: CH1 ON/OFF
  Bit 5: CH2 ON/OFF

# Operating modes
OUTPut:TRACK 0                  → Independent
OUTPut:TRACK 1                  → Series (CH1+CH2)
OUTPut:TRACK 2                  → Parallel (CH1||CH2)

# Waveform display
OUTPut:WAVE {CH1|CH2},{ON|OFF}
```

### Keysight E36300/N6700 Special

```
# Output relay control
OUTPut:RELay[:STATe] {ON|OFF}   → Disconnect relay

# Sense terminals (4-wire)
VOLTage:SENSe:SOURce {INTernal|EXTernal}

# Negative voltage polarity (for -25V rail on E3631A)
OUTPut:POLarity {NORMal|INVert}

# Current range
CURRent:RANGe {LOW|HIGH}        → N6700 modules
CURRent:RANGe?

# Priority mode
VOLTage:PRIority                → CV priority
CURRent:PRIority                → CC priority
```

### R&S HMP/NGE Special

```
# Fusing (electronic fuse linking)
FUSE[:STATe] {ON|OFF}           → Enable fuse for channel
FUSE:LINK {1|2|3|4}             → Link channels
FUSE:DELay <seconds>            → Fuse trip delay
FUSE:TRIPped?                   → Query trip state
FUSE:RESet                      → Reset after trip

# EasyArb
ARBitrary:DATA <points>         → Load waveform data
ARBitrary:REPetitions {n|INF}
ARBitrary:TRANsfer:STATe {ON|OFF}
ARBitrary[:STATe] {ON|OFF}

# Logarithmic stepping
SOURce:VOLTage:SCALe {LINear|LOGarithmic}
```

### Chroma 62000P Special

```
# Operating modes
MODE {CV|CC|CP}                 → Constant V/I/P mode
MODE:CV:SETTing <volts>         → CV setpoint
MODE:CC:SETTing <amps>          → CC setpoint
MODE:CP:SETTing <watts>         → CP setpoint

# External analog programming
CONFigure:EXTernal:VOLTage:CONTrol {ENABle|DISable}
CONFigure:EXTernal:CURRent:CONTrol {ENABle|DISable}

# Protection
PROTection:OVP[:LEVel] <volts>
PROTection:OCP[:LEVel] <amps>
PROTection:OPP[:LEVel] <watts>  → Over-power protection
PROTection:CLEar                → Clear all protection trips

# Bleeder
OUTPut:BLEeder[:STATe] {ON|OFF}  → Discharge when off
```

### ITECH IT6000 Special

```
# Operating mode
SOURce:MODE {VOLTage|CURRent|POWer}

# Internal resistance simulation
RESistance[:STATe] {ON|OFF}
RESistance[:LEVel] <ohms>

# Battery simulation
SOURce:FUNCtion {FIXed|BATT|SOLar}
SOURce:BATT:TYPE {LEAD|NI|LITH}
SOURce:BATT:CAPacity <Ah>

# Parallel/series configuration
SYSTem:CONFigure:MODE {NORMal|MASTer|SLAVe}
SYSTem:CONFigure:SYNChronization {ON|OFF}
```

---

## Vendor Command Variations Summary

| Function | Rigol DP800 | Siglent SPD | Keysight E36xx | R&S HMP | Chroma 62000P |
|----------|-------------|-------------|----------------|---------|---------------|
| Set voltage | `VOLT <v>` | `VOLT <v>` | `VOLT <v>` | `VOLT <v>` | `VOLT <v>` |
| Set current | `CURR <i>` | `CURR <i>` | `CURR <i>` | `CURR <i>` | `CURR <i>` |
| Output on | `OUTP ON` | `OUTP CH1,ON` | `OUTP ON` | `OUTP ON` | `OUTP ON` |
| Measure V | `MEAS:VOLT?` | `MEAS:VOLT?` | `MEAS:VOLT?` | `MEAS:VOLT?` | `MEAS:VOLT?` |
| Measure I | `MEAS:CURR?` | `MEAS:CURR?` | `MEAS:CURR?` | `MEAS:CURR?` | `MEAS:CURR?` |
| Measure P | `MEAS:POW?` | `MEAS:POWE?` | (calculate) | `MEAS:POW?` | `MEAS:POW?` |
| Select ch | `INST CH1` | `INST CH1` | `INST OUT1` | `INST OUT1` | `CHAN:SEL 1` |
| OVP set | `VOLT:PROT <v>` | (N/A) | `VOLT:PROT <v>` | `VOLT:PROT <v>` | `PROT:OVP <v>` |
| OVP enable | `VOLT:PROT:STAT ON` | (N/A) | `VOLT:PROT:STAT ON` | `VOLT:PROT:STAT ON` | (always on) |
| OCP set | `CURR:PROT <i>` | (N/A) | `CURR:PROT <i>` | `CURR:PROT <i>` | `PROT:OCP <i>` |
| CV/CC query | `OUTP:CVCC?` | `SYST:STAT?` | `STAT:QUES?` | `STAT:QUES?` | `MODE?` |
| Track mode | `OUTP:TRAC ON` | `OUTP:TRACK 1` | `OUTP:COUP ON` | `INST:COUP:TRAC ON` | (N/A) |
| List voltage | `TIM:PAR 1,<v>,<i>,<t>` | `TIM:SET CH1,1,<v>,<i>,<t>` | `LIST:VOLT <values>` | `ARB:VOLT <values>` | `SEQ:STEP <n>,<v>,<i>,<t>` |

---

## Abstract Driver Interface

```typescript
interface PowerSupplyChannel {
  /** Get/set voltage setpoint in volts */
  voltage: number;

  /** Get/set current limit in amps */
  current: number;

  /** Get/set output state */
  outputEnabled: boolean;

  /** Measure actual output voltage */
  measureVoltage(): Promise<Result<number, Error>>;

  /** Measure actual output current */
  measureCurrent(): Promise<Result<number, Error>>;

  /** Measure actual output power */
  measurePower(): Promise<Result<number, Error>>;

  /** Query CV/CC mode */
  getMode(): Promise<Result<'CV' | 'CC', Error>>;
}

interface PowerSupplyProtection {
  /** Over-voltage protection level */
  ovpLevel: number;

  /** OVP enabled */
  ovpEnabled: boolean;

  /** Check if OVP tripped */
  ovpTripped(): Promise<Result<boolean, Error>>;

  /** Clear OVP trip */
  clearOvp(): Promise<Result<void, Error>>;

  /** Over-current protection level */
  ocpLevel: number;

  /** OCP enabled */
  ocpEnabled: boolean;

  /** Check if OCP tripped */
  ocpTripped(): Promise<Result<boolean, Error>>;

  /** Clear OCP trip */
  clearOcp(): Promise<Result<void, Error>>;
}

interface PowerSupply {
  /** Identification */
  identify(): Promise<Result<string, Error>>;

  /** Reset to defaults */
  reset(): Promise<Result<void, Error>>;

  /** Number of channels */
  readonly channelCount: number;

  /** Access channel by number (1-indexed) */
  channel(n: number): PowerSupplyChannel;

  /** Access protection settings */
  readonly protection: PowerSupplyProtection;

  /** Save state to memory slot */
  saveState(slot: number): Promise<Result<void, Error>>;

  /** Recall state from memory slot */
  recallState(slot: number): Promise<Result<void, Error>>;

  /** All outputs off */
  allOff(): Promise<Result<void, Error>>;

  /** All outputs on */
  allOn(): Promise<Result<void, Error>>;
}

// Optional extended interfaces
interface TrackablePowerSupply extends PowerSupply {
  /** Set tracking mode */
  setTrackingMode(mode: 'independent' | 'series' | 'parallel'): Promise<Result<void, Error>>;

  /** Get tracking mode */
  getTrackingMode(): Promise<Result<'independent' | 'series' | 'parallel', Error>>;
}

interface ProgrammablePowerSupply extends PowerSupply {
  /** Configure a sequence step */
  setSequenceStep(step: number, voltage: number, current: number, dwellTime: number): Promise<Result<void, Error>>;

  /** Start sequence */
  startSequence(): Promise<Result<void, Error>>;

  /** Stop sequence */
  stopSequence(): Promise<Result<void, Error>>;

  /** Set sequence repeat count */
  setSequenceRepeat(count: number | 'infinite'): Promise<Result<void, Error>>;
}

interface SlewablePowerSupply extends PowerSupply {
  /** Set voltage slew rate (V/s) */
  setVoltageSlewRate(rate: number): Promise<Result<void, Error>>;

  /** Set current slew rate (A/s) */
  setCurrentSlewRate(rate: number): Promise<Result<void, Error>>;
}
```

---

## Command Translation Table

| Driver Method | Rigol DP800 | Siglent SPD | Keysight E36xx | R&S HMP |
|---------------|-------------|-------------|----------------|---------|
| `identify()` | `*IDN?` | `*IDN?` | `*IDN?` | `*IDN?` |
| `reset()` | `*RST` | `*RST` | `*RST` | `*RST` |
| `channel(1).voltage = 5.0` | `:SOUR1:VOLT 5.0` | `CH1:VOLT 5.0` | `INST OUT1;VOLT 5.0` | `INST OUT1;VOLT 5.0` |
| `channel(1).current = 1.0` | `:SOUR1:CURR 1.0` | `CH1:CURR 1.0` | `INST OUT1;CURR 1.0` | `INST OUT1;CURR 1.0` |
| `channel(1).outputEnabled = true` | `:OUTP CH1,ON` | `OUTP CH1,ON` | `INST OUT1;OUTP ON` | `INST OUT1;OUTP ON` |
| `channel(1).measureVoltage()` | `:MEAS:VOLT? CH1` | `MEAS:VOLT? CH1` | `MEAS:VOLT?` | `MEAS:VOLT?` |
| `channel(1).measureCurrent()` | `:MEAS:CURR? CH1` | `MEAS:CURR? CH1` | `MEAS:CURR?` | `MEAS:CURR?` |
| `channel(1).measurePower()` | `:MEAS:POW? CH1` | `MEAS:POWE? CH1` | V×I | `MEAS:POW?` |
| `channel(1).getMode()` | `:OUTP:CVCC?` | (parse SYST:STAT?) | (parse STAT:QUES?) | (parse STAT:QUES?) |
| `protection.ovpLevel = 35` | `:VOLT:PROT 35` | (N/A) | `VOLT:PROT 35` | `VOLT:PROT 35` |
| `protection.clearOvp()` | `:VOLT:PROT:CLE` | (N/A) | `VOLT:PROT:CLE` | `VOLT:PROT:CLE` |
| `saveState(1)` | `*SAV 1` | `*SAV 1` | `*SAV 1` | `*SAV 1` |
| `recallState(1)` | `*RCL 1` | `*RCL 1` | `*RCL 1` | `*RCL 1` |
| `allOff()` | (loop channels) | (loop channels) | `OUTP OFF,(@1,2,3)` | `OUTP:GEN OFF` |

---

## Vendor Detection Patterns

```typescript
const PSU_VENDORS = {
  rigol: {
    patterns: [/RIGOL.*DP8\d{2}/i, /RIGOL.*DP7\d{2}/i],
    driver: 'RigolDP800Driver',
  },
  siglent: {
    patterns: [/Siglent.*SPD\d{4}/i],
    driver: 'SiglentSPDDriver',
  },
  keysight: {
    patterns: [
      /Keysight.*E36\d{2}/i,
      /Agilent.*E36\d{2}/i,
      /Keysight.*N67\d{2}/i,
    ],
    driver: 'KeysightE36xxDriver',
  },
  rohde_schwarz: {
    patterns: [/Rohde.*HMP\d{4}/i, /Rohde.*NGE\d{3}/i],
    driver: 'RohdeSchwarzHMPDriver',
  },
  bk_precision: {
    patterns: [/B&K.*91\d{2}/i, /BK.*91\d{2}/i, /B&K.*92\d{2}/i],
    driver: 'BKPrecision9100Driver',
  },
  gw_instek: {
    patterns: [/GW.*GPD-\d{4}/i, /GW.*GPP-\d{4}/i],
    driver: 'GWInstekGPDDriver',
  },
  itech: {
    patterns: [/ITECH.*IT6\d{3}/i],
    driver: 'ITechIT6000Driver',
  },
  chroma: {
    patterns: [/Chroma.*620\d{2}P/i],
    driver: 'Chroma62000PDriver',
  },
};

function detectPSUVendor(idnResponse: string): string | null {
  for (const [vendor, config] of Object.entries(PSU_VENDORS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(idnResponse)) {
        return vendor;
      }
    }
  }
  return null;
}
```

---

## Connection Reference

| Vendor | USB VID:PID | Default TCP Port | GPIB | Notes |
|--------|-------------|------------------|------|-------|
| Rigol | 1AB1:0E11 | 5555 | Optional | VXI-11 or raw socket |
| Siglent | F4EC:1430 | 5025 (raw), 5024 (telnet) | No | |
| Keysight | 0957:xxxx | 5025 | Yes | VISA required for USB |
| R&S | 0AAD:xxxx | 5025 | Yes | HiSLIP supported |
| BK Precision | 0C97:xxxx | 5025 | Optional | |
| GW Instek | 2184:xxxx | 5025 | No | |
| ITECH | varies | 5025 | Optional | |
| Chroma | varies | 5025 | Yes | |

---

## Programming Examples

### Basic Power Supply Control

```typescript
// Using visa-ts
const rm = createResourceManager();
const psu = await rm.open('TCPIP0::192.168.1.50::5025::SOCKET');

// Identify
const idn = await psu.query('*IDN?');
console.log(idn.value);

// Configure CH1: 12V, 1A
await psu.write(':SOUR1:VOLT 12.0');
await psu.write(':SOUR1:CURR 1.0');
await psu.write(':OUTP CH1,ON');

// Read measurements
const voltage = await psu.query(':MEAS:VOLT? CH1');
const current = await psu.query(':MEAS:CURR? CH1');
console.log(`V=${voltage.value}V, I=${current.value}A`);

// Turn off
await psu.write(':OUTP CH1,OFF');
await psu.close();
```

### Multi-Channel Configuration

```typescript
// Configure all channels at once
const channels = [
  { ch: 1, voltage: 3.3, current: 0.5 },
  { ch: 2, voltage: 5.0, current: 1.0 },
  { ch: 3, voltage: 12.0, current: 0.3 },
];

for (const cfg of channels) {
  await psu.write(`:SOUR${cfg.ch}:VOLT ${cfg.voltage}`);
  await psu.write(`:SOUR${cfg.ch}:CURR ${cfg.current}`);
}

// Enable all outputs
for (const cfg of channels) {
  await psu.write(`:OUTP CH${cfg.ch},ON`);
}
```

### Sequence Programming (Rigol Timer)

```typescript
// Program a 3-step sequence
const steps = [
  { voltage: 0, current: 1.0, time: 1.0 },    // Ramp from 0
  { voltage: 12, current: 1.0, time: 5.0 },   // Hold at 12V
  { voltage: 5, current: 1.0, time: 3.0 },    // Step to 5V
];

for (let i = 0; i < steps.length; i++) {
  const s = steps[i];
  await psu.write(`:TIM:PAR ${i + 1},${s.voltage},${s.current},${s.time}`);
}

await psu.write(':TIM:CYC 1');   // Run once
await psu.write(':TIM ON');      // Start sequence
```

---

## Notes

1. **Command Termination**: Most use LF (`\n`). Some Keysight instruments accept CR+LF.

2. **Response Format**: Numeric responses vary - some return scientific notation (1.234E+01), others fixed (12.34).

3. **Query Timing**: Allow 10-100ms between write and read for measurements.

4. **Protection Clearing**: After OVP/OCP trip, must clear before re-enabling output.

5. **Tracking Mode**: When in series/parallel mode, only control the master channel.

6. **4-Wire Sensing**: Professional supplies with sense terminals need proper configuration for accurate voltage regulation.

7. **Slew Rate**: Entry-level supplies typically don't support programmable slew rates.

8. **Remote Lockout**: Some supplies lock front panel in remote mode. Send `SYSTem:LOCal` to restore.
