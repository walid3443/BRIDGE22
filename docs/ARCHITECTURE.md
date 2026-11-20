# BRIDGE Architecture Documentation

BRIDGE connects Android smartphones (Android 10+) and Windows computers (Windows 10/11 64-bit) over direct local Wi-Fi without cloud intermediaries.

## Monorepo Layout

- `protocol/` — Canonical versioned JSON schema (`bridge-protocol.v1.json`)
- `shared/protocol/` — Reference TypeScript protocol validator, replay guard, rate limiter, filename sanitizer, and `node:test` unit suite
- `windows/` — Modular .NET 8 / WinUI 3 desktop solution (`Bridge.Core`, `Bridge.Security`, `Bridge.Discovery`, `Bridge.Networking`, `Bridge.Pairing`, `Bridge.FileTransfer`, `Bridge.RemoteControl`, `Bridge.Streaming`, `Bridge.Clipboard`, `Bridge.DeviceManagement`, `Bridge.Logging`, `Bridge.Desktop`, `Bridge.Tests`, and WiX/MSIX installer scripts)
- `android/` — Jetpack Compose Android project (`core`, `security`, `discovery`, `pairing`, `networking`, `filetransfer`, `remotecontrol`, `streaming`, `clipboard`, `permissions`, `devicemanagement`, and JUnit tests)
- `server.ts`, `server/`, `src/` — Official BRIDGE website and release portal with live disk verification and protocol validation API

## Design Principles

1. **Local-First Transport**: mDNS/DNS-SD discovery (`_bridge._tcp.local.`) and TLS 1.3 socket transport on port `47290`.
2. **Explicit Trust**: Zero automatic pairing; mutual verification via `bridge://pair` QR URI or 6-digit PIN and certificate fingerprint pinning.
3. **OS-Backed Credential Storage**: Windows DPAPI (`ProtectedData`) and Android `AndroidKeyStore`.
4. **Visible Session Controls**: Persistent notifications for screen capture and one-click Emergency Disconnect on both endpoints.
