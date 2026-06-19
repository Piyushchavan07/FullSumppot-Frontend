import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, Loader2, UserPlus, Check, X, Megaphone, MousePointerClick, Heart, ExternalLink, HandHeart } from 'lucide-react';
import { api } from '../services/api';
import type { Notification } from '../types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

const notifIcon = (type: string) => {
  switch (type) {
    case 'FOLLOW_REQUEST':             return <UserPlus size={16} />;
    case 'SHOUT_OUT':                  return <Megaphone size={16} />;
    case 'CREATOR_CLICKED_YOUR_LINK':  return <MousePointerClick size={16} />;
    case 'LINK_LIKED':                 return <Heart size={16} />;
    case 'SUPPORT_BACK':               return <MousePointerClick size={16} />;
    default:                           return <Bell size={16} />;
  }
};

const notifColor = (type: string) => {
  switch (type) {
    case 'FOLLOW_REQUEST':             return 'bg-primary/10 text-primary';
    case 'SHOUT_OUT':                  return 'bg-yellow-950/50 text-yellow-400';
    case 'CREATOR_CLICKED_YOUR_LINK':  return 'bg-green-950/50 text-green-400';
    case 'LINK_LIKED':                 return 'bg-red-950/50 text-red-400';
    case 'SUPPORT_BACK':               return 'bg-green-950/50 text-green-400';
    default:                           return 'bg-surfaceHover text-textSecondary';
  }
};

// Whether this notification type should show a "Support Back" button
const canSupportBack = (type: string) =>
  type === 'CREATOR_CLICKED_YOUR_LINK' || type === 'SUPPORT_BACK';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  // Support Back modal state
  const [supportTarget, setSupportTarget] = useState<{ userId: number; username: string } | null>(null);
  const [clickedThisSession, setClickedThisSession] = useState<Set<number>>(new Set());

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
  });

  // Auto-mark all as read when page opens — clears bell badge immediately
  useEffect(() => {
    const hasUnread = notifications?.some((n: Notification) => !n.isRead);
    if (hasUnread) {
      api.markNotificationsRead().then(() => {
        qc.invalidateQueries({ queryKey: ['notifications'] });
      }).catch(() => {});
    }
  }, [notifications, qc]);

  // Fetch target user's links when modal is open
  const { data: targetLinks, isLoading: loadingTargetLinks } = useQuery({
    queryKey: ['userLinks', supportTarget?.userId],
    queryFn: () => api.getLinksByUser(supportTarget!.userId),
    enabled: !!supportTarget,
    staleTime: 0,
  });

  const clickSupportBackMut = useMutation({
    mutationFn: async ({ userId, linkId, url, title }: { userId: number; linkId: number; url: string; title: string }) => {
      await api.clickLink(linkId);
      await api.notifySupportBack(userId, linkId).catch(() => {});
      return { userId, linkId, url, title };
    },
    onSuccess: (data) => {
      setClickedThisSession(prev => new Set(prev).add(data.linkId));
      qc.invalidateQueries({ queryKey: ['userLinks', data.userId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success("✅ Supported!");
      setTimeout(() => window.open(data.url, '_blank'), 300);
    },
    onError: () => toast.error('Failed to record support — please try again'),
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-textPrimary flex items-center gap-2">
          <Bell size={22} className="text-primary" /> Notifications
        </h2>
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
                {/* Left: icon + message */}
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

                {/* Right: action buttons */}
                <div className="flex items-center gap-2 mt-2 sm:mt-0 justify-end shrink-0 flex-wrap">
                  {/* Follow request actions */}
                  {n.type === 'FOLLOW_REQUEST' && (
                    <>
                      <button
                        onClick={() => acceptMut.mutate(Number(n.senderId))}
                        disabled={acceptMut.isPending}
                        className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5 min-h-[36px]"
                      >
                        <Check size={13} /> Accept
                      </button>
                      <button
                        onClick={() => declineMut.mutate({ senderId: Number(n.senderId), notifId: Number(n.id) })}
                        disabled={declineMut.isPending}
                        className="px-3 py-2 rounded-lg border border-border text-textSecondary hover:border-red-500 hover:text-red-400 text-xs flex items-center gap-1.5 transition-colors min-h-[36px]"
                      >
                        <X size={13} /> Decline
                      </button>
                    </>
                  )}

                  {/* Support Back button — shown on click & support_back notifications */}
                  {canSupportBack(n.type) && n.senderId && (
                    <button
                      onClick={() => setSupportTarget({ userId: Number(n.senderId), username: n.senderName ?? 'them' })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-green-900/60 bg-green-950/20 text-green-400 text-xs hover:bg-green-950/40 transition-colors min-h-[36px]"
                      title="Support them back by clicking one of their links"
                    >
                      🔁 Support Back
                    </button>
                  )}

                  {/* Dismiss */}
                  {n.type !== 'FOLLOW_REQUEST' && (
                    <button
                      onClick={() => deleteMut.mutate(Number(n.id))}
                      disabled={deleteMut.isPending}
                      className="p-2 rounded-lg text-textSecondary hover:text-red-400 hover:bg-surfaceHover transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Dismiss"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Support Back Modal ─────────────────────────────────── */}
      {supportTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setSupportTarget(null)}
        >
          <div
            className="bg-surface border border-border rounded-2xl w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-bold text-textPrimary text-sm flex items-center gap-2">
                  <HandHeart size={16} className="text-green-400" />
                  Support @{supportTarget.username}
                </h3>
                <p className="text-[11px] text-textSecondary mt-0.5">
                  Pick any link — each click earns them +1 point
                </p>
              </div>
              <button
                onClick={() => setSupportTarget(null)}
                className="p-1.5 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surfaceHover transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Link list */}
            <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
              {loadingTargetLinks ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : !targetLinks?.length ? (
                <div className="text-center py-8 text-textSecondary">
                  <p className="text-sm">This creator has no links yet</p>
                </div>
              ) : (
                targetLinks.map((tl) => {
                  const vid = tl.url?.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
                  const thumb = tl.thumbnailUrl || (vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : '');
                  const alreadyClicked = tl.isClickedByMe || clickedThisSession.has(tl.linkId);
                  const isCurrentlyClicking =
                    clickSupportBackMut.isPending &&
                    (clickSupportBackMut.variables as { linkId: number } | undefined)?.linkId === tl.linkId;

                  return (
                    <div
                      key={tl.linkId}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                        alreadyClicked
                          ? 'border-green-900/60 bg-green-950/20'
                          : 'border-border hover:border-green-700 hover:bg-green-950/10'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-9 rounded-lg overflow-hidden bg-surfaceHover shrink-0">
                        {thumb ? (
                          <img src={thumb} alt={tl.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <ExternalLink size={12} className="text-primary/40" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${alreadyClicked ? 'text-green-400' : 'text-textPrimary'}`}>
                          {tl.title}
                        </p>
                        <p className="text-[10px] text-textSecondary mt-0.5">
                          {tl.clicks} clicks · {(() => { try { return formatDistanceToNow(new Date(tl.createdAt), { addSuffix: true }); } catch { return ''; } })()}
                        </p>
                      </div>

                      {/* Action */}
                      {alreadyClicked ? (
                        <button
                          disabled
                          className="text-[10px] px-2.5 py-1 rounded-lg border border-green-950/20 bg-green-950/5 text-green-500/40 cursor-not-allowed shrink-0"
                        >
                          ✓ Supported
                        </button>
                      ) : (
                        <button
                          onClick={() => clickSupportBackMut.mutate({
                            userId: supportTarget.userId,
                            linkId: tl.linkId,
                            url: tl.url,
                            title: tl.title,
                          })}
                          disabled={isCurrentlyClicking || clickSupportBackMut.isPending}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-green-950/40 text-green-400 border border-green-900/60 hover:bg-green-950/70 transition-colors shrink-0 flex items-center gap-1 disabled:opacity-50"
                        >
                          {isCurrentlyClicking ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <span>🔁 Support</span>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 pb-4 pt-2 flex items-center justify-between gap-3">
              <p className="text-[10px] text-textSecondary">
                ✅ Each link click = +1 point for them, instantly
              </p>
              <button
                onClick={() => setSupportTarget(null)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-textSecondary hover:text-textPrimary hover:bg-surfaceHover transition-colors shrink-0"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
