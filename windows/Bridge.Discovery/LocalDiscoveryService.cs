using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using Bridge.Core;
using Bridge.Logging;

namespace Bridge.Discovery;

public sealed record DiscoveredPeer(
    string DeviceId,
    string DeviceName,
    DevicePlatform Platform,
    IPAddress Address,
    int Port,
    DateTimeOffset DiscoveredAt
);

/// <summary>
/// Local-network peer discovery using UDP multicast DNS-SD style announcements on the local subnet.
/// Does not perform continuous high-frequency scanning when idle.
/// </summary>
public sealed class LocalDiscoveryService : IAsyncDisposable
{
    private const int DiscoveryMulticastPort = 47291;
    private static readonly IPAddress MulticastGroup = IPAddress.Parse("239.255.77.88");
    private readonly BridgeLogger _logger;
    private UdpClient? _listener;
    private CancellationTokenSource? _cts;

    public event Action<DiscoveredPeer>? PeerDiscovered;

    public LocalDiscoveryService(BridgeLogger logger)
    {
        _logger = logger;
    }

    public Task StartListeningAsync(CancellationToken cancellationToken = default)
    {
        _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        _listener = new UdpClient();
        _listener.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
        _listener.Client.Bind(new IPEndPoint(IPAddress.Any, DiscoveryMulticastPort));
        _listener.JoinMulticastGroup(MulticastGroup);

        _ = Task.Run(() => ReceiveLoopAsync(_cts.Token), _cts.Token);
        _logger.Log(LogSeverity.Info, "Discovery", "Local discovery listener started on 239.255.77.88:47291.");
        return Task.CompletedTask;
    }

    public async Task BroadcastPresenceAsync(string deviceId, string deviceName, int wsPort)
    {
        using var sender = new UdpClient();
        var payload = JsonSerializer.SerializeToUtf8Bytes(new
        {
            service = BridgeConstants.ServiceType,
            deviceId,
            deviceName,
            platform = "windows",
            port = wsPort
        });
        await sender.SendAsync(payload, payload.Length, new IPEndPoint(MulticastGroup, DiscoveryMulticastPort));
    }

    private async Task ReceiveLoopAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested && _listener != null)
        {
            try
            {
                var result = await _listener.ReceiveAsync(ct);
                var doc = JsonDocument.Parse(result.Buffer);
                if (doc.RootElement.TryGetProperty("service", out var svc) &&
                    svc.GetString() == BridgeConstants.ServiceType)
                {
                    var deviceId = doc.RootElement.GetProperty("deviceId").GetString() ?? "";
                    var deviceName = doc.RootElement.GetProperty("deviceName").GetString() ?? "Unknown Device";
                    var port = doc.RootElement.GetProperty("port").GetInt32();
                    var platformStr = doc.RootElement.GetProperty("platform").GetString();
                    var platform = platformStr == "android" ? DevicePlatform.Android : DevicePlatform.Windows;

                    PeerDiscovered?.Invoke(new DiscoveredPeer(
                        deviceId,
                        deviceName,
                        platform,
                        result.RemoteEndPoint.Address,
                        port,
                        DateTimeOffset.UtcNow
                    ));
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.Log(LogSeverity.Warning, "Discovery", $"Ignored malformed discovery packet: {ex.Message}");
            }
        }
    }

    public ValueTask DisposeAsync()
    {
        _cts?.Cancel();
        _listener?.Dispose();
        _cts?.Dispose();
        return ValueTask.CompletedTask;
    }
}
