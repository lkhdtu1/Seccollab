import React, { useState, useEffect } from 'react';

const FileShare: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [shareEmail, setShareEmail] = useState('');
  const [shareFileId, setShareFileId] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<any[]>([]);

  useEffect(() => {
    // Simuler la récupération des fichiers depuis l'API
    // Dans une implémentation réelle, cela serait une requête au backend
    const mockFiles = [
      { id: 1, name: 'rapport_financier.pdf', size: '2.4 MB', type: 'application/pdf', owner: 'Moi', shared: false, date: '2025-04-20' },
      { id: 2, name: 'presentation_projet.pptx', size: '5.1 MB', type: 'application/vnd.ms-powerpoint', owner: 'Jean Martin', shared: true, date: '2025-04-19' },
      { id: 3, name: 'donnees_clients.xlsx', size: '1.8 MB', type: 'application/vnd.ms-excel', owner: 'Moi', shared: true, date: '2025-04-18' },
      { id: 4, name: 'contrat_partenariat.docx', size: '0.9 MB', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', owner: 'Sophie Bernard', shared: true, date: '2025-04-17' }
    ];
    
    setFiles(mockFiles);
    setFilteredFiles(mockFiles);
  }, []);

  useEffect(() => {
    // Filtrer les fichiers en fonction de la recherche
    if (searchQuery.trim() === '') {
      setFilteredFiles(files);
    } else {
      const filtered = files.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFiles(filtered);
    }
  }, [searchQuery, files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) return;
    
    // Simuler un téléversement avec une barre de progression
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Ajouter le fichier téléversé à la liste
          const newFile = {
            id: files.length + 1,
            name: selectedFile.name,
            size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
            type: selectedFile.type,
            owner: 'Moi',
            shared: false,
            date: new Date().toISOString().split('T')[0]
          };
          
          setFiles(prev => [...prev, newFile]);
          setFilteredFiles(prev => [...prev, newFile]);
          setSelectedFile(null);
          setUploadProgress(0);
          
          return 0;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleShare = (fileId: number) => {
    setShareFileId(fileId);
    setShowShareModal(true);
  };

  const confirmShare = () => {
    if (!shareEmail || !shareFileId) return;
    
    // Simuler le partage de fichier
    console.log(`Partage du fichier ID ${shareFileId} avec ${shareEmail}`);
    
    // Mettre à jour l'état de partage du fichier
    setFiles(prev => 
      prev.map(file => 
        file.id === shareFileId ? { ...file, shared: true } : file
      )
    );
    
    // Réinitialiser et fermer le modal
    setShareEmail('');
    setShareFileId(null);
    setShowShareModal(false);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📈';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('image')) return '🖼️';
    return '📁';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Partage de Fichiers</h1>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <form onSubmit={handleUpload} className="flex items-center space-x-2">
              <label className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded cursor-pointer">
                <span>Sélectionner un fichier</span>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
              
              {selectedFile && (
                <>
                  <span className="text-gray-600">{selectedFile.name}</span>
                  <button 
                    type="submit" 
                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
                  >
                    Téléverser
                  </button>
                </>
              )}
            </form>
            
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full mt-2">
                <div className="bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">Téléversement: {uploadProgress}%</p>
              </div>
            )}
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher des fichiers..."
              className="border rounded-lg py-2 px-4 w-full md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>
        
        {filteredFiles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Nom</th>
                  <th className="py-3 px-6 text-left">Taille</th>
                  <th className="py-3 px-6 text-left">Propriétaire</th>
                  <th className="py-3 px-6 text-left">Date</th>
                  <th className="py-3 px-6 text-left">Statut</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left">
                      <div className="flex items-center">
                        <span className="mr-2">{getFileIcon(file.type)}</span>
                        {file.name}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-left">{file.size}</td>
                    <td className="py-3 px-6 text-left">{file.owner}</td>
                    <td className="py-3 px-6 text-left">{file.date}</td>
                    <td className="py-3 px-6 text-left">
                      {file.shared ? (
                        <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs">Partagé</span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs">Privé</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex item-center justify-center space-x-2">
                        <button 
                          className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs"
                          onClick={() => console.log(`Téléchargement de ${file.name}`)}
                        >
                          Télécharger
                        </button>
                        
                        {file.owner === 'Moi' && (
                          <button 
                            className="bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-xs"
                            onClick={() => handleShare(file.id)}
                          >
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
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">Aucun fichier trouvé</p>
          </div>
        )}
      </div>
      
      {/* Modal de partage */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Partager le fichier</h3>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Email du destinataire
              </label>
              <input
                type="email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="exemple@email.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
                onClick={() => setShowShareModal(false)}
              >
                Annuler
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                onClick={confirmShare}
              >
                Partager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileShare;
