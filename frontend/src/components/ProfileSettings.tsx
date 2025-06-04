import React, { useState, useRef } from 'react';
import { Camera, Save, X } from 'lucide-react';



export const AVATAR_OPTIONS = [
  // Human Avatars
  {
    id: 1,
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f5',
    label: 'Default 1'
  },
  {
    id: 2,
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede',
    label: 'Default 2'
  },
  {
    id: 3,
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper&backgroundColor=ffdfbf',
    label: 'Default 3'
  },
  // Pixel Art Style
  {
    id: 4,
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Luna&backgroundColor=b6e3f4',
    label: 'Pixel 1'
  },
  {
    id: 5,
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Nova&backgroundColor=c0aede',
    label: 'Pixel 2'
  },
  // Robot Style
  {
    id: 6,
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Buddy&backgroundColor=ffdfbf',
    label: 'Robot 1'
  },
  {
    id: 7,
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Chip&backgroundColor=b6e3f4',
    label: 'Robot 2'
  },
  // Identicon Style
  {
    id: 8,
    url: 'https://api.dicebear.com/7.x/identicon/svg?seed=Galaxy&backgroundColor=c0aede',
    label: 'Abstract 1'
  },
  {
    id: 9,
    url: 'https://api.dicebear.com/7.x/identicon/svg?seed=Nova&backgroundColor=ffdfbf',
    label: 'Abstract 2'
  },
  // Micah Style
  {
    id: 10,
    url: 'https://api.dicebear.com/7.x/micah/svg?seed=Alex&backgroundColor=b6e3f4',
    label: 'Minimal 1'
  },
  {
    id: 11,
    url: 'https://api.dicebear.com/7.x/micah/svg?seed=Sam&backgroundColor=c0aede',
    label: 'Minimal 2'
  },
  // Fun Style
  {
    id: 12,
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy&backgroundColor=ffdfbf',
    label: 'Emoji 1'
  },
  {
    id: 13,
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cool&backgroundColor=b6e3f4',
    label: 'Emoji 2'
  },
  // Adventure Time Style
  {
    id: 14,
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Finn&backgroundColor=c0aede',
    label: 'Adventure 1'
  },
  {
    id: 15,
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jake&backgroundColor=ffdfbf',
    label: 'Adventure 2'
  }
];




interface ProfileSettingsProps {
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  onUpdateProfile: (data: FormData) => Promise<void>;
  onClose: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  user,
  onUpdateProfile,
  onClose
}) => {
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || AVATAR_OPTIONS[0].url);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', name);
      if (selectedAvatar) {
        formData.append('avatar', selectedAvatar);
      }

      await onUpdateProfile(formData);
      // Update local avatar state if needed
      user.avatar = selectedAvatar;
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Profile Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Avatar
            </label>
            <div className="grid grid-cols-5 gap-4">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  className={`relative rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-500 ${
                    selectedAvatar === avatar.url ? 'ring-2 ring-indigo-600' : ''
                  }`}
                  onClick={() => setSelectedAvatar(avatar.url)}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.label}
                    className="w-full h-full object-cover"
                  />
                  {selectedAvatar === avatar.url && (
                    <div className="absolute inset-0 bg-indigo-600 bg-opacity-20" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Email (Disabled) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;