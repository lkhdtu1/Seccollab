import React, { useState, useEffect } from 'react';
import DashboardStats from './DashboardStats';
import CountUp from 'react-countup'; // 👈 Import CountUp

type Activity = {
  id: number;
  type: 'upload' | 'download' | 'share';
  filename: string;
  date: string;
  user: string;
};

type Stats = {
  totalFiles: number;
  sharedWithMe: number;
  recentActivity: Activity[];
};

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    totalFiles: 0,
    sharedWithMe: 0,
    recentActivity: []
  });
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);

    setStats({
      totalFiles: 15,
      sharedWithMe: 7,
      recentActivity: [
        { id: 1, type: 'upload', filename: 'rapport_financier.pdf', date: '2025-04-20', user: 'Marie Dupont' },
        { id: 2, type: 'share', filename: 'presentation_projet.pptx', date: '2025-04-19', user: 'Jean Martin' },
        { id: 3, type: 'download', filename: 'donnees_clients.xlsx', date: '2025-04-18', user: 'Sophie Bernard' }
      ]
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>
          <p className="text-lg text-gray-600">Bienvenue, {user?.name || 'Utilisateur'}</p>
        </div>

        <div className="flex justify-end mb-4">
          <button 
            onClick={() => setShowStats(!showStats)}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center"
          >
            {showStats ? 'Masquer les statistiques' : 'Afficher les statistiques avancées'}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
          </button>
        </div>
      </div>

      {/* STATS CARDS that i can remove */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-blue-500 text-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-2">Mes fichiers</h2>
          <p className="text-4xl font-extrabold">
            <CountUp end={stats.totalFiles} duration={1.5} />
          </p>
        </div>

        <div className="flex-1 bg-green-500 text-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-2">Partagés avec moi</h2>
          <p className="text-4xl font-extrabold">
            <CountUp end={stats.sharedWithMe} duration={1.5} />
          </p>
        </div>

        <div className="flex-1 bg-purple-500 text-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-2">Espace utilisé</h2>
          <p className="text-4xl font-extrabold">
            <CountUp end={45} duration={1.5} suffix="%" />
          </p>
          <div className="w-full bg-white bg-opacity-30 rounded-full h-2.5 mt-2">
            <div 
              className="bg-white h-2.5 rounded-full" 
              style={{ width: '45%' }}
            ></div>
          </div>
        </div>
      </div>

      {/* ADVANCED STATS */}
      {showStats && <DashboardStats />}







      {/* RECENT ACTIVITY */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Activité récente</h2>
        
        {stats.recentActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Action</th>
                  <th className="py-3 px-6 text-left">Fichier</th>
                  <th className="py-3 px-6 text-left">Date</th>
                  <th className="py-3 px-6 text-left">Utilisateur</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {stats.recentActivity.map((activity) => (
                  <tr key={activity.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left">
                      {activity.type === 'upload' && (
                        <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs">Téléversement</span>
                      )}
                      {activity.type === 'download' && (
                        <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs">Téléchargement</span>
                      )}
                      {activity.type === 'share' && (
                        <span className="bg-purple-100 text-purple-800 py-1 px-3 rounded-full text-xs">Partage</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-left">{activity.filename}</td>
                    <td className="py-3 px-6 text-left">{activity.date}</td>
                    <td className="py-3 px-6 text-left">{activity.user}</td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex item-center justify-center space-x-2">
                        <button className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs">
                          Voir détails
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">Aucune activité récente</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
