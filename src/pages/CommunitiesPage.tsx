import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Users, Search, X, Loader2, UserPlus, UserCheck, Clock } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { Community, FollowUser } from '../types';
import { getAssetUrl, getCommunityBanner } from '../lib/utils';

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  niche: z.string().min(1, 'Please select a niche'),
});

type FormData = z.infer<typeof schema>;

const niches = ['Gaming', 'Tech', 'Education', 'Music', 'Comedy', 'Vlogging', 'Finance', 'Fitness', 'Food', 'Travel', 'Other'];

export default function CommunitiesPage() {
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const creatorIdFilter = searchParams.get('creatorId');
  const creatorNameFilter = searchParams.get('creatorName');

  const [search, setSearch] = useState('');


  const { data: communities, isLoading: loadingCommunities } = useQuery({
    queryKey: ['communities'],
    queryFn: () => api.communities(),
    refetchInterval: 10000,  // refresh every 10s
  });

  const { data: searchData, isLoading: searching } = useQuery({
    queryKey: ['search', search],
    queryFn: () => api.userSearch(search),
    enabled: search.length >= 1,
  });

  const searchResults = {
    users: searchData?.users ?? [],
    communities: searchData?.communities ?? [],
  };

  const joinMut = useMutation({
    mutationFn: (id: string | number) => api.joinCommunity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communities'] });
      toast.success('Joined community!');
    },
    onError: (err: unknown) => {
      console.error('Join community error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to join community');
    },
  });

  const createMut = useMutation({
    mutationFn: (data: FormData) => api.createCommunity(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communities'] });
      toast.success('Community created successfully!');
      reset();
      setShowCreate(false);
    },
    onError: (err: unknown) => {
      console.error('Create community error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create community');
    },
  });

  const [pendingFollows, setPendingFollows] = useState<Set<string | number>>(new Set());

  const followMut = useMutation({
    mutationFn: (id: string | number) => api.followUser(id),
    onMutate: (id) => {
      setPendingFollows(prev => new Set(prev).add(id));
    },
    onSuccess: (_data, id) => {
      setPendingFollows(prev => { const s = new Set(prev); s.delete(id); return s; });
      qc.invalidateQueries({ queryKey: ['search', search] });
      toast.success('Follow request sent!');
    },
    onError: (err: unknown, id) => {
      setPendingFollows(prev => { const s = new Set(prev); s.delete(id); return s; });
      console.error('Follow user error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to send follow request');
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      niche: '',
    },
  });

  const filtered = (communities ?? []).filter((c: Community) => {
    if (creatorIdFilter) {
      // Try by creatorId first, fall back to creatorName if creatorId not in data yet
      if (c.creatorId !== undefined) {
        return Number(c.creatorId) === Number(creatorIdFilter);
      }
      // Fallback: filter by creatorName if backend hasn't been updated yet
      if (creatorNameFilter) {
        return (c.creatorName ?? '').toLowerCase() === creatorNameFilter.toLowerCase();
      }
      return false;
    }
    return c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.niche.toLowerCase().includes(search.toLowerCase()) ||
      (c.creatorName ?? '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-textPrimary">
            {creatorIdFilter
              ? `Communities by @${filtered[0]?.creatorName ?? '...'}`
              : 'Communities'}
          </h2>
          <p className="text-textSecondary text-sm mt-1">
            {creatorIdFilter ? `Showing communities created by this user` : 'Find your niche and grow together'}
          </p>
        </div>
        <button
          id="create-community-btn"
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
        >
          <Plus size={16} /> Create Community
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
        <input
          className="input-field pl-9"
          placeholder="Search communities, niches or users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Niche Pills Slider */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setSearch('')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
            !search 
              ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
              : 'bg-surface border-border text-textSecondary hover:text-textPrimary hover:border-textSecondary/40'
          }`}
        >
          All Niches
        </button>
        {niches.map(n => (
          <button
            key={n}
            onClick={() => setSearch(n)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
              search.toLowerCase() === n.toLowerCase()
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                : 'bg-surface border-border text-textSecondary hover:text-textPrimary hover:border-textSecondary/40'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {search.length >= 1 ? (
        <div className="space-y-6">
          {searching ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              {searchResults?.users && searchResults.users.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold text-textPrimary mb-4">Users</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.users.map((u: FollowUser) => (
                      <div key={u.userId} className="card flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden border border-primary/20">
                            {u.avatarUrl ? (
                              <img
                                src={getAssetUrl(u.avatarUrl)!}
                                alt={u.username}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <span>{u.username?.[0]?.toUpperCase() || 'U'}</span>
                            )}
                          </div>
                          <span className="font-medium text-textPrimary truncate">@{u.username}</span>
                        </div>
                        {u.followStatus === 'ACCEPTED' ? (
                          <button
                            disabled
                            className="btn-secondary py-1.5 px-3 flex items-center gap-2 text-xs border-green-900/50 text-green-400 bg-green-950/20 shrink-0"
                          >
                            <UserCheck size={14} /> Following
                          </button>
                        ) : u.followStatus === 'PENDING' ? (
                          <button
                            disabled
                            className="btn-secondary py-1.5 px-3 flex items-center gap-2 text-xs border-primary/30 text-primary/70 shrink-0"
                          >
                            <Clock size={14} /> Requested
                          </button>
                        ) : (
                          <button
                            onClick={() => followMut.mutate(u.userId)}
                            disabled={pendingFollows.has(u.userId)}
                            className="btn-secondary py-1.5 px-3 flex items-center gap-2 text-xs shrink-0"
                          >
                            {pendingFollows.has(u.userId)
                              ? <Loader2 size={14} className="animate-spin" />
                              : <UserPlus size={14} />}
                            {pendingFollows.has(u.userId) ? 'Sending...' : 'Follow'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-lg font-bold text-textPrimary mb-4">Communities</h3>
                {searchResults?.communities && searchResults.communities.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.communities.map((c: Community) => {
                      // cross-reference with loaded communities for isMember/isCreator
                      const loaded = (communities ?? []).find((lc: Community) => lc.communityId === c.communityId);
                      const isMember = loaded?.isMember ?? c.isMember ?? false;
                      const isCreator = loaded?.isCreator ?? c.isCreator ?? false;
                      return (
                      <div key={c.communityId} className="relative overflow-hidden rounded-2xl border border-border hover:border-border/80 transition-colors flex flex-col min-h-[180px]">
                        {/* Banner */}
                        <div className="absolute inset-0">
                          {(() => {
                            const banner = getCommunityBanner(
                              loaded?.bannerUrl || c.bannerUrl,
                              loaded?.latestLinkUrl || c.latestLinkUrl
                            );
                            return banner ? (
                              <img src={banner} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/5 to-surface" />
                            );
                          })()}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />
                        </div>
                        <div className="relative z-10 p-3 flex flex-col flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs font-medium">
                              {c.niche}
                            </span>
                          </div>
                          <h3 className="font-semibold text-white">{c.name}</h3>
                          {c.description && (
                            <p className="text-sm text-white/70 mt-1 line-clamp-2 flex-1">{c.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-4">
                            <Link
                              to={`/communities/${c.communityId}`}
                              className="flex-1 text-center text-sm py-1.5 rounded-lg bg-black/40 text-white border border-white/20 hover:bg-black/60 transition-colors"
                            >
                              View
                            </Link>
                            {isMember ? (
                              isCreator ? (
                                <span className="px-3 py-1.5 rounded text-xs text-primary border border-primary/50 bg-black/50 font-medium">
                                  👑 Owner
                                </span>
                              ) : (
                                <span className="px-3 py-1.5 rounded text-xs text-green-400 border border-green-900 bg-black/50">
                                  Joined
                                </span>
                              )
                            ) : (
                              <button
                                onClick={() => joinMut.mutate(c.communityId)}
                                disabled={joinMut.isPending}
                                className="btn-primary text-sm py-1.5 px-3"
                              >
                                Join
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-textSecondary text-sm">No communities found for "{search}"</p>
                )}
              </section>
            </>
          )}
        </div>
      ) : (
        <>
          {loadingCommunities ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-textSecondary">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p>No communities found</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((c: Community) => (
                <div key={c.communityId} className="relative overflow-hidden rounded-2xl border border-border hover:border-border/80 transition-colors flex flex-col min-h-[220px]">
                  {/* Banner as full background */}
                  <div className="absolute inset-0">
                    {(() => {
                      const banner = getCommunityBanner(c.bannerUrl, c.latestLinkUrl);
                      return banner ? (
                        <img
                          src={banner}
                          alt={c.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/5 to-surface" />
                      );
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10 p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs font-medium">
                        {c.niche}
                      </span>
                      <span className="text-xs text-white/70 flex items-center gap-1">
                        <Users size={10} /> {c.memberCount || 0}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white">{c.name}</h3>
                    <p className="text-sm text-white/70 mt-1 line-clamp-2 flex-1">{c.description}</p>
                    <div className="flex items-center gap-2 mt-4">
                      <Link
                        to={`/communities/${c.communityId}`}
                        className="flex-1 text-center text-sm py-1.5 rounded-lg bg-black/40 text-white border border-white/20 hover:bg-black/60 transition-colors"
                      >
                        View
                      </Link>
                      {c.isMember ? (
                        c.isCreator ? (
                          <span className="px-3 py-1.5 rounded text-xs text-primary border border-primary/50 bg-black/50 font-medium">
                            👑 Owner
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded text-xs text-green-400 border border-green-900 bg-black/50">
                            Joined
                          </span>
                        )
                      ) : (
                        <button
                          onClick={() => joinMut.mutate(c.communityId)}
                          disabled={joinMut.isPending}
                          className="btn-primary flex-1 text-sm py-1.5"
                        >
                          {joinMut.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Join'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 pb-4 sm:pb-0"
          onClick={() => setShowCreate(false)}
        >
          <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-textPrimary">Create Community</h3>
              <button
                onClick={() => {
                  reset();
                  setShowCreate(false);
                }}
                className="text-textSecondary hover:text-textPrimary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit((data) => createMut.mutate(data))} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  className="input-field"
                  placeholder="Gaming Legends"
                  {...register('name')}
                  disabled={createMut.isPending}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="What is this community about?"
                  {...register('description')}
                  disabled={createMut.isPending}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="label">Niche</label>
                <select
                  className="input-field"
                  {...register('niche')}
                  disabled={createMut.isPending}
                >
                  <option value="">Select niche...</option>
                  {niches.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                {errors.niche && (
                  <p className="text-red-500 text-xs mt-1">{errors.niche.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={createMut.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {createMut.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Create Community
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}