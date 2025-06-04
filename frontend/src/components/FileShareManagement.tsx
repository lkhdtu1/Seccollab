import React, { useState, useEffect } from 'react';
import { UserCircle, X, Edit2, Check } from 'lucide-react';

interface ShareUser {
  id: number;
  name: string;
  email: string;
  permission: 'read' | 'write';
}

interface FileShareManagementProps {
  fileId: number;
  fileName: string;
  sharedUsers: ShareUser[];
  onUpdatePermission: (userId: number, permission: 'read' | 'write') => Promise<void>;
  onRemoveShare: (userId: number) => Promise<void>;
  onClose: () => void;
}

const FileShareManagement: React.FC<FileShareManagementProps> = ({
  fileId,
  fileName,
  sharedUsers,
  onUpdatePermission,
  onRemoveShare,
  onClose
}) => {
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePermissionChange = async (userId: number, newPermission: 'read' | 'write') => {
    setLoading(userId);
    setError(null);
    try {
      await onUpdatePermission(userId, newPermission);
      setEditingUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update permission');
    } finally {
      setLoading(null);
    }
  };

  const handleRemoveShare = async (userId: number) => {
    setLoading(userId);
    setError(null);
    try {
      await onRemoveShare(userId);
    } catch (err: any) {
      setError(err.message || 'Failed to remove share');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Manage Access - {fileName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {sharedUsers.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              This file hasn't been shared with anyone yet
            </p>
          ) : (
            sharedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <UserCircle className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {editingUser === user.id ? (
                    <select
                      value={user.permission}
                      onChange={(e) => handlePermissionChange(user.id, e.target.value as 'read' | 'write')}
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="read">Read</option>
                      <option value="write">Write</option>
                    </select>
                  ) : (
                    <span className="text-sm text-gray-600">
                      {user.permission === 'read' ? 'Can read' : 'Can edit'}
                    </span>
                  )}

                  {loading === user.id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500" />
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        {editingUser === user.id ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Edit2 className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRemoveShare(user.id)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FileShareManagement;