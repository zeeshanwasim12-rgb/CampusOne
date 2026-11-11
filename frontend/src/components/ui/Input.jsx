import { cn } from '../../utils/cn';

/** Labelled text input with optional error text. Forwards all native props. */
export default function Input({ label, error, className, id, hint, ...props }) {
  const inputId = id || props.name;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <input id={inputId} className={cn('input', error && 'border-red-400 focus:ring-red-100', className)} {...props} />
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
