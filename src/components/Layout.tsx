import { useState } from 'react';
import { LayoutDashboard, Calendar as CalendarIcon, Kanban, LogOut, Shield, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KanbanBoard } from './KanbanBoard';
import { EquipmentDashboard } from './EquipmentDashboard';
import { Calendar } from './Calendar';

type View = 'kanban' | 'dashboard' | 'calendar';

export function Layout() {
  const { profile, user, signOut } = useAuth();
  const metaRole = user && typeof user.user_metadata === 'object' && user.user_metadata !== null
    ? (user.user_metadata as { role?: string }).role
    : undefined;
  const displayRole = profile?.role || metaRole || 'technician';
  const [currentView, setCurrentView] = useState<View>('kanban');

  const navigation = [
    { id: 'kanban', name: 'Kanban Board', icon: Kanban },
    { id: 'dashboard', name: 'Equipment Dashboard', icon: LayoutDashboard },
    { id: 'calendar', name: 'Calendar', icon: CalendarIcon },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">GearGuard</h1>
                <p className="text-xs text-slate-600">Real-Time Maintenance Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                  {profile?.full_name || user?.user_metadata?.full_name || user?.email || 'User'}
                </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        profile?.role === 'manager'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {displayRole === 'manager' ? '👔 Manager' : '🔧 Technician'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors border border-red-200"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-white border-r border-slate-200 shadow-sm">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 mt-8">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-2 text-sm">Live Sync Active</h3>
              <p className="text-xs text-slate-600">
                All changes sync instantly across all users in real-time.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-700 font-medium">Connected</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden">
          {currentView === 'kanban' && <KanbanBoard />}
          {currentView === 'dashboard' && <EquipmentDashboard />}
          {currentView === 'calendar' && <Calendar />}
        </main>
      </div>
    </div>
  );
}
