import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

function decodeJwt(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(decoded.split('').map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`).join('')));
  } catch {
    return null;
  }
}

function createUserFromToken(token) {
  const payload = decodeJwt(token);
  if (!payload) return null;
  return {
    username: payload.sub || payload.username || '',
    name: payload.name || payload.sub || payload.username || '',
    role: payload.role || payload.accountType || '',
    permissions: payload.permissions || [],
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('hust_user');
    if (stored) return JSON.parse(stored);
    const token = localStorage.getItem('hust_token');
    return token ? createUserFromToken(token) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('hust_token'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('hust_refresh_token'));

  const login = useCallback((userData, accessToken, refreshTokenValue) => {
    const nextUser = userData || createUserFromToken(accessToken);
    setUser(nextUser);
    setToken(accessToken);
    setRefreshToken(refreshTokenValue || null);
    localStorage.setItem('hust_user', JSON.stringify(nextUser));
    localStorage.setItem('hust_token', accessToken);
    if (refreshTokenValue) {
      localStorage.setItem('hust_refresh_token', refreshTokenValue);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authService.profile();
      const profileData = res.data?.data;
      if (profileData) {
        setUser(profileData);
        localStorage.setItem('hust_user', JSON.stringify(profileData));
      }
      return profileData;
    } catch {
      return null;
    }
  }, []);

  // Khi reload trang: nếu còn token thì gọi lại API profile để làm mới thông tin user
  useEffect(() => {
    if (token) refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('hust_user');
    localStorage.removeItem('hust_token');
    localStorage.removeItem('hust_refresh_token');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, login, logout, refreshProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
