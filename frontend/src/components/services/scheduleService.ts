import axios from 'axios';
import { API_BASE_URL } from '../config/config';

export interface Schedule {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  creator: {
    id: number;
    name: string;
  };
  participants: {
    id: number;
    name: string;
    status: 'pending' | 'accepted' | 'declined';
  }[];
}

export const createSchedule = async (data: {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  participants: number[];
  notifyVia: ('email' | 'in_app')[];
}) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/schedules`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to create schedule');
  }
};

export const listSchedules = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/schedules`);
    return response.data.schedules as Schedule[];
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch schedules');
  }
};

export const respondToSchedule = async (
  scheduleId: string,
  status: 'accepted' | 'declined'
) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/schedules/${scheduleId}/respond`, {
      status
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to respond to schedule');
  }
};

export const deleteSchedule = async (scheduleId: string): Promise<void> => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(`/api/schedules/${scheduleId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete schedule');
  }
};




export const cancelSchedule = async (scheduleId: string): Promise<void> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await fetch(`/api/schedules/${scheduleId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel schedule');
    }
  } catch (error) {
    console.error('Error cancelling schedule:', error);
    throw error;
  }
};