import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUser } from '../components/services/authService';
import SettingsPage from '../components/SettingsPage';
// Import components
import LoginForm from '../components/auth/LoginForm';
import ForgotPassword from '../components/auth/ForgotPassword';
import ResetPassword from '../components/auth/ResetPassword';
import MFASetup from '../components/auth/MFASetup';
import RegisterForm from '../components/auth/RegisterForm';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Hub from '../components/Hub';
import UserProfile from '../components/user/UserProfile';
import TrashBin from '../components/files/TrashBin';
import Dashboard from '../components/dashboard/Dashboard';

import UsersPage from '../components/UsersPage';
import { Theme } from 'emoji-picker-react';
import StatsPage from '../components/StatsPage';
import AuthCallback from '../components/auth/AuthCallback';
import TestCaptcha from '../components/TestCaptcha';
const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, loading } = useAuth();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setUser(null);
          return;
        }

        const userData = await getCurrentUser();
        if (userData?.id) {
          setUser(userData);
        } else {
          throw new Error('Invalid user data');
        }
      } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      }
    };

    fetchUser();
  }, [setUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated 
                ? <Navigate to="/hub" replace /> 
                : <LoginForm onSuccess={(userData) => {
                    setUser(userData);
                    navigate('/hub', { replace: true });
                  }} 
                />
            } 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/hub" replace /> : <RegisterForm />} 
          />
          <Route 
            path="/forgot-password" 
            element={isAuthenticated ? <Navigate to="/hub" /> : <ForgotPassword />} 
          />
          <Route 
            path="/reset-password/:token" 
            element={isAuthenticated ? <Navigate to="/hub" /> : <ResetPassword />} 
          />

          {/* Protected Routes */}
          <Route 
            path="/hub" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Hub user={user!} setUser={setUser} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/account/mfa-setup" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <MFASetup 
                  onSetupComplete={() => {
                    if (user) {
                      setUser({ ...user, mfa_enabled: true });
                    }
                  }}
                  onCancel={() => navigate("/hub")}
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <UserProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trash" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <TrashBin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route
        path="/users"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <UsersPage />
          </ProtectedRoute>
        }
      />          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/test-captcha" element={<TestCaptcha />} />
          <Route path="/settings" element={<ProtectedRoute isAuthenticated={isAuthenticated}><SettingsPage /></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute isAuthenticated={isAuthenticated}><StatsPage /></ProtectedRoute>} />
          {/* Default Route */}
          <Route path="/"  element={<Navigate to={isAuthenticated ? "/hub" : "/login"} replace />} />
        </Routes>
      </div>
    </div>
    
  );
};

export default AppRoutes;