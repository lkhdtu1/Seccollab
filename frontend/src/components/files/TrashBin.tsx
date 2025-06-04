import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../layout/Navbar';

const TrashBin: React.FC = () => {
  const navigate = useNavigate();

  const handleReturnToHub = () => {
    navigate('/hub');
  };
  const [trashFiles, setTrashFiles] = useState<any[]>([
    { id: 1, name: 'old_report.pdf', type: 'document', deletedAt: '2025-04-20' },
    { id: 2, name: 'team_photo.jpg', type: 'image', deletedAt: '2025-04-22' },
  ]);

  const handleRestoreFile = (fileId: number) => {
    setTrashFiles(trashFiles.filter(file => file.id !== fileId));
    console.log(`File with ID ${fileId} restored.`);
  };

  const handleDeletePermanently = (fileId: number) => {
    setTrashFiles(trashFiles.filter(file => file.id !== fileId));
    console.log(`File with ID ${fileId} permanently deleted.`);
  };

  return (
    
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <Navbar />
      <br />
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Corbeille</h1>
      <p className="text-gray-600 mb-6">
        Gérez vos fichiers supprimés. Vous pouvez restaurer ou supprimer définitivement des fichiers.
      </p>
      {trashFiles.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Nom</th>
                <th className="py-3 px-6 text-left">Type</th>
                <th className="py-3 px-6 text-left">Supprimé le</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {trashFiles.map(file => (
                <tr key={file.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left">{file.name}</td>
                  <td className="py-3 px-6 text-left">{file.type}</td>
                  <td className="py-3 px-6 text-left">{file.deletedAt}</td>
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => handleRestoreFile(file.id)}
                      className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-xs mr-2"
                    >
                      Restaurer
                    </button>
                    <button
                      onClick={() => handleDeletePermanently(file.id)}
                      className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-xs"
                    >
                      Supprimer définitivement
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">Aucun fichier dans la corbeille.</p>
      )}
    </div>
  );
};

export default TrashBin;