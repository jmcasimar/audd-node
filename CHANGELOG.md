# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial wrapper implementation for AUDD core
- N-API addon using napi-rs for Rust bindings
- TypeScript SDK with full type definitions
- File adapters (JSON, CSV)
- Database adapters (SQLite, MySQL, PostgreSQL)
- Core operations: buildIR, compare, proposeResolution, applyResolution
- Normalized error handling with stable error codes
- Unit and integration tests
- Fixtures for testing
- CI/CD workflows (GitHub Actions)
- Multi-platform prebuilds support
- Documentation (API, Electron integration, MVT)
- PNPM workspace structure

### Changed
- N/A (initial release)

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

## [0.1.0] - TBD

Initial release (MVP)

### Features
- ✅ Native Node.js addon (Rust + N-API)
- ✅ TypeScript SDK
- ✅ JSON & CSV file support
- ✅ SQLite database support
- ✅ Async operations (non-blocking)
- ✅ Error handling with stable codes
- ✅ Basic tests and fixtures
- ✅ Cross-platform support (Windows, macOS, Linux)

### Known Limitations
- Mock implementation (not connected to real AUDD core yet)
- MySQL/PostgreSQL adapters not fully implemented
- No streaming support for large files
- Limited performance optimizations

---

## Version History

- `0.1.0` - Initial MVP release
- Future: Integration with real AUDD core, performance improvements, streaming

[Unreleased]: https://github.com/jmcasimar/audd-node/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/jmcasimar/audd-node/releases/tag/v0.1.0
