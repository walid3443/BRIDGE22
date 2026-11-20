import { useEffect, useState } from 'react';
import { SiteConfig } from '../types/bridge';

const PRINCIPLES = [
  'Privacy first — local network communication with no analytics telemetry.',
  'Security first — mutual verification, certificate pinning, and replay guards.',
  'Local-first operation — core workflows function without internet access.',
  'Simple onboarding — QR and 6-digit pairing between phone and desktop.',
  'No unnecessary subscriptions, accounts, or AI dependencies.',
  'Honest capability reporting — no simulated connections or unbuilt binary claims.',
];

export function AboutPage() {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    fetch('/api/site-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SiteConfig | null) => setSiteConfig(data))
      .catch(() => setSiteConfig(null));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          About BRIDGE
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          One connected system across Android and Windows
        </h1>
        <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
          BRIDGE is engineered to make Android smartphones and Windows PCs operate naturally
          together over your local network—without locking users into cloud accounts or opaque
          background agents.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-7 dark:border-slate-800 dark:bg-[#121824]">
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Product Philosophy
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {PRINCIPLES.map((principle, i) => (
              <li key={principle} className="flex gap-3">
                <span className="font-mono text-xs font-medium text-blue-700 dark:text-blue-400">
                  0{i + 1}.
                </span>
                <span>{principle}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-5 dark:border-slate-800 dark:bg-[#121824]">
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Configurable Contact & Distribution
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Organization identity, support email, and release URLs are loaded from{' '}
            <code className="text-xs">config/site.json</code> so no placeholder company address or
            synthetic email is published.
          </p>
          <dl className="mt-6 space-y-3 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Organization</dt>
              <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                {siteConfig?.organizationName || 'Not configured in config/site.json'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Support Contact</dt>
              <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                {siteConfig?.contactEmail || 'Not configured in config/site.json'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Security Disclosure Contact</dt>
              <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                {siteConfig?.securityContactEmail || 'Not configured in config/site.json'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
