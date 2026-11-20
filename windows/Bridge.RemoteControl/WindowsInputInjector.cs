using System.Runtime.InteropServices;
using Bridge.Logging;

namespace Bridge.RemoteControl;

/// <summary>
/// Injects authorized mouse and keyboard events via Win32 SendInput.
/// Enforces explicit session authorization and movement bounds.
/// </summary>
public sealed class WindowsInputInjector
{
    private readonly BridgeLogger _logger;
    private volatile bool _sessionActive;

    public WindowsInputInjector(BridgeLogger logger)
    {
        _logger = logger;
    }

    public void SetAuthorizedSessionActive(bool active)
    {
        _sessionActive = active;
        _logger.Log(LogSeverity.Security, "RemoteControl", active ? "Remote control input authorized." : "Remote control input disabled.");
    }

    public bool MoveMouseRelative(int deltaX, int deltaY)
    {
        if (!_sessionActive || Math.Abs(deltaX) > 4000 || Math.Abs(deltaY) > 4000)
        {
            return false;
        }

        var input = new INPUT
        {
            type = INPUT_MOUSE,
            u = new InputUnion
            {
                mi = new MOUSEINPUT
                {
                    dx = deltaX,
                    dy = deltaY,
                    dwFlags = MOUSEEVENTF_MOVE
                }
            }
        };
        return SendInput(1, new[] { input }, Marshal.SizeOf<INPUT>()) == 1;
    }

    public bool MouseClick(string button, string action)
    {
        if (!_sessionActive) return false;

        uint flags = (button, action) switch
        {
            ("left", "down") => MOUSEEVENTF_LEFTDOWN,
            ("left", "up") => MOUSEEVENTF_LEFTUP,
            ("left", "click") => MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_LEFTUP,
            ("right", "down") => MOUSEEVENTF_RIGHTDOWN,
            ("right", "up") => MOUSEEVENTF_RIGHTUP,
            ("right", "click") => MOUSEEVENTF_RIGHTDOWN | MOUSEEVENTF_RIGHTUP,
            _ => 0
        };

        if (flags == 0) return false;

        var input = new INPUT
        {
            type = INPUT_MOUSE,
            u = new InputUnion { mi = new MOUSEINPUT { dwFlags = flags } }
        };
        return SendInput(1, new[] { input }, Marshal.SizeOf<INPUT>()) == 1;
    }

    public bool SendUnicodeText(string text)
    {
        if (!_sessionActive || string.IsNullOrEmpty(text) || text.Length > 512) return false;

        var inputs = new List<INPUT>(text.Length * 2);
        foreach (char ch in text)
        {
            inputs.Add(new INPUT
            {
                type = INPUT_KEYBOARD,
                u = new InputUnion { ki = new KEYBDINPUT { wScan = ch, dwFlags = KEYEVENTF_UNICODE } }
            });
            inputs.Add(new INPUT
            {
                type = INPUT_KEYBOARD,
                u = new InputUnion { ki = new KEYBDINPUT { wScan = ch, dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP } }
            });
        }
        return SendInput((uint)inputs.Count, inputs.ToArray(), Marshal.SizeOf<INPUT>()) == inputs.Count;
    }

    private const uint INPUT_MOUSE = 0;
    private const uint INPUT_KEYBOARD = 1;
    private const uint MOUSEEVENTF_MOVE = 0x0001;
    private const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    private const uint MOUSEEVENTF_LEFTUP = 0x0004;
    private const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
    private const uint MOUSEEVENTF_RIGHTUP = 0x0010;
    private const uint KEYEVENTF_KEYUP = 0x0002;
    private const uint KEYEVENTF_UNICODE = 0x0004;

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

    [StructLayout(LayoutKind.Sequential)]
    private struct INPUT
    {
        public uint type;
        public InputUnion u;
    }

    [StructLayout(LayoutKind.Explicit)]
    private struct InputUnion
    {
        [FieldOffset(0)] public MOUSEINPUT mi;
        [FieldOffset(0)] public KEYBDINPUT ki;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct MOUSEINPUT
    {
        public int dx;
        public int dy;
        public uint mouseData;
        public uint dwFlags;
        public uint time;
        public nint dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct KEYBDINPUT
    {
        public ushort wVk;
        public ushort wScan;
        public uint dwFlags;
        public uint time;
        public nint dwExtraInfo;
    }
}
