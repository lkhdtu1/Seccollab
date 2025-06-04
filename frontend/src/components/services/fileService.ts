import axios from 'axios';
import { API_BASE_URL } from '../config/config';
import { SharedUser } from '../UserManagement';

// File upload function
export const uploadFile = async (file: File, onProgress?: (progress: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${API_BASE_URL}/files/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to upload file');
  }
};

// List files
export const listFiles = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/files`);
    return response.data.files;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch files');
  }
};

// Get shared users for a file
export const getSharedUsers = async (fileId: number): Promise<SharedUser[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/files/${fileId}/shared-users`);
    return response.data.shared_users;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch shared users');
  }
};

// Update share permission
export const updateSharePermission = async (fileId: number, userId: number, permission: 'read' | 'write') => {
  try {
    await axios.put(`${API_BASE_URL}/files/${fileId}/share/${userId}`, {
      permission,
    });
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to update permission');
  }
};

// Remove share
export const removeShare = async (fileId: number, userId: number) => {
  try {
    await axios.delete(`${API_BASE_URL}/files/${fileId}/share/${userId}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to remove share');
  }
};

// ... rest of your existing functions ...



export const deleteFile = async (fileId: number) => {
  try {
    await axios.delete(`${API_BASE_URL}/files/${fileId}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to delete file');
  }
};

export const downloadFile = async (fileId: number) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/files/${fileId}/download`, {
      responseType: 'blob',
    });
    
    // Create a download link and trigger it
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', response.headers['content-disposition']?.split('filename=')[1] || 'download');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to download file');
  }
};

export const shareFile = async (fileId: number, email: string, permission: 'read' | 'write') => {
  try {
    await axios.post(`${API_BASE_URL}/files/${fileId}/share`, {
      email,
      permission,
    });
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to share file');
  }
};




export const getFileActivities = async (fileId?: number) => {
    try {
      const url = fileId 
        ? `${API_BASE_URL}/files/${fileId}/activities`
        : `${API_BASE_URL}/activities`;
      const response = await axios.get(url);
      return response.data.activities;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch activities');
    }
  };

  export const getFileMessages = async (fileId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/files/${fileId}/messages`);
      return response.data.messages;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch messages');
    }
  };

  export const sendFileMessage = async (fileId: number, content: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/files/${fileId}/messages`, {
        content,
      });
      return response.data.message;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to send message');
    }
  };




export const updateProfile = async (userData: FormData): Promise<void> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/auth/profile`, userData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    // Update local storage with new user data
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({
      ...currentUser,
      ...response.data.user
    }));

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Failed to update profile');
    }
    throw error;
  }
};
  