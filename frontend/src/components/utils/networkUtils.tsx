import axios from 'axios';
import { API_BASE_URL } from '../config/config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000
});

export const initiateGoogleAuth = async (): Promise<void> => {
  try {
    // Changed route to match backend
    window.location.href = `${API_BASE_URL}/auth/login/google`;
  } catch (error) {
    throw new Error('Failed to initiate authentication');
  }
};