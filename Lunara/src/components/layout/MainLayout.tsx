/**
 * @module components/layout/MainLayout
 * Top-level page wrapper that combines SimpleHeader, a flex-grow main
 * content area, and SimpleFooter for all public-facing pages.
 */
import React from 'react';
import { SimpleHeader } from './SimpleHeader';
import { SimpleFooter } from './SimpleFooter';

/** Renders the full-page shell with header, content slot, and footer. */
export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-[100dvh] min-h-screen flex flex-col bg-[#FAF7F2] overflow-x-hidden w-full max-w-[100vw] relative">
    <div className="relative z-50">
      <SimpleHeader />
    </div>
    <main className="relative flex-grow min-w-0 overflow-x-hidden">{children}</main>
    <SimpleFooter fixed={false} />
  </div>
);
