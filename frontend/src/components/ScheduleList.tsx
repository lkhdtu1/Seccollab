import React from 'react';
import { Calendar, Clock, Users, Check, X } from 'lucide-react';
import ScheduleItem from './ScheduleItem';
import { cancelSchedule,deleteSchedule } from '../components/services/scheduleService'; // Adjust the import path as necessary
export interface Schedule {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  creator: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  participants: Array<{
    id: number;
    name: string;
    status: 'accepted' | 'declined' | 'pending' | 'cancelled';
    avatar_url?: string;
  }>;
  created_at?: string;
}

interface ScheduleListProps {
  schedules?: Schedule[];
  currentUserId: number;
  onRespond: (scheduleId: string, status: 'accepted' | 'declined') => Promise<void>;
  onScheduleCancelled?: () => void;
  onScheduleDeleted?: () => void;
}

const ScheduleList: React.FC<ScheduleListProps> = ({ 
  schedules = [], 
  currentUserId, 
  onRespond,
  onScheduleCancelled,
  onScheduleDeleted
}) => {
  const handleCancel = async (scheduleId: string) => {
    try {
      await cancelSchedule(scheduleId);
      onScheduleCancelled?.();
    } catch (error) {
      console.error('Failed to cancel schedule:', error);
      alert('Failed to cancel the meeting');
    }
  };




   const handleDelete = async (scheduleId: string) => {
    try {
      await deleteSchedule(scheduleId);
      onScheduleDeleted?.();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      alert('Failed to delete the schedule');
    }
  };




   return (
    <div className="space-y-4">
      {Array.isArray(schedules) && schedules.map((schedule) => {
        // Add null check and default values for required properties
        if (!schedule || !schedule.id) return null;

        const safeSchedule = {
          ...schedule,
          title: schedule.title || 'Untitled',
          description: schedule.description || '',
          startTime: schedule.startTime || new Date().toISOString(),
          endTime: schedule.endTime || new Date().toISOString(),
          creator: schedule.creator || { id: 0, name: 'Unknown' },
          participants: Array.isArray(schedule.participants) ? schedule.participants : []
        };

        return (
          <ScheduleItem
            key={safeSchedule.id}
            {...safeSchedule}
            participants={safeSchedule.participants}
            currentUserId={currentUserId}
            onRespond={onRespond}
            onCancel={handleCancel}
            onDelete={handleDelete}
          />
        );
        })}
      {(!Array.isArray(schedules) || schedules.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          No schedules found
        </div>
      )}
    </div>
  );
};

export default ScheduleList;