import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

/** Centered spinner. Use `fullPage` for route-level loading. */
export default function Spinner({ fullPage = false, label, className, size = 28 }) {
  const spinner = (
    <div className="flex flex-col items-center gap-3 text-slate-400">
      <Loader2 size={size} className={cn('animate-spin text-brand-600', className)} />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
  if (fullPage) {
    return <div className="flex min-h-[50vh] items-center justify-center">{spinner}</div>;
  }
  return <div className="flex items-center justify-center py-10">{spinner}</div>;
}
