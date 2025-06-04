import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BarChart as ChartIcon } from 'lucide-react';
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
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/stats/user/stats`);
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-400">
        No stats available
      </div>
    );
  }

  // Transform daily activities for the chart
  const chartData = Object.entries(stats.daily_activities).map(([date, data]) => ({
    date,
    ...data
  }));

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Your Statistics</h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Stats Cards */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold">Total Uploads</h3>
              <p className="text-3xl font-bold mt-2">{stats.total_stats.uploads}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold">Total Downloads</h3>
              <p className="text-3xl font-bold mt-2">{stats.total_stats.downloads}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold">Total Shares</h3>
              <p className="text-3xl font-bold mt-2">{stats.total_stats.shares}</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold">Today's Logins</h3>
              <p className="text-3xl font-bold mt-2">{stats.total_stats.daily_logins}</p>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Activity Over Time
            </h3>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="uploads" fill="#3B82F6" name="Uploads" />
                  <Bar dataKey="downloads" fill="#22C55E" name="Downloads" />
                  <Bar dataKey="shares" fill="#A855F7" name="Shares" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
