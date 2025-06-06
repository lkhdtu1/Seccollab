import React from 'react';
import { Calendar, CalendarDays, Sparkles } from 'lucide-react';
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
    <div className="space-y-4 p-4 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30">{/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <CalendarDays className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Scheduled Meetings
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {Array.isArray(schedules) ? schedules.length : 0} meeting{schedules?.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Live Updates</span>
        </div>
      </div>      {/* Schedule Items */}
      <div className="space-y-3">
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
            <div key={safeSchedule.id} className="transform transition-all duration-200 hover:scale-[1.01] hover:shadow-md">
              <ScheduleItem
                {...safeSchedule}
                participants={safeSchedule.participants}
                currentUserId={currentUserId}
                onRespond={onRespond}
                onCancel={handleCancel}
                onDelete={handleDelete}
              />
            </div>
          );
        })}
          {(!Array.isArray(schedules) || schedules.length === 0) && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
              <Calendar className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-600 dark:text-gray-300 mb-2">No meetings scheduled</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
              When meetings are scheduled, they'll appear here with all the details and participant information.
            </p>
            <div className="mt-4 flex justify-center">
              <div className="flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                <span>Ready for new schedules</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleList;