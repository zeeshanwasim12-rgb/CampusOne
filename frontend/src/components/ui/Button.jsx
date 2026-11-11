import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

/**
 * Button — thin wrapper over the .btn-* classes with a loading state.
 * `as` lets it render a react-router <Link> while keeping the same styling.
 */
export default function Button({
  variant = 'primary',
  size,
  loading = false,
  disabled,
  className,
  children,
  as: Comp = 'button',
  ...props
}) {
  return (
    <Comp
      className={cn(VARIANTS[variant] || VARIANTS.primary, size === 'sm' && 'btn-sm', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </Comp>
  );
}
