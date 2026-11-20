using System.Security.Cryptography;

namespace Bridge.FileTransfer;

public enum DuplicateCollisionPolicy
{
    PromptUser,
    RenameWithSuffix,
    Reject
}

public sealed record FileTransferRecord(
    string TransferId,
    string FileName,
    long TotalBytes,
    long BytesTransferred,
    string ExpectedSha256,
    bool IsCompleted,
    bool IsCancelled,
    bool IntegrityVerified
);

/// <summary>
/// Handles path sanitization, duplicate collision checks, and SHA-256 verification.
/// Never silently overwrites existing files.
/// </summary>
public sealed class FileTransferEngine
{
    private static readonly HashSet<string> ReservedNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "CON", "PRN", "AUX", "NUL",
        "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
        "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
    };

    public static bool TrySanitizeFilename(string input, out string sanitized, out string? error)
    {
        sanitized = string.Empty;
        if (string.IsNullOrWhiteSpace(input))
        {
            error = "Filename cannot be empty.";
            return false;
        }
        if (input.Contains('\0') || input.Contains('/') || input.Contains('\\') || input.Contains(".."))
        {
            error = "Path traversal or directory separators are not allowed.";
            return false;
        }
        if (input.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
        {
            error = "Filename contains invalid characters.";
            return false;
        }
        var stem = Path.GetFileNameWithoutExtension(input);
        if (ReservedNames.Contains(stem))
        {
            error = $"Filename '{stem}' is reserved on Windows.";
            return false;
        }
        sanitized = input.Trim();
        error = null;
        return true;
    }

    public static string ResolveDestinationPath(string destinationFolder, string sanitizedFileName, DuplicateCollisionPolicy policy)
    {
        Directory.CreateDirectory(destinationFolder);
        var candidate = Path.Combine(destinationFolder, sanitizedFileName);
        if (!File.Exists(candidate))
        {
            return candidate;
        }

        if (policy == DuplicateCollisionPolicy.Reject || policy == DuplicateCollisionPolicy.PromptUser)
        {
            throw new IOException($"Destination file already exists: {sanitizedFileName}");
        }

        var stem = Path.GetFileNameWithoutExtension(sanitizedFileName);
        var ext = Path.GetExtension(sanitizedFileName);
        var index = 1;
        while (File.Exists(candidate))
        {
            candidate = Path.Combine(destinationFolder, $"{stem} ({index}){ext}");
            index++;
        }
        return candidate;
    }

    public static async Task<bool> VerifySha256Async(string filePath, string expectedHexDigest, CancellationToken ct = default)
    {
        await using var stream = File.OpenRead(filePath);
        var hash = await SHA256.HashDataAsync(stream, ct);
        var actualHex = Convert.ToHexString(hash);
        return string.Equals(actualHex, expectedHexDigest, StringComparison.OrdinalIgnoreCase);
    }
}
