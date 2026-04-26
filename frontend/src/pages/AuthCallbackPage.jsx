import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallbackPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    const user   = {
      id:    params.get('id'),
      email: decodeURIComponent(params.get('email') || ''),
      role:  params.get('role')
    };

    if (token && user.email) {
      login(token, user);
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}}></div>
        <p className="text-muted">Connexion en cours...</p>
      </div>
    </div>
  );
}