import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  BarChart as ChartIcon, 
  Upload, 
  Download, 
  Share2, 
  LogIn, 
  TrendingUp, 
  Activity, 
  RefreshCw,
  Calendar,
  Users,
  FileText,
  Eye,
  Clock
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from './config/config';
import { useAuth } from '../contexts/AuthContext';

interface UserStats {
  total_stats: {
    uploads: number;
    downloads: number;
    shares: number;
    daily_logins: number;
  };
  daily_activities: {
    [date: string]: {
      uploads: number;
      downloads: number;
      shares: number;
    };
  };
}

const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'7days' | '30days' | 'all'>('7days');
  const { user: currentUser } = useAuth();

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/stats/user/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setError('Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchStats(true);
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => fetchStats(true), 300000);
    return () => clearInterval(interval);
  }, []);

  // Calculate additional metrics
  const getTotalActivity = () => {
    if (!stats) return 0;
    return stats.total_stats.uploads + stats.total_stats.downloads + stats.total_stats.shares;
  };

  const getMostActiveDay = () => {
    if (!stats || !stats.daily_activities) return null;
    
    let maxActivity = 0;
    let maxDay = null;
    
    Object.entries(stats.daily_activities).forEach(([date, activity]) => {
      const total = activity.uploads + activity.downloads + activity.shares;
      if (total > maxActivity) {
        maxActivity = total;
        maxDay = date;
      }
    });
    
    return maxDay ? { date: maxDay, activity: maxActivity } : null;
  };

  const getActivityTrend = () => {
    if (!stats || !stats.daily_activities) return { trend: 'stable', percentage: 0 };
    
    const entries = Object.entries(stats.daily_activities).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length < 2) return { trend: 'stable', percentage: 0 };
    
    const recent = entries.slice(-3);
    const older = entries.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, [_, activity]) => 
      sum + activity.uploads + activity.downloads + activity.shares, 0) / recent.length;
    const olderAvg = older.reduce((sum, [_, activity]) => 
      sum + activity.uploads + activity.downloads + activity.shares, 0) / older.length;
    
    if (olderAvg === 0) return { trend: 'stable', percentage: 0 };
    
    const percentage = ((recentAvg - olderAvg) / olderAvg) * 100;
    const trend = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable';
    
    return { trend, percentage: Math.abs(percentage) };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
          <p className="text-indigo-600 dark:text-indigo-300 font-medium">Loading your statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Unable to Load Statistics
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900">
        <div className="text-center">
          <ChartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 dark:text-gray-400">No statistics available</p>
        </div>
      </div>
    );
  }
  // Transform daily activities for the chart
  const chartData = Object.entries(stats.daily_activities).map(([date, data]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: date,
    ...data,
    total: data.uploads + data.downloads + data.shares
  })).sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

  // Prepare pie chart data for activity distribution
  const pieData = [
    { name: 'Uploads', value: stats.total_stats.uploads, color: '#3B82F6' },
    { name: 'Downloads', value: stats.total_stats.downloads, color: '#22C55E' },
    { name: 'Shares', value: stats.total_stats.shares, color: '#A855F7' }
  ];
  const activityTrend = getActivityTrend();
  const mostActiveDay = getMostActiveDay();
  const totalActivity = getTotalActivity();
  // Filter chart data based on time filter
  const getFilteredChartData = () => {
    const now = new Date();
    let cutoffDate: Date;
    
    switch(timeFilter) {
      case '7days':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return chartData;
    }
    
    return chartData.filter(item => new Date(item.fullDate) >= cutoffDate);
  };

  const filteredChartData = getFilteredChartData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Track your activity and performance metrics
              </p>
            </div>            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              {/* Time Filter */}
              <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                {(['7days', '30days', 'all'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      timeFilter === filter
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {filter === '7days' ? '7 Days' : filter === '30days' ? '30 Days' : 'All Time'}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Updating...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Uploads */}
            <div className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium opacity-80">TOTAL</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-bold">{stats.total_stats.uploads.toLocaleString()}</h3>
                  <p className="text-blue-100 text-sm font-medium">Files Uploaded</p>
                </div>
              </div>
            </div>

            {/* Total Downloads */}
            <div className="group relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Download className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium opacity-80">TOTAL</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-bold">{stats.total_stats.downloads.toLocaleString()}</h3>
                  <p className="text-green-100 text-sm font-medium">Files Downloaded</p>
                </div>
              </div>
            </div>

            {/* Total Shares */}
            <div className="group relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Share2 className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium opacity-80">TOTAL</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-bold">{stats.total_stats.shares.toLocaleString()}</h3>
                  <p className="text-purple-100 text-sm font-medium">Files Shared</p>
                </div>
              </div>
            </div>

            {/* Daily Logins */}
            <div className="group relative bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-indigo-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <LogIn className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium opacity-80">TODAY</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-bold">{stats.total_stats.daily_logins}</h3>
                  <p className="text-indigo-100 text-sm font-medium">Login Sessions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Total Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                  <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">TOTAL ACTIVITY</div>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{totalActivity.toLocaleString()}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">All Actions</p>
              </div>
            </div>

            {/* Activity Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${
                  activityTrend.trend === 'up' ? 'bg-green-100 dark:bg-green-900/50' : 
                  activityTrend.trend === 'down' ? 'bg-red-100 dark:bg-red-900/50' : 
                  'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <TrendingUp className={`h-5 w-5 ${
                    activityTrend.trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                    activityTrend.trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                    'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">3-DAY TREND</div>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className={`text-xl font-bold ${
                  activityTrend.trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                  activityTrend.trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-900 dark:text-white'
                }`}>
                  {activityTrend.trend === 'stable' ? 'Stable' : `${activityTrend.percentage.toFixed(0)}%`}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm capitalize">{activityTrend.trend}</p>
              </div>
            </div>

            {/* Most Active Day */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">MOST ACTIVE</div>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {mostActiveDay ? mostActiveDay.activity : 0}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {mostActiveDay ? new Date(mostActiveDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No data'}
                </p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Activity Timeline Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Activity Timeline</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Your daily activity over the past week</p>
                  </div>
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                    <BarChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
              </div>
              <div className="p-6">                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#22C55E" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A855F7" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#A855F7" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6B7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#6B7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="uploads"
                        stackId="1"
                        stroke="#3B82F6"
                        fill="url(#colorUploads)"
                        name="Uploads"
                      />
                      <Area
                        type="monotone"
                        dataKey="downloads"
                        stackId="1"
                        stroke="#22C55E"
                        fill="url(#colorDownloads)"
                        name="Downloads"
                      />
                      <Area
                        type="monotone"
                        dataKey="shares"
                        stackId="1"
                        stroke="#A855F7"
                        fill="url(#colorShares)"
                        name="Shares"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Activity Distribution Pie Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Distribution</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Activity breakdown</p>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 mt-4">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Bar Chart for Legacy Compatibility */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Detailed Activity Chart</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Bar chart view of your activities</p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <BarChart className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            <div className="p-6">              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6B7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#6B7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="uploads" fill="#3B82F6" name="Uploads" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="downloads" fill="#22C55E" name="Downloads" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="shares" fill="#A855F7" name="Shares" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
