import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../../components/auth/AuthShell';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { useAuth, errMessage } from '../../context/AuthContext';

const programs = ['B.Tech CSE', 'B.Tech IT', 'B.Tech AI & DS', 'MCA', 'M.Tech CSE'];
const semesters = Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }));

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    program: '',
    semester: '',
    rollNumber: '',
  });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        semester: form.semester ? Number(form.semester) : undefined,
      };
      await register(payload);
      toast.success('Account created — welcome to CampusOne!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(errMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your student account"
      subtitle="Public sign-up is for students. Faculty & admin accounts are provisioned by administrators."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input label="Full name" name="name" placeholder="Aarav Sharma" value={form.name} onChange={set('name')} required />
        <Input
          label="Email address"
          type="email"
          name="email"
          placeholder="you@campusone.edu"
          value={form.email}
          onChange={set('email')}
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="At least 6 characters"
          value={form.password}
          onChange={set('password')}
          minLength={6}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Program" name="program" placeholder="Select" options={programs} value={form.program} onChange={set('program')} />
          <Select label="Semester" name="semester" placeholder="Select" options={semesters} value={form.semester} onChange={set('semester')} />
        </div>
        <Input label="Roll number (optional)" name="rollNumber" placeholder="e.g. 22CS1042" value={form.rollNumber} onChange={set('rollNumber')} />
        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
