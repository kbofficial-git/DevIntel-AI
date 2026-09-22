import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types/auth';
import { fetchCurrentUser, logout as apiLogout, isDemoMode, setDemoMode } from '../services/api';
import { DEMO_USER } from '../services/demoData';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isDemo: boolean;
  loginDemoUser: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(isDemoMode());

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      if (isDemoMode()) {
        setIsDemo(true);
        setUser(DEMO_USER);
        return;
      }

      const res = await fetchCurrentUser();
      if (res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch {
      // 401 or network error - user is not authenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const loginDemoUser = () => {
    setDemoMode(true);
    setIsDemo(true);
    setUser(DEMO_USER);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setDemoMode(false);
      setIsDemo(false);
      setUser(null);
      const baseUrl = import.meta.env.BASE_URL || '/';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      window.location.href = `${cleanBase}login`;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isDemo,
        loginDemoUser,
        logout,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
