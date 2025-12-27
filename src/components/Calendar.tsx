import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useRequests, useEquipment } from '../hooks/useRealtime';
import { CreateRequestModal } from './CreateRequestModal';
import { useAuth } from '../contexts/AuthContext';

export function Calendar() {
  const { requests } = useRequests();
  const { equipment } = useEquipment();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const preventiveRequests = requests.filter(r => r.type === 'Preventive' && r.scheduled_date);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getRequestsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return preventiveRequests.filter(r => r.scheduled_date === dateStr);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setShowCreateModal(true);
  };

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  }, [daysInMonth, startingDayOfWeek]);

  const getEquipmentName = (equipmentId: string) => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq?.name || 'Unknown';
  };

  const { profile, user } = useAuth();
  const userMetaRole = user && typeof user.user_metadata === 'object' && user.user_metadata !== null
    ? (user.user_metadata as { role?: string }).role
    : undefined;
  const isManager = profile?.role === 'manager' || userMetaRole === 'manager';

  const deleteScheduledRequest = async (requestId: string) => {
    if (!isManager) {
      alert('Insufficient permissions to delete scheduled request');
      return;
    }

    if (!confirm('Are you sure you want to delete this scheduled request?')) return;

    try {
      const { supabase } = await import('../lib/supabase');
      const session = await supabase.auth.getSession();

      if (!session.data.session) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase.from('requests').delete().eq('id', requestId);
      if (error) throw error;
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete scheduled request');
    }
  };

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Preventive Maintenance Calendar</h1>
          {isManager ? (
            <button
              onClick={() => {
                setSelectedDate(null);
                setShowCreateModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Schedule Maintenance
            </button>
          ) : (
            <div />
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-slate-600" />
            </button>

            <h2 className="text-xl font-semibold text-slate-900">
              {monthNames[month]} {year}
            </h2>

            <button
              onClick={nextMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center font-semibold text-slate-700 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dayRequests = getRequestsForDate(day);
              const isToday =
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square p-2 rounded-lg border transition-all hover:shadow-md ${
                    isToday
                      ? 'border-blue-500 bg-blue-50'
                      : dayRequests.length > 0
                      ? 'border-green-300 bg-green-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-medium text-slate-900 mb-1">{day}</div>
                  {dayRequests.length > 0 && (
                    <div className="space-y-1">
                      {dayRequests.slice(0, 2).map(req => (
                        <div
                          key={req.id}
                          className="text-xs bg-green-600 text-white px-2 py-0.5 rounded truncate"
                          title={`${getEquipmentName(req.equipment_id)} - ${req.title}`}
                        >
                          {getEquipmentName(req.equipment_id)}
                        </div>
                      ))}
                      {dayRequests.length > 2 && (
                        <div className="text-xs text-green-700 font-medium">
                          +{dayRequests.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Upcoming Preventive Maintenance</h3>
          <div className="space-y-3">
            {preventiveRequests
              .filter(r => {
                const schedDate = new Date(r.scheduled_date!);
                return schedDate >= new Date();
              })
              .sort((a, b) => {
                return new Date(a.scheduled_date!).getTime() - new Date(b.scheduled_date!).getTime();
              })
              .slice(0, 5)
              .map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{req.title}</div>
                    <div className="text-sm text-slate-600">
                      {getEquipmentName(req.equipment_id)}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-700">
                    {new Date(req.scheduled_date!).toLocaleDateString()}
                  </div>

                  {isManager && (
                    <button
                      onClick={() => deleteScheduledRequest(req.id)}
                      className="ml-4 p-1 hover:bg-slate-100 rounded-md transition-colors"
                      title="Delete Scheduled Request"
                    >
                      <Trash2 className="w-4 h-4 text-slate-500" />
                    </button>
                  )}
                </div>
              ))}
            {preventiveRequests.filter(r => new Date(r.scheduled_date!) >= new Date()).length === 0 && (
              <p className="text-slate-500 text-center py-4">No upcoming preventive maintenance scheduled</p>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateRequestModal
          scheduledDate={selectedDate}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
}
