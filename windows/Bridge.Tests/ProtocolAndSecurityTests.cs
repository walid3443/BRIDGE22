using Bridge.Clipboard;
using Bridge.Core;
using Bridge.FileTransfer;
using Xunit;

namespace Bridge.Tests;

public sealed class ProtocolAndSecurityTests
{
    [Fact]
    public void Envelope_ValidatesVersionAndSender()
    {
        var env = BridgeEnvelope.Create("win-pc-01", BridgeMessageType.HEARTBEAT, new { seq = 1 });
        Assert.True(env.IsValidEnvelope(out var error));
        Assert.Null(error);
    }

    [Fact]
    public void FileTransfer_RejectsTraversalAndReservedNames()
    {
        Assert.False(FileTransferEngine.TrySanitizeFilename("..\\evil.exe", out _, out _));
        Assert.False(FileTransferEngine.TrySanitizeFilename("CON.txt", out _, out _));
        Assert.True(FileTransferEngine.TrySanitizeFilename("report.pdf", out var clean, out _));
        Assert.Equal("report.pdf", clean);
    }

    [Fact]
    public void Clipboard_PreventsSyncLoopWhenDisabledOrUnchanged()
    {
        var svc = new ClipboardSyncService();
        Assert.False(svc.ShouldBroadcastLocalChange("hello"));

        svc.IsEnabled = true;
        Assert.True(svc.ShouldBroadcastLocalChange("hello"));
        Assert.False(svc.ShouldBroadcastLocalChange("hello"));

        svc.RecordRemoteClipboardApplied("remote-text");
        Assert.False(svc.ShouldBroadcastLocalChange("remote-text"));
    }
}
