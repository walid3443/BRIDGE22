using System.Collections.Concurrent;
using System.Text.Json;
using Bridge.Core;

namespace Bridge.DeviceManagement;

public sealed class TrustedDeviceRepository
{
    private readonly ConcurrentDictionary<string, PairedDeviceRecord> _devices = new();
    private readonly string _storePath;

    public TrustedDeviceRepository(string? storePath = null)
    {
        _storePath = storePath ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "BRIDGE",
            "trusted-devices.json"
        );
        Load();
    }

    public IReadOnlyCollection<PairedDeviceRecord> GetAll() => _devices.Values.ToArray();

    public void Upsert(PairedDeviceRecord device)
    {
        _devices[device.DeviceId] = device;
        Save();
    }

    public bool Rename(string deviceId, string newName)
    {
        if (string.IsNullOrWhiteSpace(newName) || !_devices.TryGetValue(deviceId, out var existing))
        {
            return false;
        }
        _devices[deviceId] = existing with { DisplayName = newName.Trim() };
        Save();
        return true;
    }

    public bool RevokeTrust(string deviceId)
    {
        if (!_devices.TryGetValue(deviceId, out var existing))
        {
            return false;
        }
        _devices[deviceId] = existing with
        {
            TrustStatus = TrustStatus.Revoked,
            AllowRemoteControl = false,
            AllowClipboardSync = false,
            AllowFileTransfer = false,
            AllowNotifications = false
        };
        Save();
        return true;
    }

    private void Load()
    {
        if (!File.Exists(_storePath)) return;
        var json = File.ReadAllText(_storePath);
        var list = JsonSerializer.Deserialize<List<PairedDeviceRecord>>(json);
        if (list is null) return;
        foreach (var item in list)
        {
            _devices[item.DeviceId] = item;
        }
    }

    private void Save()
    {
        Directory.CreateDirectory(Path.GetDirectoryName(_storePath)!);
        var json = JsonSerializer.Serialize(_devices.Values.ToArray(), new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(_storePath, json);
    }
}
