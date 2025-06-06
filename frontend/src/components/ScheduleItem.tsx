import React from 'react';
import { Calendar, Clock, Users, Check, X, Clock as Pending, Ban, Trash2 } from 'lucide-react';

interface Participant {
  id: number;
  name: string;
  status: 'accepted' | 'declined' | 'pending' | 'cancelled';
  avatar_url?: string;
}

interface Creator {
  id: number;
  name: string;
  avatar_url?: string;
}

interface ScheduleItemProps {
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
  currentUserId: number;
  onRespond?: (scheduleId: string, status: 'accepted' | 'declined') => Promise<void>;
  onCancel?: (scheduleId: string) => Promise<void>;
  onDelete?: (scheduleId: string) => Promise<void>;
}

const ScheduleItem: React.FC<ScheduleItemProps> = ({
  id,
  title,
  description,
  startTime,
  endTime,
  creator,
  participants,
  currentUserId,
  onRespond,
    onCancel,
    onDelete
}) => {
    const isCreator = creator.id === currentUserId;
  const allCancelled = participants.every(p => p.status === 'cancelled');
  const canDelete = isCreator || allCancelled;  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Check className="h-3 w-3 text-green-500" />;
      case 'declined':
        return <X className="h-3 w-3 text-red-500" />;
      default:
        return <Pending className="h-3 w-3 text-yellow-500" />;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-50/80 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-700/50';
      case 'declined':
        return 'bg-red-50/80 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200/50 dark:border-red-700/50';
      default:
        return 'bg-yellow-50/80 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200/50 dark:border-yellow-700/50';
    }
  };


  const handleRespond = async (status: 'accepted' | 'declined') => {
    try {
      await onRespond?.(id, status);
      // Add toast notification here if you want
    } catch (error) {
      console.error('Failed to respond to schedule:', error);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this meeting?')) {
      return;
    }

     try {
      await onCancel?.(id);
      // Add toast notification here if you want
    } catch (error) {
      console.error('Failed to cancel schedule:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }
    
    try {
      await onDelete?.(id);
      // Add toast notification here if you want
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };






  const currentUserParticipant = participants.find(p => p.id === currentUserId);
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-md border border-white/20 dark:border-gray-700/50 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
          </div>
          <div className="flex items-center space-x-2">
            
            {/* Only show accept/decline buttons for non-creators who are participants with pending status */}
            {!isCreator && currentUserParticipant?.status === 'pending' && onRespond && (
              <div className="flex space-x-2">
                <button
                  onClick={() => onRespond(id, 'accepted')}
                  className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium text-green-700 dark:text-green-300 bg-green-50/80 dark:bg-green-900/30 hover:bg-green-100/80 dark:hover:bg-green-800/40 transition-all duration-200 backdrop-blur-sm border border-green-200/50 dark:border-green-700/50"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Accept
                </button>
                <button
                  onClick={() => onRespond(id, 'declined')}
                  className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium text-red-700 dark:text-red-300 bg-red-50/80 dark:bg-red-900/30 hover:bg-red-100/80 dark:hover:bg-red-800/40 transition-all duration-200 backdrop-blur-sm border border-red-200/50 dark:border-red-700/50"
                >
                  <X className="h-3 w-3 mr-1" />
                  Decline
                </button>
              </div>
            )}
          </div>
        </div>        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <Calendar className="h-3 w-3 mr-2 text-indigo-500" />
            <time dateTime={startTime}>
              {new Date(startTime).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </time>
          </div>
          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <Clock className="h-3 w-3 mr-2 text-indigo-500" />
            <span>
              {new Date(startTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
              {' - '}
              {new Date(endTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>        <div className="mt-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-3 w-3 text-indigo-500" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Participants</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {/* Creator */}
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded-xl bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm">
              <div className="relative">
                {creator.avatar_url ? (
                  <img
                    src={creator.avatar_url}
                    alt={creator.name}
                    className="h-4 w-4 rounded-full"
                  />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-300">
                      {creator.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5">
                  <div className="h-2 w-2 rounded-full bg-blue-500 border border-white dark:border-gray-800" />
                </div>
              </div>
              <span className="text-xs font-medium">{creator.name}</span>
              <span className="text-xs opacity-75">(Creator)</span>
            </div>

            {/* Participants */}
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`flex items-center space-x-1.5 px-2 py-1 rounded-xl border backdrop-blur-sm ${getStatusColor(
                  participant.status
                )}`}
              >
                <div className="relative">
                  {participant.avatar_url ? (
                    <img
                      src={participant.avatar_url}
                      alt={participant.name}
                      className="h-4 w-4 rounded-full"
                    />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">{participant.name}</span>
                {getStatusIcon(participant.status)}

              </div>

            ))}
          </div>          <div className="mt-3 flex flex-wrap gap-2">
            {isCreator && !allCancelled && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel this meeting?')) {
                    onCancel?.(id);
                  }
                }}
                className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-50/80 dark:bg-orange-900/30 hover:bg-orange-100/80 dark:hover:bg-orange-800/40 transition-all duration-200 backdrop-blur-sm border border-orange-200/50 dark:border-orange-700/50"
              >
                <Ban className="h-3 w-3 mr-1" />
                Cancel Meeting
              </button>
            )}
            
            {canDelete && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
                    onDelete?.(id);
                  }
                }}
                className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium text-red-700 dark:text-red-300 bg-red-50/80 dark:bg-red-900/30 hover:bg-red-100/80 dark:hover:bg-red-800/40 transition-all duration-200 backdrop-blur-sm border border-red-200/50 dark:border-red-700/50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleItem;