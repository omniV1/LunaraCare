/**
 * @module components/layout/ConstructionAlert
 * Dismissable yellow banner shown at the top of the page to inform
 * visitors that the site is under construction.
 */
import React, { useState } from 'react';
import { FaHardHat, FaTimes } from 'react-icons/fa';

/** Renders a dismissable "under construction" alert banner. */
const ConstructionAlert: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-yellow-100 border-b-2 border-yellow-300">
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex-1 flex items-center">
            <span className="flex p-2">
              <FaHardHat className="h-6 w-6 text-yellow-600" aria-hidden="true" />
            </span>
            <p className="ml-3 font-medium text-yellow-700">
              <span className="md:hidden">Site under construction!</span>
              <span className="hidden md:inline">
                🚧 Welcome to Lunara! Our site is currently under construction. Some features may be
                limited or unavailable.
              </span>
            </p>
          </div>
          <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
            <button
              type="button"
              className="-mr-1 flex p-2 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              onClick={() => setIsVisible(false)}
            >
              <span className="sr-only">Dismiss</span>
              <FaTimes className="h-5 w-5 text-yellow-600" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConstructionAlert;
