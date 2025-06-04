import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/config'; // URL de base de l'API

const RealtimeCollaboration: React.FC = () => {
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]); // Initialisé avec un tableau vide
  const [isConnected, setIsConnected] = useState(true);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const token = localStorage.getItem('auth_token'); // Récupérer le token JWT
  const INACTIVITY_TIMEOUT = 300000; // 5 minutes (en millisecondes)
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour mettre à jour le statut de l'utilisateur
  const updateStatus = async (status: string) => {
    try {
      await fetch(`${API_BASE_URL}/users/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  // Fonction pour réinitialiser le timer d'inactivité
  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    updateStatus('online'); // Remettre le statut à "online" si l'utilisateur interagit
    inactivityTimer.current = setTimeout(() => {
      updateStatus('away'); // Mettre le statut à "away" après le délai d'inactivité
    }, INACTIVITY_TIMEOUT);
  };

  // Ajout des écouteurs d'événements pour détecter l'activité de l'utilisateur
  useEffect(() => {
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);
    window.addEventListener('click', resetInactivityTimer);

    resetInactivityTimer();

    return () => {
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('keydown', resetInactivityTimer);
      window.removeEventListener('click', resetInactivityTimer);
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, []);

  // Récupérer les fichiers partagés depuis le backend
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/files/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Erreur lors de la récupération des fichiers');
      const data = await response.json();

      // Vérifiez si `data` est un tableau
      if (Array.isArray(data)) {
        setFiles(data);
      } else {
        console.error('La réponse de l\'API n\'est pas un tableau:', data);
        setFiles([]); // Définit un tableau vide si la réponse n'est pas valide
      }
    } catch (error) {
      console.error(error);
      setError('Impossible de récupérer les fichiers. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les collaborateurs depuis le backend
  const fetchCollaborators = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/collaborators/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Erreur lors de la récupération des collaborateurs');
      const data = await response.json();
      setCollaborators(data);
    } catch (error) {
      console.error(error);
      setError('Impossible de récupérer les collaborateurs. Veuillez réessayer plus tard.');
    }
  };

  // Récupérer les utilisateurs actifs depuis le backend
  const fetchActiveUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/active_users/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Erreur lors de la récupération des utilisateurs actifs');
      const data = await response.json();
      setActiveUsers(data);
    } catch (error) {
      console.error(error);
      setError('Impossible de récupérer les utilisateurs actifs. Veuillez réessayer plus tard.');
    }
  };

  // Récupérer les messages liés à un fichier
  const fetchMessages = async (fileId: number) => {
    console.log(`fetchMessages appelé avec fileId: ${fileId}`);
    try {
      const response = await fetch(`${API_BASE_URL}/messages/files/${fileId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Erreur lors de la récupération des messages');
      const data = await response.json();
      console.log('Messages récupérés:', data);
      setMessages(data);
    } catch (error) {
      console.error('Erreur dans fetchMessages:', error);
      setError('Impossible de récupérer les messages. Veuillez réessayer plus tard.');
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchCollaborators();
    fetchActiveUsers();

    // WebSocket pour les mises à jour en temps réel
    const socket = new WebSocket('ws://127.0.0.1:5000/socket.io/?EIO=4&transport=websocket');
    socket.onopen = () => {
      console.log('Connecté au WebSocket');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      console.log('Message brut reçu via WebSocket:', event.data);
      try {
        const data = JSON.parse(event.data);
        console.log('Message JSON parsé:', data);
    
        if (data.type === 'file_update') {
          fetchFiles();
        } else if (data.type === 'active_user_update') {
          fetchActiveUsers();
        } else if (data.type === 'message_update' && selectedFile && data.file_id === selectedFile.id) {
          fetchMessages(selectedFile.id);
        }
      } catch (error) {
        console.error('Erreur lors du parsing JSON:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
    };
    socket.onclose = () => {
      console.log('WebSocket déconnecté');
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [selectedFile]);

  const handleFileSelect = (file: any) => {
    console.log('Fichier sélectionné:', file);
    setSelectedFile(file);
    fetchMessages(file.id); // Charger les messages pour le fichier sélectionné
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedFile) {
      return;
    }

    const newMessageObj = {
      text: newMessage,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/files/${selectedFile.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newMessageObj),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data]);
        setNewMessage('');
      } else {
        console.error('Erreur lors de l\'envoi du message');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} octets`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} Ko`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} Mo`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} Go`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    } else if (mimeType.startsWith('video/')) {
      return '🎬';
    } else if (mimeType.startsWith('audio/')) {
      return '🎵';
    } else if (mimeType === 'application/pdf') {
      return '📄';
    } else {
      return '📁';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <span className="h-3 w-3 bg-green-500 rounded-full inline-block mr-2"></span>;
      case 'offline':
        return <span className="h-3 w-3 bg-gray-400 rounded-full inline-block mr-2"></span>;
      case 'away':
        return <span className="h-3 w-3 bg-yellow-500 rounded-full inline-block mr-2"></span>;
      default:
        return <span className="h-3 w-3 bg-gray-400 rounded-full inline-block mr-2"></span>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Collaboration en Temps Réel</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500">Chargement des données...</div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Liste des fichiers */}
          <div className="lg:w-1/4">
            <h3 className="text-lg font-semibold mb-3">Fichiers partagés</h3>
            <div className="border rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {Array.isArray(files) && files.length === 0 ? (
                  <div className="text-gray-500 text-center p-3">Aucun fichier partagé</div>
                ) : (
                  Array.isArray(files) &&
                  files.map(file => (
                    <li
                      key={file.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedFile?.id === file.id ? 'bg-blue-50' : ''}`}
                      onClick={() => handleFileSelect(file)}
                    >
                      <div className="flex items-center">
                        <span className="mr-2">{getFileIcon(file.mime_type)}</span>
                        <span className="font-medium">{file.name}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Taille : {formatFileSize(file.size)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Créé le : {new Date(file.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Mis à jour le : {new Date(file.updated_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {file.shared_with && file.shared_with.length > 0 ? (
                          `Partagé avec ${file.shared_with.length} utilisateur${file.shared_with.length > 1 ? 's' : ''}`
                        ) : (
                          'Non partagé'
                        )}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* Zone de chat */}
          <div className="lg:w-2/4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">
                {selectedFile ? `Discussion: ${selectedFile.name}` : 'Sélectionnez un fichier'}
              </h3>
              <div className={`flex items-center ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} mr-1`}></span>
                <span className="text-xs">{isConnected ? 'Connecté' : 'Déconnecté'}</span>
              </div>
            </div>

            <div className="border rounded-lg flex flex-col h-96">
              {selectedFile ? (
                <>
                  <div className="flex-grow overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-gray-500 text-center p-3">Aucun message pour ce fichier</div>
                    ) : (
                      messages.map(message => (
                        <div
                          key={message.id}
                          className={`flex ${message.user_id === 1 ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs rounded-lg px-4 py-2 ${
                              message.user_id === 1
                                ? 'bg-blue-500 text-white rounded-br-none'
                                : 'bg-gray-200 text-gray-800 rounded-bl-none'
                            }`}
                          >
                            {message.user_id !== 1 && (
                              <div className="font-semibold text-xs mb-1">{message.user_name}</div>
                            )}
                            <div>{message.text}</div>
                            <div className="text-xs mt-1 opacity-70 text-right">{message.timestamp}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t p-3">
                    <form onSubmit={handleSendMessage} className="flex">
                      <input
                        type="text"
                        placeholder="Tapez votre message..."
                        className="flex-grow border rounded-l-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={!selectedFile}
                      />
                      <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-r-lg px-4 py-2 disabled:bg-blue-300"
                        disabled={!selectedFile || !newMessage.trim()}
                      >
                        Envoyer
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Sélectionnez un fichier pour voir la discussion
                </div>
              )}
            </div>
          </div>

          {/* Liste des collaborateurs */}
          <div className="lg:w-1/4">
            <h3 className="text-lg font-semibold mb-3">Collaborateurs</h3>
            <div className="border rounded-lg overflow-hidden mb-4">
              <ul className="divide-y divide-gray-200">
                {collaborators.length === 0 ? (
                  <div className="text-gray-500 text-center p-3">Aucun collaborateur disponible</div>
                ) : (
                  collaborators.map(user => (
                    <li key={user.id} className="p-3">
                      <div className="flex items-center">
                        {getStatusIcon(user.status)}
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 ml-5">{user.email}</div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <h3 className="text-lg font-semibold mb-3">Activité en cours</h3>
            <div className="border rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {activeUsers.length === 0 ? (
                  <div className="text-gray-500 text-center p-3">Aucune activité en cours</div>
                ) : (
                  activeUsers.map(user => {
                    const file = files.find(f => f.id === user.file_id);
                    return (
                      <li key={user.id} className="p-3">
                        <div className="flex items-center">
                          <span className="h-3 w-3 bg-green-500 rounded-full inline-block mr-2"></span>
                          <span className="font-medium">{user.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 ml-5">
                          {user.action === 'viewing' ? 'Consulte' : 'Modifie'} {file ? file.name : ''}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 ml-5">{user.last_active}</div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeCollaboration;