import { cn } from '../../utils/cn';
import { initials } from '../../utils/format';

const SIZES = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };

/** Circular avatar. Falls back to initials on a brand-tinted background. */
export default function Avatar({ name, src, size = 'md', className }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 overflow-hidden',
        SIZES[size],
        className
      )}
      title={name}
    >
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials(name)}
    </div>
  );
}
