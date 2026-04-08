/**
 * @module components/provider/ProviderDashboardLayout
 * Responsive shell for the provider dashboard with sidebar navigation,
 * mobile drawer, and logout. Wraps all provider-facing tab content.
 */
import { useState, useEffect, useRef, type FC, type ReactNode } from 'react';
import { useAuth } from '../../contexts/useAuth';

/** Single navigation entry rendered in the provider sidebar/drawer. */
export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

interface ProviderDashboardLayoutProps {
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: ReactNode;
}

/** Responsive provider dashboard shell with desktop sidebar and mobile drawer. */
export const ProviderDashboardLayout: FC<ProviderDashboardLayoutProps> = ({
  navItems,
  activeTab,
  onTabChange,
  children,
}) => {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    };
    if (drawerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const handleNavClick = (id: string) => {
    onTabChange(id);
    setDrawerOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center pt-6 pb-4 px-4">
        <img
          src="/images/wax seal.png"
          alt="Lunara"
          className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-[1px_1px_2px_rgba(87,30,0,0.21)]"
        />
      </div>

      <div className="px-5 pb-4">
        <p className="font-roman text-[#FAF7F2]/80 text-sm tracking-wider text-center truncate">
          Welcome, {user?.firstName || 'Provider'}
        </p>
      </div>

      <div className="mx-5 border-t border-[#FAF7F2]/15" />

      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 min-h-[44px] group ${
                    isActive
                      ? 'bg-white/90 text-[#4E1B00] shadow-[0_2px_8px_rgba(78,27,0,0.15)]'
                      : 'text-[#FAF7F2]/90 hover:bg-white/10 hover:text-[#FAF7F2]'
                  }`}
                >
                  <span className={`shrink-0 transition-colors ${isActive ? 'text-[#6B4D37]' : 'text-[#FAF7F2]/70 group-hover:text-[#FAF7F2]'}`}>
                    {item.icon}
                  </span>
                  <span className="font-roman text-sm tracking-[1.5px] uppercase truncate">
                    {item.label}
                  </span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto shrink-0 min-w-[22px] h-[22px] flex items-center justify-center px-1.5 text-xs font-bold text-white bg-[#AA6641] rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mx-5 border-t border-[#FAF7F2]/15" />

      <div className="p-4">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[#FAF7F2]/70 hover:text-[#FAF7F2] hover:bg-white/10 transition-all duration-200 min-h-[44px]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-roman text-sm tracking-[1.5px] uppercase">Logout</span>
        </button>
      </div>

      <div className="px-4 pb-4 pt-1">
        <p className="font-serif text-[#FAF7F2]/40 text-xs tracking-wider text-center">
          &copy; {new Date().getFullYear()} Lunara
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] min-h-screen bg-dash-bg flex overflow-x-hidden w-full max-w-[100vw]">
      <aside className="hidden md:flex md:flex-col md:w-[220px] lg:w-[250px] md:shrink-0 md:fixed md:inset-y-0 md:left-0 z-30">
        <div className="absolute inset-0 overflow-hidden">
          <img src="/images/az.png" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#1a1716]/80" />
        </div>
        <div className="relative z-10 flex flex-col h-full">
          {sidebarContent}
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-40">
        <div className="relative overflow-hidden">
          <img src="/images/az.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#1a1716]/85" />
          <div className="relative z-10 flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(!drawerOpen)}
              aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
              className="flex flex-col justify-center items-center gap-1.5 w-11 h-11 -ml-1.5"
            >
              <span className={`block w-6 h-0.5 bg-[#FAF7F2] transition-transform duration-300 ${drawerOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-6 h-0.5 bg-[#FAF7F2] transition-opacity duration-300 ${drawerOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-[#FAF7F2] transition-transform duration-300 ${drawerOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>

            <div className="flex items-center gap-2">
              <img src="/images/wax seal.png" alt="Lunara" className="w-9 h-9 object-contain" />
              <span className="font-serif text-[#FAF7F2] text-lg tracking-wider">Lunara</span>
            </div>

            {navItems.some(item => item.badge && item.badge > 0) && (
              <button
                type="button"
                onClick={() => handleNavClick('messages')}
                className="relative w-11 h-11 flex items-center justify-center -mr-1.5"
              >
                <svg className="w-6 h-6 text-[#FAF7F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-[#AA6641] rounded-full">
                  {navItems.reduce((sum, item) => sum + (item.badge || 0), 0)}
                </span>
              </button>
            )}
            {!navItems.some(item => item.badge && item.badge > 0) && <div className="w-11" />}
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity duration-300"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            ref={drawerRef}
            className="absolute top-0 left-0 bottom-0 w-[280px] max-w-[85vw] transform transition-transform duration-300"
          >
            <div className="absolute inset-0 overflow-hidden">
              <img src="/images/az.png" alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-[#1a1716]/85" />
            </div>
            <div className="relative z-10 h-full overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 overflow-x-hidden md:ml-[220px] lg:ml-[250px]">
        <div className="md:hidden h-[60px]" />
        <div className="min-h-[calc(100dvh-60px)] min-h-[calc(100vh-60px)] md:min-h-screen bg-dash-bg p-3 sm:p-5 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
