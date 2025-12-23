'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Stats {
  clients: number;
  coaches: number;
  workouts: number;
  exercises: number;
  mealPlans: number;
  recipes: number;
  goals: number;
  appointments: number;
  progressLogs: number;
}

type EntityType = 'clients' | 'coaches' | 'workouts' | 'exercises' | 'meal-plans' | 'recipes' | 'wellness-goals' | 'appointments' | 'progress-logs';

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    clients: 0, coaches: 0, workouts: 0, exercises: 0, mealPlans: 0, recipes: 0, goals: 0, appointments: 0, progressLogs: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<EntityType>('clients');
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Record<string, unknown> | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchSectionData();
  }, [activeSection]);

  const fetchStats = async () => {
    try {
      const endpoints = [
        '/api/clients', '/api/coaches', '/api/workouts', '/api/exercises',
        '/api/meal-plans', '/api/recipes', '/api/wellness-goals', '/api/appointments', '/api/progress-logs'
      ];
      const responses = await Promise.all(endpoints.map(e => fetch(e)));
      const results = await Promise.all(responses.map(r => r.json()));

      setStats({
        clients: Array.isArray(results[0]) ? results[0].length : 0,
        coaches: Array.isArray(results[1]) ? results[1].length : 0,
        workouts: Array.isArray(results[2]) ? results[2].length : 0,
        exercises: Array.isArray(results[3]) ? results[3].length : 0,
        mealPlans: Array.isArray(results[4]) ? results[4].length : 0,
        recipes: Array.isArray(results[5]) ? results[5].length : 0,
        goals: Array.isArray(results[6]) ? results[6].length : 0,
        appointments: Array.isArray(results[7]) ? results[7].length : 0,
        progressLogs: Array.isArray(results[8]) ? results[8].length : 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionData = async () => {
    setSectionLoading(true);
    try {
      const res = await fetch(`/api/${activeSection}`);
      const result = await res.json();
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Failed to fetch section data:', error);
      setData([]);
    } finally {
      setSectionLoading(false);
    }
  };

  const handleRowClick = (item: Record<string, unknown>) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setDeletingItem({ id, name });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      const res = await fetch(`/api/${activeSection}?id=${deletingItem.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSectionData();
        fetchStats();
        setShowDeleteModal(false);
        setDeletingItem(null);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getEditRoute = () => {
    switch (activeSection) {
      case 'clients': return '/clients';
      case 'coaches': return '/admin';
      case 'workouts': case 'exercises': return '/fitness';
      case 'meal-plans': case 'recipes': return '/nutrition';
      case 'wellness-goals': case 'progress-logs': return '/wellness';
      case 'appointments': return '/appointments';
      default: return '/';
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(getEditRoute());
  };

  const handleExportData = async () => {
    try {
      const allData: Record<string, unknown[]> = {};
      const sections: EntityType[] = ['clients', 'coaches', 'workouts', 'exercises', 'meal-plans', 'recipes', 'wellness-goals', 'appointments', 'progress-logs'];

      for (const section of sections) {
        const res = await fetch(`/api/${section}`);
        allData[section] = await res.json();
      }

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wellness-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const handleClearSection = async () => {
    setDeletingItem({ id: 'all', name: `all ${activeSection.replace('-', ' ')}` });
    setShowDeleteModal(true);
  };

  const handleClearAllConfirm = async () => {
    try {
      for (const item of data) {
        await fetch(`/api/${activeSection}?id=${item.id}`, { method: 'DELETE' });
      }
      fetchSectionData();
      fetchStats();
      setShowDeleteModal(false);
      setDeletingItem(null);
    } catch (error) {
      console.error('Failed to clear section:', error);
    }
  };

  const sections = [
    { id: 'clients' as EntityType, label: 'Clients', icon: '👥', count: stats.clients },
    { id: 'coaches' as EntityType, label: 'Coaches', icon: '🏋️', count: stats.coaches },
    { id: 'workouts' as EntityType, label: 'Workouts', icon: '💪', count: stats.workouts },
    { id: 'wellness-goals' as EntityType, label: 'Goals', icon: '🎯', count: stats.goals },
    { id: 'appointments' as EntityType, label: 'Appointments', icon: '📅', count: stats.appointments },
    { id: 'progress-logs' as EntityType, label: 'Progress Logs', icon: '📊', count: stats.progressLogs },
  ];

  const getDisplayColumns = () => {
    switch (activeSection) {
      case 'clients': return ['name', 'email', 'status', 'goals'];
      case 'coaches': return ['name', 'specialization', 'experience', 'rating'];
      case 'workouts': return ['name', 'category', 'difficulty', 'duration'];
      case 'exercises': return ['name', 'muscleGroup', 'equipment', 'sets'];
      case 'meal-plans': return ['name', 'category', 'calories', 'duration'];
      case 'recipes': return ['name', 'category', 'calories', 'prepTime'];
      case 'wellness-goals': return ['title', 'clientName', 'goalType', 'status'];
      case 'appointments': return ['clientName', 'coachName', 'date', 'status'];
      case 'progress-logs': return ['clientName', 'date', 'weight', 'energyLevel'];
      default: return ['name'];
    }
  };

  const getItemName = (item: Record<string, unknown>) => {
    return (item.name || item.title || item.clientName || 'Item') as string;
  };

  const formatFieldName = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const formatFieldValue = (key: string, value: unknown) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (key.includes('Date') || key === 'createdAt' || key === 'updatedAt') {
      return new Date(value as string).toLocaleDateString();
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-white">← Back to Home</Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-3xl">⚙️</span> Admin Dashboard
                </h1>
                <p className="text-gray-400 text-sm">Manage all system data</p>
              </div>
            </div>
            <button onClick={handleExportData} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Export All Data
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`p-4 rounded-xl border transition-all ${
                activeSection === section.id
                  ? 'bg-gray-700 border-gray-500 ring-2 ring-blue-500'
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-1">{section.icon}</div>
              <p className="text-white font-bold">{loading ? '...' : section.count}</p>
              <p className="text-gray-400 text-xs">{section.label}</p>
            </button>
          ))}
        </div>

        {/* Active Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white capitalize flex items-center gap-2">
              {sections.find(s => s.id === activeSection)?.icon}
              {activeSection.replace('-', ' ')}
              <span className="text-gray-400 text-sm font-normal">({data.length} items)</span>
            </h2>
            <div className="flex gap-2">
              <button onClick={fetchSectionData} className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm">
                Refresh
              </button>
              <button onClick={handleClearSection} className="px-3 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 text-sm">
                Clear All
              </button>
            </div>
          </div>

          {sectionLoading ? (
            <div className="text-center text-gray-400 py-12">Loading...</div>
          ) : data.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No data found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">#</th>
                    {getDisplayColumns().map(col => (
                      <th key={col} className="text-left py-3 px-4 text-gray-400 font-medium text-sm capitalize">
                        {col.replace(/([A-Z])/g, ' $1').trim()}
                      </th>
                    ))}
                    <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr
                      key={item.id as string}
                      onClick={() => handleRowClick(item)}
                      className="border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-500 text-sm">{index + 1}</td>
                      {getDisplayColumns().map(col => (
                        <td key={col} className="py-3 px-4 text-white text-sm">
                          {typeof item[col] === 'string' && (item[col] as string).length > 30
                            ? `${(item[col] as string).substring(0, 30)}...`
                            : String(item[col] || '-')}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={handleEditClick}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, item.id as string, getItemName(item))}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Link href="/clients" className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-blue-500 hover:bg-gray-700/50 transition-all group">
            <h3 className="text-white font-medium group-hover:text-blue-400">Manage Clients →</h3>
            <p className="text-gray-400 text-sm">Add, edit, and manage client profiles</p>
          </Link>
          <Link href="/fitness" className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-green-500 hover:bg-gray-700/50 transition-all group">
            <h3 className="text-white font-medium group-hover:text-green-400">Manage Fitness →</h3>
            <p className="text-gray-400 text-sm">Workouts and exercise library</p>
          </Link>
          <Link href="/nutrition" className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-orange-500 hover:bg-gray-700/50 transition-all group">
            <h3 className="text-white font-medium group-hover:text-orange-400">Manage Nutrition →</h3>
            <p className="text-gray-400 text-sm">Meal plans and recipes</p>
          </Link>
        </div>
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-white">
                {activeSection.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Details
              </h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="space-y-3">
              {Object.entries(selectedItem)
                .filter(([key]) => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
                .map(([key, value]) => (
                  <div key={key} className="p-3 bg-gray-700/50 rounded-lg">
                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">{formatFieldName(key)}</p>
                    <p className="text-white">{formatFieldValue(key, value)}</p>
                  </div>
                ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowViewModal(false)} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                Close
              </button>
              <button onClick={() => { setShowViewModal(false); router.push(getEditRoute()); }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Go to Edit Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {deletingItem.id === 'all' ? 'Clear All?' : 'Delete Item?'}
              </h3>
              <p className="text-gray-400 mb-6">
                {deletingItem.id === 'all'
                  ? `Are you sure you want to delete ALL ${data.length} items from ${activeSection.replace('-', ' ')}? This cannot be undone.`
                  : <>Are you sure you want to delete <span className="text-white font-medium">"{deletingItem.name}"</span>? This action cannot be undone.</>
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletingItem(null); }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={deletingItem.id === 'all' ? handleClearAllConfirm : handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {deletingItem.id === 'all' ? 'Clear All' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
