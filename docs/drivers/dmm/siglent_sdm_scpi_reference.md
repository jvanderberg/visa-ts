# Siglent Digital Multimeter SCPI Reference

> Siglent SDM3045X, SDM3055, SDM3065X, and SDM3065X-SC Series

## Supported Models

| Model | Digits | DC Accuracy | Reading Rate | Memory | Key Features |
|-------|--------|-------------|--------------|--------|--------------|
| SDM3045X | 4.5 | 0.025% | 150 rdg/s | 1,000 pts | Budget option |
| SDM3055 | 5.5 | 0.015% | 150 rdg/s | 1,000 pts | Best value |
| SDM3065X | 6.5 | 0.0035% | 150 rdg/s | 10,000 pts | High accuracy |
| SDM3065X-SC | 6.5 | 0.0035% | 150 rdg/s | 10,000 pts | + Scanner card |

**All models include:**
- Dual display (primary + secondary measurement)
- USB and LAN connectivity
- True RMS AC measurements
- Temperature measurement (RTD, thermistor)

---

## Connection Methods

| Interface | Details |
|-----------|---------|
| LAN Socket | Port **5025** (SCPI raw socket) |
| LAN Telnet | Port 5024 |
| USB | VID: 0xF4EC, USB-TMC class |
| GPIB | Optional adapter |

**Resource String Examples:**
```
USB0::0xF4EC::0xEE3A::SDM35GBQ0000000::INSTR
TCPIP0::192.168.1.100::5025::SOCKET
TCPIP0::192.168.1.100::inst0::INSTR
```

---

## IEEE 488.2 Common Commands

```
*IDN?                → "Siglent Technologies,SDM3065X,SDM35GBQ0000000,1.01.01.25"
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
"TEMP"                          Temperature
```

### Quick Measurement Commands

```
MEASure:VOLTage:DC? [<range>]                     → Measure DC voltage
MEASure:VOLTage:AC? [<range>]                     → Measure AC voltage
MEASure:CURRent:DC? [<range>]                     → Measure DC current
MEASure:CURRent:AC? [<range>]                     → Measure AC current
MEASure:RESistance? [<range>]                     → Measure 2-wire resistance
MEASure:FRESistance? [<range>]                    → Measure 4-wire resistance
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
CONFigure:VOLTage:DC [<range>]
CONFigure:VOLTage:AC [<range>]
CONFigure:CURRent:DC [<range>]
CONFigure:CURRent:AC [<range>]
CONFigure:RESistance [<range>]
CONFigure:FRESistance [<range>]
CONFigure:FREQuency
CONFigure:PERiod
CONFigure:CAPacitance [<range>]
CONFigure:CONTinuity
CONFigure:DIODe
CONFigure:TEMPerature [{RTD|THER|DEF}[,<type>]]
CONFigure?                                        → Query configuration
```

---

## Range Control

### DC Voltage Ranges

**SDM3045X:**
```
[SENSe:]VOLTage:DC:RANGe {0.6|6|60|600|1000|AUTO|MIN|MAX|DEF}
```
Ranges: 600mV, 6V, 60V, 600V, 1000V

**SDM3055/SDM3065X:**
```
[SENSe:]VOLTage:DC:RANGe {0.2|2|20|200|1000|AUTO|MIN|MAX|DEF}
```
Ranges: 200mV, 2V, 20V, 200V, 1000V

### AC Voltage Ranges

**SDM3045X:**
```
[SENSe:]VOLTage:AC:RANGe {0.6|6|60|600|750|AUTO|MIN|MAX|DEF}
```

**SDM3055/SDM3065X:**
```
[SENSe:]VOLTage:AC:RANGe {0.2|2|20|200|750|AUTO|MIN|MAX|DEF}
```

### DC Current Ranges

```
[SENSe:]CURRent:DC:RANGe {0.0002|0.002|0.02|0.2|2|10|AUTO|MIN|MAX|DEF}
```

**Available Ranges:** 200µA, 2mA, 20mA, 200mA, 2A, 10A

### AC Current Ranges

```
[SENSe:]CURRent:AC:RANGe {0.02|0.2|2|10|AUTO|MIN|MAX|DEF}
```

**Available Ranges:** 20mA, 200mA, 2A, 10A

Note: 200µA and 2mA only available in DC mode.

### Resistance Ranges

```
[SENSe:]RESistance:RANGe {200|2000|20000|200000|2E6|10E6|100E6|AUTO}
[SENSe:]FRESistance:RANGe {200|2000|20000|200000|2E6|10E6|100E6|AUTO}
```

**Available Ranges:** 200Ω, 2kΩ, 20kΩ, 200kΩ, 2MΩ, 10MΩ, 100MΩ

### Capacitance Ranges

```
[SENSe:]CAPacitance:RANGe {2E-9|20E-9|200E-9|2E-6|20E-6|200E-6|10000E-6|AUTO}
```

**Available Ranges:** 2nF, 20nF, 200nF, 2µF, 20µF, 200µF, 10mF

### Auto-Range Control

```
[SENSe:]<function>:RANGe:AUTO {ON|OFF|ONCE}
[SENSe:]<function>:RANGe:AUTO?
```

---

## Integration Time (NPLC)

```
[SENSe:]VOLTage:DC:NPLC {<nplc>|MIN|MAX|DEF}
[SENSe:]VOLTage:DC:NPLC?
```

**NPLC Values by Model:**

| Model | Available NPLC Values |
|-------|----------------------|
| SDM3045X | 0.3, 1, 10 |
| SDM3055 | 0.3, 1, 10 |
| SDM3065X | 0.005, 0.05, 0.5, 1, 10, 100 |

**Speed vs Accuracy:**
| NPLC | Reading Rate | Noise Rejection |
|------|--------------|-----------------|
| 0.005 | ~150 rdg/s | Lowest |
| 0.05 | ~100 rdg/s | Low |
| 0.3 | ~50 rdg/s | Moderate |
| 1 | ~20 rdg/s | Good (60dB) |
| 10 | ~5 rdg/s | Better |
| 100 | ~0.5 rdg/s | Best |

---

## Taking Measurements

### READ vs FETCH

```
READ?                            → Initiate and read (blocking)
FETCh?                           → Return last reading
INITiate[:IMMediate]             → Start measurement (non-blocking)
ABORt                            → Abort measurement
```

### Sample Count

```
SAMPle:COUNt <n>                 → Samples per trigger
SAMPle:COUNt?
```

**Limits:**
- SDM3045X/SDM3055: 1 to 1,000
- SDM3065X: 1 to 10,000

### Trigger Count

```
TRIGger:COUNt <n>                → Number of triggers
TRIGger:COUNt?
```

---

## Trigger System

### Trigger Source

```
TRIGger:SOURce {IMMediate|EXTernal|BUS}
TRIGger:SOURce?
```

- **IMMediate**: Trigger immediately on INIT
- **EXTernal**: Wait for external trigger
- **BUS**: Wait for *TRG command

### Trigger Delay

```
TRIGger:DELay <seconds>                           → Delay after trigger
TRIGger:DELay?
```

### Trigger Slope (External)

```
TRIGger:SLOPe {POSitive|NEGative}                 → Trigger edge
TRIGger:SLOPe?
```

### Output Trigger

```
OUTPut:TRIGger:SLOPe {POSitive|NEGative}          → Output trigger polarity
OUTPut:TRIGger:SLOPe?
```

---

## Data Buffer

### Query Buffer Status

```
DATA:LAST?                       → Last reading
DATA:POINts?                     → Readings in memory
```

### Read Buffer Data

```
DATA:REMove? <n>                 → Read and remove n readings
R? [<n>]                         → Read and remove (alternative)
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

**Response format for ALL?:**
`<average>,<stddev>,<min>,<max>`

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

**Example:**
```
VOLT:DC:NULL:VAL:AUTO ON         # Use next reading as null
VOLT:DC:NULL ON                  # Enable null subtraction
READ?                            # Returns value - offset
```

---

## dB/dBm Scaling

```
CALCulate:SCALe:DB:REFerence <dBm>                → dB reference value
CALCulate:SCALe:DBM:REFerence <ohms>              → dBm reference impedance
CALCulate:SCALe:FUNCtion {DB|DBM}                 → Select function
CALCulate:SCALe[:STATe] {ON|OFF}                  → Enable scaling
```

---

## Histogram

```
CALCulate:HISTogram[:STATe] {ON|OFF}              → Enable histogram
CALCulate:HISTogram:DATA?                         → Get histogram data
```

---

## Trend Chart

```
CALCulate:TRENd[:STATe] {ON|OFF}                  → Enable trend
CALCulate:TRENd:DATA?                             → Get trend data
```

---

## Temperature Measurement

### Probe Type Selection

```
CONFigure:TEMPerature [{RTD|THER|DEF}[,{<type>|DEF}]]
```

### RTD Configuration

```
[SENSe:]TEMPerature:TRANsducer:RTD:TYPE {PT100|PT1000}
```

- **PT100**: 100Ω at 0°C (most common)
- **PT1000**: 1000Ω at 0°C

### Thermistor Configuration

Thermistor types use ITS-90 temperature scale:

```
[SENSe:]TEMPerature:TRANsducer:THERmistor:TYPE <type>
```

**Types:**
- BITS90, EITS90, JITS90, KITS90, NITS90, RITS90, SITS90, TITS90

### Temperature Units

```
UNIT:TEMPerature {C|F|K}
UNIT:TEMPerature?
```

---

## Scanner Card (SDM3065X-SC Only)

The SDM3065X-SC supports the SC1016 scanner card (16 channels):

### Scanner State

```
ROUTe:STATe?                     → Query scanner state
ROUTe:SCAN {ON|OFF}              → Enable/disable scanning
ROUTe:START {ON|OFF}             → Start/stop scan
```

### Scan Mode

```
ROUTe:FUNCtion {SCAN|STEP}       → Scan mode vs step mode
```

- **SCAN**: Automatic sequential scanning
- **STEP**: Manual channel stepping

### Scan Configuration

```
ROUTe:DELay <seconds>            → Inter-channel delay
ROUTe:COUNt <n>                  → Number of scans
ROUTe:COUNt:AUTO {ON|OFF}        → Continuous scanning
```

### Channel Configuration

```
ROUTe:CHANnel <ch>,<sw>,<mode>,<range>,<speed>
ROUTe:CHANnel? <ch>              → Query channel config
```

**Parameters:**
- `<ch>`: Channel number (1-16)
- `<sw>`: Switch state (0=off, 1=on)
- `<mode>`: Measurement mode
- `<range>`: Measurement range
- `<speed>`: Measurement speed

### Channel Data

```
ROUTe:DATA? <ch>                 → Read channel data
```

### Channel Limits

```
ROUTe:LIMit:HIGH <value>         → Channel high limit
ROUTe:LIMit:LOW <value>          → Channel low limit
```

---

## System Commands

### Error Query

```
SYSTem:ERRor[:NEXT]?             → Get next error
```

### Beeper

```
SYSTem:BEEPer[:IMMediate]        → Beep once
SYSTem:BEEPer:STATe {ON|OFF}     → Enable/disable beeper
```

### Preset

```
SYSTem:PRESet                    → Reset configuration
```

---

## LAN Configuration

```
SYSTem:COMMunicate:LAN:IPADdress "<address>"      → Set IP address
SYSTem:COMMunicate:LAN:IPADdress?
SYSTem:COMMunicate:LAN:SMASk "<mask>"             → Subnet mask
SYSTem:COMMunicate:LAN:GATeway "<gateway>"        → Gateway
SYSTem:COMMunicate:GPIB:ADDRess <address>         → GPIB address
```

---

## Programming Examples

### Basic DC Voltage Measurement

```
*RST
CONF:VOLT:DC 20                  # 20V range
VOLT:DC:NPLC 1                   # 1 PLC
READ?                            # Take measurement
```

### High-Speed Acquisition (SDM3065X)

```
*RST
CONF:VOLT:DC 20
VOLT:DC:NPLC 0.005               # Fastest
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
VOLT:DC:NPLC 10                  # High accuracy
CALC:AVER ON                     # Enable statistics
SAMP:COUN 100
TRIG:SOUR IMM
INIT
*OPC?
CALC:AVER:ALL?                   # avg,stddev,min,max
CALC:AVER:COUN?                  # Count
```

### Temperature with PT100 RTD

```
*RST
CONF:TEMP RTD,PT100              # PT100 RTD
UNIT:TEMP C                      # Celsius
READ?
```

### Limit Testing

```
*RST
CONF:VOLT:DC 20
CALC:LIM:LOW 4.5                 # Lower limit
CALC:LIM:UPP 5.5                 # Upper limit
CALC:LIM ON                      # Enable
READ?                            # Take measurement
```

### Null/Relative Measurement

```
*RST
CONF:VOLT:DC 2                   # 2V range
# Short inputs for zero reference
VOLT:DC:NULL:VAL:AUTO ON         # Auto-acquire null
VOLT:DC:NULL ON                  # Enable null
READ?                            # Reads value minus null offset
```

### Scanner Card Example (SDM3065X-SC)

```
*RST
# Configure channel 1 for DC voltage, 10V range, medium speed
ROUT:CHAN 1,1,DCV,10,MED
ROUT:CHAN 2,1,DCV,10,MED
ROUT:CHAN 3,1,DCV,10,MED
ROUT:DEL 0.1                     # 100ms between channels
ROUT:COUN 10                     # 10 scans
ROUT:FUNC SCAN                   # Auto-scan mode
ROUT:SCAN ON                     # Enable scanner
ROUT:START ON                    # Start scanning
*OPC?
ROUT:DATA? 1                     # Read channel 1 data
ROUT:DATA? 2                     # Read channel 2 data
ROUT:DATA? 3                     # Read channel 3 data
```

---

## Connection Examples

### Python Socket

```python
import socket
import time

def siglent_query(host, command, port=5025):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(5)
        s.connect((host, port))
        s.sendall((command + '\n').encode())
        time.sleep(0.05)
        return s.recv(4096).decode().strip()

# Example
idn = siglent_query('192.168.1.100', '*IDN?')
print(idn)

voltage = float(siglent_query('192.168.1.100', 'MEAS:VOLT:DC?'))
print(f"Voltage: {voltage} V")

# Configure and measure
siglent_query('192.168.1.100', 'CONF:VOLT:DC 20')
siglent_query('192.168.1.100', 'VOLT:DC:NPLC 10')
voltage = float(siglent_query('192.168.1.100', 'READ?'))
print(f"Voltage (accurate): {voltage} V")
```

### TypeScript with visa-ts

```typescript
import { createResourceManager } from 'visa-ts';

async function measureWithSiglent() {
  const rm = createResourceManager();
  const dmm = await rm.open('TCPIP0::192.168.1.100::5025::SOCKET');

  await dmm.write('CONF:VOLT:DC 20');
  await dmm.write('VOLT:DC:NPLC 10');

  const result = await dmm.query('READ?');
  if (result.ok) {
    console.log(`Voltage: ${parseFloat(result.value)} V`);
  }

  await dmm.close();
}
```

### Multi-Reading with Statistics

```python
import socket
import time

class SiglentSDM:
    def __init__(self, host, port=5025):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(5)
        self.sock.connect((host, port))

    def write(self, cmd):
        self.sock.sendall((cmd + '\n').encode())

    def query(self, cmd):
        self.write(cmd)
        time.sleep(0.05)
        return self.sock.recv(4096).decode().strip()

    def close(self):
        self.sock.close()

# Usage
dmm = SiglentSDM('192.168.1.100')
print(dmm.query('*IDN?'))

# Configure for statistics
dmm.write('CONF:VOLT:DC 10')
dmm.write('VOLT:DC:NPLC 10')
dmm.write('CALC:AVER ON')
dmm.write('SAMP:COUN 100')
dmm.write('TRIG:SOUR IMM')
dmm.write('INIT')
dmm.query('*OPC?')

# Get statistics
stats = dmm.query('CALC:AVER:ALL?')
avg, stddev, min_val, max_val = [float(x) for x in stats.split(',')]
count = int(dmm.query('CALC:AVER:COUN?'))

print(f"Samples: {count}")
print(f"Average: {avg:.6f} V")
print(f"Std Dev: {stddev:.9f} V")
print(f"Min: {min_val:.6f} V")
print(f"Max: {max_val:.6f} V")

dmm.close()
```

---

## Notes

1. **Port 5025**: Siglent uses standard port 5025 (same as Keysight).

2. **Range Differences**: SDM3045X uses 600mV/6V/60V/600V ranges; SDM3055/3065X use 200mV/2V/20V/200V.

3. **NPLC Range**: SDM3065X has extended NPLC range (0.005-100); SDM3045X/SDM3055 limited to 0.3/1/10.

4. **Scanner Card**: Only SDM3065X-SC supports the SC1016 scanner card.

5. **Dual Display**: All models show two measurements; it's display only, not simultaneous sampling.

6. **Buffer Size**: SDM3065X has 10× larger buffer (10,000 vs 1,000 readings).

7. **Temperature**: Supports RTD and thermistor only; no thermocouple support.

8. **Statistics Format**: `CALC:AVER:ALL?` returns: `avg,stddev,min,max`.
