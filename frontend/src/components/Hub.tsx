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
  Search,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
  }, [files, searchQuery]);  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-indigo-50/30 to-purple-50/50 dark:from-gray-900/90 dark:via-gray-800/90 dark:to-slate-900/90 backdrop-blur-3xl">
      {/* Modern Navbar (Header) */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-white/20 dark:border-gray-700/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SecCollab
            </h1>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Share Securely</span>
          </div>
          <div className="flex items-center gap-3">            {user.mfa_enabled ? (
              <button
                onClick={() => setShowMfaModal(true)}
                className="flex items-center px-4 py-2 rounded-2xl bg-green-50/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium hover:bg-green-100/80 dark:hover:bg-green-800/40 transition-all duration-200 backdrop-blur-sm border border-green-200/50 dark:border-green-700/50"
              >
                <Shield className="w-4 h-4 mr-2" />
                MFA Enabled
              </button>
            ) : (
              <button
                onClick={() => navigate('/account/mfa-setup')}
                className="flex items-center px-4 py-2 rounded-2xl bg-yellow-50/80 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm font-medium hover:bg-yellow-100/80 dark:hover:bg-yellow-800/40 transition-all duration-200 backdrop-blur-sm border border-yellow-200/50 dark:border-yellow-700/50"
              >
                <Shield className="w-4 h-4 mr-2" />
                Enable MFA
              </button>
            )}
            <button
              onClick={() => setShowProfileSettings(true)}
              className="flex items-center px-4 py-2 rounded-2xl bg-gray-50/80 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100/80 dark:hover:bg-gray-600/80 transition-all duration-200 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50"
            >
              <Settings className="w-4 h-4 mr-2" />
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 rounded-2xl bg-red-50/80 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium hover:bg-red-100/80 dark:hover:bg-red-800/40 transition-all duration-200 backdrop-blur-sm border border-red-200/50 dark:border-red-700/50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>      {/* Mobile Sidebar Toggle */}
      <button
        className="lg:hidden fixed top-20 left-4 z-40 p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 backdrop-blur-sm"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <ChevronRight className={`w-5 h-5 transform ${sidebarOpen ? 'rotate-180' : ''} transition-transform duration-300`} />
      </button>

      <div className="flex min-h-screen pt-16">        {/* Modern Sidebar */}
        <aside className={`fixed top-16 bottom-0 left-0 w-64 bg-gradient-to-b from-indigo-900/95 to-purple-900/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-xl text-white p-6 space-y-6 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:transform-none lg:static transition-transform duration-300 ease-in-out z-30 shadow-2xl border-r border-white/10 dark:border-gray-700/50`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              SecCollab
            </div>
          </div>          <nav className="space-y-2">
            {[
              { name: 'Home', icon: Home, path: '/hub' },
              { name: 'Users', icon: Users, path: '/users' },
              { name: 'Statistics', icon: BarChart, path: '/stats' },
              { name: 'Settings', icon: Settings, path: '/settings' },
              { name: 'Schedule Meeting', icon: PlusCircle, action: () => setShowScheduleDialog(true) },
            ].map(item => (              <button
                key={item.name}
                onClick={item.path ? () => navigate(item.path) : item.action}
                className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-2xl hover:bg-white/10 dark:hover:bg-gray-700/50 transition-all duration-200 group backdrop-blur-sm border border-transparent hover:border-white/20"
              >
                <item.icon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                <span className="group-hover:translate-x-1 transition-transform duration-200">{item.name}</span>
              </button>
            ))}
          </nav>
          <div className="mt-8 pt-6 border-t border-white/20 dark:border-gray-700/50">
            <h3 className="text-xs font-semibold text-white/70 dark:text-gray-300 uppercase tracking-wide mb-4 flex items-center">
              <Calendar className="w-3 h-3 mr-2" />
              Your Schedules
            </h3>
            <div className="max-h-80 overflow-y-auto">
              <ScheduleList
                schedules={schedules}
                currentUserId={user.id}
                onRespond={handleScheduleRespond}
              />
            </div>
          </div>
        </aside>        {/* Main Content */}
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:ml-60">
          {/* Welcome Section */}
          <div className="mb-8 p-6 bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center space-x-4">
              {user.avatar_url ? (
                <div className="relative">
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-3 ring-indigo-500/30 shadow-lg"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900"></div>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-3 ring-indigo-500/30 shadow-lg">
                    <span className="text-2xl font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900"></div>
                </div>
              )}            
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Welcome back, {user.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Ready to collaborate securely?</p>
              </div>
            </div>
          </div>          {/* File Section */}
          <div className="space-y-8">
            {/* Upload Section */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-white/20 dark:border-gray-700/50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Upload Files
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Share your files securely</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-2xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm border border-white/20"
                >
                  <Upload className="w-5 h-5 mr-3" />
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
              {isUploading && (
                <div className="w-full bg-gradient-to-r from-gray-200/50 to-gray-300/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-full h-4 overflow-hidden backdrop-blur-sm">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-500 ease-out shadow-lg"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>            {/* File List */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700/50">
              <div className="px-8 py-6 border-b border-white/20 dark:border-gray-700/50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Your Files</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage and share your documents</p>
                  </div>
                </div>
                {/* Search Bar */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-indigo-400 dark:text-indigo-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>              <ul className="divide-y divide-white/10 dark:divide-gray-700/50">
                {files.length === 0 ? (
                  <li className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-3xl flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No files uploaded yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">Upload your first file to get started with secure collaboration</p>
                      </div>
                    </div>
                  </li>
                ) : (
                  filteredFiles.map(file => (
                    <li
                      key={file.id}
                      className="px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all duration-200 backdrop-blur-sm rounded-2xl mx-4 my-2 border border-transparent hover:border-white/30 dark:hover:border-gray-600/30 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">{file.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            {formatFileSize(file.size)} • Uploaded {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setSelectedFile(file); setShowChat(true); }}
                          className="p-3 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-indigo-200/50 dark:hover:border-indigo-700/50"
                          title="Chat about this file"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-3 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-2xl transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-green-200/50 dark:hover:border-green-700/50"
                          title="Download file"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => { setSelectedFile(file); setShareDialogOpen(true); }}
                          className="p-3 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-2xl transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-blue-200/50 dark:hover:border-blue-700/50"
                          title="Share file"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                        {file.owner?.id === user.id && (
                          <button
                            onClick={() => { setSelectedFile(file); setShowUserManagement(true); }}
                            className="p-3 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-2xl transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-purple-200/50 dark:hover:border-purple-700/50"
                            title="Manage users"
                          >
                            <Users className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-3 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-red-200/50 dark:hover:border-red-700/50"
                          title="Delete file"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>            {/* Recent Activity Section */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-white/20 dark:border-gray-700/50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Recent Activity</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Stay updated with file interactions</p>
                </div>
              </div>
              <ActivityFeed activities={activities} />
            </div>            {/* File Chat (if active) */}
            {selectedFile && showChat && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">File Chat</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Discuss {selectedFile.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
                  >
                    ×
                  </button>
                </div>
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
      </div>      {/* Modals */}
      {showMfaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 max-w-md w-full p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">Disable Two-Factor Authentication</h3>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">Please enter your password to disable two-factor authentication.</p>
            {mfaError && (
              <div className="p-4 mb-6 text-sm text-red-700 dark:text-red-300 bg-red-50/80 dark:bg-red-900/30 rounded-2xl border border-red-200/50 dark:border-red-700/50 backdrop-blur-sm">
                {mfaError}
              </div>
            )}
            <input
              type="password"
              value={mfaPassword}
              onChange={e => setMfaPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-4 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200 shadow-sm"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMfaModal(false);
                  setMfaPassword('');
                  setMfaError('');
                }}
                className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-700/60 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 rounded-2xl transition-all duration-200 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableMfa}
                className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm border border-white/20"
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