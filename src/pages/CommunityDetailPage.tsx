import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, ExternalLink, Plus, MousePointerClick, X, Loader2, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type { Link as LinkType } from '../types';

const linkSchema = z.object({
  youtubeUrl: z.string().url('Must be a valid URL').refine((v) => v.includes('youtube') || v.includes('youtu.be'), { message: 'Must be a YouTube URL' }),
  title: z.string().min(3, 'Title must be at least 3 characters'),
});
type LinkFormData = z.infer<typeof linkSchema>;

function LinkCard({ link, onClick }: { link: LinkType; onClick: (id: string | number, url: string) => void }) {
  const videoId = link.url?.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
  const thumb = link.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '');

  return (
    <div className="card hover:border-border/80 transition-colors group">
      <div className="flex gap-4">
        <button onClick={() => onClick(link.linkId, link.url)} className="relative shrink-0 w-28 h-16 rounded overflow-hidden bg-surfaceHover">
          {thumb && <img src={thumb} alt={link.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink size={20} className="text-white" />
          </div>
        </button>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-textPrimary truncate">{link.title}</h4>
          <p className="text-xs text-textSecondary mt-0.5">by @{link.username}</p>
          <p className="text-xs text-textSecondary mt-0.5">
            {(() => {
              try {
                const date = new Date(link.createdAt);
                return isNaN(date.getTime()) ? 'Recently' : formatDistanceToNow(date, { addSuffix: true });
              } catch {
                return 'Recently';
              }
            })()}
          </p>
          <button
            onClick={() => onClick(link.linkId, link.url)}
            className={`mt-2 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
              link.isClickedByMe
                ? 'border-green-800 text-green-400 bg-green-950/30'
                : 'border-border text-textSecondary hover:border-primary hover:text-primary'
            }`}
          >
            <MousePointerClick size={12} />
            {link.clicks} {link.isClickedByMe ? 'viewed ✓' : 'clicks'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showSubmit, setShowSubmit] = useState(false);

  const numericId = id ? parseInt(id, 10) : NaN;
  const isValidId = !isNaN(numericId);

  const { data: community, isLoading: loadingCommunity } = useQuery({
    queryKey: ['community', numericId],
    queryFn: () => api.communityById(numericId),
    enabled: isValidId,
  });

  const { data: links, isLoading: loadingLinks } = useQuery({
    queryKey: ['links', numericId],
    queryFn: () => api.linksByCommunity(numericId),
    enabled: isValidId,
  });

  const joinMut = useMutation({
    mutationFn: () => api.joinCommunity(numericId),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['community', numericId] }); 
      qc.invalidateQueries({ queryKey: ['communities'] }); 
      toast.success('Joined!'); 
    },
    onError: () => toast.error('Failed to join community'),
  });

  const leaveMut = useMutation({
    mutationFn: () => api.leaveCommunity(numericId),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['community', numericId] }); 
      qc.invalidateQueries({ queryKey: ['communities'] }); 
      toast.success('Left community'); 
    },
    onError: () => toast.error('Failed to leave community'),
  });

  const clickMut = useMutation({
    mutationFn: ({ linkId, url }: { linkId: string | number; url: string }) =>
      api.clickLink(linkId.toString()).then(() => url),
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
      toast.success('Link submitted!'); 
      setShowSubmit(false); 
      reset(); 
    },
    onError: () => toast.error('Failed to submit link'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LinkFormData>({ resolver: zodResolver(linkSchema) });

  if (!isValidId) return <div className="text-center py-16 text-textSecondary"><p>Invalid Community ID.</p></div>;
  if (loadingCommunity) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>;
  if (!community) return <div className="text-center py-16 text-textSecondary"><p>Community not found.</p></div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-textSecondary hover:text-textPrimary transition-colors text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{community.niche}</span>
            <h2 className="text-2xl font-bold text-textPrimary mt-2">{community.name}</h2>
            <p className="text-textSecondary text-sm mt-1">{community.description}</p>
            <p className="flex items-center gap-1.5 text-sm text-textSecondary mt-3"><Users size={14} /> {community.memberCount} members</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {community.isMember ? (
              <>
                {community.isCreator && (
                  <button id="submit-link-btn" onClick={() => setShowSubmit(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={16} /> Submit Link
                  </button>
                )}
                {community.isCreator ? (
                  <span className="px-3 py-1.5 rounded text-xs text-primary border border-primary/30 bg-primary/10 font-medium">👑 Owner</span>
                ) : (
                  <button onClick={() => leaveMut.mutate()} disabled={leaveMut.isPending} className="btn-secondary">Leave</button>
                )}
              </>
            ) : (
              <button onClick={() => joinMut.mutate()} disabled={joinMut.isPending} className="btn-primary flex items-center gap-2">
                {joinMut.isPending && <Loader2 size={14} className="animate-spin" />}
                Join Community
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-textPrimary mb-4">Links</h3>
        {!community.isMember ? (
          <div className="text-center py-12 text-textSecondary border border-dashed border-border rounded-xl">
            <ExternalLink size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">{links?.length ?? 0} link{(links?.length ?? 0) !== 1 ? 's' : ''} in this community</p>
            <p className="text-sm mt-1">Join to view and interact with them.</p>
          </div>
        ) : loadingLinks ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={28} className="animate-spin text-primary" /></div>
        ) : !links?.length ? (
          <div className="text-center py-12 text-textSecondary border border-dashed border-border rounded-xl">
            <ExternalLink size={36} className="mx-auto mb-3 opacity-30" />
            <p>No links yet.{community.isCreator ? ' Submit your first link!' : ''}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {links.map((link: LinkType) => (
              <LinkCard key={link.linkId} link={link} onClick={(linkId, url) => clickMut.mutate({ linkId, url })} />
            ))}
          </div>
        )}
      </div>

      {showSubmit && community.isCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowSubmit(false)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-textPrimary">Submit a Link</h3>
              <button onClick={() => setShowSubmit(false)} className="text-textSecondary hover:text-textPrimary"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit((d) => submitMut.mutate(d))} className="space-y-4">
              <div>
                <label className="label">YouTube URL</label>
                <input className="input-field" placeholder="https://youtube.com/watch?v=..." {...register('youtubeUrl')} />
                {errors.youtubeUrl && <p className="text-primary text-xs mt-1">{errors.youtubeUrl.message}</p>}
              </div>
              <div>
                <label className="label">Title</label>
                <input className="input-field" placeholder="My awesome video" {...register('title')} />
                {errors.title && <p className="text-primary text-xs mt-1">{errors.title.message}</p>}
              </div>
              <button type="submit" disabled={submitMut.isPending} className="btn-primary w-full flex items-center justify-center gap-2">
                {submitMut.isPending && <Loader2 size={16} className="animate-spin" />}
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}