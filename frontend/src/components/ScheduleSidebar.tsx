import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Check, X } from 'lucide-react';
import { listSchedules } from '../components/services/scheduleService'; // Fix import path
import { Schedule } from './ScheduleList'; // Add proper type import

interface ScheduleSidebarProps {
  onRespond: (scheduleId: string, status: 'accepted' | 'declined') => Promise<void>;
  onCancel?: (scheduleId: string) => Promise<void>;
  onDelete?: (scheduleId: string) => Promise<void>;
  currentUserId: number; // Add currentUserId prop
}

const ScheduleSidebar: React.FC<ScheduleSidebarProps> = ({
  onRespond,
  onCancel,
  onDelete,
  currentUserId
}) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await listSchedules();
      setSchedules(response || []); // Set schedules directly if response is Schedule[]
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      setSchedules([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchSchedules, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2">
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent mx-auto"></div>
        </div>
      ) : (
        schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="p-2 hover:bg-indigo-500 rounded-md text-sm"
          >
            <div className="font-medium text-white-900 truncate">
              {schedule.title}
            </div>
            <div className="flex items-center text-xs text-red-500 mt-1">
              <Clock className="h-3 w-3 mr-1" />
              {new Date(schedule.startTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex -space-x-1">
                {Array.isArray(schedule.participants) && schedule.participants.slice(0, 3).map((participant) => (
                  <div
                    key={participant.id}
                    className="h-5 w-5 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center"
                  >
                    <span className="text-xs font-medium">
                      {participant.name?.charAt(0) || '?'}
                    </span>
                  </div>
                ))}
                {Array.isArray(schedule.participants) && schedule.participants.length > 3 && (
                  <div className="h-5 w-5 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-gray-600">
                      +{schedule.participants.length - 3}
                    </span>
                  </div>
                )}
              </div>
              {schedule.creator?.id !== currentUserId && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => onRespond(schedule.id, 'accepted')}
                    className="p-1 hover:bg-green-100 rounded"
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </button>
                  <button
                    onClick={() => onRespond(schedule.id, 'declined')}
                    className="p-1 hover:bg-red-100 rounded"
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ScheduleSidebar;