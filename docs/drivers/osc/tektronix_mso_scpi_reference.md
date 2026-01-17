# Tektronix MSO/TBS Series Oscilloscope SCPI Command Reference

> Extracted from Tektronix TBS2000, MSO/DPO 2000/3000/4000, and MSO 4/5/6 Series Programmer Manuals
> Applicable models: TBS2000B, MSO/DPO2000B, MSO/DPO3000, MSO/DPO4000B, MSO44/46/54/56/58/64

## Model Specifications

### TBS2000B Series (Entry Level)

| Model | Bandwidth | Channels | Sample Rate | Memory | Notes |
|-------|-----------|----------|-------------|--------|-------|
| TBS2072B | 70 MHz | 2 | 1 GSa/s | 5 Mpts | Entry Tek |
| TBS2074B | 70 MHz | 4 | 1 GSa/s | 5 Mpts | |
| TBS2102B | 100 MHz | 2 | 1 GSa/s | 5 Mpts | |
| TBS2104B | 100 MHz | 4 | 1 GSa/s | 5 Mpts | |
| TBS2202B | 200 MHz | 2 | 2 GSa/s | 5 Mpts | |
| TBS2204B | 200 MHz | 4 | 2 GSa/s | 5 Mpts | |

### MSO/DPO 2000B Series

| Model | Bandwidth | Channels | Sample Rate | Memory | Notes |
|-------|-----------|----------|-------------|--------|-------|
| MSO2012B | 100 MHz | 2+16 | 1 GSa/s | 1 Mpts | |
| MSO2024B | 200 MHz | 4+16 | 1 GSa/s | 1 Mpts | |
| DPO2012B | 100 MHz | 2 | 1 GSa/s | 1 Mpts | |
| DPO2024B | 200 MHz | 4 | 1 GSa/s | 1 Mpts | |

### MSO/DPO 3000 Series

| Model | Bandwidth | Channels | Sample Rate | Memory | Notes |
|-------|-----------|----------|-------------|--------|-------|
| MSO3012 | 100 MHz | 2+16 | 2.5 GSa/s | 5 Mpts | |
| MSO3054 | 500 MHz | 4+16 | 2.5 GSa/s | 5 Mpts | |
| DPO3014 | 100 MHz | 4 | 2.5 GSa/s | 5 Mpts | |
| DPO3054 | 500 MHz | 4 | 2.5 GSa/s | 5 Mpts | |

### MSO/DPO 4000B Series

| Model | Bandwidth | Channels | Sample Rate | Memory | Notes |
|-------|-----------|----------|-------------|--------|-------|
| MSO4034B | 350 MHz | 4+16 | 2.5 GSa/s | 20 Mpts | |
| MSO4054B | 500 MHz | 4+16 | 2.5 GSa/s | 20 Mpts | |
| MSO4104B | 1 GHz | 4+16 | 5 GSa/s | 20 Mpts | |
| DPO4054B | 500 MHz | 4 | 2.5 GSa/s | 20 Mpts | |
| DPO4104B | 1 GHz | 4 | 5 GSa/s | 20 Mpts | |

### MSO 4/5/6 Series (Modern Platform)

| Model | Bandwidth | Channels | Sample Rate | Memory | Notes |
|-------|-----------|----------|-------------|--------|-------|
| MSO44 | 200 MHz-1.5 GHz | 4 | 6.25 GSa/s | 31.25 Mpts | FlexChannel |
| MSO46 | 200 MHz-1.5 GHz | 6 | 6.25 GSa/s | 31.25 Mpts | FlexChannel |
| MSO54 | 350 MHz-2 GHz | 4 | 6.25 GSa/s | 62.5 Mpts | 12-bit ADC |
| MSO56 | 350 MHz-2 GHz | 6 | 6.25 GSa/s | 62.5 Mpts | 12-bit ADC |
| MSO58 | 350 MHz-2 GHz | 8 | 6.25 GSa/s | 62.5 Mpts | 12-bit ADC |
| MSO64 | 1-6 GHz | 4 | 25 GSa/s | 62.5 Mpts | 12-bit ADC |
| MSO66 | 1-8 GHz | 6 | 50 GSa/s | 62.5 Mpts | 12-bit ADC |

---

## Connection Methods

| Method | Port/Interface | Notes |
|--------|----------------|-------|
| USB-TMC | USB | Requires VISA driver |
| LAN (VXI-11) | Port 111 | Via VISA |
| LAN (Socket) | Port 4000 | Raw SCPI (TBS/MSO2/3/4000) |
| LAN (Socket) | Port 4000 | Raw SCPI (MSO 4/5/6 series) |
| GPIB | — | Standard on most models |

**USB Vendor ID**: 0x0699 (Tektronix)

---

## Command Notation

- Commands are case-insensitive
- Short form: uppercase portion required (e.g., `HORizontal` → `HOR`)
- `<x>` = channel number (1, 2, 3, or 4)
- `{ON|OFF}` = boolean (also accepts 1|0)
- Commands terminated with LF (`\n`)

**Note:** Tektronix uses slightly different command structure than IEEE SCPI standard.

---

## IEEE 488.2 Common Commands

```
*IDN?                    → Query identification
                           Returns: TEKTRONIX,MSO54,<serial>,<fw_version>

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

*TRG                     → Force trigger (same as TRIGger FORCe)

*WAI                     → Wait for operations complete

*SAV <slot>              → Save setup to memory (slot 1-10)
*RCL <slot>              → Recall setup from memory

*LRN?                    → Learn query (returns setup commands)
```

---

## Acquisition Control

### Run/Stop

```
ACQuire:STATE {RUN|STOP|ON|OFF|1|0}
                         → Set acquisition state
                           RUN/ON/1: Start acquiring
                           STOP/OFF/0: Stop acquiring

ACQuire:STATE?           → Query acquisition state
                           Returns: 0 (stopped) or 1 (running)
```

### Single Acquisition

```
ACQuire:STOPAfter {RUNSTop|SEQuence}
                         → Set stop condition
                           RUNSTop: Continuous acquisition
                           SEQuence: Stop after single acquisition

ACQuire:STOPAfter?       → Query stop condition
```

**Single acquisition sequence:**
```
ACQ:STOPA SEQ            ; Stop after one acquisition
ACQ:STATE RUN            ; Start acquisition
*OPC?                    ; Wait for completion
```

### Force Trigger

```
TRIGger FORCe            → Force a trigger event
```

---

## Acquisition Settings

### Acquisition Mode

```
ACQuire:MODe {SAMple|PEAKdetect|HIRes|AVErage|ENVelope}
                         → Set acquisition mode
                           SAMple: Normal sampling
                           PEAKdetect: Captures glitches
                           HIRes: High resolution (averaging within sample)
                           AVErage: Multiple acquisition averaging
                           ENVelope: Min/max envelope

ACQuire:MODe?            → Query mode
```

### Average Count

```
ACQuire:NUMAVg <count>   → Set number of averages (2 to 10240)

ACQuire:NUMAVg?          → Query average count
```

### Number of Acquisitions

```
ACQuire:NUMACq?          → Query number of acquisitions since last reset
```

### Waveform Database (FastAcq)

```
ACQuire:FASTAcq:STATE {ON|OFF}
                         → Enable/disable FastAcq mode

ACQuire:FASTAcq:STATE?   → Query FastAcq state
```

---

## Horizontal (Timebase)

### Time Scale

```
HORizontal:SCAle <seconds_per_div>
                         → Set horizontal scale (s/div)

HORizontal:SCAle?        → Query scale
```

**Examples:**
```
HOR:SCA 1E-6             → 1 µs/div
HOR:SCA 0.001            → 1 ms/div
HOR:SCA 100E-9           → 100 ns/div
```

### Record Length (Memory Depth)

```
HORizontal:RECOrdlength <points>
                         → Set record length

HORizontal:RECOrdlength? → Query record length
```

**Typical values:** 1000, 10000, 100000, 1000000, 10000000, etc.

### Sample Rate

```
HORizontal:SAMPLERate?   → Query sample rate (read-only)
                           Returns: sample rate in Sa/s
```

### Horizontal Position

```
HORizontal:POSition <percent>
                         → Set trigger position (0-100%)
                           0% = trigger at left edge
                           50% = trigger at center
                           100% = trigger at right edge

HORizontal:POSition?     → Query position
```

### Horizontal Delay

```
HORizontal:DELay:MODe {ON|OFF}
                         → Enable/disable delay mode

HORizontal:DELay:TIMe <seconds>
                         → Set delay time (when delay mode ON)

HORizontal:DELay:TIMe?   → Query delay time
```

### Resolution Mode (MSO 5/6 Series)

```
HORizontal:MODE {AUTO|MANual|CONStant}
                         → Set horizontal mode
                           AUTO: Auto scale/record length
                           MANual: Manual control
                           CONStant: Constant sample rate
```

---

## Channel Configuration

### Channel Display

```
SELect:CH<x> {ON|OFF|1|0}
                         → Show/hide channel

SELect:CH<x>?            → Query display state
```

### Vertical Scale

```
CH<x>:SCAle <volts_per_div>
                         → Set vertical scale (V/div)

CH<x>:SCAle?             → Query scale
```

### Vertical Position

```
CH<x>:POSition <divisions>
                         → Set vertical position in divisions

CH<x>:POSition?          → Query position
```

### Vertical Offset

```
CH<x>:OFFSet <volts>     → Set vertical offset in volts

CH<x>:OFFSet?            → Query offset
```

### Coupling

```
CH<x>:COUPling {AC|DC|GND}
                         → Set coupling mode

CH<x>:COUPling?          → Query coupling
```

### Termination (Impedance)

```
CH<x>:TERmination {FIFty|MEG|<ohms>}
                         → Set input impedance
                           FIFty: 50Ω
                           MEG: 1MΩ

CH<x>:TERmination?       → Query termination
```

### Bandwidth

```
CH<x>:BANdwidth {FULl|<bandwidth>}
                         → Set bandwidth limit
                           FULl: Full bandwidth
                           20E6: 20 MHz limit

CH<x>:BANdwidth?         → Query bandwidth
```

### Probe Attenuation

```
CH<x>:PRObe:GAIN <ratio>
                         → Set probe gain (reciprocal of attenuation)
                           1.0 = 1X probe
                           0.1 = 10X probe
                           0.01 = 100X probe

CH<x>:PRObe:GAIN?        → Query gain

CH<x>:PRObe:SET <string>
                         → Set probe type string

CH<x>:PRObe:ID:TYPE?     → Query connected probe type
```

### Invert

```
CH<x>:INVert {ON|OFF}    → Invert channel

CH<x>:INVert?            → Query invert state
```

### Label

```
CH<x>:LABel:NAMe "<string>"
                         → Set channel label

CH<x>:LABel:NAMe?        → Query label
```

### Deskew

```
CH<x>:DESKew <seconds>   → Set deskew time

CH<x>:DESKew?            → Query deskew
```

---

## Trigger System

### Trigger Type

```
TRIGger:A:TYPe {EDGE|WIDth|RUNt|TRANsition|LOGIc|SETHold|VIDEO|BUS|...}
                         → Set trigger type

TRIGger:A:TYPe?          → Query trigger type
```

### Trigger Mode

```
TRIGger:A:MODe {AUTO|NORMal}
                         → Set trigger mode
                           AUTO: Auto-trigger if no signal
                           NORMal: Wait for valid trigger

TRIGger:A:MODe?          → Query mode
```

### Edge Trigger Source

```
TRIGger:A:EDGE:SOURce {CH<x>|AUX|LINE|D<x>}
                         → Set edge trigger source

TRIGger:A:EDGE:SOURce?   → Query source
```

### Edge Trigger Slope

```
TRIGger:A:EDGE:SLOPe {RISe|FALL|EITHer}
                         → Set trigger slope

TRIGger:A:EDGE:SLOPe?    → Query slope
```

### Trigger Level

```
TRIGger:A:LEVel:CH<x> <voltage>
                         → Set trigger level for specific channel

TRIGger:A:LEVel:CH<x>?   → Query trigger level

TRIGger:A:LEVel <voltage>
                         → Set trigger level for current source

TRIGger:A:LEVel?         → Query trigger level
```

### Trigger Level 50%

```
TRIGger:A:SETLevel       → Auto-set trigger level to 50%
```

### Trigger Coupling

```
TRIGger:A:EDGE:COUPling {AC|DC|HFRej|LFRej|NOISErej}
                         → Set trigger coupling

TRIGger:A:EDGE:COUPling?
                         → Query coupling
```

### Trigger Holdoff

```
TRIGger:A:HOLDoff:TIMe <seconds>
                         → Set holdoff time

TRIGger:A:HOLDoff:TIMe?  → Query holdoff
```

### Trigger State Query

```
TRIGger:STATE?           → Query trigger state
                           Returns: ARMED, READY, AUTO, SAVEd, TRIGGER
```

---

## Width (Pulse) Trigger

```
TRIGger:A:TYPe WIDth     → Set to pulse width trigger

TRIGger:A:PULse:SOURce CH<x>
                         → Set source

TRIGger:A:PULse:WIDth:POLarity {POSitive|NEGative}
                         → Set polarity

TRIGger:A:PULse:WIDth:WHEN {LESSthan|MOREthan|EQual|UNEQual|WIThin|OUTside}
                         → Set width condition

TRIGger:A:PULse:WIDth:WIDth <seconds>
                         → Set width value

TRIGger:A:PULse:WIDth:HIGHLimit <seconds>
                         → Set high limit (for range)

TRIGger:A:PULse:WIDth:LOWLimit <seconds>
                         → Set low limit (for range)
```

---

## Measurements

### Add Measurement

```
MEASUrement:MEAS<x>:SOUrce1 CH<y>
                         → Set measurement source

MEASUrement:MEAS<x>:TYPe <type>
                         → Set measurement type

MEASUrement:MEAS<x>:STATE ON
                         → Enable measurement
```

**Measurement types:**
| Type | Description |
|------|-------------|
| FREQuency | Frequency |
| PERIOD | Period |
| MEAN | Mean voltage |
| PK2PK | Peak-to-peak |
| CRMs | Cycle RMS |
| MINImum | Minimum voltage |
| MAXImum | Maximum voltage |
| RISe | Rise time |
| FALL | Fall time |
| PWIdth | Positive width |
| NWIdth | Negative width |
| PDUty | Positive duty cycle |
| NDUty | Negative duty cycle |
| HIGH | High level |
| LOW | Low level |
| AMPlitude | Amplitude |
| POVershoot | Positive overshoot |
| NOVershoot | Negative overshoot |

### Query Measurement Value

```
MEASUrement:MEAS<x>:VALue?
                         → Query measurement value
                           Returns: value or 9.9E37 if invalid

MEASUrement:MEAS<x>:MEAN?
                         → Query measurement mean (with statistics)

MEASUrement:MEAS<x>:MINImum?
                         → Query measurement minimum

MEASUrement:MEAS<x>:MAXImum?
                         → Query measurement maximum

MEASUrement:MEAS<x>:STDdev?
                         → Query standard deviation
```

### Immediate Measurements (Legacy)

```
MEASUrement:IMMed:SOUrce1 CH<x>
                         → Set immediate measurement source

MEASUrement:IMMed:TYPe <type>
                         → Set measurement type

MEASUrement:IMMed:VALue?
                         → Query measurement value
```

### Delete Measurements

```
MEASUrement:DELete:ALL   → Delete all measurements

MEASUrement:MEAS<x>:STATE OFF
                         → Disable specific measurement
```

---

## Waveform Data Transfer

### Data Source

```
DATa:SOUrce CH<x>        → Set data source
                           Also: MATH, REF<x>, D<x>

DATa:SOUrce?             → Query data source
```

### Data Encoding

```
DATa:ENCdg {ASCii|RIBinary|RPBinary|SRIbinary|SRPbinary}
                         → Set data encoding
                           ASCii: Comma-separated ASCII
                           RIBinary: Signed big-endian binary
                           RPBinary: Unsigned big-endian binary
                           SRIbinary: Signed little-endian binary
                           SRPbinary: Unsigned little-endian binary

DATa:ENCdg?              → Query encoding
```

### Data Width

```
DATa:WIDth {1|2}         → Set bytes per sample
                           1: 8-bit data
                           2: 16-bit data

DATa:WIDth?              → Query width
```

### Data Range

```
DATa:STARt <point>       → Set first point to transfer

DATa:STOP <point>        → Set last point to transfer
```

### Waveform Preamble

```
WFMOutpre?               → Query waveform preamble
                           Returns multiple fields

WFMOutpre:NR_Pt?         → Number of points
WFMOutpre:XINcr?         → Time per point
WFMOutpre:XZEro?         → Time of first point
WFMOutpre:YMUlt?         → Volts per bit
WFMOutpre:YOFf?          → Y offset (in digitizer levels)
WFMOutpre:YZEro?         → Y zero (volts)
WFMOutpre:BYT_Nr?        → Bytes per point
WFMOutpre:BIT_Nr?        → Bits per point
WFMOutpre:ENCdg?         → Encoding type
WFMOutpre:BN_Fmt?        → Binary format
```

### Get Waveform Data

```
CURVe?                   → Query waveform data
                           Returns: binary block or ASCII data
```

### Conversion Formulas

```
Time:    time[i] = XZEro + (i * XINcr)

Voltage: voltage[i] = ((data[i] - YOFf) * YMUlt) + YZEro
```

### Example: Complete Data Transfer

```
DATA:SOU CH1             ; Source channel 1
DATA:ENC SRI             ; Signed little-endian
DATA:WID 2               ; 16-bit
DATA:STAR 1              ; Start at point 1
DATA:STOP 10000          ; End at point 10000
WFMO?                    ; Get preamble
CURV?                    ; Get data
```

---

## Math

### Math Display

```
MATH:ADDNew "MATH<x>"    → Add new math waveform (MSO 5/6 series)

MATH<x>:DISPlay {ON|OFF}
                         → Show/hide math waveform (legacy)
```

### Math Definition

```
MATH:MATH<x>:DEFine "<expression>"
                         → Set math expression

MATH:MATH<x>:DEFine?     → Query expression
```

**Expression examples:**
```
"CH1+CH2"                → Add channels
"CH1-CH2"                → Subtract
"CH1*CH2"                → Multiply
"CH1/CH2"                → Divide
"FFT(CH1)"               → FFT of channel 1
"INTG(CH1)"              → Integrate
"DIFF(CH1)"              → Differentiate
```

### FFT Settings

```
MATH:MATH<x>:SPECtral:WINdow {HANNing|RECTangular|HAMMing|BLACkmanharris|KAISer|GAUSsian}
                         → Set FFT window

MATH:MATH<x>:SPECtral:WINdow?
                         → Query window

MATH:MATH<x>:SPECtral:MAG {LINEar|DB}
                         → Set magnitude scale
```

---

## Cursors

### Cursor Mode

```
CURSor:MODe {OFF|TRACk|HBArs|VBArs|WAVEform|SCREEN}
                         → Set cursor mode

CURSor:MODe?             → Query mode
```

### Cursor Source

```
CURSor:SOUrce1 CH<x>     → Set cursor 1 source
CURSor:SOUrce2 CH<x>     → Set cursor 2 source
```

### Waveform Cursors

```
CURSor:WAVEform:POSITION1 <position>
                         → Set cursor 1 position (in seconds)

CURSor:WAVEform:POSITION2 <position>
                         → Set cursor 2 position

CURSor:WAVEform:HDELTA?  → Query horizontal delta (time)

CURSor:WAVEform:VDELTA?  → Query vertical delta (voltage)

CURSor:WAVEform:HPOS1?   → Query cursor 1 time position
CURSor:WAVEform:HPOS2?   → Query cursor 2 time position

CURSor:WAVEform:VBArs:UNIts?
                         → Query vertical units
```

### Horizontal Bar Cursors

```
CURSor:HBArs:POSITION1 <voltage>
CURSor:HBArs:POSITION2 <voltage>
CURSor:HBArs:DELTa?      → Query delta
```

---

## Display

### Persistence

```
DISplay:PERSistence {OFF|INFPersist|VARpersist|AUTO}
                         → Set persistence mode

DISplay:PERSistence?     → Query persistence

DISplay:PERSistence:VALue <seconds>
                         → Set variable persistence time
```

### Graticule

```
DISplay:GRAticule {FULL|GRID|CROSs|FRAMe|SOLid}
                         → Set graticule style

DISplay:GRAticule?       → Query style
```

### Intensity

```
DISplay:INTENSITy:WAVEform <1-100>
                         → Set waveform intensity

DISplay:INTENSITy:GRATicule <1-100>
                         → Set graticule intensity
```

### Screenshot

```
SAVe:IMAGe "<filename>"  → Save screenshot to file

HARDCopy STARt           → Send screenshot to configured output

EXPort:FORMat {PNG|BMP|TIFF}
                         → Set export format

EXPort:IMAGe "<filename>"
                         → Export image (MSO 5/6 series)
```

---

## Serial Decode (Bus Analysis)

### Add Bus

```
BUS:B<x>:TYPe {I2C|SPI|RS232|CAN|LIN|...}
                         → Set bus type

BUS:B<x>:STATE ON        → Enable bus display
```

### I2C Configuration

```
BUS:B<x>:I2C:SCLk:SOUrce CH<y>
                         → Set SCL source

BUS:B<x>:I2C:SDAta:SOUrce CH<y>
                         → Set SDA source
```

### SPI Configuration

```
BUS:B<x>:SPI:CLOCk:SOUrce CH<y>
BUS:B<x>:SPI:DATA:SOUrce CH<y>
BUS:B<x>:SPI:SELect:SOUrce CH<y>
```

### UART/RS-232 Configuration

```
BUS:B<x>:RS232:TX:SOUrce CH<y>
BUS:B<x>:RS232:RX:SOUrce CH<y>
BUS:B<x>:RS232:BAUD <rate>
BUS:B<x>:RS232:DATABits <bits>
BUS:B<x>:RS232:PARity {NONE|ODD|EVEN}
```

---

## System Commands

### Error Query

```
*ESR?                    → Standard event status register
                           Bit 5: Command error
                           Bit 4: Execution error
                           Bit 3: Device error
                           Bit 2: Query error

ALLEv?                   → Query all events
                           Returns: event queue
```

### Factory Reset

```
FACtory                  → Reset to factory defaults
```

### Date/Time

```
DATE "<string>"          → Set date "YYYY-MM-DD"
DATE?                    → Query date

TIME "<string>"          → Set time "HH:MM:SS"
TIME?                    → Query time
```

### Lock

```
LOCk ALL                 → Lock front panel
LOCk NONe                → Unlock front panel
```

### Verbose

```
VERBose {ON|OFF}         → Set verbose mode for responses
HEADer {ON|OFF}          → Include headers in query responses
```

---

## Status System

### Status Byte (*STB?)

| Bit | Value | Description |
|-----|-------|-------------|
| 0 | 1 | Not used |
| 2 | 4 | Error/Event queue not empty |
| 3 | 8 | Questionable status |
| 4 | 16 | Message available |
| 5 | 32 | Standard event summary |
| 6 | 64 | Request for service |
| 7 | 128 | Not used |

### Standard Event Status Register (*ESR?)

| Bit | Value | Description |
|-----|-------|-------------|
| 0 | 1 | Operation complete |
| 2 | 4 | Query error |
| 3 | 8 | Device error |
| 4 | 16 | Execution error |
| 5 | 32 | Command error |
| 7 | 128 | Power on |

---

## Programming Examples

### Basic Acquisition

```
*RST                     ; Reset
SEL:CH1 ON               ; Display CH1
CH1:SCA 1.0              ; 1 V/div
CH1:COUP DC              ; DC coupling
HOR:SCA 1E-3             ; 1 ms/div
TRIG:A:TYP EDGE          ; Edge trigger
TRIG:A:EDGE:SOU CH1      ; Trigger on CH1
TRIG:A:EDGE:SLO RIS      ; Rising edge
TRIG:A:LEV:CH1 0.5       ; 500 mV level
ACQ:STOPA SEQ            ; Single acquisition
ACQ:STATE RUN            ; Start
*OPC?                    ; Wait for completion
```

### Multi-Channel Setup

```
*RST
SEL:CH1 ON
SEL:CH2 ON
CH1:SCA 0.5              ; CH1: 500 mV/div
CH2:SCA 1.0              ; CH2: 1 V/div
CH1:POS 2                ; CH1 position: +2 div
CH2:POS -2               ; CH2 position: -2 div
HOR:SCA 100E-6           ; 100 µs/div
HOR:POS 50               ; Trigger at center
```

### Measurements

```
MEAS:MEAS1:SOU CH1
MEAS:MEAS1:TYP FREQ
MEAS:MEAS1:STATE ON

MEAS:MEAS2:SOU CH1
MEAS:MEAS2:TYP PK2PK
MEAS:MEAS2:STATE ON

; Query values
MEAS:MEAS1:VAL?          ; Frequency
MEAS:MEAS2:VAL?          ; Vpp
```

### Waveform Transfer

```
DATA:SOU CH1             ; Source: CH1
DATA:ENC RPBI            ; Unsigned binary
DATA:WID 1               ; 8-bit
DATA:STAR 1              ; Start point
DATA:STOP 10000          ; End point
WFMO:NR_PT?              ; Get number of points
WFMO:XINC?               ; Get time increment
WFMO:YMULT?              ; Get voltage multiplier
WFMO:YOFF?               ; Get Y offset
WFMO:YZERO?              ; Get Y zero
CURV?                    ; Get waveform data
```

### Screenshot

```
SAV:IMAG:FILEF PNG       ; PNG format
SAV:IMAG "C:/screenshot.png"
                         ; Save to file
```

### UART Decode

```
BUS:B1:TYP RS232         ; UART decode
BUS:B1:RS232:TX:SOU CH1  ; TX on CH1
BUS:B1:RS232:RX:SOU CH2  ; RX on CH2
BUS:B1:RS232:BAUD 115200 ; 115200 baud
BUS:B1:RS232:DATAB 8     ; 8 data bits
BUS:B1:RS232:PAR NONE    ; No parity
BUS:B1:STATE ON          ; Enable decode
```

---

## Notes

1. **Command Termination**: LF (`\n`). Some models also accept CR+LF.

2. **Acquisition State**: Use `ACQ:STATE?` to check if running. Returns 0 or 1.

3. **Single Acquisition**: Set `ACQ:STOPA SEQ`, then `ACQ:STATE RUN`, then wait for `*OPC?`.

4. **Waveform Data**: Default encoding varies by model. Check with `DATA:ENC?`.

5. **Position vs Offset**: `CH<x>:POSition` is in divisions, `CH<x>:OFFSet` is in volts.

6. **Probe Gain**: Tektronix uses reciprocal (GAIN = 1/attenuation). 10X probe = 0.1 gain.

7. **Record Length**: Available values depend on model. Query with `HOR:RECO?` after setting.

8. **MSO 5/6 Series**: Uses somewhat different command syntax. Check specific programmer's guide.

9. **FastAcq**: High-speed acquisition mode for capturing rare events. Disables some features.

10. **Event Queue**: Use `ALLEv?` to retrieve all pending events/errors at once.
