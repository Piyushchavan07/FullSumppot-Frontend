import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, Users, Users2, Link2, MousePointerClick,
  Trash2, Search, Loader2, ExternalLink, Crown, UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { AdminUser, AdminCommunity, AdminLink } from '../types';
import { formatDistanceToNow } from 'date-fns';

type Tab = 'overview' | 'users' | 'communities' | 'links';

export default function AdminPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');

  // ── Data fetching ────────────────────────────────────────────────────────
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.adminGetStats(),
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.adminGetUsers(),
    enabled: tab === 'users',
  });

  const { data: communities, isLoading: loadingCommunities } = useQuery({
    queryKey: ['adminCommunities'],
    queryFn: () => api.adminGetCommunities(),
    enabled: tab === 'communities',
  });

  const { data: links, isLoading: loadingLinks } = useQuery({
    queryKey: ['adminLinks'],
    queryFn: () => api.adminGetLinks(),
    enabled: tab === 'links',
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const makeAdminMut = useMutation({
    mutationFn: (userId: number) => api.adminMakeAdmin(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User promoted to Admin');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to promote user'),
  });

  const deleteUserMut = useMutation({
    mutationFn: (userId: number) => api.adminDeleteUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      qc.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success('User deleted');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete user'),
  });

  const deleteCommunityMut = useMutation({
    mutationFn: (communityId: number) => api.adminDeleteCommunity(communityId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminCommunities'] });
      qc.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success('Community deleted');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete community'),
  });

  const deleteLinkMut = useMutation({
    mutationFn: (linkId: number) => api.adminDeleteLink(linkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminLinks'] });
      qc.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success('Link deleted');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete link'),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────
  const confirmDelete = (label: string, onConfirm: () => void) => {
    if (window.confirm(`Are you sure you want to delete this ${label}? This cannot be undone.`)) {
      onConfirm();
    }
  };

  const filteredUsers = (users ?? []).filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCommunities = (communities ?? []).filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.creatorName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLinks = (links ?? []).filter(
    (l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.username.toLowerCase().includes(search.toLowerCase())
  );

  // ── Tab config ───────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users', count: stats?.totalUsers },
    { id: 'communities', label: 'Communities', count: stats?.totalCommunities },
    { id: 'links', label: 'Links', count: stats?.totalLinks },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
          <Shield size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Admin Panel</h1>
          <p className="text-textSecondary text-sm">Manage platform content and users</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all border shrink-0 ${
              tab === t.id
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                : 'bg-surface border-border text-textSecondary hover:text-textPrimary hover:border-border/80'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                tab === t.id ? 'bg-white/20 text-white' : 'bg-surfaceHover text-textSecondary'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loadingStats ? (
            <div className="col-span-4 flex justify-center py-16">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              <StatCard icon={<Users size={24} className="text-blue-400" />} value={stats?.totalUsers ?? 0} label="Total Users" color="bg-blue-500/10" />
              <StatCard icon={<Users2 size={24} className="text-green-400" />} value={stats?.totalCommunities ?? 0} label="Communities" color="bg-green-500/10" />
              <StatCard icon={<Link2 size={24} className="text-yellow-400" />} value={stats?.totalLinks ?? 0} label="Links" color="bg-yellow-500/10" />
              <StatCard icon={<MousePointerClick size={24} className="text-primary" />} value={stats?.totalClicks ?? 0} label="Total Clicks" color="bg-primary/10" />
            </>
          )}
        </div>
      )}

      {/* ── USERS ────────────────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="space-y-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search users by name or email..." />
          {loadingUsers ? (
            <LoadingSpinner />
          ) : filteredUsers.length === 0 ? (
            <EmptyState message="No users found" />
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surfaceHover/50">
                      <th className="text-left py-3 px-4 text-textSecondary font-medium">User</th>
                      <th className="text-left py-3 px-4 text-textSecondary font-medium hidden sm:table-cell">Email</th>
                      <th className="text-left py-3 px-4 text-textSecondary font-medium">Role</th>
                      <th className="text-right py-3 px-4 text-textSecondary font-medium hidden md:table-cell">Stats</th>
                      <th className="text-right py-3 px-4 text-textSecondary font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u: AdminUser) => (
                      <tr key={u.userId} className="border-b border-border/30 hover:bg-surfaceHover/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                              {u.username[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-textPrimary">@{u.username}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-textSecondary hidden sm:table-cell">{u.email}</td>
                        <td className="py-3 px-4">
                          {u.role === 'ADMIN' ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 w-fit">
                              <Crown size={10} /> Admin
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-surfaceHover text-textSecondary text-xs border border-border w-fit">
                              User
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right hidden md:table-cell">
                          <span className="text-xs text-textSecondary">
                            {u.availablePoints}pts · {u.linksSubmitted}L · {u.totalClicks}C
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            {u.role !== 'ADMIN' && (
                              <button
                                onClick={() => makeAdminMut.mutate(u.userId)}
                                disabled={makeAdminMut.isPending}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-yellow-950/50 text-yellow-400 border border-yellow-900/50 text-xs font-medium hover:bg-yellow-950 transition-colors min-h-[32px]"
                              >
                                <UserCheck size={12} /> Make Admin
                              </button>
                            )}
                            <button
                              onClick={() => confirmDelete('user', () => deleteUserMut.mutate(u.userId))}
                              disabled={deleteUserMut.isPending}
                              className="p-1.5 rounded-lg text-textSecondary hover:text-red-400 hover:bg-red-950/30 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                              title="Delete user"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── COMMUNITIES ──────────────────────────────────────────────────── */}
      {tab === 'communities' && (
        <div className="space-y-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search communities or owners..." />
          {loadingCommunities ? (
            <LoadingSpinner />
          ) : filteredCommunities.length === 0 ? (
            <EmptyState message="No communities found" />
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surfaceHover/50">
                      <th className="text-left py-3 px-4 text-textSecondary font-medium">Community</th>
                      <th className="text-left py-3 px-4 text-textSecondary font-medium hidden sm:table-cell">Owner</th>
                      <th className="text-right py-3 px-4 text-textSecondary font-medium hidden md:table-cell">Members</th>
                      <th className="text-right py-3 px-4 text-textSecondary font-medium hidden md:table-cell">Links</th>
                      <th className="text-right py-3 px-4 text-textSecondary font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCommunities.map((c: AdminCommunity) => (
                      <tr key={c.communityId} className="border-b border-border/30 hover:bg-surfaceHover/30 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-textPrimary">{c.name}</p>
                            <p className="text-xs text-textSecondary">{c.niche}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-textSecondary hidden sm:table-cell">@{c.creatorName}</td>
                        <td className="py-3 px-4 text-right text-textSecondary hidden md:table-cell">{c.memberCount}</td>
                        <td className="py-3 px-4 text-right text-textSecondary hidden md:table-cell">{c.linkCount}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end">
                            <button
                              onClick={() => confirmDelete('community', () => deleteCommunityMut.mutate(c.communityId))}
                              disabled={deleteCommunityMut.isPending}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/30 text-red-400 border border-red-900/50 text-xs font-medium hover:bg-red-950/60 transition-colors min-h-[32px]"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LINKS ────────────────────────────────────────────────────────── */}
      {tab === 'links' && (
        <div className="space-y-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search links or creators..." />
          {loadingLinks ? (
            <LoadingSpinner />
          ) : filteredLinks.length === 0 ? (
            <EmptyState message="No links found" />
          ) : (
            <div className="space-y-2">
              {filteredLinks.map((l: AdminLink) => (
                <div key={l.linkId} className="card flex items-center gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-textPrimary truncate">{l.title}</p>
                    <p className="text-xs text-textSecondary mt-0.5">
                      @{l.username} · {l.communityName} ·{' '}
                      <span className="text-primary/70">{l.clicks} clicks</span>
                      {l.createdAt && (
                        <span className="ml-1">
                          · {(() => { try { return formatDistanceToNow(new Date(l.createdAt), { addSuffix: true }); } catch { return ''; } })()}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surfaceHover text-textSecondary border border-border text-xs hover:text-primary hover:border-primary transition-colors min-h-[32px]"
                    >
                      <ExternalLink size={12} /> Open
                    </a>
                    <button
                      onClick={() => confirmDelete('link', () => deleteLinkMut.mutate(l.linkId))}
                      disabled={deleteLinkMut.isPending}
                      className="p-1.5 rounded-lg text-textSecondary hover:text-red-400 hover:bg-red-950/30 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Delete link"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, value, label, color }: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color} shrink-0`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-textPrimary">{value.toLocaleString()}</p>
        <p className="text-sm text-textSecondary">{label}</p>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
      <input
        className="input-field pl-9"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-textSecondary border border-dashed border-border rounded-xl">
      <p>{message}</p>
    </div>
  );
}
