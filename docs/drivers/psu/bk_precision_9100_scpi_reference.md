# BK Precision 9100/9200 Series Power Supply SCPI Command Reference

> Extracted from BK Precision 9130B/9140/9200 Series Programming Manuals
> Applicable models: 9130B, 9131B, 9132B, 9140, 9141, 9142, 9201, 9202, 9206

## Model Specifications

### 9130 Series (Multi-Output)

| Model | Channels | Output 1 | Output 2 | Output 3 | Power |
|-------|----------|----------|----------|----------|-------|
| 9130B | 3 | 30V/3A | 30V/3A | 5V/3A | 195W |
| 9131B | 3 | 30V/3A | 30V/3A | 5V/3A | 195W |
| 9132B | 3 | 60V/3A | 60V/3A | 5V/3A | 375W |

### 9140 Series (Multi-Output, Higher Power)

| Model | Channels | Output 1 | Output 2 | Output 3 | Power |
|-------|----------|----------|----------|----------|-------|
| 9140 | 3 | 32V/10A | 32V/6A | 6V/5A | 462W |
| 9141 | 3 | 32V/10A | 32V/6A | 6V/5A | 462W |
| 9142 | 3 | 60V/5A | 60V/3A | 6V/3A | 378W |

### 9200 Series (High Power Single)

| Model | Channels | Voltage | Current | Power |
|-------|----------|---------|---------|-------|
| 9201 | 1 | 60V | 10A | 200W |
| 9202 | 1 | 60V | 15A | 300W |
| 9206 | 1 | 150V | 10A | 600W |

---

## Connection Methods

| Method | Port/Interface | Notes |
|--------|----------------|-------|
| USB-TMC | USB | Requires VISA driver |
| LAN (VXI-11) | — | Via VISA |
| LAN (Socket) | Port 5025 | Raw SCPI |
| GPIB | — | Standard on most models |
| RS-232 | — | 9600-115200 baud |

**USB Vendor ID**: 0x0C97 (BK Precision)

---

## Command Notation

- Commands are case-insensitive
- Short form: uppercase portion required
- `<n>` = channel number (1, 2, or 3)
- `{ON|OFF}` = boolean (also accepts 1|0)
- Commands terminated with LF (`\n`) or CR+LF

---

## IEEE 488.2 Common Commands

```
*IDN?                    → Query identification
                           Returns: B&K Precision,9130B,<serial>,<fw_version>

*RST                     → Reset to default state

*CLS                     → Clear status registers

*ESE <mask>              → Set event status enable register
*ESE?                    → Query event status enable register

*ESR?                    → Query event status register

*OPC                     → Set OPC bit when operations complete
*OPC?                    → Query operation complete (returns 1)

*SRE <mask>              → Set service request enable register
*SRE?                    → Query service request enable register

*STB?                    → Query status byte

*TST?                    → Self-test (0 = pass)

*WAI                     → Wait for operations complete

*SAV {1|2|3|4|5}         → Save state to memory (5 slots)
*RCL {1|2|3|4|5}         → Recall state from memory
```

---

## Channel Selection

### Multi-Output Models (9130/9140 Series)

```
INSTrument {CH1|CH2|CH3}
                         → Select channel for subsequent commands

INSTrument?              → Query selected channel
                           Returns: CH1, CH2, or CH3

INSTrument:NSELect {1|2|3}
                         → Select channel by number

INSTrument:NSELect?      → Query selected channel number
```

### Single-Output Models (9200 Series)

Channel selection not required - commands apply to the single output.

---

## Voltage Commands

### Set Voltage

```
[SOURce:]VOLTage[:LEVel][:IMMediate][:AMPLitude] <voltage>
                         → Set output voltage in volts

[SOURce:]VOLTage[:LEVel][:IMMediate][:AMPLitude]?
                         → Query voltage setpoint
```

**Short forms:**
```
VOLT 12.0                → Set voltage to 12V
VOLT?                    → Query voltage setpoint
```

### Voltage with Channel Prefix

```
CH1:VOLT 5.0             → Set channel 1 to 5V
CH2:VOLT 12.0            → Set channel 2 to 12V
CH3:VOLT 3.3             → Set channel 3 to 3.3V
```

### Voltage Limits

```
[SOURce:]VOLTage:LIMit[:HIGH] <voltage>
                         → Set voltage upper limit (software limit)

[SOURce:]VOLTage:LIMit[:HIGH]?
                         → Query voltage limit

[SOURce:]VOLTage:LIMit:LOW <voltage>
                         → Set voltage lower limit

[SOURce:]VOLTage:LIMit:LOW?
                         → Query voltage lower limit
```

### Over-Voltage Protection

```
[SOURce:]VOLTage:PROTection[:LEVel] <voltage>
                         → Set OVP level

[SOURce:]VOLTage:PROTection[:LEVel]?
                         → Query OVP level

[SOURce:]VOLTage:PROTection:STATe {ON|OFF}
                         → Enable/disable OVP

[SOURce:]VOLTage:PROTection:STATe?
                         → Query OVP state

[SOURce:]VOLTage:PROTection:TRIPped?
                         → Query if OVP has tripped

[SOURce:]VOLTage:PROTection:CLEar
                         → Clear OVP trip condition
```

---

## Current Commands

### Set Current Limit

```
[SOURce:]CURRent[:LEVel][:IMMediate][:AMPLitude] <current>
                         → Set current limit in amps

[SOURce:]CURRent[:LEVel][:IMMediate][:AMPLitude]?
                         → Query current limit
```

**Short forms:**
```
CURR 1.5                 → Set current limit to 1.5A
CURR?                    → Query current limit
```

### Current with Channel Prefix

```
CH1:CURR 3.0             → Set channel 1 current limit to 3A
CH2:CURR 2.0             → Set channel 2 current limit to 2A
```

### Current Limits

```
[SOURce:]CURRent:LIMit[:HIGH] <current>
                         → Set current upper limit

[SOURce:]CURRent:LIMit[:HIGH]?
                         → Query current limit
```

### Over-Current Protection

```
[SOURce:]CURRent:PROTection[:LEVel] <current>
                         → Set OCP level

[SOURce:]CURRent:PROTection[:LEVel]?
                         → Query OCP level

[SOURce:]CURRent:PROTection:STATe {ON|OFF}
                         → Enable/disable OCP

[SOURce:]CURRent:PROTection:STATe?
                         → Query OCP state

[SOURce:]CURRent:PROTection:TRIPped?
                         → Query if OCP has tripped

[SOURce:]CURRent:PROTection:CLEar
                         → Clear OCP trip condition
```

---

## Measurement Commands

### Measure Voltage

```
MEASure[:SCALar]:VOLTage[:DC]?
                         → Measure and return output voltage

MEASure[:SCALar]:VOLTage[:DC]? CH<n>
                         → Measure voltage on specific channel
```

**Examples:**
```
MEAS:VOLT?               → Measure voltage on selected channel
MEAS:VOLT? CH1           → Measure voltage on channel 1
```

### Measure Current

```
MEASure[:SCALar]:CURRent[:DC]?
                         → Measure and return output current

MEASure[:SCALar]:CURRent[:DC]? CH<n>
                         → Measure current on specific channel
```

### Measure Power

```
MEASure[:SCALar]:POWer[:DC]?
                         → Measure and return output power in watts
```

---

## Output Control

### Enable/Disable Output

```
OUTPut[:STATe] {ON|OFF|1|0}
                         → Enable/disable output on selected channel

OUTPut[:STATe]?          → Query output state
                           Returns: 0 or 1
```

### Output with Channel Prefix

```
CH1:OUTP ON              → Enable channel 1
CH2:OUTP OFF             → Disable channel 2
CH1:OUTP?                → Query channel 1 output state
```

### All Outputs

```
OUTPut:ALL {ON|OFF}      → Enable/disable all outputs simultaneously
```

---

## Operating Mode Query

### CV/CC Status

```
STATus:OPERation:CONDition?
                         → Query operation condition register
                           Bit 8: CC mode (1 = in CC)

STATus:QUEStionable:CONDition?
                         → Query questionable condition register
```

For multi-channel models, use channel-specific status queries when available.

---

## Tracking Mode (Multi-Output)

Tracking allows channels to maintain proportional voltage relationships:

```
OUTPut:TRACk[:STATe] {ON|OFF}
                         → Enable/disable tracking mode

OUTPut:TRACk[:STATe]?    → Query tracking state
```

When tracking is enabled:
- Adjusting CH1 voltage proportionally adjusts CH2
- Voltage ratios maintained

---

## Series/Parallel Mode (Multi-Output)

### Series Mode

```
OUTPut:SER[:STATe] {ON|OFF}
                         → Enable/disable series mode (CH1 + CH2)

OUTPut:SER[:STATe]?      → Query series mode
```

When series mode is enabled:
- CH1 and CH2 combined in series
- Total voltage = CH1 + CH2
- Control via CH1 commands

### Parallel Mode

```
OUTPut:PAR[:STATe] {ON|OFF}
                         → Enable/disable parallel mode (CH1 || CH2)

OUTPut:PAR[:STATe]?      → Query parallel mode
```

When parallel mode is enabled:
- CH1 and CH2 combined in parallel
- Total current = CH1 + CH2
- Control via CH1 commands

---

## Timer/Sequence Function

The 9130B/9140 series supports programmed output sequences:

### Timer Setup

```
TIMer:SET <step>,<voltage>,<current>,<time>
                         → Set timer step parameters
                           step: 1 to 5
                           voltage: in volts
                           current: in amps
                           time: in seconds (0.1 to 99999)

TIMer:SET? <step>        → Query timer step settings
                           Returns: <voltage>,<current>,<time>
```

### Timer Control

```
TIMer[:STATe] {ON|OFF}   → Enable/disable timer function

TIMer[:STATe]?           → Query timer state

TIMer:CYCLes <count>     → Set number of timer cycles (1 to 99999, 0 = infinite)

TIMer:CYCLes?            → Query cycle count
```

### Timer Example

```
TIM:SET 1,5.0,1.0,10     ; Step 1: 5V, 1A, 10 seconds
TIM:SET 2,12.0,0.5,30    ; Step 2: 12V, 0.5A, 30 seconds
TIM:SET 3,3.3,2.0,20     ; Step 3: 3.3V, 2A, 20 seconds
TIM:CYC 5                ; Run 5 cycles
OUTP ON                  ; Enable output
TIM ON                   ; Start timer sequence
```

---

## System Commands

### Error Query

```
SYSTem:ERRor[:NEXT]?     → Query and clear oldest error
                           Returns: <code>,"<message>"
                           0,"No error" when empty
```

### Version

```
SYSTem:VERSion?          → Query SCPI version
                           Returns: 1999.0
```

### Beeper

```
SYSTem:BEEPer[:IMMediate]
                         → Generate beep

SYSTem:BEEPer:STATe {ON|OFF}
                         → Enable/disable beeper for button presses
```

### Key Lock

```
SYSTem:KLOCk {ON|OFF}    → Lock/unlock front panel keys
SYSTem:KLOCk?            → Query key lock state
```

### Remote/Local

```
SYSTem:LOCal             → Return to local (front panel) control
SYSTem:REMote            → Enter remote mode
SYSTem:RWLock            → Remote with lock
```

---

## Display Control

```
DISPlay[:WINDow]:TEXT "<message>"
                         → Display message on front panel

DISPlay[:WINDow]:TEXT:CLEar
                         → Clear displayed message

DISPlay[:WINDow]:BRIGhtness <0-100>
                         → Set display brightness
```

---

## Apply Command (Shortcut)

```
APPLy <voltage>,<current>
                         → Set voltage and current on selected channel

APPLy?                   → Query voltage and current settings
                           Returns: <voltage>,<current>
```

**Examples:**
```
APPL 12.0,1.5            → Set 12V, 1.5A
APPL?                    → Returns: 12.000,1.500
```

With channel specifier:
```
APPLy CH1,<voltage>,<current>
                         → Set voltage/current on specific channel
```

---

## Status System

### Status Byte (*STB?)

| Bit | Value | Name | Description |
|-----|-------|------|-------------|
| 2 | 4 | EAV | Error available |
| 3 | 8 | QSB | Questionable status summary |
| 4 | 16 | MAV | Message available |
| 5 | 32 | ESB | Event status summary |
| 6 | 64 | RQS | Request for service |
| 7 | 128 | OSB | Operation status summary |

### Operation Status Register

```
STATus:OPERation:CONDition?
                         → Query condition (does not clear)

STATus:OPERation[:EVENt]?
                         → Query and clear event register

STATus:OPERation:ENABle <mask>
                         → Set enable mask
```

**Operation Status Bits:**
| Bit | Description |
|-----|-------------|
| 5 | Waiting for trigger |
| 8 | CC mode |
| 12 | Timer running |

### Questionable Status Register

```
STATus:QUEStionable:CONDition?
                         → Query questionable condition

STATus:QUEStionable[:EVENt]?
                         → Query and clear questionable event

STATus:QUEStionable:ENABle <mask>
                         → Set enable mask
```

**Questionable Status Bits:**
| Bit | Description |
|-----|-------------|
| 0 | Voltage fault |
| 1 | Current fault |
| 4 | Over-temperature |
| 9 | OVP tripped |
| 10 | OCP tripped |

---

## Trigger System (9200 Series)

### Trigger Source

```
TRIGger:SOURce {IMMediate|BUS|EXTernal}
                         → Set trigger source

TRIGger:SOURce?          → Query trigger source
```

### Trigger Delay

```
TRIGger:DELay <seconds>  → Set trigger delay

TRIGger:DELay?           → Query trigger delay
```

### Initiate and Trigger

```
INITiate[:IMMediate]     → Initiate trigger system

*TRG                     → Execute trigger (when source is BUS)

TRIGger[:IMMediate]      → Execute immediate trigger
```

---

## Programming Examples

### Basic Output Setup (Multi-Channel)

```
*RST                     ; Reset to defaults
INST CH1                 ; Select channel 1
VOLT 5.0                 ; Set 5V
CURR 1.0                 ; Set 1A limit
OUTP ON                  ; Enable output
MEAS:VOLT?               ; Read actual voltage
MEAS:CURR?               ; Read actual current
```

### Multi-Channel Configuration

```
*RST                     ; Reset
INST CH1                 ; Select channel 1
VOLT 3.3                 ; Set 3.3V
CURR 0.5                 ; Set 0.5A limit

INST CH2                 ; Select channel 2
VOLT 5.0                 ; Set 5V
CURR 1.0                 ; Set 1A limit

INST CH3                 ; Select channel 3
VOLT 12.0                ; Set 12V
CURR 0.3                 ; Set 0.3A limit

OUTP:ALL ON              ; Enable all outputs
```

### Using Channel Prefix (Faster)

```
*RST
CH1:VOLT 3.3
CH1:CURR 0.5
CH2:VOLT 5.0
CH2:CURR 1.0
CH3:VOLT 12.0
CH3:CURR 0.3
OUTP:ALL ON
```

### Protection Setup

```
INST CH1
VOLT:PROT 6.0            ; OVP at 6V
VOLT:PROT:STAT ON        ; Enable OVP
CURR:PROT 2.0            ; OCP at 2A
CURR:PROT:STAT ON        ; Enable OCP
VOLT 5.0
CURR 1.0
OUTP ON

; Later, check for trips
VOLT:PROT:TRIP?          ; Check OVP
CURR:PROT:TRIP?          ; Check OCP
; If tripped:
VOLT:PROT:CLE            ; Clear OVP
CURR:PROT:CLE            ; Clear OCP
```

### Timer Sequence

```
*RST
INST CH1
; Define 3-step sequence
TIM:SET 1,0,1.0,1        ; Step 1: 0V, 1A, 1 second
TIM:SET 2,5.0,1.0,5      ; Step 2: 5V, 1A, 5 seconds
TIM:SET 3,12.0,0.5,10    ; Step 3: 12V, 0.5A, 10 seconds
TIM:CYC 3                ; Run 3 times
OUTP ON
TIM ON                   ; Start sequence
; Wait for completion or...
TIM OFF                  ; Stop early
```

---

## Notes

1. **Command Termination**: LF (`\n`) or CR+LF. Responses terminated with LF.

2. **Channel Prefix**: `CH1:`, `CH2:`, `CH3:` can be used instead of selecting with `INST`.

3. **Output Enable**: Individual channel enables are independent of `OUTP:ALL`.

4. **Series/Parallel Mode**: Only CH1 and CH2 can be combined. CH3 remains independent.

5. **Timer Steps**: Maximum 5 steps. Step time range: 0.1 to 99999 seconds.

6. **Protection Clearing**: After OVP/OCP trip, must clear before output can be re-enabled.

7. **Tracking Mode**: Only affects CH1 and CH2 voltage relationship.

8. **Remote Mode**: Entering remote mode does not disable outputs; `OUTP OFF` must be sent explicitly.

9. **GPIB Address**: Default is typically 5. Configure via front panel.

10. **Response Format**: Numbers returned as plain decimal (e.g., `12.000`, `1.500`).
