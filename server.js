// server.ts
import express from "express";
import fs2 from "node:fs";
import path2 from "node:path";
import { createServer as createViteServer } from "vite";

// shared/protocol/bridgeProtocol.ts
var BRIDGE_PROTOCOL_VERSION = "1.0";
var BridgeMessageType = /* @__PURE__ */ ((BridgeMessageType2) => {
  BridgeMessageType2["DEVICE_HELLO"] = "DEVICE_HELLO";
  BridgeMessageType2["DEVICE_INFO"] = "DEVICE_INFO";
  BridgeMessageType2["DEVICE_DISCOVERED"] = "DEVICE_DISCOVERED";
  BridgeMessageType2["PAIRING_REQUEST"] = "PAIRING_REQUEST";
  BridgeMessageType2["PAIRING_APPROVED"] = "PAIRING_APPROVED";
  BridgeMessageType2["PAIRING_REJECTED"] = "PAIRING_REJECTED";
  BridgeMessageType2["HEARTBEAT"] = "HEARTBEAT";
  BridgeMessageType2["FILE_TRANSFER_REQUEST"] = "FILE_TRANSFER_REQUEST";
  BridgeMessageType2["FILE_TRANSFER_PROGRESS"] = "FILE_TRANSFER_PROGRESS";
  BridgeMessageType2["FILE_TRANSFER_COMPLETE"] = "FILE_TRANSFER_COMPLETE";
  BridgeMessageType2["FILE_TRANSFER_CANCEL"] = "FILE_TRANSFER_CANCEL";
  BridgeMessageType2["REMOTE_MOUSE_MOVE"] = "REMOTE_MOUSE_MOVE";
  BridgeMessageType2["REMOTE_MOUSE_CLICK"] = "REMOTE_MOUSE_CLICK";
  BridgeMessageType2["REMOTE_KEYBOARD_INPUT"] = "REMOTE_KEYBOARD_INPUT";
  BridgeMessageType2["CLIPBOARD_UPDATE"] = "CLIPBOARD_UPDATE";
  BridgeMessageType2["SCREEN_STREAM_START"] = "SCREEN_STREAM_START";
  BridgeMessageType2["SCREEN_STREAM_STOP"] = "SCREEN_STREAM_STOP";
  BridgeMessageType2["CAMERA_STREAM_START"] = "CAMERA_STREAM_START";
  BridgeMessageType2["CAMERA_STREAM_STOP"] = "CAMERA_STREAM_STOP";
  BridgeMessageType2["AUDIO_STREAM_START"] = "AUDIO_STREAM_START";
  BridgeMessageType2["AUDIO_STREAM_STOP"] = "AUDIO_STREAM_STOP";
  BridgeMessageType2["NOTIFICATION_SHARE"] = "NOTIFICATION_SHARE";
  BridgeMessageType2["DEVICE_DISCONNECT"] = "DEVICE_DISCONNECT";
  return BridgeMessageType2;
})(BridgeMessageType || {});
var VALID_TYPES = new Set(Object.values(BridgeMessageType));
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isNonEmptyString(value, min = 1, max = 256) {
  return typeof value === "string" && value.trim().length >= min && value.length <= max;
}
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function validateBridgeMessage(raw, options) {
  const errors = [];
  if (!isPlainObject(raw)) {
    return { valid: false, errors: ["Message must be a JSON object."] };
  }
  if (raw.version !== BRIDGE_PROTOCOL_VERSION) {
    errors.push(`Unsupported protocol version: expected "${BRIDGE_PROTOCOL_VERSION}".`);
  }
  if (!isNonEmptyString(raw.messageId, 8, 128)) {
    errors.push("messageId must be a string between 8 and 128 characters.");
  }
  if (!isNonEmptyString(raw.senderDeviceId, 4, 128)) {
    errors.push("senderDeviceId must be a string between 4 and 128 characters.");
  }
  if (typeof raw.type !== "string" || !VALID_TYPES.has(raw.type)) {
    errors.push(`Unsupported or unknown message type: "${String(raw.type)}".`);
  }
  if (!isFiniteNumber(raw.timestamp) || raw.timestamp <= 0) {
    errors.push("timestamp must be a positive finite Unix epoch millisecond integer.");
  } else if (options?.maxClockSkewMs !== void 0) {
    const now = options.nowMs ?? Date.now();
    if (Math.abs(now - raw.timestamp) > options.maxClockSkewMs) {
      errors.push(`timestamp exceeds allowed clock skew (${options.maxClockSkewMs}ms).`);
    }
  }
  if (!isPlainObject(raw.payload)) {
    errors.push("payload must be a JSON object.");
  }
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  const type = raw.type;
  const payload = raw.payload;
  const payloadErrors = validatePayloadForType(type, payload);
  if (payloadErrors.length > 0) {
    return { valid: false, errors: payloadErrors };
  }
  return {
    valid: true,
    errors: [],
    message: {
      version: BRIDGE_PROTOCOL_VERSION,
      messageId: raw.messageId,
      senderDeviceId: raw.senderDeviceId,
      type,
      timestamp: raw.timestamp,
      payload
    }
  };
}
function validatePayloadForType(type, payload) {
  const errs = [];
  switch (type) {
    case "DEVICE_HELLO" /* DEVICE_HELLO */:
    case "DEVICE_INFO" /* DEVICE_INFO */: {
      if (!isNonEmptyString(payload.deviceName, 1, 100)) {
        errs.push("payload.deviceName must be a non-empty string (max 100 chars).");
      }
      if (payload.platform !== "windows" && payload.platform !== "android") {
        errs.push('payload.platform must be "windows" or "android".');
      }
      break;
    }
    case "PAIRING_REQUEST" /* PAIRING_REQUEST */: {
      if (!isNonEmptyString(payload.pairingCode, 6, 12)) {
        errs.push("payload.pairingCode must be 6-12 characters.");
      }
      if (!isNonEmptyString(payload.publicKeyFingerprint, 16, 128)) {
        errs.push("payload.publicKeyFingerprint is required.");
      }
      break;
    }
    case "PAIRING_APPROVED" /* PAIRING_APPROVED */: {
      if (!isNonEmptyString(payload.sessionTokenId, 8, 128)) {
        errs.push("payload.sessionTokenId is required.");
      }
      break;
    }
    case "PAIRING_REJECTED" /* PAIRING_REJECTED */:
    case "DEVICE_DISCONNECT" /* DEVICE_DISCONNECT */: {
      if (payload.reason !== void 0 && typeof payload.reason !== "string") {
        errs.push("payload.reason must be a string when provided.");
      }
      break;
    }
    case "FILE_TRANSFER_REQUEST" /* FILE_TRANSFER_REQUEST */: {
      if (!isNonEmptyString(payload.transferId, 4, 64)) {
        errs.push("payload.transferId is required.");
      }
      if (!isNonEmptyString(payload.fileName, 1, 255)) {
        errs.push("payload.fileName is required.");
      } else {
        const safeCheck = sanitizeTransferFilename(payload.fileName);
        if (!safeCheck.safe) {
          errs.push(`payload.fileName rejected: ${safeCheck.reason}`);
        }
      }
      if (!isFiniteNumber(payload.fileSizeBytes) || payload.fileSizeBytes < 0) {
        errs.push("payload.fileSizeBytes must be a non-negative number.");
      }
      if (typeof payload.sha256 !== "string" || !/^[a-fA-F0-9]{64}$/.test(payload.sha256)) {
        errs.push("payload.sha256 must be a valid 64-character hex digest.");
      }
      break;
    }
    case "FILE_TRANSFER_PROGRESS" /* FILE_TRANSFER_PROGRESS */: {
      if (!isNonEmptyString(payload.transferId, 4, 64)) {
        errs.push("payload.transferId is required.");
      }
      if (!isFiniteNumber(payload.bytesTransferred) || payload.bytesTransferred < 0) {
        errs.push("payload.bytesTransferred must be a non-negative number.");
      }
      break;
    }
    case "FILE_TRANSFER_COMPLETE" /* FILE_TRANSFER_COMPLETE */:
    case "FILE_TRANSFER_CANCEL" /* FILE_TRANSFER_CANCEL */: {
      if (!isNonEmptyString(payload.transferId, 4, 64)) {
        errs.push("payload.transferId is required.");
      }
      break;
    }
    case "REMOTE_MOUSE_MOVE" /* REMOTE_MOUSE_MOVE */: {
      if (!isFiniteNumber(payload.deltaX) || Math.abs(payload.deltaX) > 4e3) {
        errs.push("payload.deltaX must be a finite number within [-4000, 4000].");
      }
      if (!isFiniteNumber(payload.deltaY) || Math.abs(payload.deltaY) > 4e3) {
        errs.push("payload.deltaY must be a finite number within [-4000, 4000].");
      }
      break;
    }
    case "REMOTE_MOUSE_CLICK" /* REMOTE_MOUSE_CLICK */: {
      if (payload.button !== "left" && payload.button !== "right" && payload.button !== "middle") {
        errs.push('payload.button must be "left", "right", or "middle".');
      }
      if (payload.action !== "down" && payload.action !== "up" && payload.action !== "click") {
        errs.push('payload.action must be "down", "up", or "click".');
      }
      break;
    }
    case "REMOTE_KEYBOARD_INPUT" /* REMOTE_KEYBOARD_INPUT */: {
      if (payload.text !== void 0 && typeof payload.text !== "string") {
        errs.push("payload.text must be a string.");
      }
      if (payload.keyCode !== void 0 && typeof payload.keyCode !== "string") {
        errs.push("payload.keyCode must be a string.");
      }
      if (payload.text === void 0 && payload.keyCode === void 0) {
        errs.push("Either payload.text or payload.keyCode is required.");
      }
      break;
    }
    case "CLIPBOARD_UPDATE" /* CLIPBOARD_UPDATE */: {
      if (typeof payload.content !== "string" || payload.content.length > 262144) {
        errs.push("payload.content must be a string <= 256 KB.");
      }
      if (payload.mimeType !== "text/plain") {
        errs.push('payload.mimeType currently supports "text/plain".');
      }
      break;
    }
    case "SCREEN_STREAM_START" /* SCREEN_STREAM_START */:
    case "CAMERA_STREAM_START" /* CAMERA_STREAM_START */: {
      if (payload.maxFps !== void 0 && (!isFiniteNumber(payload.maxFps) || payload.maxFps < 1 || payload.maxFps > 60)) {
        errs.push("payload.maxFps must be between 1 and 60.");
      }
      break;
    }
    case "AUDIO_STREAM_START" /* AUDIO_STREAM_START */: {
      if (payload.sampleRateHz !== void 0 && payload.sampleRateHz !== 16e3 && payload.sampleRateHz !== 44100 && payload.sampleRateHz !== 48e3) {
        errs.push("payload.sampleRateHz must be 16000, 44100, or 48000.");
      }
      break;
    }
    default:
      break;
  }
  return errs;
}
var RESERVED_WINDOWS_NAMES = /* @__PURE__ */ new Set([
  "CON",
  "PRN",
  "AUX",
  "NUL",
  "COM1",
  "COM2",
  "COM3",
  "COM4",
  "COM5",
  "COM6",
  "COM7",
  "COM8",
  "COM9",
  "LPT1",
  "LPT2",
  "LPT3",
  "LPT4",
  "LPT5",
  "LPT6",
  "LPT7",
  "LPT8",
  "LPT9"
]);
function sanitizeTransferFilename(input) {
  if (!input || input.trim().length === 0) {
    return { safe: false, reason: "Filename cannot be empty." };
  }
  if (input.includes("\0")) {
    return { safe: false, reason: "Filename contains null bytes." };
  }
  if (input.includes("/") || input.includes("\\") || input.includes("..")) {
    return { safe: false, reason: "Path separators and parent traversal are not permitted." };
  }
  if (/^[a-zA-Z]:/.test(input)) {
    return { safe: false, reason: "Drive prefixes are not permitted." };
  }
  if (/[<>:"|?*]/.test(input)) {
    return { safe: false, reason: "Filename contains invalid filesystem characters." };
  }
  const stem = input.split(".")[0].toUpperCase();
  if (RESERVED_WINDOWS_NAMES.has(stem)) {
    return { safe: false, reason: `Filename uses reserved Windows device name "${stem}".` };
  }
  if (input.length > 255) {
    return { safe: false, reason: "Filename exceeds 255 characters." };
  }
  return { safe: true, sanitized: input.trim() };
}

// server/releases.ts
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
function computeFileDigestAndSize(filePath) {
  const bytes = fs.readFileSync(filePath);
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  return { sizeBytes: bytes.byteLength, sha256 };
}
function evaluateReleaseArtifacts(rootDir, artifacts) {
  return artifacts.map((item) => {
    const resolvedPath = path.resolve(rootDir, item.localFilePath);
    const stat = resolvedPath.startsWith(path.resolve(rootDir)) && fs.existsSync(resolvedPath) ? fs.statSync(resolvedPath) : null;
    const existsLocally = Boolean(stat && stat.isFile() && stat.size > 0);
    if (existsLocally) {
      const { sizeBytes, sha256 } = computeFileDigestAndSize(resolvedPath);
      const url = item.configuredDownloadUrl || `/api/downloads/artifact/${encodeURIComponent(item.id)}`;
      return {
        id: item.id,
        platform: item.platform,
        name: item.name,
        format: item.format,
        supportedOs: item.supportedOs,
        available: true,
        downloadUrl: url,
        version: item.version ?? "1.0.0",
        releaseDate: item.releaseDate ?? new Date(stat.mtimeMs).toISOString().slice(0, 10),
        sizeBytes,
        sha256,
        releaseNotes: item.releaseNotes,
        buildEnvironmentNote: item.buildEnvironmentNote,
        statusMessage: "Verified on disk with SHA-256 checksum."
      };
    }
    const hasExternalUrl = typeof item.configuredDownloadUrl === "string" && item.configuredDownloadUrl.startsWith("https://");
    if (hasExternalUrl) {
      return {
        id: item.id,
        platform: item.platform,
        name: item.name,
        format: item.format,
        supportedOs: item.supportedOs,
        available: true,
        downloadUrl: item.configuredDownloadUrl,
        version: item.version,
        releaseDate: item.releaseDate,
        sizeBytes: typeof item.sizeBytes === "number" ? item.sizeBytes : null,
        sha256: typeof item.sha256 === "string" && /^[a-fA-F0-9]{64}$/.test(item.sha256) ? item.sha256.toLowerCase() : null,
        releaseNotes: item.releaseNotes,
        buildEnvironmentNote: item.buildEnvironmentNote,
        statusMessage: "Hosted via configured external release URL."
      };
    }
    return {
      id: item.id,
      platform: item.platform,
      name: item.name,
      format: item.format,
      supportedOs: item.supportedOs,
      available: false,
      downloadUrl: null,
      version: null,
      releaseDate: null,
      sizeBytes: null,
      sha256: null,
      releaseNotes: item.releaseNotes,
      buildEnvironmentNote: item.buildEnvironmentNote,
      statusMessage: "Binary not built in this Linux container. GitHub Actions CI workflows are ready to build this installer."
    };
  });
}
function loadRawConfiguredArtifacts(rootDir) {
  const manifestPath = path.join(rootDir, "config", "releases.json");
  if (!fs.existsSync(manifestPath)) {
    return [];
  }
  const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  return parsed.artifacts ?? [];
}
function loadReleasesManifest(rootDir) {
  return evaluateReleaseArtifacts(rootDir, loadRawConfiguredArtifacts(rootDir));
}

// server.ts
var ROOT_DIR = process.cwd();
var PORT = Number(process.env.PORT ?? 3e3);
async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", product: "BRIDGE", protocolVersion: "1.0" });
  });
  app.get("/api/releases", (_req, res) => {
    const artifacts = loadReleasesManifest(ROOT_DIR);
    res.json({ artifacts });
  });
  app.get("/api/site-config", (_req, res) => {
    const sitePath = path2.join(ROOT_DIR, "config", "site.json");
    if (!fs2.existsSync(sitePath)) {
      res.status(404).json({ error: "Site config missing" });
      return;
    }
    res.json(JSON.parse(fs2.readFileSync(sitePath, "utf-8")));
  });
  app.get("/api/protocol/schema", (_req, res) => {
    const schemaPath = path2.join(ROOT_DIR, "protocol", "bridge-protocol.v1.json");
    res.json(JSON.parse(fs2.readFileSync(schemaPath, "utf-8")));
  });
  app.post("/api/protocol/validate", (req, res) => {
    const result = validateBridgeMessage(req.body);
    res.status(200).json(result);
  });
  app.get("/api/downloads/protocol-spec", (_req, res) => {
    const specPath = path2.join(ROOT_DIR, "protocol", "bridge-protocol.v1.json");
    if (!fs2.existsSync(specPath)) {
      res.status(404).json({ error: "Protocol specification file not found" });
      return;
    }
    const { sha256 } = computeFileDigestAndSize(specPath);
    res.setHeader("X-Checksum-SHA256", sha256);
    res.download(specPath, "bridge-protocol.v1.json");
  });
  app.get("/api/downloads/artifact/:id", (req, res) => {
    const configured = loadRawConfiguredArtifacts(ROOT_DIR).find((a) => a.id === req.params.id);
    if (!configured) {
      res.status(404).json({ error: "Unknown artifact id" });
      return;
    }
    const filePath = path2.resolve(ROOT_DIR, configured.localFilePath);
    if (!filePath.startsWith(path2.resolve(ROOT_DIR)) || !fs2.existsSync(filePath)) {
      res.status(404).json({ error: "Installer binary not built in this environment" });
      return;
    }
    const stat = fs2.statSync(filePath);
    if (!stat.isFile() || stat.size === 0) {
      res.status(404).json({ error: "Installer binary is empty or invalid" });
      return;
    }
    const { sha256 } = computeFileDigestAndSize(filePath);
    res.setHeader("X-Checksum-SHA256", sha256);
    res.download(filePath, path2.basename(filePath));
  });
  if (process.env.NODE_ENV === "production") {
    const distDir = path2.join(ROOT_DIR, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path2.join(distDir, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BRIDGE web portal listening on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start BRIDGE server:", err);
  process.exit(1);
});
