# ITECH IT6000 Series Power Supply SCPI Command Reference

> Extracted from ITECH IT6300/IT6400/IT6500/IT6900 Series Programming Manuals
> Applicable models: IT6302, IT6322, IT6332A, IT6412, IT6500C, IT6900A series

## Model Specifications

### IT6300 Series (Multi-Output Linear)

| Model | Channels | CH1 | CH2 | CH3 | Power |
|-------|----------|-----|-----|-----|-------|
| IT6302 | 3 | 30V/3A | 30V/3A | 5V/3A | 195W |
| IT6322 | 3 | 30V/3A | 30V/3A | 5V/3A | 195W |
| IT6332A | 3 | 30V/3A | 30V/3A | 5V/3A | 195W |

### IT6400 Series (Bipolar DC Source)

| Model | Channels | Voltage | Current | Power |
|-------|----------|---------|---------|-------|
| IT6412 | 2 | ±60V | ±5A | 150W×2 |
| IT6432 | 2 | ±60V | ±10A | 300W×2 |

### IT6500C Series (High Power Programmable)

| Model | Channels | Voltage | Current | Power |
|-------|----------|---------|---------|-------|
| IT6512C | 1 | 80V | 60A | 1200W |
| IT6513C | 1 | 150V | 30A | 1200W |
| IT6522C | 1 | 80V | 120A | 3000W |
| IT6523C | 1 | 160V | 60A | 3000W |

### IT6900A Series (Wide Range)

| Model | Channels | Voltage | Current | Power |
|-------|----------|---------|---------|-------|
| IT6922A | 1 | 60V | 5A | 100W |
| IT6932A | 1 | 60V | 10A | 200W |
| IT6942A | 1 | 60V | 15A | 360W |
| IT6952A | 1 | 60V | 25A | 600W |

**Common Features:**
- High precision and stability
- List mode for arbitrary sequences
- Battery test/simulation (select models)
- Solar array simulation (select models)
- Parallel/series operation (high power models)

---

## Connection Methods

| Method | Port/Interface | Notes |
|--------|----------------|-------|
| USB-TMC | USB | Requires VISA driver |
| LAN (VXI-11) | — | Via VISA |
| LAN (Socket) | Port 30000 | Raw SCPI (default) |
| LAN (Telnet) | Port 23 | Interactive |
| GPIB | — | Optional on some models |
| RS-232 | — | 9600-115200 baud |

**USB Vendor ID**: Varies by model generation

---

## Command Notation

- Commands are case-insensitive
- Short form: uppercase portion required
- `<n>` = channel number (1, 2, or 3)
- `{ON|OFF}` = boolean (also accepts 1|0)
- Commands terminated with LF (`\n`)

---

## IEEE 488.2 Common Commands

```
*IDN?                    → Query identification
                           Returns: ITECH,IT6322,<serial>,<fw_version>

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

*TRG                     → Software trigger

*TST?                    → Self-test (0 = pass)

*WAI                     → Wait for operations complete

*SAV {1|2|3|4|5|6|7|8|9|10}
                         → Save state to memory (10 slots)

*RCL {1|2|3|4|5|6|7|8|9|10}
                         → Recall state from memory
```

---

## Channel Selection (Multi-Output Models)

```
INSTrument[:SELect] {CH1|CH2|CH3}
                         → Select channel for subsequent commands

INSTrument[:SELect]?     → Query selected channel
                           Returns: CH1, CH2, or CH3

INSTrument:NSELect {1|2|3}
                         → Select channel by number

INSTrument:NSELect?      → Query selected channel number
```

---

## Operating Mode

### Mode Selection

```
SOURce:MODE {VOLTage|CURRent}
                         → Set operating mode
                           VOLTage: Constant voltage (CV) priority
                           CURRent: Constant current (CC) priority

SOURce:MODE?             → Query operating mode
```

**Note:** In CV mode, voltage is controlled and current is limited. In CC mode, current is controlled and voltage is limited.

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
VOLT 12.0                → Set voltage to 12V
SOUR:VOLT 5.0            → Same as above
VOLT?                    → Query voltage setpoint
```

### Voltage Range/Limit

```
[SOURce:]VOLTage:RANGe <voltage>
                         → Set voltage range (affects resolution)

[SOURce:]VOLTage:RANGe?  → Query voltage range

[SOURce:]VOLTage:LIMit[:HIGH] <voltage>
                         → Set voltage upper limit

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

### Voltage Slew Rate (High Power Models)

```
[SOURce:]VOLTage:SLEW[:BOTH] <rate>
                         → Set voltage slew rate (V/s)

[SOURce:]VOLTage:SLEW:RISing <rate>
                         → Set rising slew rate

[SOURce:]VOLTage:SLEW:FALLing <rate>
                         → Set falling slew rate

[SOURce:]VOLTage:SLEW?   → Query slew rate
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
CURR 1.5                 → Set current limit to 1.5A
CURR?                    → Query current limit
```

### Current Range/Limit

```
[SOURce:]CURRent:RANGe <current>
                         → Set current range

[SOURce:]CURRent:RANGe?  → Query current range

[SOURce:]CURRent:LIMit[:HIGH] <current>
                         → Set current upper limit

[SOURce:]CURRent:LIMit:LOW <current>
                         → Set current lower limit
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

[SOURce:]CURRent:PROTection:DELay <seconds>
                         → Set OCP delay time

[SOURce:]CURRent:PROTection:DELay?
                         → Query OCP delay
```

### Current Slew Rate

```
[SOURce:]CURRent:SLEW[:BOTH] <rate>
                         → Set current slew rate (A/s)

[SOURce:]CURRent:SLEW:RISing <rate>
                         → Set rising slew rate

[SOURce:]CURRent:SLEW:FALLing <rate>
                         → Set falling slew rate
```

---

## Power Commands (Power Priority Mode)

Some models support constant power mode:

```
[SOURce:]POWer[:LEVel][:IMMediate] <power>
                         → Set power level in watts

[SOURce:]POWer[:LEVel][:IMMediate]?
                         → Query power setpoint

[SOURce:]POWer:LIMit[:HIGH] <power>
                         → Set power upper limit

[SOURce:]POWer:PROTection[:LEVel] <power>
                         → Set OPP level

[SOURce:]POWer:PROTection:STATe {ON|OFF}
                         → Enable/disable OPP
```

---

## Resistance Simulation (Select Models)

```
[SOURce:]RESistance[:LEVel][:IMMediate] <ohms>
                         → Set internal resistance

[SOURce:]RESistance[:LEVel][:IMMediate]?
                         → Query resistance

[SOURce:]RESistance:STATe {ON|OFF}
                         → Enable/disable resistance simulation
```

---

## Measurement Commands

### Measure Voltage

```
MEASure[:SCALar]:VOLTage[:DC]?
                         → Measure output voltage
                           Returns: voltage in volts
```

### Measure Current

```
MEASure[:SCALar]:CURRent[:DC]?
                         → Measure output current
                           Returns: current in amps
```

### Measure Power

```
MEASure[:SCALar]:POWer[:DC]?
                         → Measure output power
                           Returns: power in watts
```

### Fetch (Last Measurement)

```
FETCh:VOLTage[:DC]?      → Fetch last voltage measurement
FETCh:CURRent[:DC]?      → Fetch last current measurement
FETCh:POWer[:DC]?        → Fetch last power measurement
```

---

## Output Control

### Enable/Disable Output

```
OUTPut[:STATe] {ON|OFF|1|0}
                         → Enable/disable output

OUTPut[:STATe]?          → Query output state
                           Returns: 0 or 1
```

### Output with Channel (Multi-Output)

```
OUTPut[:STATe] {ON|OFF},(@<n>)
                         → Enable/disable specific channel

OUTPut[:STATe]? (@<n>)   → Query specific channel state
```

### Output Timer

```
OUTPut:TIMer[:STATe] {ON|OFF}
                         → Enable/disable output timer

OUTPut:TIMer:DATA <seconds>
                         → Set output on-time

OUTPut:TIMer:DATA?       → Query output timer value
```

---

## List Mode (Arbitrary Sequences)

### List Configuration

```
LIST:COUNt <count>       → Set number of list repetitions (0 = infinite)

LIST:COUNt?              → Query list count

LIST:STEPs <n>           → Set number of steps in list

LIST:STEPs?              → Query number of steps
```

### List Data

```
LIST:VOLTage <v1>,<v2>,<v3>,...
                         → Set voltage values for each step

LIST:VOLTage?            → Query voltage list

LIST:CURRent <i1>,<i2>,<i3>,...
                         → Set current values for each step

LIST:CURRent?            → Query current list

LIST:WIDTh <t1>,<t2>,<t3>,...
                         → Set dwell time for each step (seconds)

LIST:WIDTh?              → Query dwell times
```

### List Control

```
LIST:STATe {ON|OFF}      → Enable/disable list mode

LIST:STATe?              → Query list mode state

LIST:SAVE <slot>         → Save list to memory

LIST:RECall <slot>       → Recall list from memory
```

### Example: 5-Step List

```
LIST:STEP 5                      ; 5 steps
LIST:VOLT 0,5,10,15,20          ; Voltages
LIST:CURR 1,1,1,1,1             ; Currents
LIST:WIDT 1,2,3,2,1             ; Dwell times (seconds)
LIST:COUN 3                      ; Repeat 3 times
OUTP ON                          ; Enable output
LIST:STAT ON                     ; Start list execution
```

---

## Trigger System

### Trigger Source

```
TRIGger:SOURce {IMMediate|BUS|EXTernal}
                         → Set trigger source

TRIGger:SOURce?          → Query trigger source
```

### Trigger Actions

```
INITiate[:IMMediate]     → Initiate trigger system

*TRG                     → Execute software trigger

TRIGger[:IMMediate]      → Execute immediate trigger

ABORt                    → Abort triggered operation
```

### Trigger Coupling (Multi-Output)

```
TRIGger:COUPle {ALL|NONE|<list>}
                         → Couple outputs for simultaneous trigger
```

---

## Battery Test/Simulation (Select Models)

### Battery Test Mode

```
FUNCtion:MODE {FIXed|BATTery|LIST|...}
                         → Set operating function

SOURce:BATTery:TYPE {LEAD|LITHium|NIcad|NIHm}
                         → Set battery type

SOURce:BATTery:VOLTage <voltage>
                         → Set battery terminal voltage

SOURce:BATTery:CAPacity <Ah>
                         → Set battery capacity

SOURce:BATTery:RESistance <ohms>
                         → Set internal resistance
```

---

## System Commands

### Error Query

```
SYSTem:ERRor[:NEXT]?     → Query and clear oldest error
                           Returns: <code>,"<message>"
                           0,"No error" when empty

SYSTem:ERRor:COUNt?      → Query number of errors in queue
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

SYSTem:RWLock            → Remote with lock
```

### Configuration

```
SYSTem:CONFigure:MODE {NORMal|MASTer|SLAVe}
                         → Set parallel/series config mode

SYSTem:CONFigure:SYNChronization {ON|OFF}
                         → Enable sync for master/slave
```

---

## Display Commands

```
DISPlay[:WINDow]:TEXT[:DATA] "<message>"
                         → Display message on front panel

DISPlay[:WINDow]:TEXT:CLEar
                         → Clear user message

DISPlay[:WINDow]:STATe {ON|OFF}
                         → Turn display on/off
```

---

## Status System

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
| 0 | Voltage fault |
| 1 | Current fault |
| 4 | Over-temperature |
| 9 | OVP tripped |
| 10 | OCP tripped |
| 11 | OPP tripped |

### Operation Status Register

```
STATus:OPERation:CONDition?
                         → Query operation condition

STATus:OPERation[:EVENt]?
                         → Query and clear operation event

STATus:OPERation:ENABle <mask>
                         → Set enable mask
```

**Operation Status Bits:**
| Bit | Description |
|-----|-------------|
| 0 | CV mode |
| 1 | CC mode |
| 5 | Waiting for trigger |
| 8 | List running |

---

## Apply Command (Shortcut)

```
APPLy <voltage>,<current>
                         → Set voltage and current

APPLy?                   → Query settings
                           Returns: <voltage>,<current>
```

---

## Programming Examples

### Basic Output Setup (Single Channel)

```
*RST                     ; Reset to defaults
SOUR:MODE VOLT           ; CV mode
VOLT 12.0                ; Set 12V
CURR 1.0                 ; Set 1A limit
OUTP ON                  ; Enable output
MEAS:VOLT?               ; Read actual voltage
MEAS:CURR?               ; Read actual current
MEAS:POW?                ; Read power
```

### Multi-Channel Configuration (IT6322)

```
*RST                     ; Reset
INST:NSEL 1              ; Select channel 1
VOLT 3.3                 ; 3.3V
CURR 0.5                 ; 0.5A limit

INST:NSEL 2              ; Select channel 2
VOLT 5.0                 ; 5V
CURR 1.0                 ; 1A limit

INST:NSEL 3              ; Select channel 3
VOLT 5.0                 ; 5V (or 2.5/3.3V depending on model)
CURR 0.5                 ; 0.5A limit

OUTP ON,(@1)             ; Enable channel 1
OUTP ON,(@2)             ; Enable channel 2
OUTP ON,(@3)             ; Enable channel 3
```

### Protection Setup

```
VOLT:PROT 15.0           ; OVP at 15V
VOLT:PROT:STAT ON        ; Enable OVP
CURR:PROT 2.0            ; OCP at 2A
CURR:PROT:STAT ON        ; Enable OCP
CURR:PROT:DEL 0.1        ; 100ms OCP delay
VOLT 12.0                ; Set 12V
CURR 1.0                 ; Set 1A limit
OUTP ON
; Check for trips
VOLT:PROT:TRIP?          ; Returns 0 or 1
CURR:PROT:TRIP?          ; Returns 0 or 1
; Clear if tripped
VOLT:PROT:CLE
CURR:PROT:CLE
```

### Slew Rate Control (High Power)

```
VOLT:SLEW:RIS 10         ; 10 V/s rising
VOLT:SLEW:FALL 20        ; 20 V/s falling
CURR:SLEW:RIS 5          ; 5 A/s rising
CURR:SLEW:FALL 10        ; 10 A/s falling
VOLT 48.0                ; Ramp to 48V
CURR 20.0                ; Current limit 20A
OUTP ON
```

### List Mode Sequence

```
*RST
LIST:STEP 5              ; 5 steps
LIST:VOLT 0,12,24,12,0   ; Voltage sequence
LIST:CURR 2,2,2,2,2      ; Current limits
LIST:WIDT 1,5,10,5,1     ; Dwell times (seconds)
LIST:COUN 0              ; Repeat forever (0 = infinite)
OUTP ON
LIST:STAT ON             ; Start list
; ...
LIST:STAT OFF            ; Stop list
```

### Triggered Voltage Step

```
VOLT 5.0                 ; Initial voltage
CURR 1.0                 ; Current limit
TRIG:SOUR BUS            ; Software trigger
OUTP ON                  ; Enable at 5V
; Set triggered level
VOLT:TRIG 12.0           ; Will step to 12V on trigger
INIT                     ; Arm trigger system
*TRG                     ; Execute trigger - voltage steps to 12V
```

---

## Notes

1. **Command Termination**: LF (`\n`). Some models also accept CR+LF.

2. **TCP Port**: Default is 30000 (different from typical 5025).

3. **Slew Rate**: High-power models support programmable slew. Entry models may not.

4. **List Mode**: Maximum 100-150 steps depending on model.

5. **Battery Mode**: Available on select models. Simulates battery discharge curves.

6. **Master/Slave**: High-power models can be paralleled for higher current.

7. **Response Format**: Scientific notation (e.g., `1.200000E+01`) or plain decimal.

8. **Bipolar Models (IT6400)**: Can source and sink current. Voltage can be negative.

9. **Protection Clearing**: After any protection trip, output must be re-enabled after clearing.

10. **Channel Independence**: Multi-output models have fully isolated channels (IT6300 series).
