import { Moon, Sun } from 'lucide-react';
import { PageId } from '../types/bridge';

interface FooterProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  onNavigate: (page: PageId) => void;
}

export function Footer({ darkMode, onToggleTheme, onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0E131D]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
            BRIDGE
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Local-first connectivity between Android and Windows · Protocol v1.0
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => onNavigate('features')}
            className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => onNavigate('downloads')}
            className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0"
          >
            Downloads
          </button>
          <button
            type="button"
            onClick={() => onNavigate('docs')}
            className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0"
          >
            Documentation
          </button>
          <button
            type="button"
            onClick={() => onNavigate('security')}
            className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0"
          >
            Privacy & Security
          </button>
          <button
            type="button"
            onClick={() => onNavigate('about')}
            className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0"
          >
            About
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            <span>{darkMode ? 'Light theme' : 'Dark theme'}</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
