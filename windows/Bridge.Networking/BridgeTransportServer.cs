using System.Net;
using System.Net.Security;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.Json;
using Bridge.Core;
using Bridge.Logging;
using Bridge.Security;

namespace Bridge.Networking;

/// <summary>
/// Local-first TLS-authenticated control server with replay protection, rate limiting, and emergency disconnect.
/// </summary>
public sealed class BridgeTransportServer : IAsyncDisposable
{
    private readonly X509Certificate2 _serverCertificate;
    private readonly ReplayProtectionGuard _replayGuard;
    private readonly DeviceRateLimiter _rateLimiter;
    private readonly BridgeLogger _logger;
    private TcpListener? _listener;
    private CancellationTokenSource? _cts;
    private readonly List<Stream> _activeStreams = new();

    public event Func<BridgeEnvelope, Task>? MessageReceived;
    public event Action? EmergencyDisconnected;

    public BridgeTransportServer(
        X509Certificate2 serverCertificate,
        ReplayProtectionGuard replayGuard,
        DeviceRateLimiter rateLimiter,
        BridgeLogger logger)
    {
        _serverCertificate = serverCertificate;
        _replayGuard = replayGuard;
        _rateLimiter = rateLimiter;
        _logger = logger;
    }

    public void Start(int port = BridgeConstants.DefaultPort)
    {
        _cts = new CancellationTokenSource();
        _listener = new TcpListener(IPAddress.Any, port);
        _listener.Start();
        _ = Task.Run(() => AcceptLoopAsync(_cts.Token), _cts.Token);
        _logger.Log(LogSeverity.Info, "Networking", $"TLS transport listening on port {port}.");
    }

    public void EmergencyDisconnectAll()
    {
        lock (_activeStreams)
        {
            foreach (var stream in _activeStreams)
            {
                try { stream.Dispose(); } catch { }
            }
            _activeStreams.Clear();
        }
        _logger.Log(LogSeverity.Security, "Networking", "Emergency disconnect executed by user.");
        EmergencyDisconnected?.Invoke();
    }

    private async Task AcceptLoopAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested && _listener != null)
        {
            try
            {
                var tcpClient = await _listener.AcceptTcpClientAsync(ct);
                _ = Task.Run(() => HandleClientAsync(tcpClient, ct), ct);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.Log(LogSeverity.Error, "Networking", $"Accept error: {ex.Message}");
            }
        }
    }

    private async Task HandleClientAsync(TcpClient client, CancellationToken ct)
    {
        using (client)
        await using (var sslStream = new SslStream(client.GetStream(), leaveInnerStreamOpen: false))
        {
            await sslStream.AuthenticateAsServerAsync(new SslServerAuthenticationOptions
            {
                ServerCertificate = _serverCertificate,
                ClientCertificateRequired = false,
                EnabledSslProtocols = System.Security.Authentication.SslProtocols.Tls13 | System.Security.Authentication.SslProtocols.Tls12
            }, ct);

            lock (_activeStreams) { _activeStreams.Add(sslStream); }

            using var reader = new StreamReader(sslStream, Encoding.UTF8);
            while (!ct.IsCancellationRequested)
            {
                var line = await reader.ReadLineAsync(ct);
                if (line is null) break;

                var envelope = JsonSerializer.Deserialize<BridgeEnvelope>(line);
                string? err = null;
                if (envelope is null || !envelope.IsValidEnvelope(out err))
                {
                    _logger.Log(LogSeverity.Security, "Networking", $"Rejected malformed envelope: {err ?? "null JSON"}");
                    continue;
                }
                if (!_rateLimiter.Allow(envelope.SenderDeviceId))
                {
                    _logger.Log(LogSeverity.Security, "Networking", $"Rate limit exceeded for {envelope.SenderDeviceId}.");
                    continue;
                }
                if (!_replayGuard.TryAccept(envelope.MessageId, envelope.Timestamp))
                {
                    _logger.Log(LogSeverity.Security, "Networking", $"Replay or stale timestamp rejected: {envelope.MessageId}.");
                    continue;
                }
                if (MessageReceived != null)
                {
                    await MessageReceived.Invoke(envelope);
                }
            }
        }
    }

    public ValueTask DisposeAsync()
    {
        _cts?.Cancel();
        EmergencyDisconnectAll();
        _listener?.Stop();
        _cts?.Dispose();
        return ValueTask.CompletedTask;
    }
}
