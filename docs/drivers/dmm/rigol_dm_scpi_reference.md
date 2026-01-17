# Rigol Digital Multimeter SCPI Reference

> Rigol DM858, DM858E, DM3058, and DM3068 Series

## Supported Models

| Model | Digits | DC Accuracy | Reading Rate | Memory | Price Range |
|-------|--------|-------------|--------------|--------|-------------|
| DM858E | 5.5 | 0.06% (1yr) | 80 rdg/s | 20,000 pts | ~$300 |
| DM858 | 5.5 | 0.03% (1yr) | 125 rdg/s | 500,000 pts | ~$400 |
| DM3058 | 5.5 | 0.015% | 123 rdg/s | 2,000 pts | ~$350 |
| DM3068 | 6.5 | 0.0035% | 123 rdg/s | 10,000 pts | ~$600 |

**Key Differences:**
- DM858E: 3A max current, 1mF max capacitance
- DM858: 10A max current, 10mF max capacitance, larger memory
- DM3068: Higher accuracy (6.5 digits), GPIB option

---

## Connection Methods

| Interface | DM858/858E | DM3058/3068 |
|-----------|------------|-------------|
| LAN Socket | Port **5555** | Port **5555** |
| USB | USB-TMC (VID: 0x1AB1) | USB-TMC (VID: 0x1AB1) |
| GPIB | Not available | Optional |
| Web Interface | Yes | Yes |
| mDNS | Yes | Yes |

**Resource String Examples:**
```
USB0::0x1AB1::0x0C94::DM8A000000000::INSTR
TCPIP0::192.168.1.100::5555::SOCKET
TCPIP0::dm858.local::5555::SOCKET
GPIB0::8::INSTR  (DM3068 only)
```

**Note:** Rigol uses port 5555, not 5025.

---

## IEEE 488.2 Common Commands

```
*IDN?                → "RIGOL TECHNOLOGIES,DM858,DM8A000000000,00.01.02.00.02"
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
*TRG                 → Software trigger (when TRIG:SOUR BUS)
*TST?                → Self-test
*PSC {0|1}           → Power-on status clear
```

---

## Measurement Functions

### Function Selection

```
[SENSe:]FUNCtion[:ON] "<function>"                → Set function
[SENSe:]FUNCtion[:ON]?                            → Query function
```

**Function Names:**
```
"VOLT"        or "VOLT:DC"      DC Voltage
"VOLT:AC"                       AC Voltage
"CURR"        or "CURR:DC"      DC Current
"CURR:AC"                       AC Current
"RES"                           2-Wire Resistance
"FRES"                          4-Wire Resistance
"FREQ"                          Frequency
"PER"                           Period
"CAP"                           Capacitance
"CONT"                          Continuity
"DIOD"                          Diode Test
"TEMP:FRTD"                     4-Wire RTD (DM858)
"TEMP:RTD"                      2-Wire RTD
"TEMP:FTHER"                    4-Wire Thermistor (DM858)
"TEMP:THER"                     2-Wire Thermistor
"TEMP:TC"                       Thermocouple (DM858)
```

### Quick Measurement Commands

```
MEASure:VOLTage:DC? [<range>[,<resolution>]]      → Measure and return DC voltage
MEASure:VOLTage:AC? [<range>[,<resolution>]]      → Measure and return AC voltage
MEASure:CURRent:DC? [<range>[,<resolution>]]      → Measure and return DC current
MEASure:CURRent:AC? [<range>[,<resolution>]]      → Measure and return AC current
MEASure:RESistance? [<range>[,<resolution>]]      → Measure 2-wire resistance
MEASure:FRESistance? [<range>[,<resolution>]]     → Measure 4-wire resistance
MEASure:FREQuency?                                → Measure frequency
MEASure:PERiod?                                   → Measure period
MEASure:CAPacitance? [<range>]                    → Measure capacitance
MEASure:CONTinuity?                               → Test continuity
MEASure:DIODe?                                    → Test diode
MEASure:TEMPerature? [<type>,<sensor>]            → Measure temperature
```

### Configure Commands

Configure without triggering:

```
CONFigure:VOLTage:DC [<range>[,<resolution>]]
CONFigure:VOLTage:AC [<range>[,<resolution>]]
CONFigure:CURRent:DC [<range>[,<resolution>]]
CONFigure:CURRent:AC [<range>[,<resolution>]]
CONFigure:RESistance [<range>[,<resolution>]]
CONFigure:FRESistance [<range>[,<resolution>]]
CONFigure:FREQuency
CONFigure:PERiod
CONFigure:CAPacitance [<range>]
CONFigure:CONTinuity
CONFigure:DIODe
CONFigure:TEMPerature [{FRTD|RTD|FTHER|THER|TC}[,<type>]]
CONFigure?                                        → Query configuration
```

---

## Range Control

### DC Voltage Ranges

```
[SENSe:]VOLTage:DC:RANGe {0.1|1|10|100|1000|AUTO|MIN|MAX|DEF}
[SENSe:]VOLTage:DC:RANGe?
[SENSe:]VOLTage:DC:RANGe:AUTO {ON|OFF|ONCE}
[SENSe:]VOLTage:DC:RANGe:AUTO?
```

**Available Ranges:** 100mV, 1V, 10V, 100V, 1000V

### AC Voltage Ranges

```
[SENSe:]VOLTage:AC:RANGe {0.1|1|10|100|750|AUTO|MIN|MAX|DEF}
[SENSe:]VOLTage:AC:RANGe?
[SENSe:]VOLTage:AC:RANGe:AUTO {ON|OFF|ONCE}
```

**Available Ranges:** 100mV, 1V, 10V, 100V, 750V

### DC Current Ranges

```
[SENSe:]CURRent:DC:RANGe {0.0001|0.001|0.01|0.1|1|3|10|AUTO}
[SENSe:]CURRent:DC:RANGe?
[SENSe:]CURRent:DC:RANGe:AUTO {ON|OFF|ONCE}
```

**Available Ranges:**
- DM858E: 100µA, 1mA, 10mA, 100mA, 1A, 3A
- DM858: 100µA, 1mA, 10mA, 100mA, 1A, 3A, 10A
- DM3058/3068: 200µA, 2mA, 20mA, 200mA, 2A, 10A

### AC Current Ranges

```
[SENSe:]CURRent:AC:RANGe {0.0001|0.001|0.01|0.1|1|3|10|AUTO}
```

Same ranges as DC current.

### Resistance Ranges

```
[SENSe:]RESistance:RANGe {100|1000|10000|100000|1E6|10E6|50E6|AUTO}
[SENSe:]FRESistance:RANGe {100|1000|10000|100000|1E6|10E6|50E6|AUTO}
```

**Available Ranges:** 100Ω, 1kΩ, 10kΩ, 100kΩ, 1MΩ, 10MΩ, 50MΩ

### Capacitance Ranges

```
[SENSe:]CAPacitance:RANGe {1E-9|10E-9|100E-9|1E-6|10E-6|100E-6|1E-3|10E-3|AUTO}
```

**Available Ranges:**
- DM858E: 1nF, 10nF, 100nF, 1µF, 10µF, 100µF, 1mF
- DM858: 1nF to 10mF

---

## Integration Time (NPLC/Resolution)

### NPLC Setting

```
[SENSe:]VOLTage:DC:NPLC {<nplc>|MIN|MAX|DEF}
[SENSe:]VOLTage:DC:NPLC?
```

**NPLC Values:**
| Model | Fast | Medium | Slow |
|-------|------|--------|------|
| DM858/858E | 0.4 PLC | 5 PLC | 20 PLC |
| DM3058/3068 | 0.02 PLC | 0.2 PLC | 1 PLC, 10 PLC, 100 PLC |

### Resolution Parameter

Rigol supports resolution in MEAS/CONF commands:

```
CONF:VOLT:DC [<range>[,<resolution>]]
MEAS:VOLT:DC? [<range>[,<resolution>]]
```

**Resolution vs Speed:**
| Resolution | Speed | NPLC (DM858) |
|------------|-------|--------------|
| 1000 ppm × range | Fast | 0.4 |
| 100 ppm × range | Medium | 5 |
| 10 ppm × range | Slow | 20 |

---

## Taking Measurements

### READ vs FETCH

```
READ?                            → Initiate and read
FETCh?                           → Return last reading (no new trigger)
INITiate[:IMMediate]             → Start measurement
ABORt                            → Abort measurement
```

### Sample Count

```
SAMPle:COUNt <n>                 → Samples per trigger
SAMPle:COUNt?
```

**Limits:**
- DM858E: 1 to 20,000
- DM858: 1 to 500,000
- DM3068: 1 to 10,000

### Trigger Count

```
TRIGger:COUNt <n>                → Number of triggers
TRIGger:COUNt?
```

---

## Trigger System

### Trigger Source

```
TRIGger:SOURce {IMMediate|EXTernal|BUS|SINGle}
TRIGger:SOURce?
```

- **IMMediate**: Trigger immediately
- **EXTernal**: External trigger input
- **BUS**: Wait for *TRG command
- **SINGle**: Single trigger mode

### Output Trigger

```
OUTPut:TRIGger:SLOPe {POSitive|NEGative}          → Output trigger polarity
OUTPut:TRIGger:SLOPe?
```

---

## Data Buffer

### Query Buffer Status

```
DATA:LAST?                       → Last reading with function
DATA:POINts?                     → Readings in memory
```

### Read Buffer Data

```
DATA:REMove? <n>                 → Read and remove n readings
DATA:REMove? <n>,WAIT            → Wait until n readings available
R? [<n>]                         → Read and remove (binary block)
```

**Binary Block Format:**
Response: `#2XX<data>` where XX is length of data string

### Memory Threshold

```
DATA:POINts:EVENt:THReshold <n>  → Threshold for data ready event
```

---

## Secondary Display (DM858)

The DM858 supports a secondary measurement display:

```
[SENSe:]DATA2?                   → Query secondary measurement
[SENSe:]DATA2:CLEar[:IMMediate]  → Clear secondary data
[SENSe:]<function>:SECondary "<type>"  → Set secondary function
[SENSe:]<function>:SECondary?    → Query secondary function
```

---

## Statistics (Math Functions)

### Enable Statistics

```
CALCulate:AVERage[:STATe] {ON|OFF}                → Enable statistics
CALCulate:AVERage[:STATe]?
```

### Query Statistics

```
CALCulate:AVERage:ALL?           → All stats (avg, stddev, min, max)
CALCulate:AVERage:AVERage?       → Average
CALCulate:AVERage:MINimum?       → Minimum
CALCulate:AVERage:MAXimum?       → Maximum
CALCulate:AVERage:SDEViation?    → Standard deviation
CALCulate:AVERage:COUNt?         → Reading count
CALCulate:AVERage:CLEar[:IMMediate]  → Clear statistics
```

---

## Limits Testing

```
CALCulate:LIMit[:STATe] {ON|OFF}                  → Enable limits
CALCulate:LIMit[:STATe]?
CALCulate:LIMit:UPPer[:DATA] <value>              → Upper limit
CALCulate:LIMit:UPPer?
CALCulate:LIMit:LOWer[:DATA] <value>              → Lower limit
CALCulate:LIMit:LOWer?
CALCulate:LIMit:CLEar[:IMMediate]                 → Clear limit status
```

---

## Null (Relative)

```
[SENSe:]<function>:NULL[:STATe] {ON|OFF}          → Enable null
[SENSe:]<function>:NULL:VALue {<value>|MIN|MAX|DEF}  → Set null offset
[SENSe:]<function>:NULL:VALue:AUTO {ON|OFF}       → Auto-acquire null
```

---

## dB/dBm Scaling

```
CALCulate:SCALe:DB:REFerence <dBm>                → dB reference value
CALCulate:SCALe:DB:REFerence?
CALCulate:SCALe:DBM:REFerence <ohms>              → dBm reference (2-8000Ω)
CALCulate:SCALe:DBM:REFerence?
CALCulate:SCALe:FUNCtion {DB|DBM}                 → Select scaling function
CALCulate:SCALe:FUNCtion?
CALCulate:SCALe[:STATe] {ON|OFF}                  → Enable scaling
CALCulate:SCALe[:STATe]?
```

---

## Temperature Measurement

### Probe Type Selection

```
CONFigure:TEMPerature [{FRTD|RTD|FTHER|THER|TC|DEF}[,<type>]]
```

- **FRTD**: 4-wire RTD
- **RTD**: 2-wire RTD
- **FTHER**: 4-wire Thermistor (DM858 only)
- **THER**: 2-wire Thermistor
- **TC**: Thermocouple (DM858 only)

### RTD Configuration

```
[SENSe:]TEMPerature:TRANsducer:RTD:TYPE {385|389|391|392}
[SENSe:]TEMPerature:TRANsducer:FRTD:TYPE {385|389|391|392}
```

**RTD Alpha Values:**
- 385: α = 0.00385 (IEC 751, most common)
- 389: α = 0.003890
- 391: α = 0.003910
- 392: α = 0.003920

### Thermistor Configuration

```
[SENSe:]TEMPerature:TRANsducer:THERmistor:TYPE {2200|3000|5000|10000|30000}
[SENSe:]TEMPerature:TRANsducer:FTHermistor:TYPE {2200|3000|5000|10000|30000}
```

**Types:** Resistance in ohms at 25°C

### Thermocouple Configuration (DM858)

```
[SENSe:]TEMPerature:TRANsducer:TCouple:TYPE {B|E|J|K|N|R|S|T}
[SENSe:]TEMPerature:TRANsducer:TCouple:RJUNction:TYPE {INTernal|SIMulated}
[SENSe:]TEMPerature:TRANsducer:TCouple:RJUNction:SIMulated <temp>
```

### Temperature Units

```
UNIT:TEMPerature {C|F|K}
UNIT:TEMPerature?
```

---

## System Commands

### Error Query

```
SYSTem:ERRor[:NEXT]?             → Get next error
SYSTem:VERSion?                  → SCPI version
```

### Beeper

```
SYSTem:BEEPer[:IMMediate]        → Beep once
SYSTem:BEEPer:STATe {ON|OFF}     → Enable/disable beeper
```

### Date/Time

```
SYSTem:DATE <year>,<month>,<day> → Set date
SYSTem:DATE?                     → Query date
SYSTem:TIME <hour>,<min>,<sec>   → Set time
SYSTem:TIME?                     → Query time
```

---

## LAN/LXI Commands

### Network Configuration

```
SYSTem:COMMunicate:LAN:IPADdress "<address>"      → Set IP address
SYSTem:COMMunicate:LAN:IPADdress?
SYSTem:COMMunicate:LAN:SMASk "<mask>"             → Subnet mask
SYSTem:COMMunicate:LAN:GATeway "<gateway>"        → Gateway
SYSTem:COMMunicate:LAN:DHCP {ON|OFF}              → Enable DHCP
SYSTem:COMMunicate:LAN:AUToip {ON|OFF}            → Auto-IP
SYSTem:COMMunicate:LAN:MANuip {ON|OFF}            → Manual IP
SYSTem:COMMunicate:LAN:DNS "<address>"            → DNS server
SYSTem:COMMunicate:LAN:HOSTname "<name>"          → Hostname
SYSTem:COMMunicate:LAN:MAC?                       → MAC address
```

### LXI Commands

```
LXI:MDNS:ENABle {ON|OFF}         → Enable mDNS discovery
LXI:RESet                        → Reset LAN to defaults
LXI:RESTart                      → Apply settings and restart LAN
```

---

## Screenshot

```
HCOPy:SDUMp:DATA?                → Get screenshot data
HCOPy:SDUMp:DATA:FORMat {PNG|BMP}  → Set format
HCOPy:SDUMp:DATA:FORMat?         → Query format
```

---

## File/Memory Operations

```
MMEMory:CATalog[:ALL]?           → List files
MMEMory:CDIRectory "<path>"      → Change directory
MMEMory:COPY "<src>","<dst>"     → Copy file
MMEMory:DELete "<file>"          → Delete file
MMEMory:MDIRectory "<path>"      → Make directory
MMEMory:MOVE "<src>","<dst>"     → Move/rename file
MMEMory:RDIRectory "<path>"      → Remove directory
MMEMory:LOAD:PREFerence "<file>" → Load preferences
MMEMory:LOAD:STATe "<file>"      → Load state
MMEMory:STORe:PREFerence "<file>" → Store preferences
MMEMory:STORe:STATe "<file>"     → Store state
MMEMory:STORe:DATA "<file>"      → Store data
MMEMory:STATe:RECall:AUTO {ON|OFF}  → Auto-recall on power-up
```

---

## Programming Examples

### Basic DC Voltage Measurement

```
*RST
CONF:VOLT:DC 10                  # 10V range
VOLT:DC:NPLC 5                   # Medium speed
READ?                            # Take measurement
```

### High-Speed Acquisition

```
*RST
CONF:VOLT:DC 10
VOLT:DC:NPLC 0.4                 # Fast mode
SAMP:COUN 1000
TRIG:SOUR IMM
INIT
*OPC?
DATA:REM? 1000                   # Get all readings
```

### Statistics Collection

```
*RST
CONF:VOLT:DC AUTO
VOLT:DC:NPLC 5
CALC:AVER ON                     # Enable statistics
SAMP:COUN 100
TRIG:SOUR IMM
INIT
*OPC?
CALC:AVER:ALL?                   # Returns avg,stddev,min,max
CALC:AVER:COUN?                  # Reading count
```

### Temperature with K-Type Thermocouple (DM858)

```
*RST
CONF:TEMP TC,K                   # K-type thermocouple
UNIT:TEMP C                      # Celsius
TEMP:TRAN:TC:RJUN:TYPE INT       # Internal ref junction
READ?
```

### Temperature with PT100 RTD

```
*RST
CONF:TEMP FRTD,385               # 4-wire RTD, α=0.00385
UNIT:TEMP C
READ?
```

### Limit Testing

```
*RST
CONF:VOLT:DC 10
CALC:LIM:LOW 4.9                 # Lower limit
CALC:LIM:UPP 5.1                 # Upper limit
CALC:LIM ON                      # Enable
READ?                            # Take measurement
# Reading returns 9.9E37 if out of limits
```

### Get Screenshot

```python
import socket

def get_screenshot(host, port=5555):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(5)
        s.connect((host, port))
        s.sendall(b'HCOP:SDUM:DATA:FORM PNG\n')
        s.sendall(b'HCOP:SDUM:DATA?\n')
        time.sleep(0.5)
        data = s.recv(65536)
        # Parse binary block header
        return data

screenshot_data = get_screenshot('192.168.1.100')
```

---

## Connection Examples

### Python Socket

```python
import socket
import time

def rigol_query(host, command, port=5555):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(5)
        s.connect((host, port))
        s.sendall((command + '\n').encode())
        time.sleep(0.05)
        return s.recv(4096).decode().strip()

# Example
idn = rigol_query('192.168.1.100', '*IDN?')
print(idn)

voltage = float(rigol_query('192.168.1.100', 'MEAS:VOLT:DC?'))
print(f"Voltage: {voltage} V")

# With specified range and resolution
voltage = float(rigol_query('192.168.1.100', 'MEAS:VOLT:DC? 10,0.00001'))
print(f"Voltage (high res): {voltage} V")
```

### TypeScript with visa-ts

```typescript
import { createResourceManager } from 'visa-ts';

async function measureWithRigol() {
  const rm = createResourceManager();
  // Note: Rigol uses port 5555
  const dmm = await rm.open('TCPIP0::192.168.1.100::5555::SOCKET');

  await dmm.write('CONF:VOLT:DC 10');
  await dmm.write('VOLT:DC:NPLC 5');

  const result = await dmm.query('READ?');
  if (result.ok) {
    console.log(`Voltage: ${parseFloat(result.value)} V`);
  }

  await dmm.close();
}
```

---

## Notes

1. **Port 5555**: Rigol DMMs use port 5555, not 5025.

2. **Resolution Parameter**: Rigol uniquely supports resolution in MEAS/CONF commands.

3. **Memory Capacity**: DM858 has massive 500,000 point memory; DM858E has 20,000.

4. **Thermocouple**: Only DM858 (not 858E) supports thermocouple measurement.

5. **4-Wire Thermistor**: Only available on DM858.

6. **mDNS**: Supports discovery via `dm858.local` or similar hostnames.

7. **Statistics Format**: `CALC:AVER:ALL?` returns comma-separated: avg,stddev,min,max.

8. **Web Interface**: All models have web interface for remote monitoring.
