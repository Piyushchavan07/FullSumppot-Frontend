import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Users, Search, X, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  niche: z.string().min(1, 'Please select a niche'),
});
type FormData = z.infer<typeof schema>;

const niches = ['Gaming', 'Tech', 'Education', 'Music', 'Comedy', 'Vlogging', 'Finance', 'Fitness', 'Food', 'Travel', 'Other'];

export default function CommunitiesPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const { data: communities, isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () => api.communities(),
  });

  const joinMut = useMutation({
    mutationFn: (id: string | number) => api.joinCommunity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communities'] });
      toast.success('Joined community!');
    },
    onError: () => toast.error('Failed to join'),
  });

  const createMut = useMutation({
    mutationFn: (data: FormData) => api.createCommunity(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communities'] });
      toast.success('Community created!');
      setShowCreate(false);
      reset();
    },
    onError: () => toast.error('Failed to create community'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const filtered = (communities ?? []).filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.niche.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-textPrimary">Communities</h2>
          <p className="text-textSecondary text-sm mt-1">Find your niche and grow together</p>
        </div>
        <button id="create-community-btn" onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={16} /> Create Community
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
        <input className="input-field pl-9" placeholder="Search communities or niches…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-textSecondary"><Users size={40} className="mx-auto mb-3 opacity-30" /><p>No communities found</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.communityId} className="card hover:border-border/80 transition-colors flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{c.niche}</span>
                <span className="text-xs text-textSecondary flex items-center gap-1"><Users size={12} /> {c.memberCount}</span>
              </div>
              <h3 className="font-semibold text-textPrimary">{c.name}</h3>
              <p className="text-sm text-textSecondary mt-1 line-clamp-2 flex-1">{c.description}</p>
              <div className="flex items-center gap-2 mt-4">
                <Link to={`/communities/${c.communityId}`} className="btn-secondary flex-1 text-center text-sm py-1.5">View</Link>
                {c.isMember ? (
                  <span className="px-3 py-1.5 rounded text-xs text-green-400 border border-green-900 bg-green-950/30">✓ Joined</span>
                ) : (
                  <button onClick={() => joinMut.mutate(c.communityId)} disabled={joinMut.isPending} className="btn-primary flex-1 text-sm py-1.5">Join</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowCreate(false)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-textPrimary">Create Community</h3>
              <button onClick={() => setShowCreate(false)} className="text-textSecondary hover:text-textPrimary"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit((d) => createMut.mutate(d))} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input className="input-field" placeholder="Gaming Legends" {...register('name')} />
                {errors.name && <p className="text-primary text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input-field resize-none" rows={3} placeholder="What is this community about?" {...register('description')} />
                {errors.description && <p className="text-primary text-xs mt-1">{errors.description.message}</p>}
              </div>
              <div>
                <label className="label">Niche</label>
                <select className="input-field" {...register('niche')}>
                  <option value="">Select niche…</option>
                  {niches.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                {errors.niche && <p className="text-primary text-xs mt-1">{errors.niche.message}</p>}
              </div>
              <button type="submit" disabled={createMut.isPending} className="btn-primary w-full flex items-center justify-center gap-2">
                {createMut.isPending && <Loader2 size={16} className="animate-spin" />}
                Create
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
