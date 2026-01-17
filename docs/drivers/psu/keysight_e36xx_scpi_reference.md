# Keysight E36xx Series Power Supply SCPI Command Reference

> Extracted from Keysight E36300 Series Programming Guide and E3631A/E3632A/E3633A/E3634A User's Guide
> Applicable models: E3631A, E3632A, E3633A, E3634A, E36311A, E36312A, E36313A

## Model Specifications

### Legacy E363xA Series

| Model | Outputs | Voltage/Current | Power | Notes |
|-------|---------|-----------------|-------|-------|
| E3631A | 3 | 6V/5A, +25V/1A, -25V/1A | 80W | Triple output |
| E3632A | 1 | 15V/7A or 30V/4A | 120W | Single, dual range |
| E3633A | 1 | 8V/20A or 20V/10A | 200W | Single, dual range |
| E3634A | 1 | 25V/7A or 50V/4A | 200W | Single, dual range |

### Modern E3631xA Series

| Model | Outputs | Voltage/Current | Power | Notes |
|-------|---------|-----------------|-------|-------|
| E36311A | 3 | 6V/5A, 25V/1A, 25V/1A | 80W | Triple output |
| E36312A | 3 | 6V/5A, +25V/1A, +25V/1A | 80W | Triple output |
| E36313A | 3 | 6V/10A, +25V/2A, +25V/2A | 160W | Higher current |

---

## Connection Methods

| Method | Port/Interface | Notes |
|--------|----------------|-------|
| USB-TMC | USB | Requires VISA driver |
| LAN (VXI-11) | Port 111 | Via VISA |
| LAN (HiSLIP) | Port 4880 | Modern protocol |
| LAN (Telnet) | Port 5024 | Interactive |
| LAN (Socket) | Port 5025 | Raw SCPI |
| GPIB | — | E36312A/E36313A, optional on others |

**USB Vendor ID**: 0x0957 (Keysight/Agilent)

---

## Command Notation

- Commands are case-insensitive
- Short form shown in capitals: `VOLTage` → `VOLT`
- `<n>` = output number (1, 2, or 3)
- `[optional]` = can be omitted
- `{choice1|choice2}` = select one
- Commands terminated with LF (`\n`) or CR+LF

---

## IEEE 488.2 Common Commands

```
*IDN?                    → Query identification
                           Returns: Keysight Technologies,E36312A,<serial>,<fw_version>

*RST                     → Reset to power-on state

*CLS                     → Clear status registers and error queue

*ESE <mask>              → Set standard event enable register (0-255)
*ESE?                    → Query standard event enable register

*ESR?                    → Query and clear standard event status register

*OPC                     → Set OPC bit when pending operations complete
*OPC?                    → Returns "1" when all pending operations complete

*SRE <mask>              → Set service request enable register (0-255)
*SRE?                    → Query service request enable register

*STB?                    → Query status byte register

*TST?                    → Self-test (returns 0 if passed)

*WAI                     → Wait for pending operations to complete

*SAV {0|1|2|3|4}         → Save instrument state to memory location
*RCL {0|1|2|3|4}         → Recall instrument state from memory location
```

---

## Output Selection

### E3631A / E3631xA (Triple Output)

The triple-output models have named outputs:

```
INSTrument:SELect {OUTPut1|OUTPut2|OUTPut3}
                         → Select output for subsequent commands

INSTrument:SELect?       → Query selected output
                           Returns: OUTP1, OUTP2, or OUTP3

INSTrument:NSELect {1|2|3}
                         → Select output by number

INSTrument:NSELect?      → Query selected output number
                           Returns: 1, 2, or 3
```

**E3631A Output Names** (aliases):
```
INSTrument:SELect {P6V|P25V|N25V}
                         → P6V = Output 1 (6V/5A)
                         → P25V = Output 2 (+25V/1A)
                         → N25V = Output 3 (-25V/1A)
```

### E3632A/E3633A/E3634A (Single Output)

Single-output models don't require output selection. Commands apply to the single output.

---

## Voltage Commands

### Set Voltage

```
[SOURce:]VOLTage[:LEVel][:IMMediate][:AMPLitude] <voltage>
                         → Set output voltage in volts

[SOURce:]VOLTage[:LEVel][:IMMediate][:AMPLitude]? [MINimum|MAXimum]
                         → Query voltage setpoint
                           Returns: voltage as float (e.g., +1.20000E+01)
```

**Examples:**
```
VOLT 12.0                → Set voltage to 12V on selected output
VOLT?                    → Query voltage setpoint
VOLT? MAX                → Query maximum settable voltage
```

### Voltage with Output Specifier (E36312A/E36313A)

```
[SOURce:]VOLTage[:LEVel][:IMMediate][:AMPLitude] <voltage>,(@<list>)
                         → Set voltage on specific output(s)

[SOURce:]VOLTage[:LEVel][:IMMediate][:AMPLitude]? (@<list>)
                         → Query voltage on specific output(s)
```

**Examples:**
```
VOLT 5.0,(@1)            → Set output 1 to 5V
VOLT 12.0,(@2,3)         → Set outputs 2 and 3 to 12V
VOLT? (@1,2,3)           → Query all three outputs
                           Returns: +5.00000E+00,+1.20000E+01,+1.20000E+01
```

### Triggered Voltage (Step Mode)

```
[SOURce:]VOLTage[:LEVel]:TRIGgered[:AMPLitude] <voltage>
                         → Set triggered voltage level

[SOURce:]VOLTage[:LEVel]:TRIGgered[:AMPLitude]?
                         → Query triggered voltage level
```

When triggered, output steps from immediate level to triggered level.

### Voltage Protection (OVP)

```
[SOURce:]VOLTage:PROTection[:LEVel] <voltage>
                         → Set over-voltage protection level

[SOURce:]VOLTage:PROTection[:LEVel]?
                         → Query OVP level

[SOURce:]VOLTage:PROTection:STATe {ON|OFF|1|0}
                         → Enable/disable OVP

[SOURce:]VOLTage:PROTection:STATe?
                         → Query OVP state
                           Returns: 0 or 1

[SOURce:]VOLTage:PROTection:TRIPped?
                         → Query if OVP has tripped
                           Returns: 0 or 1

[SOURce:]VOLTage:PROTection:CLEar
                         → Clear OVP trip condition
```

---

## Current Commands

### Set Current Limit

```
[SOURce:]CURRent[:LEVel][:IMMediate][:AMPLitude] <current>
                         → Set current limit in amps

[SOURce:]CURRent[:LEVel][:IMMediate][:AMPLitude]? [MINimum|MAXimum]
                         → Query current limit
```

**Examples:**
```
CURR 1.5                 → Set current limit to 1.5A
CURR?                    → Query current limit
CURR? MAX                → Query maximum settable current
```

### Current with Output Specifier

```
CURR 2.0,(@1)            → Set output 1 current limit to 2A
CURR? (@1,2,3)           → Query all output current limits
```

### Triggered Current

```
[SOURce:]CURRent[:LEVel]:TRIGgered[:AMPLitude] <current>
                         → Set triggered current level

[SOURce:]CURRent[:LEVel]:TRIGgered[:AMPLitude]?
                         → Query triggered current level
```

### Over-Current Protection

```
[SOURce:]CURRent:PROTection:STATe {ON|OFF|1|0}
                         → Enable/disable OCP

[SOURce:]CURRent:PROTection:STATe?
                         → Query OCP state

[SOURce:]CURRent:PROTection:DELay <seconds>
                         → Set OCP delay (0 to 0.255 seconds)

[SOURce:]CURRent:PROTection:DELay?
                         → Query OCP delay

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

MEASure[:SCALar]:VOLTage[:DC]? (@<list>)
                         → Measure voltage on specific outputs
```

**Examples:**
```
MEAS:VOLT?               → Measure voltage on selected output
MEAS:VOLT? (@1)          → Measure voltage on output 1
MEAS:VOLT? (@1,2,3)      → Measure all outputs
                           Returns: +5.01234E+00,+1.20056E+01,+1.19987E+01
```

### Measure Current

```
MEASure[:SCALar]:CURRent[:DC]?
                         → Measure and return output current

MEASure[:SCALar]:CURRent[:DC]? (@<list>)
                         → Measure current on specific outputs
```

**Examples:**
```
MEAS:CURR?               → Measure current on selected output
MEAS:CURR? (@1,2,3)      → Measure all output currents
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
                         → Enable/disable specific outputs
```

**Examples:**
```
OUTP ON                  → Enable selected output
OUTP OFF,(@1,2,3)        → Disable all outputs
OUTP?                    → Query output state
OUTP? (@1,2,3)           → Query all output states
                           Returns: 1,1,0
```

### Output Coupling (E36312A/E36313A)

```
OUTPut:COUPle:CHANnel:STATe {ON|OFF|1|0}
                         → Enable/disable output coupling
                           When ON, all outputs turn on/off together

OUTPut:COUPle:CHANnel:STATe?
                         → Query coupling state
```

### Delay on Enable

```
OUTPut:DELay:FALL <seconds>
                         → Set delay when output turns off

OUTPut:DELay:RISE <seconds>
                         → Set delay when output turns on

OUTPut:DELay:FALL?       → Query fall delay
OUTPut:DELay:RISE?       → Query rise delay
```

---

## Operating Mode Query

### CV/CC Status

The status can be determined from the Questionable Status register:

```
STATus:QUEStionable:INSTrument:ISUMmary<n>:CONDition?
                         → Query condition register for output n
                           Bit 0: CV mode (1 = in CV)
                           Bit 1: CC mode (1 = in CC)
                           Bit 9: Unregulated
```

**Alternative (legacy E363xA):**
```
STATus:QUEStionable:CONDition?
                         → Bit 0: Output 1 in CC
                         → Bit 1: Output 2 in CC (if applicable)
                         → Bit 2: Output 3 in CC (if applicable)
```

---

## Voltage/Current Range (Dual-Range Models)

E3632A, E3633A, E3634A have selectable voltage/current ranges:

```
[SOURce:]VOLTage:RANGe {P15V|P30V}
                         → E3632A: Select 15V/7A or 30V/4A range

[SOURce:]VOLTage:RANGe {P8V|P20V}
                         → E3633A: Select 8V/20A or 20V/10A range

[SOURce:]VOLTage:RANGe {P25V|P50V}
                         → E3634A: Select 25V/7A or 50V/4A range

[SOURce:]VOLTage:RANGe?  → Query current range setting
```

---

## Sense Mode (Remote Sensing)

For 4-wire voltage sensing at the load:

```
[SOURce:]VOLTage:SENSe:SOURce {INTernal|EXTernal}
                         → Select internal or external (remote) sensing

[SOURce:]VOLTage:SENSe:SOURce?
                         → Query sense source
```

When EXTernal: Use rear-panel sense terminals for accurate voltage regulation at load.

---

## Trigger System

### Trigger Source

```
TRIGger[:SEQuence]:SOURce {IMMediate|BUS}
                         → Set trigger source
                           IMMediate: Immediate trigger
                           BUS: Software trigger (*TRG or TRIGger)

TRIGger[:SEQuence]:SOURce?
                         → Query trigger source
```

### Trigger Delay

```
TRIGger[:SEQuence]:DELay <seconds>
                         → Set trigger delay (0 to 3600 seconds)

TRIGger[:SEQuence]:DELay?
                         → Query trigger delay
```

### Initiate and Trigger

```
INITiate[:IMMediate]     → Initiate trigger system

*TRG                     → Execute trigger (when source is BUS)

TRIGger[:SEQuence][:IMMediate]
                         → Execute trigger immediately
```

### Triggered Operation Example

```
VOLT 5.0                 → Set immediate voltage to 5V
VOLT:TRIG 12.0           → Set triggered voltage to 12V
TRIG:SOUR BUS            → Set trigger source to BUS
OUTP ON                  → Enable output (now at 5V)
INIT                     → Arm trigger system
*TRG                     → Trigger - voltage steps to 12V
```

---

## System Commands

### Error Query

```
SYSTem:ERRor[:NEXT]?     → Query and clear oldest error
                           Returns: <error_code>,"<error_message>"
                           +0,"No error" when queue empty
```

### Version Query

```
SYSTem:VERSion?          → Query SCPI version
                           Returns: 1999.0 (or similar)
```

### Remote/Local Control

```
SYSTem:REMote            → Place in remote mode (front panel locked)

SYSTem:LOCal             → Return to local mode (front panel unlocked)

SYSTem:RWLock            → Remote with lock (front panel fully locked)
```

### Preset

```
SYSTem:PRESet            → Return to *RST values but keep output off
```

---

## Display Commands

```
DISPlay[:WINDow]:TEXT[:DATA] "<message>"
                         → Display message on front panel (up to 12 chars)

DISPlay[:WINDow]:TEXT:CLEar
                         → Clear user message

DISPlay[:WINDow]:STATe {ON|OFF|1|0}
                         → Turn display on/off
```

---

## Apply Command (Shortcut)

The APPLY command sets voltage and current in one command:

```
APPLy {<voltage>|DEFault|MINimum|MAXimum}[,{<current>|DEFault|MINimum|MAXimum}]
                         → Set voltage and current on selected output

APPLy?                   → Query voltage and current settings
                           Returns: "<voltage>,<current>"

APPLy? (@<list>)         → Query settings for specific outputs
```

**Examples:**
```
APPL 12.0,1.5            → Set 12V, 1.5A limit on selected output
APPL 5.0,2.0,(@1)        → Set output 1 to 5V, 2A
APPL?                    → Returns: +1.20000E+01,+1.50000E+00
```

---

## Status System

### Status Byte Register (*STB?)

| Bit | Value | Name | Description |
|-----|-------|------|-------------|
| 0 | 1 | — | Not used |
| 1 | 2 | — | Not used |
| 2 | 4 | ERAV | Error available |
| 3 | 8 | QUES | Questionable status summary |
| 4 | 16 | MAV | Message available |
| 5 | 32 | ESB | Standard event status summary |
| 6 | 64 | RQS/MSS | Request for service |
| 7 | 128 | OPER | Operation status summary |

### Questionable Status Register

```
STATus:QUEStionable:CONDition?
                         → Query condition (does not clear)

STATus:QUEStionable[:EVENt]?
                         → Query and clear event register

STATus:QUEStionable:ENABle <mask>
                         → Set enable mask

STATus:QUEStionable:ENABle?
                         → Query enable mask
```

---

## Data Log (E36312A/E36313A)

The modern E3631xA series supports data logging:

```
SENSe:DLOG:FUNCtion:VOLTage {ON|OFF}
                         → Include voltage in data log

SENSe:DLOG:FUNCtion:CURRent {ON|OFF}
                         → Include current in data log

SENSe:DLOG:PERiod <seconds>
                         → Set logging interval (minimum 0.01s)

SENSe:DLOG:TIME <seconds>
                         → Set total logging duration

TRIGger:DLOG:SOURce {IMMediate|BUS}
                         → Set data log trigger source

INITiate:DLOG            → Start data logging

FETCh:DLOG?              → Retrieve logged data

ABORt:DLOG               → Stop data logging
```

---

## Programming Examples

### Basic Output Setup

```
*RST                     ; Reset to defaults
INST:SEL OUTP1           ; Select output 1
VOLT 5.0                 ; Set 5V
CURR 1.0                 ; Set 1A limit
OUTP ON                  ; Enable output
MEAS:VOLT?               ; Read actual voltage
MEAS:CURR?               ; Read actual current
```

### Multi-Output Configuration (E36312A)

```
*RST                     ; Reset
VOLT 3.3,(@1)            ; Output 1: 3.3V
VOLT 5.0,(@2)            ; Output 2: 5V
VOLT 12.0,(@3)           ; Output 3: 12V
CURR 2.0,(@1,2,3)        ; All outputs: 2A limit
OUTP ON,(@1,2,3)         ; Enable all outputs
MEAS:VOLT? (@1,2,3)      ; Measure all voltages
```

### Protection Setup

```
VOLT:PROT 15.0           ; Set OVP to 15V
VOLT:PROT:STAT ON        ; Enable OVP
CURR:PROT:STAT ON        ; Enable OCP
CURR:PROT:DEL 0.1        ; 100ms OCP delay
OUTP ON                  ; Enable output
; ...later...
VOLT:PROT:TRIP?          ; Check if OVP tripped
CURR:PROT:TRIP?          ; Check if OCP tripped
VOLT:PROT:CLE            ; Clear OVP trip
CURR:PROT:CLE            ; Clear OCP trip
```

### Triggered Step Change

```
VOLT 0                   ; Start at 0V
VOLT:TRIG 12.0           ; Target voltage: 12V
TRIG:SOUR BUS            ; Software trigger
OUTP ON                  ; Output enabled at 0V
INIT                     ; Arm trigger
*TRG                     ; Trigger - steps to 12V
```

---

## Notes

1. **Command Termination**: LF (`\n`) or CR+LF. Responses terminated with LF.

2. **Numeric Format**: Scientific notation (e.g., `+1.20000E+01`). Can send as plain numbers.

3. **Output Coupling**: When enabled, all outputs turn on/off together but can have individual voltage/current settings.

4. **Protection Clearing**: After OVP/OCP trip, must clear protection and re-enable output.

5. **Remote Sensing**: Connect sense terminals to load for accurate voltage regulation. Compensates for lead voltage drop.

6. **Settling Time**: Allow 50-100ms for output to settle after voltage/current changes.

7. **Legacy vs Modern**: E3631A uses aliases (P6V, P25V, N25V); E3631xA uses OUTP1, OUTP2, OUTP3.

8. **GPIB Address**: Default is usually 5. Configure via front panel or `SYSTem:COMMunicate:GPIB:ADDRess`.
