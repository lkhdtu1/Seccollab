import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Upload, 
  FileText, 
  Trash2, 
  LogOut, 
  Settings, 
  Shield, 
  Share2, 
  Download, 
  MessageSquare, 
  Users, 
  Calendar, 
  Home, 
  PlusCircle, 
  BarChart,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard as DashboardIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { logout, disableMfa } from '../components/services/authService';
import FileShareDialog from './FileShareDialog';
import ActivityFeed from './ActivityFeed';
import FileChat from './FileChat';
import SchedulingButton from './SchedulingButton';
import ScheduleDialog from './ScheduleDialog';
import ScheduleList from './ScheduleList';
import { 
    uploadFile, 
    listFiles, 
    deleteFile, 
    shareFile,
    removeShare,
    updateSharePermission, 
    downloadFile,
    getFileActivities,
    getFileMessages,
    sendFileMessage,
    updateProfile
} from '../components/services/fileService';
import UserManagement from './UserManagement';
import ProfileSettings from './ProfileSettings';
import { access } from 'fs';
import { User } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export interface File {
  id: number;
  name: string;
  size: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
  owner: User;
  shared_with: Array<{
    user: User;
    permission: 'read' | 'write';
  }>;
}

export interface Schedule {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  creator: {
    id: number;
    name: string;
  };
  participants: {
    id: number;
    name: string;
    status: 'pending' | 'accepted' | 'declined';
  }[];
}

export interface Activity {
  id: string;
  type: 'upload' | 'download' | 'share' | 'comment';
  fileName: string;
  userName: string;
  timestamp: string;
}

export interface Message {
  id: string;
  userId: number;
  userName: string;
  content: string;
  timestamp: string;
}

interface HubProps {
  user: User;
  setUser: (user: User | null) => void;
  initialUsers?: User[];
  initialSchedules?: Schedule[];
}

const apiService = {
  getUsers: async (): Promise<User[]> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch('/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      return data.users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  
  getSchedules: async (): Promise<Schedule[]> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch('/api/schedules', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch schedules');
      }
      
      const data = await response.json();
      return data.schedules;
    } catch (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }
  },
  
  createSchedule: async (scheduleData: any): Promise<Schedule> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create schedule');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  },
  
  respondToSchedule: async (scheduleId: string, userId: number, status: 'accepted' | 'declined'): Promise<void> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch(`/api/schedules/${scheduleId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to respond to schedule');
      }
    } catch (error) {
      console.error('Error responding to schedule:', error);
      throw error;
    }
  }
}

const Hub: React.FC<HubProps> = ({ user, setUser, initialUsers = [], initialSchedules = [] }) => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [files, setFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaPassword, setMfaPassword] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>(initialUsers);
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
    
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [usersData, schedulesData] = await Promise.all([
          apiService.getUsers(),
          apiService.getSchedules()
        ]);
        
        setAvailableUsers(usersData);
        setSchedules(schedulesData);
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (initialUsers.length === 0 || initialSchedules.length === 0) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [initialUsers.length, initialSchedules.length]);

  const handleSchedule = async (data: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    participants: number[];
    notifyVia: ('email' | 'in_app')[];
  }) => {
    try {
      const newSchedule = await apiService.createSchedule(data);
      setSchedules(prevSchedules => [...prevSchedules, newSchedule]);
      setShowScheduleDialog(false);
      return Promise.resolve();
    } catch (err) {
      console.error('Error creating schedule:', err);
      return Promise.reject(err);
    }
  };

  const handleScheduleCreated = async (newSchedule: Schedule) => {
    try {
      setSchedules(prevSchedules => [...prevSchedules, newSchedule]);
    } catch (err) {
      console.error('Error handling new schedule:', err);
    }
  };

  const handleScheduleRespond = async (scheduleId: string, status: 'accepted' | 'declined') => {
    try {
      await apiService.respondToSchedule(scheduleId, user.id, status);
      setSchedules(prev =>
        prev.map(s =>
          s.id === scheduleId
            ? {
                ...s,
                participants: s.participants.map(p =>
                  p.id === user.id ? { ...p, status } : p
                )
              }
            : s
        )
      );
    } catch (err) {
      console.error(`Error responding to schedule ${scheduleId}:`, err);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchActivities();
  }, []);

  useEffect(() => {
    if (selectedFile && showChat) {
      fetchMessages(selectedFile.id);
    }
  }, [selectedFile, showChat]);

  const fetchFiles = async () => {
    try {
      const fetchedFiles = await listFiles();
      setFiles(fetchedFiles);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const fetchedActivities = await getFileActivities();
      setActivities(fetchedActivities);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  const fetchMessages = async (fileId: number) => {
    try {
      const fetchedMessages = await getFileMessages(fileId);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setFiles(prev => [...prev, data.file]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleDownload = async (file: File) => {
    try {
      await downloadFile(file.id);
      fetchActivities();
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedFile) return;
    
    try {
      const newMessage = await sendFileMessage(selectedFile.id, content);
      setMessages(prev => [...prev, newMessage]);
      fetchActivities();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleUpdatePermission = async (userId: number, permission: 'read' | 'write') => {
    if (!selectedFile) return;
    
    try {
      await updateSharePermission(selectedFile.id, userId, permission);
      await fetchFiles();
    } catch (error) {
      console.error('Failed to update permission:', error);
    }
  };

  const handleRemoveShare = async (userId: number) => {
    if (!selectedFile) return;
    
    try {
      await removeShare(selectedFile.id, userId);
      await fetchFiles();
    } catch (error) {
      console.error('Failed to remove share:', error);
    }
  };

  const handleUpdateProfile = async (formData: FormData) => {
    try {
      await updateProfile(formData);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleDisableMfa = async () => {
    try {
      await disableMfa(mfaPassword);
      setShowMfaModal(false);
      setMfaPassword('');
      window.location.reload();
    } catch (error: any) {
      setMfaError(error.message || 'Failed to disable MFA');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleShare = async (email: string, permission: 'read' | 'write') => {
    if (!selectedFile) return;
    
    try {
      await shareFile(selectedFile.id, email, permission);
      await fetchFiles();
      setShareDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to share file:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = useMemo(() => {
    return files.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navbar (Header) */}
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-white">SecCollab - Share Securely</h1>
          <div className="flex items-center gap-3">
            {user.mfa_enabled ? (
              <button
                onClick={() => setShowMfaModal(true)}
                className="flex items-center px-4 py-2 rounded-lg bg-green-100 text-green-700 text-sm font-medium hover:bg-green-200 transition-colors"
              >
                <Shield className="w-4 h-4 mr-2" />
                MFA Enabled
              </button>
            ) : (
              <button
                onClick={() => navigate('/account/mfa-setup')}
                className="flex items-center px-4 py-2 rounded-lg bg-yellow-100 text-yellow-700 text-sm font-medium hover:bg-yellow-200 transition-colors"
              >
                <Shield className="w-4 h-4 mr-2" />
                Enable MFA
              </button>
            )}
            <button
              onClick={() => setShowProfileSettings(true)}
              className="flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Toggle */}
      <button
        className="lg:hidden fixed top-20 left-4 z-40 p-2 bg-indigo-700 text-white rounded-full shadow-md hover:bg-indigo-800 transition-colors"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <ChevronRight className={`w-6 h-6 transform ${sidebarOpen ? 'rotate-180' : ''} transition-transform`} />
      </button>

      <div className="flex min-h-screen pt-16">        {/* Sidebar */}
        <aside className={`fixed top-16 bottom-0 left-0 w-64 bg-indigo-900 dark:bg-gray-900 text-white p-6 space-y-6 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:transform-none lg:static transition-transform duration-300 ease-in-out z-30 shadow-2xl`}>
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-extrabold tracking-tight">SecCollab</div>
          </div><nav className="space-y-1">
            {[
              { name: 'Home', icon: Home, path: '/hub' },
              { name: 'Users', icon: Users, path: '/users' },
              { name: 'Dashboard', icon: DashboardIcon, path: '/dashboard' },
              { name: 'Statistics', icon: BarChart, path: '/stats' },
              { name: 'Settings', icon: Settings, path: '/settings' },
              { name: 'Schedules', icon: Calendar, path: '/schedules' },
              { name: 'Schedule Meeting', icon: PlusCircle, action: () => setShowScheduleDialog(true) },
            ].map(item => (              <button
                key={item.name}
                onClick={item.path ? () => navigate(item.path) : item.action}
                className="flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg hover:bg-indigo-800 dark:hover:bg-gray-700 transition-colors"
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            ))}
          </nav>
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-indigo-300 uppercase tracking-wide mb-3">Your Schedules</h3>
            <ScheduleList
              schedules={schedules}
              currentUserId={user.id}
              onRespond={handleScheduleRespond}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:ml-60">
          {/* Welcome Section */}
          <div className="mb-8 flex items-center space-x-4">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-300 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-indigo-300 shadow-sm">
                <span className="text-xl font-medium text-white">{user.name.charAt(0).toUpperCase()}</span>
              </div>
            )}            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white leading-relaxed">Welcome, {user.name}</h2>
          </div>

          {/* File Section */}
          <div className="space-y-8">
            {/* Upload Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed">Upload Files</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center px-6 py-3 bg-indigo-600 text-white text-lg font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>            {/* File List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
              <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed">Your Files</h3>
                {/* Search Bar */}
                <div className="mt-4 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                  />
                </div>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {files.length === 0 ? (
                  <li className="px-8 py-10 text-center text-gray-500 dark:text-gray-400 text-lg">No files uploaded yet</li>
                ) : (
                  filteredFiles.map(file => (
                    <li
                      key={file.id}
                      className="px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >                      <div className="flex items-center gap-4">
                        <FileText className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                        <div>
                          <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed">{file.name}</p>
                          <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                            {formatFileSize(file.size)} • Uploaded {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => { setSelectedFile(file); setShowChat(true); }}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all"
                        >
                          <MessageSquare className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all"
                        >
                          <Download className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => { setSelectedFile(file); setShareDialogOpen(true); }}
                          className="p-2 text-indigo-600 hover:text-indigo-900 transition-all"
                        >
                          <Share2 className="w-6 h-6" />
                        </button>
                        {file.owner?.id === user.id && (
                          <button
                            onClick={() => { setSelectedFile(file); setShowUserManagement(true); }}
                            className="p-2 text-indigo-600 hover:text-indigo-900 transition-all"
                          >
                            <Users className="w-6 h-6" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-2 text-red-600 hover:text-red-900 transition-all"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>            {/* Recent Activity Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 leading-relaxed">Recent Activity</h3>
              <ActivityFeed activities={activities} />
            </div>

            {/* File Chat (if active) */}
            {selectedFile && showChat && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 leading-relaxed">File Chat</h3>
                <FileChat
                  fileId={selectedFile.id}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                />
              </div>
            )}
          </div>

          {/* Schedule Dialog */}
          {showScheduleDialog && (
            <ScheduleDialog
              availableUsers={availableUsers}
              onSchedule={handleSchedule}
              onClose={() => setShowScheduleDialog(false)}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {showMfaModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 leading-relaxed">Disable Two-Factor Authentication</h3>
            <p className="text-base text-gray-600 mb-4 leading-relaxed">Please enter your password to disable two-factor authentication.</p>
            {mfaError && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{mfaError}</div>
            )}
            <input
              type="password"
              value={mfaPassword}
              onChange={e => setMfaPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMfaModal(false);
                  setMfaPassword('');
                  setMfaError('');
                }}
                className="px-4 py-2 text-base font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableMfa}
                className="px-4 py-2 text-base font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all"
              >
                Disable MFA
              </button>
            </div>
          </div>
        </div>
      )}

      {shareDialogOpen && selectedFile && (
        <FileShareDialog
          fileId={selectedFile.id}
          fileName={selectedFile.name}
          onShare={handleShare}
          onClose={() => {
            setShareDialogOpen(false);
            setSelectedFile(null);
          }}
        />
      )}

      {showUserManagement && selectedFile && (
        <UserManagement
          fileId={selectedFile.id}
          fileName={selectedFile.name}
          sharedUsers={
            Array.isArray(selectedFile.shared_with)
              ? selectedFile.shared_with
                  .filter(share => share?.user)
                  .map(share => ({
                    ...share.user,
                    permission: share.permission,
                    online: Math.random() < 0.5,
                  }))
              : []
          }
          onUpdatePermission={handleUpdatePermission}
          onRemoveShare={handleRemoveShare}
          onClose={() => {
            setShowUserManagement(false);
            setSelectedFile(null);
          }}
        />
      )}

      {showProfileSettings && (
        <ProfileSettings
          user={user}
          onUpdateProfile={handleUpdateProfile}
          onClose={() => setShowProfileSettings(false)}
        />
      )}
    </div>
  );
};

export default Hub;