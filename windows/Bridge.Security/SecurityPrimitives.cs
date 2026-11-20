using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

namespace Bridge.Security;

public sealed class TlsIdentityManager
{
    public X509Certificate2 CreateOrLoadDeviceCertificate(string deviceId, string pfxPath, string passphrase)
    {
        if (File.Exists(pfxPath))
        {
            return new X509Certificate2(pfxPath, passphrase, X509KeyStorageFlags.UserKeySet | X509KeyStorageFlags.Exportable);
        }

        using var ecdsa = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        var req = new CertificateRequest($"CN=BRIDGE-{deviceId}", ecdsa, HashAlgorithmName.SHA256);
        req.CertificateExtensions.Add(new X509BasicConstraintsExtension(false, false, 0, true));
        req.CertificateExtensions.Add(new X509KeyUsageExtension(X509KeyUsageFlags.DigitalSignature | X509KeyUsageFlags.KeyEncipherment, true));

        var cert = req.CreateSelfSigned(DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow.AddYears(2));
        Directory.CreateDirectory(Path.GetDirectoryName(pfxPath)!);
        File.WriteAllBytes(pfxPath, cert.Export(X509ContentType.Pfx, passphrase));
        return cert;
    }

    public static string GetSha256Fingerprint(X509Certificate2 certificate)
    {
        return Convert.ToHexString(certificate.GetCertHash(HashAlgorithmName.SHA256));
    }
}

public sealed class ReplayProtectionGuard
{
    private readonly ConcurrentDictionary<string, long> _seen = new();
    private readonly long _windowMs;

    public ReplayProtectionGuard(long windowMs = 60_000)
    {
        _windowMs = windowMs;
    }

    public bool TryAccept(string messageId, long timestampMs, long? nowMs = null)
    {
        var current = nowMs ?? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        PruneExpired(current);

        if (Math.Abs(current - timestampMs) > _windowMs)
        {
            return false;
        }
        return _seen.TryAdd(messageId, timestampMs);
    }

    private void PruneExpired(long currentMs)
    {
        foreach (var pair in _seen)
        {
            if (currentMs - pair.Value > _windowMs)
            {
                _seen.TryRemove(pair.Key, out _);
            }
        }
    }
}

public sealed class DeviceRateLimiter
{
    private sealed class Bucket
    {
        public double Tokens;
        public long LastMs;
    }

    private readonly ConcurrentDictionary<string, Bucket> _buckets = new();
    private readonly double _capacity;
    private readonly double _refillPerSec;

    public DeviceRateLimiter(double capacity = 120, double refillPerSec = 60)
    {
        _capacity = capacity;
        _refillPerSec = refillPerSec;
    }

    public bool Allow(string deviceId)
    {
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var bucket = _buckets.GetOrAdd(deviceId, _ => new Bucket { Tokens = _capacity, LastMs = now });

        lock (bucket)
        {
            var elapsedSec = Math.Max(0, (now - bucket.LastMs) / 1000.0);
            bucket.Tokens = Math.Min(_capacity, bucket.Tokens + elapsedSec * _refillPerSec);
            bucket.LastMs = now;
            if (bucket.Tokens < 1.0)
            {
                return false;
            }
            bucket.Tokens -= 1.0;
            return true;
        }
    }
}
