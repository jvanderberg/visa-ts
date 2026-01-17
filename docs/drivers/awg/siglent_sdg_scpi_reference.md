# Siglent SDG Series AWG SCPI Reference

> Siglent SDG1000X, SDG2000X, SDG6000X Series Function/Arbitrary Waveform Generators

## Supported Models

### SDG1000X Series (Entry Level)

| Model | Channels | Max Freq | Sample Rate | Arb Memory | Features |
|-------|----------|----------|-------------|------------|----------|
| SDG1032X | 2 | 30 MHz | 150 MSa/s | 16 kpts | USB/LAN |
| SDG1062X | 2 | 60 MHz | 150 MSa/s | 16 kpts | USB/LAN |

### SDG2000X Series (Mid-Range)

| Model | Channels | Max Freq | Sample Rate | Arb Memory | Features |
|-------|----------|----------|-------------|------------|----------|
| SDG2042X | 2 | 40 MHz | 1.2 GSa/s | 8 Mpts | TrueArb |
| SDG2082X | 2 | 80 MHz | 1.2 GSa/s | 8 Mpts | TrueArb |
| SDG2122X | 2 | 120 MHz | 1.2 GSa/s | 8 Mpts | TrueArb |

### SDG6000X Series (High Performance)

| Model | Channels | Max Freq | Sample Rate | Arb Memory | Features |
|-------|----------|----------|-------------|------------|----------|
| SDG6012X | 2 | 120 MHz | 2.4 GSa/s | 20 Mpts | |
| SDG6022X | 2 | 200 MHz | 2.4 GSa/s | 20 Mpts | |
| SDG6032X | 2 | 350 MHz | 2.4 GSa/s | 20 Mpts | |
| SDG6052X | 2 | 500 MHz | 2.4 GSa/s | 20 Mpts | |

---

## Connection Methods

| Interface | Port/Settings | Resource String Example |
|-----------|---------------|-------------------------|
| USB-TMC | VID:PID F4EC:EE3B | `USB0::0xF4EC::0xEE3B::SDG2XABC123::INSTR` |
| LAN (Raw Socket) | Port 5025 | `TCPIP0::192.168.1.50::5025::SOCKET` |
| LAN (VXI-11) | Port 111 | `TCPIP0::192.168.1.50::INSTR` |

**Note:** Siglent uses standard port **5025** for raw socket connections.

---

## IEEE 488.2 Common Commands

```
*IDN?                → "Siglent Technologies,SDG2082X,SDG2XABC123,2.01.01.33R5"
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
*TRG                 → Software trigger
*TST?                → Self-test (0 = pass)
*WAI                 → Wait for operations complete
```

---

## Command Syntax

Siglent AWGs use a unique command format with `C<n>:` channel prefix and comma-separated parameter lists.

### Channel Prefix

```
C1:...               → Channel 1 commands
C2:...               → Channel 2 commands
```

### Basic Wave (BSWV) Syntax

The `BSWV` command sets multiple parameters at once:

```
C<n>:BSWV <param1>,<value1>[,<param2>,<value2>,...]
C<n>:BSWV?           → Query all basic wave parameters
```

**Example:**
```
C1:BSWV WVTP,SINE,FRQ,1000,AMP,2,OFST,0
```

---

## Output Control

### Enable/Disable Output

```
C<n>:OUTP {ON|OFF}                           → Enable/disable output
C<n>:OUTP?                                   → Query output state
```

### Output Load Impedance

```
C<n>:OUTP LOAD,{HZ|50}                       → Set load (HZ=High-Z, 50=50Ω)
C<n>:OUTP LOAD,<ohms>                        → Custom impedance (SDG2X/6X)
```

### Output Polarity

```
C<n>:OUTP PLRT,{NOR|INVT}                    → Normal or inverted
```

---

## Waveform Selection

### Set Waveform Type

```
C<n>:BSWV WVTP,{SINE|SQUARE|RAMP|PULSE|NOISE|ARB|DC|PRBS}
```

### Waveform Types

| Waveform | WVTP Value |
|----------|------------|
| Sine | `SINE` |
| Square | `SQUARE` |
| Ramp | `RAMP` |
| Pulse | `PULSE` |
| Noise | `NOISE` |
| Arbitrary | `ARB` |
| DC | `DC` |
| PRBS | `PRBS` |

---

## Basic Wave Parameters (BSWV)

### Frequency

```
C<n>:BSWV FRQ,<frequency>                    → Set frequency (Hz)
```

### Period

```
C<n>:BSWV PERI,<period>                      → Set period (seconds)
```

### Amplitude

```
C<n>:BSWV AMP,<vpp>                          → Amplitude in Vpp
C<n>:BSWV AMPVRMS,<vrms>                     → Amplitude in Vrms
C<n>:BSWV AMPDBM,<dbm>                       → Amplitude in dBm
```

### Offset

```
C<n>:BSWV OFST,<offset>                      → DC offset (V)
```

### High/Low Level

```
C<n>:BSWV HLEV,<voltage>                     → High level (V)
C<n>:BSWV LLEV,<voltage>                     → Low level (V)
```

### Phase

```
C<n>:BSWV PHSE,<degrees>                     → Phase (0-360°)
```

### Query All Parameters

```
C<n>:BSWV?
```

**Returns:** `WVTP,SINE,FRQ,1000HZ,PERI,0.001S,AMP,2V,AMPVRMS,0.707V,OFST,0V,HLEV,1V,LLEV,-1V,PHSE,0`

---

## Square Wave Parameters

### Duty Cycle

```
C<n>:BSWV DUTY,<percent>                     → Duty cycle (0.01-99.99%)
```

**Example:**
```
C1:BSWV WVTP,SQUARE,FRQ,1000,AMP,3.3,DUTY,25
```

---

## Ramp Parameters

### Symmetry

```
C<n>:BSWV SYM,<percent>                      → Symmetry (0-100%)
```

**Values:**
- 50% = Triangle
- 0% = Falling ramp
- 100% = Rising ramp

---

## Pulse Parameters

### Pulse Width

```
C<n>:BSWV WIDTH,<seconds>                    → Pulse width
```

### Edge Times

```
C<n>:BSWV RISE,<seconds>                     → Rise time
C<n>:BSWV FALL,<seconds>                     → Fall time
```

### Pulse Delay

```
C<n>:BSWV DLY,<seconds>                      → Delay
```

**Example:**
```
C1:BSWV WVTP,PULSE,FRQ,10000,AMP,5,WIDTH,0.00001,RISE,0.000001,FALL,0.000001
```

---

## Noise Parameters

### Noise Standard Deviation

```
C<n>:BSWV STDEV,<value>                      → Standard deviation (V)
C<n>:BSWV MEAN,<value>                       → Mean value (V)
```

---

## Modulation (MDWV)

### Modulation Syntax

```
C<n>:MDWV STATE,ON,<type>                    → Enable modulation
C<n>:MDWV STATE,OFF                          → Disable modulation
C<n>:MDWV?                                   → Query modulation parameters
```

### AM (Amplitude Modulation)

```
C<n>:MDWV STATE,ON,AM
C<n>:MDWV AM,SRC,{INT|EXT}                   → Source
C<n>:MDWV AM,DEPTH,<percent>                 → Depth (0-120%)
C<n>:MDWV AM,FRQ,<hz>                        → Modulation frequency
C<n>:MDWV AM,MDSP,{SINE|SQUARE|TRIANGLE|UPRAMP|DNRAMP|NOISE|ARB}
```

**Example:**
```
C1:MDWV STATE,ON,AM
C1:MDWV AM,SRC,INT,DEPTH,80,FRQ,1000,MDSP,SINE
```

### FM (Frequency Modulation)

```
C<n>:MDWV STATE,ON,FM
C<n>:MDWV FM,SRC,{INT|EXT}                   → Source
C<n>:MDWV FM,DEVI,<hz>                       → Frequency deviation
C<n>:MDWV FM,FRQ,<hz>                        → Modulation frequency
C<n>:MDWV FM,MDSP,{SINE|SQUARE|TRIANGLE|UPRAMP|DNRAMP|NOISE|ARB}
```

### PM (Phase Modulation)

```
C<n>:MDWV STATE,ON,PM
C<n>:MDWV PM,SRC,{INT|EXT}                   → Source
C<n>:MDWV PM,DEVI,<degrees>                  → Phase deviation
C<n>:MDWV PM,FRQ,<hz>                        → Modulation frequency
C<n>:MDWV PM,MDSP,{SINE|SQUARE|TRIANGLE|UPRAMP|DNRAMP|NOISE|ARB}
```

### FSK (Frequency Shift Keying)

```
C<n>:MDWV STATE,ON,FSK
C<n>:MDWV FSK,SRC,{INT|EXT}                  → Source
C<n>:MDWV FSK,HFRQ,<hz>                      → Hop frequency
C<n>:MDWV FSK,RATE,<hz>                      → FSK rate
```

### ASK (Amplitude Shift Keying)

```
C<n>:MDWV STATE,ON,ASK
C<n>:MDWV ASK,SRC,{INT|EXT}                  → Source
C<n>:MDWV ASK,KAMP,<vpp>                     → Keyed amplitude
C<n>:MDWV ASK,RATE,<hz>                      → ASK rate
```

### PSK (Phase Shift Keying)

```
C<n>:MDWV STATE,ON,PSK
C<n>:MDWV PSK,SRC,{INT|EXT}                  → Source
C<n>:MDWV PSK,PHSE,<degrees>                 → Phase shift
C<n>:MDWV PSK,RATE,<hz>                      → PSK rate
```

### PWM (Pulse Width Modulation)

```
C<n>:MDWV STATE,ON,PWM
C<n>:MDWV PWM,SRC,{INT|EXT}                  → Source
C<n>:MDWV PWM,DEVI,<seconds>                 → Width deviation
C<n>:MDWV PWM,DDEVI,<percent>                → Duty cycle deviation
C<n>:MDWV PWM,FRQ,<hz>                       → Modulation frequency
C<n>:MDWV PWM,MDSP,{SINE|SQUARE|TRIANGLE|UPRAMP|DNRAMP|NOISE|ARB}
```

### DSBAM (Double Sideband AM)

```
C<n>:MDWV STATE,ON,DSBAM
C<n>:MDWV DSBAM,SRC,{INT|EXT}
C<n>:MDWV DSBAM,FRQ,<hz>
C<n>:MDWV DSBAM,MDSP,{SINE|SQUARE|TRIANGLE|UPRAMP|DNRAMP|NOISE|ARB}
```

---

## Sweep (SWWV)

### Enable/Configure Sweep

```
C<n>:SWWV STATE,{ON|OFF}                     → Enable/disable sweep
C<n>:SWWV?                                   → Query sweep parameters
```

### Sweep Mode

```
C<n>:SWWV SWMD,{LINE|LOG}                    → Linear or logarithmic
C<n>:SWWV DIR,{UP|DOWN}                      → Sweep direction
```

### Frequency Range

```
C<n>:SWWV START,<hz>                         → Start frequency
C<n>:SWWV STOP,<hz>                          → Stop frequency
```

### Sweep Timing

```
C<n>:SWWV TIME,<seconds>                     → Sweep time
```

### Trigger Source

```
C<n>:SWWV TRSR,{INT|EXT|MAN}                 → Trigger source
C<n>:SWWV EDGE,{RISE|FALL}                   → External trigger edge
```

### Marker

```
C<n>:SWWV MARK,{ON|OFF}                      → Enable marker
C<n>:SWWV MRKFR,<hz>                         → Marker frequency
```

**Example:**
```
C1:SWWV STATE,ON
C1:SWWV SWMD,LINE,DIR,UP,START,100,STOP,10000,TIME,5,TRSR,INT
```

---

## Burst Mode (BTWV)

### Enable/Configure Burst

```
C<n>:BTWV STATE,{ON|OFF}                     → Enable/disable burst
C<n>:BTWV?                                   → Query burst parameters
```

### Burst Mode

```
C<n>:BTWV GATE,{NCYC|GATED}                  → N-cycle or gated mode
C<n>:BTWV TRSR,{INT|EXT|MAN}                 → Trigger source
```

### Burst Parameters

```
C<n>:BTWV TIME,<cycles>                      → Number of cycles
C<n>:BTWV PRD,<seconds>                      → Burst period (internal)
C<n>:BTWV STPS,<degrees>                     → Start phase
C<n>:BTWV DLAY,<seconds>                     → Trigger delay
C<n>:BTWV PLRT,{POS|NEG}                     → Gate polarity (gated mode)
```

### Trigger Burst

```
C<n>:BTWV MTRIG                              → Manual trigger
```

**Example:**
```
C1:BTWV STATE,ON
C1:BTWV GATE,NCYC,TIME,10,PRD,0.001,TRSR,MAN,STPS,0
C1:BTWV MTRIG
```

---

## Arbitrary Waveforms

### List Stored Waveforms

```
STL?                                          → List all stored waveforms
STL? USER                                     → List user waveforms
```

### Select Arbitrary Waveform

```
C<n>:ARWV NAME,<name>                        → Select waveform by name
C<n>:ARWV INDEX,<n>                          → Select by index
```

### Upload Waveform Data

Siglent uses a proprietary format for waveform upload:

```
C<n>:WVDT <header>,<binary_data>
```

**Header format:** `WVNM,<name>,LENGTH,<points>,WAVEDATA,<data>`

### Set Sample Rate (TrueArb)

```
C<n>:SRATE MODE,{DDS|TARB}                   → Mode selection
C<n>:SRATE VALUE,<rate>                      → Sample rate (Sa/s)
```

### Query Arb Parameters

```
C<n>:ARWV?                                   → Query selected waveform
```

---

## Sync Output

### Enable Sync

```
C<n>:SYNC {ON|OFF}                           → Enable/disable sync output
```

---

## Phase Synchronization

### Align Phases

```
EQPHASE                                       → Equalize phases (align CH1 & CH2)
```

---

## Channel Coupling

### Frequency Coupling

```
FCNT STATE,{ON|OFF}                          → Enable frequency coupling
FCNT REFCH,{CH1|CH2}                         → Reference channel
FCNT MODE,{OFFSET|RATIO}                     → Coupling mode
FCNT OFFSET,<hz>                             → Frequency offset
FCNT RATIO,<ratio>                           → Frequency ratio
```

### Amplitude Coupling

```
ACNT STATE,{ON|OFF}                          → Enable amplitude coupling
ACNT REFCH,{CH1|CH2}                         → Reference channel
```

### Phase Coupling

```
PCNT STATE,{ON|OFF}                          → Enable phase coupling
PCNT REFCH,{CH1|CH2}                         → Reference channel
PCNT MODE,{OFFSET|RATIO}                     → Coupling mode
```

---

## Counter Function

### Enable Counter

```
FCNT STATE,{ON|OFF}                          → Enable frequency counter
```

### Read Counter

```
FCNT FREQ?                                   → Read frequency (Hz)
FCNT DUTY?                                   → Read duty cycle (%)
FCNT PWIDTH?                                 → Read positive width
FCNT NWIDTH?                                 → Read negative width
```

### Counter Configuration

```
FCNT COUP,{AC|DC}                            → Input coupling
FCNT HFR,{ON|OFF}                            → High frequency mode
FCNT TRGLV,<voltage>                         → Trigger level
```

---

## System Commands

### Error Query

```
SYST:ERR?                                    → Get next error
```

### Remote/Local

```
SYST:LOCK {ON|OFF}                           → Lock front panel
```

### Buzzer

```
BUZZ {ON|OFF}                                → Enable/disable buzzer
BUZZ STATE,{ON|OFF}                          → Alternative syntax
```

---

## LAN Configuration

```
SYST:COMM:LAN:IPAD "<address>"               → Set IP address
SYST:COMM:LAN:IPAD?                          → Query IP address
SYST:COMM:LAN:SMAS "<mask>"                  → Set subnet mask
SYST:COMM:LAN:GAT "<gateway>"                → Set gateway
SYST:COMM:LAN:DHCP {ON|OFF}                  → Enable DHCP
SYST:COMM:LAN:MAC?                           → Query MAC address
SYST:COMM:LAN:APPLY                          → Apply settings
```

---

## Status System

### Status Byte

```
*STB?                                        → Query status byte
```

### Event Status Register

```
*ESR?                                        → Query event status
*ESE <mask>                                  → Set event enable mask
*ESE?                                        → Query event enable
```

---

## Programming Examples

### Basic Sine Wave

```
*RST
C1:BSWV WVTP,SINE,FRQ,1000,AMP,2,OFST,0
C1:OUTP ON
```

### Square Wave with Duty Cycle

```
*RST
C1:BSWV WVTP,SQUARE,FRQ,10000,AMP,3.3,OFST,1.65,DUTY,25
C1:OUTP LOAD,HZ
C1:OUTP ON
```

### Pulse Train

```
*RST
C1:BSWV WVTP,PULSE,FRQ,100000,AMP,5,WIDTH,0.000002,RISE,0.0000001,FALL,0.0000001
C1:OUTP ON
```

### Frequency Sweep

```
*RST
C1:BSWV WVTP,SINE,AMP,1
C1:SWWV STATE,ON
C1:SWWV SWMD,LINE,DIR,UP,START,100,STOP,10000,TIME,5,TRSR,INT
C1:OUTP ON
```

### Burst Mode

```
*RST
C1:BSWV WVTP,SINE,FRQ,10000,AMP,2
C1:BTWV STATE,ON
C1:BTWV GATE,NCYC,TIME,10,PRD,0.01,TRSR,MAN,STPS,0
C1:OUTP ON
C1:BTWV MTRIG
```

### AM Modulation

```
*RST
C1:BSWV WVTP,SINE,FRQ,100000,AMP,2
C1:MDWV STATE,ON,AM
C1:MDWV AM,SRC,INT,DEPTH,80,FRQ,1000,MDSP,SINE
C1:OUTP ON
```

### Dual Channel Quadrature

```
*RST
C1:BSWV WVTP,SINE,FRQ,1000,AMP,2,PHSE,0
C2:BSWV WVTP,SINE,FRQ,1000,AMP,2,PHSE,90
EQPHASE
C1:OUTP ON
C2:OUTP ON
```

---

## Connection Examples

### Python with pyvisa

```python
import pyvisa

rm = pyvisa.ResourceManager()
awg = rm.open_resource('TCPIP0::192.168.1.50::5025::SOCKET')
awg.read_termination = '\n'
awg.write_termination = '\n'

print(awg.query('*IDN?'))

# Configure 1 kHz sine wave
awg.write('C1:BSWV WVTP,SINE,FRQ,1000,AMP,2,OFST,0')
awg.write('C1:OUTP ON')

# Query settings
params = awg.query('C1:BSWV?')
print(f"Parameters: {params}")

awg.close()
```

### TypeScript with visa-ts

```typescript
import { createResourceManager } from 'visa-ts';

async function generateWaveform() {
  const rm = createResourceManager();
  const awg = await rm.open('TCPIP0::192.168.1.50::5025::SOCKET');

  const idnResult = await awg.query('*IDN?');
  if (idnResult.ok) {
    console.log(`Connected to: ${idnResult.value}`);
  }

  // Configure using BSWV command
  await awg.write('C1:BSWV WVTP,SINE,FRQ,1000,AMP,2,OFST,0');
  await awg.write('C1:OUTP ON');

  // Query and parse parameters
  const paramsResult = await awg.query('C1:BSWV?');
  if (paramsResult.ok) {
    console.log(`Parameters: ${paramsResult.value}`);
  }

  await awg.close();
}
```

### Parsing BSWV Response

```typescript
function parseBSWV(response: string): Record<string, string> {
  const params: Record<string, string> = {};
  const parts = response.split(',');

  for (let i = 0; i < parts.length - 1; i += 2) {
    const key = parts[i].trim();
    const value = parts[i + 1].trim();
    params[key] = value;
  }

  return params;
}

// Example: { WVTP: 'SINE', FRQ: '1000HZ', AMP: '2V', ... }
```

---

## Notes

1. **BSWV Syntax**: Siglent uses comma-separated `parameter,value` pairs. Multiple parameters can be set in one command.

2. **Units in Response**: Query responses include units (e.g., `FRQ,1000HZ`, `AMP,2V`). Strip units when parsing.

3. **Channel Prefix**: Always use `C1:` or `C2:` prefix for channel-specific commands.

4. **Load Setting**: Use `LOAD,HZ` for high-impedance, `LOAD,50` for 50Ω. This affects displayed amplitude.

5. **Phase Sync**: Use `EQPHASE` to align channels after frequency changes.

6. **TrueArb**: SDG2X/6X series support "TrueArb" mode with adjustable sample rate.

7. **Modulation Exclusive**: Only one modulation type can be active per channel.

8. **Sweep/Burst**: Sweep and burst modes are mutually exclusive.

9. **Port 5025**: Siglent uses standard port 5025, unlike Rigol's 5555.

10. **Arb Upload**: Arbitrary waveform upload uses proprietary binary format.
