import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Wrench } from 'lucide-react';
import { useEquipment } from '../hooks/useRealtime';

interface EquipmentStats {
  equipment_id: string;
  equipment_name: string;
  breakdown_count: number;
  avg_repair_time: number;
  is_high_risk: boolean;
  active_request_count: number;
}

export function EquipmentDashboard() {
  const { equipment } = useEquipment();
  const [stats, setStats] = useState<EquipmentStats[]>([]);
  const [loading, setLoading] = useState(true);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
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
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [supabaseUrl]);

  if (loading && stats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading equipment data...</div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Equipment Dashboard</h1>
        <p className="text-slate-600">Live monitoring of all equipment assets and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const equipmentData = equipment.find(e => e.id === stat.equipment_id);
          const isScrapped = equipmentData?.is_scrapped || false;

          return (
            <div
              key={stat.equipment_id}
              className={`bg-white rounded-lg shadow-sm border-2 p-6 transition-all ${
                stat.is_high_risk && !isScrapped
                  ? 'border-red-300 bg-red-50'
                  : isScrapped
                  ? 'border-slate-300 bg-slate-50 opacity-75'
                  : 'border-slate-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {stat.equipment_name}
                  </h3>
                  {equipmentData?.description && (
                    <p className="text-sm text-slate-600">{equipmentData.description}</p>
                  )}
                </div>
                {stat.is_high_risk && !isScrapped && (
                  <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 ml-2" />
                )}
                {isScrapped && (
                  <div className="bg-slate-700 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Scrapped
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-slate-600" />
                    <span className="text-sm text-slate-700">Breakdowns</span>
                  </div>
                  <span className={`font-semibold ${
                    stat.breakdown_count > 3 ? 'text-red-600' : 'text-slate-900'
                  }`}>
                    {stat.breakdown_count}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-600" />
                    <span className="text-sm text-slate-700">Avg Repair Time</span>
                  </div>
                  <span className={`font-semibold ${
                    stat.avg_repair_time > 24 ? 'text-red-600' : 'text-slate-900'
                  }`}>
                    {stat.avg_repair_time}h
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-slate-600" />
                    <span className="text-sm text-slate-700">Active Requests</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {stat.active_request_count}
                  </span>
                </div>
              </div>

              {equipmentData?.warranty_expiry && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="text-xs text-slate-600">
                    Warranty Expires: {new Date(equipmentData.warranty_expiry).toLocaleDateString()}
                  </div>
                </div>
              )}

              {stat.is_high_risk && !isScrapped && (
                <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">
                    High Risk: Requires immediate attention
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {stats.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No equipment found. Add equipment to start tracking.</p>
        </div>
      )}
    </div>
  );
}
