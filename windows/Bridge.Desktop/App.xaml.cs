using Bridge.Clipboard;
using Bridge.Core;
using Bridge.DeviceManagement;
using Bridge.Discovery;
using Bridge.Logging;
using Bridge.Networking;
using Bridge.Pairing;
using Bridge.RemoteControl;
using Bridge.Security;
using Bridge.Streaming;
using Microsoft.UI.Xaml;

namespace Bridge.Desktop;

public partial class App : Application
{
    private Window? _mainWindow;

    public BridgeLogger Logger { get; } = new();
    public ReplayProtectionGuard ReplayGuard { get; } = new();
    public DeviceRateLimiter RateLimiter { get; } = new();
    public TrustedDeviceRepository DeviceRepository { get; } = new();
    public PairingManager PairingManager { get; } = new();
    public ClipboardSyncService ClipboardSync { get; } = new();
    public WindowsInputInjector InputInjector { get; }
    public MediaStreamCoordinator StreamCoordinator { get; }
    public LocalDiscoveryService DiscoveryService { get; }

    public App()
    {
        InitializeComponent();
        InputInjector = new WindowsInputInjector(Logger);
        StreamCoordinator = new MediaStreamCoordinator(Logger);
        DiscoveryService = new LocalDiscoveryService(Logger);
    }

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
        _mainWindow = new MainWindow(this);
        _mainWindow.Activate();
    }
}
