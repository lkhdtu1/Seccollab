import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Check, X, Users, AlertCircle, RefreshCw, Bell } from 'lucide-react';
import { listSchedules } from './services/scheduleService'; // Fixed import path
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
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSchedules = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await listSchedules();
      setSchedules(response || []); // Set schedules directly if response is Schedule[]
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      setError('Failed to load schedules');
      setSchedules([]); // Set empty array on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchSchedules(true);
  };

  const handleRespond = async (scheduleId: string, status: 'accepted' | 'declined') => {
    try {
      await onRespond(scheduleId, status);
      // Refresh schedules after responding
      fetchSchedules(true);
    } catch (error) {
      console.error('Failed to respond to schedule:', error);
    }
  };

  useEffect(() => {
    fetchSchedules();
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => fetchSchedules(true), 300000);
    return () => clearInterval(interval);
  }, []);

  // Filter schedules to show upcoming ones first and group by status
  const upcomingSchedules = schedules.filter(schedule => {
    const scheduleTime = new Date(schedule.startTime);
    const now = new Date();
    return scheduleTime > now;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const getParticipantStatus = (schedule: Schedule) => {
    const participant = schedule.participants?.find(p => p.id === currentUserId);
    return participant?.status || null;
  };

  const isCreator = (schedule: Schedule) => schedule.creator?.id === currentUserId;

  const getTimeUntilSchedule = (startTime: string) => {
    const now = new Date();
    const scheduleTime = new Date(startTime);
    const diffMs = scheduleTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes > 0 ? `in ${diffMinutes} min` : 'starting soon';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="h-3 w-3 mr-1" />
            Accepted
          </div>
        );
      case 'declined':
        return (
          <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="h-3 w-3 mr-1" />
            Declined
          </div>
        );
      case 'pending':
        return (
          <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-300 rounded-full border-t-indigo-600 mx-auto mb-2"></div>
        <p className="text-xs text-indigo-200">Loading schedules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-900/20 rounded-lg border border-red-700/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-red-300">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Error</span>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-red-800/30 rounded transition-colors"
            disabled={refreshing}
          >
            <RefreshCw className={`h-3 w-3 text-red-300 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center text-indigo-200">
          <Calendar className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Upcoming</span>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1 hover:bg-indigo-700/50 rounded transition-colors"
          disabled={refreshing}
          title="Refresh schedules"
        >
          <RefreshCw className={`h-3 w-3 text-indigo-300 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Schedule list */}
      {upcomingSchedules.length === 0 ? (
        <div className="text-center py-6">
          <Calendar className="h-8 w-8 text-indigo-400 mx-auto mb-2 opacity-50" />
          <p className="text-sm text-indigo-300">No upcoming schedules</p>
        </div>
      ) : (
        <div className="space-y-2">
          {upcomingSchedules.slice(0, 5).map((schedule) => {
            const participantStatus = getParticipantStatus(schedule);
            const creator = isCreator(schedule);
            const timeUntil = getTimeUntilSchedule(schedule.startTime);
            
            return (
              <div
                key={schedule.id}
                className="bg-indigo-800/30 backdrop-blur-sm rounded-lg p-3 border border-indigo-700/30 hover:bg-indigo-700/40 transition-all duration-200 group"
              >
                {/* Schedule header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-sm truncate group-hover:text-indigo-100 transition-colors">
                      {schedule.title}
                    </h4>
                    {creator && (
                      <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                        <Users className="h-3 w-3 mr-1" />
                        Creator
                      </div>
                    )}
                  </div>
                  {!creator && participantStatus && getStatusBadge(participantStatus)}
                </div>

                {/* Time info */}
                <div className="flex items-center text-xs text-indigo-200 mb-2">
                  <Clock className="h-3 w-3 mr-1.5" />
                  <span className="font-medium">
                    {new Date(schedule.startTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="mx-1">•</span>
                  <span className="text-indigo-300">{timeUntil}</span>
                </div>

                {/* Participants */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex -space-x-1">
                      {/* Creator avatar */}
                      {schedule.creator && (
                        <div className="h-5 w-5 rounded-full bg-blue-500 border-2 border-indigo-800 flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {schedule.creator.name?.charAt(0).toUpperCase() || 'C'}
                          </span>
                        </div>
                      )}
                      
                      {/* Participant avatars */}
                      {Array.isArray(schedule.participants) && schedule.participants.slice(0, 2).map((participant) => (
                        <div
                          key={participant.id}
                          className={`h-5 w-5 rounded-full border-2 border-indigo-800 flex items-center justify-center ${
                            participant.status === 'accepted' 
                              ? 'bg-green-500' 
                              : participant.status === 'declined'
                              ? 'bg-red-500'
                              : 'bg-gray-400'
                          }`}
                          title={`${participant.name} - ${participant.status}`}
                        >
                          <span className="text-xs font-medium text-white">
                            {participant.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      ))}
                      
                      {/* More participants indicator */}
                      {Array.isArray(schedule.participants) && schedule.participants.length > 2 && (
                        <div className="h-5 w-5 rounded-full bg-indigo-600 border-2 border-indigo-800 flex items-center justify-center">
                          <span className="text-xs text-indigo-200">
                            +{schedule.participants.length - 2}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <span className="ml-2 text-xs text-indigo-300">
                      {(schedule.participants?.length || 0) + 1} people
                    </span>
                  </div>

                  {/* Action buttons for non-creators with pending status */}
                  {!creator && participantStatus === 'pending' && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleRespond(schedule.id, 'accepted')}
                        className="p-1.5 hover:bg-green-600/20 rounded-md transition-colors group"
                        title="Accept invitation"
                      >
                        <Check className="h-3.5 w-3.5 text-green-400 group-hover:text-green-300" />
                      </button>
                      <button
                        onClick={() => handleRespond(schedule.id, 'declined')}
                        className="p-1.5 hover:bg-red-600/20 rounded-md transition-colors group"
                        title="Decline invitation"
                      >
                        <X className="h-3.5 w-3.5 text-red-400 group-hover:text-red-300" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Show more indicator */}
          {upcomingSchedules.length > 5 && (
            <div className="text-center py-2">
              <span className="text-xs text-indigo-300">
                +{upcomingSchedules.length - 5} more schedules
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleSidebar;