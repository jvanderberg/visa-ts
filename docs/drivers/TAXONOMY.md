# Programmable Test & Measurement Equipment Taxonomy

This document defines the categories of SCPI-programmable laboratory equipment and representative instruments across the price/capability spectrum.

---

## Equipment Categories

### Power & Source

| Category | Code | Description | Common Interfaces |
|----------|------|-------------|-------------------|
| DC Power Supply | PSU | Bench and system DC supplies | SCPI, Modbus |
| AC Power Source | ACS | AC power sources, inverters | SCPI |
| Electronic Load | LOAD | DC/AC electronic loads | SCPI |
| Source Measure Unit | SMU | Combined source + measure | SCPI |
| Battery Simulator | BATSIM | Battery emulation | SCPI |

### Signal Generation

| Category | Code | Description | Common Interfaces |
|----------|------|-------------|-------------------|
| Function Generator | FG | Basic waveform generation | SCPI |
| Arbitrary Waveform Gen | AWG | Complex waveform synthesis | SCPI |
| RF Signal Generator | RFSG | RF/microwave signal sources | SCPI |
| Pulse Generator | PULSE | Precision pulse/pattern gen | SCPI |

### Signal Acquisition

| Category | Code | Description | Common Interfaces |
|----------|------|-------------|-------------------|
| Oscilloscope | OSC | Digital storage oscilloscopes | SCPI |
| Spectrum Analyzer | SPEC | RF spectrum analysis | SCPI |
| Vector Network Analyzer | VNA | S-parameter measurement | SCPI |
| Logic Analyzer | LA | Digital signal capture | Proprietary, SCPI |
| Data Acquisition | DAQ | Multi-channel sampling | SCPI, proprietary |

### Measurement

| Category | Code | Description | Common Interfaces |
|----------|------|-------------|-------------------|
| Digital Multimeter | DMM | Voltage, current, resistance | SCPI |
| LCR Meter | LCR | Inductance, capacitance, resistance | SCPI |
| Frequency Counter | COUNTER | Frequency/time measurement | SCPI |
| Power Meter | PWRMTR | RF/optical power measurement | SCPI |
| Power Analyzer | PWRANLZ | AC power quality analysis | SCPI |
| Impedance Analyzer | IMPED | High-precision impedance | SCPI |

### Environmental & Process

| Category | Code | Description | Common Interfaces |
|----------|------|-------------|-------------------|
| Temperature Controller | TEMP | Thermal chambers, ovens | SCPI, Modbus |
| Calibrator | CAL | Multifunction calibrators | SCPI |

### Switching & Routing

| Category | Code | Description | Common Interfaces |
|----------|------|-------------|-------------------|
| Switch Matrix | SWITCH | Signal routing | SCPI |
| Multiplexer | MUX | Channel multiplexing | SCPI |
| Programmable Attenuator | ATTEN | RF/DC attenuation | SCPI |

---

## Vendor Tiers

### Entry Level / Hobbyist
- Rigol, Siglent, OWON, Hantek, UNI-T
- Korad, Tenma, BK Precision (lower end)
- GW Instek (lower end)

### Mid-Range / Educational / Small Business
- Rigol (higher end), Siglent (higher end)
- BK Precision, GW Instek
- Tektronix (entry models)
- Keysight (entry models like EDU series)

### Professional / Industrial
- Keysight (Agilent legacy)
- Tektronix
- Rohde & Schwarz
- National Instruments
- Yokogawa
- Hioki
- Fluke/Fluke Calibration

### High-End / Metrology
- Keysight (high-end)
- Rohde & Schwarz
- Keithley (Tektronix)
- Fluke Calibration
- Guildline, Measurements International

---

## Representative Instruments by Category

### PSU - DC Power Supplies

| Tier | Vendor | Model Series | Channels | Features |
|------|--------|--------------|----------|----------|
| Entry | Korad | KA3005P | 1 | Basic SCPI |
| Entry | Rigol | DP800 | 1-3 | Full SCPI, timers |
| Entry | Siglent | SPD3303X | 3 | Full SCPI |
| Mid | BK Precision | 9200 | 1-3 | SCPI, sequences |
| Mid | Keysight | E36300 | 3 | Full SCPI |
| Pro | Keysight | N6700 | 1-4 | Modular, SMU-like |
| Pro | R&S | HMP4000 | 4 | Tracking, arb |

### OSC - Oscilloscopes

| Tier | Vendor | Model Series | Bandwidth | Features |
|------|--------|--------------|-----------|----------|
| Entry | Rigol | DS1000Z | 50-100MHz | 4ch, decode |
| Entry | Siglent | SDS800X HD | 70-200MHz | 12-bit |
| Mid | Rigol | DS/MSO5000 | 70-350MHz | MSO, AWG |
| Mid | Siglent | SDS2000X Plus | 100-500MHz | 12-bit, decode |
| Mid | Tektronix | TBS2000B | 70-200MHz | Education |
| Pro | Keysight | DSOX/MSOX3000 | 100-1GHz | Full featured |
| Pro | Tektronix | MSO4/5/6 | 200MHz-8GHz | FlexChannel |
| Pro | R&S | RTM3000 | 100-1GHz | 10-bit |

### DMM - Digital Multimeters

| Tier | Vendor | Model Series | Digits | Features |
|------|--------|--------------|--------|----------|
| Entry | Rigol | DM858 | 5.5 | Basic SCPI |
| Entry | Siglent | SDM3055 | 5.5 | SCPI, scanner |
| Mid | Keysight | 34460A/34461A | 6.5 | Truevolt |
| Mid | Keithley | DMM6500 | 6.5 | Touchscreen |
| Pro | Keysight | 34470A | 7.5 | High accuracy |
| Pro | Keithley | DMM7510 | 7.5 | Graphical |
| Metrology | Fluke | 8588A | 8.5 | Reference |

### AWG - Arbitrary Waveform Generators

| Tier | Vendor | Model Series | Sample Rate | Features |
|------|--------|--------------|-------------|----------|
| Entry | Rigol | DG1000Z | 200MSa/s | 2ch, 60MHz |
| Entry | Siglent | SDG2000X | 1.2GSa/s | 2ch, 120MHz |
| Mid | Rigol | DG4000 | 500MSa/s | 2ch, 200MHz |
| Mid | Keysight | 33500B | 250MSa/s | Trueform |
| Pro | Keysight | 33600A | 1GSa/s | 120MHz |
| Pro | Tektronix | AFG31000 | 2GSa/s | 250MHz |
| High | Keysight | M8190A | 12GSa/s | 14-bit |

### LOAD - Electronic Loads

| Tier | Vendor | Model Series | Power | Features |
|------|--------|--------------|-------|----------|
| Entry | BK Precision | 8500 | 150-600W | Basic modes |
| Entry | Rigol | DL3021/3031 | 200-350W | Full SCPI |
| Entry | Siglent | SDL1020X/1030X | 200-300W | LED test |
| Mid | BK Precision | 8600 | 150-750W | High speed |
| Mid | Keysight | EL34000A | 350W | Bench |
| Pro | Chroma | 63000 | 1-18kW | Modular |
| Pro | Keysight | N3300A | 150-600W | Modular |

### SMU - Source Measure Units

| Tier | Vendor | Model Series | Channels | Features |
|------|--------|--------------|----------|----------|
| Entry | Rigol | DP821A (partial) | 2 | Basic |
| Mid | Keithley | 2400 series | 1 | Classic SMU |
| Mid | Keithley | 2450 | 1 | Touchscreen |
| Pro | Keithley | 2600B | 1-2 | TSP scripting |
| Pro | Keysight | B2900A/B | 1-2 | Precision |
| High | Keithley | 4200A-SCS | Multi | Parameter analyzer |

### SPEC - Spectrum Analyzers

| Tier | Vendor | Model Series | Frequency | Features |
|------|--------|--------------|-----------|----------|
| Entry | Rigol | DSA800 | 9kHz-7.5GHz | Basic SA |
| Entry | Siglent | SSA3000X Plus | 9kHz-7.5GHz | VNA option |
| Mid | R&S | FPC1500 | 5kHz-3GHz | Portable |
| Mid | Keysight | N9320B | 9kHz-3GHz | Basic |
| Pro | R&S | FSW | 2Hz-90GHz | Signal/spectrum |
| Pro | Keysight | N9040B UXA | 2Hz-50GHz | High perf |

### VNA - Vector Network Analyzers

| Tier | Vendor | Model Series | Frequency | Ports |
|------|--------|--------------|-----------|-------|
| Entry | NanoVNA | V2 | 50kHz-3GHz | 2 |
| Entry | Siglent | SVA1000X | 9kHz-7.5GHz | VNA option |
| Mid | Copper Mountain | TR/SC series | 9kHz-20GHz | 2-4 |
| Mid | Keysight | E5063A | 100kHz-18GHz | 2 |
| Pro | Keysight | PNA-X N5247B | 10MHz-67GHz | 2-4 |
| Pro | R&S | ZNB | 9kHz-67GHz | 2-4 |

### LCR - LCR Meters

| Tier | Vendor | Model Series | Frequency | Features |
|------|--------|--------------|-----------|----------|
| Entry | Rigol | DM858 (cap mode) | 1kHz | Basic |
| Entry | GW Instek | LCR-6000 | 10Hz-300kHz | Bench |
| Mid | Keysight | E4980A/AL | 20Hz-2MHz | Precision |
| Mid | Hioki | IM3536 | 4Hz-8MHz | High speed |
| Pro | Keysight | E4990A | 20Hz-120MHz | Impedance |

### COUNTER - Frequency Counters

| Tier | Vendor | Model Series | Frequency | Resolution |
|------|--------|--------------|-----------|------------|
| Entry | Rigol | Built-in AWG | 200MHz | Basic |
| Entry | Siglent | SDG/scope | 200MHz | Basic |
| Mid | Keysight | 53220A | 350MHz | 12 digits |
| Pro | Keysight | 53230A | 350MHz | Universal |
| Pro | Pendulum | CNT-91 | 300MHz | GPIB |

### RFSG - RF Signal Generators

| Tier | Vendor | Model Series | Frequency | Features |
|------|--------|--------------|-----------|----------|
| Entry | Rigol | DSG800 | 9kHz-3GHz | Basic |
| Entry | Siglent | SSG3000X | 9kHz-6GHz | IQ mod |
| Mid | R&S | SMB100B | 8kHz-40GHz | Low noise |
| Mid | Keysight | N5173B EXG | 9kHz-40GHz | Analog |
| Pro | Keysight | N5183B MXG | 9kHz-40GHz | Vector |
| Pro | R&S | SMW200A | 100kHz-67GHz | Vector |

---

## SCPI Command Pattern Categories

Based on the instruments above, SCPI commands generally fall into these patterns:

### Universal (IEEE 488.2)
```
*IDN?           - Identification
*RST            - Reset
*OPC? / *OPC    - Operation complete
*CLS            - Clear status
*ESR? / *ESE    - Event status
*STB? / *SRE    - Status byte
*WAI            - Wait
*TST?           - Self-test
*SAV / *RCL     - Save/recall state
```

### Source Commands (PSU, AWG, SMU)
```
:SOURce:VOLTage
:SOURce:CURRent
:SOURce:FREQuency
:SOURce:FUNCtion
:OUTPut[:STATe]
:APPLy (quick setup)
```

### Measurement Commands (DMM, OSC)
```
:MEASure:<function>?
:CONFigure:<function>
:READ?
:FETCh?
:SENSe:<function>:RANGe
:SENSe:<function>:RESolution
```

### Acquisition Commands (OSC, SPEC, VNA)
```
:ACQuire:TYPE
:ACQuire:MODE
:ACQuire:SRATe
:TRIGger:SOURce
:TRIGger:LEVel
:WAVeform:DATA?
```

### Display/Format
```
:DISPlay:...
:FORMat:DATA
:SYSTem:...
```

---

## Documentation Links by Category

### PSU - DC Power Supplies
| Vendor | Model | Programming Guide |
|--------|-------|-------------------|
| Rigol | DP800 | [Local Reference](psu/rigol_dp800_scpi_reference.md) |
| Siglent | SPD3303X | [Local Reference](psu/siglent_spd3303x_scpi_reference.md) |
| Keysight | N6700 | [Programmer's Guide (PDF)](https://www.keysight.com/us/en/assets/9018-03617/programming-guides/9018-03617.pdf) |
| Korad | KA3005P | [sigrok Wiki](https://sigrok.org/wiki/Korad_KAxxxxP_series) |

### OSC - Oscilloscopes
| Vendor | Model | Programming Guide |
|--------|-------|-------------------|
| Rigol | DS1000Z | [Local Reference](osc/rigol_ds1000z_scpi_reference.md) |
| Siglent | SDS Series | [Local Reference](osc/siglent_sds_scpi_reference.md) |
| Tektronix | MSO4/5/6 | [Programmer Manual (PDF)](https://download.tek.com/manual/4-5-6-MSO-6-LPD-Programmer-Manual-077130511.pdf) |

### DMM - Digital Multimeters
| Vendor | Model | Programming Guide |
|--------|-------|-------------------|
| Siglent/Rigol | SDM/DM858 | [Local Reference](dmm/bench_dmm_scpi_reference.md) |
| Keithley | 2450 | [Reference Manual (PDF)](https://download.tek.com/manual/2450-901-01_D_May_2015_Ref.pdf) |
| Fluke | 8588A | [Remote Programmer's Manual](https://s3.amazonaws.com/download.flukecal.com/pub/literature/8588A___rpeng0000_0.pdf) |

### AWG - Arbitrary Waveform Generators
| Vendor | Model | Programming Guide |
|--------|-------|-------------------|
| Rigol | DG1000Z | [Local Reference](awg/rigol_dg1000z_scpi_reference.md) |
| Siglent | SDG2000X | [Local Reference](awg/siglent_sdg2000x_scpi_reference.md) |
| Keysight | 33500B | [User's Guide (PDF)](https://www.keysight.com/us/en/assets/9018-03290/user-manuals/9018-03290.pdf) |

### LOAD - Electronic Loads
| Vendor | Model | Programming Guide |
|--------|-------|-------------------|
| Multi-vendor | General | [Local Reference](load/electronic_load_scpi_reference.md) |
| Rigol | DL3000 | [Programming Manual (PDF)](https://www.batronix.com/files/Rigol/Elektronische-Lasten/DL3000/DL3000_ProgrammingManual_EN.pdf) |
| Siglent | SDL1000X | [Programming Guide (PDF)](https://www.batronix.com/files/Siglent/Elektronische-Last/SDL1000X/SDL1000X-Programming_Guide.pdf) |
| Chroma | 63600 | [Manual (PDF)](https://assets.tequipment.net/assets/1/26/Chroma_63600_Series_-_Manual_V2.2.pdf) |

### SMU - Source Measure Units
| Vendor | Model | Programming Guide |
|--------|-------|-------------------|
| Keithley | 2450 | [Reference Manual (PDF)](https://download.tek.com/manual/2450-901-01_D_May_2015_Ref.pdf) |
| Keithley | 2600B | [Reference Manual](https://www.tek.com/en/keithley-source-measure-units/series-2600b-system-sourcemeter) |

### SPEC - Spectrum Analyzers
| Vendor | Model | Programming Guide |
|--------|-------|-------------------|
| R&S | FSW | [User Manual](https://www.rohde-schwarz.com/us/manual/fsw-user-manual-manuals_78701-29088.html) |
| Keysight | Various | [Keysight Support](https://www.keysight.com/us/en/support.html) |

### VNA - Vector Network Analyzers
| Vendor | Model | Programming Guide |
|--------|-------|-------------------|
| Keysight | PNA/ENA | [Online Help](https://helpfiles.keysight.com/csg/N52xxB/Programming/New_Programming_Commands.htm) |

### LCR - LCR Meters
| Vendor | Model | Programming Guide |
|--------|-------|-------------------|
| Keysight | E4980A | [User's Guide (PDF)](https://www.keysight.com/us/en/assets/9018-05655/user-manuals/9018-05655.pdf) |

### COUNTER - Frequency Counters
| Vendor | Model | Programming Guide |
|--------|-------|-------------------|
| Keysight | 53230A | [Programmer's Reference](https://www.keysight.com/us/en/library/manuals/programming-and-syntax-guide/53220a53230a-frequency-universalcountertimer-programmers-reference-1971001.html) |

### RFSG - RF Signal Generators
| Vendor | Model | Programming Guide |
|--------|-------|-------------------|
| R&S | SMW200A | [User Manual](https://www.rohde-schwarz.com/us/manual/r-s-smw200a-user-manual-manuals_78701-61762.html) |

### PWRANLZ - Power Analyzers
| Vendor | Model | Programming Guide |
|--------|-------|-------------------|
| Yokogawa | WT5000/WT3000 | [Communication Manual (PDF)](https://cdn.tmi.yokogawa.com/1/7114/files/IMWT5000-17EN.pdf) |

---

## Local SCPI References

The following detailed SCPI command references are available in this repository:

### By Category
```
docs/drivers/
├── TAXONOMY.md              # This file
├── psu/
│   ├── rigol_dp800_scpi_reference.md
│   └── siglent_spd3303x_scpi_reference.md
├── osc/
│   ├── rigol_ds1000z_scpi_reference.md
│   └── siglent_sds_scpi_reference.md
├── dmm/
│   └── bench_dmm_scpi_reference.md
├── awg/
│   ├── rigol_dg1000z_scpi_reference.md
│   └── siglent_sdg2000x_scpi_reference.md
└── load/
    └── electronic_load_scpi_reference.md
```

---

## Next Steps

1. ~~Create detailed SCPI reference for each category~~ (In progress)
2. Identify common abstraction patterns per category
3. Define TypeScript interfaces for each equipment type
4. Implement drivers with vendor-specific adapters
5. Create integration tests with mock transports
