import { useState } from 'react';
import {
  ANDROID_NAV_SCREENS,
  CORE_FEATURES,
  WINDOWS_NAV_SCREENS,
} from '../data/bridgeContent';
import { PageId } from '../types/bridge';

interface FeaturesPageProps {
  onNavigate: (page: PageId) => void;
}

export function FeaturesPage({ onNavigate }: FeaturesPageProps) {
  const [platformTab, setPlatformTab] = useState<'windows' | 'android'>('windows');
  const [selectedWinNav, setSelectedWinNav] = useState(WINDOWS_NAV_SCREENS[0].id);
  const [selectedAndroidNav, setSelectedAndroidNav] = useState(ANDROID_NAV_SCREENS[0].id);

  const activeWinScreen =
    WINDOWS_NAV_SCREENS.find((s) => s.id === selectedWinNav) ?? WINDOWS_NAV_SCREENS[0];
  const activeAndroidScreen =
    ANDROID_NAV_SCREENS.find((s) => s.id === selectedAndroidNav) ?? ANDROID_NAV_SCREENS[0];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Platform Capabilities · Protocol v1.0
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Eight integrated modules across Windows and Android
        </h1>
        <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
          Each capability maps directly to dedicated modules in the Windows WinUI 3 solution and
          Android Jetpack Compose application, with clear boundaries where OS drivers or permissions
          apply.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        {CORE_FEATURES.map((feat) => (
          <article
            key={feat.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#121824]"
          >
            <div className="space-y-2">
              <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                Module {feat.index}
              </p>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                {feat.title}
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {feat.summary}
              </p>
            </div>
            <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {feat.platformNote}
            </p>
          </article>
        ))}
      </div>

      <section className="mt-16 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-[#121824]">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center dark:border-slate-800">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Application UI Architecture Explorer
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Inspect the navigation structure implemented in the native Windows and Android source
              trees (architecture preview only — not a live device session).
            </p>
          </div>
          <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setPlatformTab('windows')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                platformTab === 'windows'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1E293B] dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Windows Desktop (10 Views)
            </button>
            <button
              type="button"
              onClick={() => setPlatformTab('android')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                platformTab === 'android'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1E293B] dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Android Mobile (Compose)
            </button>
          </div>
        </div>

        {platformTab === 'windows' ? (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-1 lg:col-span-4">
              {WINDOWS_NAV_SCREENS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedWinNav(item.id)}
                  className={`rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                    selectedWinNav === item.id
                      ? 'bg-blue-700 text-white dark:bg-blue-600'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-6 lg:col-span-8 dark:border-slate-800 dark:bg-[#0B0F17]">
              <div className="space-y-3">
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  windows/Bridge.Desktop/MainWindow.xaml · {activeWinScreen.id}
                </p>
                <h3 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
                  {activeWinScreen.label}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {activeWinScreen.detail}
                </p>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span>Includes persistent Emergency Disconnect & Dark/Light theme toggle</span>
                <button
                  type="button"
                  onClick={() => onNavigate('downloads')}
                  className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                >
                  Check Windows build instructions
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-2 lg:col-span-4">
              {ANDROID_NAV_SCREENS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedAndroidNav(item.id)}
                  className={`rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                    selectedAndroidNav === item.id
                      ? 'bg-blue-700 text-white dark:bg-blue-600'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-6 lg:col-span-8 dark:border-slate-800 dark:bg-[#0B0F17]">
              <div className="space-y-3">
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  android/app/src/main/java/com/bridge/app · {activeAndroidScreen.id}
                </p>
                <h3 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
                  {activeAndroidScreen.label}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {activeAndroidScreen.detail}
                </p>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span>Built with Jetpack Compose Material 3 & Android Keystore</span>
                <button
                  type="button"
                  onClick={() => onNavigate('downloads')}
                  className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                >
                  Check Android build instructions
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
