# Oscilloscope SCPI Command Reference

> Comprehensive multi-vendor SCPI reference for digital oscilloscopes
> Covers entry-level through professional-grade instruments

## Instrument Coverage

### Entry Level ($300-$1000)

| Vendor | Model Series | Bandwidth | Channels | Sample Rate | Interface | Notes |
|--------|--------------|-----------|----------|-------------|-----------|-------|
| Rigol | DS1054Z/DS1104Z | 50-100 MHz | 4 | 1 GSa/s | USB/LAN | Most popular entry |
| Rigol | DHO800 | 70-100 MHz | 4 | 1.25 GSa/s | USB/LAN | 12-bit ADC |
| Rigol | DHO900 | 100 MHz | 4 | 1.25 GSa/s | USB/LAN | 12-bit ADC |
| Siglent | SDS1104X-E | 100 MHz | 4 | 1 GSa/s | USB/LAN | Super Phosphor |
| Siglent | SDS1202X-E | 200 MHz | 2 | 1 GSa/s | USB/LAN | 2-ch version |
| Hantek | DSO2000 | 70-200 MHz | 2 | 1 GSa/s | USB | Budget |
| OWON | XDS3000 | 100-200 MHz | 2/4 | 1 GSa/s | USB/LAN | Touch screen |

### Mid-Range ($1000-$5000)

| Vendor | Model Series | Bandwidth | Channels | Sample Rate | Interface | Notes |
|--------|--------------|-----------|----------|-------------|-----------|-------|
| Rigol | MSO5000 | 70-350 MHz | 4+16 | 8 GSa/s | USB/LAN | MSO with AWG |
| Rigol | DHO4000 | 200-800 MHz | 4 | 4 GSa/s | USB/LAN | 12-bit, 500 Mpts |
| Siglent | SDS2000X Plus | 100-350 MHz | 4 | 2 GSa/s | USB/LAN | 10-bit ADC |
| Siglent | SDS5000X | 350 MHz-1 GHz | 4 | 5 GSa/s | USB/LAN | 12-bit ADC |
| Tektronix | TBS2000B | 70-200 MHz | 4 | 2 GSa/s | USB/LAN | Entry Tek |
| Keysight | EDUX1052A | 50 MHz | 2 | 1 GSa/s | USB/LAN | Entry Keysight |
| Keysight | DSOX1204G | 70-200 MHz | 4 | 2 GSa/s | USB/LAN | With WaveGen |

### Professional ($5000+)

| Vendor | Model Series | Bandwidth | Channels | Sample Rate | Interface | Notes |
|--------|--------------|-----------|----------|-------------|-----------|-------|
| Keysight | MSOX3000G | 100-1000 MHz | 4+16 | 5 GSa/s | USB/LAN/GPIB | InfiniiVision |
| Keysight | MSOX4000A | 200 MHz-1.5 GHz | 4+16 | 5 GSa/s | USB/LAN/GPIB | Full featured |
| Keysight | MSOX6000A | 1-6 GHz | 4 | 20 GSa/s | USB/LAN | High bandwidth |
| Tektronix | MSO44/46 | 200 MHz-1.5 GHz | 4/6 | 6.25 GSa/s | USB/LAN | 12-bit ADC |
| Tektronix | MSO54/56/58 | 350 MHz-2 GHz | 4/6/8 | 6.25 GSa/s | USB/LAN | FlexChannel |
| Tektronix | MSO64/66/68 | 1-8 GHz | 4/6/8 | 25 GSa/s | USB/LAN | Ultra high-end |
| R&S | RTB2000 | 70-300 MHz | 2/4 | 2.5 GSa/s | USB/LAN | Entry R&S |
| R&S | RTM3000 | 100 MHz-1 GHz | 4 | 5 GSa/s | USB/LAN | Mid-range |
| R&S | RTO2000 | 600 MHz-6 GHz | 4 | 20 GSa/s | USB/LAN/GPIB | High-end |
| LeCroy | WaveAce | 40-300 MHz | 2/4 | 2 GSa/s | USB/LAN | Entry LeCroy |
| LeCroy | WaveSurfer | 200 MHz-1 GHz | 4 | 10 GSa/s | USB/LAN | Mid-range |
| LeCroy | WavePro HD | 2.5-8 GHz | 4 | 20 GSa/s | USB/LAN | 12-bit, high-end |

---

## IEEE 488.2 Common Commands (Universal)

All SCPI-compliant oscilloscopes support:

```
*IDN?                → Instrument identification
*RST                 → Reset to default state
*CLS                 → Clear status registers
*ESE <mask>          → Event status enable register
*ESE?                → Query event status enable
*ESR?                → Query event status register
*OPC                 → Operation complete
*OPC?                → Query operation complete (returns 1)
*SRE <mask>          → Service request enable register
*SRE?                → Query service request enable
*STB?                → Query status byte
*TRG                 → Force trigger
*TST?                → Self-test (0=pass)
*WAI                 → Wait for operations complete
*SAV <n>             → Save setup to memory
*RCL <n>             → Recall setup from memory
```

---

## Run/Stop Control

### Start/Stop Acquisition

| Vendor | Run | Stop | Single | Force Trigger |
|--------|-----|------|--------|---------------|
| Rigol | `:RUN` | `:STOP` | `:SINGle` | `:TFORce` |
| Siglent | `:RUN` | `:STOP` | `:SINGle` | `*TRG` or `TRIGger:SINGle:FORCe` |
| Keysight | `:RUN` | `:STOP` | `:SINGle` | `:TRIGger:FORCe` |
| Tektronix | `ACQuire:STATE RUN` | `ACQuire:STATE STOP` | `ACQuire:STOPAfter SEQuence` | `TRIGger FORCe` |
| R&S | `:RUN` or `RUNContinuous` | `:STOP` | `:SINGle` | `TRIGger:FORCe` |
| LeCroy | `TRIGger_MODE NORMal` | `TRIGger_MODE STOP` | `TRIGger_MODE SINGle` | `FORCe_TRIGger` |

### Acquisition State Query

| Vendor | Command | Returns |
|--------|---------|---------|
| Rigol | `:TRIGger:STATus?` | `TD`, `WAIT`, `RUN`, `AUTO`, `STOP` |
| Siglent | `:TRIGger:STATus?` | `Td`, `Wait`, `Run`, `Auto`, `Stop` |
| Keysight | `:AER?` | Acquisition event register |
| Keysight | `:OPERegister:CONDition?` | Status bits |
| Tektronix | `ACQuire:STATE?` | `0` (stopped) or `1` (running) |
| R&S | `ACQuire:STATe?` | `RUN`, `STOP`, `SINGLE` |

---

## Channel Configuration

### Channel Selection

| Vendor | Pattern | Example |
|--------|---------|---------|
| Rigol | `:CHANnel<n>:` | `:CHAN1:DISP ON` |
| Siglent | `C<n>:` | `C1:VDIV 1V` |
| Keysight | `:CHANnel<n>:` | `:CHAN1:DISPlay ON` |
| Tektronix | `CH<n>:` | `CH1:SCALe 1.0` |
| R&S | `CHANnel<n>:` | `CHAN1:STATe ON` |
| LeCroy | `C<n>:` | `C1:VDIV 1V` |

### Display On/Off

| Vendor | Enable | Disable | Query |
|--------|--------|---------|-------|
| Rigol | `:CHAN<n>:DISPlay ON` | `:CHAN<n>:DISPlay OFF` | `:CHAN<n>:DISPlay?` |
| Siglent | `C<n>:TRA ON` | `C<n>:TRA OFF` | `C<n>:TRA?` |
| Keysight | `:CHAN<n>:DISPlay ON` | `:CHAN<n>:DISPlay OFF` | `:CHAN<n>:DISPlay?` |
| Tektronix | `SELect:CH<n> ON` | `SELect:CH<n> OFF` | `SELect:CH<n>?` |
| R&S | `CHAN<n>:STATe ON` | `CHAN<n>:STATe OFF` | `CHAN<n>:STATe?` |
| LeCroy | `C<n>:TRA ON` | `C<n>:TRA OFF` | `C<n>:TRA?` |

### Vertical Scale (V/div)

| Vendor | Set Command | Query | Range |
|--------|-------------|-------|-------|
| Rigol | `:CHAN<n>:SCALe <v>` | `:CHAN<n>:SCALe?` | 1mV-10V |
| Siglent | `C<n>:VDIV <v>` | `C<n>:VDIV?` | 500uV-10V |
| Keysight | `:CHAN<n>:SCALe <v>` | `:CHAN<n>:SCALe?` | 1mV-5V |
| Tektronix | `CH<n>:SCALe <v>` | `CH<n>:SCALe?` | 1mV-10V |
| R&S | `CHAN<n>:SCALe <v>` | `CHAN<n>:SCALe?` | 1mV-10V |
| LeCroy | `C<n>:VDIV <v>` | `C<n>:VDIV?` | 2mV-10V |

### Vertical Offset

| Vendor | Set Command | Query | Notes |
|--------|-------------|-------|-------|
| Rigol | `:CHAN<n>:OFFSet <v>` | `:CHAN<n>:OFFSet?` | Volts |
| Siglent | `C<n>:OFST <v>` | `C<n>:OFST?` | Volts |
| Keysight | `:CHAN<n>:OFFSet <v>` | `:CHAN<n>:OFFSet?` | Volts |
| Tektronix | `CH<n>:OFFSet <v>` | `CH<n>:OFFSet?` | Volts |
| R&S | `CHAN<n>:POSition <v>` | `CHAN<n>:POSition?` | Divisions |
| LeCroy | `C<n>:OFST <v>` | `C<n>:OFST?` | Volts |

### Coupling

| Vendor | Command | Options |
|--------|---------|---------|
| Rigol | `:CHAN<n>:COUPling {AC|DC|GND}` | AC, DC, GND |
| Siglent | `C<n>:CPL {A1M|D1M|GND}` | A1M=AC, D1M=DC |
| Keysight | `:CHAN<n>:COUPling {AC|DC}` | AC, DC |
| Tektronix | `CH<n>:COUPling {AC|DC|GND}` | AC, DC, GND |
| R&S | `CHAN<n>:COUPling {ACLimit|DCLimit|GND}` | ACLimit, DCLimit, GND |
| LeCroy | `C<n>:CPL {A1M|D1M|D50|GND}` | A1M, D1M, D50 (50Ω) |

### Probe Attenuation

| Vendor | Command | Values |
|--------|---------|--------|
| Rigol | `:CHAN<n>:PROBe <ratio>` | 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000 |
| Siglent | `C<n>:ATTN <ratio>` | 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000 |
| Keysight | `:CHAN<n>:PROBe <ratio>` | 0.1 to 1000 |
| Tektronix | `CH<n>:PROBe:GAIN <ratio>` | Reciprocal of attenuation |
| R&S | `PROBe<n>:SETup:ATTenuation:MANual <ratio>` | 1:1 to 1000:1 |
| LeCroy | `C<n>:ATTN <ratio>` | 1, 10, 100, etc. |

### Bandwidth Limit

| Vendor | Enable | Disable | Options |
|--------|--------|---------|---------|
| Rigol | `:CHAN<n>:BWLimit 20M` | `:CHAN<n>:BWLimit OFF` | OFF, 20M |
| Siglent | `C<n>:BWL ON` | `C<n>:BWL OFF` | ON (20MHz), OFF |
| Keysight | `:CHAN<n>:BWLimit ON` | `:CHAN<n>:BWLimit OFF` | ON (25MHz), OFF |
| Tektronix | `CH<n>:BANdwidth <hz>` | `CH<n>:BANdwidth FULL` | Numeric or FULL |
| R&S | `CHAN<n>:BANDwidth <hz>` | `CHAN<n>:BANDwidth FULL` | 20M, FULL |

---

## Timebase Configuration

### Time Scale (s/div)

| Vendor | Set Command | Query | Range |
|--------|-------------|-------|-------|
| Rigol | `:TIMebase[:MAIN]:SCALe <s>` | `:TIMebase:SCALe?` | 5ns-50s |
| Siglent | `TDIV <s>` | `TDIV?` | 1ns-100s |
| Keysight | `:TIMebase:SCALe <s>` | `:TIMebase:SCALe?` | 1ns-50s |
| Tektronix | `HORizontal:SCALe <s>` | `HORizontal:SCALe?` | 400ps-1000s |
| R&S | `TIMebase:SCALe <s>` | `TIMebase:SCALe?` | 1ns-50s |
| LeCroy | `TDIV <s>` | `TDIV?` | 1ns-100s |

### Horizontal Position/Delay

| Vendor | Set Command | Query | Units |
|--------|-------------|-------|-------|
| Rigol | `:TIMebase[:MAIN]:OFFSet <s>` | `:TIMebase:OFFSet?` | Seconds from trigger |
| Siglent | `TRDL <s>` | `TRDL?` | Seconds |
| Keysight | `:TIMebase:POSition <s>` | `:TIMebase:POSition?` | Seconds |
| Tektronix | `HORizontal:POSition <pct>` | `HORizontal:POSition?` | Percent (0-100) |
| Tektronix | `HORizontal:DELay:TIMe <s>` | `HORizontal:DELay:TIMe?` | Seconds (if delay on) |
| R&S | `TIMebase:POSition <s>` | `TIMebase:POSition?` | Seconds |
| LeCroy | `TRDL <s>` | `TRDL?` | Seconds |

### Horizontal Mode

| Vendor | Command | Options |
|--------|---------|---------|
| Rigol | `:TIMebase:MODE {MAIN|XY|ROLL}` | MAIN, XY, ROLL |
| Siglent | (implicit from TDIV) | |
| Keysight | `:TIMebase:MODE {MAIN|WINDow|XY|ROLL}` | MAIN, WINDow, XY, ROLL |
| Tektronix | `DISplay:WAVEView1:VIEWStyle {OVErlay|STACked}` | Display mode |
| R&S | `TIMebase:ROLL:ENABle {ON|OFF}` | |

---

## Acquisition Settings

### Acquisition Mode

| Vendor | Command | Options |
|--------|---------|---------|
| Rigol | `:ACQuire:TYPE {NORMal|AVERages|PEAK|HRESolution}` | Sample, Average, Peak, HiRes |
| Siglent | `ACQW {SAMPling|PEAK_DETECT|AVERage|ERES}` | |
| Keysight | `:ACQuire:TYPE {NORMal|AVERage|HRESolution|PEAK}` | |
| Tektronix | `ACQuire:MODe {SAMple|PEAKdetect|HIRes|AVErage|ENVelope}` | |
| R&S | `ACQuire:TYPE {NORMal|AVERage|ENVelope|PEAK}` | |
| LeCroy | `ACQW {NORMal|AVERage|ENVELOPE|PEAK}` | |

### Average Count

| Vendor | Command | Range |
|--------|---------|-------|
| Rigol | `:ACQuire:AVERages <n>` | 2-1024 (power of 2) |
| Siglent | `AVGA <n>` | 4-256 |
| Keysight | `:ACQuire:COUNt <n>` | 2-65536 |
| Tektronix | `ACQuire:NUMAVg <n>` | 2-10240 |
| R&S | `ACQuire:AVERage:COUNt <n>` | 2-65536 |
| LeCroy | `AVGA <n>` | 2-1000000 |

### Memory Depth

| Vendor | Command | Notes |
|--------|---------|-------|
| Rigol | `:ACQuire:MDEPth {AUTO|<n>}` | Model dependent |
| Siglent | `MSIZ <n>` | 7K to 140M |
| Keysight | `:ACQuire:POINts <n>` | Up to 8M typical |
| Tektronix | `HORizontal:RECOrdlength <n>` | Up to 62.5M |
| R&S | `ACQuire:POINts[:VALue] <n>` | Up to 80M |
| LeCroy | `MSIZ <n>` | Model dependent |

### Sample Rate Query

| Vendor | Command | Notes |
|--------|---------|-------|
| Rigol | `:ACQuire:SRATe?` | Read-only |
| Siglent | `SARA?` | Read-only |
| Keysight | `:ACQuire:SRATe?` | Read-only |
| Tektronix | `HORizontal:SAMPLERate?` | Read-only |
| R&S | `ACQuire:SRATe?` | Read-only |
| LeCroy | `SARA?` | Read-only |

---

## Trigger System

### Trigger Mode

| Vendor | Command | Options |
|--------|---------|---------|
| Rigol | `:TRIGger:SWEep {AUTO|NORMal|SINGle}` | |
| Siglent | `TRMD {AUTO|NORM|SINGLE|STOP}` | |
| Keysight | `:TRIGger:SWEep {AUTO|TRIGgered}` | |
| Tektronix | `TRIGger:A:MODe {AUTO|NORMal}` | |
| R&S | `TRIGger:A:MODE {AUTO|NORMal}` | |
| LeCroy | `TRMD {AUTO|NORM|SINGLE|STOP}` | |

### Trigger Type

| Vendor | Edge | Pulse Width | Video | Pattern |
|--------|------|-------------|-------|---------|
| Rigol | `:TRIG:MODE EDGE` | `:TRIG:MODE PULSe` | `:TRIG:MODE VIDeo` | `:TRIG:MODE PATTern` |
| Siglent | `TRSE EDGE` | `TRSE WIDTH` | `TRSE TV` | `TRSE PATTern` |
| Keysight | `:TRIG:MODE EDGE` | `:TRIG:MODE GLIT` | `:TRIG:MODE TV` | `:TRIG:MODE PATT` |
| Tektronix | `TRIG:A:TYPE EDGE` | `TRIG:A:TYPE WIDTH` | `TRIG:A:TYPE VIDEO` | `TRIG:A:TYPE LOGIC` |
| R&S | `TRIG:A:TYPE EDGE` | `TRIG:A:TYPE WIDTh` | `TRIG:A:TYPE TV` | `TRIG:A:TYPE LOGIC` |

### Edge Trigger Source

| Vendor | Command | Options |
|--------|---------|---------|
| Rigol | `:TRIGger:EDGE:SOURce {CHAN1|CHAN2|CHAN3|CHAN4|EXT|ACLine}` | |
| Siglent | `TRSE EDGE,SR,C<n>` | C1-C4, EX, LINE |
| Keysight | `:TRIGger:EDGE:SOURce {CHANnel1|CHANnel2|EXT|LINE}` | |
| Tektronix | `TRIG:A:EDGE:SOURce {CH1|CH2|CH3|CH4|AUX|LINE}` | |
| R&S | `TRIG:A:SOURce {CH1|CH2|CH3|CH4|EXT|LINE}` | |
| LeCroy | `TRSE EDGE,SR,C<n>` | C1-C4, EXT, LINE |

### Edge Trigger Slope

| Vendor | Command | Options |
|--------|---------|---------|
| Rigol | `:TRIGger:EDGE:SLOPe {POSitive|NEGative|RFALl}` | Rising, Falling, Either |
| Siglent | `C<n>:TRSL {POS|NEG}` | |
| Keysight | `:TRIGger:EDGE:SLOPe {POSitive|NEGative|EITHer}` | |
| Tektronix | `TRIG:A:EDGE:SLOPe {RISE|FALL|EITHer}` | |
| R&S | `TRIG:A:EDGE:SLOPe {POSitive|NEGative|EITHer}` | |
| LeCroy | `C<n>:TRSL {POS|NEG}` | |

### Trigger Level

| Vendor | Command | Query |
|--------|---------|-------|
| Rigol | `:TRIGger:EDGE:LEVel <v>` | `:TRIGger:EDGE:LEVel?` |
| Siglent | `C<n>:TRLV <v>` | `C<n>:TRLV?` |
| Keysight | `:TRIGger:LEVel <v>` | `:TRIGger:LEVel?` |
| Keysight | `:TRIGger:LEVel <v>,CHANnel<n>` | Per-channel |
| Tektronix | `TRIG:A:LEVel:CH<n> <v>` | Per-channel |
| R&S | `TRIG:A:LEVel<n>[:VALue] <v>` | Per-source |
| LeCroy | `C<n>:TRLV <v>` | `C<n>:TRLV?` |

### Trigger Coupling

| Vendor | Command | Options |
|--------|---------|---------|
| Rigol | `:TRIGger:COUPling {AC|DC|LFReject|HFReject}` | |
| Siglent | `TRCP {AC|DC|HFREJ|LFREJ}` | |
| Keysight | `:TRIGger:EDGE:COUPle {AC|DC|LFReject}` | |
| Tektronix | `TRIG:A:EDGE:COUPling {AC|DC|HFRej|LFRej|NOISErej}` | |
| R&S | `TRIG:A:EDGE:COUPling {AC|DC|LFReject|HFReject}` | |

### Trigger Holdoff

| Vendor | Command | Units |
|--------|---------|-------|
| Rigol | `:TRIGger:HOLDoff <s>` | Seconds |
| Siglent | `TRHO <s>` | Seconds |
| Keysight | `:TRIGger:HOLDoff <s>` | Seconds |
| Tektronix | `TRIG:A:HOLDoff:TIMe <s>` | Seconds |
| R&S | `TRIG:A:HOLDoff:TIME <s>` | Seconds |

---

## Measurements

### Automatic Measurements

All oscilloscopes support automatic measurements. Common measurement types:

| Measurement | Description |
|-------------|-------------|
| FREQ/FREQuency | Signal frequency |
| PER/PERiod | Signal period |
| VMAX | Maximum voltage |
| VMIN | Minimum voltage |
| VPP | Peak-to-peak voltage |
| VAMP | Amplitude (high-low) |
| VAVG/MEAN | Average voltage |
| VRMS | RMS voltage |
| VHIGH/VTOP | Logic high level |
| VLOW/VBASE | Logic low level |
| RISE | Rise time (10%-90%) |
| FALL | Fall time (90%-10%) |
| PWID/PWIDTH | Positive pulse width |
| NWID/NWIDTH | Negative pulse width |
| DUTY | Duty cycle |
| OVER/POVershoot | Positive overshoot |
| PRESHOOT | Preshoot |

### Measurement Commands

| Vendor | Add Measurement | Query Value | Clear All |
|--------|-----------------|-------------|-----------|
| Rigol | `:MEASure:ITEM <type>,CHAN<n>` | `:MEASure:ITEM? <type>,CHAN<n>` | `:MEASure:CLEar ALL` |
| Siglent | `PACU <type>,C<n>` | `C<n>:PAVA? <type>` | `PACL` |
| Keysight | `:MEASure:<type> CHANnel<n>` | `:MEASure:<type>? CHANnel<n>` | `:MEASure:CLEar` |
| Tektronix | `MEASUrement:MEAS<n>:SOUrce CH<n>` + `MEASUrement:MEAS<n>:TYPe <type>` | `MEASUrement:MEAS<n>:VALue?` | `MEASUrement:DELete:ALL` |
| R&S | `MEASurement<n>:SOURce CH<n>` + `MEASurement<n>:MAIN <type>` | `MEASurement<n>:RESult?` | (delete specific) |
| LeCroy | `PACU <type>,C<n>` | `C<n>:PAVA? <type>` | `PACL` |

### Quick Measurement Examples

```
# Rigol - Measure frequency on CH1
:MEASure:ITEM FREQuency,CHANnel1
:MEASure:ITEM? FREQuency,CHANnel1    → 1.000000e+06

# Siglent - Measure Vpp on C1
PACU PKPK,C1
C1:PAVA? PKPK                        → C1:PAVA PKPK,3.28V

# Keysight - Measure rise time on CH1
:MEASure:RISetime CHANnel1
:MEASure:RISetime? CHANnel1          → +1.234E-09

# Tektronix - Measure period on CH1
MEASUrement:MEAS1:SOUrce1 CH1
MEASUrement:MEAS1:TYPe PERIOD
MEASUrement:MEAS1:VALue?             → 1.0E-6
```

---

## Waveform Data Transfer

### Waveform Data Format

| Vendor | Command | Options |
|--------|---------|---------|
| Rigol | `:WAVeform:FORMat {WORD|BYTE|ASCii}` | 16-bit, 8-bit, ASCII |
| Siglent | `WFSU SP,<n>,NP,<pts>,FP,<first>` | Setup parameters |
| Keysight | `:WAVeform:FORMat {WORD|BYTE|ASCii}` | |
| Tektronix | `DATa:ENCdg {ASCii|RIBinary|RPBinary|SRIbinary|SRPbinary}` | Various formats |
| R&S | `FORMat[:DATA] {ASCii|REAL|INT8|INT16}` | |
| LeCroy | (returns binary with header) | |

### Waveform Source Selection

| Vendor | Command | Options |
|--------|---------|---------|
| Rigol | `:WAVeform:SOURce {CHAN1|CHAN2|CHAN3|CHAN4|MATH|D0-D15}` | |
| Siglent | `C<n>:WF?` | Query directly per channel |
| Keysight | `:WAVeform:SOURce {CHANnel1|CHANnel2|MATH|...}` | |
| Tektronix | `DATa:SOUrce CH<n>` | |
| R&S | `CHANnel<n>:DATA?` | Per channel |
| LeCroy | `C<n>:WF?` | Per channel |

### Get Waveform Data

| Vendor | Command | Returns |
|--------|---------|---------|
| Rigol | `:WAVeform:DATA?` | IEEE 488.2 binary block |
| Siglent | `C<n>:WF? DAT2` | Binary with descriptor |
| Keysight | `:WAVeform:DATA?` | IEEE 488.2 binary block |
| Tektronix | `CURVe?` | Binary data |
| R&S | `CHANnel<n>:DATA?` | Binary data |
| LeCroy | `C<n>:WF? DAT1` | With WAVEDESC header |

### Waveform Preamble/Parameters

| Vendor | Command | Returns |
|--------|---------|---------|
| Rigol | `:WAVeform:PREamble?` | 10 comma-separated values |
| Siglent | (in WAVEDESC header) | |
| Keysight | `:WAVeform:PREamble?` | 10 comma-separated values |
| Tektronix | `WFMOutpre?` | Waveform preamble |
| R&S | `CHANnel<n>:DATA:HEADer?` | Header info |
| LeCroy | (in WAVEDESC) | |

### Rigol/Keysight Preamble Format

```
<format>,<type>,<points>,<count>,<xinc>,<xorigin>,<xref>,<yinc>,<yorigin>,<yref>

format:   0=BYTE, 1=WORD, 2=ASCII
type:     0=NORMal, 1=MAXimum, 2=RAW
points:   Number of data points
count:    1 for normal mode
xinc:     Time between points (s)
xorigin:  First point time offset (s)
xref:     X reference
yinc:     Voltage per bit
yorigin:  Y origin
yref:     Y reference (code for 0V)
```

### Converting Raw Data to Voltage

```typescript
// For 8-bit data (BYTE format)
function rawToVoltage(raw: number[], preamble: number[]): number[] {
  const yinc = preamble[7];
  const yorigin = preamble[8];
  const yref = preamble[9];

  return raw.map(r => (r - yorigin - yref) * yinc);
}

// For 16-bit data (WORD format)
function rawToVoltage16(raw: number[], preamble: number[]): number[] {
  const yinc = preamble[7];
  const yorigin = preamble[8];
  const yref = preamble[9];

  return raw.map(r => (r - yref) * yinc + yorigin);
}
```

---

## Math and FFT

### Math Enable

| Vendor | Command | Options |
|--------|---------|---------|
| Rigol | `:MATH:DISPlay {ON|OFF}` | |
| Siglent | `MATH:DEF EQN,'<expr>'` | Expression based |
| Keysight | `:FUNCtion:DISPlay {ON|OFF}` | |
| Tektronix | `MATH:ADDNew "MATH1"` | Add math channel |
| R&S | `CALCulate:MATH<n>:STATe {ON|OFF}` | |

### Math Operations

| Vendor | Add | Subtract | Multiply | Divide |
|--------|-----|----------|----------|--------|
| Rigol | `:MATH:OPERator ADD` | `:MATH:OPERator SUBTract` | `:MATH:OPERator MULTiply` | `:MATH:OPERator DIVision` |
| Siglent | `MATH:DEF EQN,'C1+C2'` | `MATH:DEF EQN,'C1-C2'` | `MATH:DEF EQN,'C1*C2'` | `MATH:DEF EQN,'C1/C2'` |
| Keysight | `:FUNCtion:OPERation ADD` | `:FUNCtion:OPERation SUBT` | `:FUNCtion:OPERation MULT` | `:FUNCtion:OPERation DIV` |
| Tektronix | `MATH1:DEFine "CH1+CH2"` | `MATH1:DEFine "CH1-CH2"` | `MATH1:DEFine "CH1*CH2"` | `MATH1:DEFine "CH1/CH2"` |

### FFT

| Vendor | Enable FFT | Source | Window |
|--------|------------|--------|--------|
| Rigol | `:MATH:OPERator FFT` | `:MATH:SOURce1 CHAN<n>` | `:MATH:FFT:WINDow {RECT|HANN|HAMM|BLAC|FLAT}` |
| Siglent | `MATH:DEF EQN,'FFT(C<n>)'` | In expression | `MATH:FFT:WINDow {RECT|HAMM|HANN|BLAC|FLAT}` |
| Keysight | `:FUNCtion:OPERation FFT` | `:FUNCtion:SOURce1 CHAN<n>` | `:FUNCtion:FFT:WINDow {RECT|HANN|FLAT|BHAR}` |
| Tektronix | `MATH1:DEFine "FFT(CH1)"` | In expression | `MATH1:SPECtral:WINdow {HANNing|RECTangular|HAMMing|BLACkmanharris}` |
| R&S | `CALC:MATH<n>:TYPE FFT` | `CALC:MATH<n>:SOURce CH<n>` | `CALC:MATH<n>:FFT:WINDow {RECTangle|HAMMing|HANNing|BLACkman|FLATtop}` |

---

## Cursors

### Cursor Mode

| Vendor | Manual | Track | Measure |
|--------|--------|-------|---------|
| Rigol | `:CURSor:MODE MANual` | `:CURSor:MODE TRACk` | `:CURSor:MODE AUTO` |
| Siglent | `CRMS OFF` (manual) | | `CRMS ON` |
| Keysight | `:MARKer:MODE WAVeform` | `:MARKer:MODE MEASurement` | |
| Tektronix | `CURSor:MODe TRACK` | | |

### Cursor Position

| Vendor | X1 | X2 | Y1 | Y2 |
|--------|----|----|----|----|
| Rigol | `:CURSor:MANual:AX <s>` | `:CURSor:MANual:BX <s>` | `:CURSor:MANual:AY <v>` | `:CURSor:MANual:BY <v>` |
| Siglent | `C<n>:CRST HREF,<s>` | `C<n>:CRST HDIF,<s>` | `C<n>:CRST VREF,<v>` | `C<n>:CRST VDIF,<v>` |
| Keysight | `:MARKer:X1Position <s>` | `:MARKer:X2Position <s>` | `:MARKer:Y1Position <v>` | `:MARKer:Y2Position <v>` |
| Tektronix | `CURSor:WAVeform:POSITION1 <s>` | `CURSor:WAVeform:POSITION2 <s>` | | |

### Cursor Readout

| Vendor | Delta X | Delta Y | Query |
|--------|---------|---------|-------|
| Rigol | `:CURSor:MANual:AXValue?` ... | `:CURSor:MANual:AYValue?` ... | |
| Keysight | `:MARKer:XDELta?` | `:MARKer:YDELta?` | |
| Tektronix | `CURSor:WAVeform:HDELTA?` | `CURSor:WAVeform:VDELTA?` | |

---

## Display Control

### Screen Brightness/Intensity

| Vendor | Command |
|--------|---------|
| Rigol | `:DISPlay:BRIGhtness <0-100>` |
| Siglent | `INTS <value>` |
| Keysight | `:DISPlay:INTensity:WAVeform <0-100>` |
| Tektronix | `DISplay:INTENSITy:WAVEform <1-100>` |
| R&S | `DISPlay:WAVeform:INTensity <0-100>` |

### Grid Display

| Vendor | Command | Options |
|--------|---------|---------|
| Rigol | `:DISPlay:GRID {FULL|HALF|NONE}` | |
| Siglent | `GRDS {FULL|HALF|OFF}` | |
| Keysight | `:DISPlay:GRID {ON|OFF}` | |
| Tektronix | `DISplay:GRAticule {FULL|GRID|CROSs|FRAMe|SOLid}` | |

### Persistence

| Vendor | Command | Options |
|--------|---------|---------|
| Rigol | `:DISPlay:PERSistence {MIN|<time>|INFinite}` | |
| Siglent | `PESU {OFF|1|2|5|10|INF}` | Seconds or INF |
| Keysight | `:DISPlay:PERSistence {MINimum|INFinite|<time>}` | |
| Tektronix | `DISplay:PERSistence {OFF|INFPersist|VARpersist}` | |

---

## Screenshot/Hardcopy

### Get Screenshot

| Vendor | Command | Format |
|--------|---------|--------|
| Rigol | `:DISPlay:DATA? {ON|OFF},{NORM|INVERT},{BMP24|BMP8|PNG|JPEG|TIFF}` | Binary image |
| Siglent | `SCDP` | BMP/PNG data |
| Keysight | `:DISPlay:DATA? {BMP|PNG}` | Binary image |
| Tektronix | `HARDCopy STARt` | To configured destination |
| Tektronix | `SAVe:IMAGe "<filename>"` | Save to file |
| R&S | `HCOPy:DATA?` | Binary image |
| LeCroy | `SCDP` | Screen capture |

### Screenshot to USB

| Vendor | Command |
|--------|---------|
| Rigol | `:HCOPy:SDATe:SNAP` |
| Keysight | `:DISK:SAVE:IMAGe "<path>"` |
| Tektronix | `SAVe:IMAGe "E:/screenshot.png"` |

---

## Serial Decode (Optional)

Many oscilloscopes support serial protocol decode (I2C, SPI, UART, CAN, etc.):

### Enable Decode

| Vendor | Command | Protocols |
|--------|---------|-----------|
| Rigol | `:DECoder1:MODE {PARallel|UART|I2C|SPI}` | UART, I2C, SPI, CAN, LIN |
| Siglent | `DCOD:STAT ON` | UART, I2C, SPI, CAN, LIN |
| Keysight | `:SBUS1:MODE {UART|I2C|SPI|CAN}` | Model dependent |
| Tektronix | `BUS:B<n>:TYPe {I2C|SPI|RS232|CAN|LIN}` | |
| R&S | `BUS<n>:TYPE {I2C|SPI|UART|CAN|LIN}` | |

### UART Settings Example

```
# Rigol
:DECoder1:MODE UART
:DECoder1:UART:TX CHANnel1
:DECoder1:UART:BAUD 115200
:DECoder1:UART:BITS 8
:DECoder1:UART:STOP 1
:DECoder1:UART:PARity NONE
:DECoder1:DISPlay ON

# Keysight
:SBUS1:MODE UART
:SBUS1:UART:SOURce CHANnel1
:SBUS1:UART:BAUD 115200
:SBUS1:UART:BITs 8
:SBUS1:DISPlay ON
```

---

## Vendor Command Variations Summary

| Function | Rigol DS1000Z | Siglent SDS | Keysight InfiniiVision | Tektronix MSO |
|----------|---------------|-------------|------------------------|---------------|
| Run | `:RUN` | `:RUN` | `:RUN` | `ACQ:STATE RUN` |
| Stop | `:STOP` | `:STOP` | `:STOP` | `ACQ:STATE STOP` |
| Single | `:SINGle` | `:SINGle` | `:SINGle` | `ACQ:STOPAFTER SEQ` |
| V/div | `:CHAN1:SCAL <v>` | `C1:VDIV <v>` | `:CHAN1:SCAL <v>` | `CH1:SCA <v>` |
| T/div | `:TIM:SCAL <s>` | `TDIV <s>` | `:TIM:SCAL <s>` | `HOR:SCA <s>` |
| Trig level | `:TRIG:EDG:LEV <v>` | `C1:TRLV <v>` | `:TRIG:LEV <v>` | `TRIG:A:LEV:CH1 <v>` |
| Trig source | `:TRIG:EDG:SOUR CH1` | `TRSE EDGE,SR,C1` | `:TRIG:EDG:SOUR CHAN1` | `TRIG:A:EDG:SOU CH1` |
| Measure freq | `:MEAS:FREQ? CH1` | `C1:PAVA? FREQ` | `:MEAS:FREQ? CHAN1` | `MEAS:MEAS1:VAL?` |
| Get data | `:WAV:DATA?` | `C1:WF? DAT2` | `:WAV:DATA?` | `CURV?` |
| Screenshot | `:DISP:DATA? ON,OFF,PNG` | `SCDP` | `:DISP:DATA? PNG` | `HARDCOPY START` |

---

## Abstract Driver Interface

```typescript
interface OscilloscopeChannel {
  /** Channel number (1-indexed) */
  readonly number: number;

  /** Display enable/disable */
  enabled: boolean;

  /** Vertical scale (V/div) */
  scale: number;

  /** Vertical offset (V) */
  offset: number;

  /** Coupling mode */
  coupling: 'AC' | 'DC' | 'GND';

  /** Probe attenuation ratio */
  probeAttenuation: number;

  /** Bandwidth limit enabled */
  bandwidthLimit: boolean;
}

interface OscilloscopeTrigger {
  /** Trigger mode */
  mode: 'auto' | 'normal' | 'single';

  /** Trigger type */
  type: 'edge' | 'pulse' | 'video' | 'pattern';

  /** Trigger source channel */
  source: number | 'external' | 'line';

  /** Edge slope */
  slope: 'rising' | 'falling' | 'either';

  /** Trigger level (V) */
  level: number;

  /** Trigger coupling */
  coupling: 'AC' | 'DC' | 'LFReject' | 'HFReject';

  /** Holdoff time (s) */
  holdoff: number;
}

interface OscilloscopeTimebase {
  /** Time scale (s/div) */
  scale: number;

  /** Horizontal position/delay (s) */
  position: number;

  /** Timebase mode */
  mode: 'main' | 'window' | 'xy' | 'roll';
}

interface OscilloscopeAcquisition {
  /** Acquisition mode */
  mode: 'sample' | 'average' | 'peakDetect' | 'highRes';

  /** Average count (when mode is 'average') */
  averageCount: number;

  /** Memory depth (points) */
  memoryDepth: number;

  /** Sample rate (read-only) */
  readonly sampleRate: number;
}

interface WaveformData {
  /** Raw sample data */
  samples: number[];

  /** Time between samples (s) */
  xIncrement: number;

  /** Time of first sample (s) */
  xOrigin: number;

  /** Voltage per LSB */
  yIncrement: number;

  /** Y offset */
  yOrigin: number;
}

interface Oscilloscope {
  /** Identification */
  identify(): Promise<Result<string, Error>>;

  /** Reset to defaults */
  reset(): Promise<Result<void, Error>>;

  /** Start continuous acquisition */
  run(): Promise<Result<void, Error>>;

  /** Stop acquisition */
  stop(): Promise<Result<void, Error>>;

  /** Single trigger acquisition */
  single(): Promise<Result<void, Error>>;

  /** Force trigger */
  forceTrigger(): Promise<Result<void, Error>>;

  /** Number of channels */
  readonly channelCount: number;

  /** Access channel by number (1-indexed) */
  channel(n: number): OscilloscopeChannel;

  /** Trigger settings */
  readonly trigger: OscilloscopeTrigger;

  /** Timebase settings */
  readonly timebase: OscilloscopeTimebase;

  /** Acquisition settings */
  readonly acquisition: OscilloscopeAcquisition;

  /** Get waveform data from channel */
  getWaveform(channel: number): Promise<Result<WaveformData, Error>>;

  /** Measure a parameter */
  measure(
    channel: number,
    measurement: 'frequency' | 'period' | 'vpp' | 'vrms' | 'vmax' | 'vmin' | 'rise' | 'fall' | 'dutyCycle'
  ): Promise<Result<number, Error>>;

  /** Get screenshot as binary image data */
  screenshot(format?: 'png' | 'bmp'): Promise<Result<Uint8Array, Error>>;

  /** Save setup to memory slot */
  saveSetup(slot: number): Promise<Result<void, Error>>;

  /** Recall setup from memory slot */
  recallSetup(slot: number): Promise<Result<void, Error>>;
}
```

---

## Command Translation Table

| Driver Method | Rigol DS1000Z | Siglent SDS | Keysight | Tektronix |
|---------------|---------------|-------------|----------|-----------|
| `identify()` | `*IDN?` | `*IDN?` | `*IDN?` | `*IDN?` |
| `reset()` | `*RST` | `*RST` | `*RST` | `*RST` |
| `run()` | `:RUN` | `:RUN` | `:RUN` | `ACQ:STATE RUN` |
| `stop()` | `:STOP` | `:STOP` | `:STOP` | `ACQ:STATE STOP` |
| `single()` | `:SINGle` | `:SINGle` | `:SINGle` | `ACQ:STOPAFTER SEQ;ACQ:STATE RUN` |
| `channel(1).scale = 1.0` | `:CHAN1:SCAL 1.0` | `C1:VDIV 1V` | `:CHAN1:SCAL 1.0` | `CH1:SCA 1.0` |
| `channel(1).offset = 0.5` | `:CHAN1:OFFS 0.5` | `C1:OFST 0.5V` | `:CHAN1:OFFS 0.5` | `CH1:OFFS 0.5` |
| `channel(1).enabled = true` | `:CHAN1:DISP ON` | `C1:TRA ON` | `:CHAN1:DISP ON` | `SEL:CH1 ON` |
| `timebase.scale = 0.001` | `:TIM:SCAL 1E-3` | `TDIV 1MS` | `:TIM:SCAL 1E-3` | `HOR:SCA 1E-3` |
| `trigger.level = 1.5` | `:TRIG:EDG:LEV 1.5` | `C1:TRLV 1.5V` | `:TRIG:LEV 1.5` | `TRIG:A:LEV:CH1 1.5` |
| `trigger.source = 1` | `:TRIG:EDG:SOUR CH1` | `TRSE EDGE,SR,C1` | `:TRIG:EDG:SOUR CHAN1` | `TRIG:A:EDG:SOU CH1` |
| `measure(1, 'frequency')` | `:MEAS:ITEM FREQ,CH1;:MEAS:ITEM? FREQ,CH1` | `C1:PAVA? FREQ` | `:MEAS:FREQ? CHAN1` | (setup + query) |
| `getWaveform(1)` | `:WAV:SOUR CH1;:WAV:MODE NORM;:WAV:FORM BYTE;:WAV:DATA?` | `C1:WF? DAT2` | `:WAV:SOUR CHAN1;:WAV:FORM BYTE;:WAV:DATA?` | `DATA:SOU CH1;CURV?` |
| `screenshot('png')` | `:DISP:DATA? ON,OFF,PNG` | `SCDP` | `:DISP:DATA? PNG` | `SAVE:IMAGE` |

---

## Vendor Detection Patterns

```typescript
const OSC_VENDORS = {
  rigol: {
    patterns: [
      /RIGOL.*DS1\d{3}/i,   // DS1000Z series
      /RIGOL.*DS2\d{3}/i,   // DS2000 series
      /RIGOL.*MSO5\d{3}/i,  // MSO5000 series
      /RIGOL.*DHO\d{3}/i,   // DHO series
    ],
    driver: 'RigolDSODriver',
  },
  siglent: {
    patterns: [
      /Siglent.*SDS\d{4}/i,
      /Siglent.*SDS\d{3}/i,
    ],
    driver: 'SiglentSDSDriver',
  },
  keysight: {
    patterns: [
      /Keysight.*DSOX\d{4}/i,
      /Keysight.*MSOX\d{4}/i,
      /Keysight.*EDUX\d{4}/i,
      /Agilent.*DSO-X/i,
      /Agilent.*MSO-X/i,
    ],
    driver: 'KeysightInfiniiVisionDriver',
  },
  tektronix: {
    patterns: [
      /TEKTRONIX.*TBS\d{4}/i,
      /TEKTRONIX.*TDS\d{4}/i,
      /TEKTRONIX.*MSO4\d/i,
      /TEKTRONIX.*MSO5\d/i,
      /TEKTRONIX.*MSO6\d/i,
    ],
    driver: 'TektronixMSODriver',
  },
  rohde_schwarz: {
    patterns: [
      /Rohde.*RTB\d{4}/i,
      /Rohde.*RTM\d{4}/i,
      /Rohde.*RTO\d{4}/i,
      /Rohde.*RTE\d{4}/i,
    ],
    driver: 'RohdeSchwarzRTDriver',
  },
  lecroy: {
    patterns: [
      /LECROY.*WAVEACE/i,
      /LECROY.*WAVESURFER/i,
      /LECROY.*WAVEPRO/i,
      /LECROY.*HDO\d{4}/i,
    ],
    driver: 'LeCroyDriver',
  },
};
```

---

## Connection Reference

| Vendor | USB VID:PID | Default TCP Port | GPIB | Notes |
|--------|-------------|------------------|------|-------|
| Rigol | 1AB1:04CE (DS1000Z) | 5555 | Optional | VXI-11 or raw socket |
| Siglent | F4EC:EE38 | 5025 | Optional | USBTMC or socket |
| Keysight | 0957:xxxx | 5025 | Yes | VISA recommended |
| Tektronix | 0699:xxxx | 4000 | Yes | VISA recommended |
| R&S | 0AAD:xxxx | 5025 | Yes | HiSLIP supported |
| LeCroy | varies | 5025 | Optional | |

---

## Programming Examples

### Basic Acquisition

```typescript
const rm = createResourceManager();
const scope = await rm.open('TCPIP0::192.168.1.100::5555::SOCKET');

// Reset and configure
await scope.write('*RST');
await scope.write(':CHAN1:DISP ON');
await scope.write(':CHAN1:SCAL 1.0');      // 1V/div
await scope.write(':TIM:SCAL 0.001');      // 1ms/div
await scope.write(':TRIG:EDG:SOUR CHAN1');
await scope.write(':TRIG:EDG:LEV 0.5');    // 500mV trigger

// Run and wait for trigger
await scope.write(':SINGle');
await scope.query('*OPC?');

// Measure frequency
const freq = await scope.query(':MEAS:ITEM? FREQuency,CHANnel1');
console.log(`Frequency: ${freq.value} Hz`);

await scope.close();
```

### Waveform Capture

```typescript
// Configure waveform format
await scope.write(':WAV:SOUR CHAN1');
await scope.write(':WAV:MODE NORM');
await scope.write(':WAV:FORM BYTE');

// Get preamble and data
const preambleStr = await scope.query(':WAV:PRE?');
const preamble = preambleStr.value.split(',').map(Number);

const dataResult = await scope.queryBinary(':WAV:DATA?');
const rawData = dataResult.value;

// Convert to voltage
const yinc = preamble[7];
const yorigin = preamble[8];
const yref = preamble[9];
const xinc = preamble[4];

const voltages = rawData.map(d => (d - yorigin - yref) * yinc);
const times = rawData.map((_, i) => i * xinc);

console.log(`Captured ${voltages.length} points`);
console.log(`Sample rate: ${1/xinc} Sa/s`);
```

### Screenshot Capture

```typescript
// Rigol
const imageData = await scope.queryBinary(':DISP:DATA? ON,OFF,PNG');
fs.writeFileSync('screenshot.png', imageData.value);

// Keysight
const imageData = await scope.queryBinary(':DISP:DATA? PNG');
fs.writeFileSync('screenshot.png', imageData.value);
```

---

## Notes

1. **Command Termination**: Most use LF (`\n`). Rigol accepts both LF and CR+LF.

2. **Binary Data**: Waveform transfers use IEEE 488.2 binary block format: `#<n><length><data>` where n is number of digits in length.

3. **Trigger Status**: Check trigger status before reading waveform to ensure valid data.

4. **Memory Depth vs Points**: Waveform query may return fewer points than memory depth depending on mode settings.

5. **Probe Compensation**: After changing probe attenuation, waveform scaling changes automatically.

6. **XY Mode**: In XY mode, CH1 is X and CH2 is Y. Timebase commands may be ignored.

7. **Roll Mode**: Automatically enabled at slow timebases (>50ms/div typical). No triggering in roll mode.

8. **MSO Channels**: Mixed signal oscilloscopes have digital channels (D0-D15) accessed separately.
