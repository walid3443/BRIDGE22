export const BRIDGE_PROTOCOL_VERSION = '1.0' as const;
export const BRIDGE_SERVICE_TYPE = '_bridge._tcp.local.';
export const BRIDGE_DEFAULT_PORT = 47290;

export enum BridgeMessageType {
  DEVICE_HELLO = 'DEVICE_HELLO',
  DEVICE_INFO = 'DEVICE_INFO',
  DEVICE_DISCOVERED = 'DEVICE_DISCOVERED',
  PAIRING_REQUEST = 'PAIRING_REQUEST',
  PAIRING_APPROVED = 'PAIRING_APPROVED',
  PAIRING_REJECTED = 'PAIRING_REJECTED',
  HEARTBEAT = 'HEARTBEAT',
  FILE_TRANSFER_REQUEST = 'FILE_TRANSFER_REQUEST',
  FILE_TRANSFER_PROGRESS = 'FILE_TRANSFER_PROGRESS',
  FILE_TRANSFER_COMPLETE = 'FILE_TRANSFER_COMPLETE',
  FILE_TRANSFER_CANCEL = 'FILE_TRANSFER_CANCEL',
  REMOTE_MOUSE_MOVE = 'REMOTE_MOUSE_MOVE',
  REMOTE_MOUSE_CLICK = 'REMOTE_MOUSE_CLICK',
  REMOTE_KEYBOARD_INPUT = 'REMOTE_KEYBOARD_INPUT',
  CLIPBOARD_UPDATE = 'CLIPBOARD_UPDATE',
  SCREEN_STREAM_START = 'SCREEN_STREAM_START',
  SCREEN_STREAM_STOP = 'SCREEN_STREAM_STOP',
  CAMERA_STREAM_START = 'CAMERA_STREAM_START',
  CAMERA_STREAM_STOP = 'CAMERA_STREAM_STOP',
  AUDIO_STREAM_START = 'AUDIO_STREAM_START',
  AUDIO_STREAM_STOP = 'AUDIO_STREAM_STOP',
  NOTIFICATION_SHARE = 'NOTIFICATION_SHARE',
  DEVICE_DISCONNECT = 'DEVICE_DISCONNECT',
}

export interface BridgeEnvelope<T = Record<string, unknown>> {
  version: string;
  messageId: string;
  senderDeviceId: string;
  type: BridgeMessageType;
  timestamp: number;
  payload: T;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  message?: BridgeEnvelope;
}

const VALID_TYPES = new Set<string>(Object.values(BridgeMessageType));

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown, min = 1, max = 256): value is string {
  return typeof value === 'string' && value.trim().length >= min && value.length <= max;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Validates a raw unknown input against the BRIDGE v1.0 protocol schema.
 */
export function validateBridgeMessage(
  raw: unknown,
  options?: { maxClockSkewMs?: number; nowMs?: number }
): ValidationResult {
  const errors: string[] = [];

  if (!isPlainObject(raw)) {
    return { valid: false, errors: ['Message must be a JSON object.'] };
  }

  if (raw.version !== BRIDGE_PROTOCOL_VERSION) {
    errors.push(`Unsupported protocol version: expected "${BRIDGE_PROTOCOL_VERSION}".`);
  }

  if (!isNonEmptyString(raw.messageId, 8, 128)) {
    errors.push('messageId must be a string between 8 and 128 characters.');
  }

  if (!isNonEmptyString(raw.senderDeviceId, 4, 128)) {
    errors.push('senderDeviceId must be a string between 4 and 128 characters.');
  }

  if (typeof raw.type !== 'string' || !VALID_TYPES.has(raw.type)) {
    errors.push(`Unsupported or unknown message type: "${String(raw.type)}".`);
  }

  if (!isFiniteNumber(raw.timestamp) || raw.timestamp <= 0) {
    errors.push('timestamp must be a positive finite Unix epoch millisecond integer.');
  } else if (options?.maxClockSkewMs !== undefined) {
    const now = options.nowMs ?? Date.now();
    if (Math.abs(now - raw.timestamp) > options.maxClockSkewMs) {
      errors.push(`timestamp exceeds allowed clock skew (${options.maxClockSkewMs}ms).`);
    }
  }

  if (!isPlainObject(raw.payload)) {
    errors.push('payload must be a JSON object.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const type = raw.type as BridgeMessageType;
  const payload = raw.payload as Record<string, unknown>;
  const payloadErrors = validatePayloadForType(type, payload);

  if (payloadErrors.length > 0) {
    return { valid: false, errors: payloadErrors };
  }

  return {
    valid: true,
    errors: [],
    message: {
      version: BRIDGE_PROTOCOL_VERSION,
      messageId: raw.messageId as string,
      senderDeviceId: raw.senderDeviceId as string,
      type,
      timestamp: raw.timestamp as number,
      payload,
    },
  };
}

function validatePayloadForType(
  type: BridgeMessageType,
  payload: Record<string, unknown>
): string[] {
  const errs: string[] = [];

  switch (type) {
    case BridgeMessageType.DEVICE_HELLO:
    case BridgeMessageType.DEVICE_INFO: {
      if (!isNonEmptyString(payload.deviceName, 1, 100)) {
        errs.push('payload.deviceName must be a non-empty string (max 100 chars).');
      }
      if (payload.platform !== 'windows' && payload.platform !== 'android') {
        errs.push('payload.platform must be "windows" or "android".');
      }
      break;
    }
    case BridgeMessageType.PAIRING_REQUEST: {
      if (!isNonEmptyString(payload.pairingCode, 6, 12)) {
        errs.push('payload.pairingCode must be 6-12 characters.');
      }
      if (!isNonEmptyString(payload.publicKeyFingerprint, 16, 128)) {
        errs.push('payload.publicKeyFingerprint is required.');
      }
      break;
    }
    case BridgeMessageType.PAIRING_APPROVED: {
      if (!isNonEmptyString(payload.sessionTokenId, 8, 128)) {
        errs.push('payload.sessionTokenId is required.');
      }
      break;
    }
    case BridgeMessageType.PAIRING_REJECTED:
    case BridgeMessageType.DEVICE_DISCONNECT: {
      if (payload.reason !== undefined && typeof payload.reason !== 'string') {
        errs.push('payload.reason must be a string when provided.');
      }
      break;
    }
    case BridgeMessageType.FILE_TRANSFER_REQUEST: {
      if (!isNonEmptyString(payload.transferId, 4, 64)) {
        errs.push('payload.transferId is required.');
      }
      if (!isNonEmptyString(payload.fileName, 1, 255)) {
        errs.push('payload.fileName is required.');
      } else {
        const safeCheck = sanitizeTransferFilename(payload.fileName);
        if (!safeCheck.safe) {
          errs.push(`payload.fileName rejected: ${safeCheck.reason}`);
        }
      }
      if (!isFiniteNumber(payload.fileSizeBytes) || payload.fileSizeBytes < 0) {
        errs.push('payload.fileSizeBytes must be a non-negative number.');
      }
      if (
        typeof payload.sha256 !== 'string' ||
        !/^[a-fA-F0-9]{64}$/.test(payload.sha256)
      ) {
        errs.push('payload.sha256 must be a valid 64-character hex digest.');
      }
      break;
    }
    case BridgeMessageType.FILE_TRANSFER_PROGRESS: {
      if (!isNonEmptyString(payload.transferId, 4, 64)) {
        errs.push('payload.transferId is required.');
      }
      if (!isFiniteNumber(payload.bytesTransferred) || payload.bytesTransferred < 0) {
        errs.push('payload.bytesTransferred must be a non-negative number.');
      }
      break;
    }
    case BridgeMessageType.FILE_TRANSFER_COMPLETE:
    case BridgeMessageType.FILE_TRANSFER_CANCEL: {
      if (!isNonEmptyString(payload.transferId, 4, 64)) {
        errs.push('payload.transferId is required.');
      }
      break;
    }
    case BridgeMessageType.REMOTE_MOUSE_MOVE: {
      if (!isFiniteNumber(payload.deltaX) || Math.abs(payload.deltaX) > 4000) {
        errs.push('payload.deltaX must be a finite number within [-4000, 4000].');
      }
      if (!isFiniteNumber(payload.deltaY) || Math.abs(payload.deltaY) > 4000) {
        errs.push('payload.deltaY must be a finite number within [-4000, 4000].');
      }
      break;
    }
    case BridgeMessageType.REMOTE_MOUSE_CLICK: {
      if (
        payload.button !== 'left' &&
        payload.button !== 'right' &&
        payload.button !== 'middle'
      ) {
        errs.push('payload.button must be "left", "right", or "middle".');
      }
      if (
        payload.action !== 'down' &&
        payload.action !== 'up' &&
        payload.action !== 'click'
      ) {
        errs.push('payload.action must be "down", "up", or "click".');
      }
      break;
    }
    case BridgeMessageType.REMOTE_KEYBOARD_INPUT: {
      if (payload.text !== undefined && typeof payload.text !== 'string') {
        errs.push('payload.text must be a string.');
      }
      if (payload.keyCode !== undefined && typeof payload.keyCode !== 'string') {
        errs.push('payload.keyCode must be a string.');
      }
      if (payload.text === undefined && payload.keyCode === undefined) {
        errs.push('Either payload.text or payload.keyCode is required.');
      }
      break;
    }
    case BridgeMessageType.CLIPBOARD_UPDATE: {
      if (typeof payload.content !== 'string' || payload.content.length > 262144) {
        errs.push('payload.content must be a string <= 256 KB.');
      }
      if (payload.mimeType !== 'text/plain') {
        errs.push('payload.mimeType currently supports "text/plain".');
      }
      break;
    }
    case BridgeMessageType.SCREEN_STREAM_START:
    case BridgeMessageType.CAMERA_STREAM_START: {
      if (
        payload.maxFps !== undefined &&
        (!isFiniteNumber(payload.maxFps) || payload.maxFps < 1 || payload.maxFps > 60)
      ) {
        errs.push('payload.maxFps must be between 1 and 60.');
      }
      break;
    }
    case BridgeMessageType.AUDIO_STREAM_START: {
      if (
        payload.sampleRateHz !== undefined &&
        payload.sampleRateHz !== 16000 &&
        payload.sampleRateHz !== 44100 &&
        payload.sampleRateHz !== 48000
      ) {
        errs.push('payload.sampleRateHz must be 16000, 44100, or 48000.');
      }
      break;
    }
    default:
      break;
  }

  return errs;
}

const RESERVED_WINDOWS_NAMES = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9',
]);

/**
 * Prevents path traversal, control character injection, and Windows reserved filenames.
 */
export function sanitizeTransferFilename(input: string): {
  safe: boolean;
  sanitized?: string;
  reason?: string;
} {
  if (!input || input.trim().length === 0) {
    return { safe: false, reason: 'Filename cannot be empty.' };
  }
  if (input.includes('\0')) {
    return { safe: false, reason: 'Filename contains null bytes.' };
  }
  if (input.includes('/') || input.includes('\\') || input.includes('..')) {
    return { safe: false, reason: 'Path separators and parent traversal are not permitted.' };
  }
  if (/^[a-zA-Z]:/.test(input)) {
    return { safe: false, reason: 'Drive prefixes are not permitted.' };
  }
  if (/[<>:"|?*]/.test(input)) {
    return { safe: false, reason: 'Filename contains invalid filesystem characters.' };
  }
  const stem = input.split('.')[0].toUpperCase();
  if (RESERVED_WINDOWS_NAMES.has(stem)) {
    return { safe: false, reason: `Filename uses reserved Windows device name "${stem}".` };
  }
  if (input.length > 255) {
    return { safe: false, reason: 'Filename exceeds 255 characters.' };
  }
  return { safe: true, sanitized: input.trim() };
}

/**
 * Tracks seen messageIds within a sliding window to defeat replay attacks.
 */
export class ReplayGuard {
  private seen = new Map<string, number>();

  constructor(private readonly windowMs: number = 60_000) {}

  checkAndRecord(messageId: string, timestampMs: number, nowMs: number = Date.now()): boolean {
    this.prune(nowMs);
    if (Math.abs(nowMs - timestampMs) > this.windowMs) {
      return false;
    }
    if (this.seen.has(messageId)) {
      return false;
    }
    this.seen.set(messageId, timestampMs);
    return true;
  }

  private prune(nowMs: number): void {
    for (const [id, ts] of this.seen.entries()) {
      if (nowMs - ts > this.windowMs) {
        this.seen.delete(id);
      }
    }
  }
}

/**
 * Simple per-device token-bucket rate limiter.
 */
export class DeviceRateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefillMs: number }>();

  constructor(
    private readonly capacity: number,
    private readonly refillPerSecond: number
  ) {}

  allow(deviceId: string, nowMs: number = Date.now()): boolean {
    const existing = this.buckets.get(deviceId);
    if (!existing) {
      this.buckets.set(deviceId, { tokens: this.capacity - 1, lastRefillMs: nowMs });
      return true;
    }
    const elapsedSec = Math.max(0, (nowMs - existing.lastRefillMs) / 1000);
    const replenished = Math.min(this.capacity, existing.tokens + elapsedSec * this.refillPerSecond);
    if (replenished < 1) {
      existing.tokens = replenished;
      existing.lastRefillMs = nowMs;
      return false;
    }
    existing.tokens = replenished - 1;
    existing.lastRefillMs = nowMs;
    return true;
  }
}

export type TrustState = 'unpaired' | 'pending' | 'paired' | 'revoked';

export function transitionTrustState(
  current: TrustState,
  action: 'request' | 'approve' | 'reject' | 'revoke'
): TrustState {
  switch (action) {
    case 'request':
      return current === 'unpaired' || current === 'revoked' ? 'pending' : current;
    case 'approve':
      return current === 'pending' ? 'paired' : current;
    case 'reject':
      return current === 'pending' ? 'unpaired' : current;
    case 'revoke':
      return 'revoked';
  }
}

export interface QrPairingPayload {
  host: string;
  port: number;
  deviceId: string;
  fingerprint: string;
  code: string;
}

export function parseQrPairingUri(uri: string): QrPairingPayload | null {
  try {
    const parsed = new URL(uri);
    if (parsed.protocol !== 'bridge:' || parsed.hostname !== 'pair') {
      return null;
    }
    const host = parsed.searchParams.get('host');
    const port = Number(parsed.searchParams.get('port'));
    const deviceId = parsed.searchParams.get('deviceId');
    const fingerprint = parsed.searchParams.get('fp');
    const code = parsed.searchParams.get('code');
    if (
      !host ||
      !Number.isInteger(port) ||
      port < 1024 ||
      port > 65535 ||
      !deviceId ||
      !fingerprint ||
      !code ||
      !/^\d{6}$/.test(code)
    ) {
      return null;
    }
    return { host, port, deviceId, fingerprint, code };
  } catch {
    return null;
  }
}
