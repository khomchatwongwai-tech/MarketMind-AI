import React, { useState } from 'react';
import { X, Search, CheckCircle2, UserCheck, UserPlus, Lock } from 'lucide-react';
import { CommunityUserProfile, FollowRelationship } from '../../types/community';
import { CommunityService } from '../../services/community/communityService';

interface FollowListModalProps {
  type: 'FOLLOWERS' | 'FOLLOWING';
  profileUser: CommunityUserProfile;
  currentUser: CommunityUserProfile;
  onClose: () => void;
  onSelectUser?: (userId: string) => void;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
  type,
  profileUser,
  currentUser,
  onClose,
  onSelectUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Check privacy
  const isOwner = currentUser.id === profileUser.id;
  const isHidden = profileUser.privacySettings?.hideFollowLists && !isOwner;

  const rawList: FollowRelationship[] =
    type === 'FOLLOWING'
      ? CommunityService.getLocalFollows(profileUser.id)
      : []; // For followers, retrieve relationships

  const filteredList = rawList.filter((item) => {
    const term = searchQuery.toLowerCase();
    const name = type === 'FOLLOWING' ? item.followingUsername : item.followerUsername;
    return name.toLowerCase().includes(term);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f1013] border border-[#2d2d2d] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#242424] flex items-center justify-between bg-[#141518]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {type === 'FOLLOWERS' ? 'Followers' : 'Following'} ({type === 'FOLLOWERS' ? profileUser.followerCount : profileUser.followingCount})
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isHidden ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
            <Lock className="w-8 h-8 text-[#D4AF37]" />
            <h4 className="text-sm font-bold text-white">List is Private</h4>
            <p className="text-xs max-w-xs">
              This member has configured their privacy settings to keep their {type.toLowerCase()} list private.
            </p>
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-3 overflow-y-auto">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${type.toLowerCase()}...`}
                className="w-full bg-[#15161a] border border-[#292a30] text-white text-xs pl-8 pr-3 py-2 rounded-xl focus:border-[#D4AF37]"
              />
            </div>

            {/* List Items */}
            <div className="space-y-2">
              {filteredList.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 font-mono">
                  No {type.toLowerCase()} found.
                </div>
              ) : (
                filteredList.map((item) => {
                  const targetId = type === 'FOLLOWING' ? item.followingId : item.followerId;
                  const targetUsername = type === 'FOLLOWING' ? item.followingUsername : item.followerUsername;
                  const avatar = type === 'FOLLOWING' ? item.followerAvatarUrl : item.followerAvatarUrl;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-[#15161a] transition"
                    >
                      <div
                        onClick={() => {
                          if (onSelectUser) onSelectUser(targetId);
                          onClose();
                        }}
                        className="flex items-center gap-2.5 cursor-pointer"
                      >
                        <img
                          src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-[#2a2a2a]"
                        />
                        <span className="text-xs font-bold text-white hover:text-[#F2D675] font-mono">
                          @{targetUsername}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
