import React, { useState } from 'react';
import {
  X,
  Camera,
  CheckCircle2,
  Shield,
  Lock,
  Globe,
  Tag,
  Save,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import {
  CommunityUserProfile,
  UserPrivacySettings,
  PrivacyAudience,
  WallPrivacyAudience,
} from '../../types/community';
import { CommunityService } from '../../services/community/communityService';
import { CommunitySafetyGuard } from '../../services/community/safetyGuard';

interface EditProfileModalProps {
  currentUser: CommunityUserProfile;
  onClose: () => void;
  onProfileUpdated: (updated: CommunityUserProfile) => void;
}

const AVAILABLE_INTERESTS = [
  'Equities',
  'Options Spreads',
  'Macroeconomics',
  'Quantitative Models',
  '0DTE Volatility',
  'Futures',
  'Crypto Assets',
  'Dividend Growth',
  'Fixed Income',
  'Technical Analysis',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  currentUser,
  onClose,
  onProfileUpdated,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
  const [coverImageUrl, setCoverImageUrl] = useState(currentUser.coverImageUrl || '');
  const [interests, setInterests] = useState<string[]>(currentUser.investingInterests || []);

  // Privacy Settings state
  const [privacy, setPrivacy] = useState<UserPrivacySettings>(
    currentUser.privacySettings || {
      isPrivateAccount: false,
      whoCanFollow: 'EVERYONE',
      whoCanComment: 'EVERYONE',
      whoCanMention: 'EVERYONE',
      whoCanViewProfileWall: 'EVERYONE',
      hideFollowLists: false,
      emailNotifications: true,
      pushNotifications: true,
    }
  );

  const [activeTab, setActiveTab] = useState<'profile' | 'privacy'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Avatar Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const val = CommunitySafetyGuard.validateImageFile(file);
    if (!val.valid) {
      setError(val.error || 'Invalid avatar image');
      return;
    }
    try {
      const compressed = await CommunitySafetyGuard.compressImage(file, 400, 400, 0.85);
      setAvatarUrl(compressed);
      setError(null);
    } catch {
      setError('Failed to compress avatar image');
    }
  };

  // Cover Image Upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const val = CommunitySafetyGuard.validateImageFile(file);
    if (!val.valid) {
      setError(val.error || 'Invalid cover image');
      return;
    }
    try {
      const compressed = await CommunitySafetyGuard.compressImage(file, 1200, 400, 0.82);
      setCoverImageUrl(compressed);
      setError(null);
    } catch {
      setError('Failed to compress cover image');
    }
  };

  const toggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter((i) => i !== tag));
    } else {
      if (interests.length < 5) {
        setInterests([...interests, tag]);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    try {
      setIsSaving(true);
      setError(null);

      // Validate username
      const val = CommunitySafetyGuard.validateUsername(username);
      if (!val.valid) {
        throw new Error(val.error);
      }

      const updated = await CommunityService.updateProfile(currentUser.id, {
        name: name.trim(),
        username: val.normalized,
        bio: bio.trim(),
        website: website.trim() || undefined,
        avatarUrl,
        coverImageUrl: coverImageUrl || undefined,
        investingInterests: interests,
        privacySettings: privacy,
      });

      onProfileUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0f1013] border border-[#2d2d2d] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col my-8">
        {/* Header */}
        <div className="p-4 border-b border-[#242424] flex items-center justify-between bg-[#141518]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Customize Trader Profile</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-[#242424] bg-[#111215] text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 text-center transition border-b-2 ${
              activeTab === 'profile'
                ? 'border-[#D4AF37] text-[#F2D675] bg-[#17181c]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Public Identity &amp; Bio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2.5 text-center transition border-b-2 ${
              activeTab === 'privacy'
                ? 'border-[#D4AF37] text-[#F2D675] bg-[#17181c]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Privacy &amp; Permissions
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'profile' ? (
            <div className="space-y-4">
              {/* Cover Photo Header */}
              <div className="relative h-28 w-full bg-[#1c1d22] rounded-xl overflow-hidden border border-[#2a2a2a]">
                {coverImageUrl ? (
                  <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[#1b1c22] to-[#121316]" />
                )}
                <label className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black text-white text-xs rounded-lg cursor-pointer flex items-center gap-1.5 transition">
                  <Camera className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Change Cover</span>
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                </label>

                {/* Avatar Overlap */}
                <div className="absolute bottom-2 left-3 flex items-end gap-2">
                  <div className="relative group">
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37] shadow-xl"
                    />
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center cursor-pointer transition">
                      <Camera className="w-4 h-4 text-white" />
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Names & Username */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-[#15161a] border border-[#2a2b30] text-white text-xs px-3 py-2 rounded-xl focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Unique Handle (@)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-[#15161a] border border-[#2a2b30] text-white font-mono text-xs px-3 py-2 rounded-xl focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Biography */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <label className="text-slate-300 font-medium">Trader Bio &amp; Strategy</label>
                  <span className="text-[10px] text-slate-500 font-mono">{bio.length} / 300</span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder="Describe your quantitative methodology, asset preferences, and trading style..."
                  className="w-full bg-[#15161a] border border-[#2a2b30] text-white text-xs p-3 rounded-xl focus:border-[#D4AF37] resize-none"
                />
              </div>

              {/* Website */}
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Website or Research Link</label>
                <div className="flex items-center relative">
                  <Globe className="w-3.5 h-3.5 absolute left-3 text-slate-500" />
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourdomain.com"
                    className="w-full bg-[#15161a] border border-[#2a2b30] text-white text-xs pl-8 pr-3 py-2 rounded-xl focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Investing Interests Tags */}
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Investing Interests (Select up to 5)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_INTERESTS.map((tag) => {
                    const active = interests.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleInterest(tag)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition font-mono ${
                          active
                            ? 'bg-[rgba(212,175,55,0.15)] text-[#F2D675] border-[#D4AF37]'
                            : 'bg-[#15161a] text-slate-400 border-[#2a2b30] hover:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Private Account Switch */}
              <div className="p-3.5 bg-[#141519] border border-[#26272c] rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-[#D4AF37]" />
                    Private Profile Wall
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    When active, new users must send follow requests for your approval before viewing your wall posts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.isPrivateAccount}
                  onChange={(e) =>
                    setPrivacy((prev) => ({
                      ...prev,
                      isPrivateAccount: e.target.checked,
                      whoCanFollow: e.target.checked ? 'REQUEST_ONLY' : 'EVERYONE',
                    }))
                  }
                  className="w-5 h-5 accent-[#D4AF37]"
                />
              </div>

              {/* Who can comment */}
              <div className="p-3.5 bg-[#141519] border border-[#26272c] rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">Who Can Comment on Your Posts</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Control audience permissions for your publications.</p>
                </div>
                <select
                  value={privacy.whoCanComment}
                  onChange={(e) =>
                    setPrivacy((prev) => ({ ...prev, whoCanComment: e.target.value as PrivacyAudience }))
                  }
                  className="bg-[#1c1e24] border border-[#333] text-white text-xs px-2 py-1.5 rounded-lg"
                >
                  <option value="EVERYONE">Everyone</option>
                  <option value="FOLLOWERS_ONLY">Followers Only</option>
                  <option value="NOBODY">Nobody (Locked)</option>
                </select>
              </div>

              {/* Who can mention */}
              <div className="p-3.5 bg-[#141519] border border-[#26272c] rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">Who Can Mention (@) You</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Control who can tag your username in market feeds.</p>
                </div>
                <select
                  value={privacy.whoCanMention}
                  onChange={(e) =>
                    setPrivacy((prev) => ({ ...prev, whoCanMention: e.target.value as PrivacyAudience }))
                  }
                  className="bg-[#1c1e24] border border-[#333] text-white text-xs px-2 py-1.5 rounded-lg"
                >
                  <option value="EVERYONE">Everyone</option>
                  <option value="FOLLOWERS_ONLY">Followers Only</option>
                  <option value="NOBODY">Nobody</option>
                </select>
              </div>

              {/* Hide Follow Lists */}
              <div className="p-3.5 bg-[#141519] border border-[#26272c] rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">Hide Followers &amp; Following Lists</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Prevent other members from viewing your network roster.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.hideFollowLists}
                  onChange={(e) =>
                    setPrivacy((prev) => ({ ...prev, hideFollowLists: e.target.checked }))
                  }
                  className="w-5 h-5 accent-[#D4AF37]"
                />
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#242424]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] hover:from-[#F2D675] hover:to-[#D4AF37] text-black font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
