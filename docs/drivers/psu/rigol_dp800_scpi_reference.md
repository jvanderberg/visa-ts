# Rigol DP800 Series Power Supply SCPI Command Reference

> Driver abstraction reference extracted from DP800 Programming Guide (Dec 2015)
> Applicable models: DP832A/DP832, DP831A/DP831, DP821A/DP821, DP811A/DP811

## Model Specifications

| Model | Channels | CH1 | CH2 | CH3 | Total Power |
|-------|----------|-----|-----|-----|-------------|
| DP832A/DP832 | 3 | 30V/3A | 30V/3A | 5V/3A | 195W |
| DP831A/DP831 | 3 | 8V/5A | 30V/2A | -30V/2A | 160W |
| DP821A/DP821 | 2 | 60V/1A | 8V/10A | - | 140W |
| DP811A/DP811 | 1 | 20V/10A or 40V/5A | - | - | 200W |

**Resolution:** "A" models have higher resolution (5-digit voltage, 4-digit current)

**Features:**
- Remote sense terminals for voltage drop compensation
- OVP/OCP protection per channel
- Timer/Delayer for automated sequencing
- Track mode (symmetric voltage for op-amp supplies)
- Trigger input/output
- Analyzer and recorder functions

---

## Connection Methods

| Method | Port | Notes |
|--------|------|-------|
| USBTMC | USB Device | Requires NI-VISA or PyVISA |
| LAN (VXI-11) | Ethernet | Via NI-VISA |
| Raw Socket | 5555 | Direct TCP connection |
| RS-232 | DB9 | Command terminator: `\r\n` |
| GPIB | Via USB-GPIB adapter | Optional |

---

## Command Notation

- **Long form**: `VOLTage` 
- **Short form**: `VOLT` (uppercase portion required)
- Commands are case-insensitive
- `{CH1|CH2|CH3}` = choose one
- `<value>` = user-supplied parameter
- `[optional]` = can be omitted
- `[<n>]` = channel number (1, 2, or 3)
- Commands terminated with `\n` (USB/LAN) or `\r\n` (RS-232)

---

## IEEE 488.2 Common Commands

```
*IDN?                    → Query identification
                           Returns: RIGOL TECHNOLOGIES,DP832A,DP8A1234567890,00.01.14

*RST                     → Reset to factory defaults

*CLS                     → Clear status registers

*OPC                     → Set OPC bit when all pending operations complete
*OPC?                    → Returns 1 when all operations complete

*ESE <value>             → Set standard event enable register
*ESE?                    → Query standard event enable register

*ESR?                    → Query and clear standard event register

*SRE <value>             → Set service request enable register  
*SRE?                    → Query service request enable register

*STB?                    → Query status byte register

*SAV {1|2|3|4|5|6|7|8|9|10}  → Save state to memory location
*RCL {1|2|3|4|5|6|7|8|9|10}  → Recall state from memory location

*TRG                     → Trigger (same as :INITiate)

*WAI                     → Wait for pending operations to complete

*TST?                    → Self-test (returns 0 if passed)

*OPT?                    → Query installed options
```

---

## Quick Setup Command (`:APPLy`)

The `:APPLy` command provides the fastest way to configure a channel:

```
:APPLy {CH1|CH2|CH3}[,<voltage>[,<current>]]
:APPLy [<voltage>[,<current>]]
:APPLy? [CH1|CH2|CH3]
```

**Examples:**
```
:APPL CH1,12.0,1.5       → Set CH1 to 12V, 1.5A limit
:APPL CH2,5.0            → Set CH2 to 5V (current unchanged)
:APPL? CH1               → Returns: CH1:30V/3A,12.000,1.500
:APPL?                   → Returns current channel settings
```

**Voltage/Current Ranges by Model:**

| Model | Channel | Voltage Range | Current Range |
|-------|---------|---------------|---------------|
| DP832A | CH1/CH2 | 0-32V | 0-3.2A |
| DP832A | CH3 | 0-5.3V | 0-3.2A |
| DP831A | CH1 | 0-8.4V | 0-5.3A |
| DP831A | CH2 | 0-32V | 0-2.1A |
| DP831A | CH3 | 0 to -32V | 0-2.1A |
| DP821A | CH1 | 0-63V | 0-1.05A |
| DP821A | CH2 | 0-8.4V | 0-10.5A |

---

## Channel Selection (`:INSTrument`)

```
:INSTrument[:SELect] {CH1|CH2|CH3}   → Select channel by name
:INSTrument[:SELect]?                → Query selected channel (returns CH1/CH2/CH3)

:INSTrument:NSELect {1|2|3}          → Select channel by number
:INSTrument:NSELect?                 → Query selected channel (returns 1/2/3)

:INSTrument:COUPle[:TRIGger] {ALL|NONE}  → Couple all channels for triggering
:INSTrument:COUPle[:TRIGger]?
```

**Examples:**
```
:INST CH1                → Select CH1
:INST:NSEL 2             → Select CH2 by number
:INST?                   → Query current channel
```

---

## Voltage Commands (`:SOURce:VOLTage`)

```
[:SOURce[<n>]]:VOLTage[:LEVel][:IMMediate][:AMPLitude] {<voltage>|MINimum|MAXimum}
[:SOURce[<n>]]:VOLTage[:LEVel][:IMMediate][:AMPLitude]?

[:SOURce[<n>]]:VOLTage[:LEVel]:TRIGgered[:AMPLitude] {<voltage>|MINimum|MAXimum}
[:SOURce[<n>]]:VOLTage[:LEVel]:TRIGgered[:AMPLitude]?

[:SOURce[<n>]]:VOLTage[:LEVel][:IMMediate]:STEP[:INCRement] {<step>|DEFault}
[:SOURce[<n>]]:VOLTage[:LEVel][:IMMediate]:STEP[:INCRement]?
```

**Simplified forms:**
```
:SOUR1:VOLT 12.5         → Set CH1 voltage to 12.5V
:VOLT 5.0                → Set current channel to 5.0V
:SOUR2:VOLT?             → Query CH2 voltage setpoint
:VOLT:TRIG 10.0          → Set triggered voltage (applied on trigger)
```

---

## Current Commands (`:SOURce:CURRent`)

```
[:SOURce[<n>]]:CURRent[:LEVel][:IMMediate][:AMPLitude] {<current>|MINimum|MAXimum}
[:SOURce[<n>]]:CURRent[:LEVel][:IMMediate][:AMPLitude]?

[:SOURce[<n>]]:CURRent[:LEVel]:TRIGgered[:AMPLitude] {<current>|MINimum|MAXimum}
[:SOURce[<n>]]:CURRent[:LEVel]:TRIGgered[:AMPLitude]?

[:SOURce[<n>]]:CURRent[:LEVel][:IMMediate]:STEP[:INCRement] {<step>|DEFault}
[:SOURce[<n>]]:CURRent[:LEVel][:IMMediate]:STEP[:INCRement]?
```

**Simplified forms:**
```
:SOUR1:CURR 2.0          → Set CH1 current limit to 2.0A
:CURR 0.5                → Set current channel limit to 500mA
:SOUR2:CURR?             → Query CH2 current limit
```

---

## Measurement Commands (`:MEASure`)

```
:MEASure[:VOLTage][:DC]? [CH1|CH2|CH3]    → Measure actual voltage
:MEASure:CURRent[:DC]? [CH1|CH2|CH3]      → Measure actual current
:MEASure:POWEr[:DC]? [CH1|CH2|CH3]        → Measure actual power
:MEASure:ALL[:DC]? [CH1|CH2|CH3]          → Measure voltage, current, and power
```

**Examples:**
```
:MEAS? CH1               → Returns voltage (e.g., 12.0035)
:MEAS:CURR? CH1          → Returns current (e.g., 1.5023)
:MEAS:POWE? CH1          → Returns power (e.g., 18.0278)
:MEAS:ALL? CH1           → Returns all three: 12.0035,1.5023,18.0278
```

---

## Output Control (`:OUTPut`)

### Channel Output Enable
```
:OUTPut[:STATe] {ON|OFF}                  → Enable/disable current channel output
:OUTPut[:STATe]? [CH1|CH2|CH3]            → Query output state
```

**Examples:**
```
:OUTP ON                 → Turn on current channel
:OUTP OFF                → Turn off current channel
:OUTP? CH1               → Query CH1 state (returns ON or OFF)
```

### CV/CC Mode Query
```
:OUTPut:CVCC? [CH1|CH2|CH3]               → Query CV/CC mode
                                            Returns: CV, CC, or UR (unregulated)

:OUTPut:MODE? [CH1|CH2|CH3]               → Query output mode
                                            Returns: CV, CC, or UR
```

### Track Mode (Symmetric Voltage)
```
:OUTPut:TRACk[:STATe] {ON|OFF}            → Enable/disable track mode
:OUTPut:TRACk[:STATe]?                    → Query track state
```

Track mode links CH1 and CH2 voltages for symmetric supplies (e.g., ±15V for op-amps).

### Remote Sense
```
:OUTPut:SENSe {ON|OFF}                    → Enable/disable remote sense
:OUTPut:SENSe?                            → Query sense state
```

### Output Range (DP811 only)
```
:OUTPut:RANGe {P20V|P40V}                 → Select range (20V/10A or 40V/5A)
:OUTPut:RANGe?                            → Query current range
```

---

## Protection Commands (`:OUTPut:OVP` / `:OUTPut:OCP`)

### Over-Voltage Protection
```
:OUTPut:OVP[:STATe] {ON|OFF}              → Enable/disable OVP
:OUTPut:OVP[:STATe]?                      → Query OVP state

:OUTPut:OVP:VALue {<voltage>|MINimum|MAXimum}  → Set OVP threshold
:OUTPut:OVP:VALue? [MINimum|MAXimum]           → Query OVP threshold

:OUTPut:OVP:ALAR?                         → Query if OVP tripped (YES/NO)
:OUTPut:OVP:QUES?                         → Query OVP question status

:OUTPut:OVP:CLEar                         → Clear OVP tripped state
```

### Over-Current Protection
```
:OUTPut:OCP[:STATe] {ON|OFF}              → Enable/disable OCP
:OUTPut:OCP[:STATe]?                      → Query OCP state

:OUTPut:OCP:VALue {<current>|MINimum|MAXimum}  → Set OCP threshold
:OUTPut:OCP:VALue? [MINimum|MAXimum]           → Query OCP threshold

:OUTPut:OCP:ALAR?                         → Query if OCP tripped (YES/NO)
:OUTPut:OCP:QUES?                         → Query OCP question status

:OUTPut:OCP:CLEar                         → Clear OCP tripped state
```

### Source-Level Protection (Alternative)
```
[:SOURce[<n>]]:VOLTage:PROTection[:LEVel] {<value>|MINimum|MAXimum}
[:SOURce[<n>]]:VOLTage:PROTection:STATe {ON|OFF}
[:SOURce[<n>]]:VOLTage:PROTection:TRIPped?
[:SOURce[<n>]]:VOLTage:PROTection:CLEar

[:SOURce[<n>]]:CURRent:PROTection[:LEVel] {<value>|MINimum|MAXimum}
[:SOURce[<n>]]:CURRent:PROTection:STATe {ON|OFF}
[:SOURce[<n>]]:CURRent:PROTection:TRIPped?
[:SOURce[<n>]]:CURRent:PROTection:CLEar
```

---

## Timer Commands (`:TIMEr`)

The timer enables automated voltage/current sequencing with up to 2048 steps.

### Timer State
```
:TIMEr[:STATe] {ON|OFF}                   → Enable/disable timer
:TIMEr[:STATe]?                           → Query timer state
```

### Timer Configuration
```
:TIMEr:GROUPs {<groups>|MINimum|MAXimum}  → Set number of groups (1-2048)
:TIMEr:GROUPs?

:TIMEr:CYCLEs {N|I}[,<count>]             → Set cycles: N=finite, I=infinite
:TIMEr:CYCLEs?                              <count> = 1-99999

:TIMEr:ENDState {OFF|LAST}                → State when timer completes
:TIMEr:ENDState?                            OFF=output off, LAST=hold last value
```

### Timer Parameters
```
:TIMEr:PARAmeter <group>,<voltage>,<current>
:TIMEr:PARAmeter? <start_group>[,<count>]
```

**Example:**
```
:TIM:PARA 1,5.0,1.0      → Group 1: 5V, 1A
:TIM:PARA 2,10.0,0.5     → Group 2: 10V, 0.5A
:TIM:GROUPS 2            → Use 2 groups
:TIM:CYCLE N,10          → Run 10 cycles
:TIM:ENDS LAST           → Hold last value when done
:TIM ON                  → Start timer
```

### Timer Templates
```
:TIMEr:TEMPlet:SELect {SINE|PULSE|RAMP|STAIRUP|STAIRDN|STAIRU/D|EXPONENT|USER}
:TIMEr:TEMPlet:CONSTruct                  → Generate parameters from template
:TIMEr:TEMPlet:OBJect {V|C}               → Edit voltage or current
:TIMEr:TEMPlet:MAXValue <value>           → Maximum value
:TIMEr:TEMPlet:MINValue <value>           → Minimum value
:TIMEr:TEMPlet:POINTs <points>            → Number of points
:TIMEr:TEMPlet:INTErval <time>            → Time per point
:TIMEr:TEMPlet:INVErt {ON|OFF}            → Invert waveform
```

---

## Delay Output Commands (`:DELAY`)

Similar to timer but for on/off sequencing rather than voltage/current ramping.

```
:DELAY[:STATe] {ON|OFF}                   → Enable/disable delay output
:DELAY[:STATe]?

:DELAY:GROUPs <groups>                    → Number of groups (1-2048)
:DELAY:CYCLEs {N|I}[,<count>]             → Cycle count
:DELAY:ENDState {ON|OFF|LAST}             → End state

:DELAY:PARAmeter <group>,{ON|OFF},<time>  → Set group: state and duration
:DELAY:PARAmeter? <start>[,<count>]       → Query group parameters

:DELAY:STOP {NONE|<V|>V|<C|>C|<P|>P}[,<value>]  → Stop condition
```

---

## Trigger Commands (`:TRIGger`)

### Software Trigger
```
:INITiate                                 → Execute trigger (apply triggered values)
*TRG                                      → Same as :INITiate
```

### Trigger Input (External)
```
:TRIGger:IN[:ENABle] {ON|OFF}             → Enable trigger input
:TRIGger:IN:SOURce {D0|D1|D2|D3}          → Select digital input
:TRIGger:IN:TYPE {RISE|FALL|HIGH|LOW}     → Trigger edge/level
:TRIGger:IN:RESPonse {OUTPClose|OUTPOpen|OUTPToggle|NONE}
:TRIGger:IN:SENSitivity <time>            → Debounce time

:TRIGger:IN:CHTYpe {CH1|CH2|CH3}          → Channel affected by trigger
:TRIGger:IN:VOLTage <voltage>             → Voltage on trigger
:TRIGger:IN:CURRent <current>             → Current on trigger
:TRIGger:IN:IMMEdiate                     → Trigger now (software trigger)
```

### Trigger Output
```
:TRIGger:OUT[:ENABle] {ON|OFF}            → Enable trigger output
:TRIGger:OUT:SOURce {D0|D1|D2|D3}         → Select digital output
:TRIGger:OUT:CONDition {CC|CV|OT|OP|TM|DL|<V|>V|<C|>C|<P|>P}
:TRIGger:OUT:SIGNal {LEVEL|PULSE|SQUARE}  → Output signal type
:TRIGger:OUT:POLArity {POSitive|NEGative} → Signal polarity
:TRIGger:OUT:PERIod <time>                → Square wave period
:TRIGger:OUT:DUTY <percent>               → Square wave duty cycle
```

### Trigger Delay
```
:TRIGger[:SEQuence]:DELay <time>          → Delay before trigger executes
:TRIGger[:SEQuence]:SOURce {IMMediate|BUS} → Trigger source
```

---

## Monitor Commands (`:MONItor`)

Monitor output and trigger on conditions:

```
:MONItor[:STATe] {ON|OFF}                 → Enable/disable monitor
:MONItor[:STATe]?

:MONItor:VOLTage:CONDition {<|>}          → Voltage condition
:MONItor:VOLTage[:VALue] <voltage>        → Voltage threshold

:MONItor:CURRent:CONDition {<|>}          → Current condition  
:MONItor:CURRent[:VALue] <current>        → Current threshold

:MONItor:POWER:CONDition {<|>}            → Power condition
:MONItor:POWER[:VALue] <power>            → Power threshold

:MONItor:STOPway {OUTPut|BEEPer|OUTPut&BEEPer}  → Action on trigger
```

---

## System Commands (`:SYSTem`)

### General
```
:SYSTem:VERSion?                          → Query SCPI version
:SYSTem:ERRor?                            → Query error queue
                                            Returns: <error_code>,<error_string>
                                            0,"No error" when empty

:SYSTem:BEEPer[:STATe] {ON|OFF}           → Enable/disable beeper
:SYSTem:BEEPer:IMMediate                  → Beep once

:SYSTem:KLOCk {ON|OFF}                    → Lock/unlock front panel keys
:SYSTem:LOCal                             → Return to local mode (unlock)
:SYSTem:REMote                            → Enter remote mode
:SYSTem:RWLock                            → Remote with local lockout
```

### Power-On State
```
:SYSTem:POWEron {DEFault|LAST}            → Power-on state
:SYSTem:POWEron?
```

### Over-Temperature Protection
```
:SYSTem:OTP {ON|OFF}                      → Enable/disable OTP
:SYSTem:OTP?
```

### Display
```
:SYSTem:BRIGhtness {<value>|MINimum|MAXimum}  → Set brightness (0-100)
```

### Synchronous Output Control
```
:SYSTem:ONOFFSync {ON|OFF}                → All channels on/off together
:SYSTem:ONOFFSync?
```

### Track Mode Configuration
```
:SYSTem:TRACKMode {SYNC|INDEP}            → SYNC=linked, INDEP=independent
:SYSTem:TRACKMode?
```

### Self-Test
```
:SYSTem:SELF:TEST:BOARD?                  → Board self-test
:SYSTem:SELF:TEST:FAN?                    → Fan self-test
:SYSTem:SELF:TEST:TEMP?                   → Temperature sensor test
```

---

## Network Configuration (`:SYSTem:COMMunicate`)

### LAN Settings
```
:SYSTem:COMMunicate:LAN:IPADdress <ip>    → Set IP address
:SYSTem:COMMunicate:LAN:IPADdress?

:SYSTem:COMMunicate:LAN:SMASK <mask>      → Set subnet mask
:SYSTem:COMMunicate:LAN:SMASK?

:SYSTem:COMMunicate:LAN:GATEway <gateway> → Set gateway
:SYSTem:COMMunicate:LAN:GATEway?

:SYSTem:COMMunicate:LAN:DNS <dns>         → Set DNS server
:SYSTem:COMMunicate:LAN:DNS?

:SYSTem:COMMunicate:LAN:MAC?              → Query MAC address

:SYSTem:COMMunicate:LAN:DHCP[:STATe] {ON|OFF}    → Enable DHCP
:SYSTem:COMMunicate:LAN:AUTOip[:STATe] {ON|OFF}  → Enable Auto-IP
:SYSTem:COMMunicate:LAN:MANualip[:STATe] {ON|OFF} → Enable manual IP

:SYSTem:COMMunicate:LAN:APPLy             → Apply LAN settings
```

### RS-232 Settings
```
:SYSTem:COMMunicate:RS232:BAUD {4800|9600|19200|38400|57600|115200}
:SYSTem:COMMunicate:RS232:DATABit {6|7|8}
:SYSTem:COMMunicate:RS232:PARItybit {NONE|ODD|EVEN}
:SYSTem:COMMunicate:RS232:STOPBit {1|2}
:SYSTem:COMMunicate:RS232:FLOWCrl {NONE|XON/XOFF|RTS/CTS|DTR/DSR}
```

### GPIB Settings
```
:SYSTem:COMMunicate:GPIB:ADDRess {1-30}   → Set GPIB address
:SYSTem:COMMunicate:GPIB:ADDRess?
```

---

## Status Commands (`:STATus`)

### Questionable Status
```
:STATus:QUEStionable[:EVENt]?             → Query and clear questionable event
:STATus:QUEStionable:CONDition?           → Query questionable condition
:STATus:QUEStionable:ENABle <value>       → Set questionable enable mask
:STATus:QUEStionable:ENABle?
```

### Channel Questionable Status (Multi-channel models)
```
:STATus:QUEStionable:INSTrument[:EVENt]?
:STATus:QUEStionable:INSTrument:ENABle <value>

:STATus:QUEStionable:INSTrument:ISUMmary[<n>][:EVENt]?
:STATus:QUEStionable:INSTrument:ISUMmary[<n>]:COND?
:STATus:QUEStionable:INSTrument:ISUMmary[<n>]:ENABle <value>
```

**Channel Summary Register Bits:**
| Bit | Value | Meaning |
|-----|-------|---------|
| 0 | 1 | VOLTage - CC mode (voltage unregulated) |
| 1 | 2 | CURRent - CV mode (current unregulated) |
| 2 | 4 | OVP tripped |
| 3 | 8 | OCP tripped |

---

## Memory Commands

### Internal Memory
```
:MEMory[:STATe]:STORe {1-10}              → Store state to internal memory
:MEMory[:STATe]:LOAD {1-10}               → Load state from internal memory  
:MEMory[:STATe]:DELete {1-10}             → Delete stored state
:MEMory[:STATe]:VALid? {1-10}             → Check if location has valid data
:MEMory[:STATe]:LOCK {1-10},{ON|OFF}      → Lock/unlock memory location

*SAV {1-10}                               → Same as :MEMory:STORe
*RCL {1-10}                               → Same as :MEMory:LOAD
```

### External Memory (USB drive)
```
:MMEMory:CATalog? [<path>]                → List directory contents
:MMEMory:CDIRectory <path>                → Change directory
:MMEMory:MDIRectory <path>                → Make directory
:MMEMory:DELete <file>                    → Delete file
:MMEMory:DISK?                            → Query disk info

:MMEMory:STORe <filename>                 → Store state to file
:MMEMory:LOAD <filename>                  → Load state from file
```

---

## Recorder Commands (`:RECorder`)

```
:RECorder[:STATe] {ON|OFF}                → Enable/disable recorder
:RECorder:PERIod <seconds>                → Recording interval (1-99999s)
:RECorder:MEMory {1-10}                   → Record to internal memory
:RECorder:MMEMory <filename>              → Record to external file
:RECorder:DESTination?                    → Query recording destination
```

---

## Analyzer Commands (`:ANALyzer`)

Analyze recorded data:

```
:ANALyzer:MEMory {1-10}                   → Open internal record file
:ANALyzer:MMEMory <filename>              → Open external record file
:ANALyzer:FILE?                           → Query opened file

:ANALyzer:OBJect {V|C|P}                  → Select analysis object
:ANALyzer:STARTTime <time>                → Analysis start time
:ANALyzer:ENDTime <time>                  → Analysis end time
:ANALyzer:CURRTime <time>                 → Current cursor time

:ANALyzer:ANALyze                         → Execute analysis
:ANALyzer:RESult?                         → Query results (median, mode, avg, etc.)
:ANALyzer:VALue? <time>                   → Query V/I/P at specific time
```

---

## Display Commands (`:DISPlay`)

```
:DISPlay:MODE {NORMal|WAVE|DIAL|CLAS}     → Display mode
:DISPlay[:WINDow][:STATe] {ON|OFF}        → Screen on/off
:DISPlay[:WINDow]:TEXT[:DATA] <string>[,<x>,<y>]  → Display text
:DISPlay[:WINDow]:TEXT:CLEar              → Clear displayed text
```

---

## Preset Commands (`:PRESet`)

Configure custom presets:

```
:PRESet[:APPLy]                           → Apply current preset
:PRESet:KEY {Default|User1|User2|User3|User4}  → Select preset
:PRESet:USER[<n>]:SET:VOLTage <voltage>   → Set preset voltage
:PRESet:USER[<n>]:SET:CURRent <current>   → Set preset current
:PRESet:USER[<n>]:SET:OVP {ON|OFF}        → Set preset OVP state
:PRESet:USER[<n>]:SET:OCP {ON|OFF}        → Set preset OCP state
:PRESet:USER[<n>]:SET:TRACk {ON|OFF}      → Set preset track state
```

---

## Python Driver Example

```python
import socket
import time

class DP800:
    def __init__(self, ip, port=5555, timeout=5.0):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(timeout)
        self.sock.connect((ip, port))
    
    def write(self, cmd):
        self.sock.send((cmd + '\n').encode())
    
    def query(self, cmd):
        self.write(cmd)
        return self.sock.recv(4096).decode().strip()
    
    def close(self):
        self.sock.close()
    
    # Identification
    def idn(self):
        return self.query('*IDN?')
    
    def reset(self):
        self.write('*RST')
    
    # Channel selection
    def select_channel(self, ch):
        self.write(f':INST CH{ch}')
    
    # Quick setup
    def apply(self, ch, voltage, current):
        self.write(f':APPL CH{ch},{voltage},{current}')
    
    # Voltage
    def set_voltage(self, ch, voltage):
        self.write(f':SOUR{ch}:VOLT {voltage}')
    
    def get_voltage(self, ch):
        return float(self.query(f':SOUR{ch}:VOLT?'))
    
    def measure_voltage(self, ch):
        return float(self.query(f':MEAS:VOLT? CH{ch}'))
    
    # Current
    def set_current(self, ch, current):
        self.write(f':SOUR{ch}:CURR {current}')
    
    def get_current(self, ch):
        return float(self.query(f':SOUR{ch}:CURR?'))
    
    def measure_current(self, ch):
        return float(self.query(f':MEAS:CURR? CH{ch}'))
    
    # Power
    def measure_power(self, ch):
        return float(self.query(f':MEAS:POWE? CH{ch}'))
    
    # Measure all
    def measure_all(self, ch):
        result = self.query(f':MEAS:ALL? CH{ch}')
        v, i, p = result.split(',')
        return float(v), float(i), float(p)
    
    # Output control
    def output_on(self, ch):
        self.select_channel(ch)
        self.write(':OUTP ON')
    
    def output_off(self, ch):
        self.select_channel(ch)
        self.write(':OUTP OFF')
    
    def output_state(self, ch):
        return self.query(f':OUTP? CH{ch}') == 'ON'
    
    def all_outputs_off(self):
        for ch in [1, 2, 3]:
            try:
                self.output_off(ch)
            except:
                pass  # Channel may not exist
    
    # CV/CC mode
    def get_mode(self, ch):
        return self.query(f':OUTP:MODE? CH{ch}')  # CV, CC, or UR
    
    # Protection
    def set_ovp(self, ch, voltage, enable=True):
        self.select_channel(ch)
        self.write(f':OUTP:OVP:VAL {voltage}')
        self.write(f':OUTP:OVP {"ON" if enable else "OFF"}')
    
    def set_ocp(self, ch, current, enable=True):
        self.select_channel(ch)
        self.write(f':OUTP:OCP:VAL {current}')
        self.write(f':OUTP:OCP {"ON" if enable else "OFF"}')
    
    def clear_protection(self, ch):
        self.select_channel(ch)
        self.write(':OUTP:OVP:CLEAR')
        self.write(':OUTP:OCP:CLEAR')
    
    def ovp_tripped(self, ch):
        self.select_channel(ch)
        return self.query(':OUTP:OVP:ALAR?') == 'YES'
    
    def ocp_tripped(self, ch):
        self.select_channel(ch)
        return self.query(':OUTP:OCP:ALAR?') == 'YES'
    
    # Track mode
    def set_track(self, enable):
        self.write(f':OUTP:TRAC {"ON" if enable else "OFF"}')
    
    # Remote sense
    def set_sense(self, enable):
        self.write(f':OUTP:SENS {"ON" if enable else "OFF"}')
    
    # System
    def get_error(self):
        return self.query(':SYST:ERR?')
    
    def local(self):
        self.write(':SYST:LOC')
    
    def lock_keys(self, lock=True):
        self.write(f':SYST:KLOC {"ON" if lock else "OFF"}')
    
    # Save/Recall
    def save(self, slot):
        self.write(f'*SAV {slot}')
    
    def recall(self, slot):
        self.write(f'*RCL {slot}')


# Usage example
if __name__ == '__main__':
    psu = DP800('192.168.1.100')
    print(psu.idn())
    
    # Configure CH1: 12V, 2A limit, OVP at 15V
    psu.apply(1, 12.0, 2.0)
    psu.set_ovp(1, 15.0, enable=True)
    psu.output_on(1)
    
    time.sleep(0.5)
    
    # Read measurements
    v, i, p = psu.measure_all(1)
    print(f"CH1: {v:.4f}V, {i:.4f}A, {p:.4f}W")
    print(f"Mode: {psu.get_mode(1)}")
    
    # Configure CH2: 5V for logic
    psu.apply(2, 5.0, 1.0)
    psu.output_on(2)
    
    # Use CH3 for 3.3V (if DP832)
    psu.apply(3, 3.3, 1.0)
    psu.output_on(3)
    
    input("Press Enter to turn off...")
    psu.all_outputs_off()
    psu.close()
```

---

## PyVISA Alternative

```python
import pyvisa

rm = pyvisa.ResourceManager()

# USB connection
psu = rm.open_resource('USB0::0x1AB1::0x0E11::DP8A1234567890::INSTR')

# Or LAN connection  
psu = rm.open_resource('TCPIP::192.168.1.100::INSTR')

# Configure and enable
psu.write(':APPL CH1,12.0,2.0')
psu.write(':OUTP ON')

# Measure
voltage = float(psu.query(':MEAS? CH1'))
current = float(psu.query(':MEAS:CURR? CH1'))
print(f"CH1: {voltage}V, {current}A")

psu.close()
```

---

## Complete Command Summary Table

| Category | Command | Description |
|----------|---------|-------------|
| **Setup** | `:APPL CHn,V,I` | Quick channel setup |
| **Channel** | `:INST CHn` | Select channel |
| **Voltage** | `:SOURn:VOLT` | Set/query voltage |
| **Current** | `:SOURn:CURR` | Set/query current |
| **Measure** | `:MEAS:VOLT? CHn` | Measure voltage |
| **Measure** | `:MEAS:CURR? CHn` | Measure current |
| **Measure** | `:MEAS:POWE? CHn` | Measure power |
| **Measure** | `:MEAS:ALL? CHn` | Measure V, I, P |
| **Output** | `:OUTP ON/OFF` | Enable/disable output |
| **Output** | `:OUTP:MODE?` | Query CV/CC mode |
| **Protect** | `:OUTP:OVP` | Over-voltage protection |
| **Protect** | `:OUTP:OCP` | Over-current protection |
| **Track** | `:OUTP:TRAC` | Track mode (symmetric V) |
| **Sense** | `:OUTP:SENS` | Remote sense |
| **Timer** | `:TIM` | Automated sequencing |
| **Delay** | `:DELAY` | On/off sequencing |
| **Trigger** | `:TRIG:IN` | External trigger input |
| **Trigger** | `:TRIG:OUT` | Trigger output |
| **Monitor** | `:MON` | Condition monitoring |
| **System** | `:SYST:ERR?` | Error query |
| **Memory** | `*SAV/*RCL` | Save/recall states |

---

## Key Differences from Siglent SPD3303X

| Feature | Rigol DP800 | Siglent SPD3303X |
|---------|-------------|------------------|
| Command prefix | `:SOURce` or `:SOUR` | Direct `VOLTage`/`CURRent` |
| Quick setup | `:APPLy CH1,V,I` | `CH1:VOLT V` + `CH1:CURR I` |
| Measure all | `:MEAS:ALL?` returns V,I,P | Separate queries needed |
| Socket port | 5555 | 5025 |
| Track mode | `:OUTP:TRACk` | `:OUTP:TRACK` (mode number) |
| Timer | 2048 groups, templates | 5 groups |
| Remote sense | Built-in terminals | Not available |
| Protection | OVP/OCP with threshold | OCP mode only |

---

## Notes

1. **Termination**: USB/LAN use `\n`, RS-232 uses `\r\n`

2. **Response time**: Allow ~50-100ms between commands

3. **Channel numbers**: Use 1, 2, 3 with `:SOURce[<n>]` or CH1, CH2, CH3 with other commands

4. **Track mode**: Links CH1 and CH2 for symmetric supplies (±V)

5. **Remote sense**: Connect sense terminals to load for accurate voltage regulation under high current

6. **USB Vendor/Product ID**: 0x1AB1 / 0x0E11

7. **Negative voltage (DP831)**: CH3 produces negative voltage; use absolute value in commands

8. **Protection clearing**: After OVP/OCP trips, must send `:OUTP:OVP:CLEAR` or `:OUTP:OCP:CLEAR` before output can be re-enabled
