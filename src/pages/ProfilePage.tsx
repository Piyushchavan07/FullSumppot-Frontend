import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Star, Users, Play, Heart, Loader2, MessageCircle, Pencil, Eye, X, Send } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { getAssetUrl } from '../lib/utils';
import type { FollowUser } from '../types';

const niches = [
  'Gaming', 'Tech', 'Education', 'Music', 'Comedy',
  'Vlogging', 'Finance', 'Fitness', 'Food', 'Travel', 'Other',
];

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'stats' | 'followers' | 'following'>(
    (searchParams.get('tab') as 'stats' | 'followers' | 'following') ?? 'stats'
  );
  const [showViewer, setShowViewer] = useState(false);
  const [composeTarget, setComposeTarget] = useState<{ id: number; username: string } | null>(null);
  const [composeText, setComposeText] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editNiche, setEditNiche] = useState('');

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard(),
  });

  const displayUser = dashboardData ?? user;

  const updateProfileMut = useMutation({
    mutationFn: (data: { username: string; contentNiche: string }) => api.updateUserProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      if (user) {
        updateUser({
          ...user,
          username: editUsername.trim(),
          contentNiche: editNiche,
          niche: editNiche
        });
      }
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update profile');
    }
  });

  const handleStartEdit = () => {
    setEditUsername(displayUser?.username ?? '');
    setEditNiche(displayUser?.contentNiche ?? displayUser?.niche ?? '');
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editUsername.trim() || editUsername.trim().length < 3) {
      toast.error('Username must be at least 3 characters long');
      return;
    }
    if (!editNiche) {
      toast.error('Please select a niche');
      return;
    }
    updateProfileMut.mutate({
      username: editUsername.trim(),
      contentNiche: editNiche
    });
  };

  const uploadMut = useMutation({
    mutationFn: (file: File) => api.uploadAvatar(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Avatar uploaded successfully!');
    },
    onError: () => toast.error('Failed to upload image'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      uploadMut.mutate(file);
    }
  };

  const { data: followers, isLoading: loadingFollowers } = useQuery({
    queryKey: ['followers'],
    queryFn: () => api.followers(),
    enabled: tab === 'followers'
  });

  const { data: following, isLoading: loadingFollowing } = useQuery({
    queryKey: ['following'],
    queryFn: () => api.following(),
    enabled: tab === 'following'
  });

  const messageMut = useMutation({
    mutationFn: ({ recipientId, content }: { recipientId: number; content: string }) =>
      api.sendMessage(recipientId, content),
    onSuccess: (data) => {
      setComposeTarget(null);
      setComposeText('');
      if (data.type === 'direct') {
        navigate('/messages');
        toast.success('Message sent! Opening conversation...');
      } else {
        toast.success('Message request sent!');
      }
    },
    onError: (err: Error) => toast.error(err?.message || 'Failed to send message'),
  });

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-2xl font-bold text-textPrimary">Profile</h2>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            <div 
              onClick={() => displayUser?.avatarUrl && setShowViewer(true)}
              className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-all group/avatar relative"
            >
              {displayUser?.avatarUrl ? (
                <img src={getAssetUrl(displayUser.avatarUrl)!} alt={displayUser.username} className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-primary" />
              )}
              {displayUser?.avatarUrl && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye size={16} className="text-white" />
                </div>
              )}
              {uploadMut.isPending && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <Loader2 size={16} className="animate-spin text-white" />
                </div>
              )}
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary text-white shadow-lg hover:scale-110 transition-transform z-20"
              title="Upload Profile Picture"
            >
              <Pencil size={10} />
            </button>
          </div>
          <div>
            <h3 className="text-xl font-bold text-textPrimary">{displayUser?.username}</h3>
            <p className="text-textSecondary text-sm">{displayUser?.email}</p>
            <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {displayUser?.contentNiche || displayUser?.niche}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1"><Star size={16} /></div>
            <p className="text-xl font-bold text-textPrimary">{dashboardData?.availablePoints ?? displayUser?.availablePoints ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-textSecondary">Points</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1"><Users size={16} /></div>
            <p className="text-xl font-bold text-textPrimary">{dashboardData?.followersCount ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-textSecondary">Followers</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1"><Users size={16} /></div>
            <p className="text-xl font-bold text-textPrimary">{dashboardData?.followingCount ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-textSecondary">Following</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-400 mb-1"><Play size={16} /></div>
            <p className="text-xl font-bold text-textPrimary">{dashboardData?.communitiesJoined ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-textSecondary">Joined</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-border mb-6 overflow-x-auto whitespace-nowrap scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <button 
          onClick={() => setTab('stats')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors shrink-0 ${tab === 'stats' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setTab('followers')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors shrink-0 ${tab === 'followers' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'}`}
        >
          Followers ({dashboardData?.followersCount ?? 0})
        </button>
        <button 
          onClick={() => setTab('following')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors shrink-0 ${tab === 'following' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'}`}
        >
          Following ({dashboardData?.followingCount ?? 0})
        </button>
      </div>

      {tab === 'stats' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {!isEditing ? (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-textSecondary uppercase tracking-wider">Account Info</h4>
                <button
                  onClick={handleStartEdit}
                  className="text-primary hover:text-primary/90 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Pencil size={12} /> Edit Profile
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-textSecondary text-sm">Username</span>
                  <span className="text-textPrimary font-medium">@{displayUser?.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-textSecondary text-sm">Email</span>
                  <span className="text-textPrimary font-medium">{displayUser?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-textSecondary text-sm">Niche</span>
                  <span className="text-textPrimary font-medium">{displayUser?.contentNiche || displayUser?.niche}</span>
                </div>
                {displayUser?.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-textSecondary text-sm">Joined</span>
                    <span className="text-textPrimary font-medium">{new Date(displayUser.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card space-y-4">
              <h4 className="text-sm font-semibold text-textSecondary uppercase tracking-wider mb-2">Edit Profile</h4>
              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  className="input-field"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Username"
                />
              </div>
              <div>
                <label className="label">Content Niche</label>
                <select
                  className="input-field"
                  value={editNiche}
                  onChange={(e) => setEditNiche(e.target.value)}
                >
                  <option value="">Select your niche…</option>
                  {niches.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={updateProfileMut.isPending}
                  className="flex-1 px-4 py-2 rounded-xl border border-border text-textSecondary hover:text-textPrimary hover:bg-surfaceHover transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateProfileMut.isPending}
                  className="flex-1 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  {updateProfileMut.isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'followers' && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {loadingFollowers ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : !followers?.length ? (
            <div className="text-center py-12 text-textSecondary card border-dashed">
              <Heart size={32} className="mx-auto mb-2 opacity-20" />
              <p>No followers yet</p>
            </div>
          ) : (
            followers.map((u: FollowUser) => (
              <div
                key={u.userId}
                className="card flex items-center justify-between gap-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {u.username[0].toUpperCase()}
                  </div>
                  <span className="font-medium text-textPrimary">@{u.username}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/communities?creator=${u.username}`)}
                    className="text-[10px] px-2.5 py-1.5 rounded-lg border border-border text-textSecondary hover:border-primary hover:text-primary transition-colors"
                  >
                    Communities
                  </button>
                  <button
                    onClick={() => { setComposeTarget({ id: Number(u.userId), username: u.username }); setComposeText(''); }}
                    className="p-1.5 rounded-lg border border-border text-textSecondary hover:border-primary hover:text-primary transition-colors"
                    title="Message"
                  >
                    <MessageCircle size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'following' && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {loadingFollowing ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : !following?.length ? (
            <div className="text-center py-12 text-textSecondary card border-dashed">
              <Users size={32} className="mx-auto mb-2 opacity-20" />
              <p>You aren't following anyone yet</p>
            </div>
          ) : (
            following.map((u: FollowUser) => {
              const visitedKey = `visited_creator_${u.userId}`;
              const visitedCount = parseInt(localStorage.getItem(visitedKey) || '0');
              const newCount = Math.max(0, (u.communityCount ?? 0) - visitedCount);
              return (
              <div
                key={u.userId}
                className="card flex items-center justify-between gap-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/20">
                    {u.avatarUrl ? (
                      <img src={getAssetUrl(u.avatarUrl)!} alt={u.username} className="w-full h-full object-cover" />
                    ) : (
                      <span>{u.username[0].toUpperCase()}</span>
                    )}
                  </div>
                  <span className="font-medium text-textPrimary">@{u.username}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      localStorage.setItem(visitedKey, String(u.communityCount ?? 0));
                      navigate(`/communities?creatorId=${u.userId}&creatorName=${encodeURIComponent(u.username)}`);
                    }}
                    className="relative text-[10px] px-2.5 py-1.5 rounded-lg border border-border text-textSecondary hover:border-primary hover:text-primary transition-colors"
                  >
                    Communities
                    {newCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {newCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => { setComposeTarget({ id: Number(u.userId), username: u.username }); setComposeText(''); }}
                    className="p-1.5 rounded-lg border border-border text-textSecondary hover:border-primary hover:text-primary transition-colors"
                    title="Message"
                  >
                    <MessageCircle size={14} />
                  </button>
                </div>
              </div>
              );
            })
          )}
        </div>
      )}
      {/* Compose Message Modal */}
      {composeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setComposeTarget(null)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-textPrimary">
                Message @{composeTarget.username}
              </h3>
              <button onClick={() => setComposeTarget(null)} className="text-textSecondary hover:text-textPrimary">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-textSecondary mb-3">
              {/* Will show as direct message or request based on follow status */}
              This will be sent as a direct message or message request.
            </p>
            <textarea
              className="input-field resize-none w-full"
              rows={4}
              placeholder="Write your message..."
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              autoFocus
            />
            <button
              onClick={() => composeText.trim() && messageMut.mutate({ recipientId: composeTarget.id, content: composeText.trim() })}
              disabled={messageMut.isPending || !composeText.trim()}
              className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
            >
              {messageMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Send Message
            </button>
          </div>
        </div>
      )}
      {/* Image Viewer Modal */}
      {showViewer && displayUser?.avatarUrl && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowViewer(false)}
        >
          <button 
            className="absolute top-6 right-6 p-2 rounded-full bg-surfaceHover text-textPrimary hover:bg-surface transition-colors"
            onClick={() => setShowViewer(false)}
          >
            <X size={24} />
          </button>
          <div className="relative w-[80vw] h-[80vw] max-w-[500px] max-h-[500px] rounded-full overflow-hidden border-4 border-primary/30 shadow-2xl animate-in zoom-in-95 duration-300">
            <img 
              src={getAssetUrl(displayUser.avatarUrl)!} 
              alt={displayUser.username} 
              className="w-full h-full object-cover"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
