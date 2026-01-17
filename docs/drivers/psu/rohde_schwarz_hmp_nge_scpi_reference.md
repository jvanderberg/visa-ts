# Rohde & Schwarz HMP/NGE Series Power Supply SCPI Command Reference

> Extracted from R&S HMP Series and R&S NGE100 Series Operating Manuals
> Applicable models: HMP2020, HMP2030, HMP4030, HMP4040, NGE102B, NGE103B

## Model Specifications

### HMP Series (High Performance)

| Model | Channels | Voltage | Current | Power | Notes |
|-------|----------|---------|---------|-------|-------|
| HMP2020 | 2 | 0-32V | 0-10A | 188W | Dual channel |
| HMP2030 | 3 | 0-32V (×2), 0-5.5V | 0-5A, 0-5A, 0-5A | 188W | Triple channel |
| HMP4030 | 3 | 0-32V | 0-10A | 384W | High power triple |
| HMP4040 | 4 | 0-32V | 0-10A | 384W | Quad channel |

### NGE Series (Essential)

| Model | Channels | Voltage | Current | Power | Notes |
|-------|----------|---------|---------|-------|-------|
| NGE102B | 2 | 0-32V | 0-3A | 66W | Entry dual |
| NGE103B | 3 | 0-32V (×2), 0-6V | 0-3A | 100W | Entry triple |

**Common Features:**
- Low noise and ripple
- Tracking/parallel/series modes
- EasyArb arbitrary waveform
- Electronic fuse per channel
- Remote sense capability

---

## Connection Methods

| Method | Port/Interface | Notes |
|--------|----------------|-------|
| USB-TMC | USB | Requires VISA driver |
| LAN (VXI-11) | — | Via VISA |
| LAN (HiSLIP) | Port 4880 | High-speed LAN |
| LAN (Socket) | Port 5025 | Raw SCPI |
| GPIB | — | Optional (HMP-B5 option) |

**USB Vendor ID**: 0x0AAD (Rohde & Schwarz)

---

## Command Notation

- Commands are case-insensitive
- Short form: uppercase portion required (e.g., `VOLTage` → `VOLT`)
- `<n>` = channel number (1, 2, 3, or 4)
- `<NRf>` = floating point number
- `{ON|OFF}` = boolean choice (also accepts 1|0)
- Commands terminated with LF (`\n`)

---

## IEEE 488.2 Common Commands

```
*IDN?                    → Query identification
                           Returns: Rohde&Schwarz,HMP4040,<serial>,<fw_version>

*RST                     → Reset to default state

*CLS                     → Clear status registers

*ESE <mask>              → Set event status enable register
*ESE?                    → Query event status enable register

*ESR?                    → Query event status register

*OPC                     → Set OPC bit when operations complete
*OPC?                    → Query operation complete

*SRE <mask>              → Set service request enable register
*SRE?                    → Query service request enable register

*STB?                    → Query status byte

*TST?                    → Self-test (0 = pass)

*WAI                     → Wait for operations complete

*SAV {0|1|2|3|4|5|6|7|8|9}
                         → Save state to memory (10 slots)

*RCL {0|1|2|3|4|5|6|7|8|9}
                         → Recall state from memory
```

---

## Channel Selection

```
INSTrument[:SELect] {OUTPut1|OUTPut2|OUTPut3|OUTPut4}
                         → Select channel for subsequent commands

INSTrument[:SELect]?     → Query selected channel
                           Returns: OUTP1, OUTP2, OUTP3, or OUTP4

INSTrument:NSELect {1|2|3|4}
                         → Select channel by number

INSTrument:NSELect?      → Query selected channel number
                           Returns: 1, 2, 3, or 4
```

**Note:** Most commands accept direct channel suffix: `SOURce1:VOLTage` instead of selecting first.

---

## Voltage Commands

### Set Voltage

```
[SOURce[<n>]:]VOLTage[:LEVel][:IMMediate][:AMPLitude] <voltage>
                         → Set output voltage in volts

[SOURce[<n>]:]VOLTage[:LEVel][:IMMediate][:AMPLitude]?
                         → Query voltage setpoint
```

**Examples:**
```
VOLT 12.0                → Set voltage on selected channel
SOUR1:VOLT 5.0           → Set channel 1 to 5V
SOUR2:VOLT 3.3           → Set channel 2 to 3.3V
VOLT?                    → Query voltage setpoint
```

### Voltage Step

```
[SOURce[<n>]:]VOLTage[:LEVel][:IMMediate]:STEP[:INCRement] <voltage>
                         → Set voltage step size for UP/DOWN commands

[SOURce[<n>]:]VOLTage:UP → Increase voltage by step size
[SOURce[<n>]:]VOLTage:DOWN → Decrease voltage by step size
```

### Voltage Protection (OVP)

```
[SOURce[<n>]:]VOLTage:PROTection[:LEVel] <voltage>
                         → Set over-voltage protection level

[SOURce[<n>]:]VOLTage:PROTection[:LEVel]?
                         → Query OVP level

[SOURce[<n>]:]VOLTage:PROTection:MODE {MEASured|SOURce}
                         → OVP reference: actual voltage or setpoint

[SOURce[<n>]:]VOLTage:PROTection:MODE?
                         → Query OVP mode

[SOURce[<n>]:]VOLTage:PROTection:TRIPped?
                         → Query if OVP tripped (1 = tripped)

[SOURce[<n>]:]VOLTage:PROTection:CLEar
                         → Clear OVP trip
```

### Voltage Ramp

```
[SOURce[<n>]:]VOLTage:RAMP[:STATe] {ON|OFF}
                         → Enable/disable voltage ramping

[SOURce[<n>]:]VOLTage:RAMP:DURation <seconds>
                         → Set ramp duration (0.01 to 10 seconds)

[SOURce[<n>]:]VOLTage:RAMP:DURation?
                         → Query ramp duration
```

---

## Current Commands

### Set Current Limit

```
[SOURce[<n>]:]CURRent[:LEVel][:IMMediate][:AMPLitude] <current>
                         → Set current limit in amps

[SOURce[<n>]:]CURRent[:LEVel][:IMMediate][:AMPLitude]?
                         → Query current limit
```

**Examples:**
```
CURR 1.5                 → Set current limit on selected channel
SOUR1:CURR 2.0           → Set channel 1 current limit to 2A
CURR?                    → Query current limit
```

### Current Step

```
[SOURce[<n>]:]CURRent[:LEVel][:IMMediate]:STEP[:INCRement] <current>
                         → Set current step size

[SOURce[<n>]:]CURRent:UP → Increase current by step size
[SOURce[<n>]:]CURRent:DOWN → Decrease current by step size
```

### Current Ramp

```
[SOURce[<n>]:]CURRent:RAMP[:STATe] {ON|OFF}
                         → Enable/disable current ramping

[SOURce[<n>]:]CURRent:RAMP:DURation <seconds>
                         → Set ramp duration
```

---

## Measurement Commands

### Measure Voltage

```
MEASure[:SCALar]:VOLTage[:DC]?
                         → Measure output voltage on selected channel

MEASure[:SCALar][:VOLTage][:DC]? (@<list>)
                         → Measure voltage on specified channels
```

**Examples:**
```
MEAS:VOLT?               → Measure voltage on selected channel
MEAS? (@1)               → Measure voltage on channel 1
MEAS? (@1,2,3)           → Measure voltage on channels 1, 2, 3
```

### Measure Current

```
MEASure[:SCALar]:CURRent[:DC]?
                         → Measure output current on selected channel

MEASure[:SCALar]:CURRent[:DC]? (@<list>)
                         → Measure current on specified channels
```

### Measure Power

```
MEASure[:SCALar]:POWer[:DC]?
                         → Measure output power on selected channel
                           Returns: power in watts
```

---

## Output Control

### Enable/Disable Output

```
OUTPut[:STATe] {ON|OFF|1|0}
                         → Enable/disable output on selected channel

OUTPut[:STATe]?          → Query output state
                           Returns: 0 or 1

OUTPut[:STATe] {ON|OFF},(@<list>)
                         → Enable/disable specific channels
```

**Examples:**
```
OUTP ON                  → Enable selected channel
OUTP OFF                 → Disable selected channel
OUTP ON,(@1,2)           → Enable channels 1 and 2
```

### Master Output (Global On/Off)

```
OUTPut:GENeral[:STATe] {ON|OFF|1|0}
                         → Enable/disable all outputs simultaneously

OUTPut:GENeral[:STATe]?  → Query master output state
```

**Note:** Individual channel states are remembered. Master ON enables all channels that were individually ON.

### Output Select Mode

```
OUTPut:SELect {ON|OFF}   → Enable select mode
                           When ON: Only selected channel affected by front panel
```

---

## Electronic Fuse (FUSE)

Each channel has an electronic fuse that trips on overcurrent:

```
FUSE[:STATe] {ON|OFF|1|0}
                         → Enable/disable fuse on selected channel

FUSE[:STATe]?            → Query fuse state

FUSE:TRIPped?            → Query if fuse has tripped
                           Returns: 0 or 1

FUSE:DELay <seconds>     → Set fuse trip delay (0 to 10 seconds)

FUSE:DELay?              → Query fuse delay

FUSE:LINK {<ch1>,<ch2>,...}
                         → Link fuse to other channels
                           When this channel trips, linked channels also trip

FUSE:LINK?               → Query linked channels

FUSE:UNLink              → Remove all fuse links
```

**Examples:**
```
INST:SEL OUTP1           → Select channel 1
FUSE ON                  → Enable fuse
FUSE:DEL 0.1             → 100ms delay before trip
FUSE:LINK 2,3            → If CH1 fuse trips, CH2 and CH3 also shut off
```

---

## Tracking Mode

Tracking links channels so they change together:

```
INSTrument:COUPle:TRACking[:STATe] {ON|OFF|1|0}
                         → Enable/disable tracking mode

INSTrument:COUPle:TRACking[:STATe]?
                         → Query tracking state
```

**When tracking is ON:**
- Voltage changes on channel 1 are applied proportionally to other channels
- Channels maintain their voltage ratios

---

## Series/Parallel Mode (HMP Series)

### Series Mode

Combines two channels for higher voltage:

```
OUTPut:SERies[:STATe] {ON|OFF|1|0}
                         → Enable/disable series mode

OUTPut:SERies[:STATe]?   → Query series mode

OUTPut:SERies:LINK {<ch1>,<ch2>}
                         → Specify channels to combine in series
```

### Parallel Mode

Combines two channels for higher current:

```
OUTPut:PARallel[:STATe] {ON|OFF|1|0}
                         → Enable/disable parallel mode

OUTPut:PARallel[:STATe]?
                         → Query parallel mode

OUTPut:PARallel:LINK {<ch1>,<ch2>}
                         → Specify channels to combine in parallel
```

---

## EasyArb (Arbitrary Waveform)

The HMP series supports arbitrary voltage/current sequences:

### Arbitrary Data

```
ARBitrary:VOLTage[:DATA] <v1>,<v2>,<v3>,...
                         → Load voltage points (up to 128 points per channel)

ARBitrary:CURRent[:DATA] <i1>,<i2>,<i3>,...
                         → Load current limit points

ARBitrary:DWELl[:DATA] <t1>,<t2>,<t3>,...
                         → Load dwell times per point (seconds)

ARBitrary:REPetitions {<count>|INFinity}
                         → Number of times to repeat sequence

ARBitrary:REPetitions?   → Query repetition count
```

### Arbitrary Control

```
ARBitrary[:STATe] {ON|OFF|1|0}
                         → Enable/disable arbitrary mode

ARBitrary[:STATe]?       → Query arbitrary state

ARBitrary:TRANsfer[:STATe] {ON|OFF|1|0}
                         → Enable smooth transitions between points

ARBitrary:CLEar          → Clear arbitrary data
```

### Example: Ramp Up/Down Sequence

```
ARB:VOLT 0,5,10,15,20,15,10,5,0
ARB:CURR 1,1,1,1,1,1,1,1,1
ARB:DWEL 1,1,1,1,1,1,1,1,1
ARB:REP 5                → Repeat 5 times
OUTP ON
ARB ON                   → Start arbitrary sequence
```

---

## Remote Sense

For accurate voltage regulation at the load:

```
[SOURce[<n>]:]VOLTage:SENSe[:SOURce] {INTernal|EXTernal}
                         → Select internal or remote sensing

[SOURce[<n>]:]VOLTage:SENSe[:SOURce]?
                         → Query sense source
```

When EXTernal: Connect rear sense terminals to load for 4-wire sensing.

---

## System Commands

### Error Query

```
SYSTem:ERRor[:NEXT]?     → Query and clear oldest error
                           Returns: <code>,"<message>"
                           0,"No error" when empty

SYSTem:ERRor:COUNt?      → Query number of errors in queue
```

### Beeper

```
SYSTem:BEEPer[:IMMediate]
                         → Generate beep

SYSTem:BEEPer:STATe {ON|OFF}
                         → Enable/disable beeper
```

### Display

```
DISPlay[:WINDow]:BRIGhtness <0.0 to 1.0>
                         → Set display brightness (0 = off, 1 = max)

DISPlay[:WINDow]:BRIGhtness?
                         → Query brightness
```

### Remote/Local

```
SYSTem:LOCal             → Return to local (front panel) control

SYSTem:REMote            → Enter remote mode

SYSTem:RWLock            → Remote with lock (front panel disabled)
```

### Device Info

```
SYSTem:DEVice?           → Query full device information

SYSTem:NAME?             → Query device name

SYSTem:NAME "<name>"     → Set device name
```

---

## Status System

### Questionable Status Register

```
STATus:QUEStionable:CONDition?
                         → Query condition register (live status)

STATus:QUEStionable[:EVENt]?
                         → Query and clear event register

STATus:QUEStionable:ENABle <mask>
                         → Set enable mask

STATus:QUEStionable:ENABle?
                         → Query enable mask
```

**Questionable Status Bits:**
| Bit | Description |
|-----|-------------|
| 0 | Channel 1 CC mode |
| 1 | Channel 2 CC mode |
| 2 | Channel 3 CC mode |
| 3 | Channel 4 CC mode |
| 8 | Channel 1 fuse tripped |
| 9 | Channel 2 fuse tripped |
| 10 | Channel 3 fuse tripped |
| 11 | Channel 4 fuse tripped |

### Operation Status Register

```
STATus:OPERation:CONDition?
                         → Query operation condition register

STATus:OPERation[:EVENt]?
                         → Query and clear operation event register

STATus:OPERation:ENABle <mask>
                         → Set enable mask
```

---

## Apply Command (Shortcut)

```
APPLy <voltage>,<current>
                         → Set voltage and current on selected channel

APPLy? [<channel>]       → Query settings
                           Returns: "<voltage>,<current>"
```

**Examples:**
```
APPL 12.0,1.5            → Set 12V, 1.5A on selected channel
APPL?                    → Returns: 12.000,1.500
```

---

## Programming Examples

### Basic Output Setup

```
*RST                     ; Reset to defaults
INST:NSEL 1              ; Select channel 1
VOLT 5.0                 ; Set 5V
CURR 1.0                 ; Set 1A limit
OUTP ON                  ; Enable output
MEAS:VOLT?               ; Read actual voltage
MEAS:CURR?               ; Read actual current
```

### Multi-Channel Configuration

```
*RST                     ; Reset
SOUR1:VOLT 3.3           ; Channel 1: 3.3V
SOUR1:CURR 0.5           ; Channel 1: 0.5A limit
SOUR2:VOLT 5.0           ; Channel 2: 5V
SOUR2:CURR 1.0           ; Channel 2: 1A limit
SOUR3:VOLT 12.0          ; Channel 3: 12V
SOUR3:CURR 0.3           ; Channel 3: 0.3A limit
OUTP:GEN ON              ; Enable all outputs with master switch
```

### Fuse Configuration

```
INST:NSEL 1              ; Select channel 1
FUSE ON                  ; Enable fuse
FUSE:DEL 0.05            ; 50ms trip delay
FUSE:LINK 2,3            ; Link to channels 2 and 3

INST:NSEL 2              ; Select channel 2
FUSE ON                  ; Enable fuse

INST:NSEL 3              ; Select channel 3
FUSE ON                  ; Enable fuse

OUTP:GEN ON              ; Enable all outputs
; If channel 1 overloads, channels 2 and 3 also shut off
```

### Voltage Ramp

```
INST:NSEL 1
VOLT 0                   ; Start at 0V
VOLT:RAMP:DUR 2.0        ; 2 second ramp time
VOLT:RAMP ON             ; Enable ramping
OUTP ON                  ; Enable output
VOLT 12.0                ; Ramp to 12V over 2 seconds
```

### Arbitrary Sequence

```
INST:NSEL 1
ARB:VOLT 0,5,10,5,0      ; Voltage sequence
ARB:CURR 1,1,1,1,1       ; Current limits
ARB:DWEL 0.5,1,0.5,1,0.5 ; Dwell times (seconds)
ARB:REP INF              ; Repeat forever
ARB:TRAN ON              ; Smooth transitions
OUTP ON
ARB ON                   ; Start sequence
; ...later...
ARB OFF                  ; Stop sequence
```

---

## Notes

1. **Command Termination**: LF (`\n`). Responses also terminated with LF.

2. **Numeric Format**: Plain numbers or scientific notation accepted.

3. **Channel Numbering**: Channels are 1-indexed (1, 2, 3, 4).

4. **Master Output**: `OUTP:GEN` is a master switch. Individual `OUTP` states are remembered.

5. **Fuse Linking**: Useful for protecting circuits that require all rails simultaneously.

6. **Remote Sense**: Compensates for up to 1V drop per lead. Connect sense terminals at load.

7. **EasyArb Points**: Maximum 128 points per channel. Minimum dwell time varies by model.

8. **Tracking Mode**: Maintains voltage ratios between channels during adjustment.

9. **Series/Parallel**:
   - Series mode: Voltages add, current equals lowest channel
   - Parallel mode: Currents add, voltage equals lowest channel

10. **Response Time**: Allow 50ms between commands for reliable operation.
