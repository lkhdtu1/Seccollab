import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: {
    read: boolean;
    write: boolean;
  };
}

const PermissionsManager: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Users state includes permissions
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    // Simulate fetching files from the API
    const mockFiles = [
      { id: 1, name: 'rapport_financier.pdf', type: 'document', owner: 'Moi', shared_with: [2, 3] },
      { id: 2, name: 'presentation_projet.pptx', type: 'document', owner: 'Moi', shared_with: [3] },
      { id: 3, name: 'donnees_clients.xlsx', type: 'document', owner: 'Moi', shared_with: [] },
      { id: 4, name: 'photo_equipe.jpg', type: 'image', owner: 'Moi', shared_with: [2, 4, 5] }
    ];
    setFiles(mockFiles);

    // Simulate fetching users from the API, including permissions
    const mockUsers: User[] = [
      { id: 1, name: 'Moi (Propriétaire)', email: 'moi@example.com', role: 'owner', permissions: { read: true, write: true } },
      { id: 2, name: 'Marie Dupont', email: 'marie@example.com', role: 'user', permissions: { read: true, write: false } },
      { id: 3, name: 'Jean Martin', email: 'jean@example.com', role: 'user', permissions: { read: true, write: false } },
      { id: 4, name: 'Sophie Bernard', email: 'sophie@example.com', role: 'user', permissions: { read: true, write: true } },
      { id: 5, name: 'Thomas Petit', email: 'thomas@example.com', role: 'user', permissions: { read: true, write: true } }
    ];
    setUsers(mockUsers);
  }, []);

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.id !== 1 &&
    (user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  const handleFileSelect = (file: any) => {
    setSelectedFile(file);
    setSelectedUsers(file.shared_with);
    setShowPermissionModal(true);
  };

  const handleUserToggle = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSavePermissions = () => {
    const updatedUsers = users.map(user => {
      if (selectedUsers.includes(user.id)) {
        return {
          ...user,
          permissions: {
            read: user.permissions.read,
            write: user.permissions.write
          }
        };
      }
      return user;
    });

    setUsers(updatedUsers);
    const updatedFiles = files.map(file => {
      if (file.id === selectedFile.id) {
        return { ...file, shared_with: selectedUsers };
      }
      return file;
    });

    setFiles(updatedFiles);
    setShowPermissionModal(false);
    console.log(`Permissions updated for ${selectedFile.name}:`, selectedUsers);
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
      default:
        return '📁';
    }
  };

  const handlePermissionToggle = (userId: number, permissionType: 'read' | 'write') => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId
          ? {
              ...user,
              permissions: {
                ...user.permissions,
                [permissionType]: !user.permissions[permissionType],
              },
            }
          : user
      )
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Gestionnaire de Permissions</h2>

      <div className="mb-6">
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

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Nom</th>
              <th className="py-3 px-6 text-left">Type</th>
              <th className="py-3 px-6 text-left">Propriétaire</th>
              <th className="py-3 px-6 text-left">Partagé avec</th>
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
                <td className="py-3 px-6 text-left">{file.type.charAt(0).toUpperCase() + file.type.slice(1)}</td>
                <td className="py-3 px-6 text-left">{file.owner}</td>
                <td className="py-3 px-6 text-left">
                  <div className="flex flex-wrap gap-1">
                    {file.shared_with.length > 0 ? (
                      file.shared_with.map((userId: number) => {
                        const user = users.find(u => u.id === userId);
                        return user ? (
                          <span key={userId} className="bg-blue-100 text-blue-800 py-1 px-2 rounded-full text-xs">
                            {user.name}
                          </span>
                        ) : null;
                      })
                    ) : (
                      <span className="text-gray-400">Non partagé</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-6 text-center">
                  <button
                    onClick={() => handleFileSelect(file)}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-xs"
                  >
                    Gérer les permissions
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de gestion des permissions */}
      {showPermissionModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Permissions pour {getFileIcon(selectedFile.type)} {selectedFile.name}
              </h3>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher des utilisateurs..."
                  className="w-full border rounded-lg py-2 px-4 pr-10"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
                <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto mb-4">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100 sticky top-0">
                  <tr className="text-gray-600 text-sm leading-normal">
                    <th className="py-2 px-4 text-left">Utilisateur</th>
                    <th className="py-2 px-4 text-left">Email</th>
                    <th className="py-2 px-4 text-center">Lecture</th>
                    <th className="py-2 px-4 text-center">Ecriture</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-4 text-left">{user.name}</td>
                      <td className="py-2 px-4 text-left">{user.email}</td>
                      {/* Lecture Checkbox */}
                      <td className="py-2 px-4 text-center">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-600"
                            checked={user.permissions.read}
                            onChange={() => handlePermissionToggle(user.id, 'read')}
                          />
                        </label>
                      </td>

                      {/* Ecriture Checkbox */}
                      <td className="py-2 px-4 text-center">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-600"
                            checked={user.permissions.write}
                            onChange={() => handlePermissionToggle(user.id, 'write')}
                          />
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePermissions}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsManager;
