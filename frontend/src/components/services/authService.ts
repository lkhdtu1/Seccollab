import axios from 'axios';
import { API_BASE_URL } from '../config/config'; // Adjust the import path as necessary
import { User } from '../..//contexts/AuthContext';
import { AuthResponse } from '../../contexts/AuthContext';
// Configure axios defaults with security headers
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true; // Enable secure cookie handling
axios.defaults.headers.common['X-Content-Type-Options'] = 'nosniff';
axios.defaults.headers.common['X-Frame-Options'] = 'DENY';
axios.defaults.headers.common['X-XSS-Protection'] = '1; mode=block';

// Add JWT token to requests if available with enhanced security
axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    if (token) {
      // Add security headers
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh on 401 errors
let isLoggingOut = false;

// Token refresh and logout protection
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
  
      // Prevent retry loops and ignore logout endpoint
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url.includes('/auth/logout')
      ) {
        originalRequest._retry = true;
  
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            await safeLogout();
            return Promise.reject(error);
          }
  
          const { data } = await axios.post('/auth/refresh', {
            refresh_token: refreshToken,
          });
  
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
        
        return axios(originalRequest);
      } catch (refreshError) {
        await safeLogout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
  );
  
  // --------------------------------
  // ✅ SAFE LOGOUT FUNCTION
  // --------------------------------
  const safeLogout = async () => {
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      await axios.post('/auth/logout', null, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
  } catch (error) {
    console.error('Logout request failed:', error);
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    isLoggingOut = false;
  }
};

export const logout = async () => {
  await safeLogout();
};
// User registration
export const register = async (userData: { email: string; password: string; name: string; captcha_token?: string }) => {
  try {
    const { data } = await axios.post('/auth/register', userData);
    return data;
  } catch (error) {
    throw handleError(error);
  }
};

// User login
export const login = async (credentials: {
  email: string;
  password: string;
  mfa_code?: string;
  remember_device?: boolean;
}): Promise<AuthResponse> => {
  try {
    const { data } = await axios.post(`${API_BASE_URL}/auth/login`, {
      ...credentials,
      email: credentials.email.toLowerCase().trim()
    });

    // Check explicitly for MFA requirement
    if (data.mfa_required) {
      console.log('MFA required for user:', data.user_id);
      return {
        mfa_required: true,
        user_id: data.user_id,
        message: data.message || 'MFA verification required'
      } as AuthResponse;
    }

    // If no MFA required, return the normal login response
    return data as AuthResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
    throw error;
  }
};

export const verifyMfaCode = async ({
  userId,
  code,
  rememberDevice
}: {
  userId: string;
  code: string;
  rememberDevice?: boolean;
}): Promise<AuthResponse> => {
  try {
    const { data } = await axios.post(`${API_BASE_URL}/auth/mfa/verify`, {
      user_id: userId,
      code,
      remember_device: rememberDevice
    });

    return data as AuthResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'MFA verification failed');
    }
    throw error;
  }
};












  

// Get current user with enhanced session handling
export const getCurrentUser = async () => {
  try {
    const { data } = await axios.get('/token/verify');
    
    // Update access token if a new one was provided
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    
    return data.user;
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Try to refresh token on auth error
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const { data } = await axios.post('/token/refresh', {
            refresh_token: refreshToken
          });
          
          // Update tokens and retry getting user
          localStorage.setItem('access_token', data.access_token);
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
          }
          
          // Retry original request
          const retryResponse = await axios.get('/token/verify');
          return retryResponse.data.user;
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    throw error;
  }
};

/*
// Update user profile
export const updateProfile = async (formData: FormData) => {
    try {
      const { data } = await axios.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    } catch (error) {
      throw handleError(error);
    }
  };*/



// MFA Setup
export const setupMfa = async () => {
  try {
    const { data } = await axios.get('/auth/mfa/setup');
    return data;
  } catch (error) {
    throw handleError(error);
  }
};

// Enable MFA
export const enableMfa = async (code: string) => {
  try {
    const { data } = await axios.post('/auth/mfa/enable', { code });
    return data;
  } catch (error) {
    throw handleError(error);
  }
};

// Disable MFA
export const disableMfa = async (password: string) => {
  try {
    const { data } = await axios.post('/auth/mfa/disable', { password });
    return data;
  } catch (error) {
    throw handleError(error);
  }
};
/*
// Verify MFA code
export const verifyMfaCode = async (verificationData: { user_id: string; code: string; remember_device?: boolean }) => {
  try {
    const { data } = await axios.post('/auth/mfa/verify', verificationData);

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);

    return data;
  } catch (error) {
    throw handleError(error);
  }
};*/

// Password reset request
export const requestPasswordReset = async (email: string, captcha_token?: string) => {
  try {
    const { data } = await axios.post('/auth/forgot-password', { 
      email: email.toLowerCase().trim(), 
      captcha_token 
    });
    return data;
  } catch (error) {
    throw handleError(error);
  }
};

// Reset password with token
export const resetPassword = async (token: string, password: string) => {
  try {
    const { data } = await axios.post(`/auth/reset-password/${token}`, { password });
    return data;
  } catch (error) {
    throw handleError(error);
  }
};

// Google OAuth

// Initiate Google login
export const initiateGoogleLogin = async () => {
  try {
    const { data } = await axios.get('/auth/login/google');
    return data;
  } catch (error) {
    throw handleError(error);
  }
};

// Complete Google login (exchange code for tokens)
export const completeGoogleLogin = async (code: string) => {
  try {
    const { data } = await axios.get(`/auth/login/google/callback?code=${code}`);

    if (!data.mfa_required) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
    }

    return data;
  } catch (error) {
    throw handleError(error);
  }
};

// Error handling helper
const handleError = (error: any) => {
  if (error.response?.data?.error) {
    return new Error(error.response.data.error);
  }
  if (error.response?.data?.message) {
    return new Error(error.response.data.message);
  }
  return new Error('Network error. Please try again later.');
};






export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const { data } = await axios.post('/auth/refresh', {
      refresh_token: refreshToken,
    });

    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    }

    return data.access_token;
  } catch (error) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    throw error;
  }
};
/*
export const logout = async () => {
    try {
        await api.post('/auth/logout');
    } finally {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }
};*/









const API_URL = process.env.REACT_APP_API_URL;
const TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '5000');
const RETRIES = parseInt(process.env.REACT_APP_RETRY_ATTEMPTS || '3');

const authClient = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const checkAuthServerConnection = async (): Promise<boolean> => {
  try {
    const response = await authClient.get('/auth/health', {
      timeout: 3000 // Shorter timeout for health check
    });
    return response.status === 200;
  } catch (error) {
    console.error('Auth server connection check failed:', error);
    return false;
  }
};

export const initiateGoogleAuth = async (): Promise<string> => {
  try {
    const response = await authClient.get('/auth/login/google/url');
    return response.data.url;
  } catch (error) {
    throw new Error('Failed to initiate Google authentication');
  }
};






