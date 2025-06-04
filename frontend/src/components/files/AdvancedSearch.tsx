import React, { useState, useEffect } from 'react';

const AdvancedSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [fileType, setFileType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [owner, setOwner] = useState('all');
  const [sharedStatus, setSharedStatus] = useState('all');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Liste des types de fichiers disponibles
  const fileTypes = [
    { value: 'all', label: 'Tous les types' },
    { value: 'document', label: 'Documents' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Vidéos' },
    { value: 'audio', label: 'Audio' },
    { value: 'archive', label: 'Archives' },
    { value: 'other', label: 'Autres' }
  ];

  // Liste des plages de dates disponibles
  const dateRanges = [
    { value: 'all', label: 'Toutes les dates' },
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'yesterday', label: 'Hier' },
    { value: 'last_week', label: 'Semaine dernière' },
    { value: 'last_month', label: 'Mois dernier' },
    { value: 'last_year', label: 'Année dernière' },
    { value: 'custom', label: 'Personnalisé' }
  ];

  // Liste des propriétaires disponibles (simulée)
  const owners = [
    { value: 'all', label: 'Tous les propriétaires' },
    { value: 'me', label: 'Moi' },
    { value: 'others', label: 'Autres utilisateurs' }
  ];

  // Liste des statuts de partage disponibles
  const sharedStatuses = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'shared', label: 'Partagés' },
    { value: 'not_shared', label: 'Non partagés' },
    { value: 'shared_with_me', label: 'Partagés avec moi' }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    // Simuler une recherche avec un délai
    setTimeout(() => {
      // Dans une implémentation réelle, cela serait une requête au backend
      // avec tous les paramètres de recherche
      const mockResults = [
        { id: 1, name: 'rapport_financier_2025.pdf', type: 'document', size: '2.4 MB', owner: 'Moi', shared: true, date: '2025-04-15' },
        { id: 2, name: 'presentation_projet_securite.pptx', type: 'document', size: '5.1 MB', owner: 'Jean Martin', shared: true, date: '2025-04-10' },
        { id: 3, name: 'photo_equipe.jpg', type: 'image', size: '3.2 MB', owner: 'Moi', shared: false, date: '2025-03-28' },
        { id: 4, name: 'donnees_clients_q1.xlsx', type: 'document', size: '1.8 MB', owner: 'Sophie Bernard', shared: true, date: '2025-03-15' },
        { id: 5, name: 'video_conference.mp4', type: 'video', size: '45.6 MB', owner: 'Moi', shared: true, date: '2025-02-20' }
      ];

      // Filtrer les résultats en fonction des critères de recherche
      const filteredResults = mockResults.filter(file => {
        // Filtrer par nom de fichier
        if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }

        // Filtrer par type de fichier
        if (fileType !== 'all' && file.type !== fileType) {
          return false;
        }

        // Filtrer par propriétaire
        if (owner === 'me' && file.owner !== 'Moi') {
          return false;
        } else if (owner === 'others' && file.owner === 'Moi') {
          return false;
        }

        // Filtrer par statut de partage
        if (sharedStatus === 'shared' && !file.shared) {
          return false;
        } else if (sharedStatus === 'not_shared' && file.shared) {
          return false;
        } else if (sharedStatus === 'shared_with_me' && file.owner === 'Moi') {
          return false;
        }

        // Filtrer par date (simplifié pour la démonstration)
        if (dateRange !== 'all') {
          const fileDate = new Date(file.date);
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (dateRange === 'today' && fileDate.toDateString() !== today.toDateString()) {
            return false;
          } else if (dateRange === 'yesterday' && fileDate.toDateString() !== yesterday.toDateString()) {
            return false;
          }
          // Autres filtres de date seraient implémentés ici
        }

        return true;
      });

      setSearchResults(filteredResults);
      setIsSearching(false);
    }, 1000);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'document':
        return '📄';
      case 'image':
        return '🖼️';
      case 'video':
        return '🎬';
      case 'audio':
        return '🎵';
      case 'archive':
        return '📦';
      default:
        return '📁';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Recherche Avancée</h2>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2">
          <div className="flex-grow">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher des fichiers..."
                className="w-full border rounded-lg py-2 px-4 pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
              disabled={isSearching}
            >
              {isSearching ? 'Recherche...' : 'Rechercher'}
            </button>
            
            <button
              type="button"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg flex items-center"
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtres
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ml-1 transform ${showFilters ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de fichier</label>
              <select
                className="w-full border rounded-md py-2 px-3"
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
              >
                {fileTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plage de dates</label>
              <select
                className="w-full border rounded-md py-2 px-3"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Propriétaire</label>
              <select
                className="w-full border rounded-md py-2 px-3"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
              >
                {owners.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut de partage</label>
              <select
                className="w-full border rounded-md py-2 px-3"
                value={sharedStatus}
                onChange={(e) => setSharedStatus(e.target.value)}
              >
                {sharedStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </form>
      
      {searchResults.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Résultats de recherche ({searchResults.length})</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Nom</th>
                  <th className="py-3 px-6 text-left">Type</th>
                  <th className="py-3 px-6 text-left">Taille</th>
                  <th className="py-3 px-6 text-left">Propriétaire</th>
                  <th className="py-3 px-6 text-left">Date</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {searchResults.map((file) => (
                  <tr key={file.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left">
                      <div className="flex items-center">
                        <span className="mr-2">{getFileIcon(file.type)}</span>
                        {file.name}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-left">{file.type.charAt(0).toUpperCase() + file.type.slice(1)}</td>
                    <td className="py-3 px-6 text-left">{file.size}</td>
                    <td className="py-3 px-6 text-left">{file.owner}</td>
                    <td className="py-3 px-6 text-left">{file.date}</td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex item-center justify-center space-x-2">
                        <button className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs">
                          Télécharger
                        </button>
                        
                        {file.owner === 'Moi' && (
                          <button className="bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-xs">
                            Partager
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : searchQuery && !isSearching ? (
        <div className="mt-6 text-center py-8">
          <p className="text-gray-500">Aucun résultat trouvé pour votre recherche</p>
          <p className="text-gray-400 text-sm mt-2">Essayez de modifier vos critères de recherche</p>
        </div>
      ) : null}
    </div>
  );
};

export default AdvancedSearch;
