# Rigol DS1000Z Series Oscilloscope SCPI Command Reference

> Driver abstraction reference extracted from MSO/DS1000Z Programming Guide
> Applicable models: DS1054Z, DS1074Z, DS1104Z, DS1074Z-S Plus, DS1104Z-S Plus, MSO1074Z, MSO1104Z

---

## Model Specifications

| Model | Bandwidth | Channels | Sample Rate | Memory | Features |
|-------|-----------|----------|-------------|--------|----------|
| DS1054Z | 50 MHz | 4 analog | 1 GSa/s | 24 Mpts | Entry level |
| DS1074Z | 70 MHz | 4 analog | 1 GSa/s | 24 Mpts | |
| DS1104Z | 100 MHz | 4 analog | 1 GSa/s | 24 Mpts | |
| DS1074Z-S Plus | 70 MHz | 4 analog | 1 GSa/s | 24 Mpts | + 25MHz AWG |
| DS1104Z-S Plus | 100 MHz | 4 analog | 1 GSa/s | 24 Mpts | + 25MHz AWG |
| MSO1074Z | 70 MHz | 4 + 16 digital | 1 GSa/s | 24 Mpts | MSO |
| MSO1104Z | 100 MHz | 4 + 16 digital | 1 GSa/s | 24 Mpts | MSO |

**Note**: DS1054Z, DS1074Z, and DS1104Z share the same hardware. Lower bandwidth models are software-limited.

**Common Features**:
- 7" WVGA (800×480) display
- Serial decode: I2C, SPI, UART/RS232 (optional: CAN, LIN)
- Math: +, -, ×, ÷, FFT
- Measurements: 32 automatic measurements
- USB Host/Device, LAN, optional GPIB

---

## Connection Methods

| Method | Port | Notes |
|--------|------|-------|
| USB-TMC | USB Device | VID: 0x1AB1, PID: 0x04CE |
| LAN (VXI-11) | — | Via NI-VISA |
| Raw Socket | 5555 | Direct TCP, no library needed |
| Telnet | 5555 | Interactive |
| GPIB | — | Optional USB-GPIB adapter |

**LXI Compliance**: Yes (Class C)

---

## Command Notation

- **Long form**: `:CHANnel1:DISPlay`
- **Short form**: `:CHAN1:DISP` (uppercase portion required)
- Commands are case-insensitive
- `<n>` = channel number (1-4)
- `<NR1>` = integer, `<NR3>` = floating point
- `{ON|OFF}` = choose one
- `[optional]` = can be omitted
- Commands terminated with `\n` (LF) or `\r\n` (CRLF)

---

## IEEE 488.2 Common Commands

```
*IDN?                    → Query identification
                           Returns: RIGOL TECHNOLOGIES,DS1104Z,DS1ZA123456789,00.04.04.SP4

*RST                     → Reset to factory defaults

*CLS                     → Clear status registers

*OPC                     → Set OPC bit when operations complete
*OPC?                    → Returns 1 when operations complete

*ESE <value>             → Set standard event enable register
*ESE?                    → Query standard event enable register

*ESR?                    → Query and clear standard event register

*SRE <value>             → Set service request enable register
*SRE?                    → Query service request enable register

*STB?                    → Query status byte register

*TRG                     → Force trigger

*WAI                     → Wait for pending operations

*TST?                    → Self-test (returns 0 if passed)
```

---

## Acquisition Commands (`:ACQuire`)

### Acquisition Type
```
:ACQuire:TYPE {NORMal|AVERages|PEAK|HRESolution}
:ACQuire:TYPE?
```

- **NORMal**: Standard acquisition
- **AVERages**: Averaged waveform (reduces noise)
- **PEAK**: Peak detect (captures glitches)
- **HRESolution**: High resolution (smoothing)

### Averaging
```
:ACQuire:AVERages <count>        → Set average count (2^n, n=1-10)
:ACQuire:AVERages?               → Query average count
```
Values: 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024

### Memory Depth
```
:ACQuire:MDEPth {AUTO|<depth>}   → Set memory depth
:ACQuire:MDEPth?                  → Query memory depth
```

Single channel: AUTO, 12000, 120000, 1200000, 12000000, 24000000
Dual channel: AUTO, 6000, 60000, 600000, 6000000, 12000000
Four channels: AUTO, 3000, 30000, 300000, 3000000, 6000000

### Sample Rate
```
:ACQuire:SRATe?                  → Query current sample rate (read-only)
```

### Acquisition Control
```
:RUN                              → Start acquisition (same as Run button)
:STOP                             → Stop acquisition
:SINGle                           → Single trigger acquisition

:TFORce                           → Force trigger
```

---

## Channel Commands (`:CHANnel<n>`)

`<n>` = 1, 2, 3, or 4

### Display Control
```
:CHANnel<n>:DISPlay {ON|OFF}     → Show/hide channel
:CHANnel<n>:DISPlay?
```

### Vertical Scale
```
:CHANnel<n>:SCALe <volts/div>    → Set vertical scale
:CHANnel<n>:SCALe?                → Query vertical scale
```
Range: 1mV/div to 10V/div (1-2-5 sequence), depends on probe ratio

### Vertical Offset
```
:CHANnel<n>:OFFSet <volts>       → Set vertical offset
:CHANnel<n>:OFFSet?
```

### Coupling
```
:CHANnel<n>:COUPling {AC|DC|GND} → Set input coupling
:CHANnel<n>:COUPling?
```

### Bandwidth Limit
```
:CHANnel<n>:BWLimit {20M|OFF}    → Enable 20MHz bandwidth limit
:CHANnel<n>:BWLimit?
```

### Probe Ratio
```
:CHANnel<n>:PROBe <ratio>        → Set probe attenuation ratio
:CHANnel<n>:PROBe?
```
Values: 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000

### Invert
```
:CHANnel<n>:INVert {ON|OFF}      → Invert channel display
:CHANnel<n>:INVert?
```

### Units
```
:CHANnel<n>:UNITs {VOLTage|WATT|AMPere|UNKNown}
:CHANnel<n>:UNITs?
```

### Fine Adjustment (Vernier)
```
:CHANnel<n>:VERNier {ON|OFF}     → Enable fine scale adjustment
:CHANnel<n>:VERNier?
```

### Channel Label
```
:CHANnel<n>:LABel:SHOW {ON|OFF}  → Show channel label
:CHANnel<n>:LABel:CONTent "<text>"  → Set label text (≤12 chars)
```

---

## Timebase Commands (`:TIMebase`)

### Horizontal Scale
```
:TIMebase[:MAIN]:SCALe <sec/div> → Set horizontal scale
:TIMebase[:MAIN]:SCALe?
```
Range: 5ns/div to 50s/div

### Horizontal Offset (Delay)
```
:TIMebase[:MAIN]:OFFSet <seconds> → Set trigger position
:TIMebase[:MAIN]:OFFSet?
```

### Timebase Mode
```
:TIMebase:MODE {MAIN|XY|ROLL}    → Set timebase mode
:TIMebase:MODE?
```

### Delayed Timebase (Zoom)
```
:TIMebase:DELay:ENABle {ON|OFF}  → Enable delayed timebase
:TIMebase:DELay:OFFSet <seconds> → Zoom window position
:TIMebase:DELay:SCALe <sec/div>  → Zoom window scale
```

---

## Trigger Commands (`:TRIGger`)

### Trigger Mode
```
:TRIGger:MODE {EDGE|PULSe|RUNT|WINDow|NEDG|SLOPe|VIDeo|PATTern|DELay|
               TIMeout|DURation|SHOLd|RS232|IIC|SPI}
:TRIGger:MODE?
```

### Trigger Sweep
```
:TRIGger:SWEep {AUTO|NORMal|SINGle}
:TRIGger:SWEep?
```

### Trigger Status
```
:TRIGger:STATus?                 → Query trigger status
                                   Returns: TD, WAIT, RUN, AUTO, STOP
```

### Holdoff
```
:TRIGger:HOLDoff <seconds>       → Set trigger holdoff
:TRIGger:HOLDoff?
```
Range: 16ns to 10s

### Noise Reject
```
:TRIGger:NREJect {ON|OFF}        → Enable noise reject
:TRIGger:NREJect?
```

### Edge Trigger
```
:TRIGger:EDGe:SOURce {CHANnel1|CHANnel2|CHANnel3|CHANnel4|EXT|EXT5|ACLine}
:TRIGger:EDGe:SOURce?

:TRIGger:EDGe:SLOPe {POSitive|NEGative|RFALl}
:TRIGger:EDGe:SLOPe?

:TRIGger:EDGe:LEVel <voltage>    → Set trigger level
:TRIGger:EDGe:LEVel?
```

### Pulse Trigger
```
:TRIGger:PULSe:SOURce {CHANnel1|CHANnel2|CHANnel3|CHANnel4}
:TRIGger:PULSe:POLarity {POSitive|NEGative}
:TRIGger:PULSe:WHEN {PGReater|PLESs|NGReater|NLESs|PGLess|NGLess}
:TRIGger:PULSe:WIDTh <seconds>
:TRIGger:PULSe:UWIDth <seconds>  → Upper width limit
:TRIGger:PULSe:LWIDth <seconds>  → Lower width limit
:TRIGger:PULSe:LEVel <voltage>
```

### Force Trigger / 50% Level
```
:TFORce                           → Force trigger

:TRIGger:EDGe:LEVel:FIFTy        → Set level to 50% of signal
```

### Trigger Coupling
```
:TRIGger:COUPling {AC|DC|LFReject|HFReject}
:TRIGger:COUPling?
```

---

## Waveform Data Commands (`:WAVeform`)

### Source Selection
```
:WAVeform:SOURce {CHANnel1|CHANnel2|CHANnel3|CHANnel4|MATH|D0-D15}
:WAVeform:SOURce?
```

### Data Format
```
:WAVeform:FORMat {WORD|BYTE|ASCii}
:WAVeform:FORMat?
```

- **BYTE**: 8-bit unsigned (fastest)
- **WORD**: 16-bit unsigned (higher resolution)
- **ASCii**: Text values (slowest, human readable)

### Data Mode
```
:WAVeform:MODE {NORMal|MAXimum|RAW}
:WAVeform:MODE?
```

- **NORMal**: Screen data only
- **MAXimum**: Maximum available points
- **RAW**: All acquired data (must be stopped)

### Read Parameters
```
:WAVeform:PREamble?              → Get scaling parameters
```
Returns 10 comma-separated values:
1. format (0=BYTE, 1=WORD, 2=ASCii)
2. type (0=NORMal, 1=MAXimum, 2=RAW)
3. points (number of data points)
4. count (always 1)
5. xincrement (time between points)
6. xorigin (time of first point)
7. xreference (always 0)
8. yincrement (voltage per LSB)
9. yorigin (voltage offset)
10. yreference (center code value)

### Read Data
```
:WAVeform:DATA?                  → Get waveform data
```
Returns IEEE 488.2 definite length block: `#<n><length><data>`

### Point Control
```
:WAVeform:STARt <point>          → Start point (1 to memory depth)
:WAVeform:STARt?

:WAVeform:STOP <point>           → Stop point
:WAVeform:STOP?

:WAVeform:POINts?                → Query available points
```

### Conversion Formulas

```python
# Time for point i:
time[i] = xorigin + (i * xincrement)

# Voltage for BYTE format:
voltage = (raw_value - yreference - yorigin) * yincrement

# Voltage for WORD format (same formula):
voltage = (raw_value - yreference - yorigin) * yincrement
```

---

## Measurement Commands (`:MEASure`)

### Enable/Disable Display
```
:MEASure:STATistic:DISPlay {ON|OFF}
:MEASure:STATistic:DISPlay?

:MEASure:CLEar ALL               → Clear all measurements
:MEASure:CLEar ITEM<n>           → Clear specific item
```

### Statistics
```
:MEASure:STATistic:MODE {DIFFerence|EXTRemum}
:MEASure:STATistic:RESet         → Reset statistics
```

### Automatic Measurements
```
:MEASure:SOURce {CHANnel1|CHANnel2|CHANnel3|CHANnel4|MATH}
:MEASure:SOURce?

:MEASure:ITEM <item>[,<source>]  → Add measurement
:MEASure:ITEM? <item>,<source>   → Query measurement value
```

### Measurement Items

**Voltage Measurements:**
```
VMAX         → Maximum voltage
VMIN         → Minimum voltage
VPP          → Peak-to-peak voltage
VTOP         → Top voltage (flat top)
VBASe        → Base voltage (flat bottom)
VAMP         → Amplitude (VTOP - VBASE)
VAVG         → Average voltage
VRMS         → RMS voltage
OVERshoot    → Overshoot %
PREShoot     → Preshoot %
MARea        → Area under curve
MPARea       → Area of first period
```

**Time Measurements:**
```
PERiod       → Period
FREQuency    → Frequency
RTIMe        → Rise time (10%-90%)
FTIMe        → Fall time (90%-10%)
PWIDth       → Positive pulse width
NWIDth       → Negative pulse width
PDUTy        → Positive duty cycle
NDUTy        → Negative duty cycle
TVMAX        → Time of VMAX
TVMIN        → Time of VMIN
```

**Phase/Delay Measurements (two sources):**
```
:MEASure:SETup:DSA <source>      → Delay source A
:MEASure:SETup:DSB <source>      → Delay source B

RDELay       → Rise edge delay
FDELay       → Fall edge delay
RPHase       → Rise edge phase
FPHase       → Fall edge phase
```

### Measurement Query Examples
```
:MEAS:ITEM FREQ,CHAN1            → Measure CH1 frequency
:MEAS:ITEM? FREQ,CHAN1           → Returns frequency value

:MEAS:ITEM VPP,CHAN1             → Measure CH1 Vpp
:MEAS:ITEM? VPP,CHAN1            → Returns Vpp value
```

### All Measurements
```
:MEASure:ALL:SOURce {CHANnel1|CHANnel2|CHANnel3|CHANnel4}
:MEASure:ALL:DISPlay {ON|OFF}    → Show all measurements
```

---

## Math Commands (`:MATH`)

### Math Display
```
:MATH:DISPlay {ON|OFF}           → Show/hide math waveform
:MATH:DISPlay?
```

### Math Operation
```
:MATH:OPERator {ADD|SUBTract|MULTiply|DIVision|AND|OR|XOR|NOT|FFT|
                INTGrate|DIFFrentiate|SQRT|LOG|LN|EXP|ABS}
:MATH:OPERator?
```

### Sources
```
:MATH:SOURce1 {CHANnel1|CHANnel2|CHANnel3|CHANnel4}
:MATH:SOURce1?
:MATH:SOURce2 {CHANnel1|CHANnel2|CHANnel3|CHANnel4}
:MATH:SOURce2?
```

### Scale/Offset
```
:MATH:SCALe <scale>              → Vertical scale
:MATH:SCALe?
:MATH:OFFSet <offset>            → Vertical offset
:MATH:OFFSet?
```

### FFT Settings
```
:MATH:FFT:WINDow {RECTangle|BLACkman|HANNing|HAMMing|FLATtop}
:MATH:FFT:WINDow?

:MATH:FFT:SPLit {ON|OFF}         → Split display mode
:MATH:FFT:SPLit?

:MATH:FFT:UNIT {VRMS|DB}         → FFT vertical unit
:MATH:FFT:UNIT?

:MATH:FFT:HSCale <Hz/div>        → FFT horizontal scale
:MATH:FFT:HCENter <Hz>           → FFT center frequency
:MATH:FFT:VSCale <dB/div>        → FFT vertical scale (dB mode)
```

---

## Display Commands (`:DISPlay`)

### Display Type
```
:DISPlay:TYPE {VECTors|DOTS}     → Vector or dot display
:DISPlay:TYPE?
```

### Persistence
```
:DISPlay:PERSistence {MINimum|<time>|INFinite}
:DISPlay:PERSistence?
```
Time values: MIN, 0.1, 0.2, 0.5, 1, 2, 5, 10, INF

```
:DISPlay:CLEar                    → Clear persistence display
```

### Grid
```
:DISPlay:GRID {FULL|HALF|NONE}   → Grid display mode
:DISPlay:GRID?
```

### Intensity
```
:DISPlay:WBRightness <0-100>     → Waveform brightness
:DISPlay:GBRightness <0-100>     → Grid brightness
```

### Screen Capture
```
:DISPlay:DATA? {ON|OFF},{OFF|INVert},{BMP24|BMP8|PNG|JPEG|TIFF}
```
Returns screen image as IEEE 488.2 binary block.

Example: `:DISP:DATA? ON,OFF,PNG` → Get PNG screenshot

---

## Cursor Commands (`:CURSor`)

### Cursor Mode
```
:CURSor:MODE {OFF|MANual|TRACk|AUTO|XY}
:CURSor:MODE?
```

### Manual Cursor
```
:CURSor:MANual:TYPE {X|Y}        → Cursor type
:CURSor:MANual:SOURce {CHANnel1|CHANnel2|CHANnel3|CHANnel4|MATH}

:CURSor:MANual:CAX <position>    → Cursor A X position
:CURSor:MANual:CBX <position>    → Cursor B X position
:CURSor:MANual:CAY <position>    → Cursor A Y position
:CURSor:MANual:CBY <position>    → Cursor B Y position

:CURSor:MANual:AXValue?          → Cursor A time value
:CURSor:MANual:BXValue?          → Cursor B time value
:CURSor:MANual:AYValue?          → Cursor A voltage value
:CURSor:MANual:BYValue?          → Cursor B voltage value
:CURSor:MANual:XDELta?           → Time difference
:CURSor:MANual:IXDELta?          → 1/XDelta (frequency)
:CURSor:MANual:YDELta?           → Voltage difference
```

---

## Decoder Commands (`:DECoder1` / `:DECoder2`)

### Enable/Mode
```
:DECoder1:MODE {PARallel|UART|SPI|IIC}
:DECoder1:MODE?
:DECoder1:DISPlay {ON|OFF}
:DECoder1:DISPlay?
:DECoder1:FORMat {HEX|ASCii|DECimal|BINary|LINE}
:DECoder1:FORMat?
:DECoder1:POSition <position>    → Vertical position
```

### UART Decode
```
:DECoder1:UART:TX {CHANnel1|CHANnel2|CHANnel3|CHANnel4|OFF}
:DECoder1:UART:RX {CHANnel1|CHANnel2|CHANnel3|CHANnel4|OFF}
:DECoder1:UART:BAUD <rate>       → Baud rate (110-20000000)
:DECoder1:UART:WIDTh {5|6|7|8}   → Data bits
:DECoder1:UART:STOP {1|1.5|2}    → Stop bits
:DECoder1:UART:PARity {NONE|EVEN|ODD}
:DECoder1:UART:POLarity {POSitive|NEGative}
:DECoder1:UART:ENDian {LSB|MSB}
:DECoder1:UART:THReshold <voltage>
```

### SPI Decode
```
:DECoder1:SPI:CLK {CHANnel1|CHANnel2|CHANnel3|CHANnel4}
:DECoder1:SPI:MISO {CHANnel1|CHANnel2|CHANnel3|CHANnel4|OFF}
:DECoder1:SPI:MOSI {CHANnel1|CHANnel2|CHANnel3|CHANnel4|OFF}
:DECoder1:SPI:CS {CHANnel1|CHANnel2|CHANnel3|CHANnel4|OFF}
:DECoder1:SPI:SELect {NCS|CS}    → CS polarity
:DECoder1:SPI:MODE {TIMeout|CS}  → Frame mode
:DECoder1:SPI:TIMeout <time>     → Timeout value
:DECoder1:SPI:POLarity {NEGative|POSitive}  → Clock polarity
:DECoder1:SPI:EDGE {RISing|FALLing}  → Data edge
:DECoder1:SPI:ENDian {LSB|MSB}
:DECoder1:SPI:WIDTh <bits>       → Word width (4-32)
```

### I2C Decode
```
:DECoder1:IIC:CLK {CHANnel1|CHANnel2|CHANnel3|CHANnel4}
:DECoder1:IIC:DATA {CHANnel1|CHANnel2|CHANnel3|CHANnel4}
:DECoder1:IIC:CLK:THReshold <voltage>
:DECoder1:IIC:DATA:THReshold <voltage>
:DECoder1:IIC:ADDRess {NORMal|RWBit}  → 7-bit or 8-bit address
```

---

## System Commands (`:SYSTem`)

### General
```
:SYSTem:OPTion:INSTall <license> → Install option
:SYSTem:OPTion:UNINSTall         → Uninstall options
:SYSTem:OPTion?                  → Query installed options

:SYSTem:BEEPer {ON|OFF}          → Enable/disable beeper
:SYSTem:BEEPer?

:SYSTem:ERRor[:NEXT]?            → Query error queue
:SYSTem:ERRor:COUNt?             → Number of errors
```

### Language
```
:SYSTem:LANGuage {SCHinese|TCHinese|ENGLish|...}
:SYSTem:LANGuage?
```

### Power-On
```
:SYSTem:PON {DEFault|LAST}       → Power-on state
:SYSTem:PON?
```

### LAN Configuration
```
:SYSTem:LAN:DHCP {ON|OFF}        → Enable DHCP
:SYSTem:LAN:AUToip {ON|OFF}      → Enable Auto-IP
:SYSTem:LAN:GATeway <ip>         → Gateway address
:SYSTem:LAN:IPADdress <ip>       → IP address
:SYSTem:LAN:SMASK <mask>         → Subnet mask
:SYSTem:LAN:DNS <ip>             → DNS server
:SYSTem:LAN:MAC?                 → MAC address (read-only)
:SYSTem:LAN:STATus?              → LAN status
:SYSTem:LAN:VISA?                → VISA resource string
:SYSTem:LAN:APPLy                → Apply LAN settings
```

### GPIB
```
:SYSTem:GPIB <address>           → Set GPIB address (1-30)
:SYSTem:GPIB?
```

---

## Storage Commands (`:STORage`)

### Screen Capture
```
:STORage:IMAGe:TYPE {BMP24|BMP8|PNG|JPEG|TIFF}
:STORage:IMAGe:INVert {ON|OFF}   → Invert colors
```

---

## Reference Waveform Commands (`:REFerence<n>`)

`<n>` = 1 to 10

```
:REFerence<n>:SOURce {CHANnel1|CHANnel2|CHANnel3|CHANnel4|MATH|D0-D15}
:REFerence<n>:ENABle {ON|OFF}
:REFerence<n>:VSCale <scale>     → Vertical scale
:REFerence<n>:VOFFset <offset>   → Vertical offset
:REFerence<n>:RESet              → Reset reference
:REFerence<n>:SAVe               → Save current waveform as reference
```

---

## Python Driver Example

```python
import socket
import struct
import numpy as np

class DS1000Z:
    def __init__(self, ip: str, port: int = 5555, timeout: float = 10.0):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(timeout)
        self.sock.connect((ip, port))

    def write(self, cmd: str):
        self.sock.send((cmd + '\n').encode())

    def read(self, size: int = 4096) -> bytes:
        return self.sock.recv(size)

    def query(self, cmd: str) -> str:
        self.write(cmd)
        return self.read().decode().strip()

    def close(self):
        self.sock.close()

    # Identification
    def idn(self) -> str:
        return self.query('*IDN?')

    def reset(self):
        self.write('*RST')

    # Acquisition control
    def run(self):
        self.write(':RUN')

    def stop(self):
        self.write(':STOP')

    def single(self):
        self.write(':SING')

    def force_trigger(self):
        self.write(':TFOR')

    # Channel control
    def set_channel_display(self, ch: int, on: bool):
        self.write(f':CHAN{ch}:DISP {"ON" if on else "OFF"}')

    def set_channel_scale(self, ch: int, scale: float):
        self.write(f':CHAN{ch}:SCAL {scale}')

    def get_channel_scale(self, ch: int) -> float:
        return float(self.query(f':CHAN{ch}:SCAL?'))

    def set_channel_offset(self, ch: int, offset: float):
        self.write(f':CHAN{ch}:OFFS {offset}')

    def set_channel_coupling(self, ch: int, coupling: str):
        """coupling: 'AC', 'DC', or 'GND'"""
        self.write(f':CHAN{ch}:COUP {coupling}')

    def set_probe_ratio(self, ch: int, ratio: float):
        self.write(f':CHAN{ch}:PROB {ratio}')

    # Timebase
    def set_timebase_scale(self, scale: float):
        self.write(f':TIM:SCAL {scale}')

    def get_timebase_scale(self) -> float:
        return float(self.query(':TIM:SCAL?'))

    def set_timebase_offset(self, offset: float):
        self.write(f':TIM:OFFS {offset}')

    # Trigger
    def set_trigger_source(self, source: str):
        """source: 'CHAN1', 'CHAN2', 'CHAN3', 'CHAN4', 'EXT', 'ACL'"""
        self.write(f':TRIG:EDGE:SOUR {source}')

    def set_trigger_level(self, level: float):
        self.write(f':TRIG:EDGE:LEV {level}')

    def get_trigger_level(self) -> float:
        return float(self.query(':TRIG:EDGE:LEV?'))

    def set_trigger_slope(self, slope: str):
        """slope: 'POS', 'NEG', 'RFAL'"""
        self.write(f':TRIG:EDGE:SLOP {slope}')

    def set_trigger_mode(self, mode: str):
        """mode: 'AUTO', 'NORM', 'SING'"""
        self.write(f':TRIG:SWE {mode}')

    def get_trigger_status(self) -> str:
        return self.query(':TRIG:STAT?')

    # Measurements
    def measure(self, item: str, channel: int) -> float:
        """
        item: 'VMAX', 'VMIN', 'VPP', 'VTOP', 'VBAS', 'VAMP', 'VAVG', 'VRMS',
              'OVER', 'PRES', 'FREQ', 'PER', 'RTIM', 'FTIM', 'PWID', 'NWID',
              'PDUT', 'NDUT'
        """
        return float(self.query(f':MEAS:ITEM? {item},CHAN{channel}'))

    def auto_measure(self, channel: int):
        self.write(f':MEAS:SOUR CHAN{channel}')
        self.write(':MEAS:ALL:DISP ON')

    # Waveform acquisition
    def get_waveform(self, channel: int, mode: str = 'NORM') -> tuple:
        """
        Returns (time_array, voltage_array)
        mode: 'NORM' (screen), 'MAX' (memory), 'RAW' (all, must be stopped)
        """
        self.write(f':WAV:SOUR CHAN{channel}')
        self.write(f':WAV:MODE {mode}')
        self.write(':WAV:FORM BYTE')

        # Get preamble for scaling
        preamble = self.query(':WAV:PRE?').split(',')
        points = int(preamble[2])
        xincr = float(preamble[4])
        xorig = float(preamble[5])
        yincr = float(preamble[7])
        yorig = float(preamble[8])
        yref = int(preamble[9])

        # Get data
        self.write(':WAV:DATA?')
        raw = self.read(points + 100)

        # Parse IEEE 488.2 header
        assert raw[0:1] == b'#'
        header_len = int(raw[1:2])
        data_len = int(raw[2:2+header_len])
        data = raw[2+header_len:2+header_len+data_len]

        # Convert to numpy arrays
        raw_values = np.frombuffer(data, dtype=np.uint8)
        voltage = (raw_values - yref - yorig) * yincr
        time = np.arange(len(voltage)) * xincr + xorig

        return time, voltage

    # Screenshot
    def screenshot(self, filename: str, format: str = 'PNG'):
        """Save screenshot to file. format: 'PNG', 'BMP24', 'JPEG', 'TIFF'"""
        self.write(f':DISP:DATA? ON,OFF,{format}')

        # Read IEEE 488.2 block
        header = self.read(11)
        assert header[0:1] == b'#'
        header_len = int(header[1:2])
        data_len = int(header[2:2+header_len])

        # Read image data
        remaining = data_len - (len(header) - 2 - header_len)
        data = header[2+header_len:] + self.read(remaining + 1)

        with open(filename, 'wb') as f:
            f.write(data[:data_len])


# Usage example
if __name__ == '__main__':
    scope = DS1000Z('192.168.1.100')
    print(scope.idn())

    # Configure channel 1
    scope.set_channel_display(1, True)
    scope.set_channel_scale(1, 1.0)  # 1V/div
    scope.set_channel_coupling(1, 'DC')
    scope.set_probe_ratio(1, 10)  # 10x probe

    # Configure timebase
    scope.set_timebase_scale(0.001)  # 1ms/div

    # Configure trigger
    scope.set_trigger_source('CHAN1')
    scope.set_trigger_level(0.5)
    scope.set_trigger_slope('POS')

    # Single acquisition
    scope.single()
    import time
    time.sleep(1)

    # Measure
    freq = scope.measure('FREQ', 1)
    vpp = scope.measure('VPP', 1)
    print(f"Frequency: {freq:.2f} Hz, Vpp: {vpp:.3f} V")

    # Get waveform data
    t, v = scope.get_waveform(1)
    print(f"Captured {len(t)} points")

    # Save screenshot
    scope.screenshot('capture.png')

    scope.close()
```

---

## Key Differences from Siglent SDS Series

| Feature | Rigol DS1000Z | Siglent SDS |
|---------|---------------|-------------|
| Socket Port | 5555 | 5025 |
| Channel prefix | `:CHANnel<n>` | `:CHANnel<n>` (same) |
| Run command | `:RUN` | `:TRIGger:RUN` |
| Stop command | `:STOP` | `:TRIGger:STOP` |
| Single command | `:SINGle` | `:TRIGger:SINGle` |
| Force trigger | `:TFORce` | `:TRIGger:FORCe` |
| Screenshot | `:DISP:DATA?` | `:PRINt?` |
| Waveform source | `:WAV:SOUR` | `:WAV:SOUR` (same) |

---

## Documentation Sources

- [MSO/DS1000Z Programming Guide (PDF)](https://www.batronix.com/files/Rigol/Oszilloskope/_DS&MSO1000Z/MSO_DS1000Z_ProgrammingGuide_EN.pdf)
- [ds1054z Python CLI](https://ds1054z.readthedocs.io/en/stable/)
- [GitHub - DS1054Z Screen Capture](https://github.com/RoGeorge/DS1054Z_screen_capture)
