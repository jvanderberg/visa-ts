# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-01-14

### Added

- Initial release
- **Transports**
  - USB-TMC transport for USB test equipment
  - Serial transport for RS-232/RS-485 instruments
  - TCP/IP socket transport for LXI network instruments
  - Simulation transport for testing without hardware
- **Core API**
  - ResourceManager with device discovery
  - MessageBasedResource for SCPI communication
  - VISA resource string parsing (USB, Serial, TCP/IP)
  - Result-based error handling (no exceptions)
- **SCPI Utilities**
  - IEEE 488.2 definite-length block parsing
  - Arbitrary block parsing
  - Numeric and boolean value parsing
- **Session Management** (`visa-ts/sessions`)
  - SessionManager with auto-reconnect
  - DeviceSession with polling support
  - Connection state tracking
- **Simulation Backend** (`visa-ts/simulation`)
  - TypeScript-native device definitions
  - Pattern-based command matching (string or RegExp)
  - Stateful properties with validation
  - Simulated PSU device (30V/5A)
  - Simulated Electronic Load (CC/CV/CR/CP modes)
- **Utilities**
  - Auto-baud detection for serial ports (`probeSerialPort`)
- **Tooling**
  - TypeScript strict mode
  - ESLint + Prettier configuration
  - Vitest with 90% coverage thresholds
  - Husky pre-commit hooks
  - GitHub Actions CI workflow

[Unreleased]: https://github.com/jvanderberg/visa-ts/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/jvanderberg/visa-ts/releases/tag/v1.0.0
