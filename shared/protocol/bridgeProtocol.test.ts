import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BRIDGE_PROTOCOL_VERSION,
  BridgeMessageType,
  DeviceRateLimiter,
  ReplayGuard,
  parseQrPairingUri,
  sanitizeTransferFilename,
  transitionTrustState,
  validateBridgeMessage,
} from './bridgeProtocol';

test('validates a well-formed FILE_TRANSFER_REQUEST envelope', () => {
  const now = 1795193600000;
  const result = validateBridgeMessage(
    {
      version: BRIDGE_PROTOCOL_VERSION,
      messageId: 'msg-9f8e7d6c5b4a',
      senderDeviceId: 'android-pixel-8',
      type: BridgeMessageType.FILE_TRANSFER_REQUEST,
      timestamp: now,
      payload: {
        transferId: 'xfer-1001',
        fileName: 'project-notes.pdf',
        fileSizeBytes: 204800,
        sha256: 'a'.repeat(64),
      },
    },
    { maxClockSkewMs: 60_000, nowMs: now }
  );

  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.message?.type, BridgeMessageType.FILE_TRANSFER_REQUEST);
});

test('rejects unsupported protocol version and malformed message type', () => {
  const result = validateBridgeMessage({
    version: '0.9',
    messageId: 'short',
    senderDeviceId: 'pc1',
    type: 'UNKNOWN_CMD',
    timestamp: -1,
    payload: {},
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 4);
});

test('rejects path traversal and reserved Windows filenames in FILE_TRANSFER_REQUEST', () => {
  assert.equal(sanitizeTransferFilename('../../System32/cmd.exe').safe, false);
  assert.equal(sanitizeTransferFilename('CON.txt').safe, false);
  assert.equal(sanitizeTransferFilename('C:\\secret.key').safe, false);
  assert.equal(sanitizeTransferFilename('vacation-photo.jpg').safe, true);

  const msg = validateBridgeMessage({
    version: '1.0',
    messageId: 'msg-traversal-01',
    senderDeviceId: 'win-desktop-01',
    type: BridgeMessageType.FILE_TRANSFER_REQUEST,
    timestamp: Date.now(),
    payload: {
      transferId: 'xfer-bad',
      fileName: '../evil.exe',
      fileSizeBytes: 1024,
      sha256: 'b'.repeat(64),
    },
  });
  assert.equal(msg.valid, false);
});

test('ReplayGuard blocks duplicate messageIds and stale timestamps', () => {
  const guard = new ReplayGuard(60_000);
  const now = 1_700_000_000_000;

  assert.equal(guard.checkAndRecord('msg-0001', now, now), true);
  assert.equal(guard.checkAndRecord('msg-0001', now, now + 500), false);
  assert.equal(guard.checkAndRecord('msg-stale', now - 120_000, now), false);
});

test('DeviceRateLimiter enforces burst capacity and refills over time', () => {
  const limiter = new DeviceRateLimiter(2, 1);
  const t0 = 1_000_000;

  assert.equal(limiter.allow('dev-1', t0), true);
  assert.equal(limiter.allow('dev-1', t0), true);
  assert.equal(limiter.allow('dev-1', t0), false);
  assert.equal(limiter.allow('dev-1', t0 + 1100), true);
});

test('transitionTrustState never auto-trusts and supports explicit approval and revocation', () => {
  let state = transitionTrustState('unpaired', 'approve');
  assert.equal(state, 'unpaired');

  state = transitionTrustState(state, 'request');
  assert.equal(state, 'pending');

  state = transitionTrustState(state, 'approve');
  assert.equal(state, 'paired');

  state = transitionTrustState(state, 'revoke');
  assert.equal(state, 'revoked');
});

test('parseQrPairingUri parses valid bridge://pair URIs and rejects invalid ones', () => {
  const parsed = parseQrPairingUri(
    'bridge://pair?host=192.168.1.42&port=47290&deviceId=win-studio-01&fp=SHA256ABCDEF123456&code=482910'
  );
  assert.deepEqual(parsed, {
    host: '192.168.1.42',
    port: 47290,
    deviceId: 'win-studio-01',
    fingerprint: 'SHA256ABCDEF123456',
    code: '482910',
  });

  assert.equal(parseQrPairingUri('https://evil.example/pair?code=123456'), null);
  assert.equal(parseQrPairingUri('bridge://pair?host=192.168.1.42&port=80&code=123'), null);
});
