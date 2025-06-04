import React, { useState } from 'react';
import { Mail } from 'lucide-react';

interface FileShareDialogProps {
  fileId: number;
  fileName: string;
  onShare: (email: string, permission: 'read' | 'write') => Promise<void>;
  onClose: () => void;
}

const FileShareDialog: React.FC<FileShareDialogProps> = ({
  fileId,
  fileName,
  onShare,
  onClose
}) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'read' | 'write'>('read');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await onShare(email, permission);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to share file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Share "{fileName}"
        </h3>

        {success ? (
          <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
            File shared successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Share with (email)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Permission level
              </label>
              <div className="mt-2 space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-indigo-600"
                    name="permission"
                    value="read"
                    checked={permission === 'read'}
                    onChange={(e) => setPermission(e.target.value as 'read' | 'write')}
                  />
                  <span className="ml-2">Read only</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-indigo-600"
                    name="permission"
                    value="write"
                    checked={permission === 'write'}
                    onChange={(e) => setPermission(e.target.value as 'read' | 'write')}
                  />
                  <span className="ml-2">Can edit</span>
                </label>
              </div>
            </div>

            <div className="mt-5 sm:mt-6 flex space-x-3">
              <button
                type="button"
                className="flex-1 justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FileShareDialog;