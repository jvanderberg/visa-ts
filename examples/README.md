# visa-ts Examples

Example scripts demonstrating visa-ts instrument control.

## Structure

```
examples/
├── psu-basic.ts       # Simulated PSU (runs in CI)
├── load-basic.ts      # Simulated Load (runs in CI)
├── power-test.ts      # Simulated PSU + Load (runs in CI)
└── hardware/          # Real hardware (requires physical instruments)
    ├── real-power-test.ts
    ├── scope-test.ts           # USB-TMC
    ├── scope-screenshot.ts     # USB-TMC
    ├── scope-waveform.ts       # USB-TMC
    ├── scope-test-tcpip.ts     # TCP/IP (LAN)
    ├── scope-screenshot-tcpip.ts
    └── scope-waveform-tcpip.ts
```

## Simulated Examples

These run against simulated devices and are safe for CI:

```bash
npx tsx examples/psu-basic.ts
npx tsx examples/load-basic.ts
npx tsx examples/power-test.ts
```

## Hardware Examples

These require real instruments connected via USB or serial:

```bash
# Oscilloscope via USB-TMC (Rigol DS1000Z series)
npx tsx examples/hardware/scope-test.ts
npx tsx examples/hardware/scope-screenshot.ts
npx tsx examples/hardware/scope-waveform.ts

# Oscilloscope via TCP/IP (LAN)
npx tsx examples/hardware/scope-test-tcpip.ts [ip:port]
npx tsx examples/hardware/scope-screenshot-tcpip.ts [ip:port]
npx tsx examples/hardware/scope-waveform-tcpip.ts [ip:port]

# PSU + Electronic Load
npx tsx examples/hardware/real-power-test.ts
```

## Simulated Examples

### psu-basic.ts

Basic power supply operations with simulated PSU:
- Set voltage and current limits
- Configure OVP/OCP protection
- Enable/disable output

### load-basic.ts

Basic electronic load operations with simulated load:
- Configure operating mode (CC/CV/CR/CP)
- Set load parameters
- Enable/disable input

### power-test.ts

Combined PSU + Load demonstrating voltage sag under current limiting.

## Hardware Examples

### real-power-test.ts

Same voltage sag test with real hardware:
- Matrix WPS300S-8010 PSU (serial @ 115200 baud)
- Rigol DL3021 Electronic Load (USB-TMC)

### scope-test.ts

Query oscilloscope settings and measurements:
- Timebase, channel scales, trigger settings
- Frequency, Vpp, Vrms measurements

### scope-screenshot.ts

Capture oscilloscope display as PNG image.

### scope-waveform.ts

Download waveform data as CSV with time and voltage columns.

### scope-*-tcpip.ts

Same functionality as USB versions but over TCP/IP (LAN). Accepts optional `ip:port` argument:

```bash
# Default: 169.254.245.2:5555 (link-local direct connection)
npx tsx examples/hardware/scope-test-tcpip.ts

# Custom IP/port
npx tsx examples/hardware/scope-test-tcpip.ts 192.168.1.100:5555
```
