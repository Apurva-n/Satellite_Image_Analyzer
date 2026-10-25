import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginUser,
  registerUser,
  getCurrentUser,
  getDatabaseStatus,
  getCloudReports,
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('terrascope_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('terrascope_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState(null);
  const [cloudReportsCount, setCloudReportsCount] = useState(0);

  // Modal controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'
  const [isReportsDrawerOpen, setIsReportsDrawerOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);
  const openReportsDrawer = () => setIsReportsDrawerOpen(true);
  const closeReportsDrawer = () => setIsReportsDrawerOpen(false);
  const openDbModal = () => setIsDbModalOpen(true);
  const closeDbModal = () => setIsDbModalOpen(false);

  // Fetch live Cloud DB health & telemetry
  const fetchDbStatus = useCallback(async () => {
    try {
      const data = await getDatabaseStatus();
      setDbStatus(data);
    } catch (err) {
      console.warn('Could not reach database status endpoint:', err);
    }
  }, []);

  // Fetch reports count for current user
  const refreshReportsCount = useCallback(async () => {
    if (!token) return;
    try {
      const reports = await getCloudReports();
      if (Array.isArray(reports)) {
        setCloudReportsCount(reports.length);
      }
    } catch {
      // Ignored if unauthenticated
    }
  }, [token]);

  // Verify and hydrate current user session on mount
  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      setIsLoading(true);
      fetchDbStatus();

      if (token) {
        try {
          const profile = await getCurrentUser();
          if (isMounted) {
            setUser(profile);
            localStorage.setItem('terrascope_user', JSON.stringify(profile));
          }
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          if (isMounted) {
            setToken(null);
            setUser(null);
            localStorage.removeItem('terrascope_token');
            localStorage.removeItem('terrascope_user');
          }
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    initSession();
    return () => { isMounted = false; };
  }, [token, fetchDbStatus]);

  useEffect(() => {
    if (user) {
      refreshReportsCount();
    } else {
      setCloudReportsCount(0);
    }
  }, [user, refreshReportsCount]);

  // Login handler
  const login = async (email, password) => {
    const res = await loginUser(email, password);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('terrascope_token', res.access_token);
    localStorage.setItem('terrascope_user', JSON.stringify(res.user));
    closeAuthModal();
    fetchDbStatus();
    return res.user;
  };

  // Register handler
  const register = async (payload) => {
    const res = await registerUser(payload);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('terrascope_token', res.access_token);
    localStorage.setItem('terrascope_user', JSON.stringify(res.user));
    closeAuthModal();
    fetchDbStatus();
    return res.user;
  };

  // Logout handler
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('terrascope_token');
    localStorage.removeItem('terrascope_user');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    role: user?.role || 'guest',
    isLoading,
    dbStatus,
    cloudReportsCount,
    login,
    register,
    logout,
    fetchDbStatus,
    refreshReportsCount,
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    isReportsDrawerOpen,
    openReportsDrawer,
    closeReportsDrawer,
    isDbModalOpen,
    openDbModal,
    closeDbModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
