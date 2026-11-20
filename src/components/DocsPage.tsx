import { CheckCircle2, Search, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DOC_SECTIONS } from '../data/bridgeContent';

const PROTOCOL_PRESETS: Record<string, string> = {
  FILE_TRANSFER_REQUEST: JSON.stringify(
    {
      version: '1.0',
      messageId: 'msg-9f8e7d6c5b4a',
      senderDeviceId: 'android-pixel-8',
      type: 'FILE_TRANSFER_REQUEST',
      timestamp: 1795193600000,
      payload: {
        transferId: 'xfer-1001',
        fileName: 'architecture-notes.pdf',
        fileSizeBytes: 204800,
        sha256: 'a'.repeat(64),
      },
    },
    null,
    2
  ),
  PAIRING_REQUEST: JSON.stringify(
    {
      version: '1.0',
      messageId: 'msg-pair-778899',
      senderDeviceId: 'android-pixel-8',
      type: 'PAIRING_REQUEST',
      timestamp: 1795193605000,
      payload: {
        pairingCode: '482910',
        publicKeyFingerprint: 'SHA256ABCDEF1234567890',
      },
    },
    null,
    2
  ),
  REMOTE_MOUSE_MOVE: JSON.stringify(
    {
      version: '1.0',
      messageId: 'msg-mouse-0042',
      senderDeviceId: 'android-pixel-8',
      type: 'REMOTE_MOUSE_MOVE',
      timestamp: 1795193610000,
      payload: {
        deltaX: 14,
        deltaY: -8,
      },
    },
    null,
    2
  ),
  INVALID_TRAVERSAL: JSON.stringify(
    {
      version: '1.0',
      messageId: 'msg-bad-path-01',
      senderDeviceId: 'unknown-peer',
      type: 'FILE_TRANSFER_REQUEST',
      timestamp: 1795193612000,
      payload: {
        transferId: 'xfer-bad',
        fileName: '../../Windows/System32/cmd.exe',
        fileSizeBytes: 1024,
        sha256: 'b'.repeat(64),
      },
    },
    null,
    2
  ),
};

export function DocsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | 'Setup' | 'Features' | 'Troubleshooting'>('All');
  const [selectedPreset, setSelectedPreset] = useState('FILE_TRANSFER_REQUEST');
  const [frameJson, setFrameJson] = useState(PROTOCOL_PRESETS.FILE_TRANSFER_REQUEST);
  const [validationOutput, setValidationOutput] = useState<{
    valid: boolean;
    errors: string[];
  } | null>(null);
  const [validating, setValidating] = useState(false);

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DOC_SECTIONS.filter((doc) => {
      const catMatch = category === 'All' || doc.category === category;
      const textMatch =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        doc.summary.toLowerCase().includes(q) ||
        doc.steps.some((s) => s.toLowerCase().includes(q));
      return catMatch && textMatch;
    });
  }, [query, category]);

  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    setFrameJson(PROTOCOL_PRESETS[presetKey]);
    setValidationOutput(null);
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const parsed = JSON.parse(frameJson);
      const response = await fetch('/api/protocol/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const result = (await response.json()) as { valid: boolean; errors: string[] };
      setValidationOutput(result);
    } catch (err) {
      setValidationOutput({
        valid: false,
        errors: [err instanceof Error ? `Invalid JSON syntax: ${err.message}` : 'Invalid JSON'],
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Documentation & Protocol Reference
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Setup, pairing, and protocol documentation
        </h1>
        <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
          Filter installation and troubleshooting guides below, or test live JSON frames against the
          shared BRIDGE v1.0 protocol validator.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="docs-search" className="sr-only">
            Search documentation
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="docs-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pairing, Wi-Fi, permissions, SHA-256..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-[#121824] dark:text-slate-100"
          />
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {(['All', 'Setup', 'Features', 'Troubleshooting'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setCategory(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                category === tab
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1E293B] dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#121824]">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            No documentation entries match "{query}".
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('All');
            }}
            className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Reset search filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredDocs.map((doc) => (
            <article
              key={doc.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#121824]"
            >
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {doc.category}
              </p>
              <h2 className="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-white">
                {doc.title}
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{doc.summary}</p>
              <ol className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">
                {doc.steps.map((step, i) => (
                  <li key={step} className="flex gap-2.5">
                    <span className="font-mono font-medium text-blue-700 dark:text-blue-400">
                      0{i + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      )}

      <section className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-[#121824]">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center dark:border-slate-800">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Protocol v1.0 Frame Validator
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Validates envelope version, sender ID, message type, and security rules (such as path
              traversal rejection) via <code className="text-xs">POST /api/protocol/validate</code>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(PROTOCOL_PRESETS).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handlePresetChange(key)}
                className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
                  selectedPreset === key
                    ? 'border-blue-700 bg-blue-700 text-white dark:border-blue-600 dark:bg-blue-600'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <label
              htmlFor="protocol-json-input"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              BRIDGE Message Envelope (JSON)
            </label>
            <textarea
              id="protocol-json-input"
              rows={13}
              value={frameJson}
              onChange={(e) => setFrameJson(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs text-slate-100 focus:border-blue-500 focus:outline-none dark:border-slate-700"
            />
            <button
              type="button"
              onClick={handleValidate}
              disabled={validating}
              className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {validating ? 'Validating...' : 'Validate Frame'}
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-[#0B0F17]">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Validation Result
              </h3>
              {validationOutput === null ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Select a preset or edit the JSON payload, then click Validate Frame to test the
                  protocol rules.
                </p>
              ) : validationOutput.valid ? (
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Valid BRIDGE v1.0 Protocol Frame</p>
                    <p className="mt-1 text-xs">
                      Envelope structure, message type, and payload safety checks passed.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold">Frame Rejected</p>
                    <ul className="list-disc pl-4 text-xs space-y-1">
                      {validationOutput.errors.map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Service Type: <code className="font-mono">_bridge._tcp.local.</code> · Default Port:{' '}
              <code className="font-mono tabular-nums">47290</code>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
