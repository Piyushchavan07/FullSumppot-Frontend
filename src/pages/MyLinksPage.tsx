import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, MousePointerClick, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function MyLinksPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const { data: links, isLoading } = useQuery({
    queryKey: ['my-links'],
    queryFn: () => api.myLinks(),
  });

  const clickMut = useMutation({
    mutationFn: ({ linkId, url }: { linkId: string | number; url: string }) =>
      api.clickLink(linkId.toString()).then(() => url),
    onSuccess: (url) => {
      qc.invalidateQueries({ queryKey: ['my-links'] });
      window.open(url, '_blank');
    },
    onError: () => toast.error('Could not open link'),
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>;

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
          {links.map((link) => {
            const videoId = link.url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
            const thumb = link.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '');
            return (
              <div key={link.linkId} className="card group hover:border-border/80 transition-colors flex flex-col">
                <div className="relative w-full h-36 rounded-lg overflow-hidden bg-surfaceHover mb-3">
                  {thumb && <img src={thumb} alt={link.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                </div>
                <h3 className="font-semibold text-textPrimary line-clamp-2 flex-1">{link.title}</h3>
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
                <div className="flex items-center justify-between mt-3">
                  <span className="flex items-center gap-1.5 text-xs text-textSecondary">
                    <MousePointerClick size={12} /> {link.clicks} clicks
                  </span>
                  <button
                    onClick={() => clickMut.mutate({ linkId: link.linkId, url: link.url })}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border text-textSecondary hover:border-primary hover:text-primary transition-colors"
                  >
                    <ExternalLink size={12} /> Open
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
