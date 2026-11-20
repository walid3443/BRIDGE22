using System.Security.Cryptography;
using System.Text;
using Bridge.Core;

namespace Bridge.Clipboard;

/// <summary>
/// Manages loop-free clipboard synchronization with explicit user enable/disable state.
/// </summary>
public sealed class ClipboardSyncService
{
    private string _lastContentHash = string.Empty;
    public bool IsEnabled { get; set; } = false;

    public bool ShouldBroadcastLocalChange(string text)
    {
        if (!IsEnabled || string.IsNullOrEmpty(text)) return false;
        if (Encoding.UTF8.GetByteCount(text) > BridgeConstants.MaxClipboardBytes) return false;

        var hash = ComputeHash(text);
        if (hash == _lastContentHash)
        {
            return false;
        }
        _lastContentHash = hash;
        return true;
    }

    public void RecordRemoteClipboardApplied(string text)
    {
        _lastContentHash = ComputeHash(text);
    }

    private static string ComputeHash(string text)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(text));
        return Convert.ToHexString(bytes);
    }
}
