namespace Bridge.Core;

public enum TrustStatus
{
    Unpaired,
    PendingApproval,
    Paired,
    Revoked
}

public enum DevicePlatform
{
    Windows,
    Android
}

public sealed record DeviceCapabilities(
    bool RemoteControl,
    bool ScreenMirroring,
    bool FileTransfer,
    bool ClipboardSync,
    bool CameraStream,
    bool MicrophoneStream,
    bool NotificationSharing
);

public sealed record PairedDeviceRecord(
    string DeviceId,
    string DisplayName,
    DevicePlatform Platform,
    string CertificateFingerprint,
    TrustStatus TrustStatus,
    DateTimeOffset LastConnectedAt,
    DeviceCapabilities Capabilities,
    bool AllowRemoteControl,
    bool AllowClipboardSync,
    bool AllowFileTransfer,
    bool AllowNotifications
);
