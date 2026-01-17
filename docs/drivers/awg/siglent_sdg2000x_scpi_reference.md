# Siglent SDG2000X Series SCPI Command Reference

## Overview

The SDG2000X series includes:
- **SDG2042X**: 40 MHz, 2 channels
- **SDG2082X**: 80 MHz, 2 channels  
- **SDG2122X**: 120 MHz, 2 channels

All models feature:
- 1.2 GSa/s sampling rate (interpolated from 300 MSa/s)
- 16-bit vertical resolution
- 16 Mpts arbitrary waveform memory
- TrueArb & EasyPulse technology
- Dual independent channels

## Connection Methods

### USB (USBTMC)
- Vendor ID: `0xF4EC`
- Product ID: `0x1101`
- Requires NI-VISA or compatible USBTMC driver

### LAN - Raw Socket
- **Port: 5025**
- Direct TCP socket connection
- No additional libraries required

### LAN - Telnet
- **Port: 5024**
- Interactive command-line interface
- `telnet <ip> 5024`

### LAN - VXI-11
- Standard VXI-11 protocol
- VISA resource string: `TCPIP::<ip>::INSTR`

---

## IEEE 488.2 Common Commands

```
*IDN?                    Query identification
*RST                     Reset to default state
*OPC                     Set Operation Complete bit
*OPC?                    Query Operation Complete (returns "1")
```

### *IDN? Response Format
```
Siglent Technologies,SDG2042X,<serial>,<firmware>
```

---

## Output Control

### Enable/Disable Output
```
C1:OUTP ON               Enable CH1 output
C1:OUTP OFF              Disable CH1 output
C2:OUTP ON               Enable CH2 output
C2:OUTP OFF              Disable CH2 output
```

### Output Configuration
```
C1:OUTP LOAD,50          Set CH1 load to 50Ω
C1:OUTP LOAD,HZ          Set CH1 load to High-Z
C1:OUTP LOAD,1000        Set CH1 load to 1000Ω (50-100000Ω range)
C1:OUTP PLRT,NOR         Set CH1 polarity to normal
C1:OUTP PLRT,INVT        Set CH1 polarity to inverted
```

### Query Output State
```
C1:OUTP?
```
Response: `C1:OUTP ON,LOAD,HZ,PLRT,NOR`

---

## Basic Waveform Commands (BSWV)

### Set Waveform Type
```
C1:BSWV WVTP,SINE        Sine wave
C1:BSWV WVTP,SQUARE      Square wave
C1:BSWV WVTP,RAMP        Ramp/Triangle wave
C1:BSWV WVTP,PULSE       Pulse wave
C1:BSWV WVTP,NOISE       Noise
C1:BSWV WVTP,ARB         Arbitrary waveform
C1:BSWV WVTP,DC          DC output
```

### Set Frequency/Period
```
C1:BSWV FRQ,1000         Set frequency to 1000 Hz
C1:BSWV FRQ,1e6          Set frequency to 1 MHz
C1:BSWV PERI,0.001       Set period to 1 ms
```

### Set Amplitude/Offset
```
C1:BSWV AMP,2            Set amplitude to 2 Vpp
C1:BSWV OFST,0.5         Set offset to 0.5 V
C1:BSWV HLEV,1           Set high level to 1 V
C1:BSWV LLEV,-1          Set low level to -1 V
```

### Set Phase
```
C1:BSWV PHSE,90          Set phase to 90°
```

### Square Wave Duty Cycle
```
C1:BSWV DUTY,50          Set duty cycle to 50%
```

### Ramp Symmetry
```
C1:BSWV SYM,50           Set symmetry to 50% (triangle)
C1:BSWV SYM,100          Set symmetry to 100% (sawtooth up)
C1:BSWV SYM,0            Set symmetry to 0% (sawtooth down)
```

### Pulse Parameters
```
C1:BSWV WIDTH,0.0001     Set pulse width to 100 µs
C1:BSWV RISE,1e-8        Set rise time to 10 ns
C1:BSWV FALL,1e-8        Set fall time to 10 ns
C1:BSWV DLY,0            Set pulse delay to 0
```

### Noise Parameters
```
C1:BSWV STDEV,0.5        Set standard deviation to 0.5 V
C1:BSWV MEAN,0           Set mean to 0 V
C1:BSWV BANDSTATE,ON     Enable bandwidth limiting
C1:BSWV BANDWIDTH,1e8    Set bandwidth to 100 MHz
```

### Query Basic Wave Parameters
```
C1:BSWV?
```
Response:
```
C1:BSWV WVTP,SINE,FRQ,1000HZ,PERI,0.001S,AMP,4V,OFST,0V,HLEV,2V,LLEV,-2V,PHSE,0
```

---

## Modulation Commands (MDWV)

### Enable/Disable Modulation
```
C1:MDWV STATE,ON         Enable modulation
C1:MDWV STATE,OFF        Disable modulation
```

### Modulation Types
```
C1:MDWV AM               Amplitude Modulation
C1:MDWV DSBAM            Double Sideband AM
C1:MDWV FM               Frequency Modulation
C1:MDWV PM               Phase Modulation
C1:MDWV PWM              Pulse Width Modulation
C1:MDWV ASK              Amplitude Shift Keying
C1:MDWV FSK              Frequency Shift Keying
C1:MDWV PSK              Phase Shift Keying
```

### AM Configuration
```
C1:MDWV AM,SRC,INT       Internal modulation source
C1:MDWV AM,SRC,EXT       External modulation source
C1:MDWV AM,MDSP,SINE     Modulating waveform: sine
C1:MDWV AM,MDSP,SQUARE   Modulating waveform: square
C1:MDWV AM,FRQ,100       Modulation frequency: 100 Hz
C1:MDWV AM,DEPTH,50      Modulation depth: 50%
```

### FM Configuration
```
C1:MDWV FM,SRC,INT       Internal source
C1:MDWV FM,MDSP,SINE     Modulating waveform
C1:MDWV FM,FRQ,100       Modulation frequency
C1:MDWV FM,DEVI,1000     Frequency deviation: 1 kHz
```

### PM Configuration
```
C1:MDWV PM,SRC,INT       Internal source
C1:MDWV PM,MDSP,SINE     Modulating waveform
C1:MDWV PM,FRQ,100       Modulation frequency
C1:MDWV PM,DEVI,90       Phase deviation: 90°
```

### FSK Configuration
```
C1:MDWV FSK,SRC,INT      Internal source
C1:MDWV FSK,KFRQ,100     Key frequency: 100 Hz
C1:MDWV FSK,HFRQ,2000    Hop frequency: 2 kHz
```

### Carrier Configuration
```
C1:MDWV CARR,WVTP,SINE   Carrier waveform
C1:MDWV CARR,FRQ,10000   Carrier frequency
C1:MDWV CARR,AMP,2       Carrier amplitude
C1:MDWV CARR,OFST,0      Carrier offset
C1:MDWV CARR,PHSE,0      Carrier phase
```

### Query Modulation Parameters
```
C1:MDWV?
```

---

## Sweep Commands (SWWV)

### Enable/Disable Sweep
```
C1:SWWV STATE,ON         Enable sweep
C1:SWWV STATE,OFF        Disable sweep
```

### Sweep Configuration
```
C1:SWWV TIME,1           Sweep time: 1 second
C1:SWWV START,100        Start frequency: 100 Hz
C1:SWWV STOP,10000       Stop frequency: 10 kHz
C1:SWWV SWMD,LINE        Linear sweep
C1:SWWV SWMD,LOG         Logarithmic sweep
C1:SWWV DIR,UP           Sweep direction: up
C1:SWWV DIR,DOWN         Sweep direction: down
```

### Sweep Trigger
```
C1:SWWV TRSR,INT         Internal trigger
C1:SWWV TRSR,EXT         External trigger
C1:SWWV TRSR,MAN         Manual trigger
C1:SWWV MTRIG            Send manual trigger
C1:SWWV EDGE,RISE        Trigger on rising edge
C1:SWWV EDGE,FALL        Trigger on falling edge
C1:SWWV TRMD,ON          Enable trigger output
C1:SWWV TRMD,OFF         Disable trigger output
```

### Sweep Carrier
```
C1:SWWV CARR,WVTP,SINE   Carrier: sine
C1:SWWV CARR,WVTP,SQUARE Carrier: square
C1:SWWV CARR,WVTP,RAMP   Carrier: ramp
C1:SWWV CARR,AMP,4       Carrier amplitude
```

### Query Sweep Parameters
```
C1:SWWV?
```

---

## Burst Commands (BTWV)

### Enable/Disable Burst
```
C1:BTWV STATE,ON         Enable burst
C1:BTWV STATE,OFF        Disable burst
```

### Burst Mode
```
C1:BTWV GATE_NCYC,NCYC   N-cycle burst mode
C1:BTWV GATE_NCYC,GATE   Gated burst mode
```

### Burst Configuration
```
C1:BTWV TIME,5           Number of cycles: 5
C1:BTWV TIME,INF         Infinite cycles
C1:BTWV PRD,0.1          Burst period: 100 ms
C1:BTWV STPS,0           Start phase: 0°
C1:BTWV DLAY,0.001       Trigger delay: 1 ms
```

### Burst Trigger
```
C1:BTWV TRSR,INT         Internal trigger
C1:BTWV TRSR,EXT         External trigger
C1:BTWV TRSR,MAN         Manual trigger
C1:BTWV MTRIG            Send manual trigger
C1:BTWV EDGE,RISE        Trigger edge: rising
C1:BTWV EDGE,FALL        Trigger edge: falling
C1:BTWV PLRT,POS         Gate polarity: positive
C1:BTWV PLRT,NEG         Gate polarity: negative
```

### Burst Carrier
```
C1:BTWV CARR,WVTP,SINE   Carrier waveform
C1:BTWV CARR,FRQ,1000    Carrier frequency
C1:BTWV CARR,AMP,4       Carrier amplitude
```

### Query Burst Parameters
```
C1:BTWV?
```

---

## Arbitrary Waveform Commands

### Select Built-in Arbitrary Waveform
```
C1:ARWV INDEX,2          Select by index (StairUp)
C1:ARWV NAME,Cardiac     Select by name
```

### Query Current Arbitrary Waveform
```
C1:ARWV?
```
Response: `C1:ARWV INDEX,26,NAME,Cardiac`

### List Stored Waveforms
```
STL?                     List all waveforms
STL? BUILDIN             List built-in waveforms
STL? USER                List user waveforms
```

### Common Built-in Waveforms
| Index | Name | Index | Name |
|-------|------|-------|------|
| 2 | StairUp | 26 | Cardiac |
| 3 | StairDn | 27 | Quake |
| 5 | Ppulse | 28 | Chirp |
| 6 | Npulse | 29 | Twotone |
| 7 | Trapezia | 31 | Hamming |
| 8 | Upramp | 32 | Hanning |
| 9 | Dnramp | 33 | Kaiser |
| 10 | ExpFall | 34 | Blackman |
| 11 | ExpRise | 47 | Square |
| 18 | Sinc | 66 | Surge |
| 19 | Gaussian | 87 | ECG1 |

### Upload Arbitrary Waveform Data
```
C1:WVDT WVNM,<name>,FREQ,<freq>,AMPL,<amp>,OFST,<ofst>,PHASE,<phase>,WAVEDATA,<binary_data>
```
- Data format: 16-bit signed integers, little-endian
- Range: -32768 to +32767 (maps to -1 to +1 normalized)
- Length: 16 bytes to 16 MB

Example:
```
C1:WVDT WVNM,mywav,FREQ,1000,AMPL,4,OFST,0,PHASE,0,WAVEDATA,<binary>
C1:ARWV NAME,mywav
```

### Read Arbitrary Waveform Data
```
WVDT? USER,<wave_name>
```

---

## TrueArb / Sampling Rate Commands

### Set Waveform Mode
```
C1:SRATE MODE,DDS        DDS mode (default)
C1:SRATE MODE,TARB       TrueArb mode
```

### Set Sample Rate (TrueArb mode only)
```
C1:SRATE VALUE,1000000   Set sample rate to 1 MSa/s
```

### Query Sample Rate
```
C1:SRATE?
```
Response: `C1:SRATE MODE,TARB,VALUE,1000000`

---

## Harmonic Commands

### Enable/Disable Harmonics
```
C1:HARM HARMSTATE,ON     Enable harmonic generation
C1:HARM HARMSTATE,OFF    Disable harmonics
```

### Configure Harmonics
```
C1:HARM HARMTYPE,ALL     All harmonics
C1:HARM HARMTYPE,EVEN    Even harmonics only
C1:HARM HARMTYPE,ODD     Odd harmonics only
C1:HARM HARMORDER,2      Select 2nd harmonic
C1:HARM HARMAMP,1        Set amplitude to 1 Vpp
C1:HARM HARMDBC,-6       Set amplitude to -6 dBc
C1:HARM HARMPHASE,0      Set phase to 0°
```

### Query Harmonic Parameters
```
C1:HARM?
```

---

## Waveform Combining

### Enable/Disable Channel Combining
```
C1:CMBN ON               Enable CH1+CH2 combining on CH1 output
C1:CMBN OFF              Disable combining
```

### Query Combining State
```
C1:CMBN?
```

Note: When combining is enabled, SQUARE waveform is not available.

---

## Channel Coupling Commands

### Tracking Mode (Both channels output same signal)
```
COUP TRACE,ON            Enable tracking
COUP TRACE,OFF           Disable tracking
```

### Frequency Coupling
```
COUP FCOUP,ON            Enable frequency coupling
COUP FDEV,100            Frequency deviation: 100 Hz
COUP FRAT,2              Frequency ratio: 2x
```

### Phase Coupling
```
COUP PCOUP,ON            Enable phase coupling
COUP PDEV,90             Phase deviation: 90°
COUP PRAT,1              Phase ratio: 1x
```

### Amplitude Coupling
```
COUP ACOUP,ON            Enable amplitude coupling
COUP ADEV,1              Amplitude deviation: 1 Vpp
COUP ARAT,0.5            Amplitude ratio: 0.5x
```

### Query Coupling Parameters
```
COUP?
```

---

## Sync Output Commands

```
C1:SYNC ON               Enable sync output for CH1
C1:SYNC OFF              Disable sync output
C1:SYNC?                 Query sync state
```

---

## Phase Mode Commands

```
MODE PHASE-LOCKED        Phase-locked mode (channels synchronized)
MODE INDEPENDENT         Independent mode
MODE?                    Query phase mode
```

---

## Channel Copy Command

```
PACP C2,C1               Copy all parameters from CH1 to CH2
PACP C1,C2               Copy all parameters from CH2 to CH1
```

---

## Invert Command

```
C1:INVT ON               Invert CH1 output
C1:INVT OFF              Normal CH1 output
C1:INVT?                 Query invert state
```

---

## Frequency Counter Commands

### Enable/Disable Counter
```
FCNT STATE,ON            Enable frequency counter
FCNT STATE,OFF           Disable frequency counter
```

### Counter Configuration
```
FCNT REFQ,1000000        Set reference frequency to 1 MHz
FCNT TRG,0               Set trigger level to 0 V
FCNT MODE,AC             AC coupling
FCNT MODE,DC             DC coupling
FCNT HFR,ON              Enable high frequency rejection
FCNT HFR,OFF             Disable high frequency rejection
```

### Query Counter Results
```
FCNT?
```
Response:
```
FCNT STATE,ON,FRQ,1000000HZ,DUTY,50,REFQ,1000000HZ,TRG,0V,PW,5e-07S,NW,5e-07S,FRQDEV,0ppm,MODE,AC,HFR,OFF
```

Measured values (read-only):
- `FRQ` - Measured frequency
- `DUTY` - Measured duty cycle
- `PW` - Positive pulse width
- `NW` - Negative pulse width
- `FRQDEV` - Frequency deviation from reference

---

## System Commands

### Over-Voltage Protection
```
VOLTPRT ON               Enable over-voltage protection
VOLTPRT OFF              Disable over-voltage protection
VOLTPRT?                 Query state
```

### Clock Source
```
ROSC INT                 Internal clock
ROSC EXT                 External 10 MHz reference
ROSC?                    Query clock source
```

### Buzzer
```
BUZZ ON                  Enable buzzer
BUZZ OFF                 Disable buzzer
```

### Screen Saver
```
SCSV OFF                 Disable screen saver
SCSV 5                   Screen saver after 5 minutes
SCSV 60                  Screen saver after 60 minutes
```

### Power-On Configuration
```
SCFG DEFAULT             Load default settings on power-on
SCFG LAST                Restore last settings on power-on
```

### Language
```
LAGG EN                  English
LAGG CH                  Chinese
```

### Number Format
```
NBFM PNT,DOT             Use dot as decimal point
NBFM PNT,COMMA           Use comma as decimal point
NBFM SEPT,ON             Enable thousands separator
NBFM SEPT,OFF            Disable thousands separator
```

---

## Network Configuration

### IP Address
```
SYST:COMM:LAN:IPAD 192.168.1.100     Set IP address
SYST:COMM:LAN:IPAD?                  Query IP address
```

### Subnet Mask
```
SYST:COMM:LAN:SMAS 255.255.255.0    Set subnet mask
SYST:COMM:LAN:SMAS?                 Query subnet mask
```

### Gateway
```
SYST:COMM:LAN:GAT 192.168.1.1       Set gateway
SYST:COMM:LAN:GAT?                  Query gateway
```

---

## Python Socket Driver

```python
import socket
import time

class SiglentSDG2000X:
    """
    Driver for Siglent SDG2000X series arbitrary waveform generators.
    Tested with SDG2042X, SDG2082X, SDG2122X.
    """
    
    def __init__(self, host, port=5025, timeout=5.0):
        self.host = host
        self.port = port
        self.timeout = timeout
        self.sock = None
    
    def connect(self):
        """Establish socket connection."""
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect((self.host, self.port))
    
    def disconnect(self):
        """Close socket connection."""
        if self.sock:
            self.sock.close()
            self.sock = None
    
    def write(self, cmd):
        """Send command to instrument."""
        self.sock.sendall((cmd + '\n').encode())
    
    def read(self):
        """Read response from instrument."""
        response = b''
        while True:
            try:
                chunk = self.sock.recv(4096)
                if not chunk:
                    break
                response += chunk
                if response.endswith(b'\n'):
                    break
            except socket.timeout:
                break
        return response.decode().strip()
    
    def query(self, cmd):
        """Send command and return response."""
        self.write(cmd)
        time.sleep(0.05)
        return self.read()
    
    # === Identification ===
    
    def get_idn(self):
        """Get instrument identification."""
        return self.query('*IDN?')
    
    def reset(self):
        """Reset instrument to default state."""
        self.write('*RST')
    
    # === Output Control ===
    
    def set_output(self, channel, enabled):
        """Enable or disable channel output."""
        state = 'ON' if enabled else 'OFF'
        self.write(f'C{channel}:OUTP {state}')
    
    def get_output(self, channel):
        """Query output state."""
        return self.query(f'C{channel}:OUTP?')
    
    def set_load(self, channel, load):
        """Set output load impedance. Use 'HZ' for high-Z or ohms value."""
        self.write(f'C{channel}:OUTP LOAD,{load}')
    
    # === Basic Waveform ===
    
    def set_waveform(self, channel, waveform):
        """Set waveform type: SINE, SQUARE, RAMP, PULSE, NOISE, ARB, DC"""
        self.write(f'C{channel}:BSWV WVTP,{waveform}')
    
    def set_frequency(self, channel, freq_hz):
        """Set frequency in Hz."""
        self.write(f'C{channel}:BSWV FRQ,{freq_hz}')
    
    def set_amplitude(self, channel, amplitude_vpp):
        """Set amplitude in Vpp."""
        self.write(f'C{channel}:BSWV AMP,{amplitude_vpp}')
    
    def set_offset(self, channel, offset_v):
        """Set DC offset in volts."""
        self.write(f'C{channel}:BSWV OFST,{offset_v}')
    
    def set_phase(self, channel, phase_deg):
        """Set phase in degrees."""
        self.write(f'C{channel}:BSWV PHSE,{phase_deg}')
    
    def set_duty(self, channel, duty_percent):
        """Set duty cycle for square/pulse waves."""
        self.write(f'C{channel}:BSWV DUTY,{duty_percent}')
    
    def set_symmetry(self, channel, sym_percent):
        """Set symmetry for ramp wave."""
        self.write(f'C{channel}:BSWV SYM,{sym_percent}')
    
    def get_basic_wave(self, channel):
        """Query all basic wave parameters."""
        return self.query(f'C{channel}:BSWV?')
    
    # === Pulse Parameters ===
    
    def set_pulse_width(self, channel, width_s):
        """Set pulse width in seconds."""
        self.write(f'C{channel}:BSWV WIDTH,{width_s}')
    
    def set_rise_time(self, channel, rise_s):
        """Set rise time in seconds."""
        self.write(f'C{channel}:BSWV RISE,{rise_s}')
    
    def set_fall_time(self, channel, fall_s):
        """Set fall time in seconds."""
        self.write(f'C{channel}:BSWV FALL,{fall_s}')
    
    # === Arbitrary Waveform ===
    
    def set_arb_waveform(self, channel, name):
        """Select arbitrary waveform by name."""
        self.write(f'C{channel}:ARWV NAME,{name}')
    
    def set_arb_index(self, channel, index):
        """Select arbitrary waveform by index."""
        self.write(f'C{channel}:ARWV INDEX,{index}')
    
    def get_arb_waveform(self, channel):
        """Query current arbitrary waveform."""
        return self.query(f'C{channel}:ARWV?')
    
    def list_waveforms(self, category=None):
        """List stored waveforms. Category: None, 'BUILDIN', or 'USER'"""
        if category:
            return self.query(f'STL? {category}')
        return self.query('STL?')
    
    def upload_waveform(self, channel, name, data, freq=1000, amp=4, offset=0, phase=0):
        """
        Upload arbitrary waveform data.
        
        Args:
            channel: Channel number (1 or 2)
            name: Waveform name (string)
            data: List of 16-bit signed integers (-32768 to 32767)
            freq: Frequency in Hz
            amp: Amplitude in Vpp
            offset: DC offset in volts
            phase: Phase in degrees
        """
        import struct
        # Convert to little-endian 16-bit signed integers
        binary = struct.pack(f'<{len(data)}h', *data)
        cmd = f'C{channel}:WVDT WVNM,{name},FREQ,{freq},AMPL,{amp},OFST,{offset},PHASE,{phase},WAVEDATA,'
        self.sock.sendall(cmd.encode() + binary + b'\n')
        time.sleep(0.1)
        # Select the uploaded waveform
        self.write(f'C{channel}:ARWV NAME,{name}')
    
    # === TrueArb Mode ===
    
    def set_truearb_mode(self, channel, enabled):
        """Enable or disable TrueArb mode."""
        mode = 'TARB' if enabled else 'DDS'
        self.write(f'C{channel}:SRATE MODE,{mode}')
    
    def set_sample_rate(self, channel, rate_sa_s):
        """Set sample rate in Sa/s (TrueArb mode only)."""
        self.write(f'C{channel}:SRATE VALUE,{rate_sa_s}')
    
    # === Modulation ===
    
    def set_modulation(self, channel, enabled):
        """Enable or disable modulation."""
        state = 'ON' if enabled else 'OFF'
        self.write(f'C{channel}:MDWV STATE,{state}')
    
    def set_am(self, channel, depth=100, freq=100, shape='SINE'):
        """Configure AM modulation."""
        self.write(f'C{channel}:MDWV AM')
        self.write(f'C{channel}:MDWV AM,DEPTH,{depth}')
        self.write(f'C{channel}:MDWV AM,FRQ,{freq}')
        self.write(f'C{channel}:MDWV AM,MDSP,{shape}')
    
    def set_fm(self, channel, deviation, freq=100, shape='SINE'):
        """Configure FM modulation."""
        self.write(f'C{channel}:MDWV FM')
        self.write(f'C{channel}:MDWV FM,DEVI,{deviation}')
        self.write(f'C{channel}:MDWV FM,FRQ,{freq}')
        self.write(f'C{channel}:MDWV FM,MDSP,{shape}')
    
    def get_modulation(self, channel):
        """Query modulation parameters."""
        return self.query(f'C{channel}:MDWV?')
    
    # === Sweep ===
    
    def set_sweep(self, channel, enabled):
        """Enable or disable sweep."""
        state = 'ON' if enabled else 'OFF'
        self.write(f'C{channel}:SWWV STATE,{state}')
    
    def configure_sweep(self, channel, start_hz, stop_hz, time_s, mode='LINE'):
        """Configure sweep parameters."""
        self.write(f'C{channel}:SWWV START,{start_hz}')
        self.write(f'C{channel}:SWWV STOP,{stop_hz}')
        self.write(f'C{channel}:SWWV TIME,{time_s}')
        self.write(f'C{channel}:SWWV SWMD,{mode}')  # LINE or LOG
    
    def get_sweep(self, channel):
        """Query sweep parameters."""
        return self.query(f'C{channel}:SWWV?')
    
    # === Burst ===
    
    def set_burst(self, channel, enabled):
        """Enable or disable burst."""
        state = 'ON' if enabled else 'OFF'
        self.write(f'C{channel}:BTWV STATE,{state}')
    
    def configure_burst(self, channel, cycles, period_s=None, mode='NCYC'):
        """Configure burst parameters."""
        self.write(f'C{channel}:BTWV GATE_NCYC,{mode}')
        if cycles == 'INF':
            self.write(f'C{channel}:BTWV TIME,INF')
        else:
            self.write(f'C{channel}:BTWV TIME,{cycles}')
        if period_s:
            self.write(f'C{channel}:BTWV PRD,{period_s}')
    
    def trigger_burst(self, channel):
        """Send manual trigger for burst."""
        self.write(f'C{channel}:BTWV MTRIG')
    
    def get_burst(self, channel):
        """Query burst parameters."""
        return self.query(f'C{channel}:BTWV?')
    
    # === Channel Coupling ===
    
    def set_tracking(self, enabled):
        """Enable tracking mode (both channels output same signal)."""
        state = 'ON' if enabled else 'OFF'
        self.write(f'COUP TRACE,{state}')
    
    def set_freq_coupling(self, enabled, deviation=None, ratio=None):
        """Configure frequency coupling."""
        state = 'ON' if enabled else 'OFF'
        self.write(f'COUP FCOUP,{state}')
        if deviation is not None:
            self.write(f'COUP FDEV,{deviation}')
        if ratio is not None:
            self.write(f'COUP FRAT,{ratio}')
    
    def get_coupling(self):
        """Query coupling parameters."""
        return self.query('COUP?')
    
    # === Sync Output ===
    
    def set_sync(self, channel, enabled):
        """Enable or disable sync output."""
        state = 'ON' if enabled else 'OFF'
        self.write(f'C{channel}:SYNC {state}')
    
    # === Frequency Counter ===
    
    def set_counter(self, enabled):
        """Enable or disable frequency counter."""
        state = 'ON' if enabled else 'OFF'
        self.write(f'FCNT STATE,{state}')
    
    def get_counter(self):
        """Query frequency counter results."""
        return self.query('FCNT?')
    
    # === System ===
    
    def set_clock_source(self, source):
        """Set clock source: 'INT' or 'EXT'"""
        self.write(f'ROSC {source}')
    
    def copy_channel(self, src, dst):
        """Copy parameters from one channel to another."""
        self.write(f'PACP C{dst},C{src}')


# === Usage Example ===

if __name__ == '__main__':
    # Connect to instrument
    awg = SiglentSDG2000X('192.168.1.100')
    awg.connect()
    
    try:
        # Get identification
        print(awg.get_idn())
        
        # Configure CH1: 1 kHz sine, 2 Vpp
        awg.set_waveform(1, 'SINE')
        awg.set_frequency(1, 1000)
        awg.set_amplitude(1, 2)
        awg.set_offset(1, 0)
        awg.set_output(1, True)
        
        # Configure CH2: 1 kHz square, 3.3 Vpp, 1.65V offset (0-3.3V)
        awg.set_waveform(2, 'SQUARE')
        awg.set_frequency(2, 1000)
        awg.set_amplitude(2, 3.3)
        awg.set_offset(2, 1.65)
        awg.set_duty(2, 50)
        awg.set_output(2, True)
        
        # Query parameters
        print(awg.get_basic_wave(1))
        print(awg.get_basic_wave(2))
        
        # Create and upload custom waveform (staircase)
        import numpy as np
        steps = 8
        samples = 1024
        staircase = []
        for i in range(samples):
            level = int((i // (samples // steps)) * (65535 // (steps - 1)) - 32768)
            staircase.append(level)
        
        awg.upload_waveform(1, 'stairs8', staircase, freq=1000, amp=4)
        awg.set_waveform(1, 'ARB')
        
        # Configure sweep
        awg.set_waveform(1, 'SINE')
        awg.configure_sweep(1, 100, 10000, 1.0, 'LOG')
        awg.set_sweep(1, True)
        
    finally:
        awg.disconnect()
```

---

## PyVISA Alternative

```python
import pyvisa

rm = pyvisa.ResourceManager()

# USB connection
awg = rm.open_resource('USB0::0xF4EC::0x1101::SDG2042X::INSTR')

# LAN connection
awg = rm.open_resource('TCPIP::192.168.1.100::INSTR')

# Configure
awg.write('C1:BSWV WVTP,SINE,FRQ,1000,AMP,2')
awg.write('C1:OUTP ON')

# Query
print(awg.query('*IDN?'))
print(awg.query('C1:BSWV?'))

awg.close()
```

---

## Quick Reference Card

### Common Operations

| Task | Command |
|------|---------|
| Set CH1 1kHz sine 2Vpp | `C1:BSWV WVTP,SINE,FRQ,1000,AMP,2` |
| Enable CH1 output | `C1:OUTP ON` |
| Set 50% duty square | `C1:BSWV WVTP,SQUARE,DUTY,50` |
| Set pulse 1µs width | `C1:BSWV WVTP,PULSE,WIDTH,1e-6` |
| 90° phase shift | `C1:BSWV PHSE,90` |
| Enable burst 5 cycles | `C1:BTWV STATE,ON` then `C1:BTWV TIME,5` |
| Sweep 100Hz to 10kHz | `C1:SWWV STATE,ON,START,100,STOP,10000` |
| AM 50% depth | `C1:MDWV STATE,ON` then `C1:MDWV AM,DEPTH,50` |

### Connection Quick Start

```python
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('192.168.1.100', 5025))
s.sendall(b'*IDN?\n')
print(s.recv(1024))
s.sendall(b'C1:BSWV WVTP,SINE,FRQ,1000,AMP,2\n')
s.sendall(b'C1:OUTP ON\n')
s.close()
```

---

## Notes and Limitations

1. **TrueArb vs DDS Mode**: TrueArb mode allows setting arbitrary sample rates but may have different jitter characteristics. DDS mode interpolates to 1.2 GSa/s.

2. **Waveform Memory**: Maximum 16 MB per channel for arbitrary waveforms (16M samples at 16-bit).

3. **Channel Combining**: When enabled, SQUARE waveform type is not available.

4. **Sync Output**: Directly connected to channel output circuits - sync frequency matches output frequency.

5. **External Clock**: Requires 10 MHz reference signal on rear panel BNC.

6. **Query Response Format**: Responses include parameter names and units (e.g., `FRQ,1000HZ,AMP,2V`).

7. **Command Termination**: Use newline (`\n`) for socket communications.

---

## Related Documentation

- SDG2000X User Manual
- SDG Series Programming Guide (PG_E03B)
- Siglent EasyWave software for waveform editing
