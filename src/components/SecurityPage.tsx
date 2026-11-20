export function SecurityPage() {
  const pillars = [
    {
      title: 'Local-First Transport',
      body: 'Devices discover each other on your private Wi-Fi subnet via _bridge._tcp.local. and communicate directly over TLS 1.3 without routing files, screen frames, or keystrokes through external cloud servers.',
    },
    {
      title: 'Mutual Authentication & Certificate Pinning',
      body: 'During QR or 6-digit pairing, devices exchange SHA-256 certificate fingerprints. Future connections verify the pinned fingerprint before accepting any protocol message.',
    },
    {
      title: 'Hardware-Backed & OS-Protected Key Storage',
      body: 'Windows stores trusted credentials via DPAPI (ProtectedData.Protect, CurrentUser scope). Android generates identity keys inside AndroidKeyStore and encrypts local secrets with AES-256-GCM.',
    },
    {
      title: 'Replay Protection & Rate Limiting',
      body: 'Every message envelope carries a unique messageId and millisecond timestamp checked against a 60-second sliding window alongside a per-device token-bucket rate limiter.',
    },
    {
      title: 'Explicit Consent for Sensitive Streams',
      body: 'Screen mirroring uses Android MediaProjection with an unavoidable system dialog and persistent notification. Camera, microphone, and remote control never activate silently.',
    },
    {
      title: 'Instant Revocation & Emergency Stop',
      body: 'Users can rename or revoke trust for any paired device at any time. Revoking trust clears capability permissions immediately and terminates active streams.',
    },
  ];

  const neverImplemented = [
    'Hidden remote access or silent background persistence',
    'Secret screen, camera, or microphone recording',
    'Clipboard history harvesting or background Android clipboard bypasses',
    'Silent overwriting of existing files during transfer',
    'Public internet port exposure by default',
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Security & Privacy Architecture
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Security designed around explicit consent
        </h1>
        <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
          BRIDGE documents its exact cryptographic and operating-system boundaries without
          overstating protections or hiding background permissions.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pillars.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#121824]"
          >
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {item.body}
            </p>
          </article>
        ))}
      </div>

      <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-[#121824]">
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          Architectural Prohibitions
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          The following behaviors are explicitly forbidden across BRIDGE Windows, Android, and Web
          modules:
        </p>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {neverImplemented.map((rule) => (
            <li
              key={rule}
              className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-[#0B0F17] dark:text-slate-300"
            >
              {rule}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
