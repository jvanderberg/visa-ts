# Digital Multimeter (DMM) SCPI Command Reference

> Comprehensive multi-vendor SCPI reference for bench and system digital multimeters
> Covers entry-level through professional-grade instruments

## Instrument Coverage

### Entry Level ($100-$500)

| Vendor | Model Series | Digits | DC Accuracy | Interface | Notes |
|--------|--------------|--------|-------------|-----------|-------|
| Rigol | DM858/DM858E | 5.5 | 0.015% | USB/LAN | Entry bench DMM |
| Rigol | DM3068 | 6.5 | 0.0035% | USB/LAN/GPIB | Higher accuracy |
| Siglent | SDM3045X | 4.5 | 0.025% | USB/LAN | Budget |
| Siglent | SDM3055 | 5.5 | 0.015% | USB/LAN | Better accuracy |
| Siglent | SDM3065X | 6.5 | 0.0035% | USB/LAN | Excellent value |
| BK Precision | 5492B | 5.5 | 0.015% | USB/GPIB | |
| GW Instek | GDM-8351 | 5.5 | 0.012% | USB/LAN | |
| GW Instek | GDM-8261A | 6.5 | 0.0035% | USB/LAN/GPIB | |
| OWON | XDM1041 | 4.5 | 0.05% | USB | Basic |

### Mid-Range ($500-$2000)

| Vendor | Model Series | Digits | DC Accuracy | Interface | Notes |
|--------|--------------|--------|-------------|-----------|-------|
| Keysight | 34450A | 5.5 | 0.015% | USB | Basic Keysight |
| Keysight | 34460A | 6.5 | 0.0035% | USB/LAN | Truevolt series |
| Keysight | 34461A | 6.5 | 0.0035% | USB/LAN/GPIB | With graphing |
| Tektronix | DMM4040 | 5.5 | 0.012% | USB/GPIB | |
| Tektronix | DMM4050 | 6.5 | 0.0035% | USB/GPIB | |
| Fluke | 8845A | 6.5 | 0.0024% | USB/LAN/GPIB | |
| Fluke | 8846A | 6.5 | 0.0024% | USB/LAN/GPIB | Dual display |
| R&S | HMC8012 | 5.5 | 0.015% | USB/LAN | |

### Professional ($2000+)

| Vendor | Model Series | Digits | DC Accuracy | Interface | Notes |
|--------|--------------|--------|-------------|-----------|-------|
| Keysight | 34465A | 6.5 | 0.0030% | USB/LAN/GPIB | Fast digitizing |
| Keysight | 34470A | 7.5 | 0.0016% | USB/LAN/GPIB | High resolution |
| Keysight | 3458A | 8.5 | 0.0001% | GPIB | Reference standard |
| Keithley | DMM6500 | 6.5 | 0.0030% | USB/LAN/GPIB | Touchscreen |
| Keithley | DMM7510 | 7.5 | 0.0008% | USB/LAN/GPIB | Graphical, fast |
| Fluke | 8508A | 8.5 | 0.00008% | GPIB | Reference DMM |
| R&S | HMC8012-G | 5.5 | 0.015% | USB/LAN/GPIB | With GPIB |
| Datron | 1281 | 8.5 | 0.00003% | GPIB | Calibration std |

### System/PXI DMMs

| Vendor | Model Series | Digits | DC Accuracy | Interface | Notes |
|--------|--------------|--------|-------------|-----------|-------|
| Keysight | 34410A/34411A | 6.5 | 0.0030% | USB/LAN/GPIB | System DMM |
| Keysight | 34420A | 7.5 | 0.0007% | GPIB | Nanovolt meter |
| Keithley | 2000 | 6.5 | 0.002% | USB/GPIB | Classic |
| Keithley | 2010 | 7.5 | 0.0018% | GPIB | Low noise |
| NI | PXI-4071 | 7.5 | 0.0008% | PXI | High speed |
| NI | PXI-4072 | 6.5 | 0.004% | PXI | FlexDMM |

---

## IEEE 488.2 Common Commands (Universal)

```
*IDN?                → Instrument identification
*RST                 → Reset to default state
*CLS                 → Clear status registers
*ESE <mask>          → Event status enable register
*ESE?                → Query event status enable
*ESR?                → Query event status register
*OPC                 → Operation complete
*OPC?                → Query operation complete
*SRE <mask>          → Service request enable register
*SRE?                → Query service request enable
*STB?                → Query status byte
*TRG                 → Software trigger
*TST?                → Self-test
*WAI                 → Wait for operations complete
```

---

## Measurement Functions

### Function Selection

| Vendor | DC Voltage | AC Voltage | DC Current | AC Current | Resistance |
|--------|------------|------------|------------|------------|------------|
| Keysight | `CONF:VOLT:DC` | `CONF:VOLT:AC` | `CONF:CURR:DC` | `CONF:CURR:AC` | `CONF:RES` |
| Keithley | `SENS:FUNC "VOLT:DC"` | `SENS:FUNC "VOLT:AC"` | `SENS:FUNC "CURR:DC"` | `SENS:FUNC "CURR:AC"` | `SENS:FUNC "RES"` |
| Fluke | `CONF:VOLT:DC` | `CONF:VOLT:AC` | `CONF:CURR:DC` | `CONF:CURR:AC` | `CONF:RES` |
| Rigol | `FUNC:VOLT:DC` | `FUNC:VOLT:AC` | `FUNC:CURR:DC` | `FUNC:CURR:AC` | `FUNC:RES` |
| Siglent | `CONF:VOLT:DC` | `CONF:VOLT:AC` | `CONF:CURR:DC` | `CONF:CURR:AC` | `CONF:RES` |

### Additional Functions

| Function | Keysight | Keithley | Notes |
|----------|----------|----------|-------|
| 4-wire resistance | `CONF:FRES` | `SENS:FUNC "FRES"` | Kelvin sensing |
| Continuity | `CONF:CONT` | `SENS:FUNC "CONT"` | |
| Diode test | `CONF:DIOD` | `SENS:FUNC "DIOD"` | |
| Frequency | `CONF:FREQ` | `SENS:FUNC "FREQ"` | |
| Period | `CONF:PER` | `SENS:FUNC "PER"` | |
| Temperature | `CONF:TEMP` | `SENS:FUNC "TEMP"` | RTD/thermocouple |
| Capacitance | `CONF:CAP` | `SENS:FUNC "CAP"` | |

### Query Current Function

| Vendor | Command | Returns |
|--------|---------|---------|
| Keysight | `FUNC?` or `CONF?` | `"VOLT:DC"`, `"CURR:AC"`, etc. |
| Keithley | `SENS:FUNC?` | `"VOLT:DC"`, `"RES"`, etc. |
| Rigol | `FUNC?` | `VOLT:DC`, `VOLT:AC`, etc. |
| Siglent | `CONF?` | Function and range |

---

## Range Selection

### Auto Range

| Vendor | Enable Auto | Disable Auto | Query |
|--------|-------------|--------------|-------|
| Keysight | `VOLT:DC:RANG:AUTO ON` | `VOLT:DC:RANG:AUTO OFF` | `VOLT:DC:RANG:AUTO?` |
| Keithley | `SENS:VOLT:DC:RANG:AUTO ON` | `SENS:VOLT:DC:RANG:AUTO OFF` | `SENS:VOLT:DC:RANG:AUTO?` |
| Fluke | `VOLT:DC:RANG:AUTO ON` | `VOLT:DC:RANG:AUTO OFF` | `VOLT:DC:RANG:AUTO?` |
| Rigol | `VOLT:DC:RANG:AUTO ON` | `VOLT:DC:RANG:AUTO OFF` | `VOLT:DC:RANG:AUTO?` |
| Siglent | `VOLT:DC:RANG:AUTO ON` | `VOLT:DC:RANG:AUTO OFF` | `VOLT:DC:RANG:AUTO?` |

### Manual Range

| Vendor | Command | Example |
|--------|---------|---------|
| Keysight | `[SENSe:]<func>:RANGe <range>` | `VOLT:DC:RANG 10` |
| Keithley | `SENSe:<func>:RANGe <range>` | `SENS:VOLT:DC:RANG 10` |
| Fluke | `<func>:RANGe <range>` | `VOLT:DC:RANG 10` |
| Rigol | `<func>:RANGe <range>` | `VOLT:DC:RANG 10` |
| Siglent | `<func>:RANGe <range>` | `VOLT:DC:RANG 10` |

### Common Ranges

| Function | Typical Ranges |
|----------|----------------|
| DC Voltage | 100mV, 1V, 10V, 100V, 1000V |
| AC Voltage | 100mV, 1V, 10V, 100V, 750V |
| DC Current | 100µA, 1mA, 10mA, 100mA, 1A, 3A/10A |
| AC Current | 1mA, 10mA, 100mA, 1A, 3A/10A |
| Resistance | 100Ω, 1kΩ, 10kΩ, 100kΩ, 1MΩ, 10MΩ, 100MΩ |

---

## Resolution and NPLC

### Integration Time (NPLC)

NPLC = Number of Power Line Cycles. Higher = more noise rejection, slower measurement.

| Vendor | Command | Values |
|--------|---------|--------|
| Keysight | `[SENSe:]<func>:NPLC <nplc>` | 0.02, 0.2, 1, 10, 100 |
| Keithley | `SENSe:<func>:NPLC <nplc>` | 0.0005 to 15 |
| Fluke | `<func>:NPLC <nplc>` | 0.1, 1, 10, 100 |
| Rigol | `<func>:NPLC <nplc>` | 0.02, 0.2, 1, 10, 100 |
| Siglent | `<func>:NPLC <nplc>` | 0.006, 0.06, 0.6, 6, 60 |

### Aperture Time (Alternative)

| Vendor | Command | Units |
|--------|---------|-------|
| Keysight | `[SENSe:]<func>:APERture <seconds>` | Seconds |
| Keithley | `SENSe:<func>:APERture <seconds>` | Seconds |

### Resolution (Digits)

| Vendor | Command | Values |
|--------|---------|--------|
| Keysight | `[SENSe:]<func>:RESolution <resolution>` | MAXimum, MINimum, or value |
| Keithley | `SENSe:<func>:DIGits <digits>` | 4, 5, 6, 7 |
| Rigol | `<func>:RES <value>` | Resolution in units |

### Speed/Accuracy Presets

Some DMMs offer presets:

```
# Keysight (Truevolt series)
[SENSe:]<func>:NPLC 0.02          # Fast (50 rdg/s at 50Hz)
[SENSe:]<func>:NPLC 1             # Medium
[SENSe:]<func>:NPLC 10            # Slow, accurate
[SENSe:]<func>:NPLC 100           # Very slow, highest accuracy
```

---

## Taking Measurements

### Single Reading

| Vendor | Command | Returns |
|--------|---------|---------|
| Keysight | `READ?` | Current measurement |
| Keysight | `MEASure:<func>?` | Configure and measure |
| Keithley | `READ?` | Current measurement |
| Keithley | `MEASure:<func>?` | Configure and measure |
| Fluke | `READ?` | Current measurement |
| Rigol | `MEAS:<func>?` | Configure and measure |
| Siglent | `READ?` or `MEAS?` | Current measurement |

### Fetch Last Reading

| Vendor | Command | Notes |
|--------|---------|-------|
| Keysight | `FETCh?` | Returns last reading without triggering |
| Keithley | `FETCh?` | |
| Fluke | `FETCh?` | |
| Rigol | `FETCh?` | |

### Continuous Reading

```
# Keysight - Initiate and read
INITiate
FETCH?

# Or use READ? which combines INIT + FETCH

# For multiple samples
SAMPle:COUNt 10
READ?              # Returns 10 readings
```

### Measurement Examples

```
# Keysight - Measure DC voltage
MEASure:VOLTage:DC?

# Keysight - Configure then measure
CONFigure:VOLTage:DC 10,0.001    # 10V range, 1mV resolution
READ?

# Keithley - Measure resistance
SENS:FUNC "RES"
SENS:RES:RANG 10E3               # 10kΩ range
READ?

# Rigol - Measure AC current
MEAS:CURR:AC?

# Siglent - Measure DC voltage on auto range
CONF:VOLT:DC AUTO
READ?
```

---

## Trigger System

### Trigger Source

| Vendor | Command | Options |
|--------|---------|---------|
| Keysight | `TRIGger:SOURce <source>` | IMMediate, BUS, EXTernal, INTernal |
| Keithley | `TRIGger:SOURce <source>` | IMMediate, BUS, EXTernal, TIMer |
| Fluke | `TRIGger:SOURce <source>` | IMMediate, BUS, EXTernal |
| Rigol | `TRIGger:SOURce <source>` | IMMediate, BUS, EXTernal |

### Trigger Delay

| Vendor | Command | Units |
|--------|---------|-------|
| Keysight | `TRIGger:DELay <seconds>` | Seconds |
| Keysight | `TRIGger:DELay:AUTO {ON|OFF}` | Auto delay |
| Keithley | `TRIGger:DELay <seconds>` | Seconds |
| Fluke | `TRIGger:DELay <seconds>` | Seconds |

### Sample Count

| Vendor | Command | Range |
|--------|---------|-------|
| Keysight | `SAMPle:COUNt <n>` | 1 to 1M+ |
| Keithley | `SAMPle:COUNt <n>` | 1 to 55000 |
| Fluke | `SAMPle:COUNt <n>` | 1 to 50000 |
| Rigol | `SAMP:COUN <n>` | 1 to 10000 |

### Trigger Count

| Vendor | Command | Notes |
|--------|---------|-------|
| Keysight | `TRIGger:COUNt <n>` | Number of trigger events |
| Keithley | `TRIGger:COUNt <n>` | |
| Fluke | `TRIGger:COUNt <n>` | |

### Software Trigger

| Vendor | Command |
|--------|---------|
| All | `*TRG` |
| Keysight | `TRIGger[:IMMediate]` |

### Initiate Measurement

| Vendor | Command |
|--------|---------|
| All | `INITiate[:IMMediate]` |

---

## Math Functions

### Null/Relative

| Vendor | Enable | Set Value | Auto Acquire |
|--------|--------|-----------|--------------|
| Keysight | `[SENSe:]<func>:NULL[:STATe] ON` | `[SENSe:]<func>:NULL:VALue <v>` | `[SENSe:]<func>:NULL:VALue:AUTO ON` |
| Keithley | `CALC:FUNC NULL` + `CALC:STAT ON` | `CALC:NULL:OFFS <v>` | `CALC:NULL:ACQ` |
| Fluke | `CALC:NULL[:STATe] ON` | `CALC:NULL:VALue <v>` | |
| Rigol | `CALC:FUNC NULL` | `CALC:NULL:OFFS <v>` | `CALC:NULL:OFFS:ACQ` |

### Statistics (Min/Max/Average)

| Vendor | Enable | Query Min | Query Max | Query Avg | Query Count |
|--------|--------|-----------|-----------|-----------|-------------|
| Keysight | `CALCulate:AVERage[:STATe] ON` | `CALC:AVER:MIN?` | `CALC:AVER:MAX?` | `CALC:AVER:AVER?` | `CALC:AVER:COUN?` |
| Keithley | (use buffer) | `CALC:DATA? MIN` | `CALC:DATA? MAX` | `CALC:DATA? MEAN` | `TRAC:POIN:ACT?` |
| Fluke | `CALC:STAT ON` | `CALC:MIN?` | `CALC:MAX?` | `CALC:AVER?` | `CALC:COUN?` |
| Rigol | `CALC:FUNC STAT` | `CALC:MIN?` | `CALC:MAX?` | `CALC:AVER?` | `CALC:COUN?` |

### dB/dBm

| Vendor | Enable dBm | Set Reference |
|--------|------------|---------------|
| Keysight | `[SENSe:]VOLT:AC:DBM[:STATe] ON` | `[SENSe:]VOLT:AC:DBM:REFerence <ohms>` |
| Keysight | `[SENSe:]VOLT:AC:DB[:STATe] ON` | `[SENSe:]VOLT:AC:DB:REFerence <dBm>` |
| Keithley | `CALC:FUNC DB` or `DBM` | `CALC:DB:REF <v>` |
| Fluke | `VOLT:AC:DBM ON` | `VOLT:AC:DBM:REF <ohms>` |

### Limits Testing

| Vendor | Enable | Set Limits |
|--------|--------|------------|
| Keysight | `CALCulate:LIMit[:STATe] ON` | `CALC:LIM:LOW <v>`, `CALC:LIM:UPP <v>` |
| Keithley | `CALC:LIM<n>:STAT ON` | `CALC:LIM<n>:LOW <v>`, `CALC:LIM<n>:UPP <v>` |
| Fluke | `CALC:LIM:STAT ON` | `CALC:LIM:LOW <v>`, `CALC:LIM:UPP <v>` |

---

## Data Logging / Buffer

### Buffer Size

| Vendor | Command | Max Size |
|--------|---------|----------|
| Keysight | `DATA:POINts <n>` | 1M+ readings |
| Keithley | `TRACe:POINts <n>` | 55000+ |
| Fluke | (sample count based) | 50000 |
| Rigol | `DATA:POIN <n>` | 10000 |

### Clear Buffer

| Vendor | Command |
|--------|---------|
| Keysight | `DATA:CLEar` |
| Keithley | `TRACe:CLEar` |
| Fluke | `DATA:DEL:ALL` |

### Read Buffer

| Vendor | Command | Options |
|--------|---------|---------|
| Keysight | `DATA:REMove? <n>` | Remove and return readings |
| Keysight | `DATA:DATA?` | Return all readings |
| Keithley | `TRACe:DATA?` | Return all |
| Keithley | `TRACe:DATA? <start>,<count>` | Range |
| Fluke | `DATA?` | Return all |
| Rigol | `DATA:DATA?` | Return all |

### Timestamped Readings

| Vendor | Command |
|--------|---------|
| Keysight 34465A/70A | `DATA:REMove? <n>,READing,TIMe` |
| Keithley | (use buffer with timestamp enabled) |

---

## Secondary Measurements

### Dual Display / Secondary Function

| Vendor | Command | Notes |
|--------|---------|-------|
| Keysight 34461A | `[SENSe:]<func>:SECondary "<func>"` | e.g., "FREQ" with AC |
| Fluke 8846A | (front panel only) | Dual display |
| Keithley | (varies by model) | |

---

## Temperature Measurement

### Thermocouple

| Vendor | Command | Types |
|--------|---------|-------|
| Keysight | `CONF:TEMP TC,<type>` | B, E, J, K, N, R, S, T |
| Keithley | `SENS:FUNC "TEMP"; SENS:TEMP:TRAN TC; SENS:TEMP:TC:TYPE <type>` | J, K, N, T, E, R, S, B |
| Fluke | `CONF:TEMP TC,<type>` | J, K, T, E, N, R, S, B, C |
| Rigol | `CONF:TEMP:TC,<type>` | J, K, T, E, R, S, B, N |

### RTD

| Vendor | Command | Types |
|--------|---------|-------|
| Keysight | `CONF:TEMP RTD,<type>` | PT100, PT385, PT3916 |
| Keithley | `SENS:TEMP:TRAN FRTD; SENS:TEMP:RTD:FOUR:TYPE <type>` | |
| Fluke | `CONF:TEMP RTD,<type>` | |

### Thermistor

| Vendor | Command |
|--------|---------|
| Keysight | `CONF:TEMP THER,<type>` | 2.2k, 5k, 10k |
| Keithley | `SENS:TEMP:TRAN THER` |

### Temperature Units

| Vendor | Command | Options |
|--------|---------|---------|
| Keysight | `UNIT:TEMPerature {C|F|K}` | Celsius, Fahrenheit, Kelvin |
| Keithley | `UNIT:TEMP {CEL|FAR|K}` | |
| Fluke | `UNIT:TEMP {C|F|K}` | |

---

## AC Measurements

### AC Bandwidth

| Vendor | Command | Options |
|--------|---------|---------|
| Keysight | `[SENSe:]VOLT:AC:BANDwidth <bw>` | 3, 20, 200 (Hz) |
| Keithley | `SENS:VOLT:AC:DET:BAND <bw>` | 3, 30, 300 (Hz) |
| Fluke | `VOLT:AC:BAND <bw>` | SLOW, MEDIUM, FAST |
| Rigol | `VOLT:AC:BAND <bw>` | 20, 200 (Hz) |

### AC Filter

The bandwidth setting affects:
- Low frequency = Slow filter = Better low-frequency accuracy
- High frequency = Fast filter = Better for higher frequencies

---

## Capacitance Measurement

### Configure Capacitance

| Vendor | Command |
|--------|---------|
| Keysight | `CONFigure:CAPacitance [<range>]` |
| Keithley | `SENSe:FUNCtion "CAP"` |
| Fluke | `CONFigure:CAP` |
| Rigol | `CONFigure:CAP` |

### Capacitance Range

| Vendor | Command | Typical Ranges |
|--------|---------|----------------|
| All | `[SENSe:]CAPacitance:RANGe <range>` | 1nF, 10nF, 100nF, 1µF, 10µF, 100µF |

---

## System Commands

### Error Query

| Vendor | Command |
|--------|---------|
| All | `SYSTem:ERRor[:NEXT]?` |

### Self-Test

| Vendor | Command | Returns |
|--------|---------|---------|
| All | `*TST?` | 0 = pass, 1 = fail |

### Beeper

| Vendor | Command |
|--------|---------|
| Keysight | `SYSTem:BEEPer[:IMMediate]` |
| Keysight | `SYSTem:BEEPer:STATe {ON|OFF}` |
| Keithley | `SYST:BEEP <freq>,<duration>` |
| Fluke | `SYST:BEEP` |

### Display Text

| Vendor | Command |
|--------|---------|
| Keysight | `DISPlay:TEXT "<message>"` |
| Keysight | `DISPlay:TEXT:CLEar` |
| Keithley | `DISP:TEXT:DATA "<message>"` |
| Keithley | `DISP:TEXT:STAT ON` |
| Fluke | `DISP:TEXT "<message>"` |

### Remote/Local

| Vendor | Command |
|--------|---------|
| All | `SYSTem:REMote` |
| All | `SYSTem:LOCal` |
| Keysight | `SYSTem:RWLock` (remote with lock) |

---

## Input Impedance

### High Impedance Mode (>10GΩ)

| Vendor | Command | Notes |
|--------|---------|-------|
| Keysight | `[SENSe:]VOLT:DC:IMPedance:AUTO {ON|OFF}` | Auto selects for 100mV, 1V ranges |
| Keithley | `SENS:VOLT:DC:INP:IMP:AUTO {ON|OFF}` | |
| Fluke | `VOLT:DC:IMP AUTO` | |

When AUTO is ON:
- 10V, 100V, 1000V ranges: 10MΩ input impedance
- 100mV, 1V ranges: >10GΩ input impedance

---

## Vendor-Specific Features

### Keysight Truevolt (34460A/34461A/34465A/34470A)

```
# Smoothing filter
[SENSe:]<func>:SMOOthing[:STATe] {ON|OFF}
[SENSe:]<func>:SMOOthing:RESPonse {SLOW|MEDIUM|FAST}

# Auto-zero
[SENSe:]<func>:ZERO:AUTO {ON|OFF|ONCE}

# Digitizing
[SENSe:]DIGitize:VOLTage[:DC] [<range>]
[SENSe:]DIGitize:APERture <seconds>

# Histogram
CALCulate:TRANsform:HISTogram[:STATe] ON
CALCulate:TRANsform:HISTogram:DATA?
CALCulate:TRANsform:HISTogram:RANGe:AUTO ON
```

### Keithley DMM6500/DMM7510

```
# Front/rear terminal selection
ROUTe:TERMinals {FRONt|REAR}

# Digitizing (DMM7510)
DIGitize:FUNCtion "<func>"
DIGitize:VOLTage:APERture <seconds>
DIGitize:VOLTage:SRATe <samples/sec>

# Buffer operations
TRACe:MAKE "<name>", <size>
TRACe:TRIG "<name>"
TRACe:DATA? <start>, <count>, "<name>", READ, TST, STAT

# Scanning (with switching card)
ROUTe:SCAN (@1:10)
ROUTe:SCAN:COUNt:SCAN <n>
INITiate
```

### Fluke 884xA

```
# Dual display
CONFigure:SECondary <func>

# External triggering
TRIGger:LEVel <volts>
TRIGger:SLOPe {POSitive|NEGative}

# Peak detection (AC)
[SENSe:]VOLT:AC:PEAK?

# dB offset
[SENSe:]VOLT:AC:DB:REFerence <dB>
```

### Rigol DM858/DM3068

```
# Comparator mode
CALC:LIM:STAT ON
CALC:LIM:LOW <v>
CALC:LIM:UPP <v>
CALC:LIM:BEEP ON

# Trend chart
DISP:TREN ON

# Rate setting (readings per second)
RATE {S|M|F}    # Slow/Medium/Fast
```

### Siglent SDM3000X

```
# Histogram
CALC:HIST ON
CALC:HIST:DATA?

# Trend
CALC:TREN ON
CALC:TREN:DATA?

# Math operations
CALC:FUNC {NULL|DB|DBM|MXB|INV|LIM|STAT}
CALC:DB:REF <val>
```

---

## Vendor Command Variations Summary

| Function | Keysight 34461A | Keithley DMM6500 | Fluke 8845A | Rigol DM858 |
|----------|-----------------|------------------|-------------|-------------|
| DC Voltage | `CONF:VOLT:DC` | `SENS:FUNC "VOLT:DC"` | `CONF:VOLT:DC` | `FUNC:VOLT:DC` |
| Read | `READ?` | `READ?` | `READ?` | `MEAS?` |
| Set range | `VOLT:DC:RANG 10` | `SENS:VOLT:DC:RANG 10` | `VOLT:DC:RANG 10` | `VOLT:DC:RANG 10` |
| Auto range | `VOLT:DC:RANG:AUTO ON` | `SENS:VOLT:DC:RANG:AUTO ON` | `VOLT:DC:RANG:AUTO ON` | `VOLT:DC:RANG:AUTO ON` |
| Set NPLC | `VOLT:DC:NPLC 10` | `SENS:VOLT:DC:NPLC 10` | `VOLT:DC:NPLC 10` | `VOLT:DC:NPLC 10` |
| Null on | `VOLT:DC:NULL ON` | `CALC:FUNC NULL;CALC:STAT ON` | `CALC:NULL ON` | `CALC:FUNC NULL` |
| Min/Max | `CALC:AVER ON` | (buffer based) | `CALC:STAT ON` | `CALC:FUNC STAT` |
| Trig source | `TRIG:SOUR BUS` | `TRIG:SOUR BUS` | `TRIG:SOUR BUS` | `TRIG:SOUR BUS` |
| Sample cnt | `SAMP:COUN 100` | `SAMP:COUN 100` | `SAMP:COUN 100` | `SAMP:COUN 100` |

---

## Abstract Driver Interface

```typescript
type MeasurementFunction =
  | 'dc_voltage'
  | 'ac_voltage'
  | 'dc_current'
  | 'ac_current'
  | 'resistance_2w'
  | 'resistance_4w'
  | 'continuity'
  | 'diode'
  | 'frequency'
  | 'period'
  | 'temperature'
  | 'capacitance';

interface DMMConfiguration {
  /** Measurement function */
  function: MeasurementFunction;

  /** Measurement range (or 'auto') */
  range: number | 'auto';

  /** Integration time in NPLC */
  nplc: number;

  /** Auto-zero enabled */
  autoZero: boolean;

  /** High impedance mode (for voltage) */
  highImpedance: boolean;
}

interface DMMTrigger {
  /** Trigger source */
  source: 'immediate' | 'bus' | 'external' | 'timer';

  /** Trigger delay in seconds */
  delay: number;

  /** Auto trigger delay */
  autoDelay: boolean;

  /** Number of samples per trigger */
  sampleCount: number;

  /** Number of trigger events */
  triggerCount: number;
}

interface DMMStatistics {
  /** Minimum reading */
  min: number;

  /** Maximum reading */
  max: number;

  /** Average reading */
  average: number;

  /** Standard deviation */
  stdDev?: number;

  /** Reading count */
  count: number;
}

interface DMMNull {
  /** Null enabled */
  enabled: boolean;

  /** Null offset value */
  value: number;
}

interface DMMLimit {
  /** Limits enabled */
  enabled: boolean;

  /** Lower limit */
  lower: number;

  /** Upper limit */
  upper: number;
}

interface DigitalMultimeter {
  /** Identification */
  identify(): Promise<Result<string, Error>>;

  /** Reset to defaults */
  reset(): Promise<Result<void, Error>>;

  /** Get/set measurement configuration */
  getConfiguration(): Promise<Result<DMMConfiguration, Error>>;
  setConfiguration(config: Partial<DMMConfiguration>): Promise<Result<void, Error>>;

  /** Convenience: configure specific function */
  configureDCVoltage(range?: number | 'auto'): Promise<Result<void, Error>>;
  configureACVoltage(range?: number | 'auto'): Promise<Result<void, Error>>;
  configureDCCurrent(range?: number | 'auto'): Promise<Result<void, Error>>;
  configureACCurrent(range?: number | 'auto'): Promise<Result<void, Error>>;
  configureResistance(fourWire: boolean, range?: number | 'auto'): Promise<Result<void, Error>>;
  configureFrequency(): Promise<Result<void, Error>>;
  configureTemperature(
    sensor: 'thermocouple' | 'rtd' | 'thermistor',
    type?: string
  ): Promise<Result<void, Error>>;

  /** Take single reading */
  read(): Promise<Result<number, Error>>;

  /** Take multiple readings */
  readMultiple(count: number): Promise<Result<number[], Error>>;

  /** Fetch last reading (no new measurement) */
  fetch(): Promise<Result<number, Error>>;

  /** Initiate measurement (for triggered operation) */
  initiate(): Promise<Result<void, Error>>;

  /** Software trigger */
  trigger(): Promise<Result<void, Error>>;

  /** Get/set trigger configuration */
  getTrigger(): Promise<Result<DMMTrigger, Error>>;
  setTrigger(trigger: Partial<DMMTrigger>): Promise<Result<void, Error>>;

  /** Null/relative mode */
  getNull(): Promise<Result<DMMNull, Error>>;
  setNull(enabled: boolean, value?: number): Promise<Result<void, Error>>;
  acquireNull(): Promise<Result<void, Error>>;

  /** Statistics (min/max/avg) */
  enableStatistics(enabled: boolean): Promise<Result<void, Error>>;
  getStatistics(): Promise<Result<DMMStatistics, Error>>;
  clearStatistics(): Promise<Result<void, Error>>;

  /** Limits/comparator */
  getLimits(): Promise<Result<DMMLimit, Error>>;
  setLimits(lower: number, upper: number, enabled?: boolean): Promise<Result<void, Error>>;

  /** Buffer operations */
  clearBuffer(): Promise<Result<void, Error>>;
  getBufferData(start?: number, count?: number): Promise<Result<number[], Error>>;
  getBufferCount(): Promise<Result<number, Error>>;

  /** Query errors */
  getError(): Promise<Result<{ code: number; message: string } | null, Error>>;

  /** Terminal selection (if supported) */
  setTerminals?(terminal: 'front' | 'rear'): Promise<Result<void, Error>>;
}
```

---

## Command Translation Table

| Driver Method | Keysight 34461A | Keithley DMM6500 | Fluke 8845A | Rigol DM858 |
|---------------|-----------------|------------------|-------------|-------------|
| `identify()` | `*IDN?` | `*IDN?` | `*IDN?` | `*IDN?` |
| `reset()` | `*RST` | `*RST` | `*RST` | `*RST` |
| `configureDCVoltage(10)` | `CONF:VOLT:DC 10` | `SENS:FUNC "VOLT:DC";SENS:VOLT:DC:RANG 10` | `CONF:VOLT:DC 10` | `FUNC:VOLT:DC;VOLT:DC:RANG 10` |
| `read()` | `READ?` | `READ?` | `READ?` | `MEAS?` |
| `fetch()` | `FETCH?` | `FETCH?` | `FETCH?` | `FETCH?` |
| `initiate()` | `INIT` | `INIT` | `INIT` | `INIT` |
| `trigger()` | `*TRG` | `*TRG` | `*TRG` | `*TRG` |
| `setNull(true)` | `VOLT:DC:NULL ON` | `CALC:FUNC NULL;CALC:STAT ON` | `CALC:NULL ON` | `CALC:FUNC NULL` |
| `acquireNull()` | `VOLT:DC:NULL:VAL:AUTO ON;VOLT:DC:NULL ON` | `CALC:NULL:ACQ` | (measure then set) | `CALC:NULL:OFFS:ACQ` |
| `enableStatistics(true)` | `CALC:AVER ON` | (buffer mode) | `CALC:STAT ON` | `CALC:FUNC STAT` |
| `getStatistics()` | `CALC:AVER:MIN?;MAX?;AVER?;COUN?` | `TRAC:DATA? 1,100;CALC:DATA? MIN,MAX,MEAN` | `CALC:MIN?;MAX?;AVER?;COUN?` | `CALC:MIN?;MAX?;AVER?;COUN?` |
| `setLimits(-1, 1, true)` | `CALC:LIM:LOW -1;UPP 1;STAT ON` | `CALC:LIM1:LOW -1;UPP 1;STAT ON` | `CALC:LIM:LOW -1;UPP 1;STAT ON` | `CALC:LIM:LOW -1;UPP 1;STAT ON` |

---

## Vendor Detection Patterns

```typescript
const DMM_VENDORS = {
  keysight: {
    patterns: [
      /Keysight.*344\d{2}/i,
      /Keysight.*345\d{2}/i,
      /Agilent.*344\d{2}/i,
      /Agilent.*345\d{2}/i,
    ],
    driver: 'KeysightDMMDriver',
  },
  keithley: {
    patterns: [
      /KEITHLEY.*DMM\d{4}/i,
      /KEITHLEY.*2\d{3}/i,
      /Tektronix.*DMM\d{4}/i,
    ],
    driver: 'KeithleyDMMDriver',
  },
  fluke: {
    patterns: [
      /FLUKE.*88\d{2}/i,
      /FLUKE.*85\d{2}/i,
    ],
    driver: 'FlukeDMMDriver',
  },
  rigol: {
    patterns: [
      /RIGOL.*DM8\d{2}/i,
      /RIGOL.*DM3\d{3}/i,
    ],
    driver: 'RigolDMMDriver',
  },
  siglent: {
    patterns: [
      /Siglent.*SDM\d{4}/i,
    ],
    driver: 'SiglentDMMDriver',
  },
  gw_instek: {
    patterns: [
      /GW.*GDM-\d{4}/i,
    ],
    driver: 'GWInstekDMMDriver',
  },
  bk_precision: {
    patterns: [
      /B&K.*549\d/i,
      /BK.*549\d/i,
    ],
    driver: 'BKPrecisionDMMDriver',
  },
};
```

---

## Connection Reference

| Vendor | USB VID:PID | Default TCP Port | GPIB | Notes |
|--------|-------------|------------------|------|-------|
| Keysight | 0957:xxxx | 5025 | Yes | VISA recommended |
| Keithley | 05E6:xxxx | 5025 | Yes | |
| Fluke | varies | 3490 | Yes | |
| Rigol | 1AB1:0C94 | 5555 | Optional | |
| Siglent | F4EC:EE3A | 5024/5025 | Optional | |
| GW Instek | 2184:xxxx | 5025 | Optional | |
| BK Precision | 0C97:xxxx | 5025 | Yes | |

---

## Programming Examples

### Basic DC Voltage Measurement

```typescript
const rm = createResourceManager();
const dmm = await rm.open('TCPIP0::192.168.1.100::5025::SOCKET');

// Configure for DC voltage, 10V range
await dmm.write('CONF:VOLT:DC 10');

// Take single reading
const result = await dmm.query('READ?');
console.log(`Voltage: ${result.value} V`);

await dmm.close();
```

### High-Accuracy Measurement

```typescript
// Configure for maximum accuracy
await dmm.write('CONF:VOLT:DC 10');           // 10V range
await dmm.write('VOLT:DC:NPLC 100');          // 100 PLC integration
await dmm.write('VOLT:DC:ZERO:AUTO ON');      // Auto-zero on
await dmm.write('VOLT:DC:IMP:AUTO ON');       // High impedance for low ranges

// Wait for settling and read
await dmm.query('*OPC?');
const result = await dmm.query('READ?');
console.log(`Voltage: ${result.value} V`);
```

### Multiple Readings with Statistics

```typescript
// Configure for 100 readings
await dmm.write('CONF:VOLT:DC AUTO');
await dmm.write('SAMP:COUN 100');
await dmm.write('CALC:AVER ON');

// Take readings
await dmm.write('INIT');
await dmm.query('*OPC?');  // Wait for completion

// Get statistics
const min = await dmm.query('CALC:AVER:MIN?');
const max = await dmm.query('CALC:AVER:MAX?');
const avg = await dmm.query('CALC:AVER:AVER?');

console.log(`Min: ${min.value}, Max: ${max.value}, Avg: ${avg.value}`);
```

### Triggered Measurement

```typescript
// Configure for external trigger
await dmm.write('CONF:VOLT:DC 10');
await dmm.write('TRIG:SOUR EXT');
await dmm.write('TRIG:COUN 10');
await dmm.write('SAMP:COUN 1');

// Arm the trigger
await dmm.write('INIT');

// ... wait for external triggers ...

// Fetch all readings
const data = await dmm.query('FETCH?');
console.log(`Readings: ${data.value}`);
```

---

## Notes

1. **NPLC vs Speed**: Higher NPLC = better noise rejection but slower. 1 NPLC = 20ms at 50Hz, 16.67ms at 60Hz.

2. **Auto-Zero**: Compensates for offset drift. Doubles measurement time when ON. Use ONCE for single compensation.

3. **Range Selection**: For best accuracy, use smallest range that won't overload. Auto-range adds switching time.

4. **Input Impedance**: Default is 10MΩ. Use high-impedance mode (>10GΩ) when measuring high-impedance circuits on low ranges.

5. **AC Bandwidth**: Lower bandwidth = better accuracy for low frequencies but slower response.

6. **Null Function**: Subtracts offset from readings. Acquire null at zero input for best results.

7. **4-Wire Resistance**: Use for accurate measurements. Eliminates lead resistance error.

8. **Temperature Sensors**: Ensure proper reference junction compensation for thermocouples.
