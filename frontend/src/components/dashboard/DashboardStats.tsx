import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';


// Enregistrer les composants nécessaires pour Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Définir les types pour les statistiques
type FileStats = {
  totalFiles: number;
  sharedFiles: number;
  filesByType: { [key: string]: number };
};

type ActivityStats = {
  uploads: number[];
  downloads: number[];
  shares: number[];
};

type StorageStats = {
  used: number;
  total: number;
  usageByType: { [key: string]: number };
};

type Stats = {
  fileStats: FileStats;
  activityStats: ActivityStats;
  storageStats: StorageStats;
};

const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    fileStats: {
      totalFiles: 0,
      sharedFiles: 0,
      filesByType: {}
    },
    activityStats: {
      uploads: [],
      downloads: [],
      shares: []
    },
    storageStats: {
      used: 0,
      total: 100,
      usageByType: {}
    }
  });
  // Fonction pour rafraîchir le token JWT
  // Fonction pour rafraîchir le token JWT
const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token'); // Récupérer le refresh_token
    const response = await fetch('http://127.0.0.1:5000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`, // Utiliser le refresh_token
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('auth_token', data.access_token); // Mettre à jour le access_token
      return data.access_token;
    } else {
      console.error('Erreur lors du rafraîchissement du token');
      return null;
    }
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    return null;
  }
};

// Modification de la fonction fetchStats pour gérer les erreurs 401
const fetchStats = async () => {
  let token = localStorage.getItem('auth_token'); // Récupérer le access_token

  try {
    let response = await fetch('http://127.0.0.1:5000/api/stats/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`, // Ajouter le token JWT dans les en-têtes
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Si le token est expiré, essayez de le rafraîchir
      console.warn('Token expiré, tentative de rafraîchissement...');
      token = await refreshAccessToken();

      if (token) {
        // Réessayez la requête avec le nouveau token
        response = await fetch('http://127.0.0.1:5000/api/stats/dashboard', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } else {
        console.error('Impossible de rafraîchir le token. Redirection vers la page de connexion.');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login'; // Rediriger vers la page de connexion
        return;
      }
    }

    const data = await response.json();

    if (response.ok) {
      console.log('Statistiques:', data);
      setStats(data.data); // Mettre à jour les statistiques
    } else {
      console.error('Erreur lors de la récupération des statistiques:', data.message);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
  }
};

// Appeler fetchStats dans useEffect
  useEffect(() => {
    fetchStats();
  }, []);
/*
  useEffect(() => {
    const fetchStats = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        fileStats: {
          totalFiles: 42,
          sharedFiles: 15,
          filesByType: {
            'Documents': 18,
            'Images': 12,
            'Vidéos': 5,
            'Autres': 7
          }
        },
        activityStats: {
          uploads: [5, 8, 12, 7, 10, 15, 9],
          downloads: [3, 6, 10, 8, 12, 9, 7],
          shares: [2, 4, 6, 3, 5, 7, 4]
        },
        storageStats: {
          used: 45,
          total: 100,
          usageByType: {
            'Documents': 15,
            'Images': 20,
            'Vidéos': 55,
            'Autres': 10
          }
        }
      });
    };
    
    fetchStats();
  }, []);
*/

  const activityData = {
    labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
    datasets: [
      {
        label: 'Téléversements',
        data: stats.activityStats.uploads,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Téléchargements',
        data: stats.activityStats.downloads,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Partages',
        data: stats.activityStats.shares,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }
    ],
  };

  const fileTypeData = {
    labels: Object.keys(stats.fileStats.filesByType),
    datasets: [
      {
        label: 'Types de fichiers',
        data: Object.values(stats.fileStats.filesByType),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const storageUsageData = {
    labels: Object.keys(stats.storageStats.usageByType),
    datasets: [
      {
        label: 'Utilisation du stockage',
        data: Object.values(stats.storageStats.usageByType),
        backgroundColor: [
          
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Statistiques et Analyses</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-500 text-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Fichiers totaux</h3>
          <p className="text-3xl font-bold">{stats.fileStats.totalFiles}</p>
        </div>
        
        <div className="bg-orange-500 text-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Fichiers partagés</h3>
          <p className="text-3xl font-bold">{stats.fileStats.sharedFiles}</p>
        </div>
        
        <div className="bg-purple-500 text-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Espace utilisé</h3>
          <p className="text-3xl font-bold">{stats.storageStats.used}%</p>
          <div className="w-full bg-white bg-opacity-30 rounded-full h-2.5 mt-2">
            <div 
              className="bg-white h-2.5 rounded-full" 
              style={{ width: `${stats.storageStats.used}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 h-[400px]">
          <h3 className="text-lg font-semibold mb-4">Activité hebdomadaire</h3>
          <div className="relative h-[300px]">
            <Line data={activityData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 h-[400px]">
          <h3 className="text-lg font-semibold mb-4">Types de fichiers</h3>
          <div className="relative h-[300px] flex justify-center items-center">
            <Pie data={fileTypeData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 h-[400px]">
        <h3 className="text-lg font-semibold mb-4 flex justify-center items-center">Utilisation du stockage par type</h3>
        <div className="relative h-[300px] flex justify-center items-center">
          <Bar data={storageUsageData} options={{ responsive: true, maintainAspectRatio: true }} />
        </div>
      </div>
      
    </div>
  );
};

export default DashboardStats;
