import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications(),
  });

  const markAllMut = useMutation({
    mutationFn: () => api.markNotificationsRead(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('All marked as read'); },
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>;

  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-textPrimary flex items-center gap-2">
            <Bell size={22} className="text-primary" /> Notifications
          </h2>
          {unread > 0 && <p className="text-textSecondary text-sm mt-1">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={() => markAllMut.mutate()} disabled={markAllMut.isPending} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {!notifications?.length ? (
        <div className="text-center py-16 text-textSecondary border border-dashed border-border rounded-xl">
          <Bell size={40} className="mx-auto mb-3 opacity-30" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={`card transition-colors ${!n.isRead ? 'border-primary/20 bg-primary/5' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {!n.isRead && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />}
                  <p className="text-sm text-textPrimary">{n.message}</p>
                </div>
                <span className="text-xs text-textSecondary shrink-0">
                  {(() => {
                    try {
                      const date = new Date(n.createdAt);
                      return isNaN(date.getTime()) ? 'Recently' : formatDistanceToNow(date, { addSuffix: true });
                    } catch {
                      return 'Recently';
                    }
                  })()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
