import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Star, Users, Play, MousePointerClick, Loader2, UserPlus, UserCheck, Clock, MessageCircle, ArrowLeft, Link2, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useState } from 'react';
import { getAssetUrl } from '../lib/utils';

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeText, setComposeText] = useState('');

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['publicProfile', id],
    queryFn: () => api.getPublicProfile(id!),
    enabled: !!id,
  });

  const followMut = useMutation({
    mutationFn: () => api.followUser(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['publicProfile', id] });
      qc.invalidateQueries({ queryKey: ['search'] });
      toast.success('Follow request sent!');
    },
    onError: (err: Error) => toast.error(err?.message || 'Failed to follow'),
  });

  const unfollowMut = useMutation({
    mutationFn: () => api.unfollowUser(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['publicProfile', id] });
      qc.invalidateQueries({ queryKey: ['search'] });
      qc.invalidateQueries({ queryKey: ['following'] });
      toast.success('Unfollowed');
    },
    onError: (err: Error) => toast.error(err?.message || 'Failed to unfollow'),
  });

  const messageMut = useMutation({
    mutationFn: (content: string) => api.sendMessage(Number(id), content),
    onSuccess: (data) => {
      setComposeOpen(false);
      setComposeText('');
      if (data.type === 'direct' && data.conversationId) {
        navigate('/messages');
        toast.success('Message sent!');
      } else {
        toast.success('Message request sent!');
      }
    },
    onError: (err: Error) => toast.error(err?.message || 'Failed to send message'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-24 space-y-4">
        <User size={48} className="mx-auto text-textSecondary opacity-30" />
        <p className="text-textSecondary">User not found</p>
        <button onClick={() => navigate(-1)} className="btn-primary text-sm">Go Back</button>
      </div>
    );
  }

  // If viewing own profile, redirect
  if (profile.isOwnProfile) {
    navigate('/profile', { replace: true });
    return null;
  }

  const followButton = () => {
    if (profile.followStatus === 'ACCEPTED') {
      return (
        <button
          onClick={() => unfollowMut.mutate()}
          disabled={unfollowMut.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium border border-primary/20 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/50 transition-colors"
          title="Click to unfollow"
        >
          {unfollowMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />}
          Following
        </button>
      );
    }
    if (profile.followStatus === 'PENDING') {
      return (
        <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surfaceHover text-textSecondary text-sm font-medium border border-border">
          <Clock size={15} /> Pending
        </span>
      );
    }
    return (
      <button
        onClick={() => followMut.mutate()}
        disabled={followMut.isPending}
        className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5"
      >
        {followMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
        Follow
      </button>
    );
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-textSecondary hover:text-textPrimary text-sm transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center overflow-hidden shrink-0">
            {profile.avatarUrl ? (
              <img
                src={getAssetUrl(profile.avatarUrl)!}
                alt={profile.username}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <User size={36} className="text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-textPrimary truncate">@{profile.username}</h2>
            {profile.contentNiche && (
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {profile.contentNiche}
              </span>
            )}
            {profile.createdAt && (
              <p className="text-xs text-textSecondary mt-1.5">
                Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          {followButton()}
          <button
            onClick={() => { setComposeOpen(true); setComposeText(''); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-textSecondary hover:border-primary hover:text-primary text-sm font-medium transition-colors"
          >
            <MessageCircle size={15} /> Message
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border">
          <div className="text-center p-3 rounded-xl bg-surfaceHover/50">
            <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1"><Star size={14} /></div>
            <p className="text-lg font-bold text-textPrimary">{profile.availablePoints.toLocaleString()}</p>
            <p className="text-[10px] uppercase tracking-wider text-textSecondary">Points</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-surfaceHover/50">
            <div className="flex items-center justify-center gap-1 text-primary mb-1"><Users size={14} /></div>
            <p className="text-lg font-bold text-textPrimary">{profile.followersCount}</p>
            <p className="text-[10px] uppercase tracking-wider text-textSecondary">Followers</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-surfaceHover/50">
            <div className="flex items-center justify-center gap-1 text-green-400 mb-1"><Link2 size={14} /></div>
            <p className="text-lg font-bold text-textPrimary">{profile.linksSubmitted}</p>
            <p className="text-[10px] uppercase tracking-wider text-textSecondary">Links</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-surfaceHover/50">
            <div className="flex items-center justify-center gap-1 text-blue-400 mb-1"><MousePointerClick size={14} /></div>
            <p className="text-lg font-bold text-textPrimary">{profile.totalClicks.toLocaleString()}</p>
            <p className="text-[10px] uppercase tracking-wider text-textSecondary">Clicks</p>
          </div>
        </div>
      </div>

      {/* Additional info */}
      <div className="card">
        <h4 className="text-sm font-semibold text-textSecondary uppercase tracking-wider mb-3">Activity</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-textSecondary text-sm">Following</span>
            <span className="text-textPrimary font-medium">{profile.followingCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-textSecondary text-sm">Communities Created</span>
            <span className="text-textPrimary font-medium">{profile.communitiesCreated}</span>
          </div>
          {profile.communitiesCreated > 0 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-textSecondary text-sm flex items-center gap-1.5"><Play size={13} /> Browse their communities</span>
              <button
                onClick={() => navigate(`/communities?creatorId=${profile.userId}&creatorName=${encodeURIComponent(profile.username)}`)}
                className="text-primary text-xs font-semibold hover:underline flex items-center gap-1"
              >
                View {profile.communitiesCreated} <ExternalLink size={10} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compose Message Modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setComposeOpen(false)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-textPrimary">Message @{profile.username}</h3>
              <button onClick={() => setComposeOpen(false)} className="text-textSecondary hover:text-textPrimary">✕</button>
            </div>
            <p className="text-xs text-textSecondary mb-3">
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
              onClick={() => composeText.trim() && messageMut.mutate(composeText.trim())}
              disabled={messageMut.isPending || !composeText.trim()}
              className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
            >
              {messageMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
              Send Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
