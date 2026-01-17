# Rigol DG1000Z Series SCPI Command Reference

## Overview

The DG1000Z series includes:
- **DG1022Z**: 25 MHz, 2 channels
- **DG1032Z**: 30 MHz, 2 channels
- **DG1062Z**: 60 MHz, 2 channels

All models feature:
- 200 MSa/s sampling rate
- 14-bit vertical resolution
- 2 Mpts standard arbitrary waveform memory (16 Mpts optional)
- Dual independent channels
- Built-in frequency counter

## Connection Methods

### USB (USBTMC)
- Vendor ID: `0x1AB1`
- Product ID: `0x0642`
- Requires NI-VISA or compatible USBTMC driver
- VISA Resource: `USB0::0x1AB1::0x0642::<serial>::INSTR`

### LAN - Raw Socket
- **Port: 5555** (same as other Rigol instruments)
- Direct TCP socket connection

### LAN - VXI-11
- Standard VXI-11 protocol
- VISA resource string: `TCPIP::<ip>::INSTR`

### GPIB (Optional)
- Requires USB-GPIB adapter
- Address configurable via front panel

---

## IEEE 488.2 Common Commands

```
*IDN?                    Query identification
*RST                     Reset to factory defaults
*OPC                     Set Operation Complete bit
*OPC?                    Query Operation Complete (returns "1")
*CLS                     Clear status registers
*SAV USER<n>             Save state to location n (1-10)
*RCL USER<n>             Recall state from location n (1-10)
*TRG                     Trigger sweep/burst (manual trigger mode)
*WAI                     Wait for pending operations
```

### *IDN? Response Format
```
Rigol Technologies,DG1062Z,<serial>,<firmware>
```

---

## Output Control Commands

### Enable/Disable Output
```
:OUTPut1 ON              Enable CH1 output
:OUTPut1 OFF             Disable CH1 output
:OUTPut2 ON              Enable CH2 output
:OUTPut2 OFF             Disable CH2 output
:OUTPut1?                Query CH1 output state
:OUTPut2?                Query CH2 output state
```

### Output Impedance
```
:OUTPut1:IMPedance 50              Set CH1 load to 50Ω
:OUTPut1:IMPedance INFinity        Set CH1 load to High-Z
:OUTPut1:IMPedance 1000            Set CH1 load to 1000Ω
:OUTPut1:IMPedance?                Query CH1 load impedance
```
Range: 1Ω to 10kΩ, or INFinity (High-Z)

### Output Polarity
```
:OUTPut1:POLarity NORMal           Normal polarity
:OUTPut1:POLarity INVerted         Inverted polarity
:OUTPut1:POLarity?                 Query polarity
```

### Sync Output
```
:OUTPut1:SYNC ON                   Enable sync output
:OUTPut1:SYNC OFF                  Disable sync output
:OUTPut1:SYNC:POLarity POSitive    Sync positive polarity
:OUTPut1:SYNC:POLarity NEGative    Sync negative polarity
:OUTPut1:SYNC?                     Query sync state
```

---

## Source Apply Command (Quick Setup)

The `:SOURce:APPLy` command provides a quick way to configure waveforms with a single command.

### Sine Wave
```
:SOURce1:APPLy:SINusoid [<freq>[,<amp>[,<offset>[,<phase>]]]]
```

### Square Wave
```
:SOURce1:APPLy:SQUare [<freq>[,<amp>[,<offset>[,<phase>]]]]
```

### Ramp Wave
```
:SOURce1:APPLy:RAMP [<freq>[,<amp>[,<offset>[,<phase>]]]]
```

### Pulse Wave
```
:SOURce1:APPLy:PULSe [<freq>[,<amp>[,<offset>[,<phase>]]]]
```

### Noise
```
:SOURce1:APPLy:NOISe [<amp>[,<offset>]]
```

### Arbitrary Waveform
```
:SOURce1:APPLy:USER [<freq>[,<amp>[,<offset>[,<phase>]]]]
```

### Harmonic
```
:SOURce1:APPLy:HARMonic [<freq>[,<amp>[,<offset>[,<phase>]]]]
```

### DC
```
:SOURce1:APPLy:DC <offset>
```

### Query Current Configuration
```
:SOURce1:APPLy?
```
Response: `"SIN,1.000000e+03,5.000000e+00,0.000000e+00,0.000000e+00"`
(waveform, frequency, amplitude, offset, phase)

### Examples
```
:SOUR1:APPL:SIN 1000,2,0,0      CH1: 1kHz sine, 2Vpp, 0V offset, 0° phase
:SOUR2:APPL:SQU 10000,3.3,1.65  CH2: 10kHz square, 3.3Vpp, 1.65V offset
:SOUR1:APPL:PULS 1000,5,0,0     CH1: 1kHz pulse, 5Vpp
:SOUR1:APPL:NOIS 1,0            CH1: 1Vpp noise
:SOUR1:APPL:DC 2.5              CH1: 2.5V DC
```

---

## Frequency Commands

### Set/Query Frequency
```
:SOURce1:FREQuency[:FIXed] <freq>     Set CH1 frequency (Hz)
:SOURce1:FREQuency[:FIXed]?           Query CH1 frequency
```

### Frequency Range (Model Dependent)
| Model | Sine | Square | Ramp | Pulse | Arb |
|-------|------|--------|------|-------|-----|
| DG1022Z | 25 MHz | 25 MHz | 1 MHz | 15 MHz | 10 MHz |
| DG1032Z | 30 MHz | 25 MHz | 1 MHz | 15 MHz | 10 MHz |
| DG1062Z | 60 MHz | 25 MHz | 1 MHz | 25 MHz | 20 MHz |

### Examples
```
:SOUR1:FREQ 1000                Set CH1 frequency to 1 kHz
:SOUR1:FREQ 1e6                 Set CH1 frequency to 1 MHz
:SOUR2:FREQ?                    Query CH2 frequency
```

---

## Function (Waveform Type) Commands

### Set Waveform Type
```
:SOURce1:FUNCtion[:SHAPe] SINusoid    Sine wave
:SOURce1:FUNCtion[:SHAPe] SQUare      Square wave
:SOURce1:FUNCtion[:SHAPe] RAMP        Ramp/Triangle wave
:SOURce1:FUNCtion[:SHAPe] PULSe       Pulse wave
:SOURce1:FUNCtion[:SHAPe] NOISe       Noise
:SOURce1:FUNCtion[:SHAPe] USER        Arbitrary waveform
:SOURce1:FUNCtion[:SHAPe] HARMonic    Harmonic waveform
:SOURce1:FUNCtion[:SHAPe] DC          DC output
```

### Query Waveform Type
```
:SOURce1:FUNCtion[:SHAPe]?
```
Response: `SIN`, `SQU`, `RAMP`, `PULS`, `NOIS`, `USER`, `HARM`, or `DC`

### Ramp Symmetry
```
:SOURce1:FUNCtion:RAMP:SYMMetry <percent>    Set symmetry (0-100%)
:SOURce1:FUNCtion:RAMP:SYMMetry?             Query symmetry
```
- 50% = triangle wave
- 100% = sawtooth up
- 0% = sawtooth down

### Square/Pulse Duty Cycle
```
:SOURce1:FUNCtion:SQUare:DCYCle <percent>    Set duty cycle (20-80%)
:SOURce1:FUNCtion:SQUare:DCYCle?             Query duty cycle
```

---

## Voltage (Amplitude) Commands

### Amplitude
```
:SOURce1:VOLTage[:LEVel][:IMMediate][:AMPLitude] <amp>    Set amplitude (Vpp)
:SOURce1:VOLTage[:LEVel][:IMMediate][:AMPLitude]?        Query amplitude
```

### Offset
```
:SOURce1:VOLTage[:LEVel][:IMMediate]:OFFSet <offset>     Set offset (V)
:SOURce1:VOLTage[:LEVel][:IMMediate]:OFFSet?             Query offset
```

### High/Low Level (Alternative to Amp/Offset)
```
:SOURce1:VOLTage[:LEVel][:IMMediate]:HIGH <level>        Set high level (V)
:SOURce1:VOLTage[:LEVel][:IMMediate]:HIGH?               Query high level
:SOURce1:VOLTage[:LEVel][:IMMediate]:LOW <level>         Set low level (V)
:SOURce1:VOLTage[:LEVel][:IMMediate]:LOW?                Query low level
```

### Amplitude Units
```
:SOURce1:VOLTage:UNIT VPP                                Peak-to-peak
:SOURce1:VOLTage:UNIT VRMS                               RMS
:SOURce1:VOLTage:UNIT DBM                                dBm (requires 50Ω load)
:SOURce1:VOLTage:UNIT?                                   Query unit
```

### Examples
```
:SOUR1:VOLT 2                   Set CH1 amplitude to 2 Vpp
:SOUR1:VOLT:OFFS 0.5            Set CH1 offset to 0.5 V
:SOUR1:VOLT:HIGH 2              Set CH1 high level to 2 V
:SOUR1:VOLT:LOW -1              Set CH1 low level to -1 V
```

---

## Phase Commands

```
:SOURce1:PHASe[:ADJust] <phase>     Set phase (0-360°)
:SOURce1:PHASe[:ADJust]?            Query phase
:SOURce1:PHASe:INITiate             Align phases of CH1 and CH2
```

### Phase Synchronization
```
:SOURce1:PHASe:SYNChronize          Force both channels to same phase
```

---

## Pulse Commands

```
:SOURce1:PULSe:WIDTh <width>        Set pulse width (seconds)
:SOURce1:PULSe:WIDTh?               Query pulse width
:SOURce1:PULSe:DCYCle <duty>        Set duty cycle (%)
:SOURce1:PULSe:DCYCle?              Query duty cycle
:SOURce1:PULSe:TRANsition[:LEAD] <time>    Set rise time (seconds)
:SOURce1:PULSe:TRANsition:TRAil <time>     Set fall time (seconds)
:SOURce1:PULSe:DELay <delay>        Set pulse delay (seconds)
```

### Examples
```
:SOUR1:PULS:WIDT 1e-6              Set pulse width to 1 µs
:SOUR1:PULS:DCYC 25                Set duty cycle to 25%
:SOUR1:PULS:TRAN 5e-9              Set rise time to 5 ns
:SOUR1:PULS:TRAN:TRA 5e-9          Set fall time to 5 ns
```

---

## Modulation Commands

### Enable/Disable Modulation
```
:SOURce1:MOD[:STATe] ON            Enable modulation
:SOURce1:MOD[:STATe] OFF           Disable modulation
:SOURce1:MOD[:STATe]?              Query modulation state
```

### Modulation Type
```
:SOURce1:MOD:TYPe AM               Amplitude modulation
:SOURce1:MOD:TYPe FM               Frequency modulation
:SOURce1:MOD:TYPe PM               Phase modulation
:SOURce1:MOD:TYPe FSK              Frequency shift keying
:SOURce1:MOD:TYPe ASK              Amplitude shift keying
:SOURce1:MOD:TYPe PSK              Phase shift keying
:SOURce1:MOD:TYPe PWM              Pulse width modulation
:SOURce1:MOD:TYPe?                 Query modulation type
```

### AM Configuration
```
:SOURce1:AM:SOURce INTernal        Internal modulation source
:SOURce1:AM:SOURce EXTernal        External modulation source
:SOURce1:AM:INTernal:FUNCtion SINusoid    Modulating waveform
:SOURce1:AM:INTernal:FREQuency <freq>     Modulating frequency
:SOURce1:AM:DEPTh <depth>          Modulation depth (0-120%)
:SOURce1:AM:DSSC ON                Enable DSB-SC (suppressed carrier)
```

### FM Configuration
```
:SOURce1:FM:SOURce INTernal        Internal modulation source
:SOURce1:FM:INTernal:FUNCtion SINusoid    Modulating waveform
:SOURce1:FM:INTernal:FREQuency <freq>     Modulating frequency
:SOURce1:FM:DEViation <dev>        Frequency deviation (Hz)
```

### PM Configuration
```
:SOURce1:PM:SOURce INTernal        Internal modulation source
:SOURce1:PM:INTernal:FUNCtion SINusoid    Modulating waveform
:SOURce1:PM:INTernal:FREQuency <freq>     Modulating frequency
:SOURce1:PM:DEViation <dev>        Phase deviation (0-360°)
```

### FSK Configuration
```
:SOURce1:FSKey:SOURce INTernal     Internal FSK source
:SOURce1:FSKey:FREQuency <freq>    Hop frequency
:SOURce1:FSKey:INTernal:RATE <rate>    Key rate (Hz)
```

### ASK Configuration
```
:SOURce1:ASKey:SOURce INTernal     Internal ASK source
:SOURce1:ASKey:AMPLitude <amp>     Modulation amplitude
:SOURce1:ASKey:INTernal:RATE <rate>    Key rate (Hz)
```

### PSK Configuration
```
:SOURce1:PSKey:SOURce INTernal     Internal PSK source
:SOURce1:PSKey:PHASe <phase>       Phase shift (0-360°)
:SOURce1:PSKey:INTernal:RATE <rate>    Key rate (Hz)
```

### PWM Configuration
```
:SOURce1:PWM:SOURce INTernal       Internal PWM source
:SOURce1:PWM:INTernal:FUNCtion SINusoid    Modulating waveform
:SOURce1:PWM:INTernal:FREQuency <freq>     Modulating frequency
:SOURce1:PWM:DEViation:DCYCle <dev>        Duty cycle deviation (%)
```

### Modulating Waveform Options
- `SINusoid` - Sine
- `SQUare` - Square
- `TRIangle` - Triangle
- `UpRAMP` - Positive ramp
- `DnRAMP` - Negative ramp
- `NOISe` - Noise
- `USER` - Arbitrary

---

## Sweep Commands

### Enable/Disable Sweep
```
:SOURce1:SWEep:STATe ON            Enable sweep
:SOURce1:SWEep:STATe OFF           Disable sweep
:SOURce1:SWEep:STATe?              Query sweep state
```

### Sweep Configuration
```
:SOURce1:SWEep:TIME <time>         Sweep time (seconds)
:SOURce1:FREQuency:STARt <freq>    Start frequency
:SOURce1:FREQuency:STOP <freq>     Stop frequency
:SOURce1:FREQuency:CENTer <freq>   Center frequency
:SOURce1:FREQuency:SPAN <freq>     Frequency span
```

### Sweep Type
```
:SOURce1:SWEep:SPACing LINear      Linear sweep
:SOURce1:SWEep:SPACing LOGarithmic Logarithmic sweep
:SOURce1:SWEep:SPACing STEp        Step sweep
```

### Sweep Direction
```
:SOURce1:SWEep:DIRection UP        Sweep up
:SOURce1:SWEep:DIRection DOWN      Sweep down
```

### Sweep Trigger
```
:SOURce1:SWEep:TRIGger:SOURce INTernal     Internal trigger
:SOURce1:SWEep:TRIGger:SOURce EXTernal     External trigger
:SOURce1:SWEep:TRIGger:SOURce MANual       Manual trigger
:SOURce1:SWEep:TRIGger[:IMMediate]         Send manual trigger
```

### Trigger Output (Marker)
```
:SOURce1:MARKer:FREQuency <freq>   Marker frequency
:SOURce1:MARKer ON                 Enable marker output
:SOURce1:MARKer OFF                Disable marker output
```

### Hold/Return Time
```
:SOURce1:SWEep:HTIMe <time>        Hold time at end
:SOURce1:SWEep:RTIMe <time>        Return time
```

### Examples
```
:SOUR1:SWE:STAT ON                 Enable sweep
:SOUR1:SWE:TIME 1                  Set sweep time to 1 second
:SOUR1:FREQ:STAR 100               Start frequency 100 Hz
:SOUR1:FREQ:STOP 10000             Stop frequency 10 kHz
:SOUR1:SWE:SPAC LOG                Logarithmic sweep
```

---

## Burst Commands

### Enable/Disable Burst
```
:SOURce1:BURSt:STATe ON            Enable burst
:SOURce1:BURSt:STATe OFF           Disable burst
:SOURce1:BURSt:STATe?              Query burst state
```

### Burst Mode
```
:SOURce1:BURSt:MODE TRIGgered      N-cycle burst (triggered)
:SOURce1:BURSt:MODE GATed          Gated burst
:SOURce1:BURSt:MODE INFinity       Infinite burst
:SOURce1:BURSt:MODE?               Query burst mode
```

### Burst Configuration
```
:SOURce1:BURSt:NCYCles <n>         Number of cycles (1 to 1000000)
:SOURce1:BURSt:NCYCles INFinity    Infinite cycles
:SOURce1:BURSt:INTernal:PERiod <period>    Burst period (seconds)
:SOURce1:BURSt:PHASe <phase>       Start phase (0-360°)
:SOURce1:BURSt:TDELay <delay>      Trigger delay (seconds)
```

### Burst Trigger
```
:SOURce1:BURSt:TRIGger:SOURce INTernal     Internal trigger
:SOURce1:BURSt:TRIGger:SOURce EXTernal     External trigger
:SOURce1:BURSt:TRIGger:SOURce MANual       Manual trigger
:SOURce1:BURSt:TRIGger[:IMMediate]         Send manual trigger
:SOURce1:BURSt:TRIGger:SLOPe POSitive      Trigger on rising edge
:SOURce1:BURSt:TRIGger:SLOPe NEGative      Trigger on falling edge
```

### Gate Polarity (Gated Mode)
```
:SOURce1:BURSt:GATE:POLarity NORMal        Gate high = output on
:SOURce1:BURSt:GATE:POLarity INVerted      Gate low = output on
```

### Examples
```
:SOUR1:BURS:STAT ON                Enable burst
:SOUR1:BURS:MODE TRIG              Triggered burst mode
:SOUR1:BURS:NCYC 5                 5 cycles per burst
:SOUR1:BURS:INT:PER 0.01           Burst period 10 ms
:SOUR1:BURS:TRIG:SOUR INT          Internal trigger
```

---

## Harmonic Commands

### Enable/Disable Harmonics
```
:SOURce1:HARMonic:STATe ON         Enable harmonic generation
:SOURce1:HARMonic:STATe OFF        Disable harmonics
```

### Harmonic Type
```
:SOURce1:HARMonic:TYPe EVEN        Even harmonics only
:SOURce1:HARMonic:TYPe ODD         Odd harmonics only
:SOURce1:HARMonic:TYPe ALL         All harmonics
:SOURce1:HARMonic:TYPe USER        User-defined harmonics
```

### Harmonic Order
```
:SOURce1:HARMonic:ORDer <n>        Number of harmonics (2-16)
```

### Harmonic Amplitude
```
:SOURce1:HARMonic:AMPLitude <n>,<amp>      Set amplitude of harmonic n
:SOURce1:HARMonic:PHASe <n>,<phase>        Set phase of harmonic n
```

---

## Arbitrary Waveform Commands

### Select Built-in Waveform
```
:SOURce1:FUNCtion:USER <name>      Select arbitrary waveform by name
```

### Built-in Waveform Names
Common built-in waveforms:
- `StairUp`, `StairDn`, `StairUD`
- `Trapezia`, `ExpRise`, `ExpFall`
- `Sinc`, `Cardiac`, `Gauss`
- `Lorentz`, `HaverSine`
- `Noise`, `DC`
- And many more (160+ built-in)

### List Available Waveforms
```
:SOURce1:TRACe:CATalog?            List built-in waveforms
```

### Upload Arbitrary Waveform Data
```
:SOURce1:TRACe:DATA:DAC16 VOLATILE,<binary_data>
```
- Data format: 16-bit unsigned integers
- Range: 0 to 16383 (14-bit DAC)
- Little-endian byte order

### Download Waveform Data
```
:SOURce1:TRACe:DATA:DAC16? VOLATILE
```

### Select Sample Rate Mode
```
:SOURce1:TRACe:MODE FREQuency      Period editing mode
:SOURce1:TRACe:MODE SRATe          Sample rate mode
:SOURce1:TRACe:SRATe <rate>        Set sample rate (Sa/s)
```

---

## Frequency Counter Commands

### Enable/Disable Counter
```
:COUNter[:STATe] ON                Enable frequency counter
:COUNter[:STATe] OFF               Disable frequency counter
:COUNter[:STATe] RUN               Set to running state
:COUNter[:STATe] STOP              Stop measuring
:COUNter[:STATe] SINGle            Single measurement
```

### Counter Configuration
```
:COUNter:COUPling AC               AC coupling
:COUNter:COUPling DC               DC coupling
:COUNter:LEVEl <value>             Trigger level (-2.5V to 2.5V)
:COUNter:SENSitive <percent>       Trigger sensitivity (0-100%)
:COUNter:HF ON                     Enable HF rejection (<250kHz)
:COUNter:HF OFF                    Disable HF rejection (>250kHz)
```

### Gate Time
```
:COUNter:GATEtime USER1            1.31 ms
:COUNter:GATEtime USER2            10.48 ms
:COUNter:GATEtime USER3            166.7 ms
:COUNter:GATEtime USER4            1.342 s
:COUNter:GATEtime USER5            10.73 s
:COUNter:GATEtime USER6            >10 s (for very low frequencies)
:COUNter:AUTO                      Auto-select gate time
```

### Query Measurements
```
:COUNter:MEASure?
```
Response: `<freq>,<period>,<duty>,<pos_width>,<neg_width>`
Example: `1.000000000E+03,1.000000000E-03,5.000000E+01,5.000000E-04,5.000000E-04`

### Statistics
```
:COUNter:STATIstics[:STATe] ON     Enable statistics
:COUNter:STATIstics:CLEAr          Clear statistics
:COUNter:STATIstics:DISPlay DIGITAL    Digital display
:COUNter:STATIstics:DISPlay CURVE      Graph display
```

---

## Channel Coupling Commands

### Frequency Coupling
```
:COUPling:FREQuency[:STATe] ON     Enable frequency coupling
:COUPling:FREQuency:MODE OFFSet    Deviation mode
:COUPling:FREQuency:MODE RATio     Ratio mode
:COUPling:FREQuency:DEViation <dev>    Frequency deviation (Hz)
:COUPling:FREQuency:RATio <ratio>      Frequency ratio
```

### Amplitude Coupling
```
:COUPling:AMPL[:STATe] ON          Enable amplitude coupling
:COUPling:AMPL:MODE OFFSet         Deviation mode
:COUPling:AMPL:MODE RATio          Ratio mode
:COUPling:AMPL:DEViation <dev>     Amplitude deviation (Vpp)
:COUPling:AMPL:RATio <ratio>       Amplitude ratio
```

### Phase Coupling
```
:COUPling:PHASe[:STATe] ON         Enable phase coupling
:COUPling:PHASe:MODE OFFSet        Deviation mode
:COUPling:PHASe:MODE RATio         Ratio mode
:COUPling:PHASe:DEViation <dev>    Phase deviation (degrees)
:COUPling:PHASe:RATio <ratio>      Phase ratio
```

### Enable All Coupling
```
:COUPling[:STATe] ON               Enable all coupling
:COUPling[:STATe]?                 Query all coupling states
```

### Channel Tracking
```
:SOURce:TRACK ON                   Enable tracking (both channels same)
:SOURce:TRACK OFF                  Disable tracking
:SOURce:TRACK INVerted             Inverted tracking
```

---

## System Commands

### Display
```
:DISPlay[:STATe] ON                Enable display
:DISPlay[:STATe] OFF               Disable display (remote mode only)
:DISPlay:BRIGhtness <percent>      Set brightness (1-100%)
:DISPlay:MODE DPV                  Dual parameters view
:DISPlay:MODE DGV                  Dual graph view
:DISPlay:MODE SV                   Single channel view
```

### Clock Source
```
:ROSCillator:SOURce INTernal       Internal clock
:ROSCillator:SOURce EXTernal       External 10 MHz reference
:ROSCillator:SOURce?               Query clock source
```

### System Information
```
:SYSTem:VERSion?                   Query SCPI version
:SYSTem:ERRor?                     Query error queue
```

### Network Configuration
```
:SYSTem:COMMunicate:LAN:IPADdress <ip>     Set IP address
:SYSTem:COMMunicate:LAN:IPADdress?         Query IP address
:SYSTem:COMMunicate:LAN:SMASk <mask>       Set subnet mask
:SYSTem:COMMunicate:LAN:GATeway <gw>       Set gateway
:SYSTem:COMMunicate:LAN:DHCP ON            Enable DHCP
:SYSTem:COMMunicate:LAN:DHCP OFF           Disable DHCP (static IP)
```

### Beeper
```
:SYSTem:BEEPer[:IMMediate]         Emit beep
:SYSTem:BEEPer:STATe ON            Enable beeper
:SYSTem:BEEPer:STATe OFF           Disable beeper
```

---

## Python Socket Driver

```python
import socket
import time

class RigolDG1000Z:
    """
    Driver for Rigol DG1000Z series arbitrary waveform generators.
    Tested with DG1022Z, DG1032Z, DG1062Z.
    """
    
    def __init__(self, host, port=5555, timeout=5.0):
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
        self.write(f':OUTP{channel} {state}')
    
    def get_output(self, channel):
        """Query output state."""
        return self.query(f':OUTP{channel}?')
    
    def set_impedance(self, channel, impedance):
        """Set output load impedance. Use 'INF' for high-Z or ohms value."""
        if impedance == 'INF' or impedance == float('inf'):
            self.write(f':OUTP{channel}:IMP INF')
        else:
            self.write(f':OUTP{channel}:IMP {impedance}')
    
    # === Quick Setup (Apply Command) ===
    
    def apply_sine(self, channel, freq=1000, amp=1, offset=0, phase=0):
        """Configure sine wave with single command."""
        self.write(f':SOUR{channel}:APPL:SIN {freq},{amp},{offset},{phase}')
    
    def apply_square(self, channel, freq=1000, amp=1, offset=0, phase=0):
        """Configure square wave with single command."""
        self.write(f':SOUR{channel}:APPL:SQU {freq},{amp},{offset},{phase}')
    
    def apply_ramp(self, channel, freq=1000, amp=1, offset=0, phase=0):
        """Configure ramp wave with single command."""
        self.write(f':SOUR{channel}:APPL:RAMP {freq},{amp},{offset},{phase}')
    
    def apply_pulse(self, channel, freq=1000, amp=1, offset=0, phase=0):
        """Configure pulse wave with single command."""
        self.write(f':SOUR{channel}:APPL:PULS {freq},{amp},{offset},{phase}')
    
    def apply_noise(self, channel, amp=1, offset=0):
        """Configure noise output."""
        self.write(f':SOUR{channel}:APPL:NOIS {amp},{offset}')
    
    def apply_dc(self, channel, offset):
        """Configure DC output."""
        self.write(f':SOUR{channel}:APPL:DC {offset}')
    
    def get_apply(self, channel):
        """Query current waveform configuration."""
        return self.query(f':SOUR{channel}:APPL?')
    
    # === Individual Parameters ===
    
    def set_frequency(self, channel, freq_hz):
        """Set frequency in Hz."""
        self.write(f':SOUR{channel}:FREQ {freq_hz}')
    
    def get_frequency(self, channel):
        """Query frequency."""
        return float(self.query(f':SOUR{channel}:FREQ?'))
    
    def set_amplitude(self, channel, amplitude_vpp):
        """Set amplitude in Vpp."""
        self.write(f':SOUR{channel}:VOLT {amplitude_vpp}')
    
    def get_amplitude(self, channel):
        """Query amplitude."""
        return float(self.query(f':SOUR{channel}:VOLT?'))
    
    def set_offset(self, channel, offset_v):
        """Set DC offset in volts."""
        self.write(f':SOUR{channel}:VOLT:OFFS {offset_v}')
    
    def get_offset(self, channel):
        """Query offset."""
        return float(self.query(f':SOUR{channel}:VOLT:OFFS?'))
    
    def set_phase(self, channel, phase_deg):
        """Set phase in degrees."""
        self.write(f':SOUR{channel}:PHAS {phase_deg}')
    
    def set_waveform(self, channel, waveform):
        """Set waveform type: SIN, SQU, RAMP, PULS, NOIS, USER, HARM, DC"""
        self.write(f':SOUR{channel}:FUNC {waveform}')
    
    def get_waveform(self, channel):
        """Query waveform type."""
        return self.query(f':SOUR{channel}:FUNC?')
    
    def set_duty_cycle(self, channel, duty_percent):
        """Set duty cycle for square wave."""
        self.write(f':SOUR{channel}:FUNC:SQU:DCYC {duty_percent}')
    
    def set_symmetry(self, channel, sym_percent):
        """Set symmetry for ramp wave."""
        self.write(f':SOUR{channel}:FUNC:RAMP:SYMM {sym_percent}')
    
    # === Pulse Parameters ===
    
    def set_pulse_width(self, channel, width_s):
        """Set pulse width in seconds."""
        self.write(f':SOUR{channel}:PULS:WIDT {width_s}')
    
    def set_pulse_rise(self, channel, rise_s):
        """Set pulse rise time in seconds."""
        self.write(f':SOUR{channel}:PULS:TRAN {rise_s}')
    
    def set_pulse_fall(self, channel, fall_s):
        """Set pulse fall time in seconds."""
        self.write(f':SOUR{channel}:PULS:TRAN:TRA {fall_s}')
    
    # === Modulation ===
    
    def set_modulation(self, channel, enabled):
        """Enable or disable modulation."""
        state = 'ON' if enabled else 'OFF'
        self.write(f':SOUR{channel}:MOD {state}')
    
    def set_mod_type(self, channel, mod_type):
        """Set modulation type: AM, FM, PM, FSK, ASK, PSK, PWM"""
        self.write(f':SOUR{channel}:MOD:TYP {mod_type}')
    
    def set_am(self, channel, depth=100, freq=100, shape='SIN'):
        """Configure AM modulation."""
        self.write(f':SOUR{channel}:MOD:TYP AM')
        self.write(f':SOUR{channel}:AM:DEPT {depth}')
        self.write(f':SOUR{channel}:AM:INT:FREQ {freq}')
        self.write(f':SOUR{channel}:AM:INT:FUNC {shape}')
    
    def set_fm(self, channel, deviation, freq=100, shape='SIN'):
        """Configure FM modulation."""
        self.write(f':SOUR{channel}:MOD:TYP FM')
        self.write(f':SOUR{channel}:FM:DEV {deviation}')
        self.write(f':SOUR{channel}:FM:INT:FREQ {freq}')
        self.write(f':SOUR{channel}:FM:INT:FUNC {shape}')
    
    # === Sweep ===
    
    def set_sweep(self, channel, enabled):
        """Enable or disable sweep."""
        state = 'ON' if enabled else 'OFF'
        self.write(f':SOUR{channel}:SWE:STAT {state}')
    
    def configure_sweep(self, channel, start_hz, stop_hz, time_s, spacing='LIN'):
        """Configure sweep parameters."""
        self.write(f':SOUR{channel}:FREQ:STAR {start_hz}')
        self.write(f':SOUR{channel}:FREQ:STOP {stop_hz}')
        self.write(f':SOUR{channel}:SWE:TIME {time_s}')
        self.write(f':SOUR{channel}:SWE:SPAC {spacing}')  # LIN or LOG
    
    def trigger_sweep(self, channel):
        """Send manual trigger for sweep."""
        self.write(f':SOUR{channel}:SWE:TRIG')
    
    # === Burst ===
    
    def set_burst(self, channel, enabled):
        """Enable or disable burst."""
        state = 'ON' if enabled else 'OFF'
        self.write(f':SOUR{channel}:BURS:STAT {state}')
    
    def configure_burst(self, channel, cycles, period_s=None, mode='TRIG'):
        """Configure burst parameters."""
        self.write(f':SOUR{channel}:BURS:MODE {mode}')
        if cycles == 'INF':
            self.write(f':SOUR{channel}:BURS:NCYC INF')
        else:
            self.write(f':SOUR{channel}:BURS:NCYC {cycles}')
        if period_s:
            self.write(f':SOUR{channel}:BURS:INT:PER {period_s}')
    
    def trigger_burst(self, channel):
        """Send manual trigger for burst."""
        self.write(f':SOUR{channel}:BURS:TRIG')
    
    # === Frequency Counter ===
    
    def set_counter(self, enabled):
        """Enable or disable frequency counter."""
        state = 'ON' if enabled else 'OFF'
        self.write(f':COUN {state}')
    
    def get_counter(self):
        """Query frequency counter measurements."""
        return self.query(':COUN:MEAS?')
    
    def set_counter_coupling(self, coupling):
        """Set counter coupling: AC or DC"""
        self.write(f':COUN:COUP {coupling}')
    
    def set_counter_level(self, level_v):
        """Set counter trigger level in volts."""
        self.write(f':COUN:LEV {level_v}')
    
    # === Arbitrary Waveform ===
    
    def set_arb_waveform(self, channel, name):
        """Select arbitrary waveform by name."""
        self.write(f':SOUR{channel}:FUNC USER')
        self.write(f':SOUR{channel}:FUNC:USER {name}')
    
    def list_arb_waveforms(self, channel):
        """List available arbitrary waveforms."""
        return self.query(f':SOUR{channel}:TRAC:CAT?')
    
    def upload_waveform(self, channel, data, name='VOLATILE'):
        """
        Upload arbitrary waveform data.
        
        Args:
            channel: Channel number (1 or 2)
            data: List of values (0-16383 for 14-bit DAC)
            name: Waveform name
        """
        import struct
        # Convert to little-endian 16-bit unsigned integers
        binary = struct.pack(f'<{len(data)}H', *data)
        # Build IEEE 488.2 definite length block
        length_str = str(len(binary))
        header = f'#{len(length_str)}{length_str}'
        cmd = f':SOUR{channel}:TRAC:DATA:DAC16 {name},'
        self.sock.sendall(cmd.encode() + header.encode() + binary + b'\n')
        time.sleep(0.1)
    
    # === Channel Coupling ===
    
    def set_tracking(self, mode):
        """Set tracking mode: ON, OFF, or INV (inverted)"""
        self.write(f':SOUR:TRAC {mode}')
    
    def sync_phases(self):
        """Synchronize phases of both channels."""
        self.write(':SOUR1:PHAS:SYNC')
    
    # === System ===
    
    def set_clock_source(self, source):
        """Set clock source: INT or EXT"""
        self.write(f':ROSC:SOUR {source}')
    
    def beep(self):
        """Emit beep."""
        self.write(':SYST:BEEP')


# === Usage Example ===

if __name__ == '__main__':
    # Connect to instrument
    awg = RigolDG1000Z('192.168.1.101')
    awg.connect()
    
    try:
        # Get identification
        print(awg.get_idn())
        
        # Quick setup CH1: 1 kHz sine, 2 Vpp
        awg.apply_sine(1, freq=1000, amp=2, offset=0, phase=0)
        awg.set_output(1, True)
        
        # Quick setup CH2: 1 kHz square, 3.3 Vpp, 50% duty
        awg.apply_square(2, freq=1000, amp=3.3, offset=1.65)
        awg.set_duty_cycle(2, 50)
        awg.set_output(2, True)
        
        # Query current configurations
        print(awg.get_apply(1))
        print(awg.get_apply(2))
        
        # Configure sweep on CH1
        awg.set_waveform(1, 'SIN')
        awg.configure_sweep(1, start_hz=100, stop_hz=10000, time_s=1, spacing='LOG')
        awg.set_sweep(1, True)
        
        # Configure burst on CH2
        awg.set_waveform(2, 'SIN')
        awg.set_frequency(2, 1000)
        awg.configure_burst(2, cycles=5, period_s=0.01)
        awg.set_burst(2, True)
        
        # Read frequency counter
        awg.set_counter(True)
        time.sleep(0.5)
        print("Counter:", awg.get_counter())
        
    finally:
        awg.disconnect()
```

---

## PyVISA Alternative

```python
import pyvisa

rm = pyvisa.ResourceManager()

# USB connection
awg = rm.open_resource('USB0::0x1AB1::0x0642::DG1ZA000000001::INSTR')

# LAN connection
awg = rm.open_resource('TCPIP::192.168.1.101::INSTR')

# Quick setup
awg.write(':SOUR1:APPL:SIN 1000,2,0,0')
awg.write(':OUTP1 ON')

# Query
print(awg.query('*IDN?'))
print(awg.query(':SOUR1:APPL?'))

awg.close()
```

---

## Quick Reference Card

### Common Operations

| Task | Command |
|------|---------|
| CH1 1kHz sine 2Vpp | `:SOUR1:APPL:SIN 1000,2,0,0` |
| Enable CH1 output | `:OUTP1 ON` |
| Set 50% duty square | `:SOUR1:FUNC:SQU:DCYC 50` |
| Set pulse 1µs width | `:SOUR1:PULS:WIDT 1e-6` |
| 90° phase shift | `:SOUR1:PHAS 90` |
| Enable burst 5 cycles | `:SOUR1:BURS:STAT ON` then `:SOUR1:BURS:NCYC 5` |
| Sweep 100Hz to 10kHz | `:SOUR1:SWE:STAT ON,FREQ:STAR 100,FREQ:STOP 10000` |
| AM 50% depth | `:SOUR1:MOD ON` then `:SOUR1:AM:DEPT 50` |

### Connection Quick Start

```python
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('192.168.1.101', 5555))
s.sendall(b'*IDN?\n')
print(s.recv(1024))
s.sendall(b':SOUR1:APPL:SIN 1000,2,0,0\n')
s.sendall(b':OUTP1 ON\n')
s.close()
```

---

## Command Comparison: Rigol vs Siglent

| Function | Rigol DG1000Z | Siglent SDG2000X |
|----------|---------------|------------------|
| Quick setup | `:SOUR1:APPL:SIN f,a,o,p` | `C1:BSWV WVTP,SINE,FRQ,f,AMP,a` |
| Set frequency | `:SOUR1:FREQ 1000` | `C1:BSWV FRQ,1000` |
| Set amplitude | `:SOUR1:VOLT 2` | `C1:BSWV AMP,2` |
| Enable output | `:OUTP1 ON` | `C1:OUTP ON` |
| Set duty cycle | `:SOUR1:FUNC:SQU:DCYC 50` | `C1:BSWV DUTY,50` |
| Socket port | 5555 | 5025 |
| Command prefix | `:SOURce<n>:` | `C<n>:` |
| Modulation enable | `:SOUR1:MOD ON` | `C1:MDWV STATE,ON` |
| Burst enable | `:SOUR1:BURS:STAT ON` | `C1:BTWV STATE,ON` |
| Sweep enable | `:SOUR1:SWE:STAT ON` | `C1:SWWV STATE,ON` |

Key differences:
- Rigol uses standard SCPI syntax (`:SOURce:`, `:OUTPut:`, etc.)
- Siglent uses abbreviated custom commands (`BSWV`, `MDWV`, `BTWV`)
- Rigol's `:APPLy` command sets multiple parameters at once
- Siglent requires separate commands for each parameter

---

## Notes and Limitations

1. **Memory**: 2 Mpts standard (DG1022Z), 8 Mpts (DG1032Z/DG1062Z), 16 Mpts optional.

2. **DAC Resolution**: 14-bit (0-16383 range for arbitrary waveforms).

3. **Counter Input**: Uses CH2 sync input when counter is enabled; sync output is disabled.

4. **External Clock**: Requires 10 MHz reference signal on rear panel BNC.

5. **Query Responses**: Frequency, amplitude, offset returned in scientific notation.

6. **Command Termination**: Use newline (`\n`) for all commands.

7. **Apply Command**: Most efficient way to configure waveforms - single command sets all parameters.

---

## Related Documentation

- DG1000Z User's Guide
- DG1000Z Programming Guide
- RIGOL Ultra Sigma software
