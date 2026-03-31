import React, { useState, useEffect } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

export function GlobalLoader() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isBusy = isFetching > 0 || isMutating > 0;
    
    // Only show the spinner if the request takes more than 250ms to prevent flickering
    if (isBusy) {
      const timeout = window.setTimeout(() => setShow(true), 250);
      return () => window.clearTimeout(timeout);
    } else {
      setShow(false);
    }
  }, [isFetching, isMutating]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/10 backdrop-blur-[2px] transition-all duration-300 pointer-events-none">
      <svg
        className="animate-spin text-zinc-900 drop-shadow-lg"
        width="100"
        height="100"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <circle cx="50" cy="15" r="7" opacity="1" />
        <circle cx="74.7" cy="25.3" r="7" opacity=".8" />
        <circle cx="85" cy="50" r="7" opacity=".6" />
        <circle cx="74.7" cy="74.7" r="7" opacity=".4" />
        <circle cx="50" cy="85" r="7" opacity=".2" />
        <circle cx="25.3" cy="74.7" r="7" opacity=".1" />
        <circle cx="15" cy="50" r="7" opacity=".05" />
        <circle cx="25.3" cy="25.3" r="7" opacity=".02" />
      </svg>
    </div>
  );
}
