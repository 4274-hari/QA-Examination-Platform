import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadComp from '../components/LoadComp';

const ProtectedRoute = ({ children, roles = [] }) => {
  const navigate = useNavigate();
  const { auth, validateSession, logout } = useAuth();

  const [status, setStatus] = useState('loading'); 
  // loading | allowed | denied

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    const validate = async () => {
      if (!auth) {
        navigate('/', { replace: true });
        return;
      }

      const valid = await validateSession();
      if (!mounted.current) return;

      if (!valid) {
        logout();
        navigate('/', { replace: true });
        return;
      }

      if (roles.length && !roles.includes(auth.role)) {
        navigate('/', { replace: true });
        return;
      }

      setStatus('allowed');
    };

    validate();

    return () => {
      mounted.current = false;
    };
  }, [auth, roles, navigate, validateSession, logout]);

  if (status === 'loading') {
    return <LoadComp txt="Validating session..." />;
  }

  if (status === 'denied') {
    return null;
  }

  return children;
};

export default ProtectedRoute;