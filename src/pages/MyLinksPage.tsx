import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ExternalLink, MousePointerClick, Loader2, Pencil, Trash2, X, Users } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type { Link as LinkType } from '../types';

const linkSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  youtubeUrl: z.string().url('Must be a valid URL').refine(
    (v) => v.includes('youtube') || v.includes('youtu.be'),
    { message: 'Must be a YouTube URL' }
  ),
});
type LinkFormData = z.infer<typeof linkSchema>;

export default function MyLinksPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);

  const { data: links, isLoading } = useQuery({
    queryKey: ['my-links'],
    queryFn: () => api.myLinks(),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
  });

  const clickMut = useMutation({
    mutationFn: ({ linkId, url }: { linkId: string | number; url: string }) =>
      api.clickLink(linkId).then(() => url),
    onSuccess: (url) => {
      qc.invalidateQueries({ queryKey: ['my-links'] });
      window.open(url, '_blank');
    },
    onError: () => toast.error('Could not open link'),
  });

  const deleteMut = useMutation({
    mutationFn: (linkId: string | number) => api.deleteLink(linkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-links'] });
      toast.success('Link deleted');
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Failed to delete link'),
  });

  const updateMut = useMutation({
    mutationFn: (data: LinkFormData & { id: string | number }) =>
      api.updateLink(data.id, data.title, data.youtubeUrl),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-links'] });
      toast.success('Link updated!');
      setEditingLink(null);
      reset();
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Failed to update link'),
  });

  const handleEditClick = (link: LinkType) => {
    setEditingLink(link);
    setValue('title', link.title);
    setValue('youtubeUrl', link.url);
  };

  const handleDeleteClick = (linkId: string | number) => {
    if (confirm('Are you sure you want to delete this link?')) {
      deleteMut.mutate(linkId);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-textPrimary">My Links</h2>
        <p className="text-textSecondary text-sm mt-1">All links you've submitted across communities</p>
      </div>

      {!links?.length ? (
        <div className="text-center py-16 text-textSecondary border border-dashed border-border rounded-xl">
          <ExternalLink size={40} className="mx-auto mb-3 opacity-30" />
          <p>No links submitted yet.</p>
          <p className="text-sm mt-1">Join a community and start sharing your videos!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link: LinkType) => {
            const videoId = link.url?.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
            const thumb = link.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '');
            return (
              <div key={link.linkId} className="card group hover:border-border/80 transition-colors flex flex-col">
                {/* Thumbnail */}
                <div className="relative w-full h-36 rounded-lg overflow-hidden bg-surfaceHover mb-3">
                  {thumb && (
                    <img
                      src={thumb}
                      alt={link.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>

                <h3 className="font-semibold text-textPrimary line-clamp-2 flex-1">{link.title}</h3>
                {link.communityName && (
                  <button
                    onClick={() => navigate(`/communities/${link.communityId}`)}
                    className="flex items-center gap-1 mt-1 text-[10px] text-primary/80 hover:text-primary transition-colors"
                  >
                    <Users size={10} /> {link.communityName}
                  </button>
                )}
                <p className="text-xs text-textSecondary mt-1">
                  {(() => {
                    try {
                      const date = new Date(link.createdAt);
                      return isNaN(date.getTime()) ? 'Recently' : formatDistanceToNow(date, { addSuffix: true });
                    } catch {
                      return 'Recently';
                    }
                  })()}
                </p>

                <div className="flex items-center justify-between mt-3 gap-2">
                  <span className="flex items-center gap-1.5 text-xs text-textSecondary shrink-0">
                    <MousePointerClick size={12} /> {link.clicks} clicks
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditClick(link)}
                      className="p-2 rounded-lg text-textSecondary hover:text-primary hover:bg-surfaceHover transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(link.linkId)}
                      disabled={deleteMut.isPending}
                      className="p-2 rounded-lg text-textSecondary hover:text-red-500 hover:bg-surfaceHover transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => clickMut.mutate({ linkId: link.linkId, url: link.url })}
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-border text-textSecondary hover:border-primary hover:text-primary transition-colors min-h-[36px]"
                    >
                      <ExternalLink size={12} /> Open
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingLink && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => { setEditingLink(null); reset(); }}
        >
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-textPrimary">Edit Link</h3>
              <button
                onClick={() => { setEditingLink(null); reset(); }}
                className="text-textSecondary hover:text-textPrimary transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit((d) => updateMut.mutate({ ...d, id: editingLink.linkId }))}
              className="space-y-4"
            >
              <div>
                <label className="label">YouTube URL</label>
                <input
                  className="input-field"
                  placeholder="https://youtube.com/watch?v=..."
                  type="url"
                  disabled={updateMut.isPending}
                  {...register('youtubeUrl')}
                />
                {errors.youtubeUrl && (
                  <p className="text-red-500 text-xs mt-1">{errors.youtubeUrl.message}</p>
                )}
              </div>
              <div>
                <label className="label">Title</label>
                <input
                  className="input-field"
                  placeholder="My awesome video"
                  disabled={updateMut.isPending}
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={updateMut.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {updateMut.isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving...</>
                ) : (
                  <><Pencil size={16} /> Save Changes</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
