import { useState } from 'react';
import { X } from 'lucide-react';
import { useEquipment } from '../hooks/useRealtime';
import { useAuth } from '../contexts/AuthContext';

interface CreateRequestModalProps {
  scheduledDate?: string | null;
  onClose: () => void;
}

export function CreateRequestModal({ scheduledDate, onClose }: CreateRequestModalProps) {
  const { equipment } = useEquipment();
  const [formData, setFormData] = useState(() => {
    // try hydrate draft to avoid losing typed data if modal closes
    try {
      const raw = localStorage.getItem('createRequestDraft_v1');
      if (raw) return { ...JSON.parse(raw), type: scheduledDate ? 'Preventive' : 'Corrective', scheduled_date: scheduledDate || '' };
    } catch (e) {}
    return {
      equipment_id: '',
      type: scheduledDate ? 'Preventive' : 'Corrective',
      title: '',
      description: '',
      scheduled_date: scheduledDate || '',
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // persist draft
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('createRequestDraft_v1', JSON.stringify(formData));
    }, 250);
    return () => clearTimeout(timer);
  }, [formData]);

  useEffect(() => {
    // clear draft when modal closes
    return () => {
      localStorage.removeItem('createRequestDraft_v1');
    };
  }, []);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const { profile, user } = useAuth();
  const userMetaRole = user && typeof user.user_metadata === 'object' && user.user_metadata !== null
    ? (user.user_metadata as { role?: string }).role
    : undefined;
  const isManager = profile?.role === 'manager' || userMetaRole === 'manager';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.equipment_id || !formData.title) {
      setError('Please fill in all required fields');
      return;
    }

    // Require an active profile with role manager (RLS depends on users table)
    if (profile?.role !== 'manager') {
      setError('Your account is not fully activated as a manager yet. Please confirm your email and sign in to enable manager actions.');
      return;
    }

    setLoading(true);

    try {
      const { supabase } = await import('../lib/supabase');
      const session = await supabase.auth.getSession();

      if (!session.data.session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/create-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equipment_id: formData.equipment_id,
          type: formData.type,
          title: formData.title,
          description: formData.description,
          scheduled_date: formData.scheduled_date || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create request');
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Create Maintenance Request</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Equipment *
            </label>
            <select
              value={formData.equipment_id}
              onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select equipment...</option>
              {equipment
                .filter(eq => !eq.is_scrapped)
                .map(eq => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Corrective' | 'Preventive' })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="Corrective">Corrective</option>
              <option value="Preventive">Preventive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the issue or maintenance task"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
              placeholder="Additional details..."
            />
          </div>

          {formData.type === 'Preventive' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Scheduled Date
              </label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
