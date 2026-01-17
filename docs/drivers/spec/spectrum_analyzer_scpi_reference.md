# Spectrum Analyzer SCPI Command Reference

This document provides comprehensive SCPI command documentation for Spectrum Analyzers across multiple vendors and price tiers.

---

## Instrument Coverage

### Entry Level ($500-$3,000)
| Vendor | Series | Frequency Range | Features | Interfaces |
|--------|--------|-----------------|----------|------------|
| Rigol | DSA815 | 9kHz-1.5GHz | TG option | USB, LAN |
| Rigol | DSA832/832E | 9kHz-3.2GHz | TG, preamp | USB, LAN |
| Rigol | DSA875 | 9kHz-7.5GHz | Advanced | USB, LAN |
| Siglent | SSA3021X | 9kHz-2.1GHz | TG option | USB, LAN |
| Siglent | SSA3032X | 9kHz-3.2GHz | TG, preamp | USB, LAN |
| Siglent | SSA3075X | 9kHz-7.5GHz | Full featured | USB, LAN |
| GW Instek | GSP-9330 | 9kHz-3.25GHz | TG option | USB, LAN, GPIB opt |
| BK Precision | 2683 | 9kHz-3.2GHz | Basic | USB, LAN |

### Mid-Range ($3,000-$15,000)
| Vendor | Series | Frequency Range | Features | Interfaces |
|--------|--------|-----------------|----------|------------|
| Siglent | SSA3000X Plus | 9kHz-7.5GHz | Advanced, VNA option | USB, LAN |
| Siglent | SSA3000X-R | 9kHz-3.2GHz | Real-time | USB, LAN |
| Rigol | RSA5000 | 9kHz-6.5GHz | Real-time | USB, LAN |
| R&S | FPC1500 | 5kHz-3GHz | Portable | USB, LAN |
| R&S | HMS-X | 100kHz-1.6/3GHz | Compact bench | USB, LAN |
| Keysight | N9320B | 9kHz-3GHz | Basic | USB, LAN, GPIB |
| Tektronix | RSA306B | 9kHz-6.2GHz | USB real-time | USB |
| Tektronix | RSA503A/507A | 9kHz-7.5GHz | Portable real-time | USB, LAN |

### Professional ($15,000-$100,000+)
| Vendor | Series | Frequency Range | Features | Interfaces |
|--------|--------|-----------------|----------|------------|
| Keysight | N9000B CXA | 9kHz-26.5GHz | X-Series | USB, LAN, GPIB |
| Keysight | N9010B EXA | 10Hz-44GHz | Mid perf | USB, LAN, GPIB |
| Keysight | N9020B MXA | 10Hz-50GHz | High perf | USB, LAN, GPIB |
| Keysight | N9030B PXA | 2Hz-50GHz | Signal analyzer | USB, LAN, GPIB |
| Keysight | N9040B UXA | 2Hz-50GHz | Ultra-high perf | USB, LAN, GPIB |
| R&S | FPL1000 | 5kHz-40GHz | Bench | USB, LAN, GPIB |
| R&S | FSV3000 | 10Hz-44GHz | Signal/spectrum | USB, LAN, GPIB |
| R&S | FSVA3000 | 10Hz-44GHz | Advanced | USB, LAN, GPIB |
| R&S | FSW | 2Hz-90GHz | High-end | USB, LAN, GPIB |
| Tektronix | RSA5000B | 1Hz-26.5GHz | Real-time | USB, LAN, GPIB |
| Anritsu | MS2840A | 9kHz-44.5GHz | Signal analyzer | USB, LAN, GPIB |

---

## SCPI Command Reference

### IEEE 488.2 Common Commands

All spectrum analyzers support these:

```scpi
*IDN?                    # Identification query
*RST                     # Reset to default state
*CLS                     # Clear status registers
*OPC                     # Operation complete (sets bit when done)
*OPC?                    # Operation complete query
*WAI                     # Wait for operations to complete
*ESR?                    # Event status register query
*ESE <mask>              # Event status enable
*STB?                    # Status byte query
*SRE <mask>              # Service request enable
*TST?                    # Self-test query
*SAV <n>                 # Save instrument state
*RCL <n>                 # Recall instrument state
```

---

### Frequency Commands

#### Center Frequency

```scpi
# Set center frequency
[:SENSe]:FREQuency:CENTer <freq>       # Value in Hz (e.g., 1e9 for 1 GHz)
[:SENSe]:FREQuency:CENTer?             # Query center frequency

# Quick syntax (SENSe optional)
:FREQ:CENT 1e9                          # Set 1 GHz
:FREQ:CENT?                             # Query

# Set to marker position
[:SENSe]:FREQuency:CENTer MARKer        # Set center to marker frequency
```

#### Frequency Span

```scpi
[:SENSe]:FREQuency:SPAN <span>          # Set span in Hz
[:SENSe]:FREQuency:SPAN?                # Query span
[:SENSe]:FREQuency:SPAN:FULL            # Set to full span
[:SENSe]:FREQuency:SPAN:ZIN             # Zoom in (span / 2)
[:SENSe]:FREQuency:SPAN:ZOUT            # Zoom out (span * 2)
[:SENSe]:FREQuency:SPAN:PREVious        # Previous span setting

# Zero span mode
[:SENSe]:FREQuency:SPAN 0               # Zero span (time domain)
```

#### Start/Stop Frequencies

```scpi
[:SENSe]:FREQuency:STARt <freq>         # Set start frequency
[:SENSe]:FREQuency:STARt?               # Query start frequency
[:SENSe]:FREQuency:STOP <freq>          # Set stop frequency
[:SENSe]:FREQuency:STOP?                # Query stop frequency
```

#### Frequency Offset

```scpi
[:SENSe]:FREQuency:OFFSet <offset>      # Set frequency offset
[:SENSe]:FREQuency:OFFSet?              # Query offset
[:SENSe]:FREQuency:OFFSet:STATe ON|OFF  # Enable/disable offset
```

#### Step Size

```scpi
[:SENSe]:FREQuency:CENTer:STEP <step>   # Set center frequency step
[:SENSe]:FREQuency:CENTer:STEP:AUTO ON|OFF  # Auto step
```

---

### Amplitude Commands

#### Reference Level

```scpi
:DISPlay[:WINDow]:TRACe:Y[:SCALe]:RLEVel <level>   # Set reference level (dBm)
:DISPlay[:WINDow]:TRACe:Y[:SCALe]:RLEVel?          # Query reference level

# Shorthand (varies by vendor)
:DISP:WIND:TRAC:Y:RLEV -10                         # Set -10 dBm
:DISP:TRAC:Y:RLEV -10                              # Siglent/Rigol short form
```

#### Scale

```scpi
:DISPlay[:WINDow]:TRACe:Y[:SCALe]:PDIVision <db>   # dB per division (1-20)
:DISPlay[:WINDow]:TRACe:Y[:SCALe]:PDIVision?       # Query

# Common values: 1, 2, 5, 10 dB/div
```

#### Amplitude Units

```scpi
:UNIT:POWer DBM|DBMV|DBUV|V|W                      # Set amplitude units
:UNIT:POWer?                                        # Query units
```

#### Input Attenuator

```scpi
[:SENSe]:POWer[:RF]:ATTenuation <dB>               # Set input attenuation
[:SENSe]:POWer[:RF]:ATTenuation?                   # Query attenuation
[:SENSe]:POWer[:RF]:ATTenuation:AUTO ON|OFF        # Auto attenuation

# Typical values: 0 to 50 dB in 2, 5, or 10 dB steps
```

#### Preamplifier

```scpi
[:SENSe]:POWer[:RF]:GAIN[:STATe] ON|OFF            # Enable/disable preamp
[:SENSe]:POWer[:RF]:GAIN[:STATe]?                  # Query preamp state
```

#### Reference Level Offset

```scpi
:DISPlay[:WINDow]:TRACe:Y[:SCALe]:RLEVel:OFFSet <dB>  # Offset for external gain/loss
:DISPlay[:WINDow]:TRACe:Y[:SCALe]:RLEVel:OFFSet?      # Query offset
```

---

### Bandwidth Commands

#### Resolution Bandwidth (RBW)

```scpi
[:SENSe]:BANDwidth[:RESolution] <hz>               # Set RBW in Hz
[:SENSe]:BANDwidth[:RESolution]?                   # Query RBW
[:SENSe]:BANDwidth[:RESolution]:AUTO ON|OFF        # Auto RBW
[:SENSe]:BANDwidth[:RESolution]:AUTO?              # Query auto state

# Also accepted:
[:SENSe]:BAND <hz>                                  # Short form
[:SENSe]:BWID <hz>                                  # Alternative

# Common RBW values: 10Hz to 3MHz (1-3-10 sequence)
# Example: 100, 300, 1000, 3000, 10000...
```

#### Video Bandwidth (VBW)

```scpi
[:SENSe]:BANDwidth:VIDeo <hz>                      # Set VBW in Hz
[:SENSe]:BANDwidth:VIDeo?                          # Query VBW
[:SENSe]:BANDwidth:VIDeo:AUTO ON|OFF               # Auto VBW
[:SENSe]:BANDwidth:VIDeo:AUTO?                     # Query auto state

# Typical RBW:VBW ratios: 1:1, 3:1, 10:1, 30:1, 100:1
```

#### RBW/VBW Ratio

```scpi
[:SENSe]:BANDwidth:VIDeo:RATio <ratio>             # Set VBW/RBW ratio
[:SENSe]:BANDwidth:VIDeo:RATio?                    # Query ratio
[:SENSe]:BANDwidth:VIDeo:RATio:AUTO ON|OFF         # Auto ratio
```

#### Filter Type

```scpi
[:SENSe]:BANDwidth[:RESolution]:TYPE GAUSsian|FLATtop|EMI|CISPR
[:SENSe]:BANDwidth[:RESolution]:TYPE?
```

---

### Sweep Commands

#### Sweep Time

```scpi
[:SENSe]:SWEep:TIME <seconds>                      # Set sweep time
[:SENSe]:SWEep:TIME?                               # Query sweep time
[:SENSe]:SWEep:TIME:AUTO ON|OFF                    # Auto sweep time
[:SENSe]:SWEep:TIME:AUTO?                          # Query auto state

# Minimum sweep time depends on span, RBW, VBW
```

#### Sweep Mode

```scpi
:INITiate:CONTinuous ON|OFF                        # Continuous or single sweep
:INITiate:CONTinuous?                              # Query mode

# Trigger single sweep
:INITiate[:IMMediate]                              # Start single sweep
:ABORt                                              # Abort current sweep
```

#### Sweep Points

```scpi
[:SENSe]:SWEep:POINts <n>                          # Set number of sweep points
[:SENSe]:SWEep:POINts?                             # Query points

# Typical values: 101, 201, 401, 601, 801, 1001, 2001, 4001, 8192
```

#### Sweep Type

```scpi
[:SENSe]:SWEep:TYPE AUTO|SWEep|FFT                 # Sweep type
[:SENSe]:SWEep:TYPE?                               # Query type
```

---

### Detector Commands

```scpi
[:SENSe]:DETector[:FUNCtion] <type>                # Set detector type
[:SENSe]:DETector[:FUNCtion]?                      # Query detector

# Detector types:
#   POSitive  - Positive peak
#   NEGative  - Negative peak
#   SAMPle    - Sample
#   NORMal    - Normal (auto pos/neg based on trace mode)
#   AVERage   - Average (RMS for power averaging)
#   QPEak     - Quasi-peak (EMC)
#   RMS       - True RMS

[:SENSe]:DETector[:FUNCtion]:AUTO ON|OFF           # Auto detector selection
```

---

### Trace Commands

#### Trace Mode

```scpi
:TRACe<n>:MODE WRITe|MAXHold|MINHold|VIEW|BLANk|AVERage
:TRACe<n>:MODE?

# Modes:
#   WRITe    - Clear/Write (normal)
#   MAXHold  - Maximum hold
#   MINHold  - Minimum hold
#   VIEW     - View (frozen)
#   BLANk    - Blank/off
#   AVERage  - Averaging

# Trace numbers: 1-6 depending on instrument
```

#### Trace Averaging

```scpi
[:SENSe]:AVERage:COUNt <n>                         # Number of averages
[:SENSe]:AVERage:COUNt?                            # Query average count
[:SENSe]:AVERage[:STATe] ON|OFF                    # Enable/disable averaging
[:SENSe]:AVERage:TYPE LOG|LINear|POWer|VIDeo       # Average type
[:SENSe]:AVERage:CLEar                             # Clear averaging
```

#### Read Trace Data

```scpi
:TRACe[:DATA]? TRACe1                              # Read trace 1 data
:TRACe[:DATA]? TRACe2                              # Read trace 2 data

# Data format control
:FORMat[:TRACe][:DATA] ASCii                       # ASCII format (comma-separated)
:FORMat[:TRACe][:DATA] REAL,32                     # 32-bit binary float
:FORMat[:TRACe][:DATA] REAL,64                     # 64-bit binary float
:FORMat:BORDer NORMal|SWAPped                      # Byte order for binary

# Binary block format:
# #<n><length><data>
# Example: #512320<12320 bytes of data>
# First digit (5) = number of length digits
# 12320 = number of bytes following
```

#### Trace Math

```scpi
:TRACe:MATH:TYPE <op>                              # Math operation
:TRACe:MATH:STATe ON|OFF                           # Enable trace math

# Operations: OFF, A-B, A+B, A+const, etc.
```

---

### Marker Commands

#### Enable/Position Markers

```scpi
:CALCulate:MARKer<n>[:STATe] ON|OFF                # Enable/disable marker n
:CALCulate:MARKer<n>[:STATe]?                      # Query marker state
:CALCulate:MARKer<n>:X <freq>                      # Set marker X (frequency)
:CALCulate:MARKer<n>:X?                            # Query marker X
:CALCulate:MARKer<n>:Y?                            # Query marker Y (amplitude)

# Marker numbers: 1-8 (varies by instrument)
```

#### Marker Search

```scpi
:CALCulate:MARKer<n>:MAXimum                       # Move to peak
:CALCulate:MARKer<n>:MAXimum:NEXT                  # Next peak
:CALCulate:MARKer<n>:MAXimum:RIGHt                 # Next peak right
:CALCulate:MARKer<n>:MAXimum:LEFT                  # Next peak left
:CALCulate:MARKer<n>:MINimum                       # Move to minimum
:CALCulate:MARKer<n>:PEAK[:SET]:CF                 # Peak search, set center freq
```

#### Delta Markers

```scpi
:CALCulate:MARKer<n>:MODE POSition|DELTa|OFF       # Marker mode
:CALCulate:MARKer<n>:MODE?                         # Query mode
:CALCulate:MARKer<n>:REFerence <m>                 # Reference marker for delta

# Delta marker reads difference from reference marker
```

#### Marker Functions

```scpi
:CALCulate:MARKer<n>:FUNCtion NOISe                # Noise marker
:CALCulate:MARKer<n>:FUNCtion:NOISe[:STATe] ON|OFF
:CALCulate:MARKer<n>:FUNCtion:NOISe:RESult?        # Read noise density (dBm/Hz)

:CALCulate:MARKer<n>:FUNCtion:BPOWer[:STATe] ON|OFF  # Band power
:CALCulate:MARKer<n>:FUNCtion:BPOWer:SPAN <hz>       # Band power span
:CALCulate:MARKer<n>:FUNCtion:BPOWer:RESult?         # Read band power

:CALCulate:MARKer<n>:FCOunt[:STATe] ON|OFF         # Frequency counter
:CALCulate:MARKer<n>:FCOunt:X?                     # Read counted frequency
```

#### Set Center/Span from Marker

```scpi
:CALCulate:MARKer<n>:CENTer                        # Set center freq to marker
:CALCulate:MARKer<n>:STARt                         # Set start freq to marker
:CALCulate:MARKer<n>:STOP                          # Set stop freq to marker
```

#### All Markers Off

```scpi
:CALCulate:MARKer:AOFF                             # Turn off all markers
```

---

### Peak Search / Peak Table

```scpi
:CALCulate:MARKer:PEAK:THReshold <dB>              # Peak threshold (above noise)
:CALCulate:MARKer:PEAK:EXCursion <dB>              # Peak excursion (prominence)
:CALCulate:MARKer:PEAK:SORT FREQuency|AMPLitude    # Sort order
:CALCulate:MARKer:PEAK:TABLe[:STATe] ON|OFF        # Peak table display
:CALCulate:MARKer:PEAK:TABLe:DATA?                 # Read peak table data
```

---

### Trigger Commands

```scpi
:TRIGger[:SEQuence]:SOURce IMMediate|EXTernal|VIDeo|LINE|IF
:TRIGger[:SEQuence]:SOURce?

# Trigger sources:
#   IMMediate  - Free run
#   EXTernal   - External trigger input
#   VIDeo      - Video trigger (signal level)
#   LINE       - AC line
#   IF         - IF (intermediate frequency)

:TRIGger[:SEQuence]:VIDeo:LEVel <dBm>              # Video trigger level
:TRIGger[:SEQuence]:VIDeo:LEVel?
:TRIGger[:SEQuence]:DELay <seconds>                # Trigger delay
:TRIGger[:SEQuence]:DELay?
:TRIGger[:SEQuence]:SLOPe POSitive|NEGative        # Trigger slope
```

---

### Tracking Generator Commands

(For instruments with built-in tracking generator)

```scpi
:SOURce:POWer[:LEVel][:IMMediate][:AMPLitude] <dBm>  # TG output level
:SOURce:POWer[:LEVel][:IMMediate][:AMPLitude]?       # Query TG level
:SOURce:POWer[:LEVel][:IMMediate]:OFFSet <dB>        # TG offset
:OUTPut[:STATe] ON|OFF                               # Enable/disable TG
:OUTPut[:STATe]?

# Normalization (for transmission/reflection measurements)
:CALCulate:NTData:STATe ON|OFF                       # Enable normalization
:CALCulate:NTData:REFerence:STORe                    # Store reference trace
:CALCulate:NTData:REFerence:POSition TOP|MIDDle|BOTTom  # Reference position
```

---

### Limit Lines

```scpi
:CALCulate:LLINe<n>:DATA <freq1>,<amp1>,<freq2>,<amp2>,...
:CALCulate:LLINe<n>:STATe ON|OFF                   # Enable limit line n
:CALCulate:LLINe<n>:TYPE UPPer|LOWer               # Upper or lower limit
:CALCulate:LLINe<n>:FAIL?                          # Query pass/fail status (0/1)
:CALCulate:LLINe<n>:CLEar                          # Clear limit line

:CALCulate:LLINe:ALL:CLEar                         # Clear all limit lines
```

---

### Display Commands

```scpi
:DISPlay:ENABle ON|OFF                             # Display on/off (for speed)
:DISPlay:WINDow:TRACe:GRATicule:GRID ON|OFF        # Grid on/off
:DISPlay[:WINDow]:TEXT[:DATA] "message"            # Display message
:DISPlay[:WINDow]:TEXT:CLEar                       # Clear message
```

---

### System Commands

```scpi
:SYSTem:ERRor?                                     # Read error
:SYSTem:ERRor:ALL?                                 # Read all errors
:SYSTem:PRESet                                     # Factory preset
:SYSTem:DATE <year>,<month>,<day>                  # Set date
:SYSTem:TIME <hour>,<min>,<sec>                    # Set time
:SYSTem:VERSion?                                   # SCPI version
:SYSTem:OPTions?                                   # Installed options
:SYSTem:COMMunicate:LAN:IPADdress?                 # Query IP address
```

---

## Vendor Variations

### Frequency Center

| Vendor | Command | Notes |
|--------|---------|-------|
| Rigol | `:SENS:FREQ:CENT <freq>` | Standard |
| Siglent | `:SENS:FREQ:CENT <freq>` | Standard |
| Keysight | `[:SENS]:FREQ:CENT <freq>` | Standard |
| R&S | `:FREQ:CENT <freq>` | Abbreviated |

### Reference Level

| Vendor | Command | Notes |
|--------|---------|-------|
| Rigol | `:DISP:WIND:TRAC:Y:RLEV <dBm>` | Full form |
| Siglent | `:DISP:TRAC:Y:RLEV <dBm>` | Shorter |
| Keysight | `:DISP:WIND:TRAC:Y:SCAL:RLEV <dBm>` | X-Series |
| R&S | `:DISP:TRAC:Y:RLEV <dBm>` | Standard |

### Read Trace Data

| Vendor | Command | Data Format |
|--------|---------|-------------|
| Rigol | `:TRAC:DATA? TRACE1` | Comma-separated dBm values |
| Siglent | `:TRAC:DATA? 1` | Comma-separated dBm values |
| Keysight | `:TRAC:DATA? TRACE1` | ASCII or binary |
| R&S | `:TRAC:DATA? TRACE1` | ASCII or binary |

### Marker Peak Search

| Vendor | Command | Notes |
|--------|---------|-------|
| Rigol | `:CALC:MARK1:MAX:MAX` | Peak on marker 1 |
| Siglent | `:CALC:MARK:PEAK` | Peak search |
| Keysight | `:CALC:MARK1:MAX` | Standard |
| R&S | `:CALC:MARK:MAX` | Standard |

---

## Programming Examples

### Basic Frequency Measurement

```scpi
# Rigol DSA800 / Siglent SSA3000X example
*RST                                    # Reset
:SENS:FREQ:CENT 1e9                     # Center 1 GHz
:SENS:FREQ:SPAN 100e6                   # Span 100 MHz
:SENS:BAND 100e3                        # RBW 100 kHz
:SENS:BAND:VID 30e3                     # VBW 30 kHz
:DISP:WIND:TRAC:Y:RLEV -10              # Ref level -10 dBm
:INIT:CONT OFF                          # Single sweep
:INIT                                   # Start sweep
*OPC?                                   # Wait for complete
:CALC:MARK1:STAT ON                     # Enable marker 1
:CALC:MARK1:MAX                         # Peak search
:CALC:MARK1:X?                          # Read frequency
:CALC:MARK1:Y?                          # Read amplitude
```

### Trace Acquisition

```scpi
# Configure and capture trace
*RST
:SENS:FREQ:STAR 100e6                   # Start 100 MHz
:SENS:FREQ:STOP 1e9                     # Stop 1 GHz
:SENS:BAND:AUTO ON                      # Auto RBW
:SENS:SWE:POIN 601                      # 601 points
:TRAC1:MODE WRIT                        # Clear/write mode
:INIT:CONT OFF                          # Single sweep
:INIT                                   # Start sweep
*OPC?                                   # Wait
:FORM:DATA ASC                          # ASCII format
:TRAC:DATA? TRACE1                      # Read trace data
```

### Max Hold Measurement

```scpi
# Capture max hold over time
*RST
:SENS:FREQ:CENT 915e6                   # 915 MHz (ISM band)
:SENS:FREQ:SPAN 2e6                     # 2 MHz span
:SENS:BAND 10e3                         # 10 kHz RBW
:DISP:WIND:TRAC:Y:RLEV 0                # Ref level 0 dBm
:TRAC1:MODE MAXH                        # Max hold
:INIT:CONT ON                           # Continuous
# Wait for signals...
:INIT:CONT OFF                          # Stop
:TRAC:DATA? TRACE1                      # Read max hold data
```

### Channel Power Measurement (Keysight X-Series)

```scpi
# Channel power example
:CONFigure:CHPower
:SENSe:CHPower:BANDwidth:INTegration 3.84e6  # Channel BW
:SENSe:CHPower:FREQuency:SPAN 8e6            # Span
:INITiate:CHPower
*OPC?
:FETCh:CHPower?                              # Read channel power
```

---

## Command Abstraction Summary

### Abstract Driver Interface

```typescript
interface SpectrumAnalyzerDriver {
  // Identification
  getIdentification(): Promise<string>;
  reset(): Promise<void>;
  preset(): Promise<void>;

  // Frequency
  setCenterFrequency(freq: number): Promise<void>;
  getCenterFrequency(): Promise<number>;
  setSpan(span: number): Promise<void>;
  getSpan(): Promise<number>;
  setStartFrequency(freq: number): Promise<void>;
  setStopFrequency(freq: number): Promise<void>;
  setFullSpan(): Promise<void>;
  zoomIn(): Promise<void>;
  zoomOut(): Promise<void>;

  // Amplitude
  setReferenceLevel(level: number): Promise<void>;
  getReferenceLevel(): Promise<number>;
  setAttenuation(atten: number | 'auto'): Promise<void>;
  getAttenuation(): Promise<number>;
  setPreamplifier(enabled: boolean): Promise<void>;

  // Bandwidth
  setRbw(rbw: number | 'auto'): Promise<void>;
  getRbw(): Promise<number>;
  setVbw(vbw: number | 'auto'): Promise<void>;
  getVbw(): Promise<number>;

  // Sweep
  setSweepPoints(points: number): Promise<void>;
  setSweepTime(time: number | 'auto'): Promise<void>;
  setSingleSweep(): Promise<void>;
  setContinuousSweep(): Promise<void>;
  startSweep(): Promise<void>;
  waitForSweep(): Promise<void>;
  abortSweep(): Promise<void>;

  // Trace
  setTraceMode(trace: number, mode: 'write' | 'maxhold' | 'minhold' | 'average' | 'view' | 'blank'): Promise<void>;
  getTraceData(trace: number): Promise<number[]>;
  setAverageCount(count: number): Promise<void>;
  setDetector(type: 'positive' | 'negative' | 'sample' | 'normal' | 'average' | 'rms' | 'qpeak'): Promise<void>;

  // Markers
  enableMarker(marker: number): Promise<void>;
  disableMarker(marker: number): Promise<void>;
  setMarkerFrequency(marker: number, freq: number): Promise<void>;
  getMarkerFrequency(marker: number): Promise<number>;
  getMarkerAmplitude(marker: number): Promise<number>;
  markerPeakSearch(marker: number): Promise<void>;
  markerNextPeak(marker: number): Promise<void>;
  markerToCenterFreq(marker: number): Promise<void>;
  allMarkersOff(): Promise<void>;

  // Tracking Generator (if equipped)
  setTgOutputLevel(level: number): Promise<void>;
  enableTg(): Promise<void>;
  disableTg(): Promise<void>;
}

interface SpectrumData {
  startFrequency: number;
  stopFrequency: number;
  points: number;
  data: number[];            // Amplitude values in dBm
  rbw: number;
  vbw: number;
  referenceLevel: number;
  attenuation: number;
}
```

### Vendor Command Translation Table

| Method | Rigol DSA800 | Siglent SSA3000X | Keysight X-Series |
|--------|--------------|------------------|-------------------|
| `setCenterFrequency(1e9)` | `:SENS:FREQ:CENT 1e9` | `:SENS:FREQ:CENT 1e9` | `:FREQ:CENT 1e9` |
| `setSpan(100e6)` | `:SENS:FREQ:SPAN 100e6` | `:SENS:FREQ:SPAN 100e6` | `:FREQ:SPAN 100e6` |
| `setReferenceLevel(-10)` | `:DISP:WIND:TRAC:Y:RLEV -10` | `:DISP:TRAC:Y:RLEV -10` | `:DISP:WIND:TRAC:Y:SCAL:RLEV -10` |
| `setRbw(100e3)` | `:SENS:BAND 100e3` | `:SENS:BAND:RES 100e3` | `:BAND 100e3` |
| `setVbw(30e3)` | `:SENS:BAND:VID 30e3` | `:SENS:BAND:VID 30e3` | `:BAND:VID 30e3` |
| `startSweep()` | `:INIT` | `:INIT` | `:INIT:IMM` |
| `getTraceData(1)` | `:TRAC:DATA? TRACE1` | `:TRAC:DATA? 1` | `:TRAC:DATA? TRACE1` |
| `markerPeakSearch(1)` | `:CALC:MARK1:MAX:MAX` | `:CALC:MARK:PEAK` | `:CALC:MARK1:MAX` |
| `getMarkerFrequency(1)` | `:CALC:MARK1:X?` | `:CALC:MARK1:X?` | `:CALC:MARK1:X?` |
| `getMarkerAmplitude(1)` | `:CALC:MARK1:Y?` | `:CALC:MARK1:Y?` | `:CALC:MARK1:Y?` |

---

## Resources

### Official Documentation

| Vendor | Series | Documentation |
|--------|--------|---------------|
| Rigol | DSA800 | [Programming Guide (PDF)](https://m.testlink.co.kr/download/rigol/DSA800_ProgrammingGuide_EN.pdf) |
| Rigol | DSA800E | [Programming Guide (PDF)](https://beyondmeasure.rigoltech.com/acton/attachment/1579/f-06c1/1/-/-/-/-/DSA800E%20Programming%20Guide.pdf) |
| Siglent | SSA3000X | [Programming Guide (PDF)](https://int.siglent.com/upload_file/user/SSA3000X/SSA3000X_ProgrammingGuide_PG0703X_E04A.pdf) |
| Siglent | SSA3000X Plus | [Programming Guide (PDF)](https://int.siglent.com/u_file/document/ProgrammingGuide_PG0703P_E02B.pdf) |
| R&S | HMS-X | [SCPI Programmers Manual (PDF)](https://www.batronix.com/files/Rohde-&-Schwarz/Spectrum-Analyser/HMS-X/HMS-X_ProgrammingManual_en.pdf) |
| R&S | FPC1500 | [User Manual (PDF)](https://www.batronix.com/files/Rohde-&-Schwarz/Spectrum-Analyser/FPC1500/FPC1500_UserManual_en.pdf) |
| R&S | FSW | [User Manual](https://www.rohde-schwarz.com/manual/fsw/) |
| Keysight | X-Series | [Programmer's Guide (PDF)](https://www.keysight.com/us/en/assets/9018-02192/programming-guides/9018-02192.pdf) |
| Keysight | Various | [Online Help](https://helpfiles.keysight.com/) |

### Python Libraries

| Library | Link | Notes |
|---------|------|-------|
| RsFsw | [rohde-schwarz.github.io](https://rohde-schwarz.github.io/RsFsw_PythonDocumentation/) | R&S FSW driver |
| pyvisa | [pyvisa.readthedocs.io](https://pyvisa.readthedocs.io/) | VISA interface |
