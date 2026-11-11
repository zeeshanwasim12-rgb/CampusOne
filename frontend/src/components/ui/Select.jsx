import { cn } from '../../utils/cn';

/**
 * Select — pass `options` as strings or {value,label}. `placeholder` renders a
 * disabled first option. Value/onChange are forwarded to the native <select>.
 */
export default function Select({ label, error, className, id, options = [], placeholder, ...props }) {
  const inputId = id || props.name;
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <select id={inputId} className={cn('input pr-8', className)} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
