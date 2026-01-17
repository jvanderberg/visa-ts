# Fluke Bench Digital Multimeter SCPI Reference

> Fluke 8845A and 8846A Precision Multimeters

## Supported Models

| Model | Digits | DC Accuracy | Reading Rate | Key Features |
|-------|--------|-------------|--------------|--------------|
| 8845A | 6.5 | 0.0024% | 100 rdg/s | Single display |
| 8846A | 6.5 | 0.0024% | 100 rdg/s | Dual display, graphing |

**Key Differences:**
- 8846A has dual display for viewing two measurements simultaneously
- 8846A includes trend plot and histogram functions
- Both share identical measurement specifications

---

## Connection Methods

| Interface | Details |
|-----------|---------|
| USB | USB-TMC, VID varies |
| LAN | Port 3490 (default SCPI socket) |
| GPIB | IEEE-488.2 |
| RS-232 | 9600-115200 baud |

**Resource String Examples:**
```
USB0::0x0F7E::0x8845::01234567::INSTR
TCPIP0::192.168.1.100::3490::SOCKET
GPIB0::5::INSTR
ASRL/dev/ttyUSB0::INSTR
```

**Note:** Default LAN port is 3490, not 5025 like most other DMMs.

---

## IEEE 488.2 Common Commands

```
*IDN?                → "FLUKE,8846A,1234567,01.00"
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

### Function Selection with CONFigure

```
CONFigure:VOLTage:DC [<range>[,<resolution>]]     → DC Voltage
CONFigure:VOLTage:AC [<range>[,<resolution>]]     → AC Voltage
CONFigure:CURRent:DC [<range>[,<resolution>]]     → DC Current
CONFigure:CURRent:AC [<range>[,<resolution>]]     → AC Current
CONFigure:RESistance [<range>[,<resolution>]]     → 2-Wire Resistance
CONFigure:FRESistance [<range>[,<resolution>]]    → 4-Wire Resistance
CONFigure:FREQuency [<range>[,<resolution>]]      → Frequency
CONFigure:PERiod [<range>[,<resolution>]]         → Period
CONFigure:CONTinuity                              → Continuity
CONFigure:DIODe                                   → Diode Test
CONFigure:TEMPerature [<probe_type>[,<type>]]     → Temperature
CONFigure:CAPacitance [<range>]                   → Capacitance
CONFigure?                                        → Query current config
```

### Quick Measurement with MEASure

```
MEASure:VOLTage:DC? [<range>[,<resolution>]]      → Measure DC voltage
MEASure:VOLTage:AC? [<range>[,<resolution>]]      → Measure AC voltage
MEASure:CURRent:DC? [<range>[,<resolution>]]      → Measure DC current
MEASure:CURRent:AC? [<range>[,<resolution>]]      → Measure AC current
MEASure:RESistance? [<range>[,<resolution>]]      → Measure 2-wire resistance
MEASure:FRESistance? [<range>[,<resolution>]]     → Measure 4-wire resistance
MEASure:FREQuency?                                → Measure frequency
MEASure:PERiod?                                   → Measure period
MEASure:CONTinuity?                               → Test continuity
MEASure:DIODe?                                    → Test diode
MEASure:TEMPerature?                              → Measure temperature
MEASure:CAPacitance?                              → Measure capacitance
```

### Query Current Function

```
FUNCtion?                                         → Returns current function
```

---

## Range Control

### DC Voltage Ranges

```
[SENSe:]VOLTage:DC:RANGe {0.1|1|10|100|1000}      → Set range (V)
[SENSe:]VOLTage:DC:RANGe?                         → Query range
[SENSe:]VOLTage:DC:RANGe:AUTO {ON|OFF}            → Auto-range
[SENSe:]VOLTage:DC:RANGe:AUTO?
```

**Available Ranges:** 100mV, 1V, 10V, 100V, 1000V

### AC Voltage Ranges

```
[SENSe:]VOLTage:AC:RANGe {0.1|1|10|100|750}       → Set range (V)
[SENSe:]VOLTage:AC:RANGe?
[SENSe:]VOLTage:AC:RANGe:AUTO {ON|OFF}
```

**Available Ranges:** 100mV, 1V, 10V, 100V, 750V

### DC Current Ranges

```
[SENSe:]CURRent:DC:RANGe {0.0001|0.001|0.01|0.1|1|10}  → Set range (A)
[SENSe:]CURRent:DC:RANGe?
[SENSe:]CURRent:DC:RANGe:AUTO {ON|OFF}
```

**Available Ranges:** 100µA, 1mA, 10mA, 100mA, 1A, 10A

### AC Current Ranges

```
[SENSe:]CURRent:AC:RANGe {0.001|0.01|0.1|1|10}    → Set range (A)
[SENSe:]CURRent:AC:RANGe?
[SENSe:]CURRent:AC:RANGe:AUTO {ON|OFF}
```

**Available Ranges:** 1mA, 10mA, 100mA, 1A, 10A

### Resistance Ranges

```
[SENSe:]RESistance:RANGe {10|100|1E3|10E3|100E3|1E6|10E6|100E6|1E9}
[SENSe:]RESistance:RANGe?
[SENSe:]RESistance:RANGe:AUTO {ON|OFF}
```

**Available Ranges:** 10Ω, 100Ω, 1kΩ, 10kΩ, 100kΩ, 1MΩ, 10MΩ, 100MΩ, 1GΩ

### Capacitance Ranges

```
[SENSe:]CAPacitance:RANGe {1E-9|10E-9|100E-9|1E-6|10E-6|100E-6}
[SENSe:]CAPacitance:RANGe?
[SENSe:]CAPacitance:RANGe:AUTO {ON|OFF}
```

**Available Ranges:** 1nF, 10nF, 100nF, 1µF, 10µF, 100µF

---

## Integration Time (NPLC)

```
[SENSe:]VOLTage:DC:NPLC {0.1|1|10|100}            → Set NPLC
[SENSe:]VOLTage:DC:NPLC?                          → Query NPLC
```

**NPLC Values:**
| NPLC | Integration Time (60Hz) | Readings/sec | Noise Rejection |
|------|------------------------|--------------|-----------------|
| 0.1 | 1.67 ms | ~100 | Poor |
| 1 | 16.67 ms | ~20 | Normal (60dB) |
| 10 | 166.7 ms | ~5 | Good |
| 100 | 1.667 s | ~0.5 | Best |

**Applies to:** VOLTage:DC, VOLTage:AC, CURRent:DC, CURRent:AC, RESistance, FRESistance

---

## Auto-Zero

```
[SENSe:]VOLTage:DC:ZERO:AUTO {ON|OFF|ONCE}        → Auto-zero control
[SENSe:]VOLTage:DC:ZERO:AUTO?
```

- **ON**: Auto-zero every measurement
- **OFF**: No auto-zero (fastest)
- **ONCE**: Single auto-zero, then hold

---

## Taking Measurements

### READ vs FETCH

```
READ?                            → Initiate and read (blocking)
FETCh?                           → Return last reading
INITiate[:IMMediate]             → Start measurement (non-blocking)
```

### Sample/Trigger Count

```
SAMPle:COUNt <n>                 → Samples per trigger (1 to 50000)
SAMPle:COUNt?
TRIGger:COUNt <n>                → Number of triggers (1 to 50000)
TRIGger:COUNt?
```

---

## Trigger System

### Trigger Source

```
TRIGger:SOURce {IMMediate|BUS|EXTernal}           → Trigger source
TRIGger:SOURce?
```

- **IMMediate**: Trigger immediately
- **BUS**: Wait for *TRG command
- **EXTernal**: External trigger input

### Trigger Delay

```
TRIGger:DELay <seconds>                           → Trigger delay (0 to 3600s)
TRIGger:DELay?
TRIGger:DELay:AUTO {ON|OFF}                       → Auto delay
TRIGger:DELay:AUTO?
```

### External Trigger

```
TRIGger:LEVel <volts>                             → Trigger level (TTL threshold)
TRIGger:SLOPe {POSitive|NEGative}                 → Trigger edge
TRIGger:SLOPe?
```

### Software Trigger

```
*TRG                             → IEEE-488.2 trigger
TRIGger[:IMMediate]              → SCPI trigger
```

---

## Null (Relative) Measurements

```
CALCulate:NULL[:STATe] {ON|OFF}                   → Enable null mode
CALCulate:NULL[:STATe]?
CALCulate:NULL:VALue <value>                      → Set null offset
CALCulate:NULL:VALue?
```

**Auto-acquire null:**
1. Set up measurement
2. Apply zero input
3. Use current reading as null: `CALC:NULL:VAL?` to query, then `CALC:NULL:VAL <value>`
4. Enable null: `CALC:NULL ON`

---

## Statistics (Min/Max/Average)

```
CALCulate:STATistics[:STATe] {ON|OFF}             → Enable statistics
CALCulate:STATistics[:STATe]?
CALCulate:MINimum?                                → Minimum reading
CALCulate:MAXimum?                                → Maximum reading
CALCulate:AVERage?                                → Average reading
CALCulate:COUNt?                                  → Reading count
CALCulate:CLEar[:IMMediate]                       → Clear statistics
```

---

## Limits Testing

```
CALCulate:LIMit[:STATe] {ON|OFF}                  → Enable limits
CALCulate:LIMit[:STATe]?
CALCulate:LIMit:LOWer[:DATA] <value>              → Lower limit
CALCulate:LIMit:LOWer?
CALCulate:LIMit:UPPer[:DATA] <value>              → Upper limit
CALCulate:LIMit:UPPer?
CALCulate:LIMit:CLEar[:IMMediate]                 → Clear limit status
```

---

## dB/dBm Measurements

### dB Mode

```
[SENSe:]VOLTage:AC:DB[:STATe] {ON|OFF}            → Enable dB
[SENSe:]VOLTage:AC:DB:REFerence <dBm>             → dB reference
```

### dBm Mode

```
[SENSe:]VOLTage:AC:DBM[:STATe] {ON|OFF}           → Enable dBm
[SENSe:]VOLTage:AC:DBM:REFerence <ohms>           → Reference impedance
```

**Standard Impedances:** 50, 75, 93, 110, 124, 125, 135, 150, 250, 300, 500, 600, 800, 900, 1000, 1200, 8000

---

## AC Peak Detection

The 8845A/8846A can measure AC peak values:

```
[SENSe:]VOLTage:AC:PEAK?                          → Query positive peak
[SENSe:]VOLTage:AC:PEAK:HIGH?                     → Positive peak
[SENSe:]VOLTage:AC:PEAK:LOW?                      → Negative peak
```

---

## Temperature Measurement

### Thermocouple

```
CONFigure:TEMPerature TC,<type>
```

**Types:** J, K, T, E, N, R, S, B, C

```
[SENSe:]TEMPerature:TRANsducer:TCouple:TYPE {J|K|T|E|N|R|S|B|C}
[SENSe:]TEMPerature:TRANsducer:TCouple:RJUNction:TYPE {INTernal|EXTernal}
[SENSe:]TEMPerature:TRANsducer:TCouple:RJUNction:OFFSet <temp>
```

### RTD

```
CONFigure:TEMPerature RTD,<type>
```

**Types:** PT100, PT385, PT3926, PT3916

```
[SENSe:]TEMPerature:TRANsducer:RTD:TYPE {PT100|PT385|PT3926|PT3916}
[SENSe:]TEMPerature:TRANsducer:FRTD:TYPE {PT100|PT385|PT3926|PT3916}  → 4-wire
```

### Thermistor

```
CONFigure:TEMPerature THERmistor,<type>
```

**Types:** 2252, 5000, 10000

```
[SENSe:]TEMPerature:TRANsducer:THERmistor:TYPE {2252|5000|10000}
```

### Temperature Units

```
UNIT:TEMPerature {C|F|K}                          → Celsius/Fahrenheit/Kelvin
UNIT:TEMPerature?
```

---

## AC Bandwidth

```
[SENSe:]VOLTage:AC:BANDwidth {SLOW|MEDium|FAST}   → Set bandwidth
[SENSe:]VOLTage:AC:BANDwidth?
```

| Setting | Bandwidth | Low Freq Accuracy | Notes |
|---------|-----------|-------------------|-------|
| SLOW | 3 Hz - 300 kHz | Best | For low frequencies |
| MEDium | 20 Hz - 300 kHz | Good | Default |
| FAST | 200 Hz - 300 kHz | Limited | Fastest response |

---

## Secondary Display (8846A Only)

The 8846A has dual display capability:

```
CONFigure:SECondary <function>                    → Set secondary function
CONFigure:SECondary?
FETCh:SECondary?                                  → Read secondary display
```

**Secondary Functions:**
- For AC Voltage: `FREQ` (frequency), `PER` (period)
- For DC Voltage: `COMP` (compare)

---

## Data Logging

### Buffer Configuration

```
DATA:DELete[:ALL]                                 → Clear buffer
DATA:POINts?                                      → Readings in buffer
DATA:POINts:MAXimum?                              → Maximum buffer size (50000)
```

### Reading Data

```
DATA?                                             → All readings
DATA:REMove? <count>                              → Read and remove
DATA:LAST?                                        → Last reading
```

---

## System Commands

### Error Query

```
SYSTem:ERRor[:NEXT]?                              → Get next error
```

### Beeper

```
SYSTem:BEEPer[:IMMediate]                         → Beep once
SYSTem:BEEPer:STATe {ON|OFF}                      → Enable/disable beeper
```

### Display

```
DISPlay[:STATe] {ON|OFF}                          → Display on/off
DISPlay:TEXT "<message>"                          → Show custom text
DISPlay:TEXT:CLEar                                → Clear custom text
```

### Remote/Local

```
SYSTem:REMote                                     → Enter remote mode
SYSTem:LOCal                                      → Return to local mode
SYSTem:RWLock                                     → Remote with lockout
```

### Input Terminals

```
ROUTe:TERMinals {FRONt|REAR}                      → Select front/rear
ROUTe:TERMinals?
```

---

## Trend Plot (8846A)

```
CALCulate:TRENd[:STATe] {ON|OFF}                  → Enable trend display
CALCulate:TRENd:SCALe:AUTO {ON|OFF}               → Auto-scale Y axis
CALCulate:TRENd:SCALe:LOWer <value>               → Y-axis minimum
CALCulate:TRENd:SCALe:UPPer <value>               → Y-axis maximum
```

---

## Histogram (8846A)

```
CALCulate:HISTogram[:STATe] {ON|OFF}              → Enable histogram
CALCulate:HISTogram:RANGe:AUTO {ON|OFF}           → Auto bin range
CALCulate:HISTogram:RANGe:LOWer <value>           → Lower bin edge
CALCulate:HISTogram:RANGe:UPPer <value>           → Upper bin edge
CALCulate:HISTogram:DATA?                         → Bin counts
```

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
VOLT:DC:NPLC 0.1                 # Minimum NPLC
VOLT:DC:ZERO:AUTO OFF            # Disable auto-zero
SAMP:COUN 1000
TRIG:SOUR IMM
TRIG:DEL 0
INIT
*OPC?
DATA:REM? 1000                   # Get all readings
```

### Statistics Collection

```
*RST
CONF:VOLT:DC AUTO
VOLT:DC:NPLC 10
CALC:STAT ON                     # Enable statistics
SAMP:COUN 100
INIT
*OPC?
CALC:AVER?                       # Average
CALC:MIN?                        # Minimum
CALC:MAX?                        # Maximum
CALC:COUN?                       # Count
```

### Temperature with K-Type Thermocouple

```
*RST
CONF:TEMP TC,K                   # K-type thermocouple
UNIT:TEMP C                      # Celsius
TEMP:TRAN:TC:RJUN:TYPE INT       # Internal reference junction
READ?
```

### AC Voltage with Frequency

```
*RST
CONF:VOLT:AC 10
CONF:SEC FREQ                    # Secondary display = frequency (8846A)
READ?                            # Primary (voltage)
FETC:SEC?                        # Secondary (frequency)
```

### Limit Testing

```
*RST
CONF:VOLT:DC 10
CALC:LIM:LOW 4.9                 # Lower limit 4.9V
CALC:LIM:UPP 5.1                 # Upper limit 5.1V
CALC:LIM ON                      # Enable limits
READ?                            # Take measurement
# Check status registers for limit failure
```

### Triggered Measurement

```
*RST
CONF:VOLT:DC 10
TRIG:SOUR EXT                    # External trigger
TRIG:SLOP POS                    # Positive edge
TRIG:LEV 2.5                     # TTL level
SAMP:COUN 1
TRIG:COUN 100                    # 100 triggers
INIT                             # Arm
# External triggers cause measurements
FETC?                            # Get readings when done
```

---

## Status System

### Status Byte (STB)

| Bit | Weight | Name | Description |
|-----|--------|------|-------------|
| 0 | 1 | - | Not used |
| 1 | 2 | - | Not used |
| 2 | 4 | ERR | Error available |
| 3 | 8 | QSR | Questionable status |
| 4 | 16 | MAV | Message available |
| 5 | 32 | ESB | Event status bit |
| 6 | 64 | RQS | Request service |
| 7 | 128 | OSR | Operation status |

---

## Connection Examples

### Python Socket

```python
import socket

def fluke_query(host, command, port=3490):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(5)
        s.connect((host, port))
        s.sendall((command + '\n').encode())
        return s.recv(4096).decode().strip()

# Example
idn = fluke_query('192.168.1.100', '*IDN?')
print(idn)

voltage = float(fluke_query('192.168.1.100', 'MEAS:VOLT:DC?'))
print(f"Voltage: {voltage} V")
```

### TypeScript with visa-ts

```typescript
import { createResourceManager } from 'visa-ts';

async function measureWithFluke() {
  const rm = createResourceManager();
  // Note: Fluke uses port 3490
  const dmm = await rm.open('TCPIP0::192.168.1.100::3490::SOCKET');

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

1. **Port 3490**: Unlike most DMMs, Fluke uses port 3490 for SCPI socket connections, not 5025.

2. **NPLC Range**: Limited to 0.1, 1, 10, 100 (not as granular as Keysight/Keithley).

3. **Dual Display (8846A)**: True dual display shows two related measurements simultaneously.

4. **AC Peak**: Supports true peak detection for non-sinusoidal waveforms.

5. **Buffer Size**: Maximum 50000 readings in data buffer.

6. **Thermocouple Types**: Includes Type C, which some other DMMs don't support.

7. **Input Protection**: Built-in overload protection on all inputs.

8. **Accuracy**: 0.0024% DC accuracy is excellent for a 6.5 digit meter.
