using System.Security.Cryptography;
using System.Text;

namespace Bridge.Security;

/// <summary>
/// Stores pairing tokens and trusted peer metadata encrypted with Windows DPAPI (CurrentUser scope).
/// </summary>
public sealed class ProtectedCredentialStore
{
    private readonly string _storageDir;

    public ProtectedCredentialStore(string? baseDirectory = null)
    {
        _storageDir = baseDirectory ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "BRIDGE",
            "Credentials"
        );
        Directory.CreateDirectory(_storageDir);
    }

    public void SaveSecret(string key, string plaintext)
    {
        var safeKey = SanitizeKey(key);
        var data = Encoding.UTF8.GetBytes(plaintext);
        var protectedBytes = ProtectedData.Protect(data, optionalEntropy: null, DataProtectionScope.CurrentUser);
        File.WriteAllBytes(Path.Combine(_storageDir, $"{safeKey}.dpapi"), protectedBytes);
    }

    public string? ReadSecret(string key)
    {
        var safeKey = SanitizeKey(key);
        var path = Path.Combine(_storageDir, $"{safeKey}.dpapi");
        if (!File.Exists(path))
        {
            return null;
        }
        var protectedBytes = File.ReadAllBytes(path);
        var plaintext = ProtectedData.Unprotect(protectedBytes, optionalEntropy: null, DataProtectionScope.CurrentUser);
        return Encoding.UTF8.GetString(plaintext);
    }

    public void DeleteSecret(string key)
    {
        var safeKey = SanitizeKey(key);
        var path = Path.Combine(_storageDir, $"{safeKey}.dpapi");
        if (File.Exists(path))
        {
            File.Delete(path);
        }
    }

    private static string SanitizeKey(string key)
    {
        return string.Concat(key.Select(c => char.IsLetterOrDigit(c) || c == '-' || c == '_' ? c : '_'));
    }
}
