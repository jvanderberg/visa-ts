# Source Measure Unit (SMU) SCPI Command Reference

This document provides comprehensive SCPI command documentation for Source Measure Units (SMUs) across multiple vendors and price tiers.

---

## Instrument Coverage

### Entry Level ($500-$2,000)
| Vendor | Series | Voltage | Current | Interfaces | Notes |
|--------|--------|---------|---------|------------|-------|
| ITECH | IT2800 | 100nV-1000V | 10fA-10A | USB, LAN, GPIB | Compact, cost-effective |
| Rigol | DP821A* | 60V | 1A | USB, LAN | Partial SMU capability |

*DP821A is primarily a PSU with some SMU-like measurement capability

### Mid-Range ($2,000-$10,000)
| Vendor | Series | Voltage | Current | Interfaces | Notes |
|--------|--------|---------|---------|------------|-------|
| Keithley | 2400 | 210V | 1A | GPIB, RS-232 | Classic SMU, SCPI |
| Keithley | 2410 | 1100V | 1A | GPIB, RS-232 | High voltage |
| Keithley | 2420 | 60V | 3A | GPIB, RS-232 | Higher current |
| Keithley | 2425 | 100V | 3A | GPIB, RS-232 | Mid range |
| Keithley | 2430 | 100V | 3A | GPIB, RS-232 | Pulse mode |
| Keithley | 2440 | 40V | 5A | GPIB, RS-232 | High current |
| Keithley | 2450 | 200V | 1A | USB, LAN, GPIB | Touchscreen, modern SCPI |
| Keithley | 2460 | 100V | 7A | USB, LAN, GPIB | High current |
| Keithley | 2461 | 100V | 10A | USB, LAN, GPIB | Very high current |
| Keithley | 2470 | 1100V | 1A | USB, LAN, GPIB | High voltage |
| R&S | NGU201 | 20V | 6A | USB, LAN | 2-quadrant |
| R&S | NGU401 | 20V | 6A | USB, LAN, opt GPIB | 4-quadrant |

### Professional ($10,000-$50,000)
| Vendor | Series | Voltage | Current | Interfaces | Notes |
|--------|--------|---------|---------|------------|-------|
| Keysight | B2901A | 210V | 3A | USB, LAN, GPIB | 1-channel precision |
| Keysight | B2902A | 210V | 3A | USB, LAN, GPIB | 2-channel |
| Keysight | B2911A | 210V | 3A | USB, LAN, GPIB | 10fA resolution |
| Keysight | B2912A | 210V | 3A | USB, LAN, GPIB | 2-channel, 10fA |
| Keysight | N6781A | 20V | 3A | N6700 mainframe | SMU module |
| Keysight | N6782A | 20V | 3A | N6700 mainframe | 2-quadrant |
| Keysight | N6784A | 20V | 3A | N6700 mainframe | 4-quadrant |
| Keithley | 2601B | 40V | 3A | USB, LAN, GPIB | TSP scripting |
| Keithley | 2602B | 40V | 3A | USB, LAN, GPIB | 2-channel, TSP |
| Keithley | 2611B | 200V | 1.5A | USB, LAN, GPIB | High voltage TSP |
| Keithley | 2612B | 200V | 1.5A | USB, LAN, GPIB | 2-channel |
| Keithley | 2635B | 200V | 1.5A | USB, LAN, GPIB | Low current (1fA) |
| Keithley | 2636B | 200V | 1.5A | USB, LAN, GPIB | 2-ch low current |

### High-End / Parameter Analyzers ($50,000+)
| Vendor | Series | Description | Interfaces |
|--------|--------|-------------|------------|
| Keysight | B1500A | Semiconductor parameter analyzer | USB, LAN, GPIB |
| Keithley | 4200A-SCS | Parameter analyzer system | USB, LAN, GPIB |
| Keysight | B2985A/B2987A | Electrometer/High-R meter | USB, LAN, GPIB |

---

## Command Languages

**IMPORTANT: Not all SMUs use SCPI**

| Family | Language | Notes |
|--------|----------|-------|
| Keithley 2400 series | SCPI | Standard SCPI commands |
| Keithley 2450/2460/2461/2470 | SCPI | Enhanced SCPI, TSP optional |
| Keithley 2600B series | TSP | Lua-based scripting (SCPI emulation available) |
| Keysight B2900A/B | SCPI | Also supports 2400 emulation mode |
| R&S NGU | SCPI | Standard SCPI |
| ITECH IT2800 | SCPI | Standard SCPI |
| Keysight N678xA modules | SCPI | Part of N6700 system |

---

## SCPI Command Reference

### IEEE 488.2 Common Commands

All SCPI-compliant SMUs support these:

```scpi
*IDN?                    # Identification query
*RST                     # Reset to default state
*CLS                     # Clear status registers
*OPC                     # Operation complete (sets OPC bit when done)
*OPC?                    # Operation complete query (returns 1 when done)
*WAI                     # Wait for operations to complete
*ESR?                    # Event status register query
*ESE <mask>              # Event status enable
*STB?                    # Status byte query
*SRE <mask>              # Service request enable
*TST?                    # Self-test query
*SAV <n>                 # Save instrument state (n = 0-4)
*RCL <n>                 # Recall instrument state
```

---

### SOURce Subsystem

Controls voltage and current sourcing.

#### Function Selection

| Vendor | Set Voltage Source | Set Current Source |
|--------|-------------------|-------------------|
| Keithley 2400/2450 | `:SOUR:FUNC VOLT` | `:SOUR:FUNC CURR` |
| Keysight B2900 | `:SOUR:FUNC:MODE VOLT` | `:SOUR:FUNC:MODE CURR` |
| R&S NGU | `:SOUR:FUNC VOLT` | `:SOUR:FUNC CURR` |
| ITECH IT2800 | `:SOUR:FUNC VOLT` | `:SOUR:FUNC CURR` |

#### Voltage Source Commands

```scpi
# Keithley 2400/2450 Style (most common)
:SOURce:VOLTage:MODE FIXed           # Fixed voltage mode
:SOURce:VOLTage:MODE SWEep           # Sweep mode
:SOURce:VOLTage:MODE LIST            # List mode
:SOURce:VOLTage:RANGe <range>        # Set voltage range (e.g., 20, 200)
:SOURce:VOLTage:RANGe:AUTO ON|OFF    # Auto-range
:SOURce:VOLTage:LEVel <value>        # Set voltage level
:SOURce:VOLTage:LEVel?               # Query voltage level
:SOURce:VOLTage:LEVel:IMMediate <v>  # Immediate voltage level

# Query forms
:SOURce:VOLTage:RANGe?
:SOURce:VOLTage:LEVel?
```

#### Current Source Commands

```scpi
:SOURce:CURRent:MODE FIXed           # Fixed current mode
:SOURce:CURRent:MODE SWEep           # Sweep mode
:SOURce:CURRent:MODE LIST            # List mode
:SOURce:CURRent:RANGe <range>        # Set current range (e.g., 0.01, 0.1, 1)
:SOURce:CURRent:RANGe:AUTO ON|OFF    # Auto-range
:SOURce:CURRent:LEVel <value>        # Set current level
:SOURce:CURRent:LEVel?               # Query current level
:SOURce:CURRent:LEVel:IMMediate <i>  # Immediate current level
```

---

### SENSe Subsystem (Measurement Configuration)

Configures what the SMU measures.

#### Function Selection

```scpi
# Keithley 2400 style - quoted string
[:SENSe]:FUNCtion "VOLTage"          # Measure voltage
[:SENSe]:FUNCtion "CURRent"          # Measure current
[:SENSe]:FUNCtion "RESistance"       # Measure resistance

# Keithley 2450 style - can specify concurrent
:SENSe:FUNCtion "VOLT"
:SENSe:FUNCtion "CURR"
:SENSe:FUNCtion "RES"

# Keysight B2900 style
:SENSe:FUNCtion:ON "VOLT"
:SENSe:FUNCtion:ON "CURR"
```

#### Measurement Range

```scpi
:SENSe:VOLTage:RANGe <range>         # Manual voltage measurement range
:SENSe:VOLTage:RANGe:AUTO ON|OFF     # Auto-range for voltage
:SENSe:VOLTage:RANGe:AUTO:ULIMit <r> # Upper limit for auto-range
:SENSe:VOLTage:RANGe:AUTO:LLIMit <r> # Lower limit for auto-range

:SENSe:CURRent:RANGe <range>         # Manual current measurement range
:SENSe:CURRent:RANGe:AUTO ON|OFF     # Auto-range for current
:SENSe:CURRent:RANGe:AUTO:ULIMit <r> # Upper limit for auto-range
:SENSe:CURRent:RANGe:AUTO:LLIMit <r> # Lower limit for auto-range

:SENSe:RESistance:RANGe <range>      # Resistance range
:SENSe:RESistance:RANGe:AUTO ON|OFF  # Auto-range for resistance
```

#### Protection / Compliance

SMUs need compliance limits to prevent damage. This is called "protection" in SCPI.

| Vendor | Voltage Compliance | Current Compliance |
|--------|-------------------|-------------------|
| Keithley 2400 | `:SENS:VOLT:PROT <v>` | `:SENS:CURR:PROT <i>` |
| Keithley 2450+ | `:SOUR:VOLT:ILIM <i>` | `:SOUR:CURR:VLIM <v>` |
| Keysight B2900 | `:SENS:VOLT:PROT <v>` | `:SENS:CURR:PROT <i>` |
| R&S NGU | `:SOUR:VOLT:PROT <v>` | `:SOUR:CURR:PROT <i>` |

```scpi
# Keithley 2400 style (setting compliance via SENSe)
[:SENSe]:VOLTage:PROTection <value>  # Set voltage compliance
[:SENSe]:CURRent:PROTection <value>  # Set current compliance
[:SENSe]:VOLTage:PROTection:TRIPped? # Query if compliance tripped
[:SENSe]:CURRent:PROTection:TRIPped? # Query if compliance tripped

# Keithley 2450/2461 style (setting limit via SOURce)
:SOURce:VOLTage:ILIMit <value>       # Current limit when sourcing voltage
:SOURce:CURRent:VLIMit <value>       # Voltage limit when sourcing current
:SOURce:VOLTage:ILIMit:LEVel?        # Query current limit
```

#### Integration Time (NPLC)

NPLC = Number of Power Line Cycles. Higher = slower but more accurate.

```scpi
:SENSe:VOLTage:NPLCycles <n>         # Set voltage NPLC (e.g., 0.01 to 10)
:SENSe:CURRent:NPLCycles <n>         # Set current NPLC
:SENSe:RESistance:NPLCycles <n>      # Set resistance NPLC

# Common NPLC values:
# 0.01  = Fast (noisy)
# 0.1   = Medium-fast
# 1     = 1 power line cycle (16.67ms @ 60Hz, 20ms @ 50Hz)
# 10    = Slow (quiet, highest accuracy)
```

#### Wire Mode (Remote Sense)

```scpi
# Keithley style
:SYSTem:RSENse ON|OFF               # Enable/disable 4-wire remote sense
:SENSe:REMote ON|OFF                # Alternative syntax

# Keysight B2900 style
:SENSe:REMote ON|OFF
:SYSTem:RSENse ON|OFF

# Query
:SYSTem:RSENse?
```

---

### OUTPut Subsystem

Controls output on/off state.

```scpi
:OUTPut[:STATe] ON|OFF|1|0          # Enable/disable output
:OUTPut[:STATe]?                    # Query output state

# For multi-channel SMUs (e.g., B2902A, 2602B)
:OUTPut1[:STATe] ON|OFF             # Channel 1
:OUTPut2[:STATe] ON|OFF             # Channel 2

# Output off mode (what happens when output turns off)
:OUTPut:OFF:MODE NORMal|HIMPedance|ZERO|GUARd
#   NORMal    - Output goes to 0V, normal impedance
#   HIMPedance - High impedance (disconnected)
#   ZERO      - 0V with low impedance
#   GUARd     - Maintains guard

# Low terminal grounding (Keysight B2900)
:OUTPut:LOW GROund|FLOat            # Ground or float low terminal
```

---

### MEASure / READ / FETCh

These commands trigger and return measurements.

#### Immediate Measurement (Configure + Trigger + Read)

```scpi
:MEASure:VOLTage[:DC]?              # Measure and return voltage
:MEASure:CURRent[:DC]?              # Measure and return current
:MEASure:RESistance?                # Measure and return resistance

# Keysight concurrent measurement
:MEASure:SCALar:VOLTage[:DC]?
:MEASure:SCALar:CURRent[:DC]?
```

#### Triggered Measurement

```scpi
# Configure, then read
:CONFigure:VOLTage[:DC]             # Configure for voltage measurement
:CONFigure:CURRent[:DC]             # Configure for current measurement
:READ?                               # Trigger and read (returns all enabled measurements)

# Or fetch previously triggered data
:INITiate                            # Trigger measurement
:FETCh?                              # Fetch data without re-triggering
```

#### Data Format

```scpi
# Keithley 2400/2450 READ? returns comma-separated values:
# voltage, current, resistance, timestamp, status
# Example: "1.23456E+00,4.56789E-06,2.70290E+05,1.234E+00,0"

# Keysight B2900 format selection
:FORMat:DATA ASCii                   # ASCII format
:FORMat:DATA REAL,32                 # Binary 32-bit float
:FORMat:DATA REAL,64                 # Binary 64-bit float
:FORMat:BORDer NORMal|SWAPped        # Byte order for binary
```

---

### TRIGger Subsystem

Controls measurement and source triggering.

#### Trigger Source

```scpi
# Keithley 2400 style
:TRIGger:SOURce IMMediate            # Immediate (continuous)
:TRIGger:SOURce TIMer                # Timer-based
:TRIGger:SOURce MANual               # Manual trigger
:TRIGger:SOURce BUS                  # Bus trigger (*TRG or GPIB GET)
:TRIGger:SOURce EXTernal             # External trigger input

# Keithley 2450/2460/2461/2470 style (enhanced)
:TRIGger:LOAD "Empty"                # Load empty trigger model
:TRIGger:BLOCk:MEAS:DIGitize <n>     # Add measurement block
:TRIGger:BLOCk:DELay:CONStant <n>,<t> # Add delay block
```

#### Trigger Count

```scpi
:TRIGger:COUNt <n>                   # Number of triggers (1 to 2500)
:TRIGger:COUNt INFinite              # Continuous triggering
:TRIGger:DELay <seconds>             # Delay between triggers
:TRIGger:DELay:AUTO ON|OFF           # Auto delay
```

#### Arming and Initiating

```scpi
:INITiate[:IMMediate]                # Start measurement/trigger sequence
:INITiate:CONTinuous ON|OFF          # Continuous initiation
:ABORt                               # Abort measurement in progress
```

---

### SWEep Subsystem

Linear and logarithmic sweeps.

#### Voltage Sweep

```scpi
:SOURce:VOLTage:MODE SWEep           # Enable sweep mode
:SOURce:VOLTage:STARt <v>            # Start voltage
:SOURce:VOLTage:STOP <v>             # Stop voltage
:SOURce:VOLTage:STEP <v>             # Step size (for linear)
:SOURce:VOLTage:POINts <n>           # Number of points
:SOURce:SWEep:SPACing LINear|LOGarithmic  # Linear or log spacing
:SOURce:SWEep:DIRection UP|DOWN      # Sweep direction
:SOURce:SWEep:RANGing AUTO|BEST|FIXed # Range selection during sweep
```

#### Current Sweep

```scpi
:SOURce:CURRent:MODE SWEep           # Enable sweep mode
:SOURce:CURRent:STARt <i>            # Start current
:SOURce:CURRent:STOP <i>             # Stop current
:SOURce:CURRent:STEP <i>             # Step size
:SOURce:CURRent:POINts <n>           # Number of points
```

---

### TRACe/DATA Subsystem (Buffer)

Reading data from the instrument buffer.

```scpi
# Keithley 2400 style
:TRACe:CLEar                         # Clear buffer
:TRACe:POINts <n>                    # Set buffer size
:TRACe:POINts?                       # Query buffer size
:TRACe:POINts:ACTual?                # Query number of readings in buffer
:TRACe:FEED SENSe                    # Store sense data
:TRACe:FEED:CONTrol NEVer|NEXT|ALWays # Buffer fill mode
:TRACe:DATA?                         # Read all buffer data

# Keithley 2450/2460/2461/2470 style
:TRACe:MAKE "defbuffer1", <size>     # Create named buffer
:TRACe:CLEar "defbuffer1"            # Clear named buffer
:TRACe:DATA? <start>, <count>, "defbuffer1", SOUR, READ
                                     # Read source and reading values

# Keysight B2900 style
:SENSe:DATA:LATest?                  # Get most recent reading
:SENSe:DATA?                         # Get all buffer data
```

---

### LIST Subsystem

Arbitrary voltage/current lists.

```scpi
# Keithley style
:SOURce:LIST:VOLTage <v1>, <v2>, ...  # Define voltage list
:SOURce:LIST:CURRent <i1>, <i2>, ...  # Define current list
:SOURce:VOLTage:MODE LIST             # Enable list mode
:SOURce:CURRent:MODE LIST             # Enable list mode

# Keysight B2900 style
:SOURce:LIST:VOLTage <v1,v2,v3,...>
:SOURce:LIST:CURR <i1,i2,i3,...>
:SOURce:LIST:DWEL <t1,t2,t3,...>     # Dwell times
:SOURce:FUNCtion:MODE LIST
```

---

### SYSTem Subsystem

System configuration and status.

```scpi
:SYSTem:ERRor?                       # Read error from queue
:SYSTem:ERRor:ALL?                   # Read all errors
:SYSTem:ERRor:COUNt?                 # Number of errors in queue
:SYSTem:VERSion?                     # SCPI version
:SYSTem:BEEPer[:IMMediate] <freq>, <dur>  # Generate beep
:SYSTem:BEEPer:STATe ON|OFF          # Enable/disable beeper
:SYSTem:DATE <year>, <month>, <day>  # Set date
:SYSTem:TIME <hour>, <min>, <sec>    # Set time
:SYSTem:LOCal                        # Return to local (front panel) mode
:SYSTem:REMote                       # Enter remote mode
:SYSTem:RWLock                       # Remote with local lockout
```

---

### DISPlay Subsystem

```scpi
:DISPlay:ENABle ON|OFF               # Enable/disable display
:DISPlay[:WINDow]:TEXT[:DATA] "msg"  # Display message
:DISPlay[:WINDow]:TEXT:STATe ON|OFF  # Show/hide text
:DISPlay:DIGits <n>                  # Display resolution (4-7)
```

---

## Vendor Variation Summary

### Output Enable

| Vendor | Enable Output | Disable Output | Query |
|--------|--------------|----------------|-------|
| Keithley 2400/2450 | `:OUTP ON` | `:OUTP OFF` | `:OUTP?` |
| Keysight B2900 | `:OUTP ON` or `:OUTP1 ON` | `:OUTP OFF` | `:OUTP?` |
| R&S NGU | `:OUTP ON` | `:OUTP OFF` | `:OUTP?` |
| ITECH IT2800 | `:OUTP ON` | `:OUTP OFF` | `:OUTP?` |

### Source Function Selection

| Vendor | Voltage Source | Current Source |
|--------|---------------|----------------|
| Keithley 2400 | `:SOUR:FUNC VOLT` | `:SOUR:FUNC CURR` |
| Keithley 2450+ | `:SOUR:FUNC VOLT` | `:SOUR:FUNC CURR` |
| Keysight B2900 | `:SOUR:FUNC:MODE VOLT` | `:SOUR:FUNC:MODE CURR` |
| R&S NGU | `:SOUR:FUNC VOLT` | `:SOUR:FUNC CURR` |

### Compliance/Limit Setting

| Vendor | Current Limit (V source) | Voltage Limit (I source) |
|--------|-------------------------|-------------------------|
| Keithley 2400 | `:SENS:CURR:PROT <i>` | `:SENS:VOLT:PROT <v>` |
| Keithley 2450+ | `:SOUR:VOLT:ILIM <i>` | `:SOUR:CURR:VLIM <v>` |
| Keysight B2900 | `:SENS:CURR:PROT <i>` | `:SENS:VOLT:PROT <v>` |

### Measurement Query

| Vendor | Voltage | Current | Both |
|--------|---------|---------|------|
| Keithley 2400 | `:MEAS:VOLT?` | `:MEAS:CURR?` | `:READ?` |
| Keithley 2450 | `:MEAS:VOLT?` | `:MEAS:CURR?` | `:READ?` |
| Keysight B2900 | `:MEAS:VOLT?` | `:MEAS:CURR?` | `:MEAS?` |

---

## Programming Examples

### Basic Voltage Source with Current Measurement

```scpi
# Keithley 2400/2450 example
*RST                                 # Reset
:SOUR:FUNC VOLT                      # Source voltage
:SOUR:VOLT:MODE FIX                  # Fixed mode
:SOUR:VOLT:RANG 20                   # 20V range
:SOUR:VOLT:LEV 5.0                   # Set 5V
:SENS:FUNC "CURR"                    # Measure current
:SENS:CURR:PROT 0.1                  # 100mA compliance
:SENS:CURR:RANG:AUTO ON              # Auto-range
:OUTP ON                             # Enable output
:READ?                               # Read measurement
:OUTP OFF                            # Disable output
```

### Current Source with Voltage Measurement

```scpi
# Keithley 2400/2450 example
*RST
:SOUR:FUNC CURR                      # Source current
:SOUR:CURR:MODE FIX                  # Fixed mode
:SOUR:CURR:RANG 0.1                  # 100mA range
:SOUR:CURR:LEV 0.010                 # Set 10mA
:SENS:FUNC "VOLT"                    # Measure voltage
:SENS:VOLT:PROT 10                   # 10V compliance
:SENS:VOLT:RANG:AUTO ON              # Auto-range
:OUTP ON                             # Enable output
:READ?                               # Read measurement
:OUTP OFF                            # Disable output
```

### I-V Sweep

```scpi
# Keithley 2450 example - Voltage sweep, measure current
*RST
:SOUR:FUNC VOLT
:SOUR:VOLT:MODE SWE                  # Sweep mode
:SOUR:VOLT:STAR 0                    # Start at 0V
:SOUR:VOLT:STOP 10                   # Stop at 10V
:SOUR:VOLT:POIN 101                  # 101 points
:SENS:FUNC "CURR"
:SENS:CURR:PROT 0.1                  # 100mA compliance
:TRIG:COUN 101                       # 101 triggers
:OUTP ON
:INIT                                # Start sweep
*WAI                                 # Wait for completion
:TRAC:DATA? 1, 101, "defbuffer1", SOUR, READ   # Get data
:OUTP OFF
```

### Keysight B2900 Example

```scpi
# B2902A dual channel example
*RST
:SOUR1:FUNC:MODE VOLT                # Ch1 source voltage
:SOUR1:VOLT 3.3                      # 3.3V
:SENS1:CURR:PROT 0.5                 # 500mA compliance
:OUTP1 ON                            # Enable Ch1

:SOUR2:FUNC:MODE CURR                # Ch2 source current
:SOUR2:CURR 0.001                    # 1mA
:SENS2:VOLT:PROT 5                   # 5V compliance
:OUTP2 ON                            # Enable Ch2

:MEAS:CURR? (@1)                     # Measure Ch1 current
:MEAS:VOLT? (@2)                     # Measure Ch2 voltage

:OUTP1 OFF
:OUTP2 OFF
```

---

## TSP vs SCPI (Keithley 2600 Series)

The Keithley 2600B series uses TSP (Test Script Processor) by default, which is Lua-based.

### TSP Examples (NOT SCPI)

```lua
-- TSP example for 2600B series
reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.levelv = 5.0
smua.source.limiti = 0.1
smua.measure.nplc = 1
smua.source.output = smua.OUTPUT_ON
reading = smua.measure.i()
smua.source.output = smua.OUTPUT_OFF
```

### 2400 Emulation Mode

The 2600 series can emulate 2400 series SCPI commands, but with limited features:

```scpi
-- Load emulation script first, then use SCPI
:SOUR:FUNC VOLT
:SOUR:VOLT 5.0
:SENS:CURR:PROT 0.1
:OUTP ON
:READ?
:OUTP OFF
```

Note: TSP is preferred for 2600 series as it has full feature access.

---

## Command Abstraction Summary

### Abstract Driver Interface

```typescript
interface SmuDriver {
  // Identification
  getIdentification(): Promise<string>;
  reset(): Promise<void>;

  // Output control
  enableOutput(channel?: number): Promise<void>;
  disableOutput(channel?: number): Promise<void>;
  isOutputEnabled(channel?: number): Promise<boolean>;

  // Source configuration
  setSourceFunction(func: 'voltage' | 'current', channel?: number): Promise<void>;
  getSourceFunction(channel?: number): Promise<'voltage' | 'current'>;

  // Voltage source
  setVoltage(voltage: number, channel?: number): Promise<void>;
  getVoltage(channel?: number): Promise<number>;
  setVoltageRange(range: number | 'auto', channel?: number): Promise<void>;

  // Current source
  setCurrent(current: number, channel?: number): Promise<void>;
  getCurrent(channel?: number): Promise<number>;
  setCurrentRange(range: number | 'auto', channel?: number): Promise<void>;

  // Compliance / limits
  setCurrentLimit(limit: number, channel?: number): Promise<void>;
  setVoltageLimit(limit: number, channel?: number): Promise<void>;
  isComplianceTripped(channel?: number): Promise<boolean>;

  // Measurements
  measureVoltage(channel?: number): Promise<number>;
  measureCurrent(channel?: number): Promise<number>;
  measureResistance(channel?: number): Promise<number>;
  measureAll(channel?: number): Promise<{voltage: number, current: number}>;

  // Integration time
  setNplc(nplc: number, channel?: number): Promise<void>;
  getNplc(channel?: number): Promise<number>;

  // Remote sense
  setRemoteSense(enabled: boolean, channel?: number): Promise<void>;
  getRemoteSense(channel?: number): Promise<boolean>;

  // Sweep
  configureSweep(params: SweepParams, channel?: number): Promise<void>;
  executeSweep(channel?: number): Promise<SweepResult>;
}

interface SweepParams {
  function: 'voltage' | 'current';
  start: number;
  stop: number;
  points: number;
  spacing?: 'linear' | 'log';
  compliance?: number;
  delay?: number;
}

interface SweepResult {
  sourceValues: number[];
  measuredValues: number[];
  timestamps?: number[];
}
```

### Vendor Command Translation Table

| Method | Keithley 2400 | Keithley 2450 | Keysight B2900 |
|--------|---------------|---------------|----------------|
| `enableOutput()` | `:OUTP ON` | `:OUTP ON` | `:OUTP1 ON` |
| `setSourceFunction('voltage')` | `:SOUR:FUNC VOLT` | `:SOUR:FUNC VOLT` | `:SOUR:FUNC:MODE VOLT` |
| `setVoltage(5)` | `:SOUR:VOLT 5` | `:SOUR:VOLT 5` | `:SOUR:VOLT 5` |
| `setCurrentLimit(0.1)` | `:SENS:CURR:PROT 0.1` | `:SOUR:VOLT:ILIM 0.1` | `:SENS:CURR:PROT 0.1` |
| `measureCurrent()` | `:MEAS:CURR?` | `:MEAS:CURR?` | `:MEAS:CURR?` |
| `measureAll()` | `:READ?` | `:READ?` | `:MEAS?` |
| `setNplc(1)` | `:SENS:CURR:NPLC 1` | `:SENS:CURR:NPLC 1` | `:SENS:CURR:NPLC 1` |
| `setRemoteSense(true)` | `:SYST:RSEN ON` | `:SYST:RSEN ON` | `:SENS:REM ON` |

---

## Resources

### Official Documentation

| Vendor | Series | Documentation |
|--------|--------|---------------|
| Keithley | 2400 | [User's Manual (PDF)](https://download.tek.com/manual/2400S-900-01_K-Sep2011_User.pdf) |
| Keithley | 2450 | [Reference Manual (PDF)](https://download.tek.com/manual/2450-901-01_D_May_2015_Ref.pdf) |
| Keithley | 2461 | [Reference Manual (PDF)](https://download.tek.com/manual/2461-901-01C_Oct_2019_Ref.pdf) |
| Keithley | 2470 | [Reference Manual (PDF)](https://download.tek.com/manual/2470-901-01B_Sept_2019_Ref.pdf) |
| Keithley | 2600B | [Reference Manual](https://www.tek.com/en/keithley-source-measure-units/series-2600b-system-sourcemeter) |
| Keysight | B2900A | [SCPI Command Reference (PDF)](https://www.keysight.com/us/en/assets/9018-01705/programming-guides/9018-01705.pdf) |
| Keysight | B2900B | [SCPI Command Reference (PDF)](https://www.keysight.com/us/en/assets/9921-01285/programming-guides/B2900B-BL-Series-Precision-Source-Measure-Unit-SCPI-Command-Reference.pdf) |
| Keysight | N6700 | [Programmer's Reference (PDF)](https://www.keysight.com/us/en/assets/9018-03617/programming-guides/9018-03617.pdf) |
| R&S | NGU | [User Manual (PDF)](https://www.batronix.com/files/Rohde-&-Schwarz/SMU/NGU_UserManual_EN.pdf) |
| ITECH | IT2800 | [ManualsLib](https://www.manualslib.com/manual/3686542/Itech-It2800-Series.html) |

### Migration Guides

| From | To | Guide |
|------|-----|-------|
| Keithley 2400 | Keithley 2461 | [Migration Guide (PDF)](https://www.calplus.de/fileuploader/download/download/?d=0&file=custom/upload/keithley-2461-emulation-and-migration-guide-077162100-sept-2019.pdf) |
| SCPI | TSP | [Transition Guide](https://www.tek.com/en/documents/application-note/how-to-transition-code-to-tsp-from-scpi) |
