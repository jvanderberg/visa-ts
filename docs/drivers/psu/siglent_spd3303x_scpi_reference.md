# Siglent SPD3303X/SPD3303X-E Power Supply SCPI Command Reference

> Driver abstraction reference extracted from Quick Start Guide EN_02A
> Applicable models: SPD3303X, SPD3303X-E (3-channel linear DC power supply)

## Specifications

| Channel | Voltage | Current | Notes |
|---------|---------|---------|-------|
| CH1 | 0-32V | 0-3.2A | Adjustable |
| CH2 | 0-32V | 0-3.2A | Adjustable |
| CH3 | 2.5V/3.3V/5V | 0-3.2A | Fixed selectable (front panel DIP) |

**Resolution:** 1mV/1mA (SPD3303X), 10mV/10mA (SPD3303X-E)

**Operating Modes:**
- Independent: All channels operate separately
- Series: CH1+CH2 combined for 0-60V @ 0-3.2A
- Parallel: CH1+CH2 combined for 0-32V @ 0-6.4A

---

## Connection Methods

| Method | Port/Interface | Notes |
|--------|----------------|-------|
| USBTMC | USB | Requires NI-VISA or PyVISA |
| VXI-11 | LAN | Via NI-VISA |
| Raw Socket | 5025 | Direct TCP, no library needed |
| Telnet | 5024 | Interactive |

---

## Command Notation

- **Long form**: `VOLTage` 
- **Short form**: `VOLT` (uppercase portion required)
- Commands are case-insensitive
- `{CH1|CH2}` = choose one
- `<value>` = user-supplied parameter
- `[optional]` = can be omitted
- Commands terminated with `\n`

---

## IEEE 488.2 Common Commands

```
*IDN?                    → Query identification
                           Returns: Siglent Technologies,SPD3303X,<serial>,<fw_ver>,<hw_ver>

*SAV {1|2|3|4|5}         → Save current state to memory slot

*RCL {1|2|3|4|5}         → Recall saved state from memory slot
```

---

## Channel Selection (`:INSTrument`)

```
INSTrument {CH1|CH2}     → Select active channel for subsequent commands
INSTrument?              → Query currently selected channel
                           Returns: CH1 or CH2
```

**Note:** Many commands accept optional `[{CH1|CH2}:]` prefix. If omitted, command operates on the channel selected by `INSTrument`.

---

## Voltage Commands (`:VOLTage`)

```
[{CH1|CH2}:]VOLTage <voltage>    → Set voltage setpoint (volts)
[{CH1|CH2}:]VOLTage?             → Query voltage setpoint
                                    Returns: <voltage> (e.g., 25.000)
```

**Examples:**
```
CH1:VOLT 12.5            → Set CH1 to 12.5V
VOLT 5.0                 → Set current channel to 5.0V
CH2:VOLT?                → Query CH2 voltage setpoint
```

---

## Current Commands (`:CURRent`)

```
[{CH1|CH2}:]CURRent <current>    → Set current limit (amps)
[{CH1|CH2}:]CURRent?             → Query current limit
                                    Returns: <current> (e.g., 0.500)
```

**Examples:**
```
CH1:CURR 1.5             → Set CH1 current limit to 1.5A
CURR 0.100               → Set current channel to 100mA
CH2:CURR?                → Query CH2 current limit
```

---

## Measurement Commands (`:MEASure`)

```
MEASure:VOLTage? [{CH1|CH2}]     → Measure actual output voltage
                                    Returns: <voltage> (e.g., 30.000)

MEASure:CURRent? [{CH1|CH2}]     → Measure actual output current
                                    Returns: <current> (e.g., 3.000)

MEASure:POWEr? [{CH1|CH2}]       → Measure actual output power
                                    Returns: <power> in watts (e.g., 90.000)
```

**Examples:**
```
MEAS:VOLT? CH1           → Measure CH1 voltage
MEAS:CURR? CH2           → Measure CH2 current
MEAS:POWE?               → Measure power on current channel
```

---

## Output Control (`:OUTPut`)

### Channel Output On/Off
```
OUTPut {CH1|CH2|CH3},{ON|OFF}    → Enable/disable channel output
```

**Examples:**
```
OUTP CH1,ON              → Turn on CH1
OUTP CH2,OFF             → Turn off CH2
OUTP CH3,ON              → Turn on CH3 (fixed voltage channel)
```

### Operating Mode (Track)
```
OUTPut:TRACK {0|1|2}             → Set operating mode
                                    0 = Independent
                                    1 = Series (CH1+CH2 → 0-60V)
                                    2 = Parallel (CH1+CH2 → 0-6.4A)
```

**Mode details:**
| Mode | Command | Output | Control |
|------|---------|--------|---------|
| Independent | `OUTP:TRACK 0` | CH1, CH2, CH3 separate | Each channel independent |
| Series | `OUTP:TRACK 1` | CH2(+) to CH1(-) | CH1 controls both, voltage doubled |
| Parallel | `OUTP:TRACK 2` | Use CH1 terminals | CH1 controls both, current doubled |

### Waveform Display
```
OUTPut:WAVE {CH1|CH2},{ON|OFF}   → Enable/disable waveform display on front panel
```

---

## Timer Commands (`:TIMEr`)

The timer allows programmed voltage/current sequences with up to 5 steps per channel.

### Set Timer Parameters
```
TIMEr:SET {CH1|CH2},{1|2|3|4|5},<voltage>,<current>,<time>
```

**Parameters:**
- Channel: CH1 or CH2
- Group: 1-5 (step number)
- Voltage: setpoint in volts
- Current: limit in amps
- Time: duration in seconds (max 10000s per step)

**Example:**
```
TIMEr:SET CH1,1,5.0,1.0,10       → Step 1: 5V, 1A, 10 seconds
TIMEr:SET CH1,2,12.0,0.5,30     → Step 2: 12V, 0.5A, 30 seconds
```

### Query Timer Parameters
```
TIMEr:SET? {CH1|CH2},{1|2|3|4|5}
                                 → Returns: <voltage>,<current>,<time>
```

### Enable/Disable Timer
```
TIMEr {CH1|CH2},{ON|OFF}         → Start/stop timer sequence
```

**Note:** Timer function is disabled in series/parallel modes.

---

## System Commands (`:SYSTem`)

### Error Query
```
SYSTem:ERRor?                    → Query error status
                                    Returns: 0 No Error (or error code/message)
```

### Version Query
```
SYSTem:VERSion?                  → Query firmware version
                                    Returns: e.g., 1.01.01.01.02
```

### Status Query
```
SYSTem:STATus?                   → Query system status register
                                    Returns: Hex value (e.g., 0x0224)
```

**Status Register Bit Definitions:**

| Bit | Value | Meaning |
|-----|-------|---------|
| 0 | 0/1 | CH1 CV/CC mode |
| 1 | 0/1 | CH2 CV/CC mode |
| 2-3 | 01/10 | Independent/Parallel mode |
| 4 | 0/1 | CH1 OFF/ON |
| 5 | 0/1 | CH2 OFF/ON |
| 6 | 0/1 | Timer1 OFF/ON |
| 7 | 0/1 | Timer2 OFF/ON |
| 8 | 0/1 | CH1 digital/waveform display |
| 9 | 0/1 | CH2 digital/waveform display |

**Parsing example (Python):**
```python
def parse_status(hex_str):
    status = int(hex_str, 16)
    return {
        'ch1_cc': bool(status & 0x01),
        'ch2_cc': bool(status & 0x02),
        'parallel': bool(status & 0x08),
        'series': bool(status & 0x04),
        'ch1_on': bool(status & 0x10),
        'ch2_on': bool(status & 0x20),
        'timer1_on': bool(status & 0x40),
        'timer2_on': bool(status & 0x80),
    }
```

---

## Network Configuration Commands

### IP Address
```
IPaddr <ip_address>              → Set static IP address
IPaddr?                          → Query current IP address
                                    Returns: e.g., 192.168.1.100
```

### Subnet Mask
```
MASKaddr <subnet_mask>           → Set subnet mask
MASKaddr?                        → Query subnet mask
                                    Returns: e.g., 255.255.255.0
```

### Gateway
```
GATEaddr <gateway>               → Set gateway address
GATEaddr?                        → Query gateway
                                    Returns: e.g., 192.168.1.1
```

### DHCP
```
DHCP {ON|OFF}                    → Enable/disable DHCP
DHCP?                            → Query DHCP status
                                    Returns: DHCP:ON or DHCP:OFF
```

**Note:** Static IP/Mask/Gateway commands are ignored when DHCP is ON.

---

## Complete Command Summary

| Command | Type | Description |
|---------|------|-------------|
| `*IDN?` | Query | Identification |
| `*SAV {1-5}` | Set | Save state |
| `*RCL {1-5}` | Set | Recall state |
| `INSTrument {CH1\|CH2}` | Set | Select channel |
| `INSTrument?` | Query | Query selected channel |
| `[CHx:]VOLTage <v>` | Set | Set voltage |
| `[CHx:]VOLTage?` | Query | Query voltage setpoint |
| `[CHx:]CURRent <i>` | Set | Set current limit |
| `[CHx:]CURRent?` | Query | Query current limit |
| `MEASure:VOLTage? [CHx]` | Query | Measure voltage |
| `MEASure:CURRent? [CHx]` | Query | Measure current |
| `MEASure:POWEr? [CHx]` | Query | Measure power |
| `OUTPut {CH1\|CH2\|CH3},{ON\|OFF}` | Set | Output on/off |
| `OUTPut:TRACK {0\|1\|2}` | Set | Operating mode |
| `OUTPut:WAVE {CHx},{ON\|OFF}` | Set | Waveform display |
| `TIMEr:SET CHx,n,v,i,t` | Set | Set timer step |
| `TIMEr:SET? CHx,n` | Query | Query timer step |
| `TIMEr CHx,{ON\|OFF}` | Set | Timer on/off |
| `SYSTem:ERRor?` | Query | Error status |
| `SYSTem:VERSion?` | Query | Firmware version |
| `SYSTem:STATus?` | Query | Status register |
| `IPaddr [<ip>]` | Set/Query | IP address |
| `MASKaddr [<mask>]` | Set/Query | Subnet mask |
| `GATEaddr [<gw>]` | Set/Query | Gateway |
| `DHCP {ON\|OFF}` | Set/Query | DHCP enable |

---

## Python Driver Example

```python
import socket
import time

class SPD3303X:
    def __init__(self, ip, port=5025, timeout=5.0):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(timeout)
        self.sock.connect((ip, port))
    
    def write(self, cmd):
        self.sock.send((cmd + '\n').encode())
    
    def query(self, cmd):
        self.write(cmd)
        return self.sock.recv(1024).decode().strip()
    
    def close(self):
        self.sock.close()
    
    # Identification
    def idn(self):
        return self.query('*IDN?')
    
    # Channel selection
    def select_channel(self, ch):
        self.write(f'INST CH{ch}')
    
    # Voltage
    def set_voltage(self, ch, voltage):
        self.write(f'CH{ch}:VOLT {voltage}')
    
    def get_voltage(self, ch):
        return float(self.query(f'CH{ch}:VOLT?'))
    
    def measure_voltage(self, ch):
        return float(self.query(f'MEAS:VOLT? CH{ch}'))
    
    # Current
    def set_current(self, ch, current):
        self.write(f'CH{ch}:CURR {current}')
    
    def get_current(self, ch):
        return float(self.query(f'CH{ch}:CURR?'))
    
    def measure_current(self, ch):
        return float(self.query(f'MEAS:CURR? CH{ch}'))
    
    # Power
    def measure_power(self, ch):
        return float(self.query(f'MEAS:POWE? CH{ch}'))
    
    # Output control
    def output_on(self, ch):
        self.write(f'OUTP CH{ch},ON')
    
    def output_off(self, ch):
        self.write(f'OUTP CH{ch},OFF')
    
    def all_off(self):
        for ch in [1, 2, 3]:
            self.output_off(ch)
    
    # Operating mode
    def set_independent(self):
        self.write('OUTP:TRACK 0')
    
    def set_series(self):
        self.write('OUTP:TRACK 1')
    
    def set_parallel(self):
        self.write('OUTP:TRACK 2')
    
    # Status
    def get_status(self):
        hex_str = self.query('SYST:STAT?')
        status = int(hex_str, 16)
        return {
            'ch1_cc': bool(status & 0x01),
            'ch2_cc': bool(status & 0x02),
            'independent': not (status & 0x0C),
            'series': bool(status & 0x04),
            'parallel': bool(status & 0x08),
            'ch1_on': bool(status & 0x10),
            'ch2_on': bool(status & 0x20),
        }
    
    # Save/Recall
    def save(self, slot):
        self.write(f'*SAV {slot}')
    
    def recall(self, slot):
        self.write(f'*RCL {slot}')


# Usage example
if __name__ == '__main__':
    psu = SPD3303X('192.168.1.100')
    print(psu.idn())
    
    # Configure CH1: 5V, 1A limit
    psu.set_voltage(1, 5.0)
    psu.set_current(1, 1.0)
    psu.output_on(1)
    
    time.sleep(0.5)
    
    # Read measurements
    print(f"CH1 Voltage: {psu.measure_voltage(1):.3f} V")
    print(f"CH1 Current: {psu.measure_current(1):.3f} A")
    print(f"CH1 Power:   {psu.measure_power(1):.3f} W")
    
    # Check status
    status = psu.get_status()
    print(f"CH1 in CC mode: {status['ch1_cc']}")
    
    psu.output_off(1)
    psu.close()
```

---

## PyVISA Alternative

```python
import pyvisa

rm = pyvisa.ResourceManager()

# USB connection
psu = rm.open_resource('USB0::0xF4EC::0x1430::SPD3XGXXXXXXX::INSTR')

# Or LAN connection
psu = rm.open_resource('TCPIP::192.168.1.100::INSTR')

psu.write('CH1:VOLT 12.0')
psu.write('CH1:CURR 1.0')
psu.write('OUTP CH1,ON')

voltage = float(psu.query('MEAS:VOLT? CH1'))
print(f"Measured: {voltage} V")

psu.close()
```

---

## Notes

1. **Termination**: Commands use `\n` (LF). Responses also terminated with `\n`.

2. **Response time**: Allow ~100ms between commands for reliable operation.

3. **Series mode wiring**: Connect load between CH2(+) and CH1(-). Internal connection made between CH1(+) and CH2(-).

4. **Parallel mode wiring**: Use only CH1 terminals. CH2 terminals internally connected.

5. **CH3 limitations**: CH3 voltage is hardware-selected via front panel DIP switch. Only output on/off is controllable via SCPI.

6. **OCP (Over-Current Protection)**: Not directly controllable via SCPI in basic command set. Set via front panel (long-press Right button).

7. **Timer constraints**: Timer disabled in series/parallel modes. Max 5 steps per channel, max 10000s per step.

8. **USB Vendor/Product ID**: 0xF4EC / 0x1430 (for VISA resource string)
