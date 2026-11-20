using Bridge.Core;
using Bridge.Logging;
using Bridge.Security;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace Bridge.Desktop;

public sealed partial class MainWindow : Window
{
    private readonly App _app;
    private readonly string _localDeviceId = $"win-{Environment.MachineName.ToLowerInvariant()}";

    public MainWindow(App app)
    {
        _app = app;
        InitializeComponent();
        _app.Logger.EntryAdded += entry =>
        {
            DispatcherQueue.TryEnqueue(() =>
            {
                ActivityLogList.Items.Insert(0, $"[{entry.Timestamp:HH:mm:ss}] [{entry.Severity}] {entry.Category}: {entry.Message}");
            });
        };
    }

    private void NavView_SelectionChanged(NavigationView sender, NavigationViewSelectionChangedEventArgs args)
    {
        if (args.IsSettingsSelected)
        {
            PageTitle.Text = "Settings";
            PageSubtitle.Text = "Manage connection diagnostics, local storage, and explicit capability permissions.";
            return;
        }
        if (args.SelectedItemContainer is NavigationViewItem item && item.Tag is string tag)
        {
            PageTitle.Text = item.Content?.ToString() ?? "BRIDGE";
            PageSubtitle.Text = tag switch
            {
                "home" => "Connection status, paired Android device, and quick session controls.",
                "devices" => "Manage paired devices, rename trusted endpoints, or revoke access.",
                "remote" => "Authorize and monitor remote mouse and keyboard control from Android.",
                "screen" => "Resizable Android screen mirroring viewer with frame-rate adaptation.",
                "files" => "Two-way file transfer with SHA-256 verification and duplicate protection.",
                "clipboard" => "Explicitly toggle text clipboard synchronization between devices.",
                "camera" => "Preview window for authorized Android camera streams.",
                "audio" => "Audio stream receiver for authorized Android microphone input.",
                "activity" => "Connection diagnostics, security events, and transfer history.",
                _ => "BRIDGE"
            };
        }
    }

    private async void DiscoverDevices_Click(object sender, RoutedEventArgs e)
    {
        await _app.DiscoveryService.StartListeningAsync();
        await _app.DiscoveryService.BroadcastPresenceAsync(_localDeviceId, Environment.MachineName, BridgeConstants.DefaultPort);
        ConnectionStatusLabel.Text = "Broadcasting on Local Wi-Fi";
    }

    private void GeneratePairingCode_Click(object sender, RoutedEventArgs e)
    {
        var certPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "BRIDGE", "device.pfx");
        var identity = new TlsIdentityManager();
        var cert = identity.CreateOrLoadDeviceCertificate(_localDeviceId, certPath, "local-device-cert");
        var fp = TlsIdentityManager.GetSha256Fingerprint(cert);
        var session = _app.PairingManager.CreatePairingSession("127.0.0.1", BridgeConstants.DefaultPort, _localDeviceId, fp);
        PairingStatusText.Text = $"Pairing Code: {session.Code} (expires in 3 min) | QR URI: {session.QrUri}";
        _app.Logger.Log(LogSeverity.Security, "Pairing", "Generated new 6-digit pairing session.");
    }

    private void EmergencyDisconnect_Click(object sender, RoutedEventArgs e)
    {
        _app.InputInjector.SetAuthorizedSessionActive(false);
        _app.StreamCoordinator.StopScreenStream();
        _app.StreamCoordinator.SetCameraPreviewActive(false);
        _app.StreamCoordinator.SetMicrophoneStreamActive(false);
        ConnectionStatusLabel.Text = "Disconnected (Emergency Stop)";
        _app.Logger.Log(LogSeverity.Security, "Session", "Emergency disconnect triggered; all remote streams and input halted.");
    }

    private void ThemeToggle_Toggled(object sender, RoutedEventArgs e)
    {
        if (Content is FrameworkElement root)
        {
            root.RequestedTheme = ThemeToggle.IsOn ? ElementTheme.Dark : ElementTheme.Light;
        }
    }
}
