import { cn } from '../../utils/cn';

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('card', className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardHeader({ className, children }) {
  return <div className={cn('px-5 py-4 border-b border-slate-100', className)}>{children}</div>;
}

export default Card;
