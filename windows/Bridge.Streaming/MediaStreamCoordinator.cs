using Bridge.Logging;

namespace Bridge.Streaming;

public sealed record StreamQualitySettings(
    int MaxWidth,
    int MaxHeight,
    int MaxFps,
    int BitrateKbps
);

/// <summary>
/// Coordinates Android screen mirroring, phone camera preview window, and audio stream sessions.
/// Note: Windows kernel virtual webcam/audio driver registration requires an external signed driver
/// (e.g., DirectShow / AVStream / Virtual Audio Device). Until a signed kernel driver is bundled,
/// BRIDGE presents an authenticated in-app preview window and explicit audio playback session.
/// </summary>
public sealed class MediaStreamCoordinator
{
    private readonly BridgeLogger _logger;

    public bool IsScreenStreamActive { get; private set; }
    public bool IsCameraPreviewActive { get; private set; }
    public bool IsMicrophoneActive { get; private set; }

    public StreamQualitySettings CurrentQuality { get; private set; } = new(1080, 2400, 30, 4000);

    public event Action<byte[]>? ScreenFrameReceived;
    public event Action<byte[]>? CameraFrameReceived;

    public MediaStreamCoordinator(BridgeLogger logger)
    {
        _logger = logger;
    }

    public void UpdateQuality(StreamQualitySettings settings)
    {
        CurrentQuality = settings;
        _logger.Log(LogSeverity.Info, "Streaming", $"Stream profile updated: {settings.MaxWidth}x{settings.MaxHeight} @ {settings.MaxFps}fps.");
    }

    public void StartScreenStream()
    {
        IsScreenStreamActive = true;
        _logger.Log(LogSeverity.Info, "Streaming", "Screen mirroring receiver active.");
    }

    public void StopScreenStream()
    {
        IsScreenStreamActive = false;
        _logger.Log(LogSeverity.Info, "Streaming", "Screen mirroring stopped.");
    }

    public void PushScreenFrame(byte[] encodedFrame)
    {
        if (IsScreenStreamActive)
        {
            ScreenFrameReceived?.Invoke(encodedFrame);
        }
    }

    public void SetCameraPreviewActive(bool active)
    {
        IsCameraPreviewActive = active;
        _logger.Log(LogSeverity.Info, "Streaming", active ? "Phone camera preview started (in-app preview)." : "Phone camera preview stopped.");
    }

    public void PushCameraFrame(byte[] encodedFrame)
    {
        if (IsCameraPreviewActive)
        {
            CameraFrameReceived?.Invoke(encodedFrame);
        }
    }

    public void SetMicrophoneStreamActive(bool active)
    {
        IsMicrophoneActive = active;
        _logger.Log(LogSeverity.Security, "Streaming", active ? "Phone microphone audio stream active." : "Phone microphone audio stream stopped.");
    }
}
