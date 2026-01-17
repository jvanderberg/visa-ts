# GW Instek GPD/GPP Series Power Supply SCPI Command Reference

> Extracted from GW Instek GPD-4303S and GPP-4323 Programming Manuals
> Applicable models: GPD-4303S, GPD-3303S, GPP-4323, GPP-2323, GPP-1326

## Model Specifications

### GPD Series (Linear DC Power Supply)

| Model | Channels | CH1 | CH2 | CH3 | CH4 | Power |
|-------|----------|-----|-----|-----|-----|-------|
| GPD-2303S | 2 | 30V/3A | 30V/3A | — | — | 180W |
| GPD-3303S | 3 | 30V/3A | 30V/3A | 2.5V/3.3V/5V/3A | — | 195W |
| GPD-4303S | 4 | 30V/3A | 30V/3A | 2.5V/3.3V/5V/3A | 15V/1A | 217W |

### GPP Series (Programmable DC Power Supply)

| Model | Channels | CH1 | CH2 | CH3 | CH4 | Power |
|-------|----------|-----|-----|-----|-----|-------|
| GPP-1326 | 1 | 32V/6A | — | — | — | 192W |
| GPP-2323 | 2 | 32V/3A | 32V/3A | — | — | 192W |
| GPP-3323 | 3 | 32V/3A | 32V/3A | 5V/1A | — | 217W |
| GPP-4323 | 4 | 32V/3A | 32V/3A | 5V/1A | 15V/1A | 232W |

**Common Features:**
- Low noise and ripple
- Independent/Tracking/Series/Parallel modes
- Delay output function
- 4-wire remote sensing (CH1, CH2)
- USB/LAN connectivity

---

## Connection Methods

| Method | Port/Interface | Notes |
|--------|----------------|-------|
| USB-TMC | USB | Requires VISA driver |
| USB-CDC | USB | Virtual COM port |
| LAN (Socket) | Port 5025 | Raw SCPI |
| RS-232 | — | 115200 baud default |

**USB Vendor ID**: 0x2184 (GW Instek)

---

## Command Notation

- Commands are case-insensitive
- Short form: uppercase portion required (e.g., `VOLTage` → `VOLT`)
- `<n>` = channel number (1, 2, 3, or 4)
- `{ON|OFF}` = boolean (also accepts 1|0)
- Commands terminated with LF (`\n`)

---

## IEEE 488.2 Common Commands

```
*IDN?                    → Query identification
                           Returns: GW INSTEK,GPD-4303S,<serial>,<fw_version>

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

*TST?                    → Self-test

*SAV {1|2|3|4}           → Save state to memory (4 slots)
*RCL {1|2|3|4}           → Recall state from memory
```

---

## Channel Selection

```
INSTrument[:SELect] {CH1|CH2|CH3|CH4}
                         → Select channel for subsequent commands

INSTrument[:SELect]?     → Query selected channel
                           Returns: CH1, CH2, CH3, or CH4

INSTrument:NSELect {1|2|3|4}
                         → Select channel by number

INSTrument:NSELect?      → Query selected channel number
```

---

## Voltage Commands

### Set Voltage

```
[SOURce<n>:]VOLTage[:LEVel][:IMMediate][:AMPLitude] <voltage>
                         → Set output voltage in volts

[SOURce<n>:]VOLTage[:LEVel][:IMMediate][:AMPLitude]?
                         → Query voltage setpoint
```

**Examples:**
```
VOLT 12.0                → Set voltage on selected channel
SOUR1:VOLT 5.0           → Set channel 1 to 5V
SOUR2:VOLT 3.3           → Set channel 2 to 3.3V
VOLT?                    → Query voltage setpoint
```

### Voltage Limits

```
[SOURce<n>:]VOLTage:LIMit[:LEVel] <voltage>
                         → Set voltage upper limit (soft limit)

[SOURce<n>:]VOLTage:LIMit[:LEVel]?
                         → Query voltage limit
```

### Over-Voltage Protection

```
[SOURce<n>:]VOLTage:PROTection[:LEVel] <voltage>
                         → Set OVP trip level

[SOURce<n>:]VOLTage:PROTection[:LEVel]?
                         → Query OVP level

[SOURce<n>:]VOLTage:PROTection:STATe {ON|OFF}
                         → Enable/disable OVP

[SOURce<n>:]VOLTage:PROTection:STATe?
                         → Query OVP state

[SOURce<n>:]VOLTage:PROTection:TRIPped?
                         → Query if OVP has tripped

[SOURce<n>:]VOLTage:PROTection:CLEar
                         → Clear OVP trip condition
```

---

## Current Commands

### Set Current Limit

```
[SOURce<n>:]CURRent[:LEVel][:IMMediate][:AMPLitude] <current>
                         → Set current limit in amps

[SOURce<n>:]CURRent[:LEVel][:IMMediate][:AMPLitude]?
                         → Query current limit
```

**Examples:**
```
CURR 1.5                 → Set current limit on selected channel
SOUR1:CURR 2.0           → Set channel 1 current limit to 2A
CURR?                    → Query current limit
```

### Current Limits

```
[SOURce<n>:]CURRent:LIMit[:LEVel] <current>
                         → Set current upper limit (soft limit)

[SOURce<n>:]CURRent:LIMit[:LEVel]?
                         → Query current limit
```

### Over-Current Protection

```
[SOURce<n>:]CURRent:PROTection[:LEVel] <current>
                         → Set OCP trip level

[SOURce<n>:]CURRent:PROTection[:LEVel]?
                         → Query OCP level

[SOURce<n>:]CURRent:PROTection:STATe {ON|OFF}
                         → Enable/disable OCP

[SOURce<n>:]CURRent:PROTection:STATe?
                         → Query OCP state

[SOURce<n>:]CURRent:PROTection:TRIPped?
                         → Query if OCP has tripped

[SOURce<n>:]CURRent:PROTection:CLEar
                         → Clear OCP trip condition
```

---

## Measurement Commands

### Measure Voltage

```
MEASure[:SCALar]:VOLTage[:DC]?
                         → Measure output voltage on selected channel

MEASure[:SCALar]:VOLTage[:DC]? CH<n>
                         → Measure voltage on specific channel

MEASure:ALL[:DC]?        → Measure all channels
                           Returns: <V1>,<V2>,<V3>,<V4>
```

**Examples:**
```
MEAS:VOLT?               → Measure voltage on selected channel
MEAS:VOLT? CH1           → Measure channel 1 voltage
MEAS:ALL?                → Measure all channel voltages
```

### Measure Current

```
MEASure[:SCALar]:CURRent[:DC]?
                         → Measure output current on selected channel

MEASure[:SCALar]:CURRent[:DC]? CH<n>
                         → Measure current on specific channel
```

### Measure Power

```
MEASure[:SCALar]:POWer[:DC]?
                         → Measure output power in watts
```

---

## Output Control

### Enable/Disable Output

```
OUTPut[:STATe] {ON|OFF|1|0}
                         → Enable/disable output on selected channel

OUTPut[:STATe]?          → Query output state
                           Returns: 0 or 1

OUTPut[:STATe] {ON|OFF},CH<n>
                         → Enable/disable specific channel
```

**Examples:**
```
OUTP ON                  → Enable selected channel output
OUTP OFF,CH1             → Disable channel 1
OUTP?                    → Query output state
```

### All Outputs (Master Control)

```
OUTPut:ALL[:STATe] {ON|OFF}
                         → Enable/disable all outputs

OUTPut:ALL[:STATe]?      → Query master output state
```

---

## Operating Mode

### Track Mode

Tracking links channel voltages proportionally:

```
OUTPut:TRACk[:MODE] {INDependent|SERies|PARallel}
                         → Set operating mode
                           INDependent: All channels independent
                           SERies: CH1+CH2 in series
                           PARallel: CH1+CH2 in parallel

OUTPut:TRACk[:MODE]?     → Query operating mode
```

### Tracking Enable (Voltage Tracking)

```
OUTPut:TRACk[:STATe] {ON|OFF}
                         → Enable/disable voltage tracking

OUTPut:TRACk[:STATe]?    → Query tracking state
```

When tracking enabled:
- CH1 and CH2 voltages track each other
- Adjusting one adjusts the other proportionally

---

## Delay Output Function

Programmable turn-on/turn-off delays:

### Turn-On Delay

```
OUTPut:DELay:ON[:STATe] {ON|OFF}
                         → Enable/disable turn-on delay

OUTPut:DELay:ON[:STATe]?
                         → Query turn-on delay state

OUTPut:DELay:ON:TIME <seconds>
                         → Set turn-on delay time (0.1 to 99.9 seconds)

OUTPut:DELay:ON:TIME?    → Query turn-on delay time
```

### Turn-Off Delay

```
OUTPut:DELay:OFF[:STATe] {ON|OFF}
                         → Enable/disable turn-off delay

OUTPut:DELay:OFF[:STATe]?
                         → Query turn-off delay state

OUTPut:DELay:OFF:TIME <seconds>
                         → Set turn-off delay time

OUTPut:DELay:OFF:TIME?   → Query turn-off delay time
```

---

## Remote Sense (4-Wire)

For accurate voltage regulation at the load (CH1 and CH2 only):

```
[SOURce<n>:]VOLTage:SENSe[:STATe] {ON|OFF}
                         → Enable/disable remote sensing

[SOURce<n>:]VOLTage:SENSe[:STATe]?
                         → Query sense state
```

When enabled, connect rear sense terminals to load terminals for 4-wire sensing.

---

## Timer/Sequence Function

### Timer Setup

```
TIMer:SET <group>,<voltage>,<current>,<time>
                         → Set timer step parameters
                           group: 1 to 5
                           voltage: in volts
                           current: in amps
                           time: in seconds

TIMer:SET? <group>       → Query timer step settings
                           Returns: <voltage>,<current>,<time>
```

### Timer Control

```
TIMer[:STATe] {ON|OFF}   → Enable/disable timer function

TIMer[:STATe]?           → Query timer state

TIMer:CYCLe <count>      → Set number of timer cycles (1 to 99999, 0 = infinite)

TIMer:CYCLe?             → Query cycle count

TIMer:ENDstate {OFF|LAST}
                         → Set end state after timer completes
                           OFF: Output turns off
                           LAST: Output stays at last step values

TIMer:ENDstate?          → Query end state setting
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
```

### Beeper

```
SYSTem:BEEPer[:IMMediate]
                         → Generate beep

SYSTem:BEEPer:STATe {ON|OFF}
                         → Enable/disable beeper
```

### Remote/Local

```
SYSTem:LOCal             → Return to local control

SYSTem:REMote            → Enter remote mode

SYSTem:RWLock            → Remote with lock (front panel disabled)
```

### Address (GPIB)

```
SYSTem:COMMunicate:GPIB:ADDRess <1-30>
                         → Set GPIB address

SYSTem:COMMunicate:GPIB:ADDRess?
                         → Query GPIB address
```

---

## Display Commands

```
DISPlay[:WINDow]:TEXT[:DATA] "<message>"
                         → Display message on front panel

DISPlay[:WINDow]:TEXT:CLEar
                         → Clear user message
```

---

## Status System

### Status Byte (*STB?)

| Bit | Value | Description |
|-----|-------|-------------|
| 2 | 4 | Error available |
| 3 | 8 | Questionable status summary |
| 4 | 16 | Message available |
| 5 | 32 | Event status summary |
| 6 | 64 | Request for service |
| 7 | 128 | Operation status summary |

### Questionable Status Register

```
STATus:QUEStionable:CONDition?
                         → Query condition register

STATus:QUEStionable[:EVENt]?
                         → Query and clear event register

STATus:QUEStionable:ENABle <mask>
                         → Set enable mask
```

**Questionable Status Bits:**
| Bit | Description |
|-----|-------------|
| 0 | CH1 in CC mode |
| 1 | CH2 in CC mode |
| 2 | CH3 in CC mode |
| 3 | CH4 in CC mode |
| 9 | OVP tripped |
| 10 | OCP tripped |
| 11 | OTP (over-temperature) |

### Operation Status Register

```
STATus:OPERation:CONDition?
                         → Query operation condition

STATus:OPERation[:EVENt]?
                         → Query and clear operation event

STATus:OPERation:ENABle <mask>
                         → Set enable mask
```

---

## Apply Command (Shortcut)

```
APPLy <voltage>,<current>
                         → Set voltage and current on selected channel

APPLy CH<n>,<voltage>,<current>
                         → Set voltage and current on specific channel

APPLy?                   → Query settings
                           Returns: <voltage>,<current>
```

**Examples:**
```
APPL 12.0,1.5            → Set 12V, 1.5A on selected channel
APPL CH1,5.0,2.0         → Set channel 1 to 5V, 2A
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
SOUR1:CURR 0.5           ; Channel 1: 0.5A
SOUR2:VOLT 5.0           ; Channel 2: 5V
SOUR2:CURR 1.0           ; Channel 2: 1A
SOUR3:VOLT 5.0           ; Channel 3: 5V (fixed options)
SOUR3:CURR 0.5           ; Channel 3: 0.5A
SOUR4:VOLT 12.0          ; Channel 4: 12V (GPD-4303S only)
SOUR4:CURR 0.3           ; Channel 4: 0.3A
OUTP:ALL ON              ; Enable all outputs
```

### Protection Setup

```
INST:NSEL 1              ; Select channel 1
VOLT:PROT 6.0            ; OVP at 6V
VOLT:PROT:STAT ON        ; Enable OVP
CURR:PROT 2.0            ; OCP at 2A
CURR:PROT:STAT ON        ; Enable OCP
VOLT 5.0                 ; Set 5V
CURR 1.0                 ; Set 1A limit
OUTP ON                  ; Enable output
```

### Tracking Mode

```
*RST
SOUR1:VOLT 10.0          ; CH1: 10V
SOUR1:CURR 1.0           ; CH1: 1A
SOUR2:VOLT 10.0          ; CH2: 10V
SOUR2:CURR 1.0           ; CH2: 1A
OUTP:TRAC ON             ; Enable tracking
OUTP:ALL ON              ; Enable outputs
; Now adjusting CH1 voltage also adjusts CH2
SOUR1:VOLT 12.0          ; Both channels now 12V
```

### Series Mode

```
*RST
OUTP:TRAC:MODE SER       ; Series mode (CH1 + CH2)
SOUR1:VOLT 30.0          ; Combined voltage: 60V
SOUR1:CURR 2.0           ; Current limit: 2A
OUTP:ALL ON              ; Enable (use CH1+/CH2- terminals)
```

### Parallel Mode

```
*RST
OUTP:TRAC:MODE PAR       ; Parallel mode (CH1 || CH2)
SOUR1:VOLT 15.0          ; Voltage: 15V
SOUR1:CURR 5.0           ; Combined current: 6A (2×3A)
OUTP:ALL ON              ; Enable (use CH1 terminals)
```

### Timer Sequence

```
*RST
INST:NSEL 1              ; Select channel 1
; Define 3-step sequence
TIM:SET 1,5.0,1.0,10     ; Step 1: 5V, 1A, 10 sec
TIM:SET 2,10.0,1.0,20    ; Step 2: 10V, 1A, 20 sec
TIM:SET 3,15.0,1.0,15    ; Step 3: 15V, 1A, 15 sec
TIM:CYC 2                ; Run 2 cycles
TIM:END OFF              ; Turn off when done
OUTP ON                  ; Enable output
TIM ON                   ; Start timer sequence
```

### Delay Turn-On

```
INST:NSEL 1
OUTP:DEL:ON:TIME 5.0     ; 5 second turn-on delay
OUTP:DEL:ON ON           ; Enable turn-on delay

INST:NSEL 2
OUTP:DEL:ON:TIME 7.0     ; 7 second turn-on delay
OUTP:DEL:ON ON           ; Enable turn-on delay

SOUR1:VOLT 3.3
SOUR2:VOLT 5.0
OUTP:ALL ON              ; CH1 turns on at t=5s, CH2 at t=7s
```

---

## Notes

1. **Command Termination**: LF (`\n`). Responses terminated with LF.

2. **Channel 3 (GPD-4303S)**: Fixed voltage options (2.5V, 3.3V, or 5V) selected via front panel. SCPI can only set current limit.

3. **Channel 4 (GPD-4303S)**: Fixed 15V output. SCPI can only set current limit.

4. **Series Mode**: Output at CH1(+) and CH2(-). Internal connection between CH1(-) and CH2(+).

5. **Parallel Mode**: Output at CH1 terminals only. CH2 terminals internally connected.

6. **Remote Sense**: Only available on CH1 and CH2. Compensates for lead resistance.

7. **Timer Steps**: Maximum 5 steps per sequence.

8. **Tracking**: Maintains voltage ratio when adjusting. Set initial voltages before enabling.

9. **Response Format**: Numbers returned with 3 decimal places (e.g., `5.000`, `1.500`).

10. **USB CDC Mode**: When using USB-CDC (virtual COM), send commands as ASCII text with LF termination.
