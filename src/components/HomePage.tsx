import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { CORE_FEATURES, FAQ_ITEMS } from '../data/bridgeContent';
import { PageId } from '../types/bridge';
import { MediaFrame } from './MediaFrame';

interface HomePageProps {
  onNavigate: (page: PageId) => void;
}

const ARCH_SPECS = [
  { label: 'Discovery', value: 'mDNS / DNS-SD', note: 'Local Wi-Fi subnet' },
  { label: 'Transport', value: 'TLS 1.3 Pinning', note: 'Mutual certificate check' },
  { label: 'File Integrity', value: 'SHA-256 Verified', note: 'No silent overwrites' },
  { label: 'Cloud Dependency', value: 'Zero Required', note: 'Works offline on LAN' },
];

const PAIRING_STEPS = [
  {
    step: '01',
    title: 'Open BRIDGE on both devices',
    body: 'Launch BRIDGE for Windows and BRIDGE for Android on the same local Wi-Fi network. Local discovery locates compatible hosts without an internet account.',
  },
  {
    step: '02',
    title: 'Confirm QR code or 6-digit PIN',
    body: 'Scan the bridge://pair QR URI from your Windows screen or verify the 6-digit pairing code displayed on both devices.',
  },
  {
    step: '03',
    title: 'Work across both screens locally',
    body: 'Control Windows from your Android touchpad, transfer files with SHA-256 verification, mirror your phone screen, and revoke access anytime.',
  },
];

export function HomePage({ onNavigate }: HomePageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-16 lg:pt-20">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
          <div className="flex flex-col justify-between gap-8 lg:col-span-6">
            <div className="space-y-5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Windows 10 & 11 · Android 10+ · Local-First Architecture
              </p>
              <h1
                style={{ textWrap: 'balance' }}
                className="font-display text-[clamp(2.25rem,4vw,3.5rem)] font-bold leading-[1.08] tracking-tight text-slate-900 dark:text-white"
              >
                Your Phone and PC. One Connected Experience.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
                Connect your Android phone and Windows computer. Transfer files, control devices,
                share screens, and work across both — securely and locally.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('downloads')}
                className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                View Downloads & Source
              </button>
              <button
                type="button"
                onClick={() => onNavigate('docs')}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-[#121824] dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Read Documentation
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#121824] lg:col-span-6">
            <MediaFrame
              src="/src/assets/images/hero_bridge_workspace_1795193608699.jpg"
              alt="Windows laptop and Android smartphone connected via BRIDGE on a minimalist desk"
              className="aspect-[16/9] w-full object-cover lg:h-full"
            />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4 dark:divide-slate-800 dark:border-slate-800 dark:bg-[#121824]">
          {ARCH_SPECS.map((spec) => (
            <div key={spec.label} className="p-5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{spec.label}</p>
              <p className="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-white">
                {spec.value}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{spec.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-[#0E131D]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl space-y-2">
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Built around five core daily workflows
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Every subsystem is engineered as an independent module with explicit user consent
                and zero background telemetry.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('features')}
              className="text-sm font-medium text-blue-700 hover:underline whitespace-nowrap shrink-0 dark:text-blue-400"
            >
              Explore all 8 capabilities
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <article className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 lg:col-span-2 dark:border-slate-800 dark:bg-[#121824]">
              <div className="grid grid-cols-1 items-stretch md:grid-cols-2">
                <div className="flex flex-col justify-between p-6">
                  <div className="space-y-2">
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {CORE_FEATURES[1].index} · Windows & Android
                    </p>
                    <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                      {CORE_FEATURES[1].title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {CORE_FEATURES[1].summary}
                    </p>
                  </div>
                  <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
                    {CORE_FEATURES[1].platformNote}
                  </p>
                </div>
                <MediaFrame
                  src="/src/assets/images/feature_screen_mirroring_1795193607651.jpg"
                  alt="Windows desktop monitor alongside an Android smartphone in a machined dock"
                  className="aspect-[4/3] w-full object-cover md:h-full"
                />
              </div>
            </article>

            <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-[#121824]">
              <div className="space-y-2">
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {CORE_FEATURES[0].index} · Touchpad & Keyboard
                </p>
                <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                  {CORE_FEATURES[0].title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {CORE_FEATURES[0].summary}
                </p>
              </div>
              <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
                {CORE_FEATURES[0].platformNote}
              </p>
            </article>

            <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-[#121824]">
              <div className="space-y-2">
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {CORE_FEATURES[3].index} · Plain Text Sync
                </p>
                <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                  {CORE_FEATURES[3].title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {CORE_FEATURES[3].summary}
                </p>
              </div>
              <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
                {CORE_FEATURES[3].platformNote}
              </p>
            </article>

            <article className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 lg:col-span-2 dark:border-slate-800 dark:bg-[#121824]">
              <div className="grid grid-cols-1 items-stretch md:grid-cols-2">
                <MediaFrame
                  src="/src/assets/images/feature_file_transfer_1795193608210.jpg"
                  alt="Laptop and Android smartphone arranged for direct two-way local file transfer"
                  className="aspect-[4/3] w-full object-cover md:h-full"
                />
                <div className="flex flex-col justify-between p-6">
                  <div className="space-y-2">
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {CORE_FEATURES[2].index} · Bidirectional LAN Transfer
                    </p>
                    <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                      {CORE_FEATURES[2].title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {CORE_FEATURES[2].summary}
                    </p>
                  </div>
                  <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
                    {CORE_FEATURES[2].platformNote}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 py-16 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-xl space-y-2">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              How pairing works
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Mutual verification prevents unauthorized devices on shared Wi-Fi networks from
              connecting.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {PAIRING_STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#121824]"
              >
                <p className="font-mono text-xs font-medium text-blue-700 dark:text-blue-400">
                  Step {item.step}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-[#0E131D]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-10 px-6 lg:grid-cols-12">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 lg:col-span-5 dark:border-slate-800 dark:bg-[#121824]">
            <MediaFrame
              src="/src/assets/images/security_local_architecture_1795193608328.jpg"
              alt="Interlocking titanium and dark glass structure representing local hardware-backed security"
              className="aspect-[4/3] w-full object-cover lg:h-full"
            />
          </div>
          <div className="flex flex-col justify-between gap-6 lg:col-span-7">
            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Security & Privacy Architecture
              </p>
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Encrypted locally. Controlled explicitly.
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                BRIDGE stores credentials in Windows DPAPI and Android Keystore, enforces replay
                protection and per-device rate limits, and blocks silent background camera,
                microphone, or screen capture.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Mutual Certificate Pinning
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  SHA-256 certificate fingerprints exchanged during QR pairing are pinned on every
                  subsequent TLS session.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Instant Emergency Disconnect
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  One click on Windows or Android closes active sockets and halts input injection,
                  screen capture, and media streams.
                </p>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => onNavigate('security')}
                className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
              >
                Review full security specification
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 py-16 dark:border-slate-800">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Frequently asked questions
          </h2>
          <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-slate-900 hover:text-blue-700 dark:text-white dark:hover:text-blue-400"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
