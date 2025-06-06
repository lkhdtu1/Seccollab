import React, { useState, useEffect } from 'react';
import {
  Search, Users, Calendar, FileText, Settings, LogOut, ChevronDown, ChevronRight, BarChart,
  Mail, MessageCircle, Sparkles, User, Shield
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-indigo-950">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-gradient-to-b from-indigo-800 via-indigo-900 to-purple-900 text-white p-6 space-y-6 shadow-2xl backdrop-blur-sm border-r border-indigo-700/30">
        <div className="flex items-center space-x-4 mb-8">
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-indigo-300/50 shadow-lg">
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20"
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full ring-2 ring-white/20"></div>
          </div>
          <div className="text-center mt-2">
            <h3 className="text-lg font-semibold text-white leading-relaxed">{currentUser?.name}</h3>
            <p className="text-sm text-indigo-200/80 truncate max-w-[180px] font-medium">{currentUser?.email}</p>
          </div>
        </div>        <nav className="space-y-2">
          <button
            onClick={() => navigate('/hub')}
            className="flex items-center space-x-3 w-full px-4 py-3 text-base font-medium rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-200 group"
          >
            <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Files</span>
          </button>

          <button
            onClick={() => navigate('/users')}
            className="flex items-center space-x-3 w-full bg-white/20 backdrop-blur-sm px-4 py-3 text-base font-medium rounded-xl shadow-lg ring-1 ring-white/10"
          >
            <Users className="w-5 h-5" />
            <span>Users</span>
          </button>          <div className="px-2 py-2">
            <button
              onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 text-base font-medium text-white hover:bg-white/10 backdrop-blur-sm rounded-xl transition-all duration-200 group"
            >
              <span className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Schedules</span>
              </span>
              {isScheduleExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {isScheduleExpanded && (
              <div className="mt-3 pl-4">
                <ScheduleSidebar onRespond={handleScheduleResponse} currentUserId={authUser?.id || 0} />
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/stats')}
            className="flex items-center space-x-3 w-full px-4 py-3 text-base font-medium rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-200 group"
          >
            <BarChart className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Statistics</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="flex items-center space-x-3 w-full px-4 py-3 text-base font-medium rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-200 group"
          >
            <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Settings</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 text-base font-medium rounded-xl text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50">
            <div className="px-8 py-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-t-3xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Users
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    Connect and collaborate 
                  </p>
                </div>
              </div>
            </div>            <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="relative max-w-md mx-auto">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  className="block w-full pl-12 pr-4 py-4 border border-gray-200/60 dark:border-gray-600/60 rounded-2xl bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gradient-to-br from-gray-200/60 to-gray-300/60 dark:from-gray-700/60 dark:to-gray-600/60 h-80 rounded-3xl shadow-inner backdrop-blur-sm"></div>
                  </div>
                ))
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-gray-700/30 shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 overflow-hidden"
                  >
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 via-transparent to-purple-50/20 dark:from-indigo-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative p-8 flex flex-col items-center">
                      <div className="relative group/avatar">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.name}
                            className="w-24 h-24 rounded-2xl object-cover border-4 border-white/50 dark:border-gray-700/50 shadow-xl group-hover/avatar:scale-110 group-hover/avatar:shadow-2xl transition-all duration-300"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 dark:from-indigo-600 dark:to-indigo-800 flex items-center justify-center border-4 border-white/50 dark:border-gray-700/50 shadow-xl group-hover/avatar:scale-110 group-hover/avatar:shadow-2xl transition-all duration-300">
                            <span className="text-2xl font-bold text-white">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        {/* Status indicator with enhanced styling */}
                        <div className="absolute -bottom-1 -right-1 flex items-center justify-center">
                          <div
                            className={`h-6 w-6 rounded-full ring-4 ring-white/80 dark:ring-gray-800/80 shadow-lg flex items-center justify-center ${
                              user.is_active === 1
                                ? 'bg-gradient-to-r from-green-400 to-green-500'
                                : user.is_active === 0
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                                : 'bg-gradient-to-r from-gray-400 to-gray-500'
                            }`}
                          >
                            {user.is_active === 1 && (
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 text-center space-y-3 w-full">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                            {user.name}
                          </h3>
                            {/* Enhanced email styling with hover tooltip */}
                          <div className="relative group/email flex items-center justify-center space-x-2 px-3 py-2 bg-gray-50/60 dark:bg-gray-700/40 rounded-xl backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30 hover:bg-gray-100/80 dark:hover:bg-gray-600/60 transition-all duration-300 cursor-pointer">
                            <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate max-w-[160px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                              {user.email}
                            </p>
                            
                            {/* Tooltip for full email */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg shadow-lg opacity-0 group-hover/email:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap z-50">
                              {user.email}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                            </div>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              user.is_active === 1
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700/50'
                                : user.is_active === 0
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700/50'
                                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600/50'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                user.is_active === 1
                                  ? 'bg-green-500 animate-pulse'
                                  : user.is_active === 0
                                  ? 'bg-yellow-500'
                                  : 'bg-gray-400'
                              }`}
                            />
                            {user.is_active === 1 ? 'Online' : user.is_active === 0 ? 'Away' : 'Offline'}
                          </span>
                        </div>
                      </div>

                      {currentUser?.id !== user.id && (
                        <div className="mt-6 w-full">
                          <button
                            onClick={() =>
                              setActiveChat({
                                userId: user.id,
                                name: user.name,
                                avatar: user.avatar_url || undefined,
                              })
                            }
                            className="w-full inline-flex justify-center items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-sm font-semibold text-white rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all duration-300 group/button"
                          >
                            <MessageCircle className="w-4 h-4 mr-2 group-hover/button:animate-pulse" />
                            Start Chat
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
