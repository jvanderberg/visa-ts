# Vector Network Analyzer (VNA) SCPI Command Reference

This document provides comprehensive SCPI command documentation for Vector Network Analyzers across multiple vendors and price tiers.

---

## Instrument Coverage

### Entry Level / USB VNAs ($500-$5,000)
| Vendor | Series | Frequency Range | Ports | Features |
|--------|--------|-----------------|-------|----------|
| NanoVNA | V2/SAA-2N | 50kHz-3GHz | 2 | Handheld, open source |
| LibreVNA | Original | 100kHz-6GHz | 2 | Open source |
| Siglent | SVA1015X | 9kHz-1.5GHz | 2 | Combo SA+VNA |
| Siglent | SVA1032X | 9kHz-3.2GHz | 2 | Combo SA+VNA |
| Copper Mountain | R60/R140/R180 | 1MHz-6/14/18GHz | 1 | USB VNA |
| Copper Mountain | TR1300/TR5048 | 300kHz-1.3/4.8GHz | 2 | USB, 1-path |
| Signal Hound | VNAX-50 | 100kHz-6.3GHz | 2 | USB |

### Mid-Range ($5,000-$30,000)
| Vendor | Series | Frequency Range | Ports | Features |
|--------|--------|-----------------|-------|----------|
| Copper Mountain | S2VNA S5048 | 20kHz-4.8GHz | 2 | USB, full 2-port |
| Copper Mountain | S2VNA S5180 | 9kHz-18GHz | 2 | USB, full 2-port |
| Copper Mountain | S4VNA S5085 | 9kHz-8.5GHz | 4 | USB, 4-port |
| Keysight | E5063A | 100kHz-4.5/8.5/18GHz | 2 | ENA series |
| Keysight | P9370A/P9371A | 300kHz-4.5/6.5GHz | 2 | USB VNA |
| R&S | ZNL | 5kHz-6GHz | 2 | Entry bench |
| Anritsu | MS46122B | 1MHz-8/20/40GHz | 2 | ShockLine |

### Professional ($30,000-$200,000+)
| Vendor | Series | Frequency Range | Ports | Features |
|--------|--------|-----------------|-------|----------|
| Keysight | E5080A/B ENA | 9kHz-6.5/9/20GHz | 2/4 | ENA-X |
| Keysight | N5227B PNA | 10MHz-67GHz | 2/4 | High performance |
| Keysight | N5245B/N5247B PNA-X | 10MHz-50/67GHz | 2/4 | Advanced |
| R&S | ZNB | 9kHz-8.5/20/40GHz | 2/4 | Mid-range |
| R&S | ZNA | 10MHz-43.5/67GHz | 2/4 | High-end |
| R&S | ZVA | 10MHz-24/40/67/110GHz | 2/4 | Premium |
| Anritsu | MS4644B VectorStar | 70kHz-40/70GHz | 2/4 | High performance |

---

## SCPI Command Reference

### IEEE 488.2 Common Commands

```scpi
*IDN?                    # Identification query
*RST                     # Reset to default state
*CLS                     # Clear status registers
*OPC                     # Operation complete
*OPC?                    # Operation complete query (returns 1 when done)
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

#### Start/Stop Frequencies

```scpi
[:SENSe<ch>]:FREQuency:STARt <freq>     # Set start frequency (Hz)
[:SENSe<ch>]:FREQuency:STARt?           # Query start frequency
[:SENSe<ch>]:FREQuency:STOP <freq>      # Set stop frequency
[:SENSe<ch>]:FREQuency:STOP?            # Query stop frequency

# Examples
:SENS:FREQ:STAR 1e6                      # Start at 1 MHz
:SENS:FREQ:STOP 6e9                      # Stop at 6 GHz
```

#### Center/Span

```scpi
[:SENSe<ch>]:FREQuency:CENTer <freq>    # Set center frequency
[:SENSe<ch>]:FREQuency:CENTer?          # Query center frequency
[:SENSe<ch>]:FREQuency:SPAN <span>      # Set frequency span
[:SENSe<ch>]:FREQuency:SPAN?            # Query span
```

#### CW Frequency (Single Point)

```scpi
[:SENSe<ch>]:FREQuency:CW <freq>        # Set CW frequency
[:SENSe<ch>]:FREQuency:CW?              # Query CW frequency
[:SENSe<ch>]:FREQuency:FIXed <freq>     # Alias for CW
```

---

### Sweep Commands

#### Sweep Points

```scpi
[:SENSe<ch>]:SWEep:POINts <n>           # Set number of points
[:SENSe<ch>]:SWEep:POINts?              # Query points

# Common values: 101, 201, 401, 801, 1601, 3201, 6401, 10001
```

#### Sweep Type

```scpi
[:SENSe<ch>]:SWEep:TYPE LINear|LOGarithmic|SEGMent|POWer|CW
[:SENSe<ch>]:SWEep:TYPE?

# Types:
#   LINear     - Linear frequency sweep
#   LOGarithmic - Log frequency sweep
#   SEGMent    - Segmented sweep
#   POWer      - Power sweep
#   CW         - Single frequency (time domain)
```

#### Sweep Time

```scpi
[:SENSe<ch>]:SWEep:TIME <seconds>       # Set sweep time
[:SENSe<ch>]:SWEep:TIME?                # Query sweep time
[:SENSe<ch>]:SWEep:TIME:AUTO ON|OFF     # Auto sweep time
```

#### IF Bandwidth

```scpi
[:SENSe<ch>]:BANDwidth[:RESolution] <bw>  # Set IF bandwidth (Hz)
[:SENSe<ch>]:BANDwidth[:RESolution]?      # Query IF bandwidth
[:SENSe<ch>]:BANDwidth[:RESolution]:AUTO ON|OFF  # Auto IFBW

# Also written as:
[:SENSe<ch>]:BWID <bw>

# Common values: 10Hz to 1MHz (varies by instrument)
# Lower IFBW = slower but lower noise floor
```

---

### Source/Power Commands

#### Port Power Level

```scpi
:SOURce<ch>:POWer[:LEVel][:IMMediate][:AMPLitude] <dBm>
:SOURce<ch>:POWer[:LEVel][:IMMediate][:AMPLitude]?

# Port-specific (2-port VNA)
:SOURce<ch>:POWer:PORT1[:LEVel][:IMMediate][:AMPLitude] <dBm>
:SOURce<ch>:POWer:PORT2[:LEVel][:IMMediate][:AMPLitude] <dBm>

# Examples
:SOUR:POW -10                            # Set -10 dBm
:SOUR:POW:PORT1 -20                      # Port 1 at -20 dBm
```

#### Power Slope

```scpi
:SOURce<ch>:POWer:SLOPe <dB/GHz>        # Power slope compensation
:SOURce<ch>:POWer:SLOPe?
:SOURce<ch>:POWer:SLOPe:STATe ON|OFF    # Enable/disable slope
```

#### Power Sweep

```scpi
:SOURce<ch>:POWer:STARt <dBm>           # Start power for power sweep
:SOURce<ch>:POWer:STOP <dBm>            # Stop power
```

---

### Measurement / Trace Commands

#### Create S-Parameter Measurement

```scpi
# Keysight PNA/ENA style
:CALCulate<ch>:PARameter:DEFine:EXTended <mname>,<param>
:CALCulate<ch>:PARameter:DEFine <mname>,<param>

# Examples
:CALC:PAR:DEF 'MyS11',S11               # Create S11 measurement named 'MyS11'
:CALC:PAR:DEF 'MyS21',S21               # Create S21 measurement
:CALC:PAR:DEF 'MyS12',S12               # Create S12 measurement
:CALC:PAR:DEF 'MyS22',S22               # Create S22 measurement

# R&S ZVA/ZNB style
:CALCulate<ch>:PARameter:SDEFine <trc>,<param>
:CALC:PAR:SDEF 'Trc1','S11'
:CALC:PAR:SDEF 'Trc2','S21'

# Copper Mountain style
:CALCulate<ch>:PARameter<tr>:DEFine <param>
:CALC:PAR1:DEF S11
:CALC:PAR2:DEF S21
```

#### Select Measurement

```scpi
:CALCulate<ch>:PARameter:SELect <mname>
:CALCulate<ch>:PARameter:MNUM <num>     # Select by number

# Example
:CALC:PAR:SEL 'MyS21'
```

#### Delete Measurement

```scpi
:CALCulate<ch>:PARameter:DELete <mname>
:CALCulate<ch>:PARameter:DELete:ALL

:CALC:PAR:DEL 'MyS11'
```

#### List Measurements

```scpi
:CALCulate<ch>:PARameter:CATalog?       # List all measurements

# Returns: "meas1,S11,meas2,S21,..."
```

---

### Display / Trace Formatting

#### Display Trace in Window

```scpi
:DISPlay:WINDow<wnd>:STATe ON|OFF       # Enable/disable window
:DISPlay:WINDow<wnd>:TRACe<tr>:FEED <mname>  # Display measurement in window

# Example
:DISP:WIND1:STAT ON                      # Enable window 1
:DISP:WIND1:TRAC1:FEED 'MyS21'           # Display MyS21 as trace 1
```

#### Trace Format

```scpi
:CALCulate<ch>:SELected:FORMat <format>
:CALCulate<ch>:SELected:FORMat?

# Formats:
#   MLINear     - Linear magnitude
#   MLOGarithmic - Log magnitude (dB)
#   PHASe       - Phase (degrees)
#   UPHase      - Unwrapped phase
#   GDELay      - Group delay
#   REAL        - Real part
#   IMAGinary   - Imaginary part
#   SWR         - Standing wave ratio (VSWR)
#   POLar       - Polar (real/imag)
#   SMITh       - Smith chart
#   SADMittance - Smith chart (admittance)

# Examples
:CALC:SEL:FORM MLOG                      # dB magnitude
:CALC:SEL:FORM PHAS                      # Phase
:CALC:SEL:FORM SMIT                      # Smith chart
```

#### Scale

```scpi
:DISPlay:WINDow<wnd>:TRACe<tr>:Y[:SCALe]:PDIVision <dB>  # dB per division
:DISPlay:WINDow<wnd>:TRACe<tr>:Y[:SCALe]:RLEVel <dB>     # Reference level
:DISPlay:WINDow<wnd>:TRACe<tr>:Y[:SCALe]:RPOSition <pos> # Ref position (0-10)
:DISPlay:WINDow<wnd>:TRACe<tr>:Y[:SCALe]:AUTO            # Auto scale
```

---

### Marker Commands

#### Enable/Position Markers

```scpi
:CALCulate<ch>:SELected:MARKer<n>[:STATe] ON|OFF
:CALCulate<ch>:SELected:MARKer<n>:X <freq>         # Set marker frequency
:CALCulate<ch>:SELected:MARKer<n>:X?               # Query marker X
:CALCulate<ch>:SELected:MARKer<n>:Y?               # Query marker Y value

# Marker numbers: 1-10 (varies by instrument)
```

#### Marker Search

```scpi
:CALCulate<ch>:SELected:MARKer<n>:FUNCtion:EXECute MAXimum|MINimum|TARGet|PEAK
:CALCulate<ch>:SELected:MARKer<n>:FUNCtion:TARGet <value>

# Examples
:CALC:SEL:MARK1:FUNC:EXEC MAX            # Find maximum
:CALC:SEL:MARK1:FUNC:EXEC MIN            # Find minimum
:CALC:SEL:MARK1:FUNC:TARG -3             # Find -3 dB point
:CALC:SEL:MARK1:FUNC:EXEC TARG           # Execute target search
```

#### Delta Markers

```scpi
:CALCulate<ch>:SELected:MARKer<n>:DELTa[:STATe] ON|OFF
:CALCulate<ch>:SELected:MARKer<n>:REFerence <refmkr>

# Example: Marker 2 as delta from marker 1
:CALC:SEL:MARK2:DEL ON
:CALC:SEL:MARK2:REF 1
```

#### Bandwidth Search (3dB/6dB)

```scpi
:CALCulate<ch>:SELected:MARKer:BWIDth[:STATe] ON|OFF
:CALCulate<ch>:SELected:MARKer:BWIDth:DATA?

# Returns: bandwidth, center freq, Q, insertion loss
```

---

### Trigger Commands

```scpi
:TRIGger[:SEQuence]:SOURce IMMediate|EXTernal|MANual|BUS
:TRIGger[:SEQuence]:SOURce?

# Trigger sources:
#   IMMediate  - Continuous triggering
#   EXTernal   - External trigger input
#   MANual     - Front panel trigger
#   BUS        - Bus trigger (*TRG)

:TRIGger[:SEQuence]:DELay <seconds>      # Trigger delay
```

#### Sweep Control

```scpi
:INITiate<ch>:CONTinuous ON|OFF          # Continuous or hold mode
:INITiate<ch>[:IMMediate]                # Trigger single sweep
:ABORt                                    # Abort sweep

# Wait for sweep completion
:INITiate<ch>:IMMediate;*WAI             # Trigger and wait
*OPC?                                     # Query operation complete
```

#### Sweep Mode

```scpi
[:SENSe<ch>]:SWEep:MODE HOLD|CONTinuous|GROups|SINGle
[:SENSe<ch>]:SWEep:MODE?

# Modes:
#   HOLD       - Hold (no sweeping)
#   CONTinuous - Continuous sweeping
#   GROups     - Group sweep (N sweeps)
#   SINGle     - Single sweep

[:SENSe<ch>]:SWEep:GROups:COUNt <n>      # Number of sweeps for group mode
```

---

### Calibration Commands

#### Calibration Type Selection

```scpi
# Keysight/CMT: Select calibration type
[:SENSe<ch>]:CORRection:COLLect:METHod:SOLT1 <port>    # 1-port SOLT
[:SENSe<ch>]:CORRection:COLLect:METHod:SOLT2 <p1>,<p2> # 2-port SOLT
[:SENSe<ch>]:CORRection:COLLect:METHod:THRU <p1>,<p2>  # Thru only
[:SENSe<ch>]:CORRection:COLLect:METHod:TRL2 <p1>,<p2>  # TRL 2-port
```

#### Acquire Calibration Standards

```scpi
# Unguided calibration (manual sequence)
[:SENSe<ch>]:CORRection:COLLect:ACQuire:OPEN <port>   # Measure OPEN
[:SENSe<ch>]:CORRection:COLLect:ACQuire:SHORt <port>  # Measure SHORT
[:SENSe<ch>]:CORRection:COLLect:ACQuire:LOAD <port>   # Measure LOAD
[:SENSe<ch>]:CORRection:COLLect:ACQuire:THRU <p1>,<p2> # Measure THRU
[:SENSe<ch>]:CORRection:COLLect:ACQuire:ISOLation <p1>,<p2> # Isolation

# Example 1-port cal sequence
:SENS:CORR:COLL:METH:SOLT1 1             # Select 1-port cal on port 1
# Connect OPEN
:SENS:CORR:COLL:ACQ:OPEN 1               # Measure OPEN
# Connect SHORT
:SENS:CORR:COLL:ACQ:SHOR 1               # Measure SHORT
# Connect LOAD
:SENS:CORR:COLL:ACQ:LOAD 1               # Measure LOAD
:SENS:CORR:COLL:SAVE                     # Calculate and apply
```

#### Guided Calibration (Keysight PNA)

```scpi
[:SENSe<ch>]:CORRection:COLLect:GUIDed:INIT          # Initialize guided cal
[:SENSe<ch>]:CORRection:COLLect:GUIDed:STEP?         # Query current step
[:SENSe<ch>]:CORRection:COLLect:GUIDed:ACQuire       # Acquire current standard
[:SENSe<ch>]:CORRection:COLLect:GUIDed:SAVE          # Save calibration
```

#### Calibration On/Off

```scpi
[:SENSe<ch>]:CORRection[:STATe] ON|OFF   # Enable/disable correction
[:SENSe<ch>]:CORRection[:STATe]?         # Query correction state
[:SENSe<ch>]:CORRection:CLEar            # Clear calibration
```

#### Calibration Kit

```scpi
[:SENSe<ch>]:CORRection:CKIT:SELect <name>    # Select cal kit
[:SENSe<ch>]:CORRection:CKIT:CATalog?         # List available cal kits
```

---

### Data Transfer Commands

#### Get Trace Data

```scpi
:CALCulate<ch>:SELected:DATA:FDATa?      # Formatted data (as displayed)
:CALCulate<ch>:SELected:DATA:SDATa?      # Complex data (real,imag pairs)
:CALCulate<ch>:SELected:DATA:CDATa?      # Corrected complex data (real,imag)

# R&S style
:CALCulate<ch>:DATA? FDATa               # Formatted
:CALCulate<ch>:DATA? SDATa               # S-data (complex)

# Data returns as comma-separated values
# FDATa: stimulus,real,imag,stimulus,real,imag,...
# Or for single-value formats: value1,0,value2,0,...
```

#### Stimulus Data (Frequency Array)

```scpi
[:SENSe<ch>]:FREQuency:DATA?             # Query frequency points
:CALCulate<ch>:X?                         # Alternative
```

#### Data Format

```scpi
:FORMat:DATA ASCii                        # ASCII format (default)
:FORMat:DATA REAL,32                      # 32-bit binary float
:FORMat:DATA REAL,64                      # 64-bit binary float
:FORMat:BORDer NORMal|SWAPped             # Byte order

# Binary block format: #<n><len><data>
# Example: #512320<binary data bytes>
```

---

### File Operations

#### Save S-Parameters

```scpi
:MMEMory:STORe:SNP:DATA <port_list>,<filename>    # Save SNP file
:MMEMory:STORe:SNP:FORMat RI|MA|DB                # Format (Real/Imag, Mag/Angle, dB)

# Examples
:MMEM:STOR:SNP:DATA '1,2','C:\test.s2p'           # Save 2-port as .s2p
:MMEM:STOR:TRAC 'Trc1','C:\trace.csv'             # Save trace data

# Keysight style
:MMEM:STOR:SNP 'MyMeas','file.s1p'
```

#### Load/Recall

```scpi
:MMEMory:LOAD:STATe <filename>            # Load instrument state
:MMEMory:STORe:STATe <filename>           # Save instrument state
:MMEMory:CDIRectory <path>                # Change directory
:MMEMory:CDIRectory?                      # Query current directory
:MMEMory:CATalog?                         # List files
```

---

### Averaging

```scpi
[:SENSe<ch>]:AVERage[:STATe] ON|OFF       # Enable/disable averaging
[:SENSe<ch>]:AVERage:COUNt <n>            # Number of averages
[:SENSe<ch>]:AVERage:COUNt?               # Query average count
[:SENSe<ch>]:AVERage:CLEar                # Clear/restart averaging
[:SENSe<ch>]:AVERage:MODE SWEep|POINt     # Sweep or point averaging
```

---

### Port Extension / Electrical Delay

```scpi
[:SENSe<ch>]:CORRection:EXTension:PORT<n>[:STATe] ON|OFF
[:SENSe<ch>]:CORRection:EXTension:PORT<n>:TIME <seconds>
[:SENSe<ch>]:CORRection:EXTension:PORT<n>:DISTance <meters>

# Electrical delay (receiver only)
:CALCulate<ch>:SELected:CORRection:EDELay:TIME <seconds>
```

---

### System Commands

```scpi
:SYSTem:ERRor?                            # Read error
:SYSTem:ERRor:ALL?                        # Read all errors
:SYSTem:PRESet                            # Factory preset
:SYSTem:FPReset                           # Full preset (clears all)
:SYSTem:OPTions?                          # Installed options
:SYSTem:VERSion?                          # SCPI version
:SYSTem:DATE <year>,<month>,<day>         # Set date
:SYSTem:TIME <hour>,<min>,<sec>           # Set time
```

---

## Vendor Variations

### Create S11 Measurement

| Vendor | Command |
|--------|---------|
| Keysight PNA/ENA | `:CALC:PAR:DEF 'Meas1',S11` |
| R&S ZVA/ZNB | `:CALC:PAR:SDEF 'Trc1','S11'` |
| Copper Mountain | `:CALC:PAR1:DEF S11` |
| Siglent SVA | `:CALC:PAR:DEF S11` |

### Get Trace Data

| Vendor | Command | Format |
|--------|---------|--------|
| Keysight | `:CALC:SEL:DATA:FDAT?` | Comma-separated |
| R&S | `:CALC:DATA? FDAT` | Comma-separated |
| Copper Mountain | `:CALC:DATA:FDAT?` | Comma-separated |

### Trigger Single Sweep

| Vendor | Command |
|--------|---------|
| Keysight | `:INIT:IMM;*WAI` or `*TRG;*OPC?` |
| R&S | `:INIT:IMM;*WAI` |
| Copper Mountain | `:INIT;*OPC?` |

### Set IF Bandwidth

| Vendor | Command |
|--------|---------|
| Keysight | `:SENS:BWID 1000` |
| R&S | `:SENS:BWID 1000` |
| Copper Mountain | `:SENS:BWID 1000` |

---

## Programming Examples

### Basic S21 Measurement

```scpi
# Reset and configure
*RST
:SENS:FREQ:STAR 10e6                     # Start 10 MHz
:SENS:FREQ:STOP 6e9                      # Stop 6 GHz
:SENS:SWE:POIN 401                       # 401 points
:SENS:BWID 1000                          # 1 kHz IFBW
:SOUR:POW -10                            # -10 dBm

# Create and display S21
:CALC:PAR:DEF 'MyS21',S21
:DISP:WIND1:STAT ON
:DISP:WIND1:TRAC1:FEED 'MyS21'
:CALC:PAR:SEL 'MyS21'
:CALC:SEL:FORM MLOG                      # dB format

# Single sweep and read
:INIT:IMM;*WAI                           # Trigger and wait
:CALC:SEL:DATA:FDAT?                     # Read trace data
```

### 2-Port SOLT Calibration

```scpi
# Configure frequency range first
:SENS:FREQ:STAR 100e6
:SENS:FREQ:STOP 3e9
:SENS:SWE:POIN 201

# Initialize 2-port SOLT calibration
:SENS:CORR:COLL:METH:SOLT2 1,2

# Port 1 standards
# Connect OPEN to Port 1
:SENS:CORR:COLL:ACQ:OPEN 1
# Connect SHORT to Port 1
:SENS:CORR:COLL:ACQ:SHOR 1
# Connect LOAD to Port 1
:SENS:CORR:COLL:ACQ:LOAD 1

# Port 2 standards
# Connect OPEN to Port 2
:SENS:CORR:COLL:ACQ:OPEN 2
# Connect SHORT to Port 2
:SENS:CORR:COLL:ACQ:SHOR 2
# Connect LOAD to Port 2
:SENS:CORR:COLL:ACQ:LOAD 2

# Through
# Connect THRU between Port 1 and Port 2
:SENS:CORR:COLL:ACQ:THRU 1,2

# Calculate and apply
:SENS:CORR:COLL:SAVE
```

### Save S-Parameters to File

```scpi
# Configure 2-port measurement
*RST
:SENS:FREQ:STAR 1e9
:SENS:FREQ:STOP 18e9
:SENS:SWE:POIN 801
:CALC:PAR:DEF 'S11',S11
:CALC:PAR:DEF 'S21',S21
:CALC:PAR:DEF 'S12',S12
:CALC:PAR:DEF 'S22',S22

# Single sweep
:INIT:CONT OFF
:INIT:IMM;*WAI

# Save to Touchstone file
:MMEM:STOR:SNP:DATA '1,2','C:\DUT.s2p'
```

---

## Command Abstraction Summary

### Abstract Driver Interface

```typescript
interface VnaDriver {
  // Identification
  getIdentification(): Promise<string>;
  reset(): Promise<void>;
  preset(): Promise<void>;

  // Frequency
  setStartFrequency(freq: number): Promise<void>;
  setStopFrequency(freq: number): Promise<void>;
  getStartFrequency(): Promise<number>;
  getStopFrequency(): Promise<number>;
  setCenterFrequency(freq: number): Promise<void>;
  setSpan(span: number): Promise<void>;

  // Sweep
  setSweepPoints(points: number): Promise<void>;
  getSweepPoints(): Promise<number>;
  setSweepType(type: 'linear' | 'log' | 'segment' | 'cw'): Promise<void>;
  setIfBandwidth(bw: number): Promise<void>;
  getIfBandwidth(): Promise<number>;

  // Power
  setPortPower(power: number, port?: number): Promise<void>;
  getPortPower(port?: number): Promise<number>;

  // Measurements
  createMeasurement(name: string, param: SParameter): Promise<void>;
  deleteMeasurement(name: string): Promise<void>;
  selectMeasurement(name: string): Promise<void>;
  listMeasurements(): Promise<string[]>;
  setFormat(format: TraceFormat): Promise<void>;

  // Trigger/Sweep
  setSingleSweep(): Promise<void>;
  setContinuousSweep(): Promise<void>;
  triggerSweep(): Promise<void>;
  waitForSweep(): Promise<void>;

  // Data
  getTraceData(format?: 'formatted' | 'complex'): Promise<number[]>;
  getFrequencyData(): Promise<number[]>;
  getSParameters(): Promise<ComplexNumber[][]>;

  // Markers
  enableMarker(marker: number): Promise<void>;
  setMarkerFrequency(marker: number, freq: number): Promise<void>;
  getMarkerValue(marker: number): Promise<{x: number, y: number}>;
  markerSearch(marker: number, type: 'max' | 'min' | 'target', target?: number): Promise<void>;

  // Calibration
  calibrate(type: CalibrationType, ports: number[]): Promise<void>;
  enableCorrection(enabled: boolean): Promise<void>;

  // Files
  saveSnp(filename: string, ports: number[]): Promise<void>;
  loadState(filename: string): Promise<void>;
  saveState(filename: string): Promise<void>;
}

type SParameter = 'S11' | 'S21' | 'S12' | 'S22' | 'S31' | 'S32' | 'S33' | /* ... */;
type TraceFormat = 'logMag' | 'linMag' | 'phase' | 'groupDelay' | 'vswr' | 'smith' | 'real' | 'imag' | 'polar';
type CalibrationType = 'SOLT1' | 'SOLT2' | 'SOLT3' | 'SOLT4' | 'TRL' | 'THRU' | 'OPEN' | 'SHORT' | 'LOAD';

interface ComplexNumber {
  real: number;
  imag: number;
}
```

---

## Resources

### Official Documentation

| Vendor | Series | Documentation |
|--------|--------|---------------|
| Keysight | PNA | [SCPI Command Tree](https://na.support.keysight.com/pna/help/latest/Programming/GP-IB_Command_Finder/SCPI_Command_Tree.htm) |
| Keysight | ENA | [SCPI Commands](https://helpfiles.keysight.com/csg/e5080a/programming/gp-ib_command_finder/scpi_command_tree.htm) |
| Keysight | Various | [SCPI Examples](https://na.support.keysight.com/vna/help/latest/Programming/GPIB_Example_Programs/SCPI_Example_Programs.htm) |
| Copper Mountain | S2VNA/S4VNA | [SCPI Programming Manual (PDF)](https://coppermountaintech.com/wp-content/uploads/2020/09/SxVNA-SCPI-Programming-Manual-2.pdf) |
| Copper Mountain | Automation | [Automation Guide](https://coppermountaintech.com/automation-guide-for-cmt-vnas/) |
| R&S | ZVA | [User Manual](https://www.rohde-schwarz.com/manual/zva/) |
| R&S | ZNB | [FAQs](https://www.rohde-schwarz.com/us/faq/znb/) |
| Siglent | SVA1000X | [Programming Guide (PDF)](https://www.batronix.com/files/Siglent/Spectrum-Analyzer/SVA1000X/SVA1000X_ProgrammingGuide_PG0701X_E02A.pdf) |

### Code Examples

| Language | Link | Notes |
|----------|------|-------|
| Python | [scpi-rohde-schwarz-vna](https://github.com/ZiadHatab/scpi-rohde-schwarz-vna) | R&S VNA trace collection |
| Python | [scikit-rf](https://scikit-rf.readthedocs.io/) | RF/microwave library with VNA support |
| Various | [vna-scpi-examples](https://github.com/Terrabits/vna-scpi-examples) | R&S VNA examples |
