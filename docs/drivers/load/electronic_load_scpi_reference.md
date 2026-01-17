# DC Electronic Load SCPI Command Reference

> Comprehensive SCPI command reference for programmable DC electronic loads
> Sources: Rigol, Siglent, BK Precision, Keysight, ITECH, Chroma, Magna-Power, GW Instek, Kikusui, Array, AMREL

---

## Instrument Coverage

### Entry Level ($200-$600)
| Vendor | Series | Power Range | Interfaces | Notes |
|--------|--------|-------------|------------|-------|
| Rigol | DL3021/DL3031/DL3021A/DL3031A | 200-350W | USB, LAN, RS232 | Port 5555 |
| Siglent | SDL1020X/SDL1030X/SDL1020X-E/SDL1030X-E | 200-300W | USB, LAN | Port 5025 |
| BK Precision | 8500 series (8500, 8502, 8510, 8512, 8514, 8518, 8520, 8522, 8524, 8526) | 150-600W | USB, RS232, GPIB |  |
| Array | 3710A/3711A/3720A/3721A/3722A | 150-400W | USB, RS232 |  |
| Array | 372x (3720, 3721, 3722) | 175-350W | RS232, USB |  |
| GW Instek | PEL-300/PEL-500 | 300-500W | USB, RS232 |  |
| ITECH | IT8500+ series | 150-350W | USB, RS232, GPIB |  |

### Mid-Range ($600-$2000)
| Vendor | Series | Power Range | Interfaces | Notes |
|--------|--------|-------------|------------|-------|
| BK Precision | 8600 series (8600, 8601, 8602, 8610, 8612, 8614, 8616) | 150-750W | USB, RS232, GPIB | High slew rate |
| GW Instek | PEL-2000A series | 350-1050W | USB, RS232, LAN, GPIB |  |
| GW Instek | PEL-3000/3000E/3000H | 350-1050W | USB, RS232, LAN, GPIB |  |
| ITECH | IT8800 series (IT8811-IT8818) | 150-1200W | USB, RS232, GPIB, LAN |  |
| Array | 375XA/376XA | 150-600W | USB, RS232, GPIB |  |
| Kikusui | PLZ-4W series (PLZ164W-PLZ2004WH) | 165-2000W | USB, RS232, GPIB, LAN |  |
| Keysight | EL34243A | 350W | USB, LAN, GPIB | Bench |

### Professional ($2000-$10000+)
| Vendor | Series | Power Range | Interfaces | Notes |
|--------|--------|-------------|------------|-------|
| Keysight | N3300A + modules (N3302A-N3307A) | 150-600W/slot | GPIB, RS232, LAN | Modular mainframe |
| Chroma | 63600 series (63600-2 to 63640-150-60) | 200-6000W | USB, GPIB, RS232, LAN | Modular |
| Chroma | 63200A series | 2.6-52kW | USB, GPIB, LAN | High power |
| Kikusui | PLZ-5W series (PLZ205W-PLZ1205W) | 200-1200W | USB, RS232, GPIB, LAN |  |
| Magna-Power | ARx/WRx/ALx series | 1-100+ kW | RS232, USB, GPIB, LAN |  |
| AMREL | PLA/PLW series | 1.2-250 kW | GPIB, RS232, LAN, USB |  |
| NH Research | 4700 series | 1.2-1200 kW | GPIB, LAN |  |

---

## Operating Modes

All DC electronic loads support these fundamental modes:

| Mode | Abbreviation | Description | Regulation |
|------|--------------|-------------|------------|
| Constant Current | CC | Sinks fixed current regardless of voltage | I = setpoint |
| Constant Voltage | CV | Maintains fixed voltage at input terminals | V = setpoint |
| Constant Resistance | CR | Emulates fixed resistance (V/I = R) | R = setpoint |
| Constant Power | CP | Dissipates fixed power (V×I = P) | P = setpoint |

### Extended Modes (vendor-dependent)
| Mode | Description | Vendors |
|------|-------------|---------|
| Dynamic/Transient | Switches between two levels | All |
| List/Sequence | Steps through programmed values | All |
| Battery Test | Discharge with cutoff voltage | Rigol, Siglent, BK, ITECH, Chroma |
| LED Test | CV with current limit for LED drivers | Siglent, Rigol, BK |
| Short Circuit | Simulates short (max current) | Siglent, BK, Chroma |
| OCP Test | Tests overcurrent protection trip | Chroma, Keysight |
| CR+CC | Combined CR with CC limit | Chroma |
| CV+CC | Combined CV with CC limit | Common |

---

## SCPI Command Patterns by Subsystem

### IEEE 488.2 Common Commands (Universal)

```
*IDN?                    Query identification (manufacturer,model,serial,firmware)
*RST                     Reset to default state
*CLS                     Clear status registers and error queue
*OPC                     Set OPC bit when operations complete
*OPC?                    Query operation complete (returns 1)
*ESE <mask>              Set event status enable register
*ESE?                    Query event status enable register
*ESR?                    Query and clear event status register
*SRE <mask>              Set service request enable register
*SRE?                    Query service request enable register
*STB?                    Query status byte
*SAV <n>                 Save state to memory location n
*RCL <n>                 Recall state from memory location n
*TRG                     Software trigger
*WAI                     Wait for pending operations
*TST?                    Self-test (0=pass)
```

---

### INPut Subsystem (Load On/Off Control)

The INPut subsystem controls the load's input state (whether it's actively sinking current).

#### Standard Commands
```
INPut[:STATe] {ON|OFF|1|0}       Enable/disable load input
INPut[:STATe]?                    Query input state
INPut:SHORt[:STATe] {ON|OFF}     Enable short-circuit mode
INPut:SHORt[:STATe]?             Query short state
```

#### Vendor Variations
| Command | Rigol | Siglent | BK | ITECH | Keysight | Magna-Power |
|---------|-------|---------|-----|-------|----------|-------------|
| Input on | `:INP ON` | `:INP ON` | `INP ON` | `INP ON` | `INP ON` | `INP ON` or `INP:START` |
| Input off | `:INP OFF` | `:INP OFF` | `INP OFF` | `INP OFF` | `INP OFF` | `INP OFF` or `INP:STOP` |
| Query | `:INP?` | `:INP?` | `INP?` | `INP?` | `INP?` | `INP?` |
| Short on | `:INP:SHOR ON` | `:SOUR:SHORt ON` | `INP:SHOR ON` | `INP:SHOR ON` | N/A | N/A |

#### Magna-Power Specific
```
INPut:START                      Activates input (mirrors Start button)
INPut:STOP                       Deactivates input (mirrors Stop button)
INPut:PROTection:CLEar           Clears fault latches
INPut:LATCh[:STATe] {ON|OFF}     Enable/disable fault latching
```

---

### SOURce Subsystem (Mode and Setpoint Control)

#### Mode Selection

**Standard Pattern:**
```
[SOURce:]FUNCtion[:MODE] {CURRent|VOLTage|RESistance|POWer}
[SOURce:]FUNCtion[:MODE]?
```

**Vendor Variations:**
| Vendor | CC Mode | CV Mode | CR Mode | CP Mode |
|--------|---------|---------|---------|---------|
| Rigol | `:SOUR:FUNC CURR` | `:SOUR:FUNC VOLT` | `:SOUR:FUNC RES` | `:SOUR:FUNC POW` |
| Siglent | `:SOUR:FUNC CURR` | `:SOUR:FUNC VOLT` | `:SOUR:FUNC RES` | `:SOUR:FUNC POW` |
| BK 8600 | `MODE:CURR` | `MODE:VOLT` | `MODE:RES` | `MODE:POW` |
| ITECH | `FUNC CURR` | `FUNC VOLT` | `FUNC RES` | `FUNC POW` |
| Keysight | `FUNC CURR` | `FUNC VOLT` | `FUNC RES` | N/A (no CP) |
| Magna-Power | Uses `CONF:CONT <n>` (1=CC, 2=CV, 3=CR, 4=CP) | | | |
| Chroma | `MODE CCL` / `MODE CCH` | `MODE CVL` / `MODE CVH` | `MODE CRL` / `MODE CRH` | `MODE CPL` / `MODE CPH` |

---

### SOURce:CURRent Subsystem (CC Mode)

#### Setting Current Level
```
[SOURce:]CURRent[:LEVel][:IMMediate][:AMPLitude] <current>
[SOURce:]CURRent[:LEVel][:IMMediate][:AMPLitude]? [MINimum|MAXimum]
```

**Simplified forms:**
| Vendor | Set Current | Query Current |
|--------|-------------|---------------|
| Rigol | `:SOUR:CURR 2.5` | `:SOUR:CURR?` |
| Siglent | `:SOUR:CURR:LEV:IMM 2.5` | `:SOUR:CURR:LEV:IMM?` |
| BK | `CURR 2.5` | `CURR?` |
| ITECH | `CURR 2.5` | `CURR?` |
| Keysight | `CURR 2.5` | `CURR?` |
| Magna-Power | `CURR 2.5` | `CURR?` |

#### Current Range
```
[SOURce:]CURRent:RANGe {<value>|MINimum|MAXimum|AUTO}
[SOURce:]CURRent:RANGe?
[SOURce:]CURRent:RANGe:AUTO {ON|OFF}
```

#### Current Slew Rate
```
[SOURce:]CURRent:SLEW[:BOTH] <rate>              Rate in A/s or A/µs
[SOURce:]CURRent:SLEW:RISe <rate>                Rising slew rate
[SOURce:]CURRent:SLEW:FALL <rate>                Falling slew rate
[SOURce:]CURRent:SLEW?
```

**Slew rate units vary by vendor:**
- Rigol: A/µs (e.g., 0.001 to 2.5 A/µs)
- Siglent: A/µs
- BK 8600: A/µs
- Magna-Power: A/ms
- Keysight: A/s

#### Current Protection (OCP)
```
[SOURce:]CURRent:PROTection[:LEVel] <current>    OCP threshold
[SOURce:]CURRent:PROTection:STATe {ON|OFF}       Enable OCP
[SOURce:]CURRent:PROTection:DELay <time>         OCP delay
[SOURce:]CURRent:PROTection:TRIPped?             Query if tripped
[SOURce:]CURRent:PROTection:CLEar                Clear OCP trip
```

---

### SOURce:VOLTage Subsystem (CV Mode)

#### Setting Voltage Level
```
[SOURce:]VOLTage[:LEVel][:IMMediate][:AMPLitude] <voltage>
[SOURce:]VOLTage[:LEVel][:IMMediate][:AMPLitude]? [MINimum|MAXimum]
```

#### Voltage Range
```
[SOURce:]VOLTage:RANGe {<value>|MINimum|MAXimum|AUTO|HIGH|LOW}
[SOURce:]VOLTage:RANGe?
```

#### Voltage Slew Rate
```
[SOURce:]VOLTage:SLEW[:BOTH] <rate>
[SOURce:]VOLTage:SLEW:RISe <rate>
[SOURce:]VOLTage:SLEW:FALL <rate>
```

#### Voltage Protection (OVP/UVP)
```
[SOURce:]VOLTage:PROTection[:LEVel] <voltage>    OVP threshold
[SOURce:]VOLTage:PROTection:STATe {ON|OFF}
[SOURce:]VOLTage:PROTection:OVER <voltage>       Over-voltage (Magna-Power)
[SOURce:]VOLTage:PROTection:UNDer <voltage>      Under-voltage
```

#### Current Limit in CV Mode
```
[SOURce:]VOLTage:LIMit:CURRent <current>         Max current in CV mode
[SOURce:]VOLTage:ILIMit <current>                Alternative form
```

---

### SOURce:RESistance Subsystem (CR Mode)

```
[SOURce:]RESistance[:LEVel][:IMMediate][:AMPLitude] <ohms>
[SOURce:]RESistance[:LEVel][:IMMediate][:AMPLitude]?
[SOURce:]RESistance:RANGe {<value>|HIGH|MIDDle|LOW}
[SOURce:]RESistance:SLEW[:BOTH] <rate>           Ohms/s or Ohms/ms
```

---

### SOURce:POWer Subsystem (CP Mode)

```
[SOURce:]POWer[:LEVel][:IMMediate][:AMPLitude] <watts>
[SOURce:]POWer[:LEVel][:IMMediate][:AMPLitude]?
[SOURce:]POWer:PROTection[:LEVel] <watts>        OPP threshold
[SOURce:]POWer:PROTection:STATe {ON|OFF}
[SOURce:]POWer:SLEW[:BOTH] <rate>                W/s or W/ms
```

---

### MEASure Subsystem (Measurements)

#### Immediate Measurements
```
MEASure[:SCALar]:VOLTage[:DC]?                   Measure input voltage
MEASure[:SCALar]:CURRent[:DC]?                   Measure input current
MEASure[:SCALar]:POWer[:DC]?                     Measure dissipated power
MEASure[:SCALar]:RESistance[:DC]?                Calculate resistance (V/I)
MEASure:ALL[:DC]?                                All measurements (vendor-specific format)
```

**Return format varies:**
| Vendor | MEASure:ALL? Response |
|--------|----------------------|
| Rigol | `<voltage>,<current>,<power>,<resistance>` |
| Siglent | Not available (query individually) |
| BK | `<voltage>,<current>,<power>` |
| Magna-Power | `<current>,<voltage>,<power>,<resistance>` |

#### Fetch (last reading without new acquisition)
```
FETCh[:SCALar]:VOLTage[:DC]?
FETCh[:SCALar]:CURRent[:DC]?
FETCh[:SCALar]:POWer[:DC]?
```

---

### TRANsient Subsystem (Dynamic Loading)

Dynamic mode switches the load between two levels at a specified rate.

#### Mode Selection
```
[SOURce:]CURRent:TRANsient:MODE {CONTinuous|PULSe|TOGGle}
[SOURce:]VOLTage:TRANsient:MODE {CONTinuous|PULSe|TOGGle}
```

- **CONTinuous**: Repeating A→B→A→B...
- **PULSe**: Single A→B→A on trigger
- **TOGGle**: Alternates on each trigger

#### Level Settings
```
[SOURce:]CURRent:TRANsient:ALEVel <current>      Level A (low)
[SOURce:]CURRent:TRANsient:BLEVel <current>      Level B (high)
[SOURce:]CURRent:TRANsient:AWIDth <time>         Time at level A
[SOURce:]CURRent:TRANsient:BWIDth <time>         Time at level B
```

**Alternative naming (Chroma, ITECH):**
```
CURRent:DYNamic:L1 <current>                     Level 1 (low)
CURRent:DYNamic:L2 <current>                     Level 2 (high)
CURRent:DYNamic:T1 <time>                        Time at level 1
CURRent:DYNamic:T2 <time>                        Time at level 2
CURRent:DYNamic:RISE <time>                      Rise time (slew)
CURRent:DYNamic:FALL <time>                      Fall time (slew)
```

#### Transient Enable
```
[SOURce:]TRANsient[:STATe] {ON|OFF}
[SOURce:]TRANsient[:STATe]?
```

---

### LIST Subsystem (Sequence Mode)

List mode executes a programmed sequence of setpoints.

#### List Configuration
```
LIST:COUNt <n>                                   Number of loops (0 or INF = infinite)
LIST:COUNt?
LIST:STEP <n>                                    Number of steps in list
LIST:STEP?
LIST:MODE {CC|CV|CR|CP|CURRent|VOLTage|RESistance|POWer}
```

#### Step Programming
**Rigol/Siglent style (individual step addressing):**
```
LIST:CURRent <step>,<current>                    Set current for step
LIST:VOLTage <step>,<voltage>                    Set voltage for step
LIST:RESistance <step>,<resistance>              Set resistance for step
LIST:POWer <step>,<power>                        Set power for step
LIST:WIDth <step>,<time>                         Set duration for step
LIST:SLEW <step>,<slew>                          Set slew for step
```

**BK/Keysight style (data arrays):**
```
LIST:CURRent <val1>,<val2>,<val3>...             Array of current values
LIST:VOLTage <val1>,<val2>,...                   Array of voltage values
LIST:DWELl <t1>,<t2>,<t3>...                     Array of dwell times
```

#### List Execution
```
LIST:SAVe <n>                                    Save list to memory slot
LIST:RECall <n>                                  Load list from memory slot
INITiate[:IMMediate]                             Start list execution
ABORt                                            Stop list execution
```

---

### TRIGger Subsystem

```
TRIGger[:SEQuence]:SOURce {IMMediate|EXTernal|BUS|TIMer|MANual}
TRIGger[:SEQuence]:SOURce?
TRIGger[:SEQuence]:DELay <time>                  Trigger delay
TRIGger[:SEQuence]:DELay?
TRIGger[:SEQuence]:TIMer <period>                Timer trigger period
TRIGger[:SEQuence]:TIMer?
TRIGger[:SEQuence]:COUNt <n>                     Number of triggers
TRIGger[:SEQuence]:COUNt?

INITiate[:IMMediate]                             Arm trigger system
*TRG                                             Software trigger
ABORt                                            Abort triggered operation
```

---

### Battery Test Mode

**Rigol DL3000:**
```
:SOURce:BATTery:MODE {CC|CR|CP}                  Discharge mode
:SOURce:BATTery:CURRent <current>                Discharge current (CC)
:SOURce:BATTery:RESistance <resistance>          Discharge resistance (CR)
:SOURce:BATTery:POWer <power>                    Discharge power (CP)
:SOURce:BATTery:VOLTage <voltage>                Cutoff voltage
:SOURce:BATTery:TIMEout <seconds>                Maximum discharge time
:SOURce:BATTery:CAPacity?                        Query accumulated Ah
:SOURce:BATTery:DISCharge:TIME?                  Query discharge time
:SOURce:BATTery[:STATe] {ON|OFF}                 Enable/disable
```

**Siglent SDL1000X:**
```
:SOURce:BATTery:LEVel <current>                  Discharge current
:SOURce:BATTery:VOLTage <voltage>                Stop voltage
:SOURce:BATTery:CAP <Ah>                         Stop capacity
:SOURce:BATTery:TIMer <seconds>                  Stop time
:SOURce:BATTery:AH?                              Query Ah consumed
:SOURce:BATTery:WH?                              Query Wh consumed
:SOURce:BATTery:RUNTime?                         Query elapsed time
```

**ITECH IT8800:**
```
BATT:MODE {CC|CV|CP|CR}
BATT:CURR <current>
BATT:VOLT <voltage>                              Stop voltage
BATT:CAP <Ah>                                    Stop capacity
BATT:TIMEr <time>                                Stop time
BATT:MEAS:CAP?                                   Query Ah
BATT:MEAS:WH?                                    Query Wh
BATT:MEAS:TIME?                                  Query time
```

---

### LED Test Mode

**Siglent SDL1000X:**
```
:SOURce:LED:MODE {CC|CV|CR|CP}
:SOURce:LED:VD <voltage>                         LED Vf (forward voltage)
:SOURce:LED:RD <resistance>                      LED dynamic resistance
:SOURce:LED:IAuto {ON|OFF}                       Auto current ranging
:SOURce:LED[:STATe] {ON|OFF}
```

**Rigol DL3000:**
```
:SOURce:LED:MODE {CC|CV|CR}
:SOURce:LED:VD <voltage>
:SOURce:LED:RD <resistance>
:SOURce:LED:CURRent <current>
:SOURce:LED[:STATe] {ON|OFF}
```

---

### SYSTem Subsystem

```
SYSTem:VERSion?                                  SCPI version (e.g., "1999.0")
SYSTem:ERRor[:NEXT]?                             Query error queue
SYSTem:ERRor:COUNt?                              Number of queued errors
SYSTem:ERRor:CLEar                               Clear error queue

SYSTem:BEEPer[:STATe] {ON|OFF}                   Enable/disable beeper
SYSTem:BEEPer:IMMediate                          Beep once

SYSTem:LOCal                                     Return to local (front panel) control
SYSTem:REMote                                    Enter remote control mode
SYSTem:RWLock                                    Remote with local lockout
SYSTem:KLOCk {ON|OFF}                            Lock/unlock front panel keys

SYSTem:PON:STATe {RST|RCL0|SAV0}                 Power-on state
```

### Network Configuration
```
SYSTem:COMMunicate:LAN:IPADdress <ip>
SYSTem:COMMunicate:LAN:SMASk <mask>
SYSTem:COMMunicate:LAN:GATeway <gateway>
SYSTem:COMMunicate:LAN:DHCP {ON|OFF}
SYSTem:COMMunicate:LAN:MAC?
SYSTem:COMMunicate:LAN:APPLy                     Apply network settings

SYSTem:COMMunicate:GPIB:ADDRess <1-30>
SYSTem:COMMunicate:SERial:BAUD {4800|9600|19200|38400|57600|115200}
```

---

### STATus Subsystem

```
STATus:QUEStionable[:EVENt]?                     Query questionable status
STATus:QUEStionable:CONDition?                   Query condition register
STATus:QUEStionable:ENABle <mask>                Set enable mask
STATus:OPERation[:EVENt]?                        Query operation status
STATus:OPERation:CONDition?
STATus:OPERation:ENABle <mask>
STATus:PRESet                                    Reset status registers
```

**Common Questionable Status Bits:**
| Bit | Value | Meaning |
|-----|-------|---------|
| 0 | 1 | Over voltage |
| 1 | 2 | Over current |
| 2 | 4 | Over power |
| 3 | 8 | Over temperature |
| 4 | 16 | Reverse voltage |
| 5 | 32 | Under voltage |
| 9 | 512 | CC/CV mode indicator |

---

### CONFigure Subsystem (Magna-Power specific)

```
CONFigure:CONTrol <n>                            Set control mode
                                                 1=CC, 2=CV, 3=CR, 4=CP, 5=CC+CV, 6=CC+CR
CONFigure:LOCK {ON|OFF}                          Front panel lock
CONFigure:SENSe {LOCal|REMote|0|1}               Voltage sense location
CONFigure:SOURce <n>                             Setpoint source
                                                 0=local, 1=function gen, 2=external analog
CONFigure:RANGe {LOW|HIGH|0|1}                   Power range selection
```

---

### Chroma-Specific Commands

```
MODE {CCL|CCH|CVL|CVH|CRL|CRH|CPL|CPH}           Set mode with range
                                                 L=Low range, H=High range

CURR:STAT:L1 <current>                           Static CC level 1
CURR:STAT:L2 <current>                           Static CC level 2
CURR:STAT:RISE <time>                            Static rise time
CURR:STAT:FALL <time>                            Static fall time

VOLT:ON <voltage>                                Von (turn-on voltage)
VOLT:OFF <voltage>                               Voff (turn-off voltage)

LOAD:SHOR {ON|OFF}                               Short circuit mode
SPEC:TEST:ITEM {OCP|OPP|BATT}                    Special test mode
```

---

## Command Abstraction Summary

### Core Interface (All Loads)
```typescript
interface ElectronicLoad {
  // Identity
  idn(): string;
  reset(): void;

  // Input control
  inputOn(): void;
  inputOff(): void;
  inputState(): boolean;

  // Mode
  setMode(mode: 'CC' | 'CV' | 'CR' | 'CP'): void;
  getMode(): string;

  // CC mode
  setCurrent(amps: number): void;
  getCurrent(): number;

  // CV mode
  setVoltage(volts: number): void;
  getVoltage(): number;

  // CR mode
  setResistance(ohms: number): void;
  getResistance(): number;

  // CP mode
  setPower(watts: number): void;
  getPower(): number;

  // Measurements
  measureVoltage(): number;
  measureCurrent(): number;
  measurePower(): number;
}
```

### Command Translation Table
| Method | Rigol | Siglent | BK 8600 | Keysight | Magna-Power |
|--------|-------|---------|---------|----------|-------------|
| `inputOn()` | `:INP ON` | `:INP ON` | `INP ON` | `INP ON` | `INP:START` |
| `inputOff()` | `:INP OFF` | `:INP OFF` | `INP OFF` | `INP OFF` | `INP:STOP` |
| `setMode('CC')` | `:SOUR:FUNC CURR` | `:SOUR:FUNC CURR` | `MODE:CURR` | `FUNC CURR` | `CONF:CONT 1` |
| `setCurrent(2.5)` | `:SOUR:CURR 2.5` | `:SOUR:CURR:LEV:IMM 2.5` | `CURR 2.5` | `CURR 2.5` | `CURR 2.5` |
| `measureVoltage()` | `:MEAS:VOLT?` | `:MEAS:VOLT?` | `MEAS:VOLT?` | `MEAS:VOLT?` | `MEAS:VOLT?` |

---

## Documentation Sources

| Vendor | Series | Documentation |
|--------|--------|---------------|
| Rigol | DL3000 | [Programming Manual](https://www.batronix.com/files/Rigol/Elektronische-Lasten/DL3000/DL3000_ProgrammingManual_EN.pdf) |
| Siglent | SDL1000X | [Programming Guide](https://www.batronix.com/files/Siglent/Elektronische-Last/SDL1000X/SDL1000X-Programming_Guide.pdf) |
| BK Precision | 8600 | [Programming Manual](https://bkpmedia.s3.us-west-1.amazonaws.com/downloads/programming_manuals/en-us/8600_Series_programming_manual.pdf) |
| Keysight | N3300A | [Programming Guide](https://res.cloudinary.com/iwh/image/upload/q_auto,g_center/assets/1/7/Keysight_N3300A_programming_guide.pdf) |
| Keysight | EL34243A | [Programming Guide](https://www.keysight.com/us/en/assets/9923-02387/programming-guides/EL34243-90007-Programming-Guide.pdf) |
| ITECH | IT8500+ | [Programming Guide](https://www.welectron.com/mediafiles/guides/itech/ITECH_IT8500+_Programming-Guide.pdf) |
| ITECH | IT8800 | [ManualsLib](https://www.manualslib.com/manual/1954650/Itech-It8800-Series.html) |
| Chroma | 63600 | [Manual](https://assets.tequipment.net/assets/1/26/Chroma_63600_Series_-_Manual_V2.2.pdf) |
| Magna-Power | ARx | [SCPI Reference (HTML)](https://magna-power.com/assets/docs/html_arx/index-scpi.html) |
| Magna-Power | WRx | [SCPI Reference (HTML)](https://magna-power.com/assets/docs/html_wrx/index-scpi.html) |
| GW Instek | PEL-3000 | [Product Page](https://www.gwinstek.com/en-global/products/detail/PEL-3000) |
| Kikusui | PLZ-5W | [Communication Manual](https://manual.kikusui.co.jp/P/PLZ5W/IF/english/00-intro.html) |
| Array | 372x | [Circuit Specialists](https://www.circuitspecialists.com/images/ARRAY%20372x%20Series%20Electronic%20Load%20SCPI%20Programming%20Guide.pdf) |
| AMREL | PLA/PLW | [Operation Manual](https://www.prbx.com/wp-content/uploads/pimfiles/848/PLWLOAD_manual.pdf) |
