import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('carequeue_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('carequeue_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Determine home route per role
  const getRoleHomeRoute = (role) => {
    switch (role) {
      case 'Admin':
        return '/admin';
      case 'Doctor':
        return '/consultation';
      case 'Patient':
        return '/patient-portal';
      case 'Receptionist':
      default:
        return '/';
    }
  };

  // Logout handler
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('carequeue_token');
    localStorage.removeItem('carequeue_user');
  }, []);

  // Verify token on mount
  useEffect(() => {
    async function verifyAuth() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem('carequeue_user', JSON.stringify(data.user));
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();
  }, [token, logout]);

  // Login handler
  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to authenticate');
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('carequeue_token', data.token);
    localStorage.setItem('carequeue_user', JSON.stringify(data.user));

    return data.user;
  };

  // Patient Signup handler
  const signup = async (patientData) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('carequeue_token', data.token);
    localStorage.setItem('carequeue_user', JSON.stringify(data.user));

    return data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role: user?.role || null,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        signup,
        logout,
        getRoleHomeRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
