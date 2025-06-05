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
  const canDelete = isCreator || allCancelled;
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Pending className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>          <div className="flex items-center space-x-2">
            
            {/* Only show accept/decline buttons for non-creators who are participants with pending status */}
            {!isCreator && currentUserParticipant?.status === 'pending' && onRespond && (
              <div className="flex space-x-2">
                <button
                  onClick={() => onRespond(id, 'accepted')}
                  className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </button>
                <button
                  onClick={() => onRespond(id, 'declined')}
                  className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <time dateTime={startTime}>
              {new Date(startTime).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </time>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
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
        </div>

        <div className="mt-6">
          <div className="flex items-center space-x-2 mb-3">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Participants</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Creator */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              <div className="relative">
                {creator.avatar_url ? (
                  <img
                    src={creator.avatar_url}
                    alt={creator.name}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {creator.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1">
                  <div className="h-3 w-3 rounded-full bg-blue-500 border-2 border-white" />
                </div>
              </div>
              <span className="text-sm font-medium">{creator.name}</span>
              <span className="text-xs">(Creator)</span>
            </div>

            {/* Participants */}
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(
                  participant.status
                )}`}
              >
                <div className="relative">
                  {participant.avatar_url ? (
                    <img
                      src={participant.avatar_url}
                      alt={participant.name}
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium">{participant.name}</span>
                {getStatusIcon(participant.status)}

              </div>

            ))}
          </div>
          <br />
          {isCreator && !allCancelled && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this meeting?')) {
                  onCancel?.(id);
                }
              }}
              className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 transition-colors"
            >
              <Ban className="h-4 w-4 mr-1" />
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
              className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleItem;