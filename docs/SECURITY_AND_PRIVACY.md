# BRIDGE Security & Privacy Documentation

## Security Controls Implemented

- **TLS Pinning**: Windows generates an ECDSA P-256 certificate stored in user profile storage; Android pins the SHA-256 certificate fingerprint obtained during QR/PIN pairing.
- **Protected Storage**:
  - Windows: `ProtectedCredentialStore` uses `ProtectedData.Protect` (`DataProtectionScope.CurrentUser`).
  - Android: `KeystoreSecurityManager` uses `AndroidKeyStore` ECDSA signing keys and AES-256-GCM encrypted local secrets.
- **Replay & Abuse Defense**:
  - `ReplayGuard` rejects duplicate `messageId` values and timestamps skewed beyond 60 seconds.
  - `DeviceRateLimiter` enforces per-device token-bucket limits.
- **Path & Filename Safety**:
  - `sanitizeTransferFilename` / `FileTransferEngine.TrySanitizeFilename` reject `/`, `\`, `..`, null bytes, drive prefixes, and reserved Windows device names (`CON`, `NUL`, `COM1..9`, `LPT1..9`).
  - Existing files are never silently overwritten.
- **Privacy Boundaries**:
  - No background telemetry, no clipboard history collection, and no hidden remote access.
  - Screen mirroring requires Android `MediaProjection` consent and displays an ongoing foreground notification.
  - Remote control, camera preview, and audio streaming require active user actions and support instant revocation / Emergency Disconnect.
