/**
 * @module components/layout/SimpleFooter
 * Site-wide footer with Privacy Policy / Terms links, partner logos,
 * and copyright notice. Optionally fixed to the viewport bottom.
 */
import { type FC } from 'react';
import { Link } from 'react-router-dom';

interface SimpleFooterProps {
  /** Whether the footer should be fixed to the bottom. Defaults to true */
  fixed?: boolean;
}

/** Renders the site footer with legal links, partner logos, and copyright. */
export const SimpleFooter: FC<SimpleFooterProps> = ({ fixed = true }) => {
  return (
    <footer className={`${fixed ? 'fixed bottom-0' : ''} left-0 right-0 z-20 w-full max-w-[100vw] overflow-x-hidden pb-[env(safe-area-inset-bottom)]`}>
      <div className="bg-[#220C00] py-6 sm:py-10 px-4 sm:px-6 md:px-24 relative flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
        <div className="font-serif text-[#FAF7F2] text-sm sm:text-lg tracking-wider order-2 md:order-1 md:w-1/3 text-center md:text-left flex flex-col sm:flex-row sm:flex-wrap justify-center md:justify-start items-center gap-1 sm:gap-0 sm:gap-x-2">
          <Link
            to="/privacy"
            className="underline underline-offset-2 hover:text-white/80 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="hidden sm:inline mx-2">|</span>
          <Link
            to="/terms"
            className="underline underline-offset-2 hover:text-white/80 transition-colors"
          >
            Terms &amp; Conditions
          </Link>
        </div>
        <div className="relative flex items-center justify-center order-1 md:order-2 md:w-1/3 gap-4 md:gap-0">
          <img
            src="/images/ally.png"
            alt="Ally logo"
            className="w-16 h-16 sm:w-24 sm:h-24 object-contain"
          />
          <img
            src="/images/BHV Partner White 1.png"
            alt="BE HER village Partner"
            className="h-12 sm:h-16 object-contain md:absolute md:left-[calc(50%+90px)]"
          />
        </div>
        <div className="font-serif text-[#FAF7F2] text-sm sm:text-lg tracking-wider order-3 md:w-1/3 text-center md:text-right">
          © {new Date().getFullYear()} Lunara
        </div>
      </div>
    </footer>
  );
};
