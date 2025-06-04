import React, { useState } from 'react';
import { Moon, Sun, Bell, User, Shield, Volume2, Mail } from 'lucide-react';
import { useTheme } from '../contexts/darkmode';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from './config/config';

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sound: boolean;
}

const SettingsPage: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: true,
    push: true,
    sound: true,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const updateProfile = async (formData: FormData) => {
    setIsUpdating(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/auth/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setUser(response.data);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Settings
            </h3>
          </div>

          <div className="flex">
            <div className="w-64 border-r border-gray-200 dark:border-gray-700">
              <nav className="px-3 py-4">
                {['general', 'profile', 'notifications', 'security'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full px-4 py-2 text-left rounded-md mb-1 ${
                      activeTab === tab 
                        ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-100' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 px-6 py-4">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Appearance
                    </h4>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {darkMode ? 
                          <Moon className="w-5 h-5 text-gray-900 dark:text-white" /> : 
                          <Sun className="w-5 h-5 text-gray-900 dark:text-white" />
                        }
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {darkMode ? 'Dark Mode' : 'Light Mode'}
                        </span>
                      </div>
                      <button
                        onClick={toggleDarkMode}
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 bg-gray-200 dark:bg-indigo-600"
                      >
                        <span 
                          className={`
                            pointer-events-none inline-block h-5 w-5 transform rounded-full 
                            bg-white shadow ring-0 transition duration-200 ease-in-out
                            ${darkMode ? 'translate-x-5' : 'translate-x-0'}
                          `}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Notification Preferences
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(notificationSettings).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {key === 'email' && <Mail className="w-5 h-5 text-gray-900 dark:text-white" />}
                          {key === 'push' && <Bell className="w-5 h-5 text-gray-900 dark:text-white" />}
                          {key === 'sound' && <Volume2 className="w-5 h-5 text-gray-900 dark:text-white" />}
                          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {key} Notifications
                          </span>
                        </div>
                        <button
                          onClick={() => handleNotificationChange(key as keyof NotificationSettings)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${value ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Profile Settings
                  </h4>
                  {/* Add profile settings content here */}
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Security Settings
                  </h4>
                  {/* Add security settings content here */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;