import React from 'react';
import { Clock, Download, Upload, Share2, MessageSquare } from 'lucide-react';

interface Activity {
  id: string;
  type: 'upload' | 'download' | 'share' | 'comment';
  fileName: string;
  userName: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'upload':
        return <Upload className="h-5 w-5" />;
      case 'download':
        return <Download className="h-5 w-5" />;
      case 'share':
        return <Share2 className="h-5 w-5" />;
      case 'comment':
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'upload':
        return `uploaded ${activity.fileName}`;
      case 'download':
        return `downloaded ${activity.fileName}`;
      case 'share':
        return `shared ${activity.fileName}`;
      case 'comment':
        return `commented on ${activity.fileName}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center">
        <Clock className="h-5 w-5 text-gray-400 mr-2" />
        <h2 className="text-lg font-medium text-gray-900">Recent Activities</h2>
      </div>
      <ul className="divide-y divide-gray-200">
        {activities.length === 0 ? (
          <li className="px-6 py-4 text-center text-gray-500">
            No recent activities
          </li>
        ) : (
          activities.map((activity) => (
            <li key={activity.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 text-gray-400">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.userName}</span>
                    {' '}
                    {getActivityText(activity)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default ActivityFeed;