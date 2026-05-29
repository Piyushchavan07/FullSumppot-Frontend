import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2, UserPlus, Check, X, Megaphone, MousePointerClick, Heart } from 'lucide-react';
import { api } from '../services/api';
import type { Notification } from '../types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const notifIcon = (type: string) => {
  switch (type) {
    case 'FOLLOW_REQUEST': return <UserPlus size={16} />;
    case 'SHOUT_OUT': return <Megaphone size={16} />;
    case 'CREATOR_CLICKED_YOUR_LINK': return <MousePointerClick size={16} />;
    case 'LINK_LIKED': return <Heart size={16} />;
    default: return <Bell size={16} />;
  }
};

const notifColor = (type: string) => {
  switch (type) {
    case 'FOLLOW_REQUEST': return 'bg-primary/10 text-primary';
    case 'SHOUT_OUT': return 'bg-yellow-950/50 text-yellow-400';
    case 'CREATOR_CLICKED_YOUR_LINK': return 'bg-green-950/50 text-green-400';
    case 'LINK_LIKED': return 'bg-red-950/50 text-red-400';
    default: return 'bg-surfaceHover text-textSecondary';
  }
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
  });

  const markAllMut = useMutation({
    mutationFn: () => api.markNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All marked as read');
    },
  });

  const acceptMut = useMutation({
    mutationFn: (senderId: number) => api.acceptFollow(senderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Follow request accepted!');
    },
    onError: () => toast.error('Failed to accept request'),
  });

  const declineMut = useMutation({
    mutationFn: ({ senderId, notifId }: { senderId: number; notifId: number }) =>
      api.declineFollow(senderId).then(() => api.deleteNotification(notifId)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Follow request declined');
    },
    onError: () => toast.error('Failed to decline request'),
  });

  const deleteMut = useMutation({
    mutationFn: (notifId: number) => api.deleteNotification(notifId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => toast.error('Failed to dismiss'),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  const unread = notifications?.filter((n: Notification) => !n.isRead).length ?? 0;

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
          <button
            onClick={() => markAllMut.mutate()}
            disabled={markAllMut.isPending}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
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
        <div className="space-y-3">
          {notifications.map((n: Notification) => (
            <div key={n.id} className={`card transition-colors ${!n.isRead ? 'border-primary/20 bg-primary/5' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-full shrink-0 ${notifColor(n.type)}`}>
                    {notifIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-textPrimary font-medium">
                      {n.type === 'FOLLOW_REQUEST'
                        ? <><span className="text-primary cursor-pointer hover:underline" onClick={() => navigate(`/user/${n.senderId}`)}>@{n.senderName}</span> sent you a follow request</>
                        : n.type === 'SHOUT_OUT'
                        ? <>🎉 <span className="text-primary cursor-pointer hover:underline" onClick={() => navigate(`/user/${n.senderId}`)}>@{n.senderName}</span> gave you a shout out!</>
                        : n.type === 'CREATOR_CLICKED_YOUR_LINK'
                        ? `⭐ ${n.message}`
                        : n.message}
                    </p>
                    <p className="text-xs text-textSecondary mt-1">
                      {(() => {
                        try {
                          const date = new Date(n.createdAt);
                          return isNaN(date.getTime()) ? 'Recently' : formatDistanceToNow(date, { addSuffix: true });
                        } catch { return 'Recently'; }
                      })()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 sm:mt-0 justify-end shrink-0">
                  {n.type === 'FOLLOW_REQUEST' && (
                    <>
                      <button
                        onClick={() => acceptMut.mutate(Number(n.senderId))}
                        disabled={acceptMut.isPending}
                        className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
                      >
                        <Check size={13} /> Accept
                      </button>
                      <button
                        onClick={() => declineMut.mutate({ senderId: Number(n.senderId), notifId: Number(n.id) })}
                        disabled={declineMut.isPending}
                        className="px-3 py-1.5 rounded-lg border border-border text-textSecondary hover:border-red-500 hover:text-red-400 text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <X size={13} /> Decline
                      </button>
                    </>
                  )}
                  {n.type !== 'FOLLOW_REQUEST' && (
                    <button
                      onClick={() => deleteMut.mutate(Number(n.id))}
                      disabled={deleteMut.isPending}
                      className="p-1.5 rounded-lg text-textSecondary hover:text-red-400 hover:bg-surfaceHover transition-colors"
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
