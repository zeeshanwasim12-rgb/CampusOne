import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/** Gate: requires the user's role to be in `allow`, else bounces to dashboard. */
export default function RoleRoute({ allow, children }) {
  const { role } = useAuth();
  if (!allow.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
}
