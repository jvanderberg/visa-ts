# Keithley Digital Multimeter SCPI Reference

> Keithley DMM6500, DMM7510, and 2000 Series

## Supported Models

| Model | Digits | DC Accuracy | Reading Rate | Key Features |
|-------|--------|-------------|--------------|--------------|
| DMM6500 | 6.5 | 0.0030% | 14000 rdg/s | Touchscreen, graphing |
| DMM7510 | 7.5 | 0.0008% | 1M rdg/s | Digitizing, 1µs aperture |
| 2000 | 6.5 | 0.002% | 2000 rdg/s | Classic system DMM |
| 2001 | 7.5 | 0.0018% | 2500 rdg/s | High accuracy |
| 2002 | 8.5 | 0.0006% | 100 rdg/s | Reference standard |
| 2010 | 7.5 | 0.0018% | 1500 rdg/s | Low noise |

**Note:** Keithley DMMs are now under Tektronix/Fortive. Commands are compatible.

---

## Connection Methods

| Interface | Details |
|-----------|---------|
| USB | VID: 0x05E6, USB-TMC class |
| LAN | Port 5025 (SCPI raw socket) |
| LAN | VXI-11/LXI |
| GPIB | IEEE-488.2 |
| TSP-Link | Multi-unit synchronization (DMM6500/7510) |

**Resource String Examples:**
```
USB0::0x05E6::0x6500::04340543::INSTR
TCPIP0::192.168.1.100::5025::SOCKET
TCPIP0::192.168.1.100::inst0::INSTR
GPIB0::16::INSTR
```

---

## IEEE 488.2 Common Commands

```
*IDN?                → "KEITHLEY INSTRUMENTS,MODEL DMM6500,04340543,1.7.12b"
*RST                 → Reset to default state
*CLS                 → Clear status registers
*ESE <mask>          → Event status enable register
*ESE?                → Query event status enable
*ESR?                → Query event status register
*OPC                 → Set OPC bit when operations complete
*OPC?                → Returns "1" when operations complete
*SRE <mask>          → Service request enable register
*SRE?                → Query service request enable
*STB?                → Query status byte
*TRG                 → Software trigger
*TST?                → Self-test (0 = pass)
*WAI                 → Wait for operations complete
```

---

## Measurement Functions

### Function Selection

Keithley uses explicit `SENSe:FUNCtion` command with quoted function names:

```
SENSe:FUNCtion "<function>"                       → Set measurement function
SENSe:FUNCtion?                                   → Query current function
```

**Function Names:**
```
"VOLT:DC"           DC Voltage
"VOLT:AC"           AC Voltage
"CURR:DC"           DC Current
"CURR:AC"           AC Current
"RES"               2-Wire Resistance
"FRES"              4-Wire Resistance
"FREQ"              Frequency (on voltage or current)
"PER"               Period
"TEMP"              Temperature
"DIOD"              Diode Test
"CONT"              Continuity
"CAP"               Capacitance (DMM6500/7510)
"VOLT:DC:RAT"       DC Voltage Ratio (DMM7510)
```

### Quick Measurement Commands

```
MEASure:VOLTage:DC? [<range>[,<resolution>]]      → Measure DC voltage
MEASure:VOLTage:AC? [<range>[,<resolution>]]      → Measure AC voltage
MEASure:CURRent:DC? [<range>[,<resolution>]]      → Measure DC current
MEASure:CURRent:AC? [<range>[,<resolution>]]      → Measure AC current
MEASure:RESistance? [<range>[,<resolution>]]      → Measure 2-wire resistance
MEASure:FRESistance? [<range>[,<resolution>]]     → Measure 4-wire resistance
MEASure:FREQuency?                                → Measure frequency
MEASure:PERiod?                                   → Measure period
MEASure:TEMPerature?                              → Measure temperature
MEASure:DIODe?                                    → Measure diode
MEASure:CONTinuity?                               → Measure continuity
MEASure:CAPacitance?                              → Measure capacitance
```

### READ vs FETCH

```
READ?                            → Initiate + wait + read
READ? "<buffer_name>"            → Read into named buffer
FETCh?                           → Fetch last reading
INITiate[:IMMediate]             → Start measurement (non-blocking)
ABORt                            → Abort measurement in progress
```

---

## Range Control

### Manual Range Selection

```
SENSe:VOLTage:DC:RANGe <range>                    → Set range
SENSe:VOLTage:DC:RANGe?                           → Query range
SENSe:VOLTage:DC:RANGe:AUTO {ON|OFF}              → Auto-range control
SENSe:VOLTage:DC:RANGe:AUTO?                      → Query auto-range
```

**DC Voltage Ranges:**
- DMM6500/7510: 100mV, 1V, 10V, 100V, 1000V
- 2000 series: 100mV, 1V, 10V, 100V, 1000V

**AC Voltage Ranges:**
- 100mV, 1V, 10V, 100V, 750V

**DC Current Ranges:**
- DMM6500: 10µA, 100µA, 1mA, 10mA, 100mA, 1A, 3A, 10A
- DMM7510: 10µA, 100µA, 1mA, 10mA, 100mA, 1A, 3A

**Resistance Ranges:**
- 10Ω, 100Ω, 1kΩ, 10kΩ, 100kΩ, 1MΩ, 10MΩ, 100MΩ

---

## Integration Time (NPLC)

```
SENSe:VOLTage:DC:NPLC <nplc>                      → Set integration time
SENSe:VOLTage:DC:NPLC?                            → Query NPLC
```

**NPLC Values:**
| Model | Min NPLC | Max NPLC | Speed at 0.0005 NPLC |
|-------|----------|----------|----------------------|
| DMM6500 | 0.0005 | 15 | 14,000 rdg/s |
| DMM7510 | 0.0005 | 15 | 1,000,000 rdg/s (digitize) |
| 2000 | 0.01 | 10 | 2,000 rdg/s |

**Typical Values:**
- 0.0005: Maximum speed, lowest accuracy
- 0.006: Fast
- 0.02: Medium-fast
- 0.2: Medium
- 1: Standard (default)
- 10: High accuracy
- 15: Maximum accuracy

---

## Aperture Time (DMM7510)

For digitizing applications:

```
SENSe:VOLTage:DC:APERture <seconds>               → Set aperture time
SENSe:VOLTage:DC:APERture?                        → Query aperture
```

**Aperture Range:** 1µs to 1s

---

## Auto-Zero

```
SENSe:VOLTage:DC:AZERo[:STATe] {ON|OFF}           → Enable auto-zero
SENSe:VOLTage:DC:AZERo[:STATe]?                   → Query auto-zero
SYSTem:AZERo:STATe {ON|OFF}                       → Global auto-zero
```

- **ON**: Compensates for offset drift (slower)
- **OFF**: Faster, may have offset drift

---

## Input Impedance

```
SENSe:VOLTage:DC:INPut:IMPedance:AUTO {ON|OFF}    → Auto high-Z
SENSe:VOLTage:DC:INPut:IMPedance:AUTO?
```

When AUTO ON:
- Low ranges (100mV, 1V, 10V): >10 GΩ
- High ranges (100V, 1000V): 10 MΩ

---

## Terminal Selection

Front/Rear terminal switching:

```
ROUTe:TERMinals {FRONt|REAR}                      → Select terminals
ROUTe:TERMinals?                                  → Query terminal setting
```

---

## Trigger System

### Trigger Model Overview

Keithley uses a comprehensive trigger model:

```
               ┌─────────┐
               │  IDLE   │
               └────┬────┘
                    │ INITiate
               ┌────▼────┐
               │ TRIGGER │ ◄── Wait for trigger source
               └────┬────┘
                    │
               ┌────▼────┐
               │  DELAY  │
               └────┬────┘
                    │
               ┌────▼────┐
               │ MEASURE │
               └────┬────┘
                    │
               ┌────▼────┐
               │ BUFFER  │
               └─────────┘
```

### Trigger Source

```
TRIGger:SOURce {IMMediate|BUS|EXTernal|TIMer|NOTify<n>}
TRIGger:SOURce?
```

- **IMMediate**: Trigger immediately
- **BUS**: Wait for *TRG command
- **EXTernal**: External trigger input
- **TIMer**: Internal timer
- **NOTify<n>**: TSP-Link notification (multi-unit)

### Trigger Count

```
TRIGger:COUNt <n>                                 → Number of trigger events
TRIGger:COUNt?                                    → Query trigger count
TRIGger:COUNt INFinity                            → Continuous triggering
```

### Sample Count

```
SAMPle:COUNt <n>                                  → Readings per trigger
SAMPle:COUNt?                                     → Query sample count
```

### Trigger Delay

```
TRIGger:DELay <seconds>                           → Trigger delay (0 to 100000s)
TRIGger:DELay?
TRIGger:DELay:AUTO {ON|OFF}                       → Auto delay
```

### Trigger Timer

```
TRIGger:TIMer <seconds>                           → Timer interval
TRIGger:TIMer?
```

### External Trigger

```
TRIGger:EXTernal:LEVel <volts>                    → Trigger level
TRIGger:EXTernal:EDGE {RISing|FALLing|EITHer}     → Edge selection
TRIGger:EXTernal:EDGE?
```

---

## Buffer System (DMM6500/DMM7510)

### Named Buffers

```
TRACe:MAKE "<name>", <size>                       → Create buffer
TRACe:MAKE "<name>", <size>, STYLE                → With style
TRACe:DELete "<name>"                             → Delete buffer
TRACe:CLEar "<name>"                              → Clear buffer contents
TRACe:POINts "<name>"                             → Set buffer size
TRACe:POINts? "<name>"                            → Query size
TRACe:ACTual? "<name>"                            → Readings in buffer
TRACe:ACTual:STARt? "<name>"                      → First reading index
TRACe:ACTual:END? "<name>"                        → Last reading index
```

**Buffer Styles:**
- `COMPact`: Readings only
- `STANdard`: Readings + relative time
- `FULL`: Readings + absolute time + extra info
- `WRITable`: User can write data

**Default Buffers:**
- `"defbuffer1"`: Default reading buffer
- `"defbuffer2"`: Secondary buffer

### Reading Buffer Data

```
TRACe:DATA? <start>, <count>, "<buffer>", <elements>
```

**Elements:**
- `READing`: Measurement value
- `RELative`: Relative timestamp
- `SEConds`: Absolute timestamp (seconds)
- `FRACtional`: Fractional seconds
- `TSTamp`: Full timestamp string
- `DATE`: Date string
- `TIME`: Time string
- `STATus`: Status flags
- `UNIT`: Measurement unit
- `FORMatted`: Formatted reading string
- `SOURce`: Source value (if applicable)

**Examples:**
```
TRAC:DATA? 1, 10, "defbuffer1", READ              # 10 readings
TRAC:DATA? 1, 10, "defbuffer1", READ, REL         # Readings + timestamps
TRAC:DATA? 1, 100, "defbuffer1", READ, TST, STAT  # With status
```

### Triggering to Buffer

```
TRACe:TRIGger "<buffer>"                          → Set target buffer
TRACe:TRIGger?                                    → Query target buffer
```

---

## Math/Calculate Functions

### Null (Relative)

```
CALCulate:FUNCtion NULL                           → Select null function
CALCulate:NULL:ACQuire                            → Acquire null from current reading
CALCulate:NULL:OFFSet <value>                     → Set null offset manually
CALCulate:NULL:OFFSet?                            → Query null offset
CALCulate:STATe {ON|OFF}                          → Enable math function
CALCulate:STATe?
```

### dB/dBm

```
CALCulate:FUNCtion DB                             → Enable dB function
CALCulate:DB:REFerence <value>                    → dB reference value
CALCulate:DB:REFerence?

CALCulate:FUNCtion DBM                            → Enable dBm function
CALCulate:DBM:REFerence <ohms>                    → Reference impedance
CALCulate:DBM:REFerence?
```

### Limits

```
CALCulate:LIMit<n>:LOWer[:DATA] <value>           → Lower limit
CALCulate:LIMit<n>:LOWer?
CALCulate:LIMit<n>:UPPer[:DATA] <value>           → Upper limit
CALCulate:LIMit<n>:UPPer?
CALCulate:LIMit<n>:STATe {ON|OFF}                 → Enable limit test
CALCulate:LIMit<n>:FAIL?                          → Query limit fail status
CALCulate:LIMit<n>:CLEar[:IMMediate]              → Clear limit status
```

### MX+B Scaling

```
CALCulate:FUNCtion MXB                            → Enable MX+B
CALCulate:MXB:MFACtor <m>                         → M factor
CALCulate:MXB:BFACtor <b>                         → B offset
```

### Reciprocal (1/X)

```
CALCulate:FUNCtion RECiprocal                     → Enable 1/X
```

### Percent

```
CALCulate:FUNCtion PERCent                        → Enable percent
CALCulate:PERCent:REFerence <value>               → Reference value
```

---

## Statistics

Statistics are calculated from buffer data:

```
# Calculate from buffer
CALCulate:DATA? MINimum, "<buffer>"               → Minimum
CALCulate:DATA? MAXimum, "<buffer>"               → Maximum
CALCulate:DATA? MEAN, "<buffer>"                  → Average
CALCulate:DATA? SDEViation, "<buffer>"            → Standard deviation
CALCulate:DATA? PTPeak, "<buffer>"                → Peak-to-peak
```

---

## Temperature Measurement

### Transducer Type

```
SENSe:TEMPerature:TRANsducer:TYPE {TC|RTD|FRTD|THERmistor|FTHermistor}
SENSe:TEMPerature:TRANsducer:TYPE?
```

- `TC`: Thermocouple
- `RTD`: 2-wire RTD
- `FRTD`: 4-wire RTD
- `THERmistor`: 2-wire thermistor
- `FTHermistor`: 4-wire thermistor

### Thermocouple Configuration

```
SENSe:TEMPerature:TRANsducer:TCouple:TYPE {J|K|N|T|E|R|S|B}
SENSe:TEMPerature:TRANsducer:TCouple:RJUNction:TYPE {INTernal|SIMulated}
SENSe:TEMPerature:TRANsducer:TCouple:RJUNction:SIMulated <temp>
SENSe:TEMPerature:TRANsducer:TCouple:RJUNction:REAL?
```

### RTD Configuration

```
SENSe:TEMPerature:TRANsducer:RTD:TYPE {PT100|PT385|PT3916|USER}
SENSe:TEMPerature:TRANsducer:FRTD:TYPE {PT100|PT385|PT3916|USER}
SENSe:TEMPerature:TRANsducer:RTD:ALPHa <alpha>    → User alpha (0.003 to 0.004)
SENSe:TEMPerature:TRANsducer:RTD:ZERO <r0>        → R0 value
```

### Thermistor Configuration

```
SENSe:TEMPerature:TRANsducer:THERmistor:TYPE <ohms>  → 2252, 5000, 10000
SENSe:TEMPerature:TRANsducer:FTHermistor:TYPE <ohms>
```

### Temperature Units

```
UNIT:TEMPerature {CELsius|FAHRenheit|KELVin}
UNIT:TEMPerature?
```

---

## Digitizing (DMM7510)

High-speed waveform capture:

```
DIGitize:FUNCtion "<function>"                    → Set digitize function
DIGitize:FUNCtion?
DIGitize:VOLTage[:DC] [<range>]                   → Digitize DC voltage
DIGitize:VOLTage:APERture <seconds>               → Sample aperture (1µs to 1s)
DIGitize:VOLTage:SRATe <samples/sec>              → Sample rate (1 to 1M)
DIGitize:CURRent[:DC] [<range>]                   → Digitize DC current
DIGitize:COUNt <n>                                → Number of samples
```

**Example - 1 MSa/s Acquisition:**
```
DIG:FUNC "VOLT"
DIG:VOLT 10                      # 10V range
DIG:VOLT:SRAT 1E6                # 1 MSa/s
DIG:COUN 10000                   # 10000 samples
INIT
*OPC?
TRAC:DATA? 1, 10000, "defbuffer1", READ
```

---

## AC Measurements

### Bandwidth/Detector

```
SENSe:VOLTage:AC:DETector:BANDwidth {3|30|300}    → Bandwidth (Hz)
SENSe:VOLTage:AC:DETector:BANDwidth?
```

- **3 Hz**: Best low-frequency accuracy, slowest
- **30 Hz**: Medium bandwidth
- **300 Hz**: Fastest, for higher frequencies

---

## System Commands

### Error Query

```
SYSTem:ERRor[:NEXT]?                              → Get next error
SYSTem:ERRor:ALL?                                 → Get all errors
SYSTem:ERRor:COUNt?                               → Number of errors in queue
SYSTem:ERRor:CLEar                                → Clear error queue
```

### Beeper

```
SYSTem:BEEPer <frequency>, <duration>             → Beep with freq/duration
SYSTem:BEEPer:IMMediate                           → Single beep
SYSTem:BEEPer:STATe {ON|OFF}                      → Enable/disable beeper
```

### Display (DMM6500/DMM7510)

```
DISPlay:SCReen {HOME|GRAPh|HISTogram|SWIPe|USER}  → Select screen
DISPlay:TEXT:DATA "<message>"                      → Show custom text
DISPlay:TEXT:STATe {ON|OFF}                        → Enable text display
DISPlay:CLEar                                      → Clear display text
DISPlay:LIGHtness <percent>                        → Backlight (0-100)
```

### Remote/Local

```
SYSTem:REMote                                     → Enter remote mode
SYSTem:LOCal                                      → Return to local mode
SYSTem:RWLock                                     → Remote with lockout
```

### System Info

```
SYSTem:VERSion?                                   → SCPI version
*IDN?                                             → Identification
SYSTem:SERial?                                    → Serial number
```

---

## Scanning (with Switching Card)

For DMM6500/7510 with switching module:

### Channel Configuration

```
ROUTe:SCAN:CREate "<channel_list>"                → Create scan list
ROUTe:SCAN:ADD "<channel_list>"                   → Add to scan
ROUTe:SCAN:DELete "<channel_list>"                → Remove from scan
ROUTe:SCAN?                                       → Query scan list
ROUTe:SCAN:COUNt:SCAN <n>                         → Number of scan passes
```

### Channel List Format

```
(@101:110)           # Channels 101-110
(@101,105,110)       # Specific channels
(@1001:1020)         # Slot 1, channels 1-20
```

### Running Scan

```
INITiate                                          → Start scan
ABORt                                             → Stop scan
ROUTe:SCAN:STATe?                                 → Query scan status
```

---

## TSP-Link (Multi-Unit)

For synchronizing multiple DMM6500/DMM7510:

```
TSPLink:INITialize                                → Initialize TSP-Link
TSPLink:STATe?                                    → Query TSP-Link state
TSPLink:SELF?                                     → Query own node number
TSPLink:GROup <nodes>                             → Set node group
```

---

## Programming Examples

### Basic DC Voltage

```
*RST
SENS:FUNC "VOLT:DC"
SENS:VOLT:DC:RANG 10
SENS:VOLT:DC:NPLC 1
READ?
```

### High-Speed Acquisition

```
*RST
SENS:FUNC "VOLT:DC"
SENS:VOLT:DC:RANG 10
SENS:VOLT:DC:NPLC 0.0005
SENS:VOLT:DC:AZER OFF
SAMP:COUN 10000
TRIG:SOUR IMM
INIT
*OPC?
TRAC:DATA? 1, 10000, "defbuffer1", READ
```

### Temperature with K-Type Thermocouple

```
*RST
SENS:FUNC "TEMP"
SENS:TEMP:TRAN:TYPE TC
SENS:TEMP:TRAN:TC:TYPE K
SENS:TEMP:TRAN:TC:RJUN:TYPE INT
UNIT:TEMP CEL
READ?
```

### Triggered Sequence with Buffer

```
*RST
SENS:FUNC "VOLT:DC"
SENS:VOLT:DC:RANG 10
TRIG:SOUR BUS
TRIG:COUN 100
SAMP:COUN 1
TRAC:CLE "defbuffer1"
INIT
# Send triggers
*TRG
*TRG
# ... repeat ...
# Fetch data
TRAC:DATA? 1, 100, "defbuffer1", READ, REL
```

### Statistics Collection

```
*RST
SENS:FUNC "VOLT:DC"
SENS:VOLT:DC:RANG 10
SENS:VOLT:DC:NPLC 10
TRAC:CLE "defbuffer1"
SAMP:COUN 100
TRIG:SOUR IMM
INIT
*OPC?
CALC:DATA? MIN, "defbuffer1"
CALC:DATA? MAX, "defbuffer1"
CALC:DATA? MEAN, "defbuffer1"
CALC:DATA? SDEV, "defbuffer1"
```

### Digitizing (DMM7510)

```
*RST
DIG:FUNC "VOLT"
DIG:VOLT 10
DIG:VOLT:APER 1E-6               # 1µs aperture
DIG:VOLT:SRAT 1E6                # 1 MSa/s
TRAC:CLE "defbuffer1"
DIG:COUN 100000                  # 100ms of data
INIT
*OPC?
TRAC:DATA? 1, 100000, "defbuffer1", READ, REL
```

### Limit Testing

```
*RST
SENS:FUNC "VOLT:DC"
SENS:VOLT:DC:RANG 10
CALC:LIM1:LOW 4.9
CALC:LIM1:UPP 5.1
CALC:LIM1:STAT ON
READ?
CALC:LIM1:FAIL?                  # 0=pass, 1=fail
```

---

## Status System

### Status Byte (STB)

| Bit | Weight | Name | Description |
|-----|--------|------|-------------|
| 0 | 1 | MSB | Measurement summary |
| 1 | 2 | EAV | Error available |
| 2 | 4 | QSB | Questionable summary |
| 3 | 8 | - | Not used |
| 4 | 16 | MAV | Message available |
| 5 | 32 | ESB | Event summary |
| 6 | 64 | RQS | Request service |
| 7 | 128 | OSB | Operation summary |

### Measurement Status

```
STATus:MEASurement[:EVENt]?                       → Measurement event register
STATus:MEASurement:CONDition?                     → Measurement condition
STATus:MEASurement:ENABle <mask>                  → Enable mask
```

---

## Connection Examples

### Python Socket

```python
import socket

def keithley_query(host, command, port=5025):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(5)
        s.connect((host, port))
        s.sendall((command + '\n').encode())
        return s.recv(65536).decode().strip()

# Example
idn = keithley_query('192.168.1.100', '*IDN?')
print(idn)

# Configure and measure
keithley_query('192.168.1.100', 'SENS:FUNC "VOLT:DC"')
keithley_query('192.168.1.100', 'SENS:VOLT:DC:NPLC 10')
voltage = keithley_query('192.168.1.100', 'READ?')
print(f"Voltage: {float(voltage)} V")
```

### TypeScript with visa-ts

```typescript
import { createResourceManager } from 'visa-ts';

async function measureWithKeithley() {
  const rm = createResourceManager();
  const dmm = await rm.open('TCPIP0::192.168.1.100::5025::SOCKET');

  await dmm.write('SENS:FUNC "VOLT:DC"');
  await dmm.write('SENS:VOLT:DC:RANG 10');
  await dmm.write('SENS:VOLT:DC:NPLC 10');

  const result = await dmm.query('READ?');
  if (result.ok) {
    console.log(`Voltage: ${parseFloat(result.value)} V`);
  }

  await dmm.close();
}
```

---

## Notes

1. **Buffer System**: Keithley uses named buffers instead of simple data arrays. Default buffer is "defbuffer1".

2. **NPLC Values**: Keithley supports very low NPLC (0.0005) for high-speed applications.

3. **TSP-Link**: Enables multi-unit synchronization with sub-microsecond timing.

4. **DMM7510 Digitizing**: True 1 MSa/s digitizing with 1µs aperture for waveform capture.

5. **Function Quotes**: Keithley requires function names in quotes: `SENS:FUNC "VOLT:DC"` not `SENS:FUNC VOLT:DC`.

6. **Legacy 2000 Series**: Uses simpler buffer commands; check specific model documentation.

7. **Auto-Zero**: Affects accuracy significantly. Use `AZER ON` for best accuracy, `AZER OFF` for speed.
