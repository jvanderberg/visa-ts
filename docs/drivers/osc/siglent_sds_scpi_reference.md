# Siglent SDS Series Oscilloscope SCPI Command Reference

> Driver abstraction reference extracted from Programming Guide EN11D (Feb 2023)
> Applicable models: SDS5000X, SDS2000X Plus, SDS6000 Pro/A/L, SHS800X/SHS1000X, SDS2000X HD

## Connection Methods

| Method | Port | Notes |
|--------|------|-------|
| USBTMC | — | Requires NI-VISA or libusb |
| VXI-11 | LAN | Uses NI-VISA |
| Telnet | 5024 | Interactive, one command at a time |
| Raw Socket | 5025 | Best for scripting, no library needed |

---

## Command Notation

- **Long form**: `:CHANnel1:SCALe` 
- **Short form**: `:CHAN1:SCAL` (uppercase portion required)
- `<NR1>`: Integer (e.g., `1`)
- `<NR3>`: Float with exponent (e.g., `1.23E+02`)
- `?` suffix: Query form
- Commands return `\n` terminated responses

---

## IEEE 488.2 Common Commands

```
*IDN?                    → Siglent Technologies,<model>,<serial>,<firmware>
*OPC?                    → 1 (when all operations complete)
*RST                     → Reset to default configuration
```

---

## Root Commands

```
:AUToset                 → Auto-adjust trigger, vertical, horizontal
:PRINt? {BMP|PNG}        → Capture screen, returns binary image data
:FORMat:DATA {SINGle|DOUBle|CUSTom,<digits>}  → Set returned data precision
:FORMat:DATA?            → Query current precision
```

---

## Acquisition Commands (`:ACQuire`)

### Mode & Type
```
:ACQuire:MODE {YT|XY|ROLL}           → Set acquisition mode
:ACQuire:MODE?                        → Query mode

:ACQuire:TYPE {NORMal|PEAK|AVERage,<n>|ERES,<bits>}
                                      → Set acquisition type
    <n> := {4|16|32|64|128|256|512|1024}  (average count)
    <bits> := {0.5|1.0|1.5|2.0|2.5|3.0}   (ERES bits)
:ACQuire:TYPE?                        → Query type
```

### Memory & Sampling
```
:ACQuire:MDEPth <size>               → Set memory depth
    SDS5000X single: {250k|1.25M|2.5M|12.5M|25M|125M|250M}
    SDS5000X dual:   {125k|625k|1.25M|6.25M|12.5M|62.5M|125M}
    SDS2000X Plus single: {20k|200k|2M|20M|200M}
    SDS2000X Plus dual:   {10k|100k|1M|10M|100M}
:ACQuire:MDEPth?                      → Query memory depth

:ACQuire:SRATe <rate>                 → Set sample rate (NR3)
:ACQuire:SRATe?                       → Query sample rate

:ACQuire:MMANagement {AUTO|FSRate|FMDepth}
                                      → Memory management mode
    AUTO = auto sample rate & depth
    FSRate = fixed sample rate
    FMDepth = fixed memory depth
:ACQuire:MMANagement?
```

### Control
```
:ACQuire:AMODe {FAST|SLOW}           → Waveform capture rate
:ACQuire:AMODe?

:ACQuire:INTerpolation {ON|OFF}      → Sinc (ON) or linear (OFF) interpolation
:ACQuire:INTerpolation?

:ACQuire:CSWeep                       → Clear sweeps, restart acquisition

:ACQuire:NUMAcq?                      → Number of acquisitions since start
:ACQuire:POINts?                      → Number of sample points on screen
```

### Sequence Mode
```
:ACQuire:SEQuence {ON|OFF}           → Enable/disable sequence mode
:ACQuire:SEQuence?

:ACQuire:SEQuence:COUNt <n>          → Number of segments (NR1)
:ACQuire:SEQuence:COUNt?
```

### Resolution (SDS2000X Plus only)
```
:ACQuire:RESolution {8Bits|10Bits}
:ACQuire:RESolution?
```

---

## Channel Commands (`:CHANnel<n>`)

`<n>` = 1 to 4 (channel number)

### Display & Switch
```
:CHANnel<n>:SWITch {ON|OFF}          → Turn channel on/off
:CHANnel<n>:SWITch?

:CHANnel<n>:VISible {ON|OFF}         → Show/hide waveform display
:CHANnel<n>:VISible?
```

### Vertical Scale & Offset
```
:CHANnel<n>:SCALe <volts/div>        → Vertical scale (NR3)
:CHANnel<n>:SCALe?

:CHANnel<n>:OFFSet <volts>           → Vertical offset (NR3)
:CHANnel<n>:OFFSet?

:CHANnel:REFerence {OFFSet|POSition} → Scale expansion reference point
:CHANnel:REFerence?
```

### Input Coupling & Impedance
```
:CHANnel<n>:COUPling {DC|AC|GND}     → Input coupling
:CHANnel<n>:COUPling?

:CHANnel<n>:IMPedance {ONEMeg|FIFTy} → Input impedance (1MΩ or 50Ω)
:CHANnel<n>:IMPedance?
```

### Bandwidth & Probe
```
:CHANnel<n>:BWLimit {FULL|20M|200M}  → Bandwidth limit filter
:CHANnel<n>:BWLimit?

:CHANnel<n>:PROBe {DEFault|VALue,<ratio>}
                                      → Probe attenuation (1E-6 to 1E6)
:CHANnel<n>:PROBe?

:CHANnel<n>:SKEW <seconds>           → Channel skew correction (-100ns to +100ns)
:CHANnel<n>:SKEW?
```

### Misc
```
:CHANnel<n>:INVert {ON|OFF}          → Invert display
:CHANnel<n>:INVert?

:CHANnel<n>:UNIT {V|A}               → Vertical unit
:CHANnel<n>:UNIT?

:CHANnel<n>:LABel {ON|OFF}           → Show label
:CHANnel<n>:LABel?

:CHANnel<n>:LABel:TEXT "<string>"    → Set label text (max 20 chars, auto uppercase)
:CHANnel<n>:LABel:TEXT?
```

---

## Timebase Commands (`:TIMebase`)

```
:TIMebase:SCALe <sec/div>            → Horizontal scale (NR3)
:TIMebase:SCALe?

:TIMebase:DELay <seconds>            → Trigger delay/horizontal position (NR3)
:TIMebase:DELay?

:TIMebase:HREFerence {LEFT|CENTer|RIGHt}
                                      → Horizontal reference position
:TIMebase:HREFerence?

:TIMebase:MODE {MAIN|ZOOM|ROLL}      → Timebase mode
:TIMebase:MODE?
```

### Zoom Window
```
:TIMebase:ZOOM:SCALe <sec/div>       → Zoom window scale
:TIMebase:ZOOM:SCALe?

:TIMebase:ZOOM:POSition <seconds>    → Zoom window position
:TIMebase:ZOOM:POSition?
```

---

## Trigger Commands (`:TRIGger`)

### Basic Control
```
:TRIGger:MODE {AUTO|NORMal|SINGle|STOP}
                                      → Trigger mode
:TRIGger:MODE?

:TRIGger:STATus?                      → Trigger status (Arm|Ready|Auto|Trig'd|Stop)

:TRIGger:RUN                          → Start acquisition (same as Run button)
:TRIGger:STOP                         → Stop acquisition
:TRIGger:SINGle                       → Single trigger

:TRIGger:FORCe                        → Force trigger event
```

### Trigger Type
```
:TRIGger:TYPE {EDGE|PULSE|SLOPE|VIDEO|WINDOW|INTerval|
               DROPout|RUNT|PATTern|QUALified|SERial}
:TRIGger:TYPE?
```

### Edge Trigger
```
:TRIGger:EDGE:SOURce {C<n>|EXT|EXT5|LINE|D<m>}
:TRIGger:EDGE:SOURce?

:TRIGger:EDGE:LEVel <volts>          → Trigger level (NR3)
:TRIGger:EDGE:LEVel?

:TRIGger:EDGE:SLOPe {RISing|FALLing|ALTernate}
:TRIGger:EDGE:SLOPe?

:TRIGger:EDGE:COUPling {DC|AC|HFReject|LFReject}
:TRIGger:EDGE:COUPling?

:TRIGger:EDGE:IMPedance {ONEMeg|FIFTy}  → EXT input impedance
:TRIGger:EDGE:IMPedance?
```

### Pulse Trigger
```
:TRIGger:PULSe:SOURce {C<n>|EXT|EXT5|D<m>}
:TRIGger:PULSe:SOURce?

:TRIGger:PULSe:LEVel <volts>
:TRIGger:PULSe:LEVel?

:TRIGger:PULSe:POLarity {POSitive|NEGative}
:TRIGger:PULSe:POLarity?

:TRIGger:PULSe:CONDition {LESSthan|GREaterthan|INRange|OUTRange}
:TRIGger:PULSe:CONDition?

:TRIGger:PULSe:WIDTh <seconds>       → Pulse width
:TRIGger:PULSe:WIDTh?

:TRIGger:PULSe:UPPer <seconds>       → Upper limit (for range conditions)
:TRIGger:PULSe:UPPer?

:TRIGger:PULSe:LOWer <seconds>       → Lower limit
:TRIGger:PULSe:LOWer?
```

### Holdoff
```
:TRIGger:HOLDoff <seconds>           → Trigger holdoff time (NR3)
:TRIGger:HOLDoff?
```

### Serial Trigger (I2C, SPI, UART, CAN, LIN)
```
:TRIGger:SERial:PROTocol {IIC|SPI|UART|CAN|LIN|FLEXray|CANFd|IIS|M1553}
:TRIGger:SERial:PROTocol?
```

See Protocol-specific sections below for detailed serial trigger commands.

---

## Waveform Data Commands (`:WAVeform`)

### Setup
```
:WAVeform:SOURce {C<n>|F<n>|M<n>|REFA|REFB|REFC|REFD|DIGital}
                                      → Select waveform source
:WAVeform:SOURce?

:WAVeform:FORMat {BYTE|WORD}         → Data format (8-bit or 16-bit)
:WAVeform:FORMat?

:WAVeform:POINts <n>                  → Number of points to transfer
:WAVeform:POINts?

:WAVeform:STARt <n>                   → Start point index
:WAVeform:STARt?

:WAVeform:SPARsing <n>                → Sparsing factor (every nth point)
:WAVeform:SPARsing?

:WAVeform:INTerval <n>                → Point interval
:WAVeform:INTerval?
```

### Data Transfer
```
:WAVeform:DATA?                       → Get waveform data
    Returns: #<n><length><data>
    <n> = number of digits in length
    <length> = byte count
    <data> = raw binary waveform data

:WAVeform:PREamble?                   → Get waveform parameters
    Returns comma-separated:
    format, type, points, count, xincrement, xorigin,
    xreference, yincrement, yorigin, yreference
```

### Conversion Formulas
```python
# Time for point i:
time[i] = xorigin + (i * xincrement)

# Voltage for raw value:
voltage = (raw_value - yreference) * yincrement + yorigin
```

---

## Measurement Commands (`:MEASure`)

### Control
```
:MEASure:STATistics {ON|OFF}         → Enable statistics
:MEASure:STATistics?

:MEASure:STATistics:MODE {DIFFerence|APPend}
:MEASure:STATistics:MODE?

:MEASure:CLEAR                        → Clear all measurements

:MEASure:GATe {OFF|CURSor|SCReen|ZOOM}
                                      → Measurement gate source
:MEASure:GATe?
```

### Add/Remove Measurements
```
:MEASure:ADD <source>,<item>          → Add measurement
    <source> := C<n>|F<n>|M<n>|REFA|REFB|REFC|REFD
    <item> := see measurement items below

:MEASure:DELete <source>,<item>       → Remove measurement
```

### Measurement Items
```
Voltage:          PKPK, MAX, MIN, AMPL, TOP, BASE, MEAN, CMEAN, 
                  STDEV, VSTD, RMS, CRMS, OVSN, OVSP, RPRE, FPRE, 
                  LEVELX, PERLEVEL

Time:             PERiod, FREQuency, PWIDTH, NWIDTH, DUTY, NDUTY,
                  RISE, FALL, WIDTHat, PSLOPE, NSLOPE

Delay (2 source): PHASe, FRR, FRF, FFR, FFF, LRR, LRF, LFR, LFF, SKEW

Area:             AREA, MAREA
```

### Query Measurements
```
:MEASure:ITEM? <item>,<source>        → Get single measurement value

:MEASure:ALL?                         → Get all active measurements
    Returns comma-separated list

:MEASure:STATistics:ITEM? <type>,<source>,<item>
    <type> := CURRent|MEAN|MIN|MAX|STDEV|COUNt
```

### Threshold Settings
```
:MEASure:THReshold:SOURce {C<n>|ALL}
:MEASure:THReshold:SOURce?

:MEASure:THReshold:TYPE {PERCent|ABSolute}
:MEASure:THReshold:TYPE?

:MEASure:THReshold:HIGH <value>       → High threshold (NR3)
:MEASure:THReshold:HIGH?

:MEASure:THReshold:MID <value>        → Mid threshold
:MEASure:THReshold:MID?

:MEASure:THReshold:LOW <value>        → Low threshold
:MEASure:THReshold:LOW?
```

---

## Cursor Commands (`:CURSor`)

```
:CURSor {ON|OFF}                      → Enable/disable cursors
:CURSor?

:CURSor:MODE {TRACk|MANual,{X|Y|XY}|MEASure}
:CURSor:MODE?

:CURSor:SOURce1 {C<n>|F<n>|REFA|REFB|REFC|REFD|DIGital|HISTOGram}
:CURSor:SOURce1?

:CURSor:SOURce2 <source>
:CURSor:SOURce2?
```

### Position & Values
```
:CURSor:X1 <time>                     → X1 cursor position (NR3)
:CURSor:X1?

:CURSor:X2 <time>
:CURSor:X2?

:CURSor:XDELta?                       → X1 - X2 difference
:CURSor:IXDelta?                      → 1/(X1-X2) frequency

:CURSor:Y1 <voltage>                  → Y1 cursor position
:CURSor:Y1?

:CURSor:Y2 <voltage>
:CURSor:Y2?

:CURSor:YDELta?                       → Y1 - Y2 difference
```

---

## Display Commands (`:DISPlay`)

```
:DISPlay:GRATicule {FULL|GRID|CROSshair|FRAME|IRE|MVolt}
:DISPlay:GRATicule?

:DISPlay:INTensity:GRATicule <0-100>  → Grid intensity
:DISPlay:INTensity:GRATicule?

:DISPlay:INTensity:WAVeform <0-100>   → Waveform intensity
:DISPlay:INTensity:WAVeform?

:DISPlay:PERSistence {OFF|1|5|10|30|INFinite}
                                      → Persistence time (seconds)
:DISPlay:PERSistence?

:DISPlay:CLEar                        → Clear persistence display

:DISPlay:TYPE {VECTor|DOTS}           → Display type
:DISPlay:TYPE?

:DISPlay:COLor {TEMPerature|SPECtrum|MONochrome}
                                      → Color mode for intensity grading
:DISPlay:COLor?
```

---

## Math/Function Commands (`:FUNCtion<n>`)

`<n>` = 1 to 4 (math channel number, model dependent)

### Basic Math
```
:FUNCtion<n>:OPERation {OFF|ADD|SUB|MUL|DIV|FFT|INTegrate|
                        DIFFerentiate|SQRT|FILTer|AVERage|ERES}
:FUNCtion<n>:OPERation?

:FUNCtion<n>:SOURce1 {C<n>|F<m>|REFA|REFB|REFC|REFD}
:FUNCtion<n>:SOURce1?

:FUNCtion<n>:SOURce2 <source>         → For dual-source operations
:FUNCtion<n>:SOURce2?
```

### Scale & Offset
```
:FUNCtion<n>:SCALe <value>            → Vertical scale
:FUNCtion<n>:SCALe?

:FUNCtion<n>:OFFSet <value>           → Vertical offset
:FUNCtion<n>:OFFSet?

:FUNCtion<n>:VISible {ON|OFF}         → Show/hide math trace
:FUNCtion<n>:VISible?
```

### FFT Settings
```
:FUNCtion<n>:FFT:WINDow {RECTangle|BLACkman|HANNing|
                         HAMMing|FLATtop|TRIangle|GAUSsian}
:FUNCtion<n>:FFT:WINDow?

:FUNCtion<n>:FFT:VSCAle {VRMS|DBVrms|DBM|DBFS}
:FUNCtion<n>:FFT:VSCAle?

:FUNCtion<n>:FFT:CENTer <frequency>   → Center frequency
:FUNCtion<n>:FFT:CENTer?

:FUNCtion<n>:FFT:SPAN <frequency>     → Frequency span
:FUNCtion<n>:FFT:SPAN?

:FUNCtion<n>:FFT:HSCAle <value>       → Horizontal scale
:FUNCtion<n>:FFT:HSCAle?

:FUNCtion<n>:FFT:HCENter <frequency>  → Horizontal center
:FUNCtion<n>:FFT:HCENter?

:FUNCtion<n>:FFT:MAXHold {ON|OFF}     → FFT max hold
:FUNCtion<n>:FFT:MAXHold?
```

### Filter Settings
```
:FUNCtion<n>:FILTer:TYPE {LPASs|HPASs|BPASs|BSTop}
:FUNCtion<n>:FILTer:TYPE?

:FUNCtion<n>:FILTer:LOWer <frequency> → Lower cutoff
:FUNCtion<n>:FILTer:LOWer?

:FUNCtion<n>:FILTer:UPPer <frequency> → Upper cutoff
:FUNCtion<n>:FILTer:UPPer?
```

---

## Decode Commands (`:DECode`)

### Bus Control
```
:DECode {ON|OFF}                      → Enable decoding
:DECode?

:DECode:LIST {OFF|D1|D2}              → Show decode list for bus
:DECode:LIST?

:DECode:BUS<n> {ON|OFF}               → Enable bus decode (n=1,2)
:DECode:BUS<n>?

:DECode:BUS<n>:PROTocol {IIC|SPI|UART|CAN|LIN|FLEXray|CANFd|IIS|M1553}
:DECode:BUS<n>:PROTocol?

:DECode:BUS<n>:FORMat {BINary|DECimal|HEX|ASCii}
:DECode:BUS<n>:FORMat?

:DECode:BUS<n>:RESult?                → Get decode results
```

### I2C Decode
```
:DECode:BUS<n>:IIC:SCLSource {C<x>|D<m>}
:DECode:BUS<n>:IIC:SCLSource?

:DECode:BUS<n>:IIC:SCLThreshold <voltage>
:DECode:BUS<n>:IIC:SCLThreshold?

:DECode:BUS<n>:IIC:SDASource <source>
:DECode:BUS<n>:IIC:SDASource?

:DECode:BUS<n>:IIC:SDAThreshold <voltage>
:DECode:BUS<n>:IIC:SDAThreshold?

:DECode:BUS<n>:IIC:RWBit {ON|OFF}     → Include R/W bit in address
:DECode:BUS<n>:IIC:RWBit?
```

### SPI Decode
```
:DECode:BUS<n>:SPI:CLKSource <source>
:DECode:BUS<n>:SPI:CLKThreshold <voltage>
:DECode:BUS<n>:SPI:MISOSource {C<x>|D<m>|DIS}
:DECode:BUS<n>:SPI:MISOThreshold <voltage>
:DECode:BUS<n>:SPI:MOSISource <source>
:DECode:BUS<n>:SPI:MOSIThreshold <voltage>
:DECode:BUS<n>:SPI:CSSource <source>
:DECode:BUS<n>:SPI:CSThreshold <voltage>
:DECode:BUS<n>:SPI:CSTYpe {NCS|CS|TIMeout,<time>}
:DECode:BUS<n>:SPI:LATChedge {RISing|FALLing}
:DECode:BUS<n>:SPI:BITorder {LSB|MSB}
:DECode:BUS<n>:SPI:DLENgth <4-32>
```

### UART Decode
```
:DECode:BUS<n>:UART:RXSource <source>
:DECode:BUS<n>:UART:RXThreshold <voltage>
:DECode:BUS<n>:UART:TXSource <source>
:DECode:BUS<n>:UART:TXThreshold <voltage>
:DECode:BUS<n>:UART:BAUDrate <rate>
:DECode:BUS<n>:UART:DLENgth {5|6|7|8}
:DECode:BUS<n>:UART:PARity {NONE|ODD|EVEN}
:DECode:BUS<n>:UART:STOP {1|1.5|2}
:DECode:BUS<n>:UART:POLarity {NORMal|INVert}
:DECode:BUS<n>:UART:BITorder {LSB|MSB}
```

### CAN Decode
```
:DECode:BUS<n>:CAN:SOURce <source>
:DECode:BUS<n>:CAN:THReshold <voltage>
:DECode:BUS<n>:CAN:BAUDrate <rate>
:DECode:BUS<n>:CAN:SIGType {CANH|CANL|RX|TX|DIFFerential}
```

### LIN Decode
```
:DECode:BUS<n>:LIN:SOURce <source>
:DECode:BUS<n>:LIN:THReshold <voltage>
:DECode:BUS<n>:LIN:BAUDrate <rate>
:DECode:BUS<n>:LIN:POLarity {NORMal|INVert}
```

---

## Save/Recall Commands

### Save Waveform
```
:SAVE:WAVeform <path>,<source>        → Save waveform data
    <path> := "D:/filename.bin" or "E:/filename.csv"
    <source> := {C<n>|F<n>|M<n>|REFA|REFB|REFC|REFD|ALL}

:SAVE:WAVeform:FORMat {BINary|CSV|MATLab}
:SAVE:WAVeform:FORMat?
```

### Save Image
```
:SAVE:IMAGe <path>                    → Save screenshot
    <path> := "D:/filename.png" or "D:/filename.bmp"

:SAVE:IMAGe:FORMat {PNG|BMP|JPG}
:SAVE:IMAGe:FORMat?

:SAVE:IMAGe:INVert {ON|OFF}           → Invert colors
:SAVE:IMAGe:INVert?
```

### Save/Recall Setup
```
:SAVE:SETup <path>                    → Save setup file
:RECall:SETup <path>                  → Recall setup file

:SAVE:DEFault                         → Save as default
:RECall:FDEFault                      → Recall factory default
```

---

## Reference Waveforms (`:REF`)

```
:REF:SOURce {C<n>|F<n>|M<n>}          → Source for reference
:REF:SOURce?

:REF:SAVE <ref>                       → Save to reference
    <ref> := {REFA|REFB|REFC|REFD}

:REF<x>:DISPlay {ON|OFF}              → Show reference
    <x> := {A|B|C|D}
:REF<x>:DISPlay?

:REF<x>:SCALe <value>                 → Reference vertical scale
:REF<x>:SCALe?

:REF<x>:OFFSet <value>                → Reference vertical offset
:REF<x>:OFFSet?
```

---

## System Commands (`:SYSTem`)

```
:SYSTem:DATE <year>,<month>,<day>     → Set date
:SYSTem:DATE?

:SYSTem:TIME <hour>,<minute>,<second> → Set time
:SYSTem:TIME?

:SYSTem:LANGuage {ENGLish|SCHinese|TCHinese|JAPanese|KORean|
                  GERMan|FRENch|PORTuguese|SPANish|RUSsian}
:SYSTem:LANGuage?

:SYSTem:ERRor?                        → Query error queue
:SYSTem:ERRor:CLEar                   → Clear error queue

:SYSTem:COMMunicate:LAN:DHCP {ON|OFF}
:SYSTem:COMMunicate:LAN:DHCP?

:SYSTem:COMMunicate:LAN:IPADdress <ip>
:SYSTem:COMMunicate:LAN:IPADdress?

:SYSTem:COMMunicate:LAN:SMASk <mask>
:SYSTem:COMMunicate:LAN:SMASk?

:SYSTem:COMMunicate:LAN:GATeway <gateway>
:SYSTem:COMMunicate:LAN:GATeway?

:SYSTem:OPTion?                       → Query installed options
:SYSTem:OPTion:INSTall <key>          → Install option license
```

---

## History Commands (`:HISTORy`)

```
:HISTORy {ON|OFF}                     → Enable history mode
:HISTORy?

:HISTORy:FRAMe <n>                    → Select frame number
:HISTORy:FRAMe?

:HISTORy:FRAMe:TOTal?                 → Total captured frames

:HISTORy:FRAMe:TIME?                  → Timestamp of current frame

:HISTORy:LIST {ON|OFF}                → Show frame list
:HISTORy:LIST?

:HISTORy:PLAY {ON|OFF}                → Start/stop playback
:HISTORy:PLAY?

:HISTORy:PLAY:SPEed <speed>           → Playback speed
:HISTORy:PLAY:SPEed?
```

---

## Mask Test Commands (`:MTEst`)

```
:MTEst {ON|OFF}                       → Enable mask test
:MTEst?

:MTEst:SOURce {C<n>}                  → Test source
:MTEst:SOURce?

:MTEst:OPERation {RUN|STOP}           → Run/stop test
:MTEst:OPERation?

:MTEst:RESult?                        → Get test results (pass,fail,total)

:MTEst:RESult:CLEar                   → Clear results

:MTEst:STOPonviolation {ON|OFF}       → Stop on failure
:MTEst:STOPonviolation?

:MTEst:OUTPut {ON|OFF}                → Output on failure
:MTEst:OUTPut?

:MTEst:MASK:CREate                    → Create mask from current waveform

:MTEst:MASK:X <value>                 → Horizontal tolerance
:MTEst:MASK:X?

:MTEst:MASK:Y <value>                 → Vertical tolerance
:MTEst:MASK:Y?
```

---

## DVM (Digital Voltmeter) Commands (`:DVM`)

```
:DVM {ON|OFF}                         → Enable DVM
:DVM?

:DVM:SOURce {C<n>}                    → DVM source channel
:DVM:SOURce?

:DVM:MODE {DC|ACRMs|ACDCRMS}          → Measurement mode
:DVM:MODE?

:DVM:RESult?                          → Get DVM reading
```

---

## Memory/Digital Commands (`:DIGital`) [Option]

For MSO (Mixed Signal Oscilloscope) models with digital channels:

```
:DIGital {ON|OFF}                     → Enable digital channels
:DIGital?

:DIGital:D<n> {ON|OFF}                → Enable individual channel (n=0-15)
:DIGital:D<n>?

:DIGital:THReshold<g> <voltage>       → Threshold for group (g=1,2)
:DIGital:THReshold<g>?

:DIGital:THReshold<g>:TYPE {TTL|CMOS|LVCMOS33|LVCMOS25|CUSTom}
:DIGital:THReshold<g>:TYPE?
```

---

## Waveform Generator Commands (`:WGEN`) [Option]

For models with built-in AWG:

```
:WGEN {ON|OFF}                        → Enable waveform generator
:WGEN?

:WGEN:OUTPut {ON|OFF}                 → Output on/off
:WGEN:OUTPut?

:WGEN:FUNCtion {SINE|SQUare|RAMP|PULSe|NOISe|DC|ARBitrary}
:WGEN:FUNCtion?

:WGEN:FREQuency <frequency>           → Output frequency
:WGEN:FREQuency?

:WGEN:AMPLitude <volts>               → Output amplitude (Vpp)
:WGEN:AMPLitude?

:WGEN:OFFSet <volts>                  → DC offset
:WGEN:OFFSet?

:WGEN:SYMMetry <percent>              → Ramp symmetry (0-100%)
:WGEN:SYMMetry?

:WGEN:DUTYcycle <percent>             → Square/pulse duty cycle
:WGEN:DUTYcycle?

:WGEN:LOAD {50|HIGHimpedance}         → Load impedance
:WGEN:LOAD?
```

---

## Quick Start Examples

### Python Socket Connection
```python
import socket

class SiglentScope:
    def __init__(self, ip, port=5025):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.connect((ip, port))
        self.sock.settimeout(5.0)
    
    def write(self, cmd):
        self.sock.send((cmd + '\n').encode())
    
    def query(self, cmd):
        self.write(cmd)
        return self.sock.recv(65536).decode().strip()
    
    def close(self):
        self.sock.close()

# Usage
scope = SiglentScope('192.168.1.100')
print(scope.query('*IDN?'))
scope.write(':TRIGger:SINGle')
scope.close()
```

### Get Waveform Data
```python
def get_waveform(scope, channel=1):
    scope.write(f':WAVeform:SOURce C{channel}')
    scope.write(':WAVeform:FORMat BYTE')
    scope.write(':WAVeform:POINts 0')  # 0 = max points
    
    # Get preamble for scaling
    preamble = scope.query(':WAVeform:PREamble?').split(',')
    points = int(float(preamble[2]))
    xincr = float(preamble[4])
    xorigin = float(preamble[5])
    yincr = float(preamble[7])
    yorigin = float(preamble[8])
    yref = float(preamble[9])
    
    # Get raw data
    scope.write(':WAVeform:DATA?')
    raw = scope.sock.recv(points + 100)
    
    # Parse IEEE 488.2 block header
    header_len = int(raw[1:2])
    data_len = int(raw[2:2+header_len])
    data = raw[2+header_len:2+header_len+data_len]
    
    # Convert to voltage
    import numpy as np
    raw_values = np.frombuffer(data, dtype=np.uint8)
    voltage = (raw_values - yref) * yincr + yorigin
    time = np.arange(len(voltage)) * xincr + xorigin
    
    return time, voltage
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 0 | No error |
| -100 | Command error |
| -200 | Execution error |
| -300 | Device-specific error |
| -400 | Query error |

Query with `:SYSTem:ERRor?`

---

## Notes

1. **Termination**: Commands must end with `\n` (LF) or `\r\n` (CRLF)
2. **Case**: Commands are case-insensitive
3. **Whitespace**: Single space between command and parameter
4. **Binary data**: Uses IEEE 488.2 definite length block format `#<n><length><data>`
5. **Timeouts**: Allow 5+ seconds for large waveform transfers
6. **Model differences**: Check firmware version; some commands are model-specific
