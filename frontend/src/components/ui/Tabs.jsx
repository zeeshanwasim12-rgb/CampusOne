import { cn } from '../../utils/cn';

/**
 * Tabs — controlled pill/underline tabs.
 * `tabs` = [{ value, label, count? }]; `value` + `onChange` control selection.
 */
export default function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn('flex flex-wrap gap-1 border-b border-slate-200', className)}>
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            )}
          >
            {t.label}
            {typeof t.count === 'number' && (
              <span className={cn('ml-1.5 rounded-full px-1.5 py-0.5 text-xs', active ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500')}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
