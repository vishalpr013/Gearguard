import { useState } from 'react';
import { X } from 'lucide-react';
import { useTeams } from '../hooks/useRealtime';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

interface Props {
  onClose: () => void;
}

export function AddEquipmentModal({ onClose }: Props) {
  const { teams } = useTeams();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTeam, setAssignedTeam] = useState<string | null>(teams[0]?.id ?? null);
  const [warranty, setWarranty] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { profile, user } = useAuth();
  const userMetaRole = user && typeof user.user_metadata === 'object' && user.user_metadata !== null
    ? (user.user_metadata as { role?: string }).role
    : undefined;
  const isManager = profile?.role === 'manager' || userMetaRole === 'manager';

  // Persist draft to avoid losing form data on refresh/unmount
  const DRAFT_KEY = 'addEquipmentDraft_v1';

  // hydrate draft
  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.name) setName(parsed.name);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.assignedTeam) setAssignedTeam(parsed.assignedTeam);
        if (parsed.warranty) setWarranty(parsed.warranty);
      } catch (e) {
        // ignore parse errors
      }
    }
  }, []);

  // save draft on change
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ name, description, assignedTeam, warranty })
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [name, description, assignedTeam, warranty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name) return setError('Please provide a name');

    // Require an active profile with role manager to perform DB writes (RLS relies on users table)
    if (profile?.role !== 'manager') {
      setError('Your account is not fully activated as a manager yet. Please confirm your email and sign in to enable manager actions.');
      return;
    }

    setLoading(true);

    try {
      const { supabase } = await import('../lib/supabase');
      const session = await supabase.auth.getSession();
      if (!session.data.session) throw new Error('Not authenticated');

      // Supabase types can be finicky with this TypeScript version — ignore here
      // @ts-expect-error supabase-type-issue
      const { error } = await supabase.from<'equipment'>('equipment').insert([{
        name,
        description,
        assigned_team_id: assignedTeam || null,
        warranty_expiry: warranty || null,
      } as Database['public']['Tables']['equipment']['Insert']]);

      if (error) throw new Error(error.message || 'Failed to add equipment');

      // clear draft on success
      localStorage.removeItem(DRAFT_KEY);

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add equipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Add Equipment</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
            <input className="w-full px-3 py-2 border rounded" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea className="w-full px-3 py-2 border rounded" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Assigned Team</label>
            <select className="w-full px-3 py-2 border rounded" value={assignedTeam ?? ''} onChange={e => setAssignedTeam(e.target.value || null)}>
              <option value="">Unassigned</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Warranty Expiry</label>
            <input type="date" className="w-full px-3 py-2 border rounded" value={warranty} onChange={e => setWarranty(e.target.value)} />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded">
              {loading ? 'Adding...' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
