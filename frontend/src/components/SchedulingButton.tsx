import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import ScheduleDialog from './ScheduleDialog';
import ScheduleList from './ScheduleList';
import { API_BASE_URL } from './config/config';


interface User {
  id: number;
  name: string;
  email: string;
}

interface Schedule {
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

interface SchedulingButtonProps {
  currentUser: {
    id: number;
    name: string;
  };
  availableUsers: User[];
  schedules: Schedule[];
  onScheduleCreated: (schedule: any) => void;
  onScheduleRespond: (scheduleId: string, status: 'accepted' | 'declined') => Promise<void>;
}

// API service for schedules
const scheduleApi = {
  createSchedule: async (scheduleData: any): Promise<Schedule> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        throw new Error('Failed to create schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  },

  respondToSchedule: async (
    scheduleId: string,
    userId: number,
    status: 'accepted' | 'declined'
  ): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to respond to schedule');
      }
    } catch (error) {
      console.error('Error responding to schedule:', error);
      throw error;
    }
  },

  getSchedules: async (): Promise<Schedule[]> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/schedules`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }

      const data = await response.json();
      return data.schedules;
    } catch (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }
  }
};


const SchedulingButton: React.FC<SchedulingButtonProps> = ({
  currentUser,
  availableUsers,
  schedules,
  onScheduleCreated,
  onScheduleRespond
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSchedules, setShowSchedules] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localSchedules, setLocalSchedules] = useState<Schedule[]>(schedules);

  useEffect(() => {
    setLocalSchedules(schedules);
  }, [schedules]);

  const refreshSchedules = async () => {
    setLoading(true);
    try {
      const freshSchedules = await scheduleApi.getSchedules();
      setLocalSchedules(freshSchedules);
    } catch (error) {
      console.error('Failed to refresh schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (data: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    participants: number[];
    notifyVia: ('email' | 'in_app')[];
  }) => {
    try {
      const scheduleData = {
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        creatorId: currentUser.id,
        participants: data.participants,
        notificationMethods: data.notifyVia
      };
      
      const newSchedule = await scheduleApi.createSchedule(scheduleData);
      onScheduleCreated(newSchedule);
      await refreshSchedules();
      return Promise.resolve();
    } catch (error) {
      console.error('Error in handleSchedule:', error);
      return Promise.reject(error);
    }
  };

  const handleRespondToSchedule = async (scheduleId: string, status: 'accepted' | 'declined') => {
    try {
      await scheduleApi.respondToSchedule(scheduleId, currentUser.id, status);
      await onScheduleRespond(scheduleId, status);
      await refreshSchedules();
    } catch (error) {
      console.error('Error responding to schedule:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <button
          onClick={() => setIsDialogOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Calendar className="h-5 w-5 mr-2" />
          Schedule Meeting
        </button>
        
        <button
          onClick={() => setShowSchedules(!showSchedules)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {showSchedules ? 'Hide Schedules' : 'View Schedules'}
        </button>
        
        {showSchedules && (
          <button
            onClick={refreshSchedules}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      {showSchedules && (
        <ScheduleList
          schedules={localSchedules}
          currentUserId={currentUser.id}
          onRespond={handleRespondToSchedule}
        />
      )}

      {isDialogOpen && (
        <ScheduleDialog
          availableUsers={availableUsers}
          onSchedule={handleSchedule}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default SchedulingButton;