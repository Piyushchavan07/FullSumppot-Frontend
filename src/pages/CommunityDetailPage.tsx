import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, ExternalLink, Plus, MousePointerClick, X, Loader2, ArrowLeft, Pencil, Trash2, User, Eye, Camera, Heart, MessageCircle, Send, ChevronDown, ChevronUp, UserPlus, Megaphone, Crown } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type { Link as LinkType } from '../types';

import { getAssetUrl } from '../lib/utils';

const linkSchema = z.object({
  youtubeUrl: z.string().url('Must be a valid URL').refine(
    (v) => v.includes('youtube') || v.includes('youtu.be'),
    { message: 'Must be a YouTube URL' }
  ),
  title: z.string().min(3, 'Title must be at least 3 characters'),
});

type LinkFormData = z.infer<typeof linkSchema>;

function LinkCard({
  link,
  onClick,
  isCreator,
  onEdit,
  onDelete,
}: {
  link: LinkType;
  onClick: (id: string | number, url: string) => void;
  isCreator?: boolean;
  onEdit?: (link: LinkType) => void;
  onDelete?: (id: string | number) => void;
}) {
  const navigate = useNavigate();
  const videoId = link.url?.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
  const thumb = link.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '');
  const [showComments, setShowComments] = useState(false);
  const [showSupporters, setShowSupporters] = useState(false);
  const [commentText, setCommentText] = useState('');
  const qc = useQueryClient();

  const { data: likeData } = useQuery({
    queryKey: ['linkLikes', link.linkId],
    queryFn: () => api.getLinkLikes(link.linkId),
  });

  const { data: comments } = useQuery({
    queryKey: ['linkComments', link.linkId],
    queryFn: () => api.getLinkComments(link.linkId),
    enabled: showComments,
  });

  const { data: commentCount } = useQuery({
    queryKey: ['linkCommentCount', link.linkId],
    queryFn: async () => {
      const res = await api.getLinkComments(link.linkId);
      return res.length;
    },
  });

  const { data: supportersData, isLoading: loadingSupporters } = useQuery({
    queryKey: ['linkClickers', link.linkId],
    queryFn: () => api.getLinkClickers(link.linkId),
    enabled: showSupporters && !!isCreator,
  });

  const likeMut = useMutation({
    mutationFn: () => api.toggleLinkLike(link.linkId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['linkLikes', link.linkId] }),
  });

  const commentMut = useMutation({
    mutationFn: (content: string) => api.addLinkComment(link.linkId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['linkComments', link.linkId] });
      qc.invalidateQueries({ queryKey: ['linkCommentCount', link.linkId] });
      setCommentText('');
    },
    onError: () => toast.error('Failed to post comment'),
  });

  const deleteCommentMut = useMutation({
    mutationFn: (commentId: number) => api.deleteLinkComment(link.linkId, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['linkComments', link.linkId] }),
  });

  const followMut = useMutation({
    mutationFn: (userId: number) => api.followUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['linkClickers', link.linkId] });
      toast.success('Follow request sent!');
    },
    onError: (err: Error) => toast.error(err?.message || 'Failed to follow'),
  });

  const [shoutedOut, setShoutedOut] = useState<Set<number>>(new Set());

  const shoutOutMut = useMutation({
    mutationFn: (userId: number) => api.shoutOut(link.linkId, userId),
    onSuccess: (_data, userId) => {
      setShoutedOut(prev => new Set(prev).add(userId));
      toast.success('Shout out sent! 🎉');
    },
    onError: () => toast.error('Failed to send shout out'),
  });

  return (
    <div className="card hover:border-border/80 transition-colors group">
      <div className="flex gap-4">
        <button
          onClick={() => onClick(link.linkId, link.url)}
          className="relative shrink-0 w-28 h-16 rounded overflow-hidden bg-surfaceHover"
        >
          {thumb && (
            <img src={thumb} alt={link.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink size={20} className="text-white" />
          </div>
        </button>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-textPrimary truncate">{link.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <div 
              onClick={() => link.userId && navigate(`/user/${link.userId}`)}
              className="flex items-center gap-2 cursor-pointer group/user"
            >
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 shrink-0 group-hover/user:ring-1 group-hover/user:ring-primary transition-all">
                {link.creatorAvatar ? (
                  <img src={getAssetUrl(link.creatorAvatar)!} alt={link.username} className="w-full h-full object-cover" />
                ) : (
                  <User size={10} className="text-primary" />
                )}
              </div>
              <p className="text-[10px] text-textSecondary uppercase tracking-wider group-hover/user:text-primary transition-colors">@{link.username}</p>
            </div>
            <span className="text-textSecondary/30">•</span>
            <p className="text-[10px] text-primary/80 font-medium">
              {(() => {
                try {
                  const date = new Date(link.createdAt);
                  if (isNaN(date.getTime())) return 'Recently';
                  return formatDistanceToNow(date, { addSuffix: true });
                } catch { return 'Recently'; }
              })()}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <button
              onClick={() => onClick(link.linkId, link.url)}
              className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border transition-colors ${link.isClickedByMe ? 'border-green-800 text-green-400 bg-green-950/30' : 'border-border text-textSecondary hover:border-primary hover:text-primary'}`}
            >
              <MousePointerClick size={12} />
              {link.clicks} {link.isClickedByMe ? 'viewed ✓' : 'clicks'}
            </button>

            <button
              onClick={() => likeMut.mutate()}
              disabled={likeMut.isPending}
              className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border transition-colors ${likeData?.isLikedByMe ? 'border-red-800 text-red-400 bg-red-950/30' : 'border-border text-textSecondary hover:border-red-500 hover:text-red-400'}`}
            >
              <Heart size={12} className={likeData?.isLikedByMe ? 'fill-red-400' : ''} />
              {likeData?.likeCount ?? 0}
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border transition-colors ${showComments ? 'border-primary text-primary bg-primary/10' : 'border-border text-textSecondary hover:border-primary hover:text-primary'}`}
            >
              <MessageCircle size={12} />
              {commentCount ?? comments?.length ?? 0} comments
            </button>

            {isCreator && (
              <button
                onClick={() => setShowSupporters(!showSupporters)}
                className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border transition-colors ${showSupporters ? 'border-yellow-600 text-yellow-400 bg-yellow-950/30' : 'border-border text-textSecondary hover:border-yellow-500 hover:text-yellow-400'}`}
              >
                <Users size={12} />
                Supporters {showSupporters ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
            )}
          </div>
        </div>

        {isCreator && (
          <div className="flex flex-col gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onEdit?.(link); }} className="p-1.5 rounded-lg bg-surfaceHover text-textSecondary hover:text-primary transition-colors">
              <Pencil size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete?.(link.linkId); }} className="p-1.5 rounded-lg bg-surfaceHover text-textSecondary hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Supporters Section */}
      {showSupporters && isCreator && (
        <div className="mt-4 pt-4 border-t border-border">
          {loadingSupporters ? (
            <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-primary" /></div>
          ) : supportersData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surfaceHover rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-textPrimary">{supportersData.totalClicks}</p>
                  <p className="text-[10px] text-textSecondary uppercase tracking-wider mt-0.5">Total Clicks</p>
                </div>
                <div className="bg-surfaceHover rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-textPrimary">{supportersData.uniqueUsers}</p>
                  <p className="text-[10px] text-textSecondary uppercase tracking-wider mt-0.5">Unique Users</p>
                </div>
                <div className="bg-surfaceHover rounded-xl p-3 text-center border border-yellow-900/50">
                  <p className="text-xl font-bold text-yellow-400">{supportersData.creatorClicks}</p>
                  <p className="text-[10px] text-yellow-600 uppercase tracking-wider mt-0.5">Creators ⭐</p>
                </div>
              </div>

              {supportersData.supporters.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Supporters</p>
                  {supportersData.supporters.map((s) => (
                    <div key={s.userId} className="flex items-center gap-3 p-2 rounded-lg bg-surfaceHover/50 hover:bg-surfaceHover transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 shrink-0">
                        {s.avatarUrl ? (
                          <img src={getAssetUrl(s.avatarUrl)!} alt={s.username} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-primary text-xs font-bold">{s.username[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-textPrimary truncate">@{s.username}</span>
                          {s.isCreator && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-950/50 text-yellow-400 text-[9px] font-bold border border-yellow-900/50 shrink-0">
                              <Crown size={8} /> creator
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-textSecondary">
                          {(() => { try { return formatDistanceToNow(new Date(s.clickedAt), { addSuffix: true }); } catch { return ''; } })()}
                          {s.referrerPage && <span className="ml-1 text-primary/60">· from {s.referrerPage}</span>}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {s.followStatus === 'ACCEPTED' ? (
                          <span className="text-[10px] text-green-400 px-2 py-1 rounded-lg border border-green-900/50 bg-green-950/20">Following</span>
                        ) : s.followStatus === 'PENDING' ? (
                          <span className="text-[10px] text-primary/60 px-2 py-1 rounded-lg border border-primary/20">Requested</span>
                        ) : s.followStatus === 'SELF' ? null : (
                          <button
                            onClick={() => followMut.mutate(s.userId)}
                            disabled={followMut.isPending}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-border text-textSecondary hover:border-primary hover:text-primary transition-colors"
                          >
                            <UserPlus size={10} /> Follow Back
                          </button>
                        )}
                        <button
                          onClick={() => !shoutedOut.has(s.userId) && shoutOutMut.mutate(s.userId)}
                          disabled={shoutOutMut.isPending || shoutedOut.has(s.userId)}
                          title={shoutedOut.has(s.userId) ? 'Shout out sent!' : 'Send shout out'}
                          className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                            shoutedOut.has(s.userId)
                              ? 'border-yellow-800 text-yellow-400 bg-yellow-950/30 cursor-default'
                              : 'border-border text-textSecondary hover:border-yellow-500 hover:text-yellow-400'
                          }`}
                        >
                          <Megaphone size={10} />
                          {shoutedOut.has(s.userId) ? 'Sent!' : ''}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-textSecondary text-center py-3">No supporters yet. Share your link!</p>
              )}
            </div>
          ) : null}
        </div>
      )}

      {showComments && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <div className="flex gap-2">
            <input
              className="input-field flex-1 text-sm py-1.5"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && commentText.trim()) commentMut.mutate(commentText.trim()); }}
            />
            <button
              onClick={() => commentText.trim() && commentMut.mutate(commentText.trim())}
              disabled={commentMut.isPending || !commentText.trim()}
              className="btn-primary px-3 py-1.5 text-sm"
            >
              {commentMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>

          {comments && comments.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.commentId} className="flex items-start gap-2 group/comment">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                    {c.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-primary">@{c.username}</span>
                    <span className="text-xs text-textSecondary ml-1">
                      {(() => { try { return formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }); } catch { return ''; } })()}
                    </span>
                    <p className="text-sm text-textPrimary mt-0.5">{c.content}</p>
                  </div>
                  {isCreator && (
                    <button
                      onClick={() => deleteCommentMut.mutate(c.commentId)}
                      className="opacity-0 group-hover/comment:opacity-100 p-1 text-textSecondary hover:text-red-500 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-textSecondary text-center py-2">No comments yet. Be the first!</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showSubmit, setShowSubmit] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [showEditCommunity, setShowEditCommunity] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const numericId = id ? parseInt(id, 10) : NaN;
  const isValidId = !isNaN(numericId);

  const { data: community, isLoading: loadingCommunity, error: communityError } = useQuery({
    queryKey: ['community', numericId],
    queryFn: () => api.communityById(numericId),
    enabled: isValidId,
  });

  const { data: links, isLoading: loadingLinks, error: linksError } = useQuery({
    queryKey: ['links', numericId],
    queryFn: () => api.linksByCommunity(numericId),
    enabled: isValidId && community?.isMember,
  });

  const { data: linkCount } = useQuery({
    queryKey: ['linkCount', numericId],
    queryFn: () => api.getLinkCount(numericId),
    enabled: isValidId && !community?.isMember,
  });

  const joinMut = useMutation({
    mutationFn: () => api.joinCommunity(numericId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', numericId] });
      qc.invalidateQueries({ queryKey: ['communities'] });
      toast.success('Successfully joined community!');
    },
    onError: (err: Error) => toast.error(err?.message || 'Failed to join community'),
  });

  const bannerMut = useMutation({
    mutationFn: (file: File) => api.uploadCommunityBanner(numericId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', numericId] });
      toast.success('Banner updated!');
    },
    onError: () => toast.error('Failed to upload banner'),
  });

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }
      bannerMut.mutate(file);
    }
  };

  const editCommunityMut = useMutation({
    mutationFn: (data: { name: string; description: string; niche: string }) =>
      api.updateCommunity(numericId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', numericId] });
      qc.invalidateQueries({ queryKey: ['communities'] });
      toast.success('Community updated!');
      setShowEditCommunity(false);
    },
    onError: (err: Error) => toast.error(err?.message || 'Failed to update community'),
  });

  const leaveMut = useMutation({
    mutationFn: () => api.leaveCommunity(numericId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', numericId] });
      qc.invalidateQueries({ queryKey: ['communities'] });
      toast.success('You left the community');
    },
    onError: (err: Error) => toast.error(err?.message || 'Failed to leave community'),
  });

  const clickMut = useMutation({
    mutationFn: ({ linkId, url }: { linkId: string | number; url: string }) =>
      api.clickLink(linkId).then(() => url),
    onSuccess: (url) => {
      qc.invalidateQueries({ queryKey: ['links', numericId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      window.open(url, '_blank');
    },
    onError: () => toast.error('Could not record click'),
  });

  const submitMut = useMutation({
    mutationFn: (data: LinkFormData) => api.addLink(data.title, data.youtubeUrl, numericId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['links', numericId] });
      toast.success('Link submitted successfully!');
      reset();
      setShowSubmit(false);
    },
    onError: (err: Error) => toast.error(err?.message || 'Failed to submit link'),
  });

  const deleteMut = useMutation({
    mutationFn: (linkId: string | number) => api.deleteLink(linkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['links', numericId] });
      toast.success('Link deleted successfully');
    },
    onError: (err: Error) => toast.error(err?.message || 'Failed to delete link'),
  });

  const updateMut = useMutation({
    mutationFn: (data: LinkFormData & { id: string | number }) =>
      api.updateLink(data.id, data.title, data.youtubeUrl),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['links', numericId] });
      toast.success('Link updated successfully!');
      setEditingLink(null);
      reset();
    },
    onError: (err: Error) => toast.error(err?.message || 'Failed to update link'),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
    defaultValues: { title: '', youtubeUrl: '' },
  });

  const handleEditClick = (link: LinkType) => {
    setEditingLink(link);
    setValue('title', link.title);
    setValue('youtubeUrl', link.url);
  };

  const handleDeleteClick = (linkId: string | number) => {
    if (confirm('Are you sure you want to delete this link?')) deleteMut.mutate(linkId);
  };

  if (!isValidId) return <div className="text-center py-16 text-textSecondary"><p className="text-lg font-medium">Invalid Community ID.</p></div>;

  if (loadingCommunity) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>;

  if (communityError || !community) {
    return (
      <div className="text-center py-16 text-textSecondary">
        <p className="text-lg font-medium">Community not found.</p>
        <button onClick={() => navigate('/communities')} className="mt-4 btn-primary">Back to Communities</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-textSecondary hover:text-textPrimary transition-colors text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Community Header — banner as full background */}
      <div className="relative overflow-hidden rounded-2xl border border-border min-h-[220px]">
        <div className="absolute inset-0">
          {community.bannerUrl ? (
            <img src={getAssetUrl(community.bannerUrl)!} alt="Banner" className="w-full h-full object-cover object-center" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-surface" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />
        </div>

        <div className="relative z-10 p-6">
          {community.isCreator && (
            <>
              <input type="file" ref={bannerInputRef} onChange={handleBannerChange} accept="image/*" className="hidden" />
              <div className="flex justify-end gap-2 mb-3">
                <button onClick={() => setShowEditCommunity(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 text-white text-xs hover:bg-black/70 transition-colors border border-white/20">
                  <Pencil size={12} /> Edit Community
                </button>
                <button onClick={() => bannerInputRef.current?.click()} disabled={bannerMut.isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 text-white text-xs hover:bg-black/70 transition-colors border border-white/20">
                  {bannerMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                  {community.bannerUrl ? 'Change Banner' : 'Add Banner'}
                </button>
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div
                  onClick={() => community.creatorAvatar && (setViewerUrl(getAssetUrl(community.creatorAvatar)), setShowViewer(true))}
                  className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/30 ${community.creatorAvatar ? 'cursor-pointer hover:border-white' : ''} transition-all group/avatar relative shrink-0`}
                >
                  {community.creatorAvatar ? (
                    <img src={getAssetUrl(community.creatorAvatar)!} alt={community.creatorName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-white" />
                  )}
                  {community.creatorAvatar && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-wider shrink-0">{community.niche}</span>
                <span 
                  onClick={() => community.creatorId && navigate(`/user/${community.creatorId}`)}
                  className="text-sm text-white/80 font-medium drop-shadow hover:text-white cursor-pointer hover:underline"
                >
                  by @{community.creatorName}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white drop-shadow-lg">{community.name}</h2>
              <p className="text-white/75 text-sm mt-1 drop-shadow">{community.description}</p>
              <p className="flex items-center gap-1.5 text-sm text-white/70 mt-3 drop-shadow">
                <Users size={14} /> {community.memberCount} members
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
              {community.isMember ? (
                <>
                  {community.isCreator && (
                    <button onClick={() => setShowSubmit(true)} className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap shadow-lg flex-1 sm:flex-initial">
                      <Plus size={16} /> Submit Link
                    </button>
                  )}
                  {community.isCreator ? (
                    <span className="px-3 py-1.5 rounded text-xs text-primary border border-primary/50 bg-black/50 font-medium whitespace-nowrap backdrop-blur-sm text-center flex-1 sm:flex-initial">👑 Owner</span>
                  ) : (
                    <button onClick={() => leaveMut.mutate()} disabled={leaveMut.isPending} className="px-4 py-2 rounded-lg bg-black/50 text-white border border-white/20 text-sm hover:bg-black/70 transition-colors whitespace-nowrap flex-1 sm:flex-initial text-center justify-center flex items-center">
                      {leaveMut.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Leave'}
                    </button>
                  )}
                </>
              ) : (
                <button onClick={() => joinMut.mutate()} disabled={joinMut.isPending} className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap shadow-lg w-full sm:w-auto">
                  {joinMut.isPending && <Loader2 size={14} className="animate-spin" />}
                  Join Community
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Links Section */}
      <div>
        <h3 className="text-lg font-bold text-textPrimary mb-4">
          Links {!community.isMember && linkCount !== undefined && linkCount > 0 && (
            <span className="text-sm font-normal text-textSecondary ml-2">({linkCount} links inside)</span>
          )}
        </h3>
        {!community.isMember ? (
          <div className="text-center py-12 text-textSecondary border border-dashed border-border rounded-xl">
            <ExternalLink size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">
              {linkCount !== undefined && linkCount > 0 ? `${linkCount} link${linkCount === 1 ? '' : 's'} in this community` : 'Links in this community'}
            </p>
            <p className="text-sm mt-1">Join to view and interact with them.</p>
          </div>
        ) : loadingLinks ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={28} className="animate-spin text-primary" /></div>
        ) : linksError ? (
          <div className="text-center py-12 text-red-500 border border-red-900/30 bg-red-950/10 rounded-xl">
            <p className="font-medium">Failed to load links</p>
            <p className="text-sm mt-1">Please try refreshing the page</p>
          </div>
        ) : !links || links.length === 0 ? (
          <div className="text-center py-12 text-textSecondary border border-dashed border-border rounded-xl">
            <ExternalLink size={36} className="mx-auto mb-3 opacity-30" />
            <p>No links yet.{community.isCreator ? ' Submit your first link!' : ''}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {links.map((link: LinkType) => (
              <LinkCard
                key={link.linkId}
                link={link}
                onClick={(linkId, url) => clickMut.mutate({ linkId, url })}
                isCreator={community.isCreator}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Submit Link Modal */}
      {showSubmit && community.isCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => { setShowSubmit(false); reset(); }}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-textPrimary">Submit a Link</h3>
              <button onClick={() => { setShowSubmit(false); reset(); }} className="text-textSecondary hover:text-textPrimary transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit((d) => submitMut.mutate(d))} className="space-y-4">
              <div>
                <label className="label">YouTube URL</label>
                <input className="input-field" placeholder="https://youtube.com/watch?v=..." disabled={submitMut.isPending} type="url" {...register('youtubeUrl')} />
                {errors.youtubeUrl && <p className="text-red-500 text-xs mt-1">{errors.youtubeUrl.message}</p>}
              </div>
              <div>
                <label className="label">Title</label>
                <input className="input-field" placeholder="My awesome video" disabled={submitMut.isPending} {...register('title')} />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <button type="submit" disabled={submitMut.isPending} className="btn-primary w-full flex items-center justify-center gap-2">
                {submitMut.isPending ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Plus size={16} /> Submit Link</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Link Modal */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => { setEditingLink(null); reset(); }}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-textPrimary">Edit Link</h3>
              <button onClick={() => { setEditingLink(null); reset(); }} className="text-textSecondary hover:text-textPrimary transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit((d) => updateMut.mutate({ ...d, id: editingLink.linkId }))} className="space-y-4">
              <div>
                <label className="label">YouTube URL</label>
                <input className="input-field" placeholder="https://youtube.com/watch?v=..." disabled={updateMut.isPending} type="url" {...register('youtubeUrl')} />
                {errors.youtubeUrl && <p className="text-red-500 text-xs mt-1">{errors.youtubeUrl.message}</p>}
              </div>
              <div>
                <label className="label">Title</label>
                <input className="input-field" placeholder="My awesome video" disabled={updateMut.isPending} {...register('title')} />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <button type="submit" disabled={updateMut.isPending} className="btn-primary w-full flex items-center justify-center gap-2">
                {updateMut.isPending ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Pencil size={16} /> Save Changes</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Community Modal */}
      {showEditCommunity && community.isCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowEditCommunity(false)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-textPrimary">Edit Community</h3>
              <button onClick={() => setShowEditCommunity(false)} className="text-textSecondary hover:text-textPrimary transition-colors"><X size={20} /></button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                editCommunityMut.mutate({
                  name: fd.get('name') as string,
                  description: fd.get('description') as string,
                  niche: fd.get('niche') as string,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="label">Name</label>
                <input name="name" className="input-field" defaultValue={community.name} disabled={editCommunityMut.isPending} required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea name="description" className="input-field resize-none" rows={3} defaultValue={community.description} disabled={editCommunityMut.isPending} required />
              </div>
              <div>
                <label className="label">Niche</label>
                <select name="niche" className="input-field" defaultValue={community.niche} disabled={editCommunityMut.isPending}>
                  {['Gaming','Tech','Education','Music','Comedy','Vlogging','Finance','Fitness','Food','Travel','Other'].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={editCommunityMut.isPending} className="btn-primary w-full flex items-center justify-center gap-2">
                {editCommunityMut.isPending ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Pencil size={16} /> Save Changes</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {showViewer && viewerUrl && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowViewer(false)}>
          <button className="absolute top-6 right-6 p-2 rounded-full bg-surfaceHover text-textPrimary hover:bg-surface transition-colors z-[101]" onClick={() => setShowViewer(false)}>
            <X size={24} />
          </button>
          <div className="relative w-[80vw] h-[80vw] max-w-[500px] max-h-[500px] rounded-full overflow-hidden border-4 border-primary/30 shadow-2xl">
            <img src={viewerUrl} alt="Avatar" className="w-full h-full object-cover" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  );
}
