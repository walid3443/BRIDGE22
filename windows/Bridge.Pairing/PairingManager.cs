using System.Security.Cryptography;
using Bridge.Core;

namespace Bridge.Pairing;

public sealed record PairingSession(
    string Code,
    string QrUri,
    DateTimeOffset ExpiresAt
);

/// <summary>
/// Manages explicit QR-code and 6-digit pairing sessions. Never auto-trusts unknown peers.
/// </summary>
public sealed class PairingManager
{
    private PairingSession? _activeSession;

    public PairingSession CreatePairingSession(string hostIp, int port, string localDeviceId, string certFingerprint)
    {
        var numeric = RandomNumberGenerator.GetInt32(100_000, 999_999).ToString();
        var uri = $"bridge://pair?host={Uri.EscapeDataString(hostIp)}&port={port}&deviceId={Uri.EscapeDataString(localDeviceId)}&fp={Uri.EscapeDataString(certFingerprint)}&code={numeric}";
        _activeSession = new PairingSession(numeric, uri, DateTimeOffset.UtcNow.AddMinutes(3));
        return _activeSession;
    }

    public bool VerifyPairingCode(string submittedCode)
    {
        if (_activeSession is null || DateTimeOffset.UtcNow > _activeSession.ExpiresAt)
        {
            return false;
        }
        return CryptographicOperations.FixedTimeEquals(
            System.Text.Encoding.UTF8.GetBytes(_activeSession.Code),
            System.Text.Encoding.UTF8.GetBytes(submittedCode.Trim())
        );
    }

    public TrustStatus ApplyUserDecision(TrustStatus current, bool approved)
    {
        if (current != TrustStatus.PendingApproval)
        {
            return current;
        }
        return approved ? TrustStatus.Paired : TrustStatus.Unpaired;
    }
}
