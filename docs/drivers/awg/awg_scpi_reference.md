# Arbitrary Waveform Generator (AWG) SCPI Command Reference

> Comprehensive multi-vendor SCPI reference for function/arbitrary waveform generators
> Covers entry-level through professional-grade instruments

## Instrument Coverage

### Entry Level ($200-$600)

| Vendor | Model Series | Channels | Max Freq | Sample Rate | Interface | Notes |
|--------|--------------|----------|----------|-------------|-----------|-------|
| Rigol | DG811/DG812 | 1/2 | 10 MHz | 125 MSa/s | USB/LAN | Basic AFG |
| Rigol | DG821/DG822 | 1/2 | 25 MHz | 125 MSa/s | USB/LAN | |
| Rigol | DG1022Z | 2 | 25 MHz | 200 MSa/s | USB/LAN | Popular entry |
| Rigol | DG1032Z | 2 | 30 MHz | 200 MSa/s | USB/LAN | |
| Siglent | SDG1032X | 2 | 30 MHz | 150 MSa/s | USB/LAN | |
| Siglent | SDG1062X | 2 | 60 MHz | 150 MSa/s | USB/LAN | |
| BK Precision | 4052 | 2 | 5 MHz | 125 MSa/s | USB | Basic |
| BK Precision | 4054B | 2 | 15 MHz | 150 MSa/s | USB/LAN | |
| GW Instek | AFG-2225 | 2 | 25 MHz | 200 MSa/s | USB | |

### Mid-Range ($600-$3000)

| Vendor | Model Series | Channels | Max Freq | Sample Rate | Interface | Notes |
|--------|--------------|----------|----------|-------------|-----------|-------|
| Rigol | DG2052/DG2072 | 2 | 50/70 MHz | 250 MSa/s | USB/LAN | |
| Rigol | DG2102 | 2 | 100 MHz | 250 MSa/s | USB/LAN | |
| Siglent | SDG2042X | 2 | 40 MHz | 1.2 GSa/s | USB/LAN | High sample rate |
| Siglent | SDG2082X | 2 | 80 MHz | 1.2 GSa/s | USB/LAN | |
| Siglent | SDG2122X | 2 | 120 MHz | 1.2 GSa/s | USB/LAN | |
| Siglent | SDG6000X | 2 | 200-500 MHz | 2.4 GSa/s | USB/LAN | Pro features |
| Tektronix | AFG1022 | 2 | 25 MHz | 125 MSa/s | USB/LAN | Entry Tek |
| Tektronix | AFG1062 | 2 | 60 MHz | 300 MSa/s | USB/LAN | |
| Keysight | 33210A | 1 | 10 MHz | 50 MSa/s | USB/GPIB | Legacy |
| Keysight | 33500B | 1/2 | 20-30 MHz | 250 MSa/s | USB/LAN | Trueform |

### Professional ($3000+)

| Vendor | Model Series | Channels | Max Freq | Sample Rate | Interface | Notes |
|--------|--------------|----------|----------|-------------|-----------|-------|
| Keysight | 33600A | 2 | 80-120 MHz | 1 GSa/s | USB/LAN/GPIB | Trueform |
| Keysight | 81160A | 2 | 330 MHz | 2.5 GSa/s | USB/LAN/GPIB | Pulse generator |
| Tektronix | AFG3000C | 2 | 25-250 MHz | 1-2 GSa/s | USB/LAN/GPIB | Full featured |
| Tektronix | AFG31000 | 2 | 25-250 MHz | 2 GSa/s | USB/LAN | Modern AFG |
| Tektronix | AWG5200 | 4 | DC-2.5 GHz | 5 GSa/s | USB/LAN/GPIB | True AWG |
| Tektronix | AWG70000 | 2 | DC-20 GHz | 50 GSa/s | USB/LAN/GPIB | Ultra high-end |
| R&S | SMC100A | 1 | 1.1-3.2 GHz | - | USB/LAN/GPIB | RF signal gen |
| R&S | SMW200A | 2 | 100 kHz-44 GHz | - | USB/LAN/GPIB | Vector signal |
| Tabor | WS8352 | 2 | 350 MHz | 1 GSa/s | USB/LAN/GPIB | |
| Tabor | Proteus | 4 | DC-9 GHz | 2.5 GSa/s | USB/LAN | AWG + digitizer |

---

## IEEE 488.2 Common Commands (Universal)

```
*IDN?                → Instrument identification
*RST                 → Reset to default state
*CLS                 → Clear status registers
*ESE <mask>          → Event status enable register
*ESE?                → Query event status enable
*ESR?                → Query event status register
*OPC                 → Operation complete
*OPC?                → Query operation complete
*SRE <mask>          → Service request enable register
*SRE?                → Query service request enable
*STB?                → Query status byte
*TRG                 → Software trigger
*TST?                → Self-test
*WAI                 → Wait for operations complete
*SAV <n>             → Save state to memory
*RCL <n>             → Recall state from memory
```

---

## Channel Selection

### Channel Addressing Patterns

| Vendor | Pattern | Example |
|--------|---------|---------|
| Rigol | `:SOURce<n>:` | `:SOUR1:FREQ 1000` |
| Siglent | `C<n>:` | `C1:BSWV FRQ,1000` |
| Keysight 33500 | `[SOURce[<n>]]:` | `:SOUR:FREQ 1000` or `:SOUR1:FREQ 1000` |
| Tektronix | `SOURce<n>:` | `SOUR1:FREQ 1000` |
| R&S | `[SOURce<n>]:` | `:SOUR1:FREQ 1000` |

### Select Active Channel

| Vendor | Command | Notes |
|--------|---------|-------|
| Rigol | (channel in command) | `:SOUR1:...`, `:SOUR2:...` |
| Siglent | (channel in prefix) | `C1:...`, `C2:...` |
| Keysight | `:INSTrument:SELect {CH1|CH2}` or use `:SOURce<n>:` | |
| Tektronix | (channel in command) | `SOUR1:...`, `SOUR2:...` |

---

## Output Enable/Disable

| Vendor | Enable | Disable | Query |
|--------|--------|---------|-------|
| Rigol | `:OUTPut<n>[:STATe] ON` | `:OUTPut<n>[:STATe] OFF` | `:OUTPut<n>?` |
| Siglent | `C<n>:OUTP ON` | `C<n>:OUTP OFF` | `C<n>:OUTP?` |
| Keysight | `:OUTPut[<n>][:STATe] ON` | `:OUTPut[<n>][:STATe] OFF` | `:OUTPut[<n>]?` |
| Tektronix | `OUTPut<n>:STATe ON` | `OUTPut<n>:STATe OFF` | `OUTPut<n>:STATe?` |
| R&S | `:OUTPut<n>[:STATe] ON` | `:OUTPut<n>[:STATe] OFF` | `:OUTPut<n>?` |

---

## Waveform Selection

### Standard Waveforms

| Waveform | Rigol | Siglent | Keysight | Tektronix |
|----------|-------|---------|----------|-----------|
| Sine | `SINusoid` | `SINE` | `SINusoid` | `SINusoid` |
| Square | `SQUare` | `SQUARE` | `SQUare` | `SQUare` |
| Ramp/Triangle | `RAMP` | `RAMP` | `RAMP` | `RAMP` |
| Pulse | `PULSe` | `PULSE` | `PULSe` | `PULSe` |
| Noise | `NOISe` | `NOISE` | `NOISe` | `NOISe` |
| DC | `DC` | `DC` | `DC` | `DC` |
| Arbitrary | `ARB` or `USER` | `ARB` | `ARB` | `ARB` |

### Set Waveform Type

| Vendor | Command | Example |
|--------|---------|---------|
| Rigol | `:SOURce<n>:FUNCtion[:SHAPe] <type>` | `:SOUR1:FUNC SIN` |
| Siglent | `C<n>:BSWV WVTP,<type>` | `C1:BSWV WVTP,SINE` |
| Keysight | `[SOURce<n>:]FUNCtion[:SHAPe] <type>` | `:FUNC SIN` |
| Tektronix | `SOURce<n>:FUNCtion[:SHAPe] <type>` | `SOUR1:FUNC SIN` |
| R&S | `[SOURce<n>:]FUNCtion[:SHAPe] <type>` | `:FUNC SIN` |

### Query Waveform Type

| Vendor | Command | Returns |
|--------|---------|---------|
| Rigol | `:SOURce<n>:FUNCtion?` | `SIN`, `SQU`, `RAMP`, etc. |
| Siglent | `C<n>:BSWV?` | Full parameter string |
| Keysight | `:FUNCtion?` | `SIN`, `SQU`, `RAMP`, etc. |
| Tektronix | `SOURce<n>:FUNCtion?` | `SINusoid`, `SQUare`, etc. |

---

## Frequency Commands

### Set Frequency

| Vendor | Command | Units |
|--------|---------|-------|
| Rigol | `:SOURce<n>:FREQuency[:FIXed] <freq>` | Hz |
| Siglent | `C<n>:BSWV FRQ,<freq>` | Hz |
| Keysight | `[SOURce<n>:]FREQuency[:FIXed] <freq>` | Hz |
| Tektronix | `SOURce<n>:FREQuency[:FIXed] <freq>` | Hz |
| R&S | `[SOURce<n>:]FREQuency[:CW|FIXed] <freq>` | Hz |

### Query Frequency

| Vendor | Command |
|--------|---------|
| Rigol | `:SOURce<n>:FREQuency?` |
| Siglent | `C<n>:BSWV?` (parse FRQ field) |
| Keysight | `:FREQuency?` |
| Tektronix | `SOURce<n>:FREQuency?` |

### Frequency Examples

```
# Rigol - 1 kHz
:SOUR1:FREQ 1000
:SOUR1:FREQ 1E3
:SOUR1:FREQ 1 kHz          # Some support unit suffix

# Siglent - 1 MHz
C1:BSWV FRQ,1000000

# Keysight - 10 kHz
:FREQ 10E3

# Tektronix - 100 Hz
SOUR1:FREQ 100
```

---

## Amplitude Commands

### Set Amplitude (Vpp)

| Vendor | Command | Units |
|--------|---------|-------|
| Rigol | `:SOURce<n>:VOLTage[:LEVel][:IMMediate][:AMPLitude] <vpp>` | Vpp |
| Siglent | `C<n>:BSWV AMP,<vpp>` | Vpp |
| Keysight | `[SOURce<n>:]VOLTage[:LEVel][:IMMediate][:AMPLitude] <vpp>` | Vpp |
| Tektronix | `SOURce<n>:VOLTage[:LEVel][:IMMediate][:AMPLitude] <vpp>` | Vpp |
| R&S | `[SOURce<n>:]VOLTage[:LEVel][:IMMediate][:AMPLitude] <vpp>` | Vpp |

### Set Amplitude (Vrms)

| Vendor | Command |
|--------|---------|
| Rigol | `:SOURce<n>:VOLTage:UNIT VRMS` then `:SOURce<n>:VOLTage <vrms>` |
| Siglent | `C<n>:BSWV AMPVRMS,<vrms>` |
| Keysight | `:VOLTage:UNIT VRMS` then `:VOLTage <vrms>` |
| Tektronix | `SOURce<n>:VOLTage:UNIT VRMS` |

### Set Amplitude (dBm)

| Vendor | Command |
|--------|---------|
| Rigol | `:SOURce<n>:VOLTage:UNIT DBM` then `:SOURce<n>:VOLTage <dbm>` |
| Siglent | (use Vpp conversion) |
| Keysight | `:VOLTage:UNIT DBM` then `:VOLTage <dbm>` |
| Tektronix | `SOURce<n>:VOLTage:UNIT DBM` |

### Query Amplitude

| Vendor | Command |
|--------|---------|
| Rigol | `:SOURce<n>:VOLTage?` |
| Siglent | `C<n>:BSWV?` (parse AMP field) |
| Keysight | `:VOLTage?` |
| Tektronix | `SOURce<n>:VOLTage?` |

---

## Offset Commands

### Set DC Offset

| Vendor | Command | Units |
|--------|---------|-------|
| Rigol | `:SOURce<n>:VOLTage:OFFSet <offset>` | V |
| Siglent | `C<n>:BSWV OFST,<offset>` | V |
| Keysight | `[SOURce<n>:]VOLTage:OFFSet <offset>` | V |
| Tektronix | `SOURce<n>:VOLTage:OFFSet <offset>` | V |
| R&S | `[SOURce<n>:]VOLTage:OFFSet <offset>` | V |

### Query Offset

| Vendor | Command |
|--------|---------|
| Rigol | `:SOURce<n>:VOLTage:OFFSet?` |
| Siglent | `C<n>:BSWV?` (parse OFST field) |
| Keysight | `:VOLTage:OFFSet?` |
| Tektronix | `SOURce<n>:VOLTage:OFFSet?` |

### High/Low Level (Alternative to Vpp + Offset)

| Vendor | High Level | Low Level |
|--------|------------|-----------|
| Rigol | `:SOURce<n>:VOLTage:HIGH <v>` | `:SOURce<n>:VOLTage:LOW <v>` |
| Keysight | `:VOLTage:HIGH <v>` | `:VOLTage:LOW <v>` |
| Tektronix | `SOURce<n>:VOLTage:HIGH <v>` | `SOURce<n>:VOLTage:LOW <v>` |

---

## Phase Commands

### Set Phase

| Vendor | Command | Units |
|--------|---------|-------|
| Rigol | `:SOURce<n>:PHASe[:ADJust] <degrees>` | Degrees |
| Siglent | `C<n>:BSWV PHSE,<degrees>` | Degrees |
| Keysight | `[SOURce<n>:]PHASe[:ADJust] <degrees>` | Degrees |
| Tektronix | `SOURce<n>:PHASe[:ADJust] <degrees>` | Degrees |

### Synchronize Phase (Align Channels)

| Vendor | Command |
|--------|---------|
| Rigol | `:SOURce<n>:PHASe:INITiate` or `:SOURce:PHASe:SYNChronize` |
| Siglent | `EQPHASE` |
| Keysight | `:PHASe:SYNChronize` |
| Tektronix | `SOURce<n>:PHASe:INITiate` |

---

## Square Wave Duty Cycle

### Set Duty Cycle

| Vendor | Command | Range |
|--------|---------|-------|
| Rigol | `:SOURce<n>:FUNCtion:SQUare:DCYCle <percent>` | 0.01-99.99% |
| Siglent | `C<n>:BSWV DUTY,<percent>` | 0.01-99.99% |
| Keysight | `:FUNCtion:SQUare:DCYCle <percent>` | 0.01-99.99% |
| Tektronix | `SOURce<n>:FUNCtion:SQUare:DCYCle <percent>` | 0.01-99.99% |

---

## Ramp/Triangle Symmetry

### Set Symmetry

| Vendor | Command | Range | Notes |
|--------|---------|-------|-------|
| Rigol | `:SOURce<n>:FUNCtion:RAMP:SYMMetry <percent>` | 0-100% | 50% = triangle |
| Siglent | `C<n>:BSWV SYM,<percent>` | 0-100% | |
| Keysight | `:FUNCtion:RAMP:SYMMetry <percent>` | 0-100% | |
| Tektronix | `SOURce<n>:FUNCtion:RAMP:SYMMetry <percent>` | 0-100% | |

---

## Pulse Parameters

### Pulse Width

| Vendor | Command | Units |
|--------|---------|-------|
| Rigol | `:SOURce<n>:PULSe:WIDTh <width>` | Seconds |
| Siglent | `C<n>:BSWV WIDTH,<width>` | Seconds |
| Keysight | `:FUNCtion:PULSe:WIDTh <width>` | Seconds |
| Tektronix | `SOURce<n>:PULSe:WIDTh <width>` | Seconds |

### Pulse Duty Cycle (Alternative)

| Vendor | Command |
|--------|---------|
| Rigol | `:SOURce<n>:PULSe:DCYCle <percent>` |
| Keysight | `:FUNCtion:PULSe:DCYCle <percent>` |
| Tektronix | `SOURce<n>:PULSe:DCYCle <percent>` |

### Edge Times (Rise/Fall)

| Vendor | Rise Time | Fall Time |
|--------|-----------|-----------|
| Rigol | `:SOURce<n>:PULSe:TRANsition[:LEADing] <s>` | `:SOURce<n>:PULSe:TRANsition:TRAiling <s>` |
| Siglent | `C<n>:BSWV RISE,<s>` | `C<n>:BSWV FALL,<s>` |
| Keysight | `:FUNCtion:PULSe:TRANsition[:LEADing] <s>` | `:FUNCtion:PULSe:TRANsition:TRAiling <s>` |
| Tektronix | `SOURce<n>:PULSe:TRANsition:LEADing <s>` | `SOURce<n>:PULSe:TRANsition:TRAiling <s>` |

### Pulse Delay

| Vendor | Command |
|--------|---------|
| Rigol | `:SOURce<n>:PULSe:DELay <s>` |
| Siglent | `C<n>:BSWV DLY,<s>` |
| Keysight | `:FUNCtion:PULSe:DELay <s>` |
| Tektronix | `SOURce<n>:PULSe:DELay <s>` |

---

## Output Impedance/Load

### Set Output Load

| Vendor | Command | Values |
|--------|---------|--------|
| Rigol | `:OUTPut<n>:LOAD {<ohms>|INFinity|MINimum|MAXimum}` | 1Ω-10kΩ or INF |
| Siglent | `C<n>:OUTP LOAD,{HZ|50}` | HZ=High-Z, 50=50Ω |
| Keysight | `:OUTPut[<n>]:LOAD {<ohms>|INFinity}` | 1Ω-10kΩ or INF |
| Tektronix | `OUTPut<n>:IMPedance {<ohms>|INFinity}` | 50Ω or INF |

**Note**: This setting affects displayed amplitude. If load is set to 50Ω, amplitude is specified as the voltage across a 50Ω load. High-Z displays open-circuit voltage.

---

## Modulation

### AM (Amplitude Modulation)

| Vendor | Enable | Depth | Source | Frequency |
|--------|--------|-------|--------|-----------|
| Rigol | `:SOUR<n>:AM:STAT ON` | `:SOUR<n>:AM:DEPTh <pct>` | `:SOUR<n>:AM:SOUR {INT|EXT}` | `:SOUR<n>:AM:INT:FREQ <hz>` |
| Siglent | `C<n>:MDWV STATE,ON,AM` | `C<n>:MDWV AM,DEPTH,<pct>` | `C<n>:MDWV AM,SRC,{INT|EXT}` | `C<n>:MDWV AM,FRQ,<hz>` |
| Keysight | `:AM:STAT ON` | `:AM:DEPTh <pct>` | `:AM:SOUR {INT|EXT}` | `:AM:INT:FREQ <hz>` |
| Tektronix | `SOUR<n>:AM:STAT ON` | `SOUR<n>:AM:DEPTh <pct>` | `SOUR<n>:AM:SOUR {INT|EXT}` | `SOUR<n>:AM:INT:FREQ <hz>` |

### FM (Frequency Modulation)

| Vendor | Enable | Deviation | Source | Frequency |
|--------|--------|-----------|--------|-----------|
| Rigol | `:SOUR<n>:FM:STAT ON` | `:SOUR<n>:FM:DEViation <hz>` | `:SOUR<n>:FM:SOUR {INT|EXT}` | `:SOUR<n>:FM:INT:FREQ <hz>` |
| Siglent | `C<n>:MDWV STATE,ON,FM` | `C<n>:MDWV FM,DEVI,<hz>` | `C<n>:MDWV FM,SRC,{INT|EXT}` | `C<n>:MDWV FM,FRQ,<hz>` |
| Keysight | `:FM:STAT ON` | `:FM:DEViation <hz>` | `:FM:SOUR {INT|EXT}` | `:FM:INT:FREQ <hz>` |
| Tektronix | `SOUR<n>:FM:STAT ON` | `SOUR<n>:FM:DEViation <hz>` | `SOUR<n>:FM:SOUR {INT|EXT}` | `SOUR<n>:FM:INT:FREQ <hz>` |

### PM (Phase Modulation)

| Vendor | Enable | Deviation | Source |
|--------|--------|-----------|--------|
| Rigol | `:SOUR<n>:PM:STAT ON` | `:SOUR<n>:PM:DEViation <deg>` | `:SOUR<n>:PM:SOUR {INT|EXT}` |
| Siglent | `C<n>:MDWV STATE,ON,PM` | `C<n>:MDWV PM,DEVI,<deg>` | `C<n>:MDWV PM,SRC,{INT|EXT}` |
| Keysight | `:PM:STAT ON` | `:PM:DEViation <deg>` | `:PM:SOUR {INT|EXT}` |
| Tektronix | `SOUR<n>:PM:STAT ON` | `SOUR<n>:PM:DEViation <deg>` | `SOUR<n>:PM:SOUR {INT|EXT}` |

### FSK (Frequency Shift Keying)

| Vendor | Enable | Hop Frequency | Rate |
|--------|--------|---------------|------|
| Rigol | `:SOUR<n>:FSKey:STAT ON` | `:SOUR<n>:FSKey:FREQuency <hz>` | `:SOUR<n>:FSKey:INT:RATE <hz>` |
| Siglent | `C<n>:MDWV STATE,ON,FSK` | `C<n>:MDWV FSK,HFRQ,<hz>` | `C<n>:MDWV FSK,RATE,<hz>` |
| Keysight | `:FSKey:STAT ON` | `:FSKey:FREQuency <hz>` | `:FSKey:INT:RATE <hz>` |
| Tektronix | `SOUR<n>:FSKey:STAT ON` | `SOUR<n>:FSKey:FREQuency <hz>` | `SOUR<n>:FSKey:INT:RATE <hz>` |

### PWM (Pulse Width Modulation)

| Vendor | Enable | Deviation | Source |
|--------|--------|-----------|--------|
| Rigol | `:SOUR<n>:PWM:STAT ON` | `:SOUR<n>:PWM:DEViation {<s>|DCYCle <pct>}` | `:SOUR<n>:PWM:SOUR {INT|EXT}` |
| Keysight | `:PWM:STAT ON` | `:PWM:DEViation {<s>|DCYCle <pct>}` | `:PWM:SOUR {INT|EXT}` |
| Tektronix | `SOUR<n>:PWM:STAT ON` | `SOUR<n>:PWM:DEViation <pct>` | `SOUR<n>:PWM:SOUR {INT|EXT}` |

---

## Sweep

### Sweep Enable and Type

| Vendor | Enable | Type |
|--------|--------|------|
| Rigol | `:SOUR<n>:SWEep:STAT ON` | `:SOUR<n>:SWEep:SPACing {LINear|LOGarithmic}` |
| Siglent | `C<n>:SWWV STATE,ON` | `C<n>:SWWV SWMD,{LINE|LOG}` |
| Keysight | `:SWEep:STAT ON` | `:SWEep:SPACing {LINear|LOGarithmic}` |
| Tektronix | `SOUR<n>:SWEep:STAT ON` | `SOUR<n>:SWEep:SPACing {LINear|LOGarithmic}` |

### Sweep Frequency Range

| Vendor | Start | Stop | Center | Span |
|--------|-------|------|--------|------|
| Rigol | `:SOUR<n>:FREQ:STAR <hz>` | `:SOUR<n>:FREQ:STOP <hz>` | `:SOUR<n>:FREQ:CENT <hz>` | `:SOUR<n>:FREQ:SPAN <hz>` |
| Siglent | `C<n>:SWWV START,<hz>` | `C<n>:SWWV STOP,<hz>` | | |
| Keysight | `:FREQ:STAR <hz>` | `:FREQ:STOP <hz>` | `:FREQ:CENT <hz>` | `:FREQ:SPAN <hz>` |
| Tektronix | `SOUR<n>:FREQ:STAR <hz>` | `SOUR<n>:FREQ:STOP <hz>` | `SOUR<n>:FREQ:CENT <hz>` | `SOUR<n>:FREQ:SPAN <hz>` |

### Sweep Time

| Vendor | Command |
|--------|---------|
| Rigol | `:SOUR<n>:SWEep:TIME <s>` |
| Siglent | `C<n>:SWWV TIME,<s>` |
| Keysight | `:SWEep:TIME <s>` |
| Tektronix | `SOUR<n>:SWEep:TIME <s>` |

### Sweep Trigger

| Vendor | Command | Options |
|--------|---------|---------|
| Rigol | `:SOUR<n>:SWEep:TRIGger:SOURce {INT|EXT|MAN}` | Internal, External, Manual |
| Siglent | `C<n>:SWWV TRSR,{INT|EXT|MAN}` | |
| Keysight | `:TRIGger:SOURce {IMM|EXT|BUS}` | Immediate, External, Software |
| Tektronix | `SOUR<n>:SWEep:TRIGger:SOURce {INT|EXT}` | |

---

## Burst Mode

### Burst Enable and Type

| Vendor | Enable | Mode |
|--------|--------|------|
| Rigol | `:SOUR<n>:BURSt:STAT ON` | `:SOUR<n>:BURSt:MODE {TRIGgered|GATed|INFinity}` |
| Siglent | `C<n>:BTWV STATE,ON` | `C<n>:BTWV GATE,{NCYC|GATED}` |
| Keysight | `:BURSt:STAT ON` | `:BURSt:MODE {TRIGgered|GATed}` |
| Tektronix | `SOUR<n>:BURSt:STAT ON` | `SOUR<n>:BURSt:MODE {TRIGgered|GATed}` |

### Burst Count

| Vendor | Command | Range |
|--------|---------|-------|
| Rigol | `:SOUR<n>:BURSt:NCYCles <n>` | 1 to 1M or INFinity |
| Siglent | `C<n>:BTWV TIME,<n>` | |
| Keysight | `:BURSt:NCYCles <n>` | 1 to 100M or INFinity |
| Tektronix | `SOUR<n>:BURSt:NCYCles <n>` | 1 to 1M or INFinity |

### Burst Period (Internal Trigger)

| Vendor | Command |
|--------|---------|
| Rigol | `:SOUR<n>:BURSt:INT:PERiod <s>` |
| Siglent | `C<n>:BTWV PRD,<s>` |
| Keysight | `:BURSt:INT:PERiod <s>` |
| Tektronix | `SOUR<n>:BURSt:INT:PERiod <s>` |

### Burst Phase

| Vendor | Command |
|--------|---------|
| Rigol | `:SOUR<n>:BURSt:PHASe <deg>` |
| Siglent | `C<n>:BTWV STPS,<deg>` |
| Keysight | `:BURSt:PHASe <deg>` |
| Tektronix | `SOUR<n>:BURSt:PHASe <deg>` |

### Burst Delay

| Vendor | Command |
|--------|---------|
| Rigol | `:SOUR<n>:BURSt:TDELay <s>` |
| Siglent | `C<n>:BTWV DLAY,<s>` |
| Keysight | `:BURSt:TDELay <s>` |
| Tektronix | `SOUR<n>:BURSt:TDELay <s>` |

### Trigger Burst

| Vendor | Command |
|--------|---------|
| Rigol | `*TRG` or `:SOUR<n>:BURSt:TRIGger:IMMediate` |
| Siglent | `C<n>:BTWV MTRIG` |
| Keysight | `*TRG` or `:TRIGger[:IMMediate]` |
| Tektronix | `*TRG` or `SOUR<n>:BURSt:TRIGger:IMMediate` |

---

## Arbitrary Waveforms

### List Available Waveforms

| Vendor | Command |
|--------|---------|
| Rigol | `:SOUR<n>:FUNCtion:ARBitrary:CATalog?` |
| Siglent | `STL?` |
| Keysight | `:DATA:VOLatile:CATalog?` |
| Tektronix | `SOUR<n>:FUNCtion:ARBitrary:CATalog?` |

### Select Arbitrary Waveform

| Vendor | Command |
|--------|---------|
| Rigol | `:SOUR<n>:FUNCtion:ARBitrary "<name>"` |
| Siglent | `C<n>:ARWV NAME,<name>` |
| Keysight | `:FUNCtion:ARBitrary "<name>"` |
| Tektronix | `SOUR<n>:FUNCtion:ARBitrary "<name>"` |

### Upload Arbitrary Waveform Data

| Vendor | Command | Data Format |
|--------|---------|-------------|
| Rigol | `:SOUR<n>:TRACe:DATA VOLATILE,<data>` | IEEE 488.2 binary or CSV |
| Rigol | `:SOUR<n>:TRACe:DATA:DAC16 VOLATILE,<data>` | 16-bit DAC values |
| Siglent | `C<n>:WVDT <header>,<data>` | Proprietary format |
| Keysight | `:DATA:ARBitrary <name>,<data>` | IEEE 488.2 binary floats |
| Keysight | `:DATA:ARBitrary:DAC <name>,<data>` | 16-bit DAC values |
| Tektronix | `DATA:DEFine EMEMory,<length>` + `TRACE EMEMory,<data>` | Binary |

### Arbitrary Waveform Sample Rate

| Vendor | Command |
|--------|---------|
| Rigol | `:SOUR<n>:FUNCtion:ARBitrary:SRATe <rate>` |
| Siglent | `C<n>:SRATE VALUE,<rate>` |
| Keysight | `:FUNCtion:ARBitrary:SRATe <rate>` |
| Tektronix | `SOUR<n>:FREQuency <freq>` (with point interpolation) |

### Delete Arbitrary Waveform

| Vendor | Command |
|--------|---------|
| Rigol | `:SOUR<n>:TRACe:DELete "<name>"` |
| Keysight | `:DATA:DELete "<name>"` |
| Keysight | `:DATA:DELete:ALL` |
| Tektronix | (varies by model) |

### Arbitrary Waveform Data Format

```
# Rigol - Float array (-1.0 to +1.0)
:SOUR1:TRACe:DATA VOLATILE,0.0,0.5,1.0,0.5,0.0,-0.5,-1.0,-0.5

# Rigol - DAC16 (0 to 16383 for 14-bit)
:SOUR1:TRACe:DATA:DAC16 VOLATILE,#<block>

# Keysight - Float array (-1.0 to +1.0)
:DATA:ARBitrary mywave,0.0,0.25,0.5,0.75,1.0,0.75,0.5,0.25

# Keysight - DAC values (0 to 32767)
:DATA:ARBitrary:DAC mywave,#<binary_block>
```

---

## Trigger System

### Trigger Source

| Vendor | Command | Options |
|--------|---------|---------|
| Rigol | `:SOUR<n>:BURSt:TRIGger:SOURce {INT|EXT|MAN}` | Internal, External, Manual |
| Siglent | `C<n>:BTWV TRSR,{INT|EXT|MAN}` | |
| Keysight | `:TRIGger:SOURce {IMMediate|EXTernal|BUS}` | |
| Tektronix | `SOUR<n>:BURSt:TRIGger:SOURce {INT|EXT|TIMer}` | |

### Trigger Slope (External)

| Vendor | Command |
|--------|---------|
| Rigol | `:SOUR<n>:BURSt:TRIGger:SLOPe {POSitive|NEGative}` |
| Keysight | `:TRIGger:SLOPe {POSitive|NEGative}` |
| Tektronix | `SOUR<n>:BURSt:TRIGger:SLOPe {POSitive|NEGative}` |

### Software Trigger

| Vendor | Command |
|--------|---------|
| All | `*TRG` |
| Rigol | `:SOUR<n>:BURSt:TRIGger[:IMMediate]` |
| Keysight | `:TRIGger[:IMMediate]` |
| Tektronix | `SOUR<n>:BURSt:TRIGger[:IMMediate]` |

---

## Trigger Output (Sync/Marker)

### Sync Output Enable

| Vendor | Command |
|--------|---------|
| Rigol | `:OUTPut<n>:SYNC[:STATe] {ON|OFF}` |
| Siglent | `C<n>:SYNC ON` |
| Keysight | `:OUTPut:SYNC[:STATe] {ON|OFF}` |
| Tektronix | `OUTPut<n>:TRIGger[:STATe] {ON|OFF}` |

### Sync Polarity

| Vendor | Command |
|--------|---------|
| Rigol | `:OUTPut<n>:SYNC:POLarity {POSitive|NEGative}` |
| Keysight | `:OUTPut:SYNC:POLarity {NORMal|INVerted}` |
| Tektronix | `OUTPut<n>:TRIGger:POLarity {POSitive|NEGative}` |

### Marker Position (Arbitrary Waveforms)

| Vendor | Command |
|--------|---------|
| Keysight | `:MARKer:POINt <sample_number>` |
| Tektronix | `OUTPut<n>:TRIGger:ARBitrary:MARKer {ON|OFF}` |

---

## Counter Function

Many AWGs include a built-in frequency counter:

### Enable Counter

| Vendor | Command |
|--------|---------|
| Rigol | `:COUNter:STATe {ON|OFF}` |
| Siglent | `FCNT STATE,{ON|OFF}` |
| Keysight | (not typically built-in) |

### Read Frequency

| Vendor | Command |
|--------|---------|
| Rigol | `:COUNter:MEASure:FREQuency?` |
| Siglent | `FCNT FREQ?` |

### Counter Configuration

```
# Rigol
:COUNter:COUP {AC|DC}              # Input coupling
:COUNter:SENS {LOW|MEDium|HIGH}    # Sensitivity
:COUNter:TRIGger:LEVel <v>         # Trigger level
:COUNter:HF {ON|OFF}               # High frequency mode
```

---

## System Commands

### Error Query

| Vendor | Command |
|--------|---------|
| All | `:SYSTem:ERRor[:NEXT]?` |

### Beeper

| Vendor | Command |
|--------|---------|
| Rigol | `:SYSTem:BEEPer[:IMMediate]` (beep once) |
| Rigol | `:SYSTem:BEEPer:STATe {ON|OFF}` |
| Keysight | `:SYSTem:BEEPer` |
| Keysight | `:SYSTem:BEEPer:STATe {ON|OFF}` |

### Display Control

| Vendor | Command |
|--------|---------|
| Rigol | `:DISPlay:BRIGhtness <0-100>` |
| Keysight | `:DISPlay:TEXT "<message>"` |
| Keysight | `:DISPlay:TEXT:CLEar` |

### Remote/Local

| Vendor | Command |
|--------|---------|
| All | `:SYSTem:REMote` |
| All | `:SYSTem:LOCal` |

---

## Vendor Command Variations Summary

| Function | Rigol DG | Siglent SDG | Keysight 33500 | Tektronix AFG |
|----------|----------|-------------|----------------|---------------|
| Output on | `:OUTP1 ON` | `C1:OUTP ON` | `:OUTP ON` | `OUTP1:STAT ON` |
| Set sine | `:SOUR1:FUNC SIN` | `C1:BSWV WVTP,SINE` | `:FUNC SIN` | `SOUR1:FUNC SIN` |
| Set freq | `:SOUR1:FREQ 1000` | `C1:BSWV FRQ,1000` | `:FREQ 1000` | `SOUR1:FREQ 1000` |
| Set amp | `:SOUR1:VOLT 2.0` | `C1:BSWV AMP,2` | `:VOLT 2.0` | `SOUR1:VOLT 2.0` |
| Set offset | `:SOUR1:VOLT:OFFS 0.5` | `C1:BSWV OFST,0.5` | `:VOLT:OFFS 0.5` | `SOUR1:VOLT:OFFS 0.5` |
| Set phase | `:SOUR1:PHAS 90` | `C1:BSWV PHSE,90` | `:PHAS 90` | `SOUR1:PHAS 90` |
| Set duty | `:SOUR1:FUNC:SQU:DCYC 30` | `C1:BSWV DUTY,30` | `:FUNC:SQU:DCYC 30` | `SOUR1:FUNC:SQU:DCYC 30` |
| Burst on | `:SOUR1:BURS:STAT ON` | `C1:BTWV STATE,ON` | `:BURS:STAT ON` | `SOUR1:BURS:STAT ON` |
| Sweep on | `:SOUR1:SWE:STAT ON` | `C1:SWWV STATE,ON` | `:SWE:STAT ON` | `SOUR1:SWE:STAT ON` |
| AM on | `:SOUR1:AM:STAT ON` | `C1:MDWV STATE,ON,AM` | `:AM:STAT ON` | `SOUR1:AM:STAT ON` |
| Load arb | `:SOUR1:FUNC:ARB "wave"` | `C1:ARWV NAME,wave` | `:FUNC:ARB "wave"` | `SOUR1:FUNC:ARB "wave"` |

---

## Abstract Driver Interface

```typescript
interface AWGChannel {
  /** Channel number (1-indexed) */
  readonly number: number;

  /** Output enable/disable */
  enabled: boolean;

  /** Waveform type */
  waveform: 'sine' | 'square' | 'ramp' | 'pulse' | 'noise' | 'dc' | 'arbitrary';

  /** Frequency in Hz */
  frequency: number;

  /** Amplitude in Vpp */
  amplitude: number;

  /** DC offset in V */
  offset: number;

  /** Phase in degrees */
  phase: number;

  /** Output load impedance */
  load: number | 'highZ';
}

interface AWGSquareParams {
  /** Duty cycle in percent */
  dutyCycle: number;
}

interface AWGRampParams {
  /** Symmetry in percent (50 = triangle) */
  symmetry: number;
}

interface AWGPulseParams {
  /** Pulse width in seconds */
  width: number;
  /** Rise time in seconds */
  riseTime: number;
  /** Fall time in seconds */
  fallTime: number;
  /** Delay in seconds */
  delay: number;
}

interface AWGModulation {
  /** Modulation type */
  type: 'AM' | 'FM' | 'PM' | 'FSK' | 'PWM';

  /** Enable/disable */
  enabled: boolean;

  /** Modulation source */
  source: 'internal' | 'external';

  /** Depth (AM) or deviation (FM/PM) */
  depth: number;

  /** Internal modulation frequency */
  frequency: number;

  /** Modulating waveform (internal) */
  waveform: 'sine' | 'square' | 'ramp' | 'noise';
}

interface AWGSweep {
  /** Enable/disable */
  enabled: boolean;

  /** Sweep type */
  type: 'linear' | 'logarithmic';

  /** Start frequency in Hz */
  startFrequency: number;

  /** Stop frequency in Hz */
  stopFrequency: number;

  /** Sweep time in seconds */
  time: number;

  /** Trigger source */
  triggerSource: 'internal' | 'external' | 'manual';
}

interface AWGBurst {
  /** Enable/disable */
  enabled: boolean;

  /** Burst mode */
  mode: 'triggered' | 'gated' | 'infinite';

  /** Number of cycles per burst */
  cycles: number;

  /** Burst period (internal trigger) */
  period: number;

  /** Start phase in degrees */
  phase: number;

  /** Delay in seconds */
  delay: number;

  /** Trigger source */
  triggerSource: 'internal' | 'external' | 'manual';
}

interface ArbitraryWaveform {
  /** Waveform name */
  name: string;

  /** Number of points */
  points: number;

  /** Sample rate (if applicable) */
  sampleRate?: number;
}

interface AWG {
  /** Identification */
  identify(): Promise<Result<string, Error>>;

  /** Reset to defaults */
  reset(): Promise<Result<void, Error>>;

  /** Number of channels */
  readonly channelCount: number;

  /** Access channel by number */
  channel(n: number): AWGChannel;

  /** Square wave parameters */
  getSquareParams(channel: number): AWGSquareParams;
  setSquareParams(channel: number, params: Partial<AWGSquareParams>): Promise<Result<void, Error>>;

  /** Ramp/triangle parameters */
  getRampParams(channel: number): AWGRampParams;
  setRampParams(channel: number, params: Partial<AWGRampParams>): Promise<Result<void, Error>>;

  /** Pulse parameters */
  getPulseParams(channel: number): AWGPulseParams;
  setPulseParams(channel: number, params: Partial<AWGPulseParams>): Promise<Result<void, Error>>;

  /** Modulation settings */
  getModulation(channel: number): AWGModulation;
  setModulation(channel: number, mod: Partial<AWGModulation>): Promise<Result<void, Error>>;

  /** Sweep settings */
  getSweep(channel: number): AWGSweep;
  setSweep(channel: number, sweep: Partial<AWGSweep>): Promise<Result<void, Error>>;

  /** Burst settings */
  getBurst(channel: number): AWGBurst;
  setBurst(channel: number, burst: Partial<AWGBurst>): Promise<Result<void, Error>>;

  /** Trigger burst/sweep */
  trigger(channel?: number): Promise<Result<void, Error>>;

  /** Synchronize channel phases */
  syncPhases(): Promise<Result<void, Error>>;

  /** List available arbitrary waveforms */
  listArbitraryWaveforms(): Promise<Result<ArbitraryWaveform[], Error>>;

  /** Load arbitrary waveform */
  selectArbitraryWaveform(channel: number, name: string): Promise<Result<void, Error>>;

  /** Upload arbitrary waveform data */
  uploadArbitraryWaveform(
    name: string,
    data: number[],  // -1.0 to +1.0 normalized
    sampleRate?: number
  ): Promise<Result<void, Error>>;

  /** Delete arbitrary waveform */
  deleteArbitraryWaveform(name: string): Promise<Result<void, Error>>;

  /** Save state to memory slot */
  saveState(slot: number): Promise<Result<void, Error>>;

  /** Recall state from memory slot */
  recallState(slot: number): Promise<Result<void, Error>>;
}
```

---

## Command Translation Table

| Driver Method | Rigol DG | Siglent SDG | Keysight 33500 | Tektronix AFG |
|---------------|----------|-------------|----------------|---------------|
| `identify()` | `*IDN?` | `*IDN?` | `*IDN?` | `*IDN?` |
| `reset()` | `*RST` | `*RST` | `*RST` | `*RST` |
| `channel(1).enabled = true` | `:OUTP1 ON` | `C1:OUTP ON` | `:OUTP1 ON` | `OUTP1:STAT ON` |
| `channel(1).waveform = 'sine'` | `:SOUR1:FUNC SIN` | `C1:BSWV WVTP,SINE` | `:SOUR1:FUNC SIN` | `SOUR1:FUNC SIN` |
| `channel(1).frequency = 1000` | `:SOUR1:FREQ 1000` | `C1:BSWV FRQ,1000` | `:SOUR1:FREQ 1000` | `SOUR1:FREQ 1000` |
| `channel(1).amplitude = 2.0` | `:SOUR1:VOLT 2` | `C1:BSWV AMP,2` | `:SOUR1:VOLT 2` | `SOUR1:VOLT 2` |
| `channel(1).offset = 0.5` | `:SOUR1:VOLT:OFFS 0.5` | `C1:BSWV OFST,0.5` | `:SOUR1:VOLT:OFFS 0.5` | `SOUR1:VOLT:OFFS 0.5` |
| `channel(1).phase = 90` | `:SOUR1:PHAS 90` | `C1:BSWV PHSE,90` | `:SOUR1:PHAS 90` | `SOUR1:PHAS 90` |
| `setSquareParams(1, {dutyCycle: 30})` | `:SOUR1:FUNC:SQU:DCYC 30` | `C1:BSWV DUTY,30` | `:SOUR1:FUNC:SQU:DCYC 30` | `SOUR1:FUNC:SQU:DCYC 30` |
| `trigger()` | `*TRG` | `C1:BTWV MTRIG` | `*TRG` | `*TRG` |
| `syncPhases()` | `:SOUR:PHAS:SYNC` | `EQPHASE` | `:PHAS:SYNC` | `:SOUR:PHAS:INIT` |

---

## Vendor Detection Patterns

```typescript
const AWG_VENDORS = {
  rigol: {
    patterns: [
      /RIGOL.*DG\d{3,4}/i,
      /RIGOL.*DG8\d{2}/i,
    ],
    driver: 'RigolDGDriver',
  },
  siglent: {
    patterns: [
      /Siglent.*SDG\d{4}/i,
      /Siglent.*SDG\d{3}/i,
    ],
    driver: 'SiglentSDGDriver',
  },
  keysight: {
    patterns: [
      /Keysight.*335\d{2}/i,
      /Keysight.*336\d{2}/i,
      /Agilent.*332\d{2}/i,
      /Agilent.*335\d{2}/i,
    ],
    driver: 'KeysightTrueformDriver',
  },
  tektronix: {
    patterns: [
      /TEKTRONIX.*AFG\d{4}/i,
      /TEKTRONIX.*AFG3\d{3}/i,
      /TEKTRONIX.*AWG\d{4}/i,
    ],
    driver: 'TektronixAFGDriver',
  },
  bk_precision: {
    patterns: [
      /B&K.*405\d/i,
      /BK.*405\d/i,
    ],
    driver: 'BKPrecisionAFGDriver',
  },
  gw_instek: {
    patterns: [
      /GW.*AFG-\d{4}/i,
    ],
    driver: 'GWInstekAFGDriver',
  },
};
```

---

## Connection Reference

| Vendor | USB VID:PID | Default TCP Port | GPIB | Notes |
|--------|-------------|------------------|------|-------|
| Rigol | 1AB1:0641 (DG1000Z) | 5555 | Optional | VXI-11 or raw socket |
| Siglent | F4EC:EE3B | 5024/5025 | No | USBTMC or socket |
| Keysight | 0957:xxxx | 5025 | Yes | VISA recommended |
| Tektronix | 0699:xxxx | 4000 | Yes | VISA recommended |
| BK Precision | 0C97:xxxx | 5025 | No | |
| GW Instek | 2184:xxxx | 5025 | No | |

---

## Programming Examples

### Basic Sine Wave

```typescript
const rm = createResourceManager();
const awg = await rm.open('TCPIP0::192.168.1.50::5555::SOCKET');

// Configure 1 kHz, 2 Vpp sine wave
await awg.write(':SOUR1:FUNC SIN');
await awg.write(':SOUR1:FREQ 1000');
await awg.write(':SOUR1:VOLT 2.0');
await awg.write(':SOUR1:VOLT:OFFS 0');
await awg.write(':OUTP1 ON');

await awg.close();
```

### Frequency Sweep

```typescript
// Configure 100 Hz to 10 kHz linear sweep over 1 second
await awg.write(':SOUR1:FUNC SIN');
await awg.write(':SOUR1:VOLT 1.0');
await awg.write(':SOUR1:FREQ:STAR 100');
await awg.write(':SOUR1:FREQ:STOP 10000');
await awg.write(':SOUR1:SWE:SPAC LIN');
await awg.write(':SOUR1:SWE:TIME 1');
await awg.write(':SOUR1:SWE:STAT ON');
await awg.write(':OUTP1 ON');
```

### Burst Mode

```typescript
// Configure 10-cycle burst, triggered externally
await awg.write(':SOUR1:FUNC SIN');
await awg.write(':SOUR1:FREQ 10000');
await awg.write(':SOUR1:VOLT 2.0');
await awg.write(':SOUR1:BURS:NCYC 10');
await awg.write(':SOUR1:BURS:MODE TRIG');
await awg.write(':SOUR1:BURS:TRIG:SOUR EXT');
await awg.write(':SOUR1:BURS:STAT ON');
await awg.write(':OUTP1 ON');

// Or trigger manually
await awg.write(':SOUR1:BURS:TRIG:SOUR MAN');
await awg.write('*TRG');
```

### Arbitrary Waveform Upload

```typescript
// Generate a simple staircase waveform
const points = 100;
const data = [];
for (let i = 0; i < points; i++) {
  const step = Math.floor(i / (points / 5));
  data.push(-1.0 + step * 0.5);  // 5 steps from -1 to +1
}

// Upload to Rigol
const dataStr = data.join(',');
await awg.write(`:SOUR1:TRACe:DATA VOLATILE,${dataStr}`);
await awg.write(':SOUR1:FUNC:ARB VOLATILE');
await awg.write(':SOUR1:FUNC ARB');

// Set sample rate or frequency
await awg.write(':SOUR1:FUNC:ARB:SRAT 100000');  // 100 kSa/s
await awg.write(':OUTP1 ON');
```

---

## Notes

1. **Load Impedance**: Setting affects displayed amplitude. 50Ω means voltage across 50Ω load; High-Z is open-circuit voltage (2× of 50Ω setting).

2. **Amplitude Units**: Default is Vpp. Can be changed to Vrms or dBm via `:VOLT:UNIT`.

3. **Phase Sync**: After changing frequencies, phases may drift. Use sync command to realign.

4. **Arbitrary Points**: Minimum 2 points, maximum varies by model (8K-16M typical).

5. **Modulation Priority**: Only one modulation type active at a time per channel.

6. **Burst vs Sweep**: These are mutually exclusive with continuous operation.

7. **External Trigger**: Typical input is TTL level, positive edge. Check specifications.

8. **Memory Volatility**: `VOLATILE` memory is lost on power-off. Use named waveforms for persistence.
