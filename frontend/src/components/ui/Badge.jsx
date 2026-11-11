import { cn } from '../../utils/cn';

/** Small rounded status pill. Pass a Tailwind color class set via `className`. */
export default function Badge({ className, children }) {
  return <span className={cn('badge bg-slate-100 text-slate-600', className)}>{children}</span>;
}
