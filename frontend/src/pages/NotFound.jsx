import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Compass size={30} />
      </div>
      <p className="text-5xl font-extrabold text-slate-800">404</p>
      <h1 className="mt-2 text-lg font-semibold text-slate-700">Page not found</h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        The page you’re looking for doesn’t exist or may have been moved.
      </p>
      <Link to="/dashboard" className="btn-primary mt-6">
        Back to Dashboard
      </Link>
    </div>
  );
}
