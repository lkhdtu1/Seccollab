import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../components/services/authService';

export interface User {
  id: number;
  name: string;
  email: string;
  mfa_enabled?: boolean;
    avatar_url?: string | null;
    is_active?: number;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
  mfa_required?: boolean;
  user_id?: number;
  message?: string;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  login?: (tokens: { accessToken: string; refreshToken: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Enhanced session verification
  useEffect(() => {
    const verifySession = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Try to get current user from backend
        const response = await getCurrentUser();
        
        if (response.user) {
          setUser(response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          // Update tokens if provided
          if (response.access_token) {
            localStorage.setItem('access_token', response.access_token);
          }
          if (response.refresh_token) {
            localStorage.setItem('refresh_token', response.refresh_token);
          }
        }
      } catch (error: any) {
        // Only clear auth data if it's an auth error, not network error
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setUser(null);
        }
        // Keep existing session on network errors
        console.error('Session verification error:', error);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  // Update localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  const value = {
    user,
    setUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};