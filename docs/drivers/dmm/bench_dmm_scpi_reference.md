# Bench Digital Multimeter SCPI Reference
## Siglent SDM Series & Rigol DM858 Series

**Document Purpose:** Complete SCPI command reference for hobbyist/educational driver development  
**Target Instruments:** Siglent SDM3045X/SDM3055/SDM3065X, Rigol DM858/DM858E  
**Date:** January 2026

---

## Table of Contents

1. [Instrument Overview](#instrument-overview)
2. [Connection Methods](#connection-methods)
3. [Command Comparison](#command-comparison)
4. [Siglent SDM Series Commands](#siglent-sdm-series-commands)
5. [Rigol DM858 Series Commands](#rigol-dm858-series-commands)
6. [Python Socket Drivers](#python-socket-drivers)
7. [Driver Abstraction Strategy](#driver-abstraction-strategy)

---

## Instrument Overview

### Important Note: "Dual Display" vs "Dual Channel"

Both instrument families are marketed as having "dual display" capability. This means:
- **Single measurement input** - one signal at a time
- **Two display areas** showing related measurements (e.g., voltage + frequency)
- **NOT simultaneous independent measurements** of two separate signals

For true multi-channel measurement, you need:
- Scanner cards (Siglent SC1016 for SDM3065X-SC)
- Data acquisition systems
- Multiple DMMs synchronized via TSP-Link (Keithley) or similar

### Siglent SDM Series Specifications

| Model | Digits | DCV Accuracy | Reading Rate | Memory | Price |
|-------|--------|--------------|--------------|--------|-------|
| SDM3045X | 4½ | 0.025% | 150 rdgs/s | 1,000 pts | ~$280 |
| SDM3055 | 5½ | 0.015% | 150 rdgs/s | 1,000 pts | ~$380 |
| SDM3065X | 6½ | 0.0035% | 150 rdgs/s | 10,000 pts | ~$500 |
| SDM3065X-SC | 6½ | 0.0035% | 150 rdgs/s | 10,000 pts | ~$700 |

**Measurement Functions (all models):**
- DCV, ACV, DCI, ACI
- 2-wire/4-wire resistance
- Frequency, Period
- Capacitance
- Continuity, Diode
- Temperature (RTD, Thermistor)

### Rigol DM858 Series Specifications

| Model | Digits | DCV Accuracy | Reading Rate | Memory | Price |
|-------|--------|--------------|--------------|--------|-------|
| DM858E | 5½ | 0.06% (1yr) | 80 rdgs/s | 20,000 pts | ~$300 |
| DM858 | 5½ | 0.03% (1yr) | 125 rdgs/s | 500,000 pts | ~$400 |

**Measurement Functions:**
- DCV, ACV, DCI, ACI
- 2-wire/4-wire resistance
- Frequency, Period
- Capacitance
- Continuity, Diode
- Temperature (RTD, Thermistor, Thermocouple)

**Key Differences:**
- DM858E: 3A max current, 1mF max capacitance, 80 rdgs/s
- DM858: 10A max current, 10mF max capacitance, 125 rdgs/s

---

## Connection Methods

### Siglent SDM Series

| Interface | Details |
|-----------|---------|
| **LAN Socket** | Port **5025** (SCPI raw socket) |
| **LAN Telnet** | Port 5024 |
| **USB** | VID: 0xF4EC, PID varies by model |
| **GPIB** | Optional (requires adapter) |

**LAN Configuration Commands:**
```
SYSTem:COMMunicate:LAN:IPADdress "<address>"
SYSTem:COMMunicate:LAN:SMASk "<mask>"
SYSTem:COMMunicate:LAN:GATeway "<gateway>"
SYSTem:COMMunicate:GPIB:ADDRess <address>
```

### Rigol DM858 Series

| Interface | Details |
|-----------|---------|
| **LAN Socket** | Port **5555** (SCPI raw socket) |
| **LAN Web Control** | HTTP on standard port |
| **USB** | USB-TMC (VISA compatible) |
| **mDNS** | Supported for discovery |

**LAN Configuration Commands:**
```
SYSTem:COMMunicate:LAN:IPADdress "<address>"
SYSTem:COMMunicate:LAN:SMASk "<mask>"
SYSTem:COMMunicate:LAN:GATeway "<gateway>"
SYSTem:COMMunicate:LAN:DHCP {ON|OFF}
SYSTem:COMMunicate:LAN:AUToip {ON|OFF}
SYSTem:COMMunicate:LAN:MANuip {ON|OFF}
SYSTem:COMMunicate:LAN:DNS "<address>"
SYSTem:COMMunicate:LAN:HOSTname "<name>"
SYSTem:COMMunicate:LAN:MAC?
LXI:MDNS:ENABle {ON|OFF}
LXI:RESet
LXI:RESTart
```

---

## Command Comparison

Both instruments use standard SCPI syntax. The command sets are highly compatible.

### Quick Measurement Commands

| Function | Siglent SDM | Rigol DM858 |
|----------|-------------|-------------|
| Measure DCV | `MEAS:VOLT:DC? [<range>]` | `MEAS:VOLT:DC? [<range>[,<res>]]` |
| Measure ACV | `MEAS:VOLT:AC? [<range>]` | `MEAS:VOLT:AC? [<range>[,<res>]]` |
| Measure DCI | `MEAS:CURR:DC? [<range>]` | `MEAS:CURR:DC? [<range>[,<res>]]` |
| Measure ACI | `MEAS:CURR:AC? [<range>]` | `MEAS:CURR:AC? [<range>[,<res>]]` |
| Measure 2WR | `MEAS:RES? [<range>]` | `MEAS:RES? [<range>[,<res>]]` |
| Measure 4WR | `MEAS:FRES? [<range>]` | `MEAS:FRES? [<range>[,<res>]]` |
| Measure Freq | `MEAS:FREQ?` | `MEAS:FREQ?` |
| Measure Period | `MEAS:PER?` | `MEAS:PER?` |
| Measure Cap | `MEAS:CAP? [<range>]` | `MEAS:CAP? [<range>]` |
| Measure Cont | `MEAS:CONT?` | `MEAS:CONT?` |
| Measure Diode | `MEAS:DIOD?` | `MEAS:DIOD?` |
| Measure Temp | `MEAS:TEMP? [<type>,<sensor>]` | `MEAS:TEMP? [<type>,<sensor>]` |

### Configure Commands (without triggering)

| Function | Siglent SDM | Rigol DM858 |
|----------|-------------|-------------|
| Config DCV | `CONF:VOLT:DC [<range>]` | `CONF:VOLT:DC [<range>[,<res>]]` |
| Config ACV | `CONF:VOLT:AC [<range>]` | `CONF:VOLT:AC [<range>[,<res>]]` |
| Query Config | `CONF?` | `CONF?` |

### Trigger/Acquisition Commands

| Function | Siglent SDM | Rigol DM858 |
|----------|-------------|-------------|
| Initiate | `INIT[:IMM]` | `INIT[:IMM]` |
| Abort | `ABOR` | `ABOR` |
| Fetch | `FETC?` | `FETC?` |
| Read | `READ?` | `READ?` |
| Sample Count | `SAMP:COUN <n>` | `SAMP:COUN <n>` |
| Trigger Count | `TRIG:COUN <n>` | `TRIG:COUN <n>` |
| Trigger Source | `TRIG:SOUR {IMM\|EXT\|BUS}` | `TRIG:SOUR {IMM\|EXT\|BUS\|SINGle}` |
| Trigger Delay | `TRIG:DEL <seconds>` | N/A |
| Trigger Slope | `TRIG:SLOP {POS\|NEG}` | N/A |
| Output Trig Slope | `OUTP:TRIG:SLOP {POS\|NEG}` | `OUTP:TRIG:SLOP {POS\|NEG}` |

### Data Commands

| Function | Siglent SDM | Rigol DM858 |
|----------|-------------|-------------|
| Last Reading | `DATA:LAST?` | `DATA:LAST?` |
| Points in Memory | `DATA:POIN?` | `DATA:POIN?` |
| Remove Readings | `DATA:REM? <n>` | `DATA:REM? <n>[,WAIT]` |
| Read & Remove | `R? [<n>]` | `R? [<n>]` |

### Range Commands (per function)

Both instruments support identical range syntax:

```
[SENS:]<function>:RANG {<range>|AUTO|MIN|MAX|DEF}
[SENS:]<function>:RANG?
[SENS:]<function>:RANG:AUTO {ON|OFF|ONCE}
[SENS:]<function>:RANG:AUTO?
```

### Null/Relative Commands

```
[SENS:]<function>:NULL[:STAT] {ON|OFF}
[SENS:]<function>:NULL:VAL {<value>|MIN|MAX|DEF}
[SENS:]<function>:NULL:VAL:AUTO {ON|OFF}
```

### Math/Statistics Commands

| Function | Command (both) |
|----------|----------------|
| Statistics On/Off | `CALC:AVER[:STAT] {ON\|OFF}` |
| Statistics All | `CALC:AVER:ALL?` |
| Average | `CALC:AVER:AVER?` |
| Min | `CALC:AVER:MIN?` |
| Max | `CALC:AVER:MAX?` |
| Std Dev | `CALC:AVER:SDEV?` |
| Count | `CALC:AVER:COUN?` |
| Clear Stats | `CALC:AVER:CLE[:IMM]` |
| Limit On/Off | `CALC:LIM[:STAT] {ON\|OFF}` |
| Limit Upper | `CALC:LIM:UPP[:DATA] <value>` |
| Limit Lower | `CALC:LIM:LOW[:DATA] <value>` |
| Clear Limits | `CALC:LIM:CLE[:IMM]` |
| dB Reference | `CALC:SCAL:DB:REF <dBm>` |
| dBm Reference | `CALC:SCAL:DBM:REF <ohms>` |
| Scale Function | `CALC:SCAL:FUNC {DB\|DBM}` |
| Scale On/Off | `CALC:SCAL[:STAT] {ON\|OFF}` |

### Integration Time (NPLC)

| Model Family | NPLC Values |
|--------------|-------------|
| Siglent SDM3045X/SDM3055 | 0.3, 1, 10 (Fast/Medium/Slow) |
| Siglent SDM3065X | 0.005, 0.05, 0.5, 1, 10, 100 |
| Rigol DM858 | 0.4, 5, 20 PLC (Fast/Medium/Slow) |

```
[SENS:]<function>:NPLC {<PLC>|MIN|MAX|DEF}
[SENS:]<function>:NPLC?
```

### IEEE 488.2 Common Commands

Both instruments support standard IEEE 488.2 commands:

```
*IDN?           - Identification query
*RST            - Reset to defaults
*CLS            - Clear status
*ESE <mask>     - Event status enable
*ESR?           - Event status register query
*OPC            - Operation complete
*OPC?           - Operation complete query
*SRE <mask>     - Service request enable
*STB?           - Status byte query
*TRG            - Trigger (when TRIG:SOUR BUS)
*PSC {0|1}      - Power-on status clear
```

---

## Siglent SDM Series Commands

### Complete Function List

```
[SENS:]FUNC[:ON] "<function>"
[SENS:]FUNC[:ON]?
```

**Function Names:**
- `"VOLT"` or `"VOLT:DC"` - DC Voltage
- `"VOLT:AC"` - AC Voltage
- `"CURR"` or `"CURR:DC"` - DC Current
- `"CURR:AC"` - AC Current
- `"RES"` - 2-Wire Resistance
- `"FRES"` - 4-Wire Resistance
- `"FREQ"` - Frequency
- `"PER"` - Period
- `"CAP"` - Capacitance
- `"CONT"` - Continuity
- `"DIOD"` - Diode Test
- `"TEMP"` - Temperature

### Voltage Ranges

**DC Voltage (all models):**
```
[SENS:]VOLT:DC:RANG {200mV|2V|20V|200V|1000V|AUTO|MIN|MAX|DEF}
```

**AC Voltage (all models):**
```
[SENS:]VOLT:AC:RANG {200mV|2V|20V|200V|750V|AUTO|MIN|MAX|DEF}
```

Note: SDM3045X uses different ranges: 600mV, 6V, 60V, 600V, 1000V(DC)/750V(AC)

### Current Ranges

**DC Current:**
```
[SENS:]CURR:DC:RANG {200uA|2mA|20mA|200mA|2A|10A|AUTO|MIN|MAX|DEF}
```

**AC Current:**
```
[SENS:]CURR:AC:RANG {20mA|200mA|2A|10A|AUTO|MIN|MAX|DEF}
```

Note: 200µA and 2mA only available in DC mode

### Resistance Ranges

```
[SENS:]RES:RANG {200|2000|20000|200000|2000000|10000000|100000000|AUTO}
[SENS:]FRES:RANG {200|2000|20000|200000|2000000|10000000|100000000|AUTO}
```

Ranges: 200Ω, 2kΩ, 20kΩ, 200kΩ, 2MΩ, 10MΩ, 100MΩ

### Capacitance Ranges

```
[SENS:]CAP:RANG {2E-9|20E-9|200E-9|2E-6|20E-6|200E-6|10000E-6|AUTO}
```

Ranges: 2nF, 20nF, 200nF, 2µF, 20µF, 200µF, 10mF

### Temperature Configuration

```
CONF:TEMP [{RTD|THER|DEF}[,{<type>|DEF}]]
MEAS:TEMP? [{RTD|THER|DEF}[,{<type>|DEF}]]
```

**RTD Types:** PT100, PT1000  
**Thermistor Types:** BITS90, EITS90, JITS90, KITS90, NITS90, RITS90, SITS90, TITS90

**Temperature Units:**
```
UNIT:TEMP {C|F|K}
UNIT:TEMP?
```

### Scanner Card Commands (SDM3065X-SC only)

```
ROUT:STAT?                    - Query scanner state
ROUT:SCAN {ON|OFF}            - Enable/disable scanning
ROUT:START {ON|OFF}           - Start/stop scan
ROUT:FUNC {SCAN|STEP}         - Scan mode vs step mode
ROUT:DEL <seconds>            - Inter-channel delay
ROUT:COUN <n>                 - Scan count
ROUT:COUN:AUTO {ON|OFF}       - Continuous scan
ROUT:CHAN <ch>,<sw>,<mode>,<range>,<speed>  - Configure channel
ROUT:CHAN? <ch>               - Query channel config
ROUT:DATA? <ch>               - Read channel data
ROUT:LIM:HIGH <value>         - Channel high limit
ROUT:LIM:LOW <value>          - Channel low limit
```

### System Commands

```
SYST:BEEP[:IMM]               - Beep now
SYST:BEEP:STAT {ON|OFF}       - Beeper enable
SYST:PRES                     - Preset (reset config)
SYST:ERR?                     - Query error queue
```

---

## Rigol DM858 Series Commands

### Complete Function List

```
[SENS:]FUNC[:ON] "<function>"
[SENS:]FUNC[:ON]?
```

**Function Names:** Same as Siglent, plus:
- `"TEMP:FRTD"` - 4-wire RTD
- `"TEMP:RTD"` - 2-wire RTD
- `"TEMP:FTHER"` - 4-wire Thermistor
- `"TEMP:THER"` - 2-wire Thermistor
- `"TEMP:TC"` - Thermocouple

### Voltage Ranges

**DC Voltage:**
```
[SENS:]VOLT:DC:RANG {0.1|1|10|100|1000|AUTO|MIN|MAX|DEF}
```

**AC Voltage:**
```
[SENS:]VOLT:AC:RANG {0.1|1|10|100|750|AUTO|MIN|MAX|DEF}
```

Ranges: 100mV, 1V, 10V, 100V, 1000V(DC)/750V(AC)

### Current Ranges

**DC/AC Current:**
```
[SENS:]CURR:DC:RANG {0.0001|0.001|0.01|0.1|1|3|10|AUTO}
[SENS:]CURR:AC:RANG {0.0001|0.001|0.01|0.1|1|3|10|AUTO}
```

- DM858E: 100µA to 3A
- DM858: 100µA to 10A

### Resistance Ranges

```
[SENS:]RES:RANG {100|1000|10000|100000|1000000|10000000|50000000|AUTO}
[SENS:]FRES:RANG {100|1000|10000|100000|1000000|10000000|50000000|AUTO}
```

Ranges: 100Ω, 1kΩ, 10kΩ, 100kΩ, 1MΩ, 10MΩ, 50MΩ

### Capacitance Ranges

```
[SENS:]CAP:RANG {1E-9|10E-9|100E-9|1E-6|10E-6|100E-6|1E-3|10E-3|AUTO}
```

- DM858E: 1nF to 1mF
- DM858: 1nF to 10mF

### Temperature Configuration

```
CONF:TEMP [{FRTD|RTD|FTHER|THER|TC|DEF}[,<type>]]
MEAS:TEMP? [{FRTD|RTD|FTHER|THER|TC|DEF}[,<type>]]
```

**Probe Types:**
- FRTD: 4-wire RTD
- RTD: 2-wire RTD  
- FTHermistor: 4-wire Thermistor
- THERmistor: 2-wire Thermistor
- TCouple: Thermocouple

**RTD Types (α values):** 385, 389, 391, 392  
**Thermistor Types (kΩ):** 2200, 3000, 5000, 10000, 30000  
**Thermocouple Types:** B, E, J, K, N, R, S, T

### Resolution Parameter

Rigol DM858 supports explicit resolution parameter:

```
CONF:VOLT:DC [<range>[,<resolution>]]
MEAS:VOLT:DC? [<range>[,<resolution>]]
```

**Resolution vs Speed:**
| Resolution | Speed | NPLC |
|------------|-------|------|
| 1000 ppm × range | Fast | 0.4 |
| 100 ppm × range | Medium | 5 |
| 10 ppm × range | Slow | 20 |

### Secondary Display Commands

The DM858 supports querying the secondary display value:

```
[SENS:]DATA2?                 - Query secondary measurement
[SENS:]DATA2:CLE[:IMM]        - Clear secondary data
[SENS:]<function>:SEC "<type>" - Set secondary measurement type
[SENS:]<function>:SEC?        - Query secondary measurement type
```

### Screenshot Commands

```
HCOP:SDUM:DATA?               - Get screenshot data
HCOP:SDUM:DATA:FORM {PNG|BMP} - Set format
HCOP:SDUM:DATA:FORM?          - Query format
```

### Memory Storage Commands

```
MMEM:CAT[:ALL]?               - List files
MMEM:CDIR "<path>"            - Change directory
MMEM:COPY "<src>","<dst>"     - Copy file
MMEM:DEL "<file>"             - Delete file
MMEM:MDIR "<path>"            - Make directory
MMEM:MOVE "<src>","<dst>"     - Move/rename file
MMEM:RDIR "<path>"            - Remove directory
MMEM:LOAD:PREF "<file>"       - Load preferences
MMEM:LOAD:STAT "<file>"       - Load state
MMEM:STOR:PREF "<file>"       - Store preferences
MMEM:STOR:STAT "<file>"       - Store state
MMEM:STOR:DATA "<file>"       - Store data
MMEM:STAT:REC:AUTO {ON|OFF}   - Auto-recall state on power-up
```

### System Commands

```
SYST:BEEP[:IMM]               - Beep now
SYST:BEEP:STAT {ON|OFF}       - Beeper enable
SYST:DATE <year>,<month>,<day> - Set date
SYST:DATE?                    - Query date
SYST:TIME <hour>,<min>,<sec>  - Set time
SYST:TIME?                    - Query time
SYST:ERR?                     - Query error queue
SYST:VERS?                    - Query SCPI version
```

---

## Python Socket Drivers

### Siglent SDM Series Driver

```python
#!/usr/bin/env python3
"""
Siglent SDM Series Digital Multimeter Driver
Supports: SDM3045X, SDM3055, SDM3065X, SDM3065X-SC
Connection: TCP/IP Socket on port 5025
"""

import socket
import time

class SiglentSDM:
    DEFAULT_PORT = 5025
    TIMEOUT = 5.0
    
    def __init__(self, host, port=None):
        self.host = host
        self.port = port or self.DEFAULT_PORT
        self.sock = None
    
    def connect(self):
        """Establish connection to instrument."""
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(self.TIMEOUT)
        self.sock.connect((self.host, self.port))
        return self
    
    def disconnect(self):
        """Close connection."""
        if self.sock:
            self.sock.close()
            self.sock = None
    
    def __enter__(self):
        return self.connect()
    
    def __exit__(self, *args):
        self.disconnect()
    
    def write(self, cmd):
        """Send command to instrument."""
        self.sock.sendall((cmd + '\n').encode())
    
    def read(self, bufsize=4096):
        """Read response from instrument."""
        return self.sock.recv(bufsize).decode().strip()
    
    def query(self, cmd):
        """Send command and return response."""
        self.write(cmd)
        time.sleep(0.05)  # Small delay for processing
        return self.read()
    
    # IEEE 488.2 Commands
    def idn(self):
        """Query instrument identification."""
        return self.query('*IDN?')
    
    def reset(self):
        """Reset instrument to defaults."""
        self.write('*RST')
    
    def clear_status(self):
        """Clear status registers."""
        self.write('*CLS')
    
    def opc(self):
        """Wait for operation complete."""
        return self.query('*OPC?')
    
    # Measurement Commands
    def measure_dcv(self, range_val=None):
        """Measure DC voltage."""
        cmd = 'MEAS:VOLT:DC?'
        if range_val:
            cmd += f' {range_val}'
        return float(self.query(cmd))
    
    def measure_acv(self, range_val=None):
        """Measure AC voltage."""
        cmd = 'MEAS:VOLT:AC?'
        if range_val:
            cmd += f' {range_val}'
        return float(self.query(cmd))
    
    def measure_dci(self, range_val=None):
        """Measure DC current."""
        cmd = 'MEAS:CURR:DC?'
        if range_val:
            cmd += f' {range_val}'
        return float(self.query(cmd))
    
    def measure_aci(self, range_val=None):
        """Measure AC current."""
        cmd = 'MEAS:CURR:AC?'
        if range_val:
            cmd += f' {range_val}'
        return float(self.query(cmd))
    
    def measure_resistance(self, range_val=None, four_wire=False):
        """Measure resistance (2-wire or 4-wire)."""
        func = 'FRES' if four_wire else 'RES'
        cmd = f'MEAS:{func}?'
        if range_val:
            cmd += f' {range_val}'
        return float(self.query(cmd))
    
    def measure_frequency(self):
        """Measure frequency."""
        return float(self.query('MEAS:FREQ?'))
    
    def measure_period(self):
        """Measure period."""
        return float(self.query('MEAS:PER?'))
    
    def measure_capacitance(self, range_val=None):
        """Measure capacitance."""
        cmd = 'MEAS:CAP?'
        if range_val:
            cmd += f' {range_val}'
        return float(self.query(cmd))
    
    def measure_continuity(self):
        """Measure continuity (returns resistance in ohms)."""
        result = self.query('MEAS:CONT?')
        return float(result)
    
    def measure_diode(self):
        """Measure diode forward voltage."""
        return float(self.query('MEAS:DIOD?'))
    
    def measure_temperature(self, sensor_type='THER', sensor='5000'):
        """Measure temperature.
        
        Args:
            sensor_type: 'RTD' or 'THER'
            sensor: For RTD: 'PT100', 'PT1000'
                   For THER: thermistor type
        """
        return float(self.query(f'MEAS:TEMP? {sensor_type},{sensor}'))
    
    # Configuration Commands
    def configure(self, function, range_val=None):
        """Configure measurement function without triggering.
        
        Args:
            function: 'VOLT:DC', 'VOLT:AC', 'CURR:DC', 'CURR:AC',
                     'RES', 'FRES', 'FREQ', 'PER', 'CAP', 'CONT', 'DIOD', 'TEMP'
        """
        cmd = f'CONF:{function}'
        if range_val:
            cmd += f' {range_val}'
        self.write(cmd)
    
    def get_config(self):
        """Query current configuration."""
        return self.query('CONF?')
    
    def set_function(self, function):
        """Set measurement function.
        
        Args:
            function: 'VOLT', 'VOLT:AC', 'CURR', 'CURR:AC',
                     'RES', 'FRES', 'FREQ', 'PER', 'CAP', 'CONT', 'DIOD', 'TEMP'
        """
        self.write(f'FUNC "{function}"')
    
    def get_function(self):
        """Query current measurement function."""
        return self.query('FUNC?').strip('"')
    
    # Range Commands
    def set_range(self, function, range_val):
        """Set measurement range for a function."""
        self.write(f'{function}:RANG {range_val}')
    
    def get_range(self, function):
        """Query measurement range for a function."""
        return self.query(f'{function}:RANG?')
    
    def set_autorange(self, function, state):
        """Enable/disable autorange for a function."""
        self.write(f'{function}:RANG:AUTO {"ON" if state else "OFF"}')
    
    # Trigger Commands
    def initiate(self):
        """Initiate measurement (wait for trigger)."""
        self.write('INIT')
    
    def abort(self):
        """Abort measurement in progress."""
        self.write('ABOR')
    
    def fetch(self):
        """Fetch measurement from memory."""
        return self.query('FETC?')
    
    def read(self):
        """Trigger and read measurement."""
        return self.query('READ?')
    
    def set_sample_count(self, count):
        """Set number of samples per trigger."""
        self.write(f'SAMP:COUN {count}')
    
    def set_trigger_count(self, count):
        """Set number of triggers."""
        self.write(f'TRIG:COUN {count}')
    
    def set_trigger_source(self, source):
        """Set trigger source ('IMM', 'EXT', 'BUS')."""
        self.write(f'TRIG:SOUR {source}')
    
    def set_trigger_delay(self, seconds):
        """Set trigger delay in seconds."""
        self.write(f'TRIG:DEL {seconds}')
    
    def trigger(self):
        """Send software trigger (when source is BUS)."""
        self.write('*TRG')
    
    # Data Commands
    def get_last_reading(self):
        """Get last measurement reading."""
        return self.query('DATA:LAST?')
    
    def get_reading_count(self):
        """Get number of readings in memory."""
        return int(self.query('DATA:POIN?'))
    
    def remove_readings(self, count):
        """Read and remove readings from memory."""
        return self.query(f'DATA:REM? {count}')
    
    # Statistics Commands
    def enable_statistics(self, state=True):
        """Enable/disable statistics calculation."""
        self.write(f'CALC:AVER {"ON" if state else "OFF"}')
    
    def get_statistics(self):
        """Get all statistics (avg, stddev, min, max)."""
        result = self.query('CALC:AVER:ALL?')
        values = [float(x) for x in result.split(',')]
        return {
            'average': values[0],
            'stddev': values[1],
            'minimum': values[2],
            'maximum': values[3]
        }
    
    def get_average(self):
        """Get average of measurements."""
        return float(self.query('CALC:AVER:AVER?'))
    
    def get_minimum(self):
        """Get minimum measurement."""
        return float(self.query('CALC:AVER:MIN?'))
    
    def get_maximum(self):
        """Get maximum measurement."""
        return float(self.query('CALC:AVER:MAX?'))
    
    def get_stddev(self):
        """Get standard deviation."""
        return float(self.query('CALC:AVER:SDEV?'))
    
    def get_count(self):
        """Get measurement count for statistics."""
        return int(self.query('CALC:AVER:COUN?'))
    
    def clear_statistics(self):
        """Clear statistics data."""
        self.write('CALC:AVER:CLE')
    
    # Limit Commands
    def enable_limits(self, state=True):
        """Enable/disable limit testing."""
        self.write(f'CALC:LIM {"ON" if state else "OFF"}')
    
    def set_upper_limit(self, value):
        """Set upper limit for testing."""
        self.write(f'CALC:LIM:UPP {value}')
    
    def set_lower_limit(self, value):
        """Set lower limit for testing."""
        self.write(f'CALC:LIM:LOW {value}')
    
    # Null/Relative Commands
    def enable_null(self, function, state=True):
        """Enable/disable null (relative) measurement."""
        self.write(f'{function}:NULL {"ON" if state else "OFF"}')
    
    def set_null_value(self, function, value):
        """Set null reference value."""
        self.write(f'{function}:NULL:VAL {value}')
    
    def set_null_auto(self, function, state=True):
        """Enable auto null (use first reading as reference)."""
        self.write(f'{function}:NULL:VAL:AUTO {"ON" if state else "OFF"}')
    
    # NPLC Commands
    def set_nplc(self, function, nplc):
        """Set integration time in power line cycles.
        
        SDM3045X/SDM3055: 0.3, 1, 10
        SDM3065X: 0.005, 0.05, 0.5, 1, 10, 100
        """
        self.write(f'{function}:NPLC {nplc}')
    
    def get_nplc(self, function):
        """Get integration time in power line cycles."""
        return float(self.query(f'{function}:NPLC?'))
    
    # System Commands
    def beep(self):
        """Sound the beeper."""
        self.write('SYST:BEEP')
    
    def set_beeper(self, state):
        """Enable/disable beeper."""
        self.write(f'SYST:BEEP:STAT {"ON" if state else "OFF"}')
    
    def get_error(self):
        """Query error queue."""
        return self.query('SYST:ERR?')
    
    def preset(self):
        """Reset to preset configuration."""
        self.write('SYST:PRES')
    
    # Temperature Unit
    def set_temp_unit(self, unit):
        """Set temperature unit ('C', 'F', 'K')."""
        self.write(f'UNIT:TEMP {unit}')
    
    def get_temp_unit(self):
        """Get temperature unit."""
        return self.query('UNIT:TEMP?')


# Example usage
if __name__ == '__main__':
    with SiglentSDM('192.168.1.100') as dmm:
        print(f"Connected to: {dmm.idn()}")
        
        # Simple DC voltage measurement
        voltage = dmm.measure_dcv()
        print(f"DC Voltage: {voltage:.6f} V")
        
        # Configured measurement with statistics
        dmm.configure('VOLT:DC', 10)  # 10V range
        dmm.set_nplc('VOLT:DC', 10)   # 10 NPLC for accuracy
        dmm.enable_statistics(True)
        dmm.set_sample_count(100)
        dmm.set_trigger_source('IMM')
        dmm.initiate()
        
        # Wait for measurements
        import time
        time.sleep(2)
        
        stats = dmm.get_statistics()
        print(f"Average: {stats['average']:.6f} V")
        print(f"Std Dev: {stats['stddev']:.9f} V")
        print(f"Min: {stats['minimum']:.6f} V")
        print(f"Max: {stats['maximum']:.6f} V")
```

### Rigol DM858 Series Driver

```python
#!/usr/bin/env python3
"""
Rigol DM858 Series Digital Multimeter Driver
Supports: DM858, DM858E
Connection: TCP/IP Socket on port 5555
"""

import socket
import time

class RigolDM858:
    DEFAULT_PORT = 5555
    TIMEOUT = 5.0
    
    def __init__(self, host, port=None):
        self.host = host
        self.port = port or self.DEFAULT_PORT
        self.sock = None
    
    def connect(self):
        """Establish connection to instrument."""
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(self.TIMEOUT)
        self.sock.connect((self.host, self.port))
        return self
    
    def disconnect(self):
        """Close connection."""
        if self.sock:
            self.sock.close()
            self.sock = None
    
    def __enter__(self):
        return self.connect()
    
    def __exit__(self, *args):
        self.disconnect()
    
    def write(self, cmd):
        """Send command to instrument."""
        self.sock.sendall((cmd + '\n').encode())
    
    def read(self, bufsize=4096):
        """Read response from instrument."""
        return self.sock.recv(bufsize).decode().strip()
    
    def query(self, cmd):
        """Send command and return response."""
        self.write(cmd)
        time.sleep(0.05)
        return self.read()
    
    # IEEE 488.2 Commands
    def idn(self):
        """Query instrument identification."""
        return self.query('*IDN?')
    
    def reset(self):
        """Reset instrument to defaults."""
        self.write('*RST')
    
    def clear_status(self):
        """Clear status registers."""
        self.write('*CLS')
    
    def opc(self):
        """Wait for operation complete."""
        return self.query('*OPC?')
    
    # Measurement Commands (same as Siglent but with optional resolution)
    def measure_dcv(self, range_val=None, resolution=None):
        """Measure DC voltage.
        
        Args:
            range_val: Range in V (0.1, 1, 10, 100, 1000, or AUTO)
            resolution: Resolution (affects speed/accuracy tradeoff)
        """
        cmd = 'MEAS:VOLT:DC?'
        if range_val is not None:
            cmd += f' {range_val}'
            if resolution is not None:
                cmd += f',{resolution}'
        return float(self.query(cmd))
    
    def measure_acv(self, range_val=None, resolution=None):
        """Measure AC voltage."""
        cmd = 'MEAS:VOLT:AC?'
        if range_val is not None:
            cmd += f' {range_val}'
            if resolution is not None:
                cmd += f',{resolution}'
        return float(self.query(cmd))
    
    def measure_dci(self, range_val=None, resolution=None):
        """Measure DC current.
        
        DM858E: 100µA to 3A
        DM858: 100µA to 10A
        """
        cmd = 'MEAS:CURR:DC?'
        if range_val is not None:
            cmd += f' {range_val}'
            if resolution is not None:
                cmd += f',{resolution}'
        return float(self.query(cmd))
    
    def measure_aci(self, range_val=None, resolution=None):
        """Measure AC current."""
        cmd = 'MEAS:CURR:AC?'
        if range_val is not None:
            cmd += f' {range_val}'
            if resolution is not None:
                cmd += f',{resolution}'
        return float(self.query(cmd))
    
    def measure_resistance(self, range_val=None, resolution=None, four_wire=False):
        """Measure resistance (2-wire or 4-wire)."""
        func = 'FRES' if four_wire else 'RES'
        cmd = f'MEAS:{func}?'
        if range_val is not None:
            cmd += f' {range_val}'
            if resolution is not None:
                cmd += f',{resolution}'
        return float(self.query(cmd))
    
    def measure_frequency(self):
        """Measure frequency."""
        return float(self.query('MEAS:FREQ?'))
    
    def measure_period(self):
        """Measure period."""
        return float(self.query('MEAS:PER?'))
    
    def measure_capacitance(self, range_val=None):
        """Measure capacitance.
        
        DM858E: 1nF to 1mF
        DM858: 1nF to 10mF
        """
        cmd = 'MEAS:CAP?'
        if range_val:
            cmd += f' {range_val}'
        return float(self.query(cmd))
    
    def measure_continuity(self):
        """Measure continuity. Returns 9.9E37 if open (>1.2kΩ)."""
        return float(self.query('MEAS:CONT?'))
    
    def measure_diode(self):
        """Measure diode forward voltage. Returns 9.9E37 if open."""
        return float(self.query('MEAS:DIOD?'))
    
    def measure_temperature(self, sensor_type='TC', sensor='K'):
        """Measure temperature.
        
        Args:
            sensor_type: 'FRTD', 'RTD', 'FTHER', 'THER', 'TC'
            sensor: 
                RTD: 385, 389, 391, 392
                Thermistor: 2200, 3000, 5000, 10000, 30000
                Thermocouple: B, E, J, K, N, R, S, T
        """
        return float(self.query(f'MEAS:TEMP? {sensor_type},{sensor}'))
    
    # Configuration Commands
    def configure(self, function, range_val=None, resolution=None):
        """Configure measurement function without triggering."""
        cmd = f'CONF:{function}'
        if range_val is not None:
            cmd += f' {range_val}'
            if resolution is not None:
                cmd += f',{resolution}'
        self.write(cmd)
    
    def get_config(self):
        """Query current configuration."""
        return self.query('CONF?')
    
    # Trigger Commands
    def initiate(self):
        """Initiate measurement (wait for trigger)."""
        self.write('INIT')
    
    def abort(self):
        """Abort measurement in progress."""
        self.write('ABOR')
    
    def fetch(self):
        """Fetch measurement from memory."""
        return self.query('FETC?')
    
    def read_measurement(self):
        """Trigger and read measurement."""
        return self.query('READ?')
    
    def set_sample_count(self, count):
        """Set number of samples per trigger (1-2000)."""
        self.write(f'SAMP:COUN {count}')
    
    def get_sample_count(self):
        """Get number of samples per trigger."""
        return int(self.query('SAMP:COUN?'))
    
    def set_trigger_count(self, count):
        """Set number of triggers."""
        self.write(f'TRIG:COUN {count}')
    
    def set_trigger_source(self, source):
        """Set trigger source ('IMM', 'EXT', 'BUS', 'SING')."""
        self.write(f'TRIG:SOUR {source}')
    
    def trigger(self):
        """Send software trigger (when source is BUS)."""
        self.write('*TRG')
    
    # Data Commands
    def get_last_reading(self):
        """Get last measurement reading with function."""
        return self.query('DATA:LAST?')
    
    def get_reading_count(self):
        """Get number of readings in memory.
        
        DM858E: up to 20,000
        DM858: up to 500,000
        """
        return int(self.query('DATA:POIN?'))
    
    def remove_readings(self, count, wait=False):
        """Read and remove readings from memory.
        
        Args:
            count: Number of readings to remove
            wait: If True, wait until count readings are available
        """
        cmd = f'DATA:REM? {count}'
        if wait:
            cmd += ',WAIT'
        return self.query(cmd)
    
    def read_and_remove(self, count=None):
        """Read and remove readings (R? command).
        
        Returns readings in format: #2XX<data>
        where XX is length of data string
        """
        cmd = 'R?'
        if count:
            cmd += f' {count}'
        return self.query(cmd)
    
    def set_memory_threshold(self, count):
        """Set maximum readings to store in memory."""
        self.write(f'DATA:POIN:EVEN:THR {count}')
    
    # Secondary Display
    def get_secondary_reading(self):
        """Get secondary display measurement."""
        return self.query('DATA2?')
    
    def clear_secondary(self):
        """Clear secondary display data."""
        self.write('DATA2:CLE')
    
    # Statistics Commands (same as Siglent)
    def enable_statistics(self, state=True):
        """Enable/disable statistics calculation."""
        self.write(f'CALC:AVER {"ON" if state else "OFF"}')
    
    def get_statistics(self):
        """Get all statistics (avg, stddev, min, max)."""
        result = self.query('CALC:AVER:ALL?')
        values = [float(x) for x in result.split(',')]
        return {
            'average': values[0],
            'stddev': values[1],
            'minimum': values[2],
            'maximum': values[3]
        }
    
    def get_average(self):
        return float(self.query('CALC:AVER:AVER?'))
    
    def get_minimum(self):
        return float(self.query('CALC:AVER:MIN?'))
    
    def get_maximum(self):
        return float(self.query('CALC:AVER:MAX?'))
    
    def get_stddev(self):
        return float(self.query('CALC:AVER:SDEV?'))
    
    def get_count(self):
        return int(self.query('CALC:AVER:COUN?'))
    
    def clear_statistics(self):
        self.write('CALC:AVER:CLE')
    
    # Limit Commands
    def enable_limits(self, state=True):
        self.write(f'CALC:LIM {"ON" if state else "OFF"}')
    
    def set_upper_limit(self, value):
        self.write(f'CALC:LIM:UPP {value}')
    
    def set_lower_limit(self, value):
        self.write(f'CALC:LIM:LOW {value}')
    
    def clear_limits(self):
        self.write('CALC:LIM:CLE')
    
    # dB/dBm Scaling
    def set_db_reference(self, dbm_value):
        """Set dB reference value in dBm."""
        self.write(f'CALC:SCAL:DB:REF {dbm_value}')
    
    def set_dbm_reference(self, ohms):
        """Set dBm reference resistance (2-8000 ohms)."""
        self.write(f'CALC:SCAL:DBM:REF {ohms}')
    
    def set_scale_function(self, func):
        """Set scaling function ('DB' or 'DBM')."""
        self.write(f'CALC:SCAL:FUNC {func}')
    
    def enable_scaling(self, state=True):
        """Enable/disable dB/dBm scaling."""
        self.write(f'CALC:SCAL {"ON" if state else "OFF"}')
    
    # Screenshot
    def get_screenshot(self, format='PNG'):
        """Get screenshot data.
        
        Args:
            format: 'PNG' or 'BMP'
        
        Returns:
            Binary image data
        """
        self.write(f'HCOP:SDUM:DATA:FORM {format}')
        self.write('HCOP:SDUM:DATA?')
        # Read binary block response
        time.sleep(0.5)
        return self.sock.recv(65536)
    
    # File Operations
    def list_files(self, path=None):
        """List files in current or specified directory."""
        if path:
            self.write(f'MMEM:CDIR "{path}"')
        return self.query('MMEM:CAT?')
    
    def save_state(self, filename):
        """Save instrument state to file."""
        self.write(f'MMEM:STOR:STAT "{filename}"')
    
    def load_state(self, filename):
        """Load instrument state from file."""
        self.write(f'MMEM:LOAD:STAT "{filename}"')
    
    def save_data(self, filename):
        """Save measurement data to file."""
        self.write(f'MMEM:STOR:DATA "{filename}"')
    
    # System Commands
    def beep(self):
        self.write('SYST:BEEP')
    
    def set_beeper(self, state):
        self.write(f'SYST:BEEP:STAT {"ON" if state else "OFF"}')
    
    def get_error(self):
        return self.query('SYST:ERR?')
    
    def get_date(self):
        return self.query('SYST:DATE?')
    
    def set_date(self, year, month, day):
        self.write(f'SYST:DATE {year},{month},{day}')
    
    def get_time(self):
        return self.query('SYST:TIME?')
    
    def set_time(self, hour, minute, second):
        self.write(f'SYST:TIME {hour},{minute},{second}')
    
    def get_scpi_version(self):
        return self.query('SYST:VERS?')
    
    # Temperature Unit
    def set_temp_unit(self, unit):
        self.write(f'UNIT:TEMP {unit}')
    
    def get_temp_unit(self):
        return self.query('UNIT:TEMP?')
    
    # LAN/LXI Commands
    def lxi_reset(self):
        """Reset LAN to defaults."""
        self.write('LXI:RES')
    
    def lxi_restart(self):
        """Apply LAN settings and restart."""
        self.write('LXI:REST')
    
    def enable_mdns(self, state=True):
        """Enable/disable mDNS discovery."""
        self.write(f'LXI:MDNS:ENAB {"ON" if state else "OFF"}')
    
    def get_mac_address(self):
        """Get MAC address."""
        return self.query('SYST:COMM:LAN:MAC?')
    
    def set_dhcp(self, state):
        """Enable/disable DHCP."""
        self.write(f'SYST:COMM:LAN:DHCP {"ON" if state else "OFF"}')
    
    def set_ip_address(self, ip):
        """Set static IP address."""
        self.write(f'SYST:COMM:LAN:IPAD "{ip}"')
    
    def get_ip_address(self):
        """Get current IP address."""
        return self.query('SYST:COMM:LAN:IPAD?')


# Example usage
if __name__ == '__main__':
    with RigolDM858('192.168.1.101') as dmm:
        print(f"Connected to: {dmm.idn()}")
        print(f"MAC: {dmm.get_mac_address()}")
        
        # Simple measurement
        voltage = dmm.measure_dcv()
        print(f"DC Voltage: {voltage:.6f} V")
        
        # Measurement with specified range and resolution
        voltage = dmm.measure_dcv(range_val=10, resolution=0.00001)
        print(f"DC Voltage (10V range, high res): {voltage:.6f} V")
        
        # Temperature measurement with K-type thermocouple
        temp = dmm.measure_temperature('TC', 'K')
        print(f"Temperature: {temp:.1f} °C")
        
        # Statistics example
        dmm.configure('VOLT:DC', 10)
        dmm.enable_statistics(True)
        dmm.set_sample_count(50)
        dmm.set_trigger_source('IMM')
        dmm.initiate()
        
        import time
        time.sleep(1)
        
        stats = dmm.get_statistics()
        print(f"\nStatistics over {dmm.get_count()} readings:")
        print(f"  Average: {stats['average']:.6f} V")
        print(f"  Std Dev: {stats['stddev']:.9f} V")
        print(f"  Range: {stats['minimum']:.6f} to {stats['maximum']:.6f} V")
```

---

## Driver Abstraction Strategy

### Unified Interface Design

```python
#!/usr/bin/env python3
"""
Abstract DMM interface for multi-vendor support.
Supports: Siglent SDM series, Rigol DM858 series
"""

from abc import ABC, abstractmethod
from enum import Enum
from dataclasses import dataclass
from typing import Optional, Dict, Any
import socket
import time


class DMMFunction(Enum):
    """Standard DMM measurement functions."""
    DC_VOLTAGE = 'DCV'
    AC_VOLTAGE = 'ACV'
    DC_CURRENT = 'DCI'
    AC_CURRENT = 'ACI'
    RESISTANCE_2W = '2WR'
    RESISTANCE_4W = '4WR'
    FREQUENCY = 'FREQ'
    PERIOD = 'PER'
    CAPACITANCE = 'CAP'
    CONTINUITY = 'CONT'
    DIODE = 'DIOD'
    TEMPERATURE = 'TEMP'


@dataclass
class MeasurementResult:
    """Container for measurement results."""
    value: float
    unit: str
    function: DMMFunction
    range_used: Optional[float] = None
    timestamp: Optional[float] = None


@dataclass
class Statistics:
    """Container for statistical results."""
    average: float
    stddev: float
    minimum: float
    maximum: float
    count: int


class AbstractDMM(ABC):
    """Abstract base class for digital multimeters."""
    
    @abstractmethod
    def connect(self) -> 'AbstractDMM':
        """Establish connection to instrument."""
        pass
    
    @abstractmethod
    def disconnect(self):
        """Close connection."""
        pass
    
    @abstractmethod
    def identify(self) -> str:
        """Return instrument identification."""
        pass
    
    @abstractmethod
    def reset(self):
        """Reset instrument to defaults."""
        pass
    
    @abstractmethod
    def measure(self, function: DMMFunction, 
                range_val: Optional[float] = None) -> MeasurementResult:
        """Perform single measurement."""
        pass
    
    @abstractmethod
    def configure(self, function: DMMFunction,
                  range_val: Optional[float] = None,
                  nplc: Optional[float] = None):
        """Configure measurement without triggering."""
        pass
    
    @abstractmethod
    def initiate(self):
        """Start measurement sequence."""
        pass
    
    @abstractmethod
    def fetch(self) -> float:
        """Fetch measurement from memory."""
        pass
    
    @abstractmethod
    def get_statistics(self) -> Statistics:
        """Get measurement statistics."""
        pass
    
    def __enter__(self):
        return self.connect()
    
    def __exit__(self, *args):
        self.disconnect()


class UnifiedDMM(AbstractDMM):
    """
    Unified DMM driver with automatic vendor detection.
    
    Supports:
    - Siglent SDM3045X, SDM3055, SDM3065X (port 5025)
    - Rigol DM858, DM858E (port 5555)
    """
    
    # Vendor-specific configuration
    VENDORS = {
        'SIGLENT': {
            'port': 5025,
            'idn_prefix': 'Siglent',
            'func_map': {
                DMMFunction.DC_VOLTAGE: 'VOLT:DC',
                DMMFunction.AC_VOLTAGE: 'VOLT:AC',
                DMMFunction.DC_CURRENT: 'CURR:DC',
                DMMFunction.AC_CURRENT: 'CURR:AC',
                DMMFunction.RESISTANCE_2W: 'RES',
                DMMFunction.RESISTANCE_4W: 'FRES',
                DMMFunction.FREQUENCY: 'FREQ',
                DMMFunction.PERIOD: 'PER',
                DMMFunction.CAPACITANCE: 'CAP',
                DMMFunction.CONTINUITY: 'CONT',
                DMMFunction.DIODE: 'DIOD',
                DMMFunction.TEMPERATURE: 'TEMP',
            }
        },
        'RIGOL': {
            'port': 5555,
            'idn_prefix': 'RIGOL',
            'func_map': {
                DMMFunction.DC_VOLTAGE: 'VOLT:DC',
                DMMFunction.AC_VOLTAGE: 'VOLT:AC',
                DMMFunction.DC_CURRENT: 'CURR:DC',
                DMMFunction.AC_CURRENT: 'CURR:AC',
                DMMFunction.RESISTANCE_2W: 'RES',
                DMMFunction.RESISTANCE_4W: 'FRES',
                DMMFunction.FREQUENCY: 'FREQ',
                DMMFunction.PERIOD: 'PER',
                DMMFunction.CAPACITANCE: 'CAP',
                DMMFunction.CONTINUITY: 'CONT',
                DMMFunction.DIODE: 'DIOD',
                DMMFunction.TEMPERATURE: 'TEMP',
            }
        }
    }
    
    # Unit mapping
    UNITS = {
        DMMFunction.DC_VOLTAGE: 'V',
        DMMFunction.AC_VOLTAGE: 'V',
        DMMFunction.DC_CURRENT: 'A',
        DMMFunction.AC_CURRENT: 'A',
        DMMFunction.RESISTANCE_2W: 'Ω',
        DMMFunction.RESISTANCE_4W: 'Ω',
        DMMFunction.FREQUENCY: 'Hz',
        DMMFunction.PERIOD: 's',
        DMMFunction.CAPACITANCE: 'F',
        DMMFunction.CONTINUITY: 'Ω',
        DMMFunction.DIODE: 'V',
        DMMFunction.TEMPERATURE: '°C',
    }
    
    def __init__(self, host: str, port: Optional[int] = None, 
                 vendor: Optional[str] = None):
        """
        Initialize DMM connection.
        
        Args:
            host: IP address or hostname
            port: Override default port (auto-detected if None)
            vendor: 'SIGLENT' or 'RIGOL' (auto-detected if None)
        """
        self.host = host
        self._port = port
        self._vendor = vendor
        self.sock = None
        self.timeout = 5.0
        self._config = None
    
    @property
    def port(self) -> int:
        if self._port:
            return self._port
        if self._vendor:
            return self.VENDORS[self._vendor]['port']
        # Try Siglent port first (5025), fall back to Rigol (5555)
        return 5025
    
    @property
    def vendor(self) -> str:
        return self._vendor or 'UNKNOWN'
    
    def connect(self) -> 'UnifiedDMM':
        """Connect and auto-detect vendor."""
        # Try primary port
        try:
            self._try_connect(self.port)
        except (socket.timeout, ConnectionRefusedError):
            # Try alternate port
            alt_port = 5555 if self.port == 5025 else 5025
            self._try_connect(alt_port)
            self._port = alt_port
        
        # Detect vendor from IDN
        idn = self.identify()
        for vendor, config in self.VENDORS.items():
            if config['idn_prefix'].upper() in idn.upper():
                self._vendor = vendor
                self._config = config
                break
        
        if not self._vendor:
            self._vendor = 'UNKNOWN'
            self._config = self.VENDORS['SIGLENT']  # Default to Siglent commands
        
        return self
    
    def _try_connect(self, port: int):
        """Attempt connection on specified port."""
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect((self.host, port))
    
    def disconnect(self):
        if self.sock:
            self.sock.close()
            self.sock = None
    
    def write(self, cmd: str):
        """Send command."""
        self.sock.sendall((cmd + '\n').encode())
    
    def read(self, bufsize: int = 4096) -> str:
        """Read response."""
        return self.sock.recv(bufsize).decode().strip()
    
    def query(self, cmd: str) -> str:
        """Send command and read response."""
        self.write(cmd)
        time.sleep(0.05)
        return self.read()
    
    def identify(self) -> str:
        return self.query('*IDN?')
    
    def reset(self):
        self.write('*RST')
    
    def _get_scpi_function(self, function: DMMFunction) -> str:
        """Get vendor-specific SCPI function name."""
        return self._config['func_map'][function]
    
    def measure(self, function: DMMFunction,
                range_val: Optional[float] = None) -> MeasurementResult:
        """Perform measurement."""
        scpi_func = self._get_scpi_function(function)
        cmd = f'MEAS:{scpi_func}?'
        if range_val is not None:
            cmd += f' {range_val}'
        
        value = float(self.query(cmd))
        
        return MeasurementResult(
            value=value,
            unit=self.UNITS[function],
            function=function,
            range_used=range_val,
            timestamp=time.time()
        )
    
    def configure(self, function: DMMFunction,
                  range_val: Optional[float] = None,
                  nplc: Optional[float] = None):
        """Configure measurement."""
        scpi_func = self._get_scpi_function(function)
        cmd = f'CONF:{scpi_func}'
        if range_val is not None:
            cmd += f' {range_val}'
        self.write(cmd)
        
        if nplc is not None:
            self.write(f'{scpi_func}:NPLC {nplc}')
    
    def initiate(self):
        self.write('INIT')
    
    def fetch(self) -> float:
        return float(self.query('FETC?'))
    
    def enable_statistics(self, state: bool = True):
        self.write(f'CALC:AVER {"ON" if state else "OFF"}')
    
    def get_statistics(self) -> Statistics:
        result = self.query('CALC:AVER:ALL?')
        values = [float(x) for x in result.split(',')]
        count = int(self.query('CALC:AVER:COUN?'))
        return Statistics(
            average=values[0],
            stddev=values[1],
            minimum=values[2],
            maximum=values[3],
            count=count
        )
    
    def set_sample_count(self, count: int):
        self.write(f'SAMP:COUN {count}')
    
    def set_trigger_source(self, source: str = 'IMM'):
        """Set trigger source ('IMM', 'EXT', 'BUS')."""
        self.write(f'TRIG:SOUR {source}')


# Example usage
if __name__ == '__main__':
    # Auto-detect vendor and connect
    with UnifiedDMM('192.168.1.100') as dmm:
        print(f"Connected to: {dmm.identify()}")
        print(f"Detected vendor: {dmm.vendor}")
        
        # Simple measurements using unified API
        dcv = dmm.measure(DMMFunction.DC_VOLTAGE)
        print(f"DC Voltage: {dcv.value:.6f} {dcv.unit}")
        
        res = dmm.measure(DMMFunction.RESISTANCE_2W, range_val=10000)
        print(f"Resistance: {res.value:.3f} {res.unit}")
        
        # Statistics
        dmm.configure(DMMFunction.DC_VOLTAGE, range_val=10, nplc=10)
        dmm.enable_statistics(True)
        dmm.set_sample_count(100)
        dmm.set_trigger_source('IMM')
        dmm.initiate()
        
        time.sleep(2)
        
        stats = dmm.get_statistics()
        print(f"\nStatistics ({stats.count} samples):")
        print(f"  Average: {stats.average:.6f} V")
        print(f"  Std Dev: {stats.stddev:.9f} V")
        print(f"  Min/Max: {stats.minimum:.6f} / {stats.maximum:.6f} V")
```

---

## Summary

### Key Differences Between Vendors

| Aspect | Siglent SDM | Rigol DM858 |
|--------|-------------|-------------|
| **Socket Port** | 5025 | 5555 |
| **IDN Prefix** | "Siglent" | "RIGOL" |
| **Resolution Param** | Not in MEAS/CONF | Supported |
| **Memory** | 1K-10K points | 20K-500K points |
| **Scanner Card** | SDM3065X-SC | Not available |
| **Thermocouple** | Not supported | Supported |
| **LXI/mDNS** | Basic | Full support |
| **Screenshot** | Not via SCPI | HCOP commands |
| **File Storage** | Limited | Full MMEM commands |

### Common Command Compatibility

Both instruments share ~90% command compatibility:
- IEEE 488.2 common commands (identical)
- MEAS/CONF commands (identical syntax)
- TRIG subsystem (mostly identical)
- CALC subsystem (identical)
- SENS subsystem (identical)
- DATA subsystem (identical)

### Abstraction Recommendations

1. **Use abstract base class** for vendor-neutral code
2. **Auto-detect vendor** from *IDN? response
3. **Handle port differences** (5025 vs 5555)
4. **Normalize response formats** (strip units, parse scientific notation)
5. **Map vendor-specific features** to common interface where possible
6. **Expose vendor-specific features** through optional methods
