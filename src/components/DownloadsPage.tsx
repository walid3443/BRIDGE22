import { Check, Copy, Download, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ReleaseArtifact } from '../types/bridge';

function formatBytes(bytes: number | null): string {
  if (bytes === null) return 'Not available';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function DownloadsPage() {
  const [artifacts, setArtifacts] = useState<ReleaseArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/releases')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { artifacts: ReleaseArtifact[] }) => {
        if (!cancelled) {
          setArtifacts(data.artifacts);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load release status');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const copyChecksum = async (id: string, sha256: string) => {
    try {
      await navigator.clipboard.writeText(sha256);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard write unavailable in restricted context
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Configurable Release Portal · Live Filesystem Verification
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Downloads & Release Artifacts
        </h1>
        <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
          Every artifact below is verified directly against files on disk or configured HTTPS
          release URLs in <code className="text-xs">config/releases.json</code>. Unbuilt installers
          remain marked unavailable until compiled by Windows and Android runners.
        </p>
      </div>

      {loading && (
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[0, 1, 2].map((slot) => (
            <div
              key={slot}
              className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#121824]"
            />
          ))}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-10 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Failed to inspect release manifest: {error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {artifacts.map((artifact) => (
            <article
              key={artifact.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#121824]"
            >
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {artifact.format} · {artifact.supportedOs}
                  </p>
                  <h2 className="mt-1 font-display text-xl font-semibold text-slate-900 dark:text-white">
                    {artifact.name}
                  </h2>
                </div>

                <dl className="grid grid-cols-2 gap-3 border-y border-slate-100 py-3 text-xs dark:border-slate-800">
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Version</dt>
                    <dd className="mt-0.5 font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                      {artifact.version ?? 'Not built'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">File Size</dt>
                    <dd className="mt-0.5 font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                      {formatBytes(artifact.sizeBytes)}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-500 dark:text-slate-400">Release Date</dt>
                    <dd className="mt-0.5 font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                      {artifact.releaseDate ?? 'Pending native CI build'}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-500 dark:text-slate-400">Status</dt>
                    <dd
                      className={`mt-0.5 font-medium ${
                        artifact.available
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {artifact.statusMessage}
                    </dd>
                  </div>
                </dl>

                {artifact.sha256 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        SHA-256 Checksum
                      </span>
                      <button
                        type="button"
                        onClick={() => copyChecksum(artifact.id, artifact.sha256!)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline dark:text-blue-400"
                      >
                        {copiedId === artifact.id ? (
                          <>
                            <Check className="h-3 w-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="break-all rounded-lg bg-slate-100 p-2 font-mono text-[11px] text-slate-700 dark:bg-[#0B0F17] dark:text-slate-300">
                      {artifact.sha256}
                    </p>
                  </div>
                )}

                <ul className="space-y-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {artifact.releaseNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                {artifact.available && artifact.downloadUrl ? (
                  <a
                    href={artifact.downloadUrl}
                    download
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download {artifact.format}</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                  >
                    Build Unavailable in This Container
                  </button>
                )}
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {artifact.buildEnvironmentNote}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-[#121824]">
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          GitHub Actions Native CI/CD Build Workflows
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Because this Node.js Linux environment does not include the Windows .NET 8 / WinUI 3
          toolchain or the Android SDK, the repository includes GitHub Actions workflows that
          compile, test, verify, and publish real installers on native runners:
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0B0F17]">
            <p className="font-mono text-xs text-blue-700 dark:text-blue-400">
              .github/workflows/build-windows.yml
            </p>
            <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              Windows Runner (windows-latest)
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Runs xUnit tests, publishes self-contained win-x64 WinUI 3 binaries, builds{' '}
              <code>Bridge-Windows-Setup.msi</code> via WiX v4, and computes SHA-256.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0B0F17]">
            <p className="font-mono text-xs text-blue-700 dark:text-blue-400">
              .github/workflows/build-android.yml
            </p>
            <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              Android Runner (ubuntu-latest)
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Sets up JDK 17 + Android SDK + Gradle 8.9, runs JUnit tests, builds Debug/Release
              APKs, verifies zip integrity, and computes SHA-256.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0B0F17]">
            <p className="font-mono text-xs text-blue-700 dark:text-blue-400">
              .github/workflows/release.yml
            </p>
            <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              Combined GitHub Release
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Runs both workflows on tag push (<code>v*</code>) or manual dispatch, publishes real
              assets + <code>SHA256SUMS.txt</code> to GitHub Releases.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#121824]">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Building BRIDGE for Windows locally
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Run on Windows 10/11 (x64) with .NET 8 SDK, Windows App SDK, and WiX v4 installed:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-100">
{`cd windows/installer
pwsh ./build-windows.ps1 -Configuration Release`}
          </pre>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#121824]">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Building BRIDGE for Android locally
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Run with JDK 17, Gradle 8.9, and Android SDK (API 35) configured:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-100">
{`cd android
gradle testDebugUnitTest assembleDebug assembleRelease`}
          </pre>
        </div>
      </section>
    </div>
  );
}
