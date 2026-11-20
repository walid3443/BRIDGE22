using System.Collections.Concurrent;

namespace Bridge.Logging;

public enum LogSeverity
{
    Info,
    Warning,
    Error,
    Security
}

public sealed record LogEntry(
    DateTimeOffset Timestamp,
    LogSeverity Severity,
    string Category,
    string Message
);

/// <summary>
/// Local-only diagnostic logger that never emits clipboard text or secret pairing keys.
/// </summary>
public sealed class BridgeLogger
{
    private readonly ConcurrentQueue<LogEntry> _entries = new();
    private readonly int _maxEntries;

    public BridgeLogger(int maxEntries = 500)
    {
        _maxEntries = maxEntries;
    }

    public event Action<LogEntry>? EntryAdded;

    public void Log(LogSeverity severity, string category, string message)
    {
        var entry = new LogEntry(DateTimeOffset.UtcNow, severity, category, message);
        _entries.Enqueue(entry);
        while (_entries.Count > _maxEntries && _entries.TryDequeue(out _)) { }
        EntryAdded?.Invoke(entry);
    }

    public IReadOnlyList<LogEntry> GetRecentEntries() => _entries.ToArray();
}
