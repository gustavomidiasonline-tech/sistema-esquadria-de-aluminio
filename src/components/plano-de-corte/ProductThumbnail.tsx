interface ProductThumbnailProps {
  tipo: string;
  folhas?: number;
  className?: string;
}

export function ProductThumbnail({ tipo, folhas = 2, className = "w-24 h-20" }: ProductThumbnailProps) {
  const renderSVG = () => {
    switch (tipo) {
      case "correr":
        if (folhas === 4) {
          return (
            <svg viewBox="0 0 120 80" className={className}>
              <rect x="4" y="4" width="112" height="72" fill="none" stroke="#555" strokeWidth="2" rx="1" />
              <line x1="32" y1="4" x2="32" y2="76" stroke="#555" strokeWidth="1.5" />
              <line x1="60" y1="4" x2="60" y2="76" stroke="#555" strokeWidth="1.5" />
              <line x1="88" y1="4" x2="88" y2="76" stroke="#555" strokeWidth="1.5" />
              <path d="M18 38 L12 34 L12 42 Z" fill="#555" />
              <path d="M46 38 L52 34 L52 42 Z" fill="#555" />
              <path d="M74 38 L68 34 L68 42 Z" fill="#555" />
              <path d="M102 38 L108 34 L108 42 Z" fill="#555" />
              {/* Handles */}
              <rect x="29" y="30" width="3" height="16" fill="#777" rx="1" />
              <rect x="60" y="30" width="3" height="16" fill="#777" rx="1" />
            </svg>
          );
        }
        return (
          <svg viewBox="0 0 120 80" className={className}>
            <rect x="4" y="4" width="112" height="72" fill="none" stroke="#555" strokeWidth="2" rx="1" />
            <line x1="60" y1="4" x2="60" y2="76" stroke="#555" strokeWidth="1.5" />
            <path d="M30 38 L24 34 L24 42 Z" fill="#555" />
            <path d="M90 38 L96 34 L96 42 Z" fill="#555" />
            <rect x="57" y="30" width="3" height="16" fill="#777" rx="1" />
          </svg>
        );

      case "pivotante":
        return (
          <svg viewBox="0 0 80 120" className={className}>
            <rect x="4" y="4" width="72" height="112" fill="none" stroke="#555" strokeWidth="2" rx="1" />
            <line x1="40" y1="4" x2="40" y2="116" stroke="#555" strokeWidth="1" strokeDasharray="4 2" />
            <circle cx="40" cy="60" r="3" fill="#777" />
            <rect x="36" y="50" width="8" height="20" fill="none" stroke="#777" strokeWidth="1" rx="2" />
          </svg>
        );

      case "basculante":
        return (
          <svg viewBox="0 0 120 80" className={className}>
            <rect x="4" y="4" width="112" height="72" fill="none" stroke="#555" strokeWidth="2" rx="1" />
            <line x1="4" y1="40" x2="116" y2="40" stroke="#555" strokeWidth="1" />
            <path d="M60 20 L56 12 L64 12 Z" fill="#555" />
            <path d="M60 56 L56 64 L64 64 Z" fill="#555" />
          </svg>
        );

      case "maxim-ar":
        return (
          <svg viewBox="0 0 120 80" className={className}>
            <rect x="4" y="4" width="112" height="72" fill="none" stroke="#555" strokeWidth="2" rx="1" />
            <rect x="10" y="10" width="100" height="60" fill="none" stroke="#666" strokeWidth="1.2" rx="1" />
            <path d="M60 10 L56 4 L64 4 Z" fill="#555" />
          </svg>
        );

      case "fachada":
        return (
          <svg viewBox="0 0 120 100" className={className}>
            <rect x="4" y="4" width="112" height="92" fill="none" stroke="#555" strokeWidth="2" rx="1" />
            <line x1="40" y1="4" x2="40" y2="96" stroke="#555" strokeWidth="1.5" />
            <line x1="80" y1="4" x2="80" y2="96" stroke="#555" strokeWidth="1.5" />
            <line x1="4" y1="36" x2="116" y2="36" stroke="#555" strokeWidth="1.5" />
            <line x1="4" y1="68" x2="116" y2="68" stroke="#555" strokeWidth="1.5" />
          </svg>
        );

      case "veneziana":
        return (
          <svg viewBox="0 0 120 80" className={className}>
            <rect x="4" y="4" width="112" height="72" fill="none" stroke="#555" strokeWidth="2" rx="1" />
            <line x1="60" y1="4" x2="60" y2="76" stroke="#555" strokeWidth="1.5" />
            {[14, 22, 30, 38, 46, 54, 62].map(y => (
              <g key={y}>
                <line x1="8" y1={y} x2="56" y2={y} stroke="#888" strokeWidth="0.8" />
                <line x1="64" y1={y} x2="112" y2={y} stroke="#888" strokeWidth="0.8" />
              </g>
            ))}
          </svg>
        );

      default: // porta de correr, box, etc.
        return (
          <svg viewBox="0 0 120 80" className={className}>
            <rect x="4" y="4" width="112" height="72" fill="none" stroke="#555" strokeWidth="2" rx="1" />
            <line x1="60" y1="4" x2="60" y2="76" stroke="#555" strokeWidth="1.5" />
            <path d="M30 38 L24 34 L24 42 Z" fill="#555" />
            <path d="M90 38 L96 34 L96 42 Z" fill="#555" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg flex items-center justify-center p-2">
      {renderSVG()}
    </div>
  );
}
