import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/DashboardLayout';
import EmploiTempsPage from './pages/EmploiTempsPage';
import CahierPage from './pages/CahierPage';
import VacationPage from './pages/VacationPage';
import PointagePage from './pages/PointagePage';
import GestionPage from './pages/GestionPage';
import AuthCallbackPage from './pages/AuthCallbackPage';

// Protection des routes par rôle
function PrivateRoute({ children, roles }) {
  const token      = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const { user }   = useAuth();

  if (!token || !storedUser) return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth-callback" element={<AuthCallbackPage />} />
            <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>} />
            <Route path="/emploi-temps" element={<PrivateRoute><EmploiTempsPage /></PrivateRoute>} />
            <Route path="/gestion" element={<PrivateRoute roles={['administrateur']}><GestionPage /></PrivateRoute>} />
            <Route path="/cahiers" element={<PrivateRoute roles={['delegue','enseignant','administrateur']}><CahierPage /></PrivateRoute>} />
            <Route path="/vacations" element={<PrivateRoute roles={['enseignant','surveillant','comptable','administrateur']}><VacationPage /></PrivateRoute>} />
            <Route path="/pointage" element={<PrivateRoute roles={['enseignant']}><PointagePage /></PrivateRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}