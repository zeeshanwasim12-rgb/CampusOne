import { cn } from '../../utils/cn';
import { Inbox } from 'lucide-react';

/** Friendly empty-state placeholder with optional action. */
export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/60 py-14 px-6 text-center', className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon size={22} />
      </div>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
