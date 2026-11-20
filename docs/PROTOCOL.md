# BRIDGE Protocol v1.0 Specification

- **Version**: `1.0`
- **Discovery Service**: `_bridge._tcp.local.` (UDP multicast announcement `239.255.77.88:47291`)
- **Control & Data Port**: TCP `47290` over TLS 1.2 / TLS 1.3 with SHA-256 leaf certificate pinning

## Envelope Structure

Every message is UTF-8 JSON containing:

- `version`: `"1.0"`
- `messageId`: unique string (8–128 chars)
- `senderDeviceId`: device identifier (4–128 chars)
- `type`: one of the 23 supported `BridgeMessageType` enum values
- `timestamp`: Unix epoch milliseconds (checked against ±60,000 ms skew window)
- `payload`: structured JSON object validated per message type

## Message Types

- Discovery & Pairing: `DEVICE_HELLO`, `DEVICE_INFO`, `DEVICE_DISCOVERED`, `PAIRING_REQUEST`, `PAIRING_APPROVED`, `PAIRING_REJECTED`
- Session & Health: `HEARTBEAT`, `DEVICE_DISCONNECT`
- File Transfer: `FILE_TRANSFER_REQUEST`, `FILE_TRANSFER_PROGRESS`, `FILE_TRANSFER_COMPLETE`, `FILE_TRANSFER_CANCEL`
- Remote Control: `REMOTE_MOUSE_MOVE`, `REMOTE_MOUSE_CLICK`, `REMOTE_KEYBOARD_INPUT`
- Clipboard & Notifications: `CLIPBOARD_UPDATE`, `NOTIFICATION_SHARE`
- Media Streams: `SCREEN_STREAM_START`, `SCREEN_STREAM_STOP`, `CAMERA_STREAM_START`, `CAMERA_STREAM_STOP`, `AUDIO_STREAM_START`, `AUDIO_STREAM_STOP`

Reference schema: `protocol/bridge-protocol.v1.json`.
