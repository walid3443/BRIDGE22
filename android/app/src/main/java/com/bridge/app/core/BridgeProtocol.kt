package com.bridge.app.core

import org.json.JSONObject
import java.util.UUID

object BridgeProtocolConstants {
    const val VERSION = "1.0"
    const val SERVICE_TYPE = "_bridge._tcp."
    const val DEFAULT_PORT = 47290
}

enum class BridgeMessageType {
    DEVICE_HELLO,
    DEVICE_INFO,
    DEVICE_DISCOVERED,
    PAIRING_REQUEST,
    PAIRING_APPROVED,
    PAIRING_REJECTED,
    HEARTBEAT,
    FILE_TRANSFER_REQUEST,
    FILE_TRANSFER_PROGRESS,
    FILE_TRANSFER_COMPLETE,
    FILE_TRANSFER_CANCEL,
    REMOTE_MOUSE_MOVE,
    REMOTE_MOUSE_CLICK,
    REMOTE_KEYBOARD_INPUT,
    CLIPBOARD_UPDATE,
    SCREEN_STREAM_START,
    SCREEN_STREAM_STOP,
    CAMERA_STREAM_START,
    CAMERA_STREAM_STOP,
    AUDIO_STREAM_START,
    AUDIO_STREAM_STOP,
    NOTIFICATION_SHARE,
    DEVICE_DISCONNECT
}

data class BridgeEnvelope(
    val version: String,
    val messageId: String,
    val senderDeviceId: String,
    val type: BridgeMessageType,
    val timestamp: Long,
    val payload: JSONObject
) {
    fun toJsonString(): String = JSONObject().apply {
        put("version", version)
        put("messageId", messageId)
        put("senderDeviceId", senderDeviceId)
        put("type", type.name)
        put("timestamp", timestamp)
        put("payload", payload)
    }.toString()

    companion object {
        fun create(senderDeviceId: String, type: BridgeMessageType, payload: JSONObject = JSONObject()): BridgeEnvelope {
            return BridgeEnvelope(
                version = BridgeProtocolConstants.VERSION,
                messageId = "msg-${UUID.randomUUID()}",
                senderDeviceId = senderDeviceId,
                type = type,
                timestamp = System.currentTimeMillis(),
                payload = payload
            )
        }

        fun parseAndValidate(rawJson: String): BridgeEnvelope? {
            return try {
                val obj = JSONObject(rawJson)
                val version = obj.optString("version")
                val messageId = obj.optString("messageId")
                val sender = obj.optString("senderDeviceId")
                val typeStr = obj.optString("type")
                val timestamp = obj.optLong("timestamp", -1L)
                val payload = obj.optJSONObject("payload") ?: return null

                if (version != BridgeProtocolConstants.VERSION) return null
                if (messageId.length < 8 || sender.length < 4 || timestamp <= 0) return null

                val type = BridgeMessageType.valueOf(typeStr)
                BridgeEnvelope(version, messageId, sender, type, timestamp, payload)
            } catch (_: Exception) {
                null
            }
        }
    }
}
