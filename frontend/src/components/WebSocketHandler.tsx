import React, { useEffect } from 'react';
import { io } from 'socket.io-client';

const WebSocketHandler: React.FC = () => {
  useEffect(() => {
    // Connecter au WebSocket du backend
    const socket = io('http://127.0.0.1:5000'); // Remplacez par l'URL de votre backend

    // Écouter les événements
    socket.on('connect', () => {
      console.log('Connecté au WebSocket');
    });

    socket.on('disconnect', () => {
      console.log('Déconnecté du WebSocket');
    });

    // Nettoyer la connexion lors du démontage du composant
    return () => {
      socket.disconnect();
    };
  }, []);

  return <div>WebSocket connecté</div>;
};

export default WebSocketHandler;