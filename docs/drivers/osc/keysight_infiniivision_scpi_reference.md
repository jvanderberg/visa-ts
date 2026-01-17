# Keysight InfiniiVision Oscilloscope SCPI Command Reference

> Extracted from Keysight InfiniiVision 3000/4000/6000 X-Series Programmer's Guide
> Applicable models: DSOX/MSOX 3000A/G, 4000A, 6000A series, EDUX/DSOX 1000 series

## Model Specifications

### 1000 X-Series (Entry Level)

| Model | Bandwidth | Channels | Sample Rate | Memory | Notes |
|-------|-----------|----------|-------------|--------|-------|
| EDUX1052A | 50 MHz | 2 | 1 GSa/s | 1 Mpts | Entry Keysight |
| DSOX1102A | 100 MHz | 2 | 2 GSa/s | 1 Mpts | |
| DSOX1204A | 70 MHz | 4 | 2 GSa/s | 1 Mpts | |
| DSOX1204G | 70 MHz | 4 | 2 GSa/s | 1 Mpts | With WaveGen |

### 3000 X-Series (Mainstream)

| Model | Bandwidth | Channels | Sample Rate | Memory | Notes |
|-------|-----------|----------|-------------|--------|-------|
| DSOX3012A | 100 MHz | 2 | 4 GSa/s | 4 Mpts | |
| DSOX3014A | 100 MHz | 4 | 4 GSa/s | 4 Mpts | |
| DSOX3024A | 200 MHz | 4 | 4 GSa/s | 4 Mpts | |
| DSOX3034A | 350 MHz | 4 | 4 GSa/s | 4 Mpts | |
| DSOX3054A | 500 MHz | 4 | 4 GSa/s | 4 Mpts | |
| MSOX3014A | 100 MHz | 4+16 | 4 GSa/s | 4 Mpts | MSO |
| MSOX3054A | 500 MHz | 4+16 | 4 GSa/s | 4 Mpts | MSO |
| DSOX3104A | 1 GHz | 4 | 5 GSa/s | 4 Mpts | |

### 4000 X-Series (Performance)

| Model | Bandwidth | Channels | Sample Rate | Memory | Notes |
|-------|-----------|----------|-------------|--------|-------|
| DSOX4024A | 200 MHz | 4 | 5 GSa/s | 4 Mpts | |
| DSOX4034A | 350 MHz | 4 | 5 GSa/s | 4 Mpts | |
| DSOX4054A | 500 MHz | 4 | 5 GSa/s | 4 Mpts | |
| DSOX4104A | 1 GHz | 4 | 5 GSa/s | 4 Mpts | |
| DSOX4154A | 1.5 GHz | 4 | 5 GSa/s | 4 Mpts | |
| MSOX4154A | 1.5 GHz | 4+16 | 5 GSa/s | 4 Mpts | MSO |

### 6000 X-Series (High Performance)

| Model | Bandwidth | Channels | Sample Rate | Memory | Notes |
|-------|-----------|----------|-------------|--------|-------|
| DSOX6002A | 1 GHz | 2 | 20 GSa/s | 4 Mpts | |
| DSOX6004A | 1 GHz | 4 | 20 GSa/s | 4 Mpts | |
| MSOX6004A | 1 GHz | 4+16 | 20 GSa/s | 4 Mpts | MSO |

---

## Connection Methods

| Method | Port/Interface | Notes |
|--------|----------------|-------|
| USB-TMC | USB | Requires VISA driver |
| LAN (VXI-11) | Port 111 | Via VISA |
| LAN (HiSLIP) | Port 4880 | High-speed, recommended |
| LAN (Socket) | Port 5025 | Raw SCPI |
| GPIB | — | Standard on most models |

**USB Vendor ID**: 0x0957 (Keysight/Agilent)

---

## Command Notation

- Commands are case-insensitive
- Short form: uppercase portion required (e.g., `CHANnel` → `CHAN`)
- `<n>` = channel number (1, 2, 3, or 4)
- `{ON|OFF}` = boolean (also accepts 1|0)
- Commands terminated with LF (`\n`) or CR+LF

---

## IEEE 488.2 Common Commands

```
*IDN?                    → Query identification
                           Returns: Keysight Technologies,DSOX3054A,<serial>,<fw_version>

*RST                     → Reset to default state

*CLS                     → Clear status registers

*ESE <mask>              → Set event status enable register
*ESE?                    → Query event status enable register

*ESR?                    → Query event status register

*OPC                     → Set OPC bit when operations complete
*OPC?                    → Query operation complete (returns 1)

*SRE <mask>              → Set service request enable register
*SRE?                    → Query service request enable register

*STB?                    → Query status byte

*TRG                     → Force trigger

*TST?                    → Self-test (0 = pass)

*WAI                     → Wait for operations complete

*SAV <0-9>               → Save setup to internal memory
*RCL <0-9>               → Recall setup from internal memory

*LRN?                    → Learn query (returns complete setup string)
```

---

## Run Control

### Start/Stop Acquisition

```
:RUN                     → Start continuous acquisition

:STOP                    → Stop acquisition

:SINGle                  → Single acquisition (arm and wait for trigger)

:DIGitize [<source>]     → Acquire data from specified source
                           Source: CHANnel<n>, FUNCtion, MATH, etc.
```

### Acquisition Status

```
:AER?                    → Acquisition event register (bit 0 = complete)

:OPERegister:CONDition?  → Operation status condition register

:ADER?                   → Acquisition done event register
```

---

## Channel Configuration

### Channel Display

```
:CHANnel<n>:DISPlay {ON|OFF|1|0}
                         → Show/hide channel

:CHANnel<n>:DISPlay?     → Query display state
                           Returns: 0 or 1
```

### Vertical Scale

```
:CHANnel<n>:SCALe <volts_per_div>
                         → Set vertical scale (V/div)

:CHANnel<n>:SCALe?       → Query vertical scale
                           Returns: scale in volts
```

**Examples:**
```
:CHAN1:SCAL 1.0          → 1 V/div
:CHAN1:SCAL 500E-3       → 500 mV/div
:CHAN1:SCAL 0.1          → 100 mV/div
```

### Vertical Offset

```
:CHANnel<n>:OFFSet <volts>
                         → Set vertical offset

:CHANnel<n>:OFFSet?      → Query offset
```

### Vertical Range (Alternative to Scale)

```
:CHANnel<n>:RANGe <volts>
                         → Set full-scale vertical range (8 divisions)

:CHANnel<n>:RANGe?       → Query range
```

### Coupling

```
:CHANnel<n>:COUPling {AC|DC}
                         → Set input coupling

:CHANnel<n>:COUPling?    → Query coupling
                           Returns: AC or DC
```

### Input Impedance

```
:CHANnel<n>:IMPedance {ONEMeg|FIFTy}
                         → Set input impedance (1MΩ or 50Ω)

:CHANnel<n>:IMPedance?   → Query impedance
```

### Probe Attenuation

```
:CHANnel<n>:PROBe <ratio>
                         → Set probe attenuation ratio

:CHANnel<n>:PROBe?       → Query probe ratio
```

**Values:** 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000

### Bandwidth Limit

```
:CHANnel<n>:BWLimit {ON|OFF|1|0}
                         → Enable/disable 25 MHz bandwidth limit

:CHANnel<n>:BWLimit?     → Query bandwidth limit state
```

### Invert

```
:CHANnel<n>:INVert {ON|OFF|1|0}
                         → Invert channel display

:CHANnel<n>:INVert?      → Query invert state
```

### Label

```
:CHANnel<n>:LABel "<string>"
                         → Set channel label (max 10 characters)

:CHANnel<n>:LABel?       → Query label

:CHANnel<n>:LABel:STATe {ON|OFF}
                         → Show/hide label
```

---

## Timebase Configuration

### Time Scale

```
:TIMebase:SCALe <seconds_per_div>
                         → Set horizontal scale (s/div)

:TIMebase:SCALe?         → Query time scale
```

**Examples:**
```
:TIM:SCAL 1E-6           → 1 µs/div
:TIM:SCAL 0.001          → 1 ms/div
:TIM:SCAL 100E-9         → 100 ns/div
```

### Time Range (Alternative)

```
:TIMebase:RANGe <seconds>
                         → Set full time range (10 divisions)

:TIMebase:RANGe?         → Query time range
```

### Horizontal Position/Delay

```
:TIMebase:POSition <seconds>
                         → Set trigger position (time from trigger to center)

:TIMebase:POSition?      → Query position
```

**Note:** Negative values move trigger point to the right of center (more pre-trigger).

### Reference Position

```
:TIMebase:REFerence {LEFT|CENTer|RIGHt}
                         → Set reference position for delay

:TIMebase:REFerence?     → Query reference
```

### Timebase Mode

```
:TIMebase:MODE {MAIN|WINDow|XY|ROLL}
                         → Set timebase mode

:TIMebase:MODE?          → Query mode
```

### Vernier (Fine Adjustment)

```
:TIMebase:VERNier {ON|OFF}
                         → Enable fine scale adjustment

:TIMebase:VERNier?       → Query vernier state
```

---

## Acquisition Settings

### Acquisition Type/Mode

```
:ACQuire:TYPE {NORMal|AVERage|HRESolution|PEAK}
                         → Set acquisition type
                           NORMal: Standard sampling
                           AVERage: Averaging mode
                           HRESolution: High resolution (smoothing)
                           PEAK: Peak detect (glitch capture)

:ACQuire:TYPE?           → Query acquisition type
```

### Average Count

```
:ACQuire:COUNt <count>   → Set number of averages (2 to 65536, power of 2)

:ACQuire:COUNt?          → Query average count
```

### Sample Rate

```
:ACQuire:SRATe?          → Query sample rate (read-only)
                           Returns: sample rate in Sa/s
```

### Points (Memory Depth)

```
:ACQuire:POINts <points> → Set acquisition memory depth

:ACQuire:POINts?         → Query memory depth
```

**Values:** AUTO, 100, 250, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000, 4000000, 8000000

### Segmented Memory

```
:ACQuire:SEGMented:COUNt <segments>
                         → Set number of segments

:ACQuire:SEGMented:COUNt?
                         → Query segment count

:ACQuire:SEGMented:INDex <segment>
                         → Select segment for display/readout

:ACQuire:SEGMented:INDex?
                         → Query current segment index
```

### Completion Criteria

```
:ACQuire:COMPlete <percent>
                         → Set acquisition completion threshold (0-100)

:ACQuire:COMPlete?       → Query completion percentage
```

---

## Trigger System

### Trigger Mode

```
:TRIGger:SWEep {AUTO|NORMal|SINGle}
                         → Set trigger mode
                           AUTO: Automatic trigger if no signal
                           NORMal: Wait for valid trigger
                           SINGle: Single trigger then stop

:TRIGger:SWEep?          → Query sweep mode
```

### Trigger Type

```
:TRIGger:MODE {EDGE|GLITch|PATTern|TV|DELay|EBURst|OR|RUNT|SHOLd|TRANsition|SBUS<n>}
                         → Set trigger type

:TRIGger:MODE?           → Query trigger type
```

### Edge Trigger

```
:TRIGger:EDGE:SOURce {CHANnel<n>|EXTernal|LINE|WGEN}
                         → Set edge trigger source

:TRIGger:EDGE:SOURce?    → Query trigger source

:TRIGger:EDGE:SLOPe {POSitive|NEGative|EITHer|ALTernate}
                         → Set trigger slope

:TRIGger:EDGE:SLOPe?     → Query slope
```

### Trigger Level

```
:TRIGger:EDGE:LEVel <voltage>
                         → Set trigger level

:TRIGger:EDGE:LEVel?     → Query trigger level

:TRIGger:LEVel <voltage>[,<source>]
                         → Set trigger level (with optional source)

:TRIGger:LEVel? [<source>]
                         → Query trigger level
```

### Trigger Level Auto

```
:TRIGger:LEVel:ASETup    → Auto-set trigger level to 50% of signal
```

### Trigger Coupling

```
:TRIGger:EDGE:COUPle {AC|DC|LFReject}
                         → Set trigger coupling
                           AC: Blocks DC, passes >10Hz
                           DC: All frequencies
                           LFReject: Blocks <50kHz

:TRIGger:EDGE:COUPle?    → Query coupling
```

### Trigger Holdoff

```
:TRIGger:HOLDoff <seconds>
                         → Set holdoff time (60ns to 10s)

:TRIGger:HOLDoff?        → Query holdoff
```

### High Frequency Reject

```
:TRIGger:HFReject {ON|OFF}
                         → Enable/disable HF reject filter

:TRIGger:HFReject?       → Query HF reject state
```

### Noise Reject

```
:TRIGger:NREJect {ON|OFF}
                         → Enable/disable noise reject

:TRIGger:NREJect?        → Query noise reject state
```

### Force Trigger

```
:TRIGger:FORCe           → Force a trigger event
```

### Trigger Status

```
:TER?                    → Trigger event register (bit 0 = triggered)
```

---

## Pulse/Glitch Trigger

```
:TRIGger:GLITch:SOURce {CHANnel<n>}
                         → Set glitch trigger source

:TRIGger:GLITch:POLarity {POSitive|NEGative}
                         → Set polarity

:TRIGger:GLITch:QUALifier {LESSthan|GREaterthan|RANGe}
                         → Set glitch qualifier

:TRIGger:GLITch:LESSthan <seconds>
                         → Set "less than" time

:TRIGger:GLITch:GREaterthan <seconds>
                         → Set "greater than" time

:TRIGger:GLITch:RANGe <min>,<max>
                         → Set time range
```

---

## Measurements

### Measurement Source

```
:MEASure:SOURce {CHANnel<n>|FUNCtion|MATH|WMEMory<n>}
                         → Set measurement source

:MEASure:SOURce?         → Query source
```

### Clear Measurements

```
:MEASure:CLEar           → Clear all measurements from display
```

### Frequency

```
:MEASure:FREQuency [<source>]
                         → Add frequency measurement

:MEASure:FREQuency? [<source>]
                         → Query frequency
                           Returns: frequency in Hz
```

### Period

```
:MEASure:PERiod [<source>]
                         → Add period measurement

:MEASure:PERiod? [<source>]
                         → Query period
                           Returns: period in seconds
```

### Voltage Measurements

```
:MEASure:VPP [<source>]  → Peak-to-peak voltage
:MEASure:VPP? [<source>] → Query Vpp

:MEASure:VMAX [<source>] → Maximum voltage
:MEASure:VMAX? [<source>]

:MEASure:VMIN [<source>] → Minimum voltage
:MEASure:VMIN? [<source>]

:MEASure:VAMPlitude [<source>]
                         → Amplitude (Vtop - Vbase)
:MEASure:VAMPlitude? [<source>]

:MEASure:VTOP [<source>] → Top voltage (high level)
:MEASure:VTOP? [<source>]

:MEASure:VBASe [<source>] → Base voltage (low level)
:MEASure:VBASe? [<source>]

:MEASure:VAVerage [<source>]
                         → Average voltage
:MEASure:VAVerage? [<source>]

:MEASure:VRMS [<source>] → RMS voltage
:MEASure:VRMS? [<source>]
```

### Time Measurements

```
:MEASure:RISetime [<source>]
                         → Rise time (10%-90%)
:MEASure:RISetime? [<source>]

:MEASure:FALLtime [<source>]
                         → Fall time (90%-10%)
:MEASure:FALLtime? [<source>]

:MEASure:PWIDth [<source>]
                         → Positive pulse width
:MEASure:PWIDth? [<source>]

:MEASure:NWIDth [<source>]
                         → Negative pulse width
:MEASure:NWIDth? [<source>]

:MEASure:DUTYcycle [<source>]
                         → Duty cycle
:MEASure:DUTYcycle? [<source>]
```

### Overshoot/Preshoot

```
:MEASure:POVershoot [<source>]
                         → Positive overshoot %
:MEASure:POVershoot? [<source>]

:MEASure:PREShoot [<source>]
                         → Preshoot %
:MEASure:PREShoot? [<source>]
```

### Counter

```
:MEASure:COUNter:TOTalize {ON|OFF}
                         → Enable totalize counter

:MEASure:COUNter:TOTalize:VALue?
                         → Query totalize count
```

### All Measurements

```
:MEASure:RESults?        → Query all active measurement results
```

---

## Waveform Data Transfer

### Waveform Source

```
:WAVeform:SOURce {CHANnel<n>|FUNCtion|MATH|WMEMory<n>|SBUS<n>|POD<n>}
                         → Set waveform source

:WAVeform:SOURce?        → Query source
```

### Data Format

```
:WAVeform:FORMat {WORD|BYTE|ASCii}
                         → Set data format
                           WORD: 16-bit signed integers
                           BYTE: 8-bit unsigned integers
                           ASCii: Comma-separated values

:WAVeform:FORMat?        → Query format
```

### Byte Order

```
:WAVeform:BYTeorder {LSBFirst|MSBFirst}
                         → Set byte order for WORD format

:WAVeform:BYTeorder?     → Query byte order
```

### Data Points

```
:WAVeform:POINts {<points>|MAXimum}
                         → Set number of points to transfer

:WAVeform:POINts?        → Query points setting

:WAVeform:POINts:MODE {NORMal|MAXimum|RAW}
                         → Set points mode
                           NORMal: Screen points (1000)
                           MAXimum: All acquired points
                           RAW: Raw acquisition memory

:WAVeform:POINts:MODE?   → Query mode
```

### Waveform Preamble

```
:WAVeform:PREamble?      → Query waveform preamble
                           Returns 10 comma-separated values:
                           <format>,<type>,<points>,<count>,
                           <xinc>,<xorigin>,<xref>,
                           <yinc>,<yorigin>,<yref>
```

**Preamble Fields:**
| Index | Field | Description |
|-------|-------|-------------|
| 0 | format | 0=BYTE, 1=WORD, 4=ASCII |
| 1 | type | 0=Normal, 1=Peak, 2=Average, 3=HRes |
| 2 | points | Number of data points |
| 3 | count | Always 1 |
| 4 | xinc | Time increment between points |
| 5 | xorigin | Time of first point |
| 6 | xref | X reference (always 0) |
| 7 | yinc | Voltage per bit |
| 8 | yorigin | Y origin offset |
| 9 | yref | Y reference (center code) |

### Get Waveform Data

```
:WAVeform:DATA?          → Query waveform data
                           Returns: IEEE 488.2 binary block
```

### Conversion Formulas

```
Time:    time[i] = xorigin + (i * xinc)

Voltage (BYTE): voltage[i] = ((data[i] - yref) * yinc) + yorigin
Voltage (WORD): voltage[i] = ((data[i] - yref) * yinc) + yorigin
```

---

## Math/Function

### Math Display

```
:FUNCtion:DISPlay {ON|OFF}
                         → Show/hide math waveform

:FUNCtion:DISPlay?       → Query display state
```

### Math Operation

```
:FUNCtion:OPERation {ADD|SUBTract|MULTiply|DIVide|FFT|DIFF|INTegrate|...}
                         → Set math operation

:FUNCtion:OPERation?     → Query operation
```

### Math Sources

```
:FUNCtion:SOURce1 {CHANnel<n>|FUNCtion|MATH}
                         → Set first source

:FUNCtion:SOURce2 {CHANnel<n>|FUNCtion|MATH}
                         → Set second source
```

### FFT

```
:FUNCtion:FFT:CENTer <frequency>
                         → Set FFT center frequency

:FUNCtion:FFT:SPAN <frequency>
                         → Set FFT frequency span

:FUNCtion:FFT:WINDow {RECTangular|HANNing|FLATtop|BHARris}
                         → Set FFT window function

:FUNCtion:FFT:VERTical:SCALe <dB_per_div>
                         → Set FFT vertical scale

:FUNCtion:FFT:VERTical:OFFSet <dB>
                         → Set FFT vertical offset
```

---

## Cursors

### Cursor Mode

```
:MARKer:MODE {OFF|WAVeform|MEASurement|MANual}
                         → Set cursor mode

:MARKer:MODE?            → Query cursor mode
```

### X Cursors (Time/Frequency)

```
:MARKer:X1Position <value>
                         → Set X1 cursor position

:MARKer:X1Position?      → Query X1 position

:MARKer:X2Position <value>
                         → Set X2 cursor position

:MARKer:X2Position?      → Query X2 position

:MARKer:XDELta?          → Query X delta (X2 - X1)

:MARKer:X1Y?             → Query Y value at X1
:MARKer:X2Y?             → Query Y value at X2
```

### Y Cursors (Voltage)

```
:MARKer:Y1Position <value>
                         → Set Y1 cursor position

:MARKer:Y2Position <value>
                         → Set Y2 cursor position

:MARKer:YDELta?          → Query Y delta (Y2 - Y1)
```

---

## Display Control

### Display Clear

```
:CDISplay                → Clear display
```

### Persistence

```
:DISPlay:PERSistence {MINimum|<time>|INFinite}
                         → Set persistence time

:DISPlay:PERSistence?    → Query persistence
```

### Graticule

```
:DISPlay:GRATicule {FULL|GRID|CROSshairs|FRAMe|NONE}
                         → Set graticule style

:DISPlay:GRATicule?      → Query graticule
```

### Intensity

```
:DISPlay:INTensity:WAVeform <percent>
                         → Set waveform intensity (0-100)

:DISPlay:INTensity:GRATicule <percent>
                         → Set graticule intensity
```

### Screen Data (Screenshot)

```
:DISPlay:DATA? {PNG|BMP|BMP8bit}
                         → Get screenshot image
                           Returns: IEEE 488.2 binary block
```

---

## Serial Decode (Protocol Analysis)

### Enable Decode

```
:SBUS<n>:DISPlay {ON|OFF}
                         → Show/hide serial bus decode

:SBUS<n>:MODE {I2C|SPI|UART|CAN|LIN|...}
                         → Set decode protocol
```

### I2C Configuration

```
:SBUS<n>:I2C:SOURce:CLOCk CHANnel<n>
                         → Set SCL source

:SBUS<n>:I2C:SOURce:DATA CHANnel<n>
                         → Set SDA source
```

### SPI Configuration

```
:SBUS<n>:SPI:SOURce:CLOCk CHANnel<n>
:SBUS<n>:SPI:SOURce:MOSI CHANnel<n>
:SBUS<n>:SPI:SOURce:MISO CHANnel<n>
:SBUS<n>:SPI:SOURce:FRAMe CHANnel<n>
```

### UART Configuration

```
:SBUS<n>:UART:SOURce:TX CHANnel<n>
:SBUS<n>:UART:SOURce:RX CHANnel<n>
:SBUS<n>:UART:BAUD <rate>
:SBUS<n>:UART:BITs {5|6|7|8|9}
:SBUS<n>:UART:PARity {NONE|ODD|EVEN}
```

---

## WaveGen (Built-in AWG)

For models with WaveGen option:

### WaveGen Output

```
:WGEN:OUTPut {ON|OFF}    → Enable/disable WaveGen output

:WGEN:OUTPut?            → Query output state
```

### Waveform Type

```
:WGEN:FUNCtion {SINusoid|SQUare|RAMP|PULSe|NOISe|DC|SINC|...}
                         → Set waveform type

:WGEN:FUNCtion?          → Query type
```

### Frequency

```
:WGEN:FREQuency <frequency>
                         → Set frequency (Hz)

:WGEN:FREQuency?         → Query frequency
```

### Amplitude

```
:WGEN:VOLTage <vpp>      → Set amplitude (Vpp)

:WGEN:VOLTage?           → Query amplitude

:WGEN:VOLTage:OFFSet <volts>
                         → Set DC offset

:WGEN:VOLTage:HIGH <volts>
                         → Set high level

:WGEN:VOLTage:LOW <volts>
                         → Set low level
```

---

## System Commands

### Error Query

```
:SYSTem:ERRor?           → Query error
                           Returns: <code>,"<message>"
                           +0,"No error" when empty
```

### Setup Save/Recall

```
:SYSTem:SETup?           → Query complete setup (binary block)

:SYSTem:SETup <data>     → Load setup from binary block

:SAVE:SETup <slot>       → Save to internal slot (0-9)
:RECall:SETup <slot>     → Recall from internal slot
```

### Date/Time

```
:SYSTem:DATE "<YYYY,MM,DD>"
                         → Set date

:SYSTem:TIME "<HH,MM,SS>"
                         → Set time
```

### Lock

```
:SYSTem:LOCK {ON|OFF}    → Lock/unlock front panel
```

### Preset

```
:SYSTem:PRESet           → Preset to default (like *RST)
```

---

## Status System

### Status Byte (*STB?)

| Bit | Value | Name | Description |
|-----|-------|------|-------------|
| 0 | 1 | TRG | Trigger occurred |
| 2 | 4 | ERAV | Error available |
| 3 | 8 | QUES | Questionable status summary |
| 4 | 16 | MAV | Message available |
| 5 | 32 | ESB | Standard event status summary |
| 6 | 64 | RQS/MSS | Request for service |
| 7 | 128 | OPER | Operation status summary |

### Operation Status Register

```
:OPERegister:CONDition?  → Query operation condition

:OPERegister[:EVENt]?    → Query and clear operation event

:OPERegister:ENABle <mask>
                         → Set enable mask
```

---

## Programming Examples

### Basic Acquisition

```
*RST                     ; Reset to defaults
:CHAN1:DISP ON           ; Enable channel 1
:CHAN1:SCAL 1.0          ; 1 V/div
:CHAN1:OFFS 0            ; No offset
:TIM:SCAL 1E-3           ; 1 ms/div
:TRIG:EDGE:SOUR CHAN1    ; Trigger on CH1
:TRIG:EDGE:LEV 0.5       ; 500 mV trigger level
:TRIG:EDGE:SLOP POS      ; Rising edge
:SING                    ; Single acquisition
*OPC?                    ; Wait for completion
```

### Multi-Channel Setup

```
*RST
:CHAN1:DISP ON
:CHAN1:SCAL 0.5          ; CH1: 500 mV/div
:CHAN2:DISP ON
:CHAN2:SCAL 1.0          ; CH2: 1 V/div
:CHAN3:DISP ON
:CHAN3:SCAL 2.0          ; CH3: 2 V/div
:TIM:SCAL 100E-6         ; 100 µs/div
:RUN
```

### Measurements

```
:MEAS:SOUR CHAN1         ; Set measurement source
:MEAS:FREQ?              ; Measure frequency
:MEAS:VPP?               ; Measure peak-to-peak
:MEAS:RISE?              ; Measure rise time
:MEAS:DUTY?              ; Measure duty cycle
```

### Waveform Data Transfer

```
:WAV:SOUR CHAN1          ; Source: Channel 1
:WAV:FORM WORD           ; 16-bit data
:WAV:POIN:MODE MAX       ; All points
:WAV:POIN 1000           ; Request 1000 points
:WAV:PRE?                ; Get preamble
:WAV:DATA?               ; Get waveform data
```

### Screenshot

```
:DISP:DATA? PNG          ; Get PNG screenshot
; Returns binary block: #9XXXXXXXXX<data>
```

### FFT Analysis

```
:FUNC:DISP ON            ; Show math
:FUNC:OPER FFT           ; FFT mode
:FUNC:SOUR1 CHAN1        ; Source: CH1
:FUNC:FFT:WIND HANN      ; Hanning window
:FUNC:FFT:CENT 1E6       ; Center: 1 MHz
:FUNC:FFT:SPAN 2E6       ; Span: 2 MHz
```

### UART Decode

```
:SBUS1:MODE UART         ; UART decode
:SBUS1:UART:SOUR:TX CHAN1 ; TX on CH1
:SBUS1:UART:SOUR:RX CHAN2 ; RX on CH2
:SBUS1:UART:BAUD 115200  ; 115200 baud
:SBUS1:UART:BITS 8       ; 8 data bits
:SBUS1:UART:PAR NONE     ; No parity
:SBUS1:DISP ON           ; Show decode
```

---

## Notes

1. **Command Termination**: LF (`\n`) or CR+LF. Responses terminated with LF.

2. **Digitize Command**: `:DIGitize` acquires data and waits for completion. More reliable than `:RUN` for programmatic capture.

3. **Waveform Points**: Use `:WAV:POIN:MODE RAW` for full memory depth, but be aware of transfer time.

4. **Measurements**: Query returns `9.99999E+37` if measurement cannot be made.

5. **Binary Blocks**: Format is `#<n><length><data>` where n is number of digits in length.

6. **HiSLIP vs VXI-11**: HiSLIP (port 4880) is faster and recommended for modern use.

7. **Segmented Memory**: Allows capturing multiple trigger events. Each segment is a separate acquisition.

8. **Bandwidth Limit**: 25 MHz filter, useful for reducing noise on lower-frequency signals.

9. **Probe Compensation**: After changing probe ratio, adjust probe compensation for accurate measurements.

10. **MSO Channels**: Digital channels (POD1, POD2) accessed separately from analog channels.
