import { useEffect, useState } from 'react';
import { AboutPage } from './components/AboutPage';
import { DocsPage } from './components/DocsPage';
import { DownloadsPage } from './components/DownloadsPage';
import { FeaturesPage } from './components/FeaturesPage';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { Navbar } from './components/Navbar';
import { SecurityPage } from './components/SecurityPage';
import { PageId } from './types/bridge';

const VALID_PAGES = new Set<PageId>(['home', 'features', 'downloads', 'docs', 'security', 'about']);

function getInitialPage(): PageId {
  const hash = window.location.hash.replace('#', '') as PageId;
  return VALID_PAGES.has(hash) ? hash : 'home';
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>(getInitialPage);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const onHashChange = () => {
      setCurrentPage(getInitialPage());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (page: PageId) => {
    setCurrentPage(page);
    window.location.hash = page === 'home' ? '' : page;
    window.scrollTo(0, 0);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-[#0B0F17] dark:text-slate-100">
      <Navbar currentPage={currentPage} onNavigate={navigate} />

      <main className="flex-1">
        {currentPage === 'home' && <HomePage onNavigate={navigate} />}
        {currentPage === 'features' && <FeaturesPage onNavigate={navigate} />}
        {currentPage === 'downloads' && <DownloadsPage />}
        {currentPage === 'docs' && <DocsPage />}
        {currentPage === 'security' && <SecurityPage />}
        {currentPage === 'about' && <AboutPage />}
      </main>

      <Footer
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((prev) => !prev)}
        onNavigate={navigate}
      />
    </div>
  );
}
