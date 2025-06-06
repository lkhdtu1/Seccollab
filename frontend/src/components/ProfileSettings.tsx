import React, { useState } from 'react';
import { Save, X, User, Sparkles, Palette } from 'lucide-react';



export const AVATAR_OPTIONS = [
  // Human Avatars
  {
    id: 1,
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f5',
    label: 'Default 1',
    category: 'Human'
  },
  {
    id: 2,
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede',
    label: 'Default 2',
    category: 'Human'
  },
  {
    id: 3,
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper&backgroundColor=ffdfbf',
    label: 'Default 3',
    category: 'Human'
  },  // Pixel Art Style
  {
    id: 4,
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Luna&backgroundColor=b6e3f4',
    label: 'Pixel 1',
    category: 'Pixel'
  },
  {
    id: 5,
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Nova&backgroundColor=c0aede',
    label: 'Pixel 2',
    category: 'Pixel'
  },
  // Robot Style
  {
    id: 6,
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Buddy&backgroundColor=ffdfbf',
    label: 'Robot 1',
    category: 'Robot'
  },
  {
    id: 7,
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Chip&backgroundColor=b6e3f4',
    label: 'Robot 2',
    category: 'Robot'
  },
  // Identicon Style
  {
    id: 8,
    url: 'https://api.dicebear.com/7.x/identicon/svg?seed=Galaxy&backgroundColor=c0aede',
    label: 'Abstract 1',
    category: 'Abstract'
  },
  {
    id: 9,
    url: 'https://api.dicebear.com/7.x/identicon/svg?seed=Nova&backgroundColor=ffdfbf',
    label: 'Abstract 2',
    category: 'Abstract'
  },
  // Micah Style
  {
    id: 10,
    url: 'https://api.dicebear.com/7.x/micah/svg?seed=Alex&backgroundColor=b6e3f4',
    label: 'Minimal 1',
    category: 'Minimal'
  },
  {
    id: 11,
    url: 'https://api.dicebear.com/7.x/micah/svg?seed=Sam&backgroundColor=c0aede',
    label: 'Minimal 2',
    category: 'Minimal'
  },
  // Fun Style
  {
    id: 12,
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy&backgroundColor=ffdfbf',
    label: 'Emoji 1',
    category: 'Fun'
  },
  {
    id: 13,
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cool&backgroundColor=b6e3f4',
    label: 'Emoji 2',
    category: 'Fun'
  },
  // Adventure Time Style
  {
    id: 14,
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Finn&backgroundColor=c0aede',
    label: 'Adventure 1',
    category: 'Adventure'
  },
  {
    id: 15,
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jake&backgroundColor=ffdfbf',
    label: 'Adventure 2',
    category: 'Adventure'
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
  const [selectedCategory, setSelectedCategory] = useState<string>('Human');

  const categories = ['Human', 'Pixel', 'Robot', 'Abstract', 'Minimal', 'Fun', 'Adventure'];
  const filteredAvatars = AVATAR_OPTIONS.filter(avatar => avatar.category === selectedCategory);

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 max-w-lg w-full p-8 transform transition-all duration-300 scale-100">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Profile Settings
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Customize your profile appearance</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 rounded-xl transition-all duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm text-red-700 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30 rounded-2xl border border-red-200 dark:border-red-700/50 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Choose Your Avatar</span>
              </label>
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-purple-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs bg-white/60 dark:bg-gray-700/60 border border-gray-200/60 dark:border-gray-600/60 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-sm"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-3 p-4 bg-gray-50/60 dark:bg-gray-800/60 rounded-2xl border border-gray-200/30 dark:border-gray-700/30 backdrop-blur-sm">
              {filteredAvatars.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-110 hover:shadow-lg ${
                    selectedAvatar === avatar.url 
                      ? 'ring-3 ring-indigo-500 shadow-lg scale-105' 
                      : 'hover:ring-2 hover:ring-indigo-400/50'
                  }`}
                  onClick={() => setSelectedAvatar(avatar.url)}
                  title={avatar.label}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.label}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {selectedAvatar === avatar.url && (
                    <div className="absolute inset-0 bg-indigo-500/20 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Display Name
            </label>
            <div className="relative">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 dark:bg-gray-700/60 border border-gray-200/60 dark:border-gray-600/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 text-gray-900 dark:text-gray-100 backdrop-blur-sm placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter your display name"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <User className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 bg-gray-100/60 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 rounded-2xl text-gray-600 dark:text-gray-400 backdrop-blur-sm cursor-not-allowed"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2"></p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-700/60 border border-gray-200/60 dark:border-gray-600/60 rounded-2xl hover:bg-gray-50/80 dark:hover:bg-gray-600/80 transition-all duration-200 backdrop-blur-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-2xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;