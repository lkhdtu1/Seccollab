import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Image, X, Paperclip, MoreVertical, Minimize2 } from 'lucide-react';
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
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
    <div className={`fixed bottom-4 right-4 transition-all duration-300 ease-in-out ${
      isMinimized 
        ? 'w-80 h-16' 
        : 'w-96 h-[600px]'
    } bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 flex flex-col overflow-hidden`}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {receiverAvatar ? (
              <img 
                src={receiverAvatar} 
                alt={receiverName} 
                className="w-10 h-10 rounded-full ring-2 ring-indigo-500/30 shadow-lg" 
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg ring-2 ring-indigo-500/30">
                <span className="text-lg font-bold text-white">
                  {receiverName[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse"></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{receiverName}</h3>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              {isTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
          <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 rounded-lg transition-all duration-200"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>      {/* Messages Container */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/30 to-white/30 dark:from-gray-800/30 dark:to-gray-900/30">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-gray-500 dark:text-gray-400 ml-3 text-sm">Loading messages...</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700/50">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <X className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                  <button 
                    onClick={() => {setError(null); fetchMessages();}}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Start your conversation</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Send a message to {receiverName}</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === parseInt(localStorage.getItem('userId') || '0') 
                      ? 'justify-end' 
                      : 'justify-start'
                  } group`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl p-4 shadow-sm relative transition-all duration-200 hover:shadow-md ${
                      message.senderId === parseInt(localStorage.getItem('userId') || '0')
                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white ml-auto'
                        : 'bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50'
                    }`}
                  >                    {message.contentType === 'text' && (
                      <p className="leading-relaxed">{message.content}</p>
                    )}
                    
                    {message.contentType === 'image' && (
                      <div className="relative group/image">
                        <img
                          src={message.fileUrl}
                          alt="Shared image"
                          className="max-w-full rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-lg"
                          onClick={() => window.open(message.fileUrl, '_blank')}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/image:bg-opacity-5 transition-all duration-300 rounded-xl flex items-center justify-center">
                          <div className="opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 bg-black/20 rounded-full p-2">
                            <Image className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {message.contentType === 'video' && (
                      <div className="relative group/video">
                        <video
                          controls
                          className="max-w-full rounded-xl cursor-pointer shadow-lg"
                          preload="metadata"
                          onClick={() => window.open(message.fileUrl, '_blank')}
                        >
                          <source src={message.fileUrl} type={message.fileName ? `video/${message.fileName.split('.').pop()?.toLowerCase()}` : 'video/mp4'} />
                          Your browser does not support the video tag.
                        </video>
                        {message.fileName && (
                          <div className="mt-2 text-xs opacity-80 bg-black/10 rounded-lg px-2 py-1">
                            {message.fileName}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs opacity-75 ${
                        message.senderId === parseInt(localStorage.getItem('userId') || '0')
                          ? 'text-white/80'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true
                        })}
                      </span>
                      
                      {/* Message status indicator for sent messages */}
                      {message.senderId === parseInt(localStorage.getItem('userId') || '0') && (
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                          <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>          {/* Input Section */}
          <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 left-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">                  <EmojiPicker
                    onEmojiClick={(emojiData: EmojiClickData) => {
                      setNewMessage(prev => prev + emojiData.emoji);
                      setShowEmojiPicker(false);
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-end space-x-3">
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all duration-200 group"
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all duration-200 group"
                  disabled={isUploading}
                  title="Upload file"
                >
                  <div className="relative">
                    <Paperclip className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                </button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
              </div>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={`Message ${receiverName}...`}
                  className="w-full px-4 py-3 pr-12 bg-gray-50/80 dark:bg-gray-700/80 border border-gray-200/60 dark:border-gray-600/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 backdrop-blur-sm"
                />
                
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || isUploading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
                >
                  <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>{receiverName} is typing...</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ChatDialog;