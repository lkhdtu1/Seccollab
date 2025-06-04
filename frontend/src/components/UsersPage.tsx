import React, { useState, useEffect } from 'react';
import {
  Search, Users, Calendar, FileText, Settings, LogOut, ChevronDown, ChevronRight, BarChart,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import { API_BASE_URL } from './config/config';
import { useNavigate } from 'react-router-dom';
import ScheduleSidebar from './ScheduleSidebar';
import ChatDialog from './chat/ChatDialog';

interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  is_active: number;
}

const UsersPage: React.FC = () => {
  const [activeChat, setActiveChat] = useState<{
    userId: number;
    name: string;
    avatar?: string;
  } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { user: currentUser, setUser } = useAuth();
  const navigate = useNavigate();
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(true);
  const { user: authUser } = useAuth();

  const handleScheduleResponse = async (scheduleId: string, status: 'accepted' | 'declined') => {
    try {
      console.log(`Responding to schedule ${scheduleId} with status ${status}`);
    } catch (error) {
      console.error('Failed to respond to schedule:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
      localStorage.clear();
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/users`);
        const usersData = Array.isArray(response.data) ? response.data : response.data.users || [];
        const formattedUsers = usersData.map((user: any) => ({
          ...user,
          avatar_url: user.avatar_url || null,
        }));
        setUsers(formattedUsers);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-gradient-to-b from-indigo-800 to-indigo-900 text-white p-6 space-y-6 shadow-2xl">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center ring-2 ring-indigo-300 shadow-md">
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="text-center mt-2">
            <h3 className="text-lg font-semibold text-white leading-relaxed">{currentUser?.name}</h3>
            <p className="text-sm text-indigo-200 truncate max-w-[180px]">{currentUser?.email}</p>
          </div>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => navigate('/hub')}
            className="flex items-center space-x-3 w-full px-4 py-2.5 text-base font-medium rounded-lg hover:bg-indigo-700 transition-all duration-200"
          >
            <FileText className="w-5 h-5" />
            <span>Files</span>
          </button>

          <button
            onClick={() => navigate('/users')}
            className="flex items-center space-x-3 w-full bg-indigo-700 px-4 py-2.5 text-base font-medium rounded-lg shadow-sm"
          >
            <Users className="w-5 h-5" />
            <span>Users</span>
          </button>

          <div className="px-2 py-2">
            <button
              onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-base font-medium text-white hover:bg-indigo-700 rounded-lg transition-all duration-200"
            >
              <span className="flex items-center space-x-3">
                <Calendar className="w-5 h-5" />
                <span>Schedules</span>
              </span>
              {isScheduleExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {isScheduleExpanded && (
              <div className="mt-3 pl-4">
                <ScheduleSidebar onRespond={handleScheduleResponse} currentUserId={authUser?.id || 0} />
              </div>
            )}
          </div>          <button
            onClick={() => navigate('/stats')}
            className="flex items-center space-x-3 w-full px-4 py-2.5 text-base font-medium rounded-lg hover:bg-indigo-700 transition-all duration-200"
          >
            <BarChart className="w-5 h-5" />
            <span>Statistics</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="flex items-center space-x-3 w-full px-4 py-2.5 text-base font-medium rounded-lg hover:bg-indigo-700 transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-2.5 text-base font-medium rounded-lg text-red-300 hover:bg-red-600/20 hover:text-red-200 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Users</h2>
            </div>

            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  className="block w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 h-72 rounded-2xl shadow-inner"></div>
                  </div>
                ))
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-transform duration-300"
                  >
                    <div className="p-6 flex flex-col items-center">
                      <div className="relative group">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.name}
                            className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-900 group-hover:ring-4 group-hover:ring-indigo-400/30 transition-all duration-300"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-indigo-200 dark:bg-indigo-900 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-inner group-hover:ring-4 group-hover:ring-indigo-400/30 transition-all duration-300">
                            <span className="text-2xl font-semibold text-indigo-700 dark:text-indigo-200">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 h-4 w-4 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-md ${
                            user.is_active === 1
                              ? 'bg-green-500'
                              : user.is_active === 0
                              ? 'bg-yellow-400'
                              : 'bg-gray-400'
                          }`}
                        />
                      </div>

                      <div className="mt-4 text-center">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate">
                          {user.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>

                      {currentUser?.id !== user.id && (
                        <div className="mt-4 w-full">
                          <button
                            onClick={() =>
                              setActiveChat({
                                userId: user.id,
                                name: user.name,
                                avatar: user.avatar_url || undefined,
                              })
                            }
                            className="w-full inline-flex justify-center items-center px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-sm font-medium text-indigo-700 dark:text-indigo-200 rounded-xl shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                          >
                            Message
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {activeChat && (
          <ChatDialog
            receiverId={activeChat.userId}
            receiverName={activeChat.name}
            receiverAvatar={activeChat.avatar}
            onClose={() => setActiveChat(null)}
          />
        )}
      </main>
    </div>
  );
};

export default UsersPage;
