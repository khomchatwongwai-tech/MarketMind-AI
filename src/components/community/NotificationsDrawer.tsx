import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Heart,
  MessageSquare,
  UserPlus,
  Repeat2,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { CommunityNotification, CommunityUserProfile, FollowRequest } from '../../types/community';
import { CommunityService } from '../../services/community/communityService';

interface NotificationsDrawerProps {
  currentUser: CommunityUserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSelectPost?: (postId: string) => void;
  onSelectProfile?: (userId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSelectPost,
  onSelectProfile,
}) => {
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'MENTIONS' | 'FOLLOWS' | 'INTERACTIONS'>('ALL');

  const loadData = () => {
    const list = CommunityService.getLocalNotifications(currentUser.id);
    setNotifications(list);
    const reqs = CommunityService.getLocalFollowRequests(currentUser.id).filter((r) => r.status === 'PENDING');
    setFollowRequests(reqs);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, currentUser.id]);

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    CommunityService.markAllNotificationsAsRead(currentUser.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif: CommunityNotification) => {
    CommunityService.markNotificationAsRead(currentUser.id, notif.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );

    if (notif.postId && onSelectPost) {
      onSelectPost(notif.postId);
      onClose();
    } else if (notif.actorId && onSelectProfile) {
      onSelectProfile(notif.actorId);
      onClose();
    }
  };

  const handleFollowRequestResponse = async (requestId: string, approve: boolean) => {
    await CommunityService.respondToFollowRequest(currentUser.id, requestId, approve);
    loadData();
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'MENTIONS') return n.type === 'MENTION';
    if (filter === 'FOLLOWS') return n.type === 'NEW_FOLLOWER' || n.type === 'FOLLOW_REQUEST' || n.type === 'FOLLOW_ACCEPTED';
    if (filter === 'INTERACTIONS') return n.type === 'POST_REACTION' || n.type === 'NEW_COMMENT' || n.type === 'REPOST';
    return true;
  });

  const getIcon = (type: CommunityNotification['type']) => {
    switch (type) {
      case 'POST_REACTION':
        return <Heart className="w-3.5 h-3.5 text-rose-400" />;
      case 'NEW_COMMENT':
      case 'COMMENT_REPLY':
        return <MessageSquare className="w-3.5 h-3.5 text-blue-400" />;
      case 'NEW_FOLLOWER':
      case 'FOLLOW_ACCEPTED':
      case 'FOLLOW_REQUEST':
        return <UserPlus className="w-3.5 h-3.5 text-[#D4AF37]" />;
      case 'REPOST':
        return <Repeat2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'MENTION':
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#0f1013] border-l border-[#242424] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#242424] flex items-center justify-between bg-[#141518]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Social Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="p-1.5 text-slate-400 hover:text-[#D4AF37] rounded-lg transition"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="p-3 border-b border-[#242424] flex gap-1.5 bg-[#101114] overflow-x-auto text-[11px] font-bold">
          {(['ALL', 'MENTIONS', 'FOLLOWS', 'INTERACTIONS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg border transition ${
                filter === tab
                  ? 'bg-[rgba(212,175,55,0.15)] text-[#F2D675] border-[#D4AF37]'
                  : 'bg-[#16171b] text-slate-400 border-[#26272b] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Pending Follow Requests (Private Accounts) */}
          {followRequests.length > 0 && (
            <div className="bg-[#15161b] border border-[#2a2b30] rounded-xl p-3 flex flex-col gap-2">
              <span className="text-xs font-bold text-[#F2D675] flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-[#D4AF37]" />
                Pending Follow Requests ({followRequests.length})
              </span>
              <div className="space-y-2">
                {followRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between gap-2 p-2 bg-[#0c0d10] rounded-lg border border-[#222]">
                    <div className="flex items-center gap-2">
                      <img src={req.senderAvatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="text-xs font-bold text-white">{req.senderName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">@{req.senderUsername}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleFollowRequestResponse(req.id, true)}
                        className="px-2.5 py-1 bg-[#D4AF37] hover:bg-[#F2D675] text-black text-xs font-bold rounded-lg transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleFollowRequestResponse(req.id, false)}
                        className="px-2.5 py-1 bg-[#222] hover:bg-[#333] text-slate-300 text-xs rounded-lg transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications List */}
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">
              No notifications yet.
            </div>
          ) : (
            filteredNotifs.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                  notif.read
                    ? 'bg-[#0d0e11] border-[#1e1f23] hover:border-[#333]'
                    : 'bg-[#15171e] border-[rgba(212,175,55,0.35)] shadow-sm'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={notif.actorAvatarUrl}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover border border-[#2d2d2d]"
                  />
                  <span className="absolute -bottom-1 -right-1 p-0.5 bg-[#0f1013] rounded-full border border-[#242424]">
                    {getIcon(notif.type)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#e0e4eb] leading-relaxed break-words">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
