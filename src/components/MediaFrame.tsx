import { Laptop } from 'lucide-react';
import { useState } from 'react';

interface MediaFrameProps {
  src: string;
  alt: string;
  className?: string;
}

export function MediaFrame({ src, alt, className = '' }: MediaFrameProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-100 to-slate-200 p-8 text-center text-slate-600 dark:from-slate-800 dark:to-slate-900 dark:text-slate-300 ${className}`}
      >
        <Laptop className="h-8 w-8 text-blue-700 dark:text-blue-400" />
        <p className="max-w-xs text-sm font-medium">{alt}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
