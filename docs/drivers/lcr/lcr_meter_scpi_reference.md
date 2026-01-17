# LCR Meter / Impedance Analyzer SCPI Command Reference

This document provides comprehensive SCPI command documentation for LCR meters and impedance analyzers across multiple vendors and price tiers.

---

## Instrument Coverage

### Entry Level / Handheld ($100-$1,000)
| Vendor | Series | Frequency | Features | Interfaces |
|--------|--------|-----------|----------|------------|
| BK Precision | 879B | 100Hz-10kHz | ESR, USB logging | USB |
| GW Instek | LCR-1000 | 100Hz-100kHz | Portable | USB |
| Siglent | SDM3055 (LCR) | 1kHz | DMM with LCR | USB, LAN |

### Bench LCR Meters ($1,000-$10,000)
| Vendor | Series | Frequency Range | Features | Interfaces |
|--------|--------|-----------------|----------|------------|
| GW Instek | LCR-6000 | 10Hz-300kHz | 0.05% accuracy | USB, RS-232, GPIB opt |
| GW Instek | LCR-8000G | 20Hz-10MHz | High precision | USB, RS-232, GPIB |
| BK Precision | 889B/891B | 20Hz-1MHz | Bench | USB, RS-232, GPIB |
| Hioki | IM3523 | DC to 200kHz | High speed | USB, RS-232, GPIB, LAN |
| Hioki | IM3536 | DC to 8MHz | High accuracy | USB, RS-232, GPIB, LAN |
| Keysight | E4980AL | 20Hz-300kHz/1MHz | Basic precision | USB, LAN, GPIB |

### Precision LCR Meters ($10,000-$50,000)
| Vendor | Series | Frequency Range | Features | Interfaces |
|--------|--------|-----------------|----------|------------|
| Keysight | E4980A | 20Hz-2MHz | 0.05% accuracy | USB, LAN, GPIB |
| Hioki | IM3570 | DC to 5MHz | Advanced | USB, LAN, GPIB |
| Chroma | 11025 | 10Hz-10MHz | High accuracy | USB, LAN, GPIB |
| R&S | HM8118 | 20Hz-200kHz | Precision | USB, RS-232, GPIB |

### Impedance Analyzers ($30,000-$200,000+)
| Vendor | Series | Frequency Range | Features | Interfaces |
|--------|--------|-----------------|----------|------------|
| Keysight | E4990A | 20Hz-120MHz | Swept impedance | USB, LAN, GPIB |
| Keysight | E4982A | 1MHz-3GHz | High frequency | USB, LAN, GPIB |
| Hioki | IM7580 | DC to 300MHz | High-end | USB, LAN, GPIB |
| Hioki | IM3590 | 1mHz-200kHz | Chemical impedance | USB, LAN, GPIB |

---

## Measurement Concepts

### Primary and Secondary Parameters

LCR meters typically measure impedance and calculate various parameters:

**Primary Parameters:**
- Z - Impedance magnitude
- Y - Admittance magnitude
- L - Inductance
- C - Capacitance
- R - Resistance
- G - Conductance
- X - Reactance
- B - Susceptance

**Secondary Parameters:**
- Q - Quality factor
- D - Dissipation factor (tan δ)
- θ - Phase angle
- ESR - Equivalent series resistance
- Rdc - DC resistance

### Equivalent Circuit Modes

- **Series Mode** - For low impedance (<100Ω): Ls, Cs, Rs, ESR
- **Parallel Mode** - For high impedance (>10kΩ): Lp, Cp, Rp

---

## SCPI Command Reference

### IEEE 488.2 Common Commands

```scpi
*IDN?                    # Identification query
*RST                     # Reset to default state
*CLS                     # Clear status registers
*OPC                     # Operation complete
*OPC?                    # Operation complete query
*WAI                     # Wait for operations to complete
*ESR?                    # Event status register
*ESE <mask>              # Event status enable
*STB?                    # Status byte
*SRE <mask>              # Service request enable
*TST?                    # Self-test
*SAV <n>                 # Save state
*RCL <n>                 # Recall state
```

---

### Frequency Commands

#### Test Frequency

```scpi
# Keysight E4980A/E4990A style
[:SOURce]:FREQuency[:CW] <freq>           # Set test frequency (Hz)
[:SOURce]:FREQuency[:CW]?                 # Query frequency

# Short forms
:FREQ <freq>                               # Set frequency
:FREQ?                                     # Query frequency

# Examples
:FREQ 1e3                                  # 1 kHz
:FREQ 100e3                                # 100 kHz
:FREQ 1e6                                  # 1 MHz

# Hioki style
:FREQuency <freq>                          # Set frequency
:FREQuency?                                # Query
```

#### Frequency Sweep (Impedance Analyzers)

```scpi
# Keysight E4990A style (swept measurements)
[:SENSe]:FREQuency:STARt <freq>            # Start frequency
[:SENSe]:FREQuency:STOP <freq>             # Stop frequency
[:SENSe]:FREQuency:CENTer <freq>           # Center frequency
[:SENSe]:FREQuency:SPAN <span>             # Frequency span
[:SENSe]:SWEep:POINts <n>                  # Number of sweep points
[:SENSe]:SWEep:TYPE LINear|LOGarithmic     # Sweep type
```

---

### Source/Stimulus Commands

#### Voltage Level

```scpi
[:SOURce]:VOLTage[:LEVel][:IMMediate][:AMPLitude] <volts>
[:SOURce]:VOLTage[:LEVel][:IMMediate][:AMPLitude]?

# Short form
:VOLT <volts>                              # Set AC voltage level
:VOLT?                                     # Query voltage

# Examples
:VOLT 0.1                                  # 100 mV
:VOLT 1.0                                  # 1 V
```

#### Current Level

```scpi
[:SOURce]:CURRent[:LEVel][:IMMediate][:AMPLitude] <amps>
[:SOURce]:CURRent[:LEVel][:IMMediate][:AMPLitude]?

# Short form
:CURR <amps>                               # Set AC current level
:CURR?                                     # Query current

# Examples
:CURR 0.001                                # 1 mA
:CURR 0.01                                 # 10 mA
```

#### DC Bias

```scpi
[:SOURce]:BIAS:VOLTage <volts>             # Set DC bias voltage
[:SOURce]:BIAS:VOLTage?                    # Query
[:SOURce]:BIAS:VOLTage:STATe ON|OFF        # Enable/disable
[:SOURce]:BIAS:CURRent <amps>              # Set DC bias current
[:SOURce]:BIAS:CURRent?                    # Query
[:SOURce]:BIAS:CURRent:STATe ON|OFF        # Enable/disable
```

#### Auto Level Control (ALC)

```scpi
[:SOURce]:ALC[:STATe] ON|OFF               # Auto level control on/off
[:SOURce]:ALC:TOLerance <percent>          # ALC tolerance
```

---

### Function/Parameter Selection

#### Measurement Function

```scpi
# Keysight E4980A style
:FUNCtion:IMPedance:TYPE <param1>[,<param2>]

# Parameters:
#   CPD  - Parallel capacitance + dissipation factor
#   CPQ  - Parallel capacitance + Q
#   CPG  - Parallel capacitance + conductance
#   CPRP - Parallel capacitance + parallel resistance
#   CSD  - Series capacitance + dissipation factor
#   CSQ  - Series capacitance + Q
#   CSRS - Series capacitance + series resistance
#   LPD  - Parallel inductance + dissipation factor
#   LPQ  - Parallel inductance + Q
#   LPRD - Parallel inductance + DC resistance
#   LSD  - Series inductance + dissipation factor
#   LSQ  - Series inductance + Q
#   LSRS - Series inductance + series resistance
#   RX   - Resistance + reactance
#   ZTD  - Impedance (|Z|) + phase (degrees)
#   ZTR  - Impedance (|Z|) + phase (radians)
#   GB   - Conductance + susceptance
#   YTD  - Admittance (|Y|) + phase (degrees)
#   YTR  - Admittance (|Y|) + phase (radians)

# Examples
:FUNC:IMP:TYPE CPD                         # Cp + D
:FUNC:IMP:TYPE ZTD                         # |Z| + θ(deg)
:FUNC:IMP:TYPE CSRS                        # Cs + Rs (ESR)
```

#### Measurement Range

```scpi
:FUNCtion:IMPedance:RANGe <ohms>           # Set impedance range
:FUNCtion:IMPedance:RANGe?                 # Query range
:FUNCtion:IMPedance:RANGe:AUTO ON|OFF      # Auto-ranging

# Examples
:FUNC:IMP:RANG 100                         # 100 ohm range
:FUNC:IMP:RANG:AUTO ON                     # Auto-range
```

---

### Measurement Commands

#### Trigger and Read

```scpi
:TRIGger[:IMMediate]                       # Trigger measurement
:FETCh?                                    # Fetch last measurement
:READ?                                     # Trigger + fetch
:MEASure?                                  # Configure + trigger + fetch

# Keysight style data query
:FETCh:IMPedance:CORRected?                # Corrected impedance data
:FETCh:IMPedance:FORMatted?                # Formatted data (as displayed)
```

#### Data Format

```scpi
:FORMat[:DATA] ASCii|REAL,32|REAL,64       # Data format
:FORMat:BORDer NORMal|SWAPped              # Byte order (binary)

# Data typically returned as:
# Parameter1, Parameter2
# Example: 1.234E-09,0.0012  (Capacitance in F, D factor)
```

---

### Trigger Commands

```scpi
:TRIGger:SOURce IMMediate|EXTernal|BUS|INTernal|MANual
:TRIGger:SOURce?

# Sources:
#   IMMediate - Continuous triggering
#   EXTernal  - External trigger input
#   BUS       - Bus trigger (*TRG)
#   INTernal  - Internal timer
#   MANual    - Front panel trigger

:TRIGger:DELay <seconds>                   # Trigger delay
:TRIGger:DELay?
:TRIGger:DELay:AUTO ON|OFF                 # Auto delay
```

---

### Correction/Calibration Commands

#### Open/Short Correction

```scpi
# Keysight E4980A style
:CORRection:OPEN[:EXECute]                 # Perform OPEN correction
:CORRection:SHORt[:EXECute]                # Perform SHORT correction
:CORRection:LOAD[:EXECute]                 # Perform LOAD correction
:CORRection:OPEN:STATe ON|OFF              # Enable/disable OPEN correction
:CORRection:SHORt:STATe ON|OFF             # Enable/disable SHORT correction
:CORRection:LOAD:STATe ON|OFF              # Enable/disable LOAD correction

# Hioki style
:CORRection:OPEN                           # Execute open correction
:CORRection:SHORt                          # Execute short correction
:CORRection:CLEar                          # Clear corrections
```

#### Cable Length Compensation

```scpi
:CORRection:LENGth <meters>                # Cable length
:CORRection:LENGth?
:CORRection:LENGth:STATe ON|OFF            # Enable compensation
```

---

### Averaging

```scpi
:AVERage[:STATe] ON|OFF                    # Enable/disable averaging
:AVERage:COUNt <n>                         # Number of averages
:AVERage:COUNt?                            # Query count
:AVERage:CLEar                             # Clear/restart averaging
```

---

### Integration Time / Speed

```scpi
# Speed settings (varies by vendor)
:APERture <time>                           # Integration time in seconds
:APERture?                                 # Query
:APERture:TIME <time>                      # Alternative syntax

# Or speed mode
[:SENSe]:SPEed SHORt|MEDium|LONG           # Measurement speed
[:SENSe]:SPEed?

# NPLC (power line cycles) - some instruments
[:SENSe]:NPLCycles <n>                     # Integration in PLCs
```

---

### Display/List Mode Commands

#### Multi-Step (List) Measurements

```scpi
# Keysight E4980A style
:LIST:FREQuency <f1>,<f2>,<f3>,...         # List of frequencies
:LIST:VOLTage <v1>,<v2>,<v3>,...           # List of voltages
:LIST:COUNt?                               # Number of list points
:LIST:MODE SEQuence|STEp                   # List execution mode
:INITiate:CONTinuous ON|OFF                # Continuous list
```

---

### Comparator (Pass/Fail) Commands

```scpi
:COMParator[:STATe] ON|OFF                 # Enable comparator
:COMParator:MODE <mode>                    # Comparison mode

:COMParator:TOLerance:NOMinal <value>      # Nominal value
:COMParator:TOLerance:LOW <percent>        # Lower limit %
:COMParator:TOLerance:HIGH <percent>       # Upper limit %

# Or absolute limits
:COMParator:PRIMary:HIGH <value>           # Primary upper limit
:COMParator:PRIMary:LOW <value>            # Primary lower limit
:COMParator:SECondary:HIGH <value>         # Secondary upper limit
:COMParator:SECondary:LOW <value>          # Secondary lower limit

:COMParator:RESult?                        # Query pass/fail result
# Returns: IN (pass), HIGH, LOW, or FAIL
```

---

### System Commands

```scpi
:SYSTem:ERRor?                             # Read error from queue
:SYSTem:ERRor:ALL?                         # Read all errors
:SYSTem:VERSion?                           # SCPI version
:SYSTem:PRESet                             # Factory preset
:SYSTem:BEEPer[:IMMediate]                 # Generate beep
:SYSTem:BEEPer:STATe ON|OFF                # Enable/disable beeper
:SYSTem:DATE <year>,<month>,<day>          # Set date
:SYSTem:TIME <hour>,<min>,<sec>            # Set time
:SYSTem:LOCal                              # Go to local mode
:SYSTem:REMote                             # Go to remote mode
```

---

## Vendor Variations

### Frequency Setting

| Vendor | Command |
|--------|---------|
| Keysight | `:FREQ 1e3` or `:SOUR:FREQ 1e3` |
| Hioki | `:FREQuency 1e3` |
| GW Instek | `:FREQ 1e3` |
| Chroma | `:FREQ 1e3` |

### Measurement Function

| Vendor | Cp + D | Ls + Q | |Z| + θ |
|--------|--------|--------|---------|
| Keysight | `:FUNC:IMP:TYPE CPD` | `:FUNC:IMP:TYPE LSQ` | `:FUNC:IMP:TYPE ZTD` |
| Hioki | `:MEAS:FUNC CPD` | `:MEAS:FUNC LSQ` | `:MEAS:FUNC ZTH` |

### Read Measurement

| Vendor | Command | Notes |
|--------|---------|-------|
| Keysight | `:FETCh?` | Returns param1, param2 |
| Hioki | `:FETCh?` or `:MEAS?` | Returns param1, param2 |

### Open/Short Correction

| Vendor | Open | Short |
|--------|------|-------|
| Keysight | `:CORR:OPEN` | `:CORR:SHOR` |
| Hioki | `:CORR:OPEN` | `:CORR:SHOR` |

---

## Programming Examples

### Basic Capacitance Measurement

```scpi
# Keysight E4980A example
*RST                                       # Reset
:FUNC:IMP:TYPE CPD                         # Measure Cp and D
:FREQ 1e3                                  # 1 kHz test frequency
:VOLT 1                                    # 1V test signal
:FUNC:IMP:RANG:AUTO ON                     # Auto-range
:TRIG:SOUR BUS                             # Bus trigger
:INIT:CONT OFF                             # Single trigger mode
:TRIG                                      # Trigger measurement
*WAI                                       # Wait for completion
:FETC?                                     # Read Cp, D values
```

### Inductance Measurement with Q

```scpi
*RST
:FUNC:IMP:TYPE LSQ                         # Measure Ls and Q
:FREQ 100e3                                # 100 kHz
:VOLT 0.5                                  # 0.5V test signal
:CORR:OPEN                                 # Open correction
:CORR:SHOR                                 # Short correction
:CORR:OPEN:STAT ON                         # Enable open corr
:CORR:SHOR:STAT ON                         # Enable short corr
:TRIG
*WAI
:FETC?                                     # Read Ls, Q values
```

### Impedance Sweep (E4990A)

```scpi
# Keysight E4990A impedance analyzer
*RST
:SENS:FREQ:STAR 100                        # Start 100 Hz
:SENS:FREQ:STOP 1e6                        # Stop 1 MHz
:SENS:SWE:POIN 401                         # 401 points
:SENS:SWE:TYPE LOG                         # Log sweep
:SOUR:VOLT 0.5                             # 0.5V level
:FUNC:IMP:TYPE ZTD                         # |Z| and theta
:INIT:CONT OFF                             # Single sweep
:INIT:IMM                                  # Start sweep
*WAI
:CALC:DATA:FDAT?                           # Read all data
```

### Multi-Frequency List

```scpi
# Keysight E4980A list mode
*RST
:FUNC:IMP:TYPE CPD                         # Cp + D
:VOLT 1
:LIST:FREQ 100,1E3,10E3,100E3,1E6          # 5 frequencies
:LIST:MODE SEQ                             # Sequential mode
:INIT:CONT OFF
:INIT:IMM                                  # Run list
*WAI
:FETC?                                     # Read all results
```

---

## Command Abstraction Summary

### Abstract Driver Interface

```typescript
interface LcrMeterDriver {
  // Identification
  getIdentification(): Promise<string>;
  reset(): Promise<void>;
  preset(): Promise<void>;

  // Frequency
  setFrequency(freq: number): Promise<void>;
  getFrequency(): Promise<number>;

  // Stimulus
  setVoltageLevel(volts: number): Promise<void>;
  getVoltageLevel(): Promise<number>;
  setCurrentLevel(amps: number): Promise<void>;
  getCurrentLevel(): Promise<number>;
  setDcBias(voltage: number, enabled: boolean): Promise<void>;

  // Function/Parameters
  setMeasurementFunction(primary: MeasParam, secondary: MeasParam): Promise<void>;
  getMeasurementFunction(): Promise<{primary: MeasParam, secondary: MeasParam}>;
  setEquivalentCircuit(mode: 'series' | 'parallel'): Promise<void>;
  setRange(ohms: number | 'auto'): Promise<void>;

  // Measurement
  triggerMeasurement(): Promise<void>;
  fetchMeasurement(): Promise<{primary: number, secondary: number}>;
  measure(): Promise<{primary: number, secondary: number}>;

  // Speed/Integration
  setIntegrationTime(time: number): Promise<void>;
  setSpeed(speed: 'short' | 'medium' | 'long'): Promise<void>;

  // Averaging
  setAveraging(enabled: boolean, count?: number): Promise<void>;
  clearAveraging(): Promise<void>;

  // Correction
  performOpenCorrection(): Promise<void>;
  performShortCorrection(): Promise<void>;
  performLoadCorrection(refValue: number): Promise<void>;
  enableCorrection(type: 'open' | 'short' | 'load', enabled: boolean): Promise<void>;

  // Comparator
  setComparator(enabled: boolean): Promise<void>;
  setLimits(primary: {low: number, high: number}, secondary?: {low: number, high: number}): Promise<void>;
  getComparatorResult(): Promise<'pass' | 'high' | 'low' | 'fail'>;

  // Sweep (impedance analyzers)
  setSweepRange(start: number, stop: number, points: number): Promise<void>;
  setSweepType(type: 'linear' | 'log'): Promise<void>;
  getSweepData(): Promise<Array<{freq: number, primary: number, secondary: number}>>;
}

type MeasParam = 'Cp' | 'Cs' | 'Lp' | 'Ls' | 'R' | 'X' | 'G' | 'B' |
                 'Z' | 'Y' | 'D' | 'Q' | 'theta' | 'ESR' | 'Rdc';

interface LcrMeasurement {
  frequency: number;
  primary: {
    param: MeasParam;
    value: number;
    unit: string;
  };
  secondary: {
    param: MeasParam;
    value: number;
    unit: string;
  };
}
```

### Vendor Command Translation

| Method | Keysight E4980A | Hioki IM3536 |
|--------|-----------------|--------------|
| `setFrequency(1e3)` | `:FREQ 1e3` | `:FREQuency 1e3` |
| `setVoltageLevel(0.5)` | `:VOLT 0.5` | `:VOLT 0.5` |
| `setMeasurementFunction('Cp', 'D')` | `:FUNC:IMP:TYPE CPD` | `:MEAS:FUNC CPD` |
| `triggerMeasurement()` | `:TRIG` | `:TRIG` |
| `fetchMeasurement()` | `:FETC?` | `:FETC?` |
| `performOpenCorrection()` | `:CORR:OPEN` | `:CORR:OPEN` |
| `setRange('auto')` | `:FUNC:IMP:RANG:AUTO ON` | `:RANG:AUTO ON` |

---

## Resources

### Official Documentation

| Vendor | Series | Documentation |
|--------|--------|---------------|
| Keysight | E4980A/AL | [User's Guide (PDF)](https://www.keysight.com/us/en/assets/9018-05655/user-manuals/9018-05655.pdf) |
| Keysight | E4990A | [Help Files](https://helpfiles.keysight.com/csg/e4990a/home.htm) |
| Hioki | IM3536 | [Interface Manual](https://www.hioki.com/e/products/lcr/application/IM3536/English/index.htm) |
| Hioki | IM3570/IM3536 | [Communication Manual (PDF)](https://www.hioki.com/e/products/lcr/application/Common/manual/IM3570comE.pdf) |
| GW Instek | LCR-8000G | [Product Page](https://www.gwinstek.com/en-global/products/detail/LCR-8000G) |
| BK Precision | Various | [LCR Meter Guide (PDF)](https://bkpmedia.s3.amazonaws.com/downloads/guides/en-us/lcr_meter_guide.pdf) |

### Python Libraries

| Library | Link | Notes |
|---------|------|-------|
| Hioki IM3536 IVI | [GitHub](https://github.com/Teslafly/Hioki-IM3536-Lcr-meter-python-IVI-driver) | Python driver |
| PyVISA | [pyvisa.readthedocs.io](https://pyvisa.readthedocs.io/) | VISA interface |
