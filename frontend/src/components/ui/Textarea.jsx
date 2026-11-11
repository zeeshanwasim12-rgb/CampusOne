import { cn } from '../../utils/cn';

export default function Textarea({ label, error, className, id, rows = 4, ...props }) {
  const inputId = id || props.name;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={cn('input resize-y', error && 'border-red-400 focus:ring-red-100', className)}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
