import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Image, X, Paperclip } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  senderId: number;
  receiverId: number;
  content: string;
  contentType: 'text' | 'image' | 'video';
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
}

interface ChatDialogProps {
  receiverId: number;
  receiverName: string;
  receiverAvatar?: string;
  onClose: () => void;
}

const ChatDialog: React.FC<ChatDialogProps> = ({
  receiverId,
  receiverName,
  receiverAvatar,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/messages/${receiverId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      setMessages(data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setError('Failed to fetch messages');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
  
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket'],
      query: { token },
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.IO');
      setError(null);
      fetchMessages();
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setError('Failed to connect to chat server');
    });

    socketRef.current.on('new_message', (data) => {
      console.log('New message received:', data);
      if (data.message) {
        setMessages(prev => {
          // Check if message already exists
          const exists = prev.some(msg => msg.id === data.message.id);
          if (!exists) {
            return [...prev, data.message];
          }
          return prev;
        });
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [receiverId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !socketRef.current) return;

    try {
      // Create temporary message
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        senderId: parseInt(localStorage.getItem('userId') || '0'),
        receiverId: receiverId,
        content: newMessage,
        contentType: 'text',
        createdAt: new Date().toISOString()
      };

      // Add to local state immediately
      setMessages(prev => [...prev, tempMessage]);

      // Send via HTTP
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          receiver_id: receiverId,
          content: newMessage,
          content_type: 'text'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const savedMessage = await response.json();
      
      // Replace temp message with saved one
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? savedMessage : msg
      ));

      // Clear input
      setNewMessage('');
      setShowEmojiPicker(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
      // Remove temp message if failed
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', receiverId.toString());

    try {
      const response = await fetch('/api/messages/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      // Add uploaded file message to chat
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      setError('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-xl flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {receiverAvatar ? (
            <img src={receiverAvatar} alt="" className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-xl font-medium text-indigo-600">
                {receiverName[0]}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-medium">{receiverName}</h3>
            <p className="text-sm text-gray-500">Online</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-gray-500">Loading messages...</span>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-red-500">{error}</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-gray-500">No messages yet</span>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === parseInt(localStorage.getItem('userId') || '0') 
                  ? 'justify-end' 
                  : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.senderId === parseInt(localStorage.getItem('userId') || '0')
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100'
                }`}
              >                {message.contentType === 'text' && <p>{message.content}</p>}
                {message.contentType === 'image' && (
                  <div className="relative group">
                    <img
                      src={message.fileUrl}
                      alt="Shared image"
                      className="max-w-full rounded cursor-pointer transition-transform duration-200 hover:scale-105"
                      onClick={() => window.open(message.fileUrl, '_blank')}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-200 rounded"></div>
                  </div>
                )}
                {message.contentType === 'video' && (
                  <div className="relative group">                    <video
                      controls
                      className="max-w-full rounded cursor-pointer"
                      preload="metadata"
                      onClick={() => window.open(message.fileUrl, '_blank')}
                    >
                      <source src={message.fileUrl} type={message.fileName ? `video/${message.fileName.split('.').pop()?.toLowerCase()}` : 'video/mp4'} />
                      Your browser does not support the video tag.
                    </video>
                    <div className="mt-1 text-xs opacity-75">
                      {message.fileName}
                    </div>
                  </div>
                )}
                <span className="text-xs opacity-75 mt-1 block">
                  {formatDistanceToNow(new Date(message.createdAt), {
                    addSuffix: true
                  })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        {showEmojiPicker && (
          <div className="absolute bottom-full mb-2">
            <EmojiPicker
              onEmojiClick={(emojiData: EmojiClickData) => {
                setNewMessage(prev => prev + emojiData.emoji);
              }}
            />
          </div>
        )}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-gray-400 hover:text-gray-600"
          >
            <Smile size={20} />
          </button>          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-gray-600 flex items-center gap-2"
            disabled={isUploading}
            title="Upload image or video"
          >
            <Image size={20} />
            <Paperclip size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-full border px-4 py-2 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="bg-indigo-500 text-white rounded-full p-2 hover:bg-indigo-600 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDialog;