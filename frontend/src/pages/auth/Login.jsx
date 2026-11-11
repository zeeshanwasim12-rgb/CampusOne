import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../../components/auth/AuthShell';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth, errMessage } from '../../context/AuthContext';

// Handy for the jury/viva demo — one click fills a role's credentials.
const demoAccounts = [
  { label: 'Student', email: 'aarav@campusone.edu', password: 'Student@123' },
  { label: 'Faculty', email: 'prof.sharma@campusone.edu', password: 'Faculty@123' },
  { label: 'Admin', email: 'admin@campusone.edu', password: 'Admin@123' },
];

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';
  if (isAuthenticated) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(errMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in to CampusOne"
      subtitle="Enter your credentials to access your dashboard."
      footer={
        <>
          Don’t have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@campusone.edu"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>

      <div className="mt-6">
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
          Demo accounts
        </p>
        <div className="grid grid-cols-3 gap-2">
          {demoAccounts.map((d) => (
            <button
              key={d.label}
              type="button"
              onClick={() => setForm({ email: d.email, password: d.password })}
              className="btn-secondary btn-sm justify-center"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
