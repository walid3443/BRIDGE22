using System.Text.Json;
using System.Text.Json.Serialization;

namespace Bridge.Core;

public static class BridgeConstants
{
    public const string ProtocolVersion = "1.0";
    public const string ServiceType = "_bridge._tcp.local.";
    public const int DefaultPort = 47290;
    public const int MaxClipboardBytes = 262_144;
    public const int FileChunkBytes = 65_536;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum BridgeMessageType
{
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

public sealed record BridgeEnvelope(
    [property: JsonPropertyName("version")] string Version,
    [property: JsonPropertyName("messageId")] string MessageId,
    [property: JsonPropertyName("senderDeviceId")] string SenderDeviceId,
    [property: JsonPropertyName("type")] BridgeMessageType Type,
    [property: JsonPropertyName("timestamp")] long Timestamp,
    [property: JsonPropertyName("payload")] JsonElement Payload
)
{
    public static BridgeEnvelope Create(string senderDeviceId, BridgeMessageType type, object payload)
    {
        var jsonPayload = JsonSerializer.SerializeToElement(payload);
        return new BridgeEnvelope(
            BridgeConstants.ProtocolVersion,
            $"msg-{Guid.NewGuid():N}",
            senderDeviceId,
            type,
            DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            jsonPayload
        );
    }

    public bool IsValidEnvelope(out string? error)
    {
        if (Version != BridgeConstants.ProtocolVersion)
        {
            error = $"Unsupported protocol version '{Version}'.";
            return false;
        }
        if (string.IsNullOrWhiteSpace(MessageId) || MessageId.Length < 8)
        {
            error = "Invalid messageId.";
            return false;
        }
        if (string.IsNullOrWhiteSpace(SenderDeviceId) || SenderDeviceId.Length < 4)
        {
            error = "Invalid senderDeviceId.";
            return false;
        }
        if (Timestamp <= 0)
        {
            error = "Invalid timestamp.";
            return false;
        }
        error = null;
        return true;
    }
}
