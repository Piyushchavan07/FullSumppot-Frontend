import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Check, X, Loader2, User, Inbox, ArrowLeft, PenSquare } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

import { getAssetUrl } from '../lib/utils';

const formatTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  } catch { return ''; }
};

const formatFullTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

export default function MessagesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'messages' | 'requests'>('messages');
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeSearch, setComposeSearch] = useState('');
  const [composeText, setComposeText] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ id: number; username: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.getConversations(),
    refetchInterval: 30000,
  });

  const { data: requests, isLoading: loadingRequests } = useQuery({
    queryKey: ['messageRequests'],
    queryFn: () => api.getMessageRequests(),
    refetchInterval: 30000,
  });

  const { data: sentRequests } = useQuery({
    queryKey: ['sentMessageRequests'],
    queryFn: () => api.getSentMessageRequests(),
    refetchInterval: 30000,
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', activeConversation],
    queryFn: () => api.getMessages(activeConversation!),
    enabled: activeConversation !== null,
    refetchInterval: 30000,
  });

  // When messages load, refresh unread counts
  useEffect(() => {
    if (messages && activeConversation) {
      qc.invalidateQueries({ queryKey: ['unreadMessages'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    }
  }, [messages, activeConversation, qc]);

  const { data: searchResults } = useQuery({
    queryKey: ['composeSearch', composeSearch],
    queryFn: () => api.userSearch(composeSearch),
    enabled: composeSearch.length >= 1 && !selectedUser,
  });

  const sendMut = useMutation({
    mutationFn: (content: string) => api.sendToConversation(activeConversation!, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', activeConversation] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      setMessageText('');
    },
    onError: () => toast.error('Failed to send message'),
  });

  const composeMut = useMutation({
    mutationFn: ({ recipientId, content }: { recipientId: number; content: string }) =>
      api.sendMessage(recipientId, content),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['sentMessageRequests'] });
      setShowCompose(false);
      setComposeSearch('');
      setComposeText('');
      const username = selectedUser?.username ?? '';
      setSelectedUser(null);
      if (data.type === 'direct' && data.conversationId) {
        setActiveConversation(data.conversationId);
        toast.success('Message sent!');
      } else {
        setTab('requests');
        toast.success(username ? `Message request sent to @${username}!` : 'Message request sent!');
      }
    },
    onError: (err: Error) => toast.error(err?.message || 'Failed to send'),
  });

  const acceptMut = useMutation({
    mutationFn: (requestId: number) => api.acceptMessageRequest(requestId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['messageRequests'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Message request accepted!');
      setActiveConversation(data.conversationId);
      setTab('messages');
    },
    onError: () => toast.error('Failed to accept request'),
  });

  const declineMut = useMutation({
    mutationFn: (requestId: number) => api.declineMessageRequest(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messageRequests'] });
      toast.success('Request declined');
    },
    onError: () => toast.error('Failed to decline request'),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConv = conversations?.find(c => c.conversationId === activeConversation);

  return (
    <>
      <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-8rem)] flex gap-4" style={{height: 'calc(100dvh - 8rem)'}}>
        {/* Left panel */}
        <div className={`flex flex-col w-full sm:w-80 shrink-0 ${activeConversation ? 'hidden sm:flex' : 'flex'}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex flex-1 border-b border-border">
              <button
                onClick={() => setTab('messages')}
                className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${tab === 'messages' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'}`}
              >
                <MessageCircle size={15} /> Messages
                {(conversations?.reduce((s, c) => s + c.unreadCount, 0) ?? 0) > 0 && (
                  <span className="w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {conversations?.reduce((s, c) => s + c.unreadCount, 0)}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTab('requests')}
                className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${tab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'}`}
              >
                <Inbox size={15} /> Requests
                {(requests?.length ?? 0) > 0 && (
                  <span className="w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {requests?.length}
                  </span>
                )}
              </button>
            </div>
            <button
              onClick={() => { setShowCompose(true); setSelectedUser(null); setComposeSearch(''); setComposeText(''); }}
              className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shrink-0"
              title="New Message"
            >
              <PenSquare size={16} />
            </button>
          </div>

          {tab === 'messages' && (
            <div className="flex-1 overflow-y-auto space-y-1">
              {loadingConvs ? (
                <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-primary" /></div>
              ) : !conversations?.length ? (
                <div className="text-center py-16 text-textSecondary">
                  <MessageCircle size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No conversations yet</p>
                  <button onClick={() => setShowCompose(true)} className="text-xs text-primary mt-2 hover:underline">
                    Start a new message
                  </button>
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.conversationId}
                    onClick={() => setActiveConversation(conv.conversationId)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${activeConversation === conv.conversationId ? 'bg-primary/10 border border-primary/20' : 'hover:bg-surfaceHover'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                      {conv.otherAvatar ? (
                        <img src={getAssetUrl(conv.otherAvatar)!} alt={conv.otherUsername} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary font-bold text-sm">{conv.otherUsername[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-textPrimary text-sm truncate">@{conv.otherUsername}</span>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-textSecondary shrink-0 ml-1">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-textSecondary truncate mt-0.5">{conv.lastMessage ?? 'No messages yet'}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {tab === 'requests' && (
            <div className="flex-1 overflow-y-auto space-y-3">
              {loadingRequests ? (
                <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-primary" /></div>
              ) : (
                <>
                  {requests && requests.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider px-1">Received</p>
                      {requests.map(req => (
                        <div key={req.requestId} className="card space-y-3">
                          <div className="flex items-center gap-3">
                            <div 
                              onClick={() => req.senderId && navigate(`/user/${req.senderId}`)}
                              className="flex items-center gap-3 cursor-pointer group/req"
                            >
                              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0 group-hover/req:ring-2 group-hover/req:ring-primary/40 transition-all">
                                {req.avatarUrl ? (
                                  <img src={getAssetUrl(req.avatarUrl)!} alt={req.username} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-primary font-bold text-xs">{req.username[0]?.toUpperCase()}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-textPrimary text-sm group-hover/req:text-primary transition-colors">@{req.username}</p>
                                <p className="text-[10px] text-textSecondary">{formatTime(req.createdAt)}</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-textSecondary bg-surfaceHover rounded-lg px-3 py-2 italic">"{req.firstMessage}"</p>
                          <div className="flex gap-2">
                            <button onClick={() => acceptMut.mutate(req.requestId)} disabled={acceptMut.isPending} className="flex-1 btn-primary py-1.5 text-xs flex items-center justify-center gap-1.5">
                              <Check size={13} /> Accept
                            </button>
                            <button onClick={() => declineMut.mutate(req.requestId)} disabled={declineMut.isPending} className="flex-1 px-3 py-1.5 rounded-lg border border-border text-textSecondary hover:border-red-500 hover:text-red-400 text-xs flex items-center justify-center gap-1.5 transition-colors">
                              <X size={13} /> Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {sentRequests && sentRequests.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider px-1 mt-2">Sent</p>
                       {sentRequests.map(req => (
                        <div key={req.requestId} className="flex items-center gap-3 p-3 rounded-xl bg-surfaceHover/50">
                          <div 
                            onClick={() => req.recipientId && navigate(`/user/${req.recipientId}`)}
                            className="flex items-center gap-3 cursor-pointer group/sent flex-1 min-w-0"
                          >
                            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0 group-hover/sent:ring-2 group-hover/sent:ring-primary/40 transition-all">
                              {req.avatarUrl ? (
                                <img src={getAssetUrl(req.avatarUrl)!} alt={req.username} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-primary font-bold text-xs">{req.username[0]?.toUpperCase()}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-textPrimary text-sm group-hover/sent:text-primary transition-colors">@{req.username}</p>
                              <p className="text-xs text-textSecondary truncate italic">"{req.firstMessage}"</p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">Pending</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(!requests?.length && !sentRequests?.length) && (
                    <div className="text-center py-16 text-textSecondary">
                      <Inbox size={36} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No message requests</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right panel — chat */}
        <div className={`flex-1 flex flex-col ${!activeConversation ? 'hidden sm:flex' : 'flex'}`}>
          {!activeConversation ? (
            <div className="flex-1 flex items-center justify-center text-textSecondary">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-3 opacity-20" />
                <p>Select a conversation to start chatting</p>
                <button onClick={() => setShowCompose(true)} className="mt-3 btn-primary text-sm flex items-center gap-2 mx-auto">
                  <PenSquare size={15} /> New Message
                </button>
              </div>
            </div>
          ) : (
            <>               <div className="flex items-center gap-3 pb-4 border-b border-border mb-2">
                <button onClick={() => setActiveConversation(null)} className="sm:hidden p-1.5 rounded-lg text-textSecondary hover:bg-surfaceHover transition-colors">
                  <ArrowLeft size={18} />
                </button>
                <div 
                  onClick={() => activeConv?.otherUserId && navigate(`/user/${activeConv.otherUserId}`)}
                  className="flex items-center gap-3 cursor-pointer group/header"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0 group-hover/header:ring-2 group-hover/header:ring-primary/40 transition-all">
                    {activeConv?.otherAvatar ? (
                      <img src={getAssetUrl(activeConv.otherAvatar)!} alt={activeConv.otherUsername} className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} className="text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-textPrimary group-hover/header:text-primary transition-colors">@{activeConv?.otherUsername}</p>
                    <p className="text-xs text-textSecondary">Direct message</p>
                  </div>
                </div>
              </div>

              {/* Messages — newest at bottom like WhatsApp */}
              <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                {loadingMessages ? (
                  <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-primary" /></div>
                ) : !messages?.length ? (
                  <div className="flex items-end justify-center h-full pb-4 text-textSecondary text-sm">
                    No messages yet. Say hello! 👋
                  </div>
                ) : (
                  <div className="flex flex-col justify-end min-h-full py-2 space-y-1">
                    {messages.map((msg, idx) => {
                      const prevMsg = messages[idx - 1];
                      const showSeparator = !prevMsg ||
                        (new Date(msg.sentAt).getTime() - new Date(prevMsg.sentAt).getTime()) > 30 * 60 * 1000;
                      return (
                        <div key={msg.messageId}>
                          {showSeparator && (
                            <p className="text-center text-[10px] text-textSecondary/60 my-3 select-none">
                              {formatFullTime(msg.sentAt)}
                            </p>
                          )}
                          <div className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'} mb-0.5`}>
                            <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                              msg.isMine
                                ? 'bg-primary text-white rounded-br-sm'
                                : 'bg-surfaceHover text-textPrimary rounded-bl-sm'
                            }`}>
                              <p className="break-words leading-relaxed">{msg.content}</p>
                              <div className={`flex items-center justify-end gap-1 mt-0.5`}>
                                <span className={`text-[10px] ${msg.isMine ? 'text-white/50' : 'text-textSecondary'}`}>
                                  {formatTime(msg.sentAt)}
                                </span>
                                {msg.isMine && (
                                  <span className={`text-[11px] font-bold leading-none ${msg.isRead ? 'text-blue-300' : 'text-white/40'}`}>
                                    {msg.isRead ? '✓✓' : '✓'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2 pt-3 border-t border-border mt-2">
                <input
                  className="input-field flex-1"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && messageText.trim()) {
                      e.preventDefault();
                      sendMut.mutate(messageText.trim());
                    }
                  }}
                />
                <button
                  onClick={() => messageText.trim() && sendMut.mutate(messageText.trim())}
                  disabled={sendMut.isPending || !messageText.trim()}
                  className="btn-primary px-4 flex items-center gap-2"
                >
                  {sendMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowCompose(false)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-textPrimary">New Message</h3>
              <button onClick={() => setShowCompose(false)} className="text-textSecondary hover:text-textPrimary"><X size={20} /></button>
            </div>
            {!selectedUser ? (
              <>
                <input
                  className="input-field w-full mb-3"
                  placeholder="Search users by username..."
                  value={composeSearch}
                  onChange={(e) => setComposeSearch(e.target.value)}
                  autoFocus
                />
                {composeSearch.length >= 1 && searchResults?.users && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {searchResults.users.length === 0 ? (
                      <p className="text-sm text-textSecondary text-center py-3">No users found</p>
                    ) : (
                      searchResults.users.map((u) => (
                        <button
                          key={u.userId}
                          onClick={() => setSelectedUser({ id: Number(u.userId), username: u.username })}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surfaceHover transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {u.username[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm text-textPrimary">@{u.username}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3 p-2 bg-surfaceHover rounded-lg">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {selectedUser.username[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-textPrimary flex-1">@{selectedUser.username}</span>
                  <button onClick={() => setSelectedUser(null)} className="text-textSecondary hover:text-textPrimary">
                    <X size={14} />
                  </button>
                </div>
                <p className="text-xs text-textSecondary mb-2">
                  Direct message if mutual follow, otherwise sent as a request.
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
                  onClick={() => composeText.trim() && composeMut.mutate({ recipientId: selectedUser.id, content: composeText.trim() })}
                  disabled={composeMut.isPending || !composeText.trim()}
                  className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
                >
                  {composeMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send Message
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
