# Rohde & Schwarz RTx Series Oscilloscope SCPI Command Reference

> Extracted from R&S RTB2000, RTM3000, and RTO2000 Series User Manuals
> Applicable models: RTB2002/2004, RTM3002/3004, RTO2002/2004/2012/2014/2022/2024/2044

## Model Specifications

### RTB2000 Series (Entry Level)

| Model | Bandwidth | Channels | Sample Rate | Memory | Notes |
|-------|-----------|----------|-------------|--------|-------|
| RTB2002 | 70/100/200/300 MHz | 2 | 2.5 GSa/s | 10 Mpts | Entry R&S |
| RTB2004 | 70/100/200/300 MHz | 4 | 2.5 GSa/s | 10 Mpts | 4-channel |

### RTM3000 Series (Mid-Range)

| Model | Bandwidth | Channels | Sample Rate | Memory | Notes |
|-------|-----------|----------|-------------|--------|-------|
| RTM3002 | 100/200/350/500/1000 MHz | 2 | 5 GSa/s | 40 Mpts | |
| RTM3004 | 100/200/350/500/1000 MHz | 4 | 5 GSa/s | 40 Mpts | |

### RTO2000 Series (High Performance)

| Model | Bandwidth | Channels | Sample Rate | Memory | Notes |
|-------|-----------|----------|-------------|--------|-------|
| RTO2002 | 600 MHz-4 GHz | 2 | 10 GSa/s | 50 Mpts | |
| RTO2004 | 600 MHz-4 GHz | 4 | 10 GSa/s | 50 Mpts | |
| RTO2012 | 1-4 GHz | 2 | 10 GSa/s | 100 Mpts | |
| RTO2014 | 1-4 GHz | 4 | 10 GSa/s | 100 Mpts | |
| RTO2022 | 2-6 GHz | 2 | 20 GSa/s | 200 Mpts | |
| RTO2024 | 2-6 GHz | 4 | 20 GSa/s | 200 Mpts | |
| RTO2044 | 4-6 GHz | 4 | 20 GSa/s | 400 Mpts | |

---

## Connection Methods

| Method | Port/Interface | Notes |
|--------|----------------|-------|
| USB-TMC | USB | Requires VISA driver |
| LAN (VXI-11) | Port 111 | Via VISA |
| LAN (HiSLIP) | Port 4880 | High-speed, recommended |
| LAN (Socket) | Port 5025 | Raw SCPI |
| GPIB | — | Optional on most models |

**USB Vendor ID**: 0x0AAD (Rohde & Schwarz)

---

## Command Notation

- Commands are case-insensitive
- Short form: uppercase portion required (e.g., `CHANnel` → `CHAN`)
- `<n>` = channel number (1, 2, 3, or 4)
- `{ON|OFF}` = boolean (also accepts 1|0)
- Commands terminated with LF (`\n`)

---

## IEEE 488.2 Common Commands

```
*IDN?                    → Query identification
                           Returns: Rohde&Schwarz,RTM3004,<serial>,<fw_version>

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

*SAV <slot>              → Save setup to memory
*RCL <slot>              → Recall setup from memory

*OPT?                    → Query installed options
```

---

## Acquisition Control

### Run/Stop

```
RUN                      → Start continuous acquisition

RUNContinuous            → Same as RUN

RUNSingle                → Single acquisition (arm and wait)

STOP                     → Stop acquisition

SINGle                   → Single acquisition (alternative)
```

### Acquisition State

```
ACQuire:STATe?           → Query acquisition state
                           Returns: RUN, STOP, SINGLE, COMPLETE
```

### Force Trigger

```
TRIGger:FORCe            → Force a trigger event
```

---

## Acquisition Settings

### Acquisition Mode/Type

```
ACQuire:TYPE {NORMal|AVERage|ENVelope|PEAK}
                         → Set acquisition type
                           NORMal: Standard sampling
                           AVERage: Averaging mode
                           ENVelope: Min/max envelope
                           PEAK: Peak detect

ACQuire:TYPE?            → Query type
```

### Average Count

```
ACQuire:AVERage:COUNt <count>
                         → Set number of averages (2 to 65536)

ACQuire:AVERage:COUNt?   → Query count

ACQuire:AVERage:RESet    → Reset averaging
```

### High Resolution

```
ACQuire:HRESolution {AUTO|OFF}
                         → Enable/disable high resolution mode

ACQuire:HRESolution?     → Query state
```

### Memory Depth (Record Length)

```
ACQuire:POINts[:VALue] {AUTO|<points>}
                         → Set acquisition memory depth

ACQuire:POINts[:VALue]?  → Query memory depth
```

### Sample Rate

```
ACQuire:SRATe?           → Query current sample rate (read-only)
                           Returns: sample rate in Sa/s
```

### Segmented Memory

```
ACQuire:SEGMented:STATe {ON|OFF}
                         → Enable/disable segmented acquisition

ACQuire:SEGMented:COUNt <segments>
                         → Set number of segments

ACQuire:SEGMented:COUNt?
                         → Query segment count
```

---

## Timebase

### Time Scale

```
TIMebase:SCALe <seconds_per_div>
                         → Set horizontal scale (s/div)

TIMebase:SCALe?          → Query scale
```

**Examples:**
```
TIM:SCAL 1E-6            → 1 µs/div
TIM:SCAL 0.001           → 1 ms/div
TIM:SCAL 100E-9          → 100 ns/div
```

### Time Range (Alternative)

```
TIMebase:RANGe <seconds>
                         → Set total time range

TIMebase:RANGe?          → Query range
```

### Horizontal Position

```
TIMebase:POSition <seconds>
                         → Set horizontal position (trigger to reference)
                           Negative = pre-trigger

TIMebase:POSition?       → Query position
```

### Reference Position

```
TIMebase:REFerence <percent>
                         → Set reference position (0-100%)
                           0 = left edge
                           50 = center
                           100 = right edge

TIMebase:REFerence?      → Query reference
```

### Roll Mode

```
TIMebase:ROLL:ENABle {ON|OFF}
                         → Enable/disable roll mode

TIMebase:ROLL:ENABle?    → Query roll mode state
```

### Zoom

```
TIMebase:ZOOM:STATe {ON|OFF}
                         → Enable/disable zoom window

TIMebase:ZOOM:SCALe <seconds_per_div>
                         → Set zoom scale

TIMebase:ZOOM:POSition <seconds>
                         → Set zoom position
```

---

## Channel Configuration

### Channel State

```
CHANnel<n>:STATe {ON|OFF|1|0}
                         → Enable/disable channel

CHANnel<n>:STATe?        → Query state
```

### Vertical Scale

```
CHANnel<n>:SCALe <volts_per_div>
                         → Set vertical scale (V/div)

CHANnel<n>:SCALe?        → Query scale
```

### Vertical Position

```
CHANnel<n>:POSition <divisions>
                         → Set vertical position in divisions

CHANnel<n>:POSition?     → Query position
```

### Vertical Offset

```
CHANnel<n>:OFFSet <volts>
                         → Set vertical offset in volts

CHANnel<n>:OFFSet?       → Query offset
```

### Coupling

```
CHANnel<n>:COUPling {ACLimit|DCLimit|GND}
                         → Set coupling mode
                           ACLimit: AC coupling
                           DCLimit: DC coupling
                           GND: Ground

CHANnel<n>:COUPling?     → Query coupling
```

### Input Impedance

```
CHANnel<n>:IMPedance {FIFTy|ONEM}
                         → Set input impedance (50Ω or 1MΩ)

CHANnel<n>:IMPedance?    → Query impedance
```

### Bandwidth Limit

```
CHANnel<n>:BANDwidth {FULL|B20|B200|<frequency>}
                         → Set bandwidth limit
                           FULL: Full bandwidth
                           B20: 20 MHz limit
                           B200: 200 MHz limit

CHANnel<n>:BANDwidth?    → Query bandwidth
```

### Probe Configuration

```
PROBe<n>:SETup:ATTenuation:MANual <ratio>
                         → Set probe attenuation (1:1, 10:1, 100:1, etc.)

PROBe<n>:SETup:ATTenuation:MANual?
                         → Query attenuation

PROBe<n>:SETup:GAIN:MANual <gain>
                         → Set probe gain

PROBe<n>:ID:SWITch:STATe?
                         → Query if probe is detected
```

### Invert

```
CHANnel<n>:POLarity {NORMal|INVerted}
                         → Set polarity

CHANnel<n>:POLarity?     → Query polarity
```

### Label

```
CHANnel<n>:LABel[:STATe] {ON|OFF}
                         → Show/hide label

CHANnel<n>:LABel:TEXT "<string>"
                         → Set channel label

CHANnel<n>:LABel:TEXT?   → Query label
```

### Skew (Deskew)

```
CHANnel<n>:SKEW <seconds>
                         → Set skew compensation

CHANnel<n>:SKEW?         → Query skew
```

---

## Trigger System

### Trigger Type

```
TRIGger:A:TYPE {EDGE|WIDTh|TV|LINE|PATTern|RISetime|RUNT|SERial|...}
                         → Set trigger type

TRIGger:A:TYPE?          → Query type
```

### Trigger Mode

```
TRIGger:A:MODE {AUTO|NORMal}
                         → Set trigger mode
                           AUTO: Auto-trigger if no signal
                           NORMal: Wait for valid trigger

TRIGger:A:MODE?          → Query mode
```

### Edge Trigger Source

```
TRIGger:A:SOURce {CH1|CH2|CH3|CH4|EXT|LINE|...}
                         → Set trigger source

TRIGger:A:SOURce?        → Query source
```

### Edge Trigger Slope

```
TRIGger:A:EDGE:SLOPe {POSitive|NEGative|EITHer}
                         → Set trigger slope

TRIGger:A:EDGE:SLOPe?    → Query slope
```

### Trigger Level

```
TRIGger:A:LEVel<n>[:VALue] <voltage>
                         → Set trigger level for source n

TRIGger:A:LEVel<n>[:VALue]?
                         → Query trigger level
```

### Trigger Level Auto

```
TRIGger:A:FINDlevel      → Auto-set trigger level to 50%
```

### Trigger Coupling

```
TRIGger:A:EDGE:COUPling {AC|DC|LFReject|HFReject}
                         → Set trigger coupling

TRIGger:A:EDGE:COUPling?
                         → Query coupling
```

### Trigger Holdoff

```
TRIGger:A:HOLDoff:TIME <seconds>
                         → Set holdoff time

TRIGger:A:HOLDoff:TIME?  → Query holdoff

TRIGger:A:HOLDoff:MODE {TIME|EVENts}
                         → Set holdoff mode
```

### Hysteresis

```
TRIGger:A:HYSTeresis {AUTO|SMALl|MEDium|LARGe}
                         → Set trigger hysteresis

TRIGger:A:HYSTeresis?    → Query hysteresis
```

---

## Pulse Width Trigger

```
TRIGger:A:TYPE WIDTh     → Set to pulse width trigger

TRIGger:A:WIDTh:SOURce {CH1|CH2|CH3|CH4}
                         → Set source

TRIGger:A:WIDTh:POLarity {POSitive|NEGative}
                         → Set polarity

TRIGger:A:WIDTh:RANGe {WITHin|OUTSide|SHORter|LONGer}
                         → Set range condition

TRIGger:A:WIDTh:WIDTh <seconds>
                         → Set width value

TRIGger:A:WIDTh:DELTa <seconds>
                         → Set delta (for range mode)
```

---

## Measurements

### Measurement Enable

```
MEASurement<n>:STATe {ON|OFF}
                         → Enable/disable measurement slot n

MEASurement<n>:STATe?    → Query state
```

### Measurement Source

```
MEASurement<n>:SOURce {CH1|CH2|CH3|CH4|MATH<x>|REF<x>}
                         → Set measurement source

MEASurement<n>:SOURce?   → Query source
```

### Measurement Type

```
MEASurement<n>:MAIN <type>
                         → Set measurement type

MEASurement<n>:MAIN?     → Query type
```

**Measurement types:**
| Type | Description |
|------|-------------|
| FREQuency | Frequency |
| PERiod | Period |
| MEAN | Mean voltage |
| PEAK | Peak-to-peak |
| RMS | RMS voltage |
| HIGH | High level |
| LOW | Low level |
| AMPLitude | Amplitude |
| POSitive:PULSe:WIDTh | Positive pulse width |
| NEGative:PULSe:WIDTh | Negative pulse width |
| POSitive:DUTY | Positive duty cycle |
| NEGative:DUTY | Negative duty cycle |
| RISetime | Rise time |
| FALLtime | Fall time |
| POSitive:OVERshoot | Positive overshoot |
| NEGative:OVERshoot | Negative overshoot |

### Query Measurement Results

```
MEASurement<n>:RESult[:ACTual]?
                         → Query current measurement value

MEASurement<n>:RESult:AVG?
                         → Query average value

MEASurement<n>:RESult:MIN?
                         → Query minimum value

MEASurement<n>:RESult:MAX?
                         → Query maximum value

MEASurement<n>:RESult:STDEV?
                         → Query standard deviation

MEASurement<n>:RESult:COUNt?
                         → Query measurement count
```

### Quick Measurements

```
MEASurement:ALL          → Enable all basic measurements

MEASurement:AON          → Add all measurements on current channel
```

### Clear Measurements

```
MEASurement:CLEar:ALL    → Clear all measurements
```

---

## Waveform Data Transfer

### Data Source

```
CHANnel<n>:DATA:SOURce {CH1|CH2|CH3|CH4|MATH<x>|REF<x>}
                         → Set waveform data source

CHANnel<n>:DATA:SOURce?  → Query source
```

### Data Format

```
FORMat[:DATA] {ASCii|REAL|INT8|INT16,32}
                         → Set data format
                           ASCii: Comma-separated ASCII
                           REAL: 32-bit IEEE float
                           INT8: 8-bit signed integer
                           INT16,32: 16-bit with 32-bit header

FORMat[:DATA]?           → Query format
```

### Data Points

```
CHANnel<n>:DATA:POINts {DEFault|MAXimum|<points>}
                         → Set number of points to transfer

CHANnel<n>:DATA:POINts?  → Query points
```

### Waveform Header

```
CHANnel<n>:DATA:HEADer?  → Query waveform header
                           Returns: XSTART,XSTOP,SAMPLES,VALUES_PER_SAMPLE
```

### Waveform Envelope Data

```
CHANnel<n>:DATA:ENVelope:HEADer?
                         → Query envelope header

CHANnel<n>:DATA:ENVelope?
                         → Query envelope data (min/max pairs)
```

### Get Waveform Data

```
CHANnel<n>:DATA?         → Query waveform data
                           Returns: data in specified format
```

### Conversion Information

```
CHANnel<n>:DATA:XORigin?
                         → Time of first sample

CHANnel<n>:DATA:XINCrement?
                         → Time between samples

CHANnel<n>:DATA:YORigin?
                         → Voltage offset

CHANnel<n>:DATA:YINCrement?
                         → Voltage per bit

CHANnel<n>:DATA:YRESolution?
                         → Vertical resolution
```

---

## Math

### Math Enable

```
CALCulate:MATH<n>:STATe {ON|OFF}
                         → Enable/disable math channel

CALCulate:MATH<n>:STATe?
                         → Query state
```

### Math Type

```
CALCulate:MATH<n>:TYPE {ADD|SUBTract|MULTiply|DIVide|FFT|INTegral|DIFFerential|...}
                         → Set math operation type

CALCulate:MATH<n>:TYPE?  → Query type
```

### Math Sources

```
CALCulate:MATH<n>:SOURce {CH1|CH2|CH3|CH4}
                         → Set source for single-operand math

CALCulate:MATH<n>:SOURce1 {CH1|CH2|CH3|CH4}
                         → Set first source for dual-operand

CALCulate:MATH<n>:SOURce2 {CH1|CH2|CH3|CH4}
                         → Set second source
```

### FFT Configuration

```
CALCulate:MATH<n>:FFT:WINDow {RECTangle|HAMMing|HANNing|BLACkman|FLATtop}
                         → Set FFT window function

CALCulate:MATH<n>:FFT:WINDow?
                         → Query window

CALCulate:MATH<n>:FFT:FREQuency:STARt <frequency>
                         → Set FFT start frequency

CALCulate:MATH<n>:FFT:FREQuency:STOP <frequency>
                         → Set FFT stop frequency

CALCulate:MATH<n>:FFT:SPAN <frequency>
                         → Set FFT span

CALCulate:MATH<n>:FFT:CENTer <frequency>
                         → Set FFT center frequency
```

---

## Cursors

### Cursor Enable

```
CURSor:STATe {ON|OFF}    → Enable/disable cursors

CURSor:STATe?            → Query state
```

### Cursor Type

```
CURSor:FUNCtion {HORizontal|VERTical|HV|WAVE}
                         → Set cursor type
                           HORizontal: Horizontal bars (voltage)
                           VERTical: Vertical bars (time)
                           HV: Both
                           WAVE: Follow waveform

CURSor:FUNCtion?         → Query type
```

### Cursor Source

```
CURSor:SOURce {CH1|CH2|CH3|CH4|MATH<n>}
                         → Set cursor source

CURSor:SOURce?           → Query source
```

### Cursor Positions

```
CURSor:X1Position <seconds>
                         → Set X1 cursor position

CURSor:X2Position <seconds>
                         → Set X2 cursor position

CURSor:Y1Position <volts>
                         → Set Y1 cursor position

CURSor:Y2Position <volts>
                         → Set Y2 cursor position

CURSor:X1Position?       → Query X1 position
CURSor:X2Position?       → Query X2 position
CURSor:Y1Position?       → Query Y1 position
CURSor:Y2Position?       → Query Y2 position
```

### Cursor Readouts

```
CURSor:RESult:XDELta?    → Query X delta (time difference)

CURSor:RESult:YDELta?    → Query Y delta (voltage difference)

CURSor:RESult:SLOPe?     → Query slope (dV/dt)

CURSor:RESult:INVerse?   → Query 1/XDELta (frequency)
```

---

## Display

### Persistence

```
DISPlay:PERSistence:TYPE {OFF|TIME|INFinite}
                         → Set persistence mode

DISPlay:PERSistence:TIME <seconds>
                         → Set persistence time

DISPlay:PERSistence:TYPE?
                         → Query persistence type
```

### Intensity

```
DISPlay:WAVeform:INTensity <0-100>
                         → Set waveform intensity

DISPlay:GRATicule:INTensity <0-100>
                         → Set graticule intensity
```

### Clear Display

```
DISPlay:CLEar:DATa       → Clear waveform display

DISPlay:CLEar:PERSistence
                         → Clear persistence
```

### Screenshot

```
HCOPy:DATA?              → Get screenshot image data
                           Returns: PNG/BMP image data

HCOPy:FORMat {PNG|BMP}   → Set screenshot format

HCOPy:IMMediate          → Save screenshot (to configured destination)
```

---

## Serial Decode

### Bus Enable

```
BUS<n>:STATe {ON|OFF}    → Enable/disable bus decode

BUS<n>:STATe?            → Query state
```

### Bus Type

```
BUS<n>:TYPE {I2C|SPI|UART|CAN|LIN|...}
                         → Set bus type

BUS<n>:TYPE?             → Query type
```

### I2C Configuration

```
BUS<n>:I2C:DATA:SOURce {CH1|CH2|CH3|CH4}
                         → Set SDA source

BUS<n>:I2C:CLOCk:SOURce {CH1|CH2|CH3|CH4}
                         → Set SCL source
```

### SPI Configuration

```
BUS<n>:SPI:CLOCk:SOURce {CH1|CH2|CH3|CH4}
BUS<n>:SPI:DATA:SOURce {CH1|CH2|CH3|CH4}
BUS<n>:SPI:SS:SOURce {CH1|CH2|CH3|CH4}
```

### UART Configuration

```
BUS<n>:UART:TX:SOURce {CH1|CH2|CH3|CH4}
BUS<n>:UART:RX:SOURce {CH1|CH2|CH3|CH4}
BUS<n>:UART:BAUD <rate>
BUS<n>:UART:DATA <bits>
BUS<n>:UART:PARity {NONE|ODD|EVEN}
BUS<n>:UART:STOP <bits>
```

---

## System Commands

### Error Query

```
SYSTem:ERRor[:NEXT]?     → Query and clear oldest error
                           Returns: <code>,"<message>"
                           0,"No error" when empty

SYSTem:ERRor:ALL?        → Query all errors
```

### Date/Time

```
SYSTem:DATE "<YYYY,MM,DD>"
                         → Set date

SYSTem:DATE?             → Query date

SYSTem:TIME "<HH,MM,SS>"
                         → Set time

SYSTem:TIME?             → Query time
```

### Display Messages

```
SYSTem:DISPlay:UPDate {ON|OFF}
                         → Enable/disable display updates during remote

SYSTem:MESSage "<string>"
                         → Display message on screen
```

### Lock

```
SYSTem:KLOCk {ON|OFF}    → Lock/unlock front panel
```

### Preset

```
SYSTem:PRESet            → Reset to default state
```

---

## Status System

### Status Byte (*STB?)

| Bit | Value | Description |
|-----|-------|-------------|
| 2 | 4 | Error available |
| 3 | 8 | Questionable status |
| 4 | 16 | Message available |
| 5 | 32 | Standard event |
| 6 | 64 | Request for service |
| 7 | 128 | Operation status |

### Operation Status Register

```
STATus:OPERation:CONDition?
                         → Query operation condition

STATus:OPERation[:EVENt]?
                         → Query and clear event register

STATus:OPERation:ENABle <mask>
                         → Set enable mask
```

### Questionable Status Register

```
STATus:QUEStionable:CONDition?
                         → Query questionable condition

STATus:QUEStionable[:EVENt]?
                         → Query and clear questionable event
```

---

## Programming Examples

### Basic Acquisition

```
*RST                     ; Reset
CHAN1:STAT ON            ; Enable channel 1
CHAN1:SCAL 1.0           ; 1 V/div
CHAN1:COUP DCL           ; DC coupling
TIM:SCAL 1E-3            ; 1 ms/div
TRIG:A:TYPE EDGE         ; Edge trigger
TRIG:A:SOUR CH1          ; Trigger on CH1
TRIG:A:EDGE:SLOP POS     ; Rising edge
TRIG:A:LEV1 0.5          ; 500 mV trigger level
RUNS                     ; Single acquisition
*OPC?                    ; Wait for completion
```

### Multi-Channel Setup

```
*RST
CHAN1:STAT ON
CHAN2:STAT ON
CHAN1:SCAL 0.5           ; CH1: 500 mV/div
CHAN2:SCAL 1.0           ; CH2: 1 V/div
TIM:SCAL 100E-6          ; 100 µs/div
TIM:REF 50               ; Trigger at center
RUN
```

### Measurements

```
MEAS1:STAT ON            ; Enable measurement 1
MEAS1:SOUR CH1           ; Source: CH1
MEAS1:MAIN FREQ          ; Measure frequency
MEAS1:RES?               ; Query result

MEAS2:STAT ON
MEAS2:SOUR CH1
MEAS2:MAIN PEAK          ; Measure Vpp
MEAS2:RES?
```

### Waveform Transfer

```
FORM:DATA INT8           ; 8-bit signed
CHAN1:DATA:POIN 1000     ; 1000 points
CHAN1:DATA:HEAD?         ; Get header info
CHAN1:DATA?              ; Get waveform data
```

### FFT Analysis

```
CALC:MATH1:STAT ON       ; Enable math 1
CALC:MATH1:TYPE FFT      ; FFT mode
CALC:MATH1:SOUR CH1      ; Source: CH1
CALC:MATH1:FFT:WIND HANN ; Hanning window
CALC:MATH1:FFT:SPAN 10E6 ; 10 MHz span
```

### Screenshot

```
HCOP:FORM PNG            ; PNG format
HCOP:DATA?               ; Get image data
```

---

## Notes

1. **Command Termination**: LF (`\n`). Responses also terminated with LF.

2. **Single vs Run**: Use `RUNS` or `SINGle` for single acquisition, `RUN` for continuous.

3. **Coupling Names**: Uses `ACLimit`/`DCLimit` instead of just AC/DC.

4. **Probe Attenuation**: Set via `PROBe<n>:SETup:ATTenuation:MANual` rather than channel command.

5. **Measurement Slots**: RTB2000 has 4 slots, RTM3000 has 8, RTO has more.

6. **Data Format**: `REAL` format returns IEEE 754 floats, most efficient for processing.

7. **HiSLIP**: Recommended for high-speed LAN connections. Use port 4880.

8. **Zoom**: Use `TIMebase:ZOOM:` commands for zoomed view of waveform.

9. **Segmented Acquisition**: Enables capturing multiple triggers. Each segment is independent.

10. **Status Registers**: Use `*OPC?` after single acquisition to wait for completion.
