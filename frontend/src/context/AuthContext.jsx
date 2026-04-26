import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) {
      setUser(JSON.parse(u));
      setToken(t);
    }
  }, []);

  const login = (tokenRecu, userRecu) => {
    localStorage.setItem('token', tokenRecu);
    localStorage.setItem('user', JSON.stringify(userRecu));
    setToken(tokenRecu);
    setUser(userRecu);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);