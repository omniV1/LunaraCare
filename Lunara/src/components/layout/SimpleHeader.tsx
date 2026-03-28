// Site-wide header with responsive navigation and animated hamburger menu.
import { useState, type FC } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';

/** Primary navigation links rendered in both desktop and mobile menus. */
const NAV_LINKS = [{ to: '/blog', label: 'Blog' }];

export const SimpleHeader: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, getDashboardRoute } = useAuth();
  const authLink = isAuthenticated && user
    ? { to: getDashboardRoute(user.role), label: 'Dashboard' }
    : { to: '/login', label: 'Login' };

  return (
    <header className="bg-[#241a14] z-20 relative pt-[env(safe-area-inset-top)]">
      <div className="py-4 px-4 sm:px-6 md:px-8 flex items-center justify-between">
        <Link
          to="/"
          className="relative font-serif text-[#FAF7F2] text-lg tracking-wider hover:text-white transition-colors after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:h-[2px] after:w-0 after:bg-[#FAF7F2] after:transition-all after:duration-300 hover:after:w-full"
        >
          Lunara
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="relative font-serif text-[#FAF7F2] text-base tracking-wider hover:text-white transition-colors after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:h-[2px] after:w-0 after:bg-[#FAF7F2] after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to={authLink.to}
            className="font-serif text-[#FAF7F2] text-base tracking-wider bg-[#6B4D37] px-5 py-1.5 rounded-full hover:bg-[#5a402e] transition-colors"
          >
            {authLink.label}
          </Link>
        </nav>

        {/* Hamburger button – mobile only */}
        <button
          type="button"
          className="md:hidden flex flex-col justify-center items-center gap-1.5 w-11 h-11 -mr-1.5"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <span
            className={`block w-6 h-0.5 bg-[#FAF7F2] transition-transform duration-300 ${
              isMenuOpen ? 'rotate-45 translate-y-2' : ''
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-[#FAF7F2] transition-opacity duration-300 ${
              isMenuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-[#FAF7F2] transition-transform duration-300 ${
              isMenuOpen ? '-rotate-45 -translate-y-2' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <nav
        className={`md:hidden overflow-hidden transition-all duration-300 bg-[#241a14] ${
          isMenuOpen ? 'max-h-80 pb-6' : 'max-h-0'
        }`}
      >
        <div className="flex flex-col items-center gap-4 px-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="relative font-serif text-[#FAF7F2] text-lg tracking-wider hover:text-white transition-colors after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:h-[2px] after:w-0 after:bg-[#FAF7F2] after:transition-all after:duration-300 hover:after:w-full"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to={authLink.to}
            className="font-serif text-[#FAF7F2] text-lg tracking-wider bg-[#6B4D37] px-6 py-2 rounded-full hover:bg-[#5a402e] transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            {authLink.label}
          </Link>
        </div>
      </nav>
    </header>
  );
};
