import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { CreateRequestModal } from './CreateRequestModal';
import { useRequests, useEquipment } from '../hooks/useRealtime';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

type Request = Database['public']['Tables']['requests']['Row'];
type Status = 'New' | 'In Progress' | 'Repaired' | 'Scrap';

interface EquipmentRisk {
  [key: string]: boolean;
}

export function KanbanBoard() {
  const { requests } = useRequests();
  const { equipment } = useEquipment();
  const [highRiskEquipment, setHighRiskEquipment] = useState<EquipmentRisk>({});
  const [draggedRequest, setDraggedRequest] = useState<Request | null>(null);
  const [updatingRequest, setUpdatingRequest] = useState<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    const fetchRiskData = async () => {
      const { supabase } = await import('../lib/supabase');
      const session = await supabase.auth.getSession();

      if (!session.data.session) {
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/equipment-analytics`, {
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const { data } = await response.json();
        const riskMap: EquipmentRisk = {};
        data.forEach((stat: { equipment_id: string; is_high_risk: boolean }) => {
          riskMap[stat.equipment_id] = stat.is_high_risk;
        });
        setHighRiskEquipment(riskMap);
      }
    };

    fetchRiskData();
    const interval = setInterval(fetchRiskData, 30000);
    return () => clearInterval(interval);
  }, [supabaseUrl]);

  const columns: Status[] = ['New', 'In Progress', 'Repaired', 'Scrap'];

  const { profile, user } = useAuth();
  const userMetaRole = user && typeof user.user_metadata === 'object' && user.user_metadata !== null
    ? (user.user_metadata as { role?: string }).role
    : undefined;
  const isManager = profile?.role === 'manager' || userMetaRole === 'manager';

  const handleDragStart = (e: React.DragEvent, request: Request) => {
    // Only managers can drag/update request statuses
    if (!isManager) return;
    setDraggedRequest(request);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: Status) => {
    e.preventDefault();

    // Only managers can change request status
    if (!isManager) {
      alert('Insufficient permissions to update request status');
      return;
    }

    if (!draggedRequest || draggedRequest.status === targetStatus) {
      setDraggedRequest(null);
      return;
    }

    if (targetStatus === 'Repaired') {
      const duration = prompt('Enter repair duration in hours:');
      if (!duration || isNaN(Number(duration))) {
        setDraggedRequest(null);
        return;
      }
      await updateRequestStatus(draggedRequest.id, targetStatus, Number(duration));
    } else {
      await updateRequestStatus(draggedRequest.id, targetStatus);
    }

    setDraggedRequest(null);
  };

  const updateRequestStatus = async (requestId: string, newStatus: Status, durationHours?: number) => {
    setUpdatingRequest(requestId);

    try {
      if (!isManager) {
        throw new Error('Insufficient permissions to update request status');
      }

      const { supabase } = await import('../lib/supabase');
      const session = await supabase.auth.getSession();

      if (!session.data.session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/update-request-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          new_status: newStatus,
          duration_hours: durationHours,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update request status');
    } finally {
      setUpdatingRequest(null);
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!isManager) {
      alert('Insufficient permissions to delete request');
      return;
    }

    if (!confirm('Are you sure you want to delete this request?')) return;

    setUpdatingRequest(requestId);

    try {
      const { supabase } = await import('../lib/supabase');
      const session = await supabase.auth.getSession();

      if (!session.data.session) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase.from('requests').delete().eq('id', requestId);
      if (error) throw error;
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete request');
    } finally {
      setUpdatingRequest(null);
    }
  };

  const getEquipmentName = (equipmentId: string) => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq?.name || 'Unknown';
  };

  const isHighRisk = (equipmentId: string) => {
    return highRiskEquipment[equipmentId] || false;
  };

  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="h-full p-6 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Kanban Board</h1>
        <div>
          {isManager ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2"
              title="Create Request"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          ) : (
            <div />
          )}

          {user && user.user_metadata && (user.user_metadata as { role?: string }).role === 'manager' && !profile?.role && (
            <div className="mt-2 text-xs text-amber-700">Account pending verification — complete sign-in after email confirmation to enable manager actions.</div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateRequestModal onClose={() => setShowCreateModal(false)} />
      )}

      <div className="flex gap-4 min-w-max h-full">
        {columns.map((status) => (
          <div
            key={status}
            className="flex-1 min-w-80 bg-slate-50 rounded-lg p-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">{status}</h2>
              <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-sm font-medium">
                {requests.filter((r) => r.status === status).length}
              </span>
            </div>

            <div className="space-y-3">
              {requests
                .filter((r) => r.status === status)
                .map((request) => (
                  <div
                    key={request.id}
                    draggable={isManager && updatingRequest !== request.id}
                    onDragStart={(e) => handleDragStart(e, request)}
                    className={`bg-white rounded-lg p-4 shadow-sm border border-slate-200 ${isManager ? 'cursor-move hover:shadow-md' : ''} transition-shadow ${
                      updatingRequest === request.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-slate-900 flex-1">{request.title}</h3>

                      <div className="flex items-center gap-2">
                        {isHighRisk(request.equipment_id) && (
                          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        )}

                        {isManager && (
                          <button
                            onClick={async () => deleteRequest(request.id)}
                            className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                            title="Delete Request"
                          >
                            <Trash2 className="w-4 h-4 text-slate-500" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mb-3">{request.description}</p>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getEquipmentName(request.equipment_id)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.type === 'Corrective'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {request.type}
                      </span>
                      {request.duration_hours && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {request.duration_hours}h
                        </span>
                      )}
                    </div>

                    {request.scheduled_date && (
                      <div className="mt-2 text-xs text-slate-500">
                        Scheduled: {new Date(request.scheduled_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
