# Keysight Truevolt Digital Multimeter SCPI Reference

> Keysight 34400A/34460A/34461A/34465A/34470A Series

## Supported Models

| Model | Digits | DC Accuracy | Reading Rate | Key Features |
|-------|--------|-------------|--------------|--------------|
| 34450A | 5.5 | 0.015% | 190 rdg/s | Basic USB bench DMM |
| 34460A | 6.5 | 0.0035% | 300 rdg/s | Truevolt entry |
| 34461A | 6.5 | 0.0035% | 300 rdg/s | Graphing, math |
| 34465A | 6.5 | 0.0030% | 50000 rdg/s | Digitizing, histograms |
| 34470A | 7.5 | 0.0016% | 50000 rdg/s | Highest resolution |

**Legacy Models (same command set):**
- 34401A (6.5 digit classic)
- 34410A/34411A (system DMM)
- 34420A (nanovolt meter)

---

## Connection Methods

| Interface | Details |
|-----------|---------|
| USB | VID: 0x0957, Class-compliant USB-TMC |
| LAN | Port 5025 (SCPI raw socket) |
| LAN | VXI-11 (VISA over LAN) |
| GPIB | IEEE-488.2 (optional on some models) |

**Resource String Examples:**
```
USB0::0x0957::0x1A07::MY53000001::INSTR
TCPIP0::192.168.1.100::5025::SOCKET
TCPIP0::192.168.1.100::inst0::INSTR
GPIB0::22::INSTR
```

---

## IEEE 488.2 Common Commands

```
*IDN?                → "Keysight Technologies,34461A,MY53000001,A.02.14-02.40-02.14-00.49-03-01"
*RST                 → Reset to default state
*CLS                 → Clear status registers
*ESE <mask>          → Event status enable register
*ESE?                → Query event status enable
*ESR?                → Query event status register (clears it)
*OPC                 → Set OPC bit when operations complete
*OPC?                → Returns "1" when operations complete
*SRE <mask>          → Service request enable register
*SRE?                → Query service request enable
*STB?                → Query status byte
*TRG                 → Software trigger (when TRIG:SOUR BUS)
*TST?                → Self-test (0 = pass)
*WAI                 → Wait for operations complete
```

---

## Measurement Functions

### Function Selection with CONFigure

Configure measurement function without triggering:

```
CONFigure:VOLTage:DC [<range>[,<resolution>]]
CONFigure:VOLTage:AC [<range>[,<resolution>]]
CONFigure:CURRent:DC [<range>[,<resolution>]]
CONFigure:CURRent:AC [<range>[,<resolution>]]
CONFigure:RESistance [<range>[,<resolution>]]
CONFigure:FRESistance [<range>[,<resolution>]]
CONFigure:FREQuency [<range>[,<resolution>]]
CONFigure:PERiod [<range>[,<resolution>]]
CONFigure:CONTinuity
CONFigure:DIODe
CONFigure:TEMPerature [<probe_type>[,<type>]]
CONFigure:CAPacitance [<range>[,<resolution>]]
CONFigure?                                        → Query current configuration
```

**Range Values:**
- Voltage DC: 0.1, 1, 10, 100, 1000 (V)
- Voltage AC: 0.1, 1, 10, 100, 750 (V)
- Current DC: 0.0001, 0.001, 0.01, 0.1, 1, 3 (A) - 10A on some models
- Current AC: 0.001, 0.01, 0.1, 1, 3 (A)
- Resistance: 100, 1000, 10000, 100000, 1E6, 10E6, 100E6, 1E9 (Ohm)
- Capacitance: 1E-9, 10E-9, 100E-9, 1E-6, 10E-6, 100E-6 (F)

**Resolution:** Specify in measurement units (e.g., 0.001 for 1mV on 10V range)

### Quick Measurement with MEASure

Configure and immediately trigger:

```
MEASure:VOLTage:DC? [<range>[,<resolution>]]      → Returns measurement
MEASure:VOLTage:AC? [<range>[,<resolution>]]
MEASure:CURRent:DC? [<range>[,<resolution>]]
MEASure:CURRent:AC? [<range>[,<resolution>]]
MEASure:RESistance? [<range>[,<resolution>]]
MEASure:FRESistance? [<range>[,<resolution>]]
MEASure:FREQuency? [<range>[,<resolution>]]
MEASure:PERiod? [<range>[,<resolution>]]
MEASure:CONTinuity?
MEASure:DIODe?
MEASure:TEMPerature? [<probe_type>[,<type>]]
MEASure:CAPacitance? [<range>[,<resolution>]]
```

### Query Current Function

```
FUNCtion?                                         → "VOLT", "CURR", etc.
[SENSe:]FUNCtion "<function>"                     → Set function
```

---

## Range Control

### Manual Range

```
[SENSe:]VOLTage:DC:RANGe <range>                  → Set DC voltage range
[SENSe:]VOLTage:DC:RANGe?                         → Query range
[SENSe:]VOLTage:DC:RANGe:AUTO {ON|OFF|ONCE}       → Auto-range control
[SENSe:]VOLTage:DC:RANGe:AUTO?                    → Query auto-range state
```

**Applies to all functions:**
- `VOLTage:DC`, `VOLTage:AC`
- `CURRent:DC`, `CURRent:AC`
- `RESistance`, `FRESistance`
- `CAPacitance`
- `FREQuency`, `PERiod`

### Range Examples

```
VOLT:DC:RANG 10                  # 10V range
VOLT:DC:RANG:AUTO ON             # Enable auto-range
VOLT:DC:RANG:AUTO ONCE           # Auto-range once, then hold
CURR:DC:RANG 0.1                 # 100mA range
RES:RANG 10E3                    # 10kΩ range
```

---

## Integration Time (NPLC/Aperture)

### NPLC (Number of Power Line Cycles)

```
[SENSe:]VOLTage:DC:NPLC <nplc>                    → Set integration time
[SENSe:]VOLTage:DC:NPLC?                          → Query NPLC
```

**NPLC Values:**
| NPLC | Integration Time (60Hz) | Integration Time (50Hz) | Readings/sec |
|------|------------------------|------------------------|--------------|
| 0.001 | 16.7 µs | 20 µs | ~50000 |
| 0.002 | 33.3 µs | 40 µs | ~25000 |
| 0.006 | 100 µs | 120 µs | ~8300 |
| 0.02 | 333 µs | 400 µs | ~2500 |
| 0.06 | 1 ms | 1.2 ms | ~830 |
| 0.2 | 3.33 ms | 4 ms | ~250 |
| 1 | 16.67 ms | 20 ms | ~50 |
| 2 | 33.33 ms | 40 ms | ~25 |
| 10 | 166.7 ms | 200 ms | ~5 |
| 100 | 1.667 s | 2 s | ~0.5 |

### Aperture Time (Alternative)

```
[SENSe:]VOLTage:DC:APERture <seconds>             → Set aperture in seconds
[SENSe:]VOLTage:DC:APERture?                      → Query aperture
[SENSe:]VOLTage:DC:APERture:ENABled {ON|OFF}      → Enable aperture mode
```

---

## Auto-Zero

Auto-zero compensates for offset drift. Doubles measurement time when ON.

```
[SENSe:]VOLTage:DC:ZERO:AUTO {ON|OFF|ONCE}        → Control auto-zero
[SENSe:]VOLTage:DC:ZERO:AUTO?                     → Query auto-zero state
```

- **ON**: Auto-zero every measurement (best accuracy)
- **OFF**: No auto-zero (fastest)
- **ONCE**: Auto-zero once, then hold offset

---

## Input Impedance

```
[SENSe:]VOLTage:DC:IMPedance:AUTO {ON|OFF}        → High-Z mode for low ranges
[SENSe:]VOLTage:DC:IMPedance:AUTO?                → Query impedance mode
```

When AUTO ON:
- 100mV, 1V ranges: >10 GΩ input impedance
- 10V, 100V, 1000V ranges: 10 MΩ input impedance

---

## Taking Measurements

### READ vs FETCH vs INITiate

```
READ?                            → Initiate + wait + fetch (blocking)
INITiate[:IMMediate]             → Start measurement (non-blocking)
FETCh?                           → Return last measurement (no new trigger)
```

### Single Reading

```
READ?                            → Single reading, current function
```

### Multiple Readings

```
SAMPle:COUNt <n>                 → Readings per trigger (1 to 1M)
SAMPle:COUNt?                    → Query sample count
TRIGger:COUNt <n>                → Number of triggers (1 to 1M)
TRIGger:COUNt?                   → Query trigger count

# Example: 100 readings
SAMP:COUN 100
INIT
*OPC?                            # Wait for completion
FETC?                            # Returns all 100 readings
```

---

## Trigger System

### Trigger Source

```
TRIGger:SOURce {IMMediate|BUS|EXTernal|INTernal}
TRIGger:SOURce?
```

- **IMMediate**: Trigger immediately when INITiated
- **BUS**: Wait for *TRG or TRIG command
- **EXTernal**: Wait for external trigger input
- **INTernal**: Trigger at specified interval (timer)

### Trigger Delay

```
TRIGger:DELay <seconds>          → Delay after trigger (0 to 3600s)
TRIGger:DELay?
TRIGger:DELay:AUTO {ON|OFF}      → Auto delay based on function/range
TRIGger:DELay:AUTO?
```

### Software Trigger

```
*TRG                             → IEEE-488.2 trigger
TRIGger[:IMMediate]              → SCPI trigger
```

---

## Null (Relative) Measurements

```
[SENSe:]VOLTage:DC:NULL[:STATe] {ON|OFF}          → Enable null
[SENSe:]VOLTage:DC:NULL[:STATe]?
[SENSe:]VOLTage:DC:NULL:VALue <value>             → Set null offset
[SENSe:]VOLTage:DC:NULL:VALue?
[SENSe:]VOLTage:DC:NULL:VALue:AUTO {ON|OFF}       → Auto-acquire null
```

**Example - Auto Null:**
```
VOLT:DC:NULL:VAL:AUTO ON         # Use next reading as null reference
VOLT:DC:NULL ON                  # Enable null subtraction
READ?                            # Returns value - null_offset
```

---

## Statistics (Min/Max/Average)

```
CALCulate:AVERage[:STATe] {ON|OFF}                → Enable statistics
CALCulate:AVERage[:STATe]?
CALCulate:AVERage:MINimum?                        → Minimum reading
CALCulate:AVERage:MAXimum?                        → Maximum reading
CALCulate:AVERage:AVERage?                        → Average of readings
CALCulate:AVERage:COUNt?                          → Number of readings
CALCulate:AVERage:PTPeak?                         → Peak-to-peak (max-min)
CALCulate:AVERage:SDEViation?                     → Standard deviation (34465A/34470A)
CALCulate:AVERage:CLEar[:IMMediate]               → Clear statistics
```

---

## Limits Testing

```
CALCulate:LIMit[:STATe] {ON|OFF}                  → Enable limit testing
CALCulate:LIMit:LOWer[:DATA] <value>              → Lower limit
CALCulate:LIMit:LOWer?
CALCulate:LIMit:UPPer[:DATA] <value>              → Upper limit
CALCulate:LIMit:UPPer?
CALCulate:LIMit:CLEar[:IMMediate]                 → Clear limit status
CALCulate:LIMit:LOWer:STATe?                      → 1 if below lower
CALCulate:LIMit:UPPer:STATe?                      → 1 if above upper
```

---

## Math Operations

### dB Measurements

```
[SENSe:]VOLTage:AC:DB[:STATe] {ON|OFF}            → Enable dB display
[SENSe:]VOLTage:AC:DB:REFerence <dBm>             → dB reference value
```

### dBm Measurements

```
[SENSe:]VOLTage:AC:DBM[:STATe] {ON|OFF}           → Enable dBm display
[SENSe:]VOLTage:AC:DBM:REFerence <ohms>           → Reference impedance (1-9999Ω)
```

---

## Data Buffer

### Buffer Configuration

```
DATA:POINts <n>                                   → Set buffer size
DATA:POINts?                                      → Query buffer size
DATA:POINts:EVENt:THReshold <n>                   → Threshold for data ready
```

### Reading Buffer Data

```
DATA:REMove? <count>                              → Read and remove readings
DATA:REMove? <count>,READing                      → Remove readings only
DATA:REMove? <count>,READing,TIMe                 → Include timestamps (34465A/34470A)
DATA:DATA?                                        → Read all (doesn't remove)
DATA:CLEar                                        → Clear buffer
DATA:LAST?                                        → Last reading
DATA:POINts:EVENt:STATus?                         → Readings in buffer
```

### Binary Data Transfer

```
FORMat:DATA {ASCii|REAL,32|REAL,64}               → Data format
FORMat:DATA?
FORMat:BORDer {NORMal|SWAPped}                    → Byte order for binary
```

---

## Temperature Measurement

### Thermocouple

```
CONFigure:TEMPerature TC,<type>
```

**Types:** B, E, J, K, N, R, S, T

```
[SENSe:]TEMPerature:TRANsducer:TCouple:TYPE {B|E|J|K|N|R|S|T}
[SENSe:]TEMPerature:TRANsducer:TCouple:TYPE?
[SENSe:]TEMPerature:TRANsducer:TCouple:RJUNction:TYPE {INTernal|FIXed}
[SENSe:]TEMPerature:TRANsducer:TCouple:RJUNction:TYPE?
[SENSe:]TEMPerature:TRANsducer:TCouple:RJUNction? → Query reference junction temp
```

### RTD

```
CONFigure:TEMPerature RTD,<type>
```

**Types:** PT100 (α=0.00385), PT3916 (α=0.003916), PT3926 (α=0.003926)

```
[SENSe:]TEMPerature:TRANsducer:FRTD:TYPE {PT100|PT385|PT3916}  → 4-wire
[SENSe:]TEMPerature:TRANsducer:RTD:TYPE {PT100|PT385|PT3916}   → 2-wire
[SENSe:]TEMPerature:TRANsducer:FRTD:RESistance?                → Nominal R0
```

### Thermistor

```
CONFigure:TEMPerature THERmistor,<type>
```

**Types:** 2252, 5000, 10000 (ohms at 25°C)

```
[SENSe:]TEMPerature:TRANsducer:THERmistor:TYPE {2252|5000|10000}
```

### Temperature Units

```
UNIT:TEMPerature {C|F|K}                          → Celsius/Fahrenheit/Kelvin
UNIT:TEMPerature?
```

---

## AC Measurements

### AC Bandwidth Filter

```
[SENSe:]VOLTage:AC:BANDwidth <hz>                 → Set bandwidth
[SENSe:]VOLTage:AC:BANDwidth?
```

**Bandwidth Values:**
- 3 Hz: Slow, best low-frequency accuracy
- 20 Hz: Medium (default)
- 200 Hz: Fast, for higher frequencies

---

## Smoothing Filter (34461A/34465A/34470A)

Digital averaging filter for readings:

```
[SENSe:]VOLTage:DC:SMOOthing[:STATe] {ON|OFF}     → Enable smoothing
[SENSe:]VOLTage:DC:SMOOthing:RESPonse {SLOW|MEDium|FAST}
```

---

## Digitizing (34465A/34470A Only)

High-speed waveform capture:

```
[SENSe:]DIGitize:VOLTage[:DC] [<range>]           → Configure digitizing
[SENSe:]DIGitize:APERture <seconds>               → Sample aperture (2µs to 1s)
[SENSe:]DIGitize:APERture?
SAMPle:SOURce TIMer                               → Timer-based sampling
SAMPle:TIMer <seconds>                            → Sample interval
```

**Example - 50 kSa/s acquisition:**
```
DIG:VOLT 10                      # Digitize on 10V range
DIG:APER 2E-6                    # 2µs aperture
SAMP:SOUR TIM
SAMP:TIM 20E-6                   # 20µs interval = 50 kSa/s
SAMP:COUN 10000                  # 10000 samples
INIT
*OPC?
DATA:REM? 10000
```

---

## Histogram (34465A/34470A Only)

```
CALCulate:TRANsform:HISTogram[:STATe] {ON|OFF}    → Enable histogram
CALCulate:TRANsform:HISTogram:POINts <n>          → Number of bins
CALCulate:TRANsform:HISTogram:RANGe:AUTO {ON|OFF} → Auto bin range
CALCulate:TRANsform:HISTogram:RANGe:LOWer <value> → Lower bin value
CALCulate:TRANsform:HISTogram:RANGe:UPPer <value> → Upper bin value
CALCulate:TRANsform:HISTogram:DATA?               → Bin counts
CALCulate:TRANsform:HISTogram:ALL?                → Bins + range + counts
```

---

## System Commands

### Error Query

```
SYSTem:ERRor[:NEXT]?                              → Get next error
```

Returns: `<error_code>,"<error_message>"`
- `0,"No error"` when queue empty

### Beeper

```
SYSTem:BEEPer[:IMMediate]                         → Beep once
SYSTem:BEEPer:STATe {ON|OFF}                      → Enable/disable beeper
SYSTem:BEEPer:STATe?
```

### Display

```
DISPlay[:STATe] {ON|OFF}                          → Display on/off (faster when off)
DISPlay:TEXT "<message>"                          → Show custom text (12 chars)
DISPlay:TEXT:CLEar                                → Clear custom text
```

### Remote/Local

```
SYSTem:REMote                                     → Enter remote mode
SYSTem:LOCal                                      → Return to local mode
SYSTem:RWLock                                     → Remote with front panel lock
```

### Preset

```
SYSTem:PRESet                                     → Restore user preset
```

---

## Secondary Measurements (34461A/34465A/34470A)

Display secondary measurement simultaneously:

```
[SENSe:]VOLTage:AC:SECondary "<function>"         → Set secondary function
[SENSe:]VOLTage:AC:SECondary?
```

**Secondary functions for AC voltage:**
- `"FREQ"` - Frequency
- `"PER"` - Period
- `"OFF"` - Disable

---

## Programming Examples

### Basic DC Voltage Measurement

```
*RST                             # Reset to defaults
CONF:VOLT:DC 10,0.001            # 10V range, 1mV resolution
VOLT:DC:NPLC 10                  # 10 PLC for accuracy
READ?                            # Take measurement
```

### High-Speed Acquisition

```
*RST
CONF:VOLT:DC 10
VOLT:DC:NPLC 0.001               # Minimum integration
VOLT:DC:ZERO:AUTO OFF            # Disable auto-zero
SAMP:COUN 1000
TRIG:SOUR IMM
TRIG:DEL:AUTO OFF
TRIG:DEL 0
INIT
*OPC?
FETC?
```

### Statistics Collection

```
*RST
CONF:VOLT:DC AUTO
VOLT:DC:NPLC 10
CALC:AVER ON
SAMP:COUN 100
INIT
*OPC?
CALC:AVER:AVER?                  # Average
CALC:AVER:SDEV?                  # Standard deviation (34465A/70A)
CALC:AVER:MIN?                   # Minimum
CALC:AVER:MAX?                   # Maximum
CALC:AVER:COUN?                  # Count
```

### Temperature Measurement with K-Type Thermocouple

```
*RST
CONF:TEMP TC,K                   # K-type thermocouple
UNIT:TEMP C                      # Celsius
TEMP:TRAN:TC:RJUN:TYPE INT       # Internal reference junction
READ?
```

### Triggered Measurement Sequence

```
*RST
CONF:VOLT:DC 10
TRIG:SOUR BUS                    # Wait for software trigger
TRIG:COUN 10                     # 10 triggers
SAMP:COUN 1                      # 1 sample per trigger
INIT                             # Arm trigger system

# Send triggers as needed
*TRG                             # Trigger 1
*TRG                             # Trigger 2
# ... continue ...

FETC?                            # Get all readings
```

### Limit Testing

```
*RST
CONF:VOLT:DC 10
CALC:LIM:LOW 4.9                 # Lower limit 4.9V
CALC:LIM:UPP 5.1                 # Upper limit 5.1V
CALC:LIM ON                      # Enable limits
READ?                            # Take measurement
CALC:LIM:LOW:STAT?               # 1 if failed low
CALC:LIM:UPP:STAT?               # 1 if failed high
```

---

## Status System

### Status Byte (STB)

| Bit | Weight | Name | Description |
|-----|--------|------|-------------|
| 0 | 1 | - | Not used |
| 1 | 2 | - | Not used |
| 2 | 4 | Error Queue | Error available |
| 3 | 8 | QSR | Questionable status |
| 4 | 16 | MAV | Message available |
| 5 | 32 | ESB | Event status bit |
| 6 | 64 | RQS/MSS | Request service |
| 7 | 128 | OSR | Operation status |

### Standard Event Status Register (ESR)

| Bit | Weight | Name | Description |
|-----|--------|------|-------------|
| 0 | 1 | OPC | Operation complete |
| 2 | 4 | QYE | Query error |
| 3 | 8 | DDE | Device error |
| 4 | 16 | EXE | Execution error |
| 5 | 32 | CME | Command error |
| 7 | 128 | PON | Power on |

---

## Connection Examples

### Python Socket

```python
import socket

def query_dmm(host, command, port=5025):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((host, port))
        s.sendall((command + '\n').encode())
        return s.recv(4096).decode().strip()

# Example
idn = query_dmm('192.168.1.100', '*IDN?')
voltage = float(query_dmm('192.168.1.100', 'MEAS:VOLT:DC?'))
```

### TypeScript with visa-ts

```typescript
import { createResourceManager } from 'visa-ts';

async function measureVoltage() {
  const rm = createResourceManager();
  const dmm = await rm.open('TCPIP0::192.168.1.100::5025::SOCKET');

  await dmm.write('CONF:VOLT:DC 10');
  await dmm.write('VOLT:DC:NPLC 10');

  const result = await dmm.query('READ?');
  if (result.ok) {
    console.log(`Voltage: ${parseFloat(result.value)} V`);
  }

  await dmm.close();
}
```

---

## Notes

1. **NPLC vs Speed**: Higher NPLC = better accuracy but slower. 1 NPLC = 16.67ms at 60Hz.

2. **Auto-Zero**: Doubles measurement time but improves accuracy. Use ONCE for best compromise.

3. **Input Impedance**: Use high-Z mode (IMPedance:AUTO ON) when measuring high-impedance circuits.

4. **Display OFF**: Turning off display can increase measurement speed by ~10%.

5. **Binary Transfer**: Use REAL,64 format for maximum precision, REAL,32 for speed.

6. **34465A/34470A**: Have digitizing capability up to 50 kSa/s for waveform capture.

7. **Triggering**: For fastest throughput, use IMMediate trigger with NPLC 0.001 and auto-zero OFF.
