'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SortState } from '@/types';
import { useToast } from '@/components/Toast';
import { TableRowSkeleton } from '@/components/LoadingSkeleton';
import Pagination from '@/components/Pagination';
import BulkActions from '@/components/BulkActions';
import ExportButtons, { exportToJSON, exportToCSV, exportToPDF } from '@/components/ExportButtons';
import ConfirmDialog from '@/components/ConfirmDialog';
import SortHeader, { useSortData, toggleSort } from '@/components/SortHeader';

type EntityType = 'clients' | 'coaches' | 'workouts' | 'exercises' | 'meal-plans' | 'recipes' | 'wellness-goals' | 'appointments' | 'progress-logs' | 'users' | 'roles' | 'notifications';

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
  users: number;
  roles: number;
  notifications: number;
}

const sections: { id: EntityType; label: string; icon: string; statKey: keyof Stats }[] = [
  { id: 'clients', label: 'Clients', icon: '\u{1F465}', statKey: 'clients' },
  { id: 'coaches', label: 'Coaches', icon: '\u{1F3CB}\uFE0F', statKey: 'coaches' },
  { id: 'workouts', label: 'Workouts', icon: '\u{1F4AA}', statKey: 'workouts' },
  { id: 'exercises', label: 'Exercises', icon: '\u{1F3C3}', statKey: 'exercises' },
  { id: 'meal-plans', label: 'Meal Plans', icon: '\u{1F957}', statKey: 'mealPlans' },
  { id: 'recipes', label: 'Recipes', icon: '\u{1F373}', statKey: 'recipes' },
  { id: 'wellness-goals', label: 'Goals', icon: '\u{1F3AF}', statKey: 'goals' },
  { id: 'appointments', label: 'Appointments', icon: '\u{1F4C5}', statKey: 'appointments' },
  { id: 'progress-logs', label: 'Progress Logs', icon: '\u{1F4CA}', statKey: 'progressLogs' },
  { id: 'users', label: 'Users', icon: '\u{1F464}', statKey: 'users' },
  { id: 'roles', label: 'Roles', icon: '\u{1F512}', statKey: 'roles' },
  { id: 'notifications', label: 'Notifications', icon: '\u{1F514}', statKey: 'notifications' },
];

const getDisplayColumns = (section: EntityType): { field: string; label: string }[] => {
  switch (section) {
    case 'clients':
      return [
        { field: 'name', label: 'Name' },
        { field: 'email', label: 'Email' },
        { field: 'phone', label: 'Phone' },
        { field: 'status', label: 'Status' },
        { field: 'goals', label: 'Goals' },
      ];
    case 'coaches':
      return [
        { field: 'name', label: 'Name' },
        { field: 'email', label: 'Email' },
        { field: 'specialization', label: 'Specialization' },
        { field: 'experience', label: 'Experience' },
        { field: 'rating', label: 'Rating' },
      ];
    case 'workouts':
      return [
        { field: 'name', label: 'Name' },
        { field: 'clientName', label: 'Client' },
        { field: 'category', label: 'Category' },
        { field: 'difficulty', label: 'Difficulty' },
        { field: 'duration', label: 'Duration' },
      ];
    case 'exercises':
      return [
        { field: 'name', label: 'Name' },
        { field: 'muscleGroup', label: 'Muscle Group' },
        { field: 'equipment', label: 'Equipment' },
        { field: 'sets', label: 'Sets' },
        { field: 'reps', label: 'Reps' },
      ];
    case 'meal-plans':
      return [
        { field: 'name', label: 'Name' },
        { field: 'clientName', label: 'Client' },
        { field: 'category', label: 'Category' },
        { field: 'calories', label: 'Calories' },
        { field: 'duration', label: 'Duration' },
      ];
    case 'recipes':
      return [
        { field: 'name', label: 'Name' },
        { field: 'category', label: 'Category' },
        { field: 'calories', label: 'Calories' },
        { field: 'prepTime', label: 'Prep Time' },
        { field: 'servings', label: 'Servings' },
      ];
    case 'wellness-goals':
      return [
        { field: 'title', label: 'Title' },
        { field: 'clientName', label: 'Client' },
        { field: 'goalType', label: 'Goal Type' },
        { field: 'status', label: 'Status' },
        { field: 'targetDate', label: 'Target Date' },
      ];
    case 'appointments':
      return [
        { field: 'clientName', label: 'Client' },
        { field: 'coachName', label: 'Coach' },
        { field: 'appointmentType', label: 'Type' },
        { field: 'date', label: 'Date' },
        { field: 'status', label: 'Status' },
      ];
    case 'progress-logs':
      return [
        { field: 'clientName', label: 'Client' },
        { field: 'date', label: 'Date' },
        { field: 'weight', label: 'Weight' },
        { field: 'sleepHours', label: 'Sleep (hrs)' },
        { field: 'energyLevel', label: 'Energy' },
      ];
    case 'users':
      return [
        { field: 'username', label: 'Username' },
        { field: 'email', label: 'Email' },
        { field: 'firstName', label: 'First Name' },
        { field: 'lastName', label: 'Last Name' },
        { field: 'role', label: 'Role' },
      ];
    case 'roles':
      return [
        { field: 'name', label: 'Name' },
        { field: 'description', label: 'Description' },
        { field: 'permissions', label: 'Permissions' },
        { field: 'isDefault', label: 'Default' },
      ];
    case 'notifications':
      return [
        { field: 'title', label: 'Title' },
        { field: 'message', label: 'Message' },
        { field: 'type', label: 'Type' },
        { field: 'isRead', label: 'Read' },
        { field: 'createdAt', label: 'Created' },
      ];
    default:
      return [{ field: 'name', label: 'Name' }];
  }
};

const getEditRoute = (section: EntityType): string => {
  switch (section) {
    case 'clients': return '/clients';
    case 'coaches': return '/admin';
    case 'workouts':
    case 'exercises': return '/fitness';
    case 'meal-plans':
    case 'recipes': return '/nutrition';
    case 'wellness-goals':
    case 'progress-logs': return '/wellness';
    case 'appointments': return '/appointments';
    case 'users':
    case 'roles':
    case 'notifications': return '/admin';
    default: return '/';
  }
};

const getItemName = (item: Record<string, unknown>): string => {
  return (item.name || item.title || item.username || item.clientName || 'Item') as string;
};

const formatFieldName = (key: string): string => {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

const formatFieldValue = (key: string, value: unknown): string => {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (key.includes('Date') || key === 'createdAt' || key === 'updatedAt' || key === 'lastLogin') {
    try {
      return new Date(value as string).toLocaleDateString();
    } catch {
      return String(value);
    }
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (key === 'isDefault' || key === 'isRead' || key === 'isActive') {
    return value === 1 || value === true ? 'Yes' : 'No';
  }
  return String(value);
};

const statusBadge = (value: unknown): string | null => {
  const s = String(value).toLowerCase();
  if (['active', 'completed', 'success'].includes(s)) return 'bg-green-500/20 text-green-400';
  if (['inactive', 'cancelled', 'error', 'paused'].includes(s)) return 'bg-red-500/20 text-red-400';
  if (['pending', 'scheduled', 'in_progress', 'warning'].includes(s)) return 'bg-yellow-500/20 text-yellow-400';
  if (['no_show', 'info'].includes(s)) return 'bg-blue-500/20 text-blue-400';
  return null;
};

export default function AdminPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [stats, setStats] = useState<Stats>({
    clients: 0, coaches: 0, workouts: 0, exercises: 0, mealPlans: 0,
    recipes: 0, goals: 0, appointments: 0, progressLogs: 0,
    users: 0, roles: 0, notifications: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<EntityType>('clients');
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [sectionLoading, setSectionLoading] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Sort
  const [sort, setSort] = useState<SortState>({ field: '', direction: 'asc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Selection for bulk ops
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Record<string, unknown> | null>(null);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', confirmLabel: 'Confirm', type: 'danger', onConfirm: () => {} });

  // ---------- Data fetching ----------

  const fetchStats = useCallback(async () => {
    try {
      const endpoints = [
        '/api/clients', '/api/coaches', '/api/workouts', '/api/exercises',
        '/api/meal-plans', '/api/recipes', '/api/wellness-goals', '/api/appointments',
        '/api/progress-logs', '/api/users', '/api/roles', '/api/notifications',
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
        users: Array.isArray(results[9]) ? results[9].length : 0,
        roles: Array.isArray(results[10]) ? results[10].length : 0,
        notifications: Array.isArray(results[11]) ? results[11].length : 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      showToast('Failed to fetch stats', 'error');
    } finally {
      setStatsLoading(false);
    }
  }, [showToast]);

  const fetchSectionData = useCallback(async () => {
    setSectionLoading(true);
    try {
      const res = await fetch(`/api/${activeSection}`);
      const result = await res.json();
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Failed to fetch section data:', error);
      setData([]);
      showToast(`Failed to load ${activeSection.replace('-', ' ')}`, 'error');
    } finally {
      setSectionLoading(false);
    }
  }, [activeSection, showToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchSectionData();
    setSearchQuery('');
    setSort({ field: '', direction: 'asc' });
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [activeSection, fetchSectionData]);

  // ---------- Filtering, sorting, pagination ----------

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(item =>
      Object.values(item).some(val =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      )
    );
  }, [data, searchQuery]);

  const sortedData = useSortData(filteredData, sort);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safePage, pageSize]);

  // ---------- Row numbering offset ----------
  const rowOffset = (safePage - 1) * pageSize;

  // ---------- Sort handler ----------

  const handleSort = (field: string) => {
    setSort(prev => toggleSort(prev, field));
    setCurrentPage(1);
  };

  // ---------- Selection ----------

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredData.map(item => item.id as string)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // ---------- Row click -> detail modal ----------

  const handleRowClick = (item: Record<string, unknown>) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  // ---------- Delete single ----------

  const handleDeleteItem = (e: React.MouseEvent, item: Record<string, unknown>) => {
    e.stopPropagation();
    const name = getItemName(item);
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Item',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/${activeSection}?id=${item.id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast(`"${name}" deleted successfully`, 'success');
            fetchSectionData();
            fetchStats();
          } else {
            showToast('Failed to delete item', 'error');
          }
        } catch {
          showToast('Failed to delete item', 'error');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // ---------- Delete from detail modal ----------

  const handleDeleteFromModal = () => {
    if (!selectedItem) return;
    const name = getItemName(selectedItem);
    setShowDetailModal(false);
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Item',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/${activeSection}?id=${selectedItem.id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast(`"${name}" deleted successfully`, 'success');
            fetchSectionData();
            fetchStats();
          } else {
            showToast('Failed to delete item', 'error');
          }
        } catch {
          showToast('Failed to delete item', 'error');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setSelectedItem(null);
      },
    });
  };

  // ---------- Bulk delete ----------

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Bulk Delete',
      message: `Are you sure you want to delete ${selectedIds.size} selected item(s)? This action cannot be undone.`,
      confirmLabel: `Delete ${selectedIds.size}`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const promises = Array.from(selectedIds).map(id =>
            fetch(`/api/${activeSection}?id=${id}`, { method: 'DELETE' })
          );
          await Promise.all(promises);
          showToast(`${selectedIds.size} item(s) deleted`, 'success');
          setSelectedIds(new Set());
          fetchSectionData();
          fetchStats();
        } catch {
          showToast('Bulk delete failed', 'error');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // ---------- Bulk export ----------

  const handleBulkExport = () => {
    const selectedItems = data.filter(item => selectedIds.has(item.id as string));
    exportToJSON(selectedItems, `${activeSection}-selected`);
    showToast(`Exported ${selectedItems.length} item(s)`, 'success');
  };

  // ---------- Page/size handlers ----------

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // ---------- Section switch ----------

  const handleSectionChange = (sectionId: EntityType) => {
    setActiveSection(sectionId);
  };

  // ---------- Display columns for active section ----------

  const columns = getDisplayColumns(activeSection);
  const sectionMeta = sections.find(s => s.id === activeSection);

  // ---------- Cell rendering ----------

  const renderCellValue = (field: string, value: unknown): React.ReactNode => {
    if (value === null || value === undefined || value === '') return <span className="text-gray-500">-</span>;

    // Status badges
    if (field === 'status' || field === 'type') {
      const badge = statusBadge(value);
      if (badge) {
        return (
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge}`}>
            {String(value).replace('_', ' ')}
          </span>
        );
      }
    }

    // Boolean-like fields
    if (field === 'isDefault' || field === 'isRead' || field === 'isActive') {
      const b = value === 1 || value === true;
      return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${b ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
          {b ? 'Yes' : 'No'}
        </span>
      );
    }

    // Date fields
    if (field.includes('Date') || field === 'createdAt' || field === 'updatedAt' || field === 'lastLogin' || field === 'date') {
      try {
        return new Date(value as string).toLocaleDateString();
      } catch {
        return String(value);
      }
    }

    const str = String(value);
    if (str.length > 40) return `${str.substring(0, 40)}...`;
    return str;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleSectionChange(section.id)}
              className={`p-4 rounded-xl border transition-all text-left ${
                activeSection === section.id
                  ? 'bg-gray-700 border-gray-500 ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/10'
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-500 hover:bg-gray-700/50'
              }`}
            >
              <div className="text-2xl mb-1">{section.icon}</div>
              <p className="text-white font-bold text-lg">
                {statsLoading ? '...' : stats[section.statKey]}
              </p>
              <p className="text-gray-400 text-xs truncate">{section.label}</p>
            </button>
          ))}
        </div>

        {/* Active Section Panel */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">

          {/* Section Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-white capitalize flex items-center gap-2">
                {sectionMeta?.icon}
                {activeSection.replace(/-/g, ' ')}
                <span className="text-gray-400 text-sm font-normal">
                  ({filteredData.length}{filteredData.length !== data.length ? ` of ${data.length}` : ''} items)
                </span>
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <ExportButtons
                  data={filteredData as Record<string, unknown>[]}
                  filename={activeSection}
                />
                <button
                  onClick={() => { fetchSectionData(); showToast('Data refreshed', 'info'); }}
                  className="px-3 py-1.5 bg-gray-700 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mt-4 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder={`Search ${activeSection.replace(/-/g, ' ')}...`}
                className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="px-6 pt-4">
              <BulkActions
                selectedCount={selectedIds.size}
                totalCount={filteredData.length}
                onSelectAll={selectAll}
                onDeselectAll={deselectAll}
                onBulkDelete={handleBulkDelete}
                onBulkExport={handleBulkExport}
              />
            </div>
          )}

          {/* Table */}
          <div className="p-6 pt-2">
            {sectionLoading ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-4 text-left w-10">
                        <div className="h-4 w-4 bg-gray-700 rounded animate-pulse" />
                      </th>
                      <th className="py-3 px-4 text-left text-gray-400 font-medium text-sm w-12">#</th>
                      {columns.map(col => (
                        <th key={col.field} className="py-3 px-4 text-left text-gray-400 font-medium text-sm">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <TableRowSkeleton key={i} cols={columns.length + 1} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : paginatedData.length === 0 ? (
              <div className="text-center text-gray-400 py-16">
                <div className="text-4xl mb-3">{sectionMeta?.icon}</div>
                <p className="text-lg font-medium mb-1">
                  {searchQuery ? 'No results found' : 'No data yet'}
                </p>
                <p className="text-sm">
                  {searchQuery
                    ? `No ${activeSection.replace(/-/g, ' ')} match "${searchQuery}"`
                    : `No ${activeSection.replace(/-/g, ' ')} have been created.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-4 text-left w-10">
                        <input
                          type="checkbox"
                          checked={paginatedData.length > 0 && paginatedData.every(item => selectedIds.has(item.id as string))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(prev => {
                                const next = new Set(prev);
                                paginatedData.forEach(item => next.add(item.id as string));
                                return next;
                              });
                            } else {
                              setSelectedIds(prev => {
                                const next = new Set(prev);
                                paginatedData.forEach(item => next.delete(item.id as string));
                                return next;
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4 text-left text-gray-400 font-medium text-sm w-12">#</th>
                      {columns.map(col => (
                        <th key={col.field} className="py-3 px-4 text-left">
                          <SortHeader
                            label={col.label}
                            field={col.field}
                            sort={sort}
                            onSort={handleSort}
                          />
                        </th>
                      ))}
                      <th className="py-3 px-4 text-right text-gray-400 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item, index) => {
                      const id = item.id as string;
                      const isSelected = selectedIds.has(id);
                      return (
                        <tr
                          key={id}
                          onClick={() => handleRowClick(item)}
                          className={`border-b border-gray-700/50 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-500/10 hover:bg-indigo-500/20'
                              : 'hover:bg-gray-700/50'
                          }`}
                        >
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(id)}
                              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-sm font-mono">
                            {rowOffset + index + 1}
                          </td>
                          {columns.map(col => (
                            <td key={col.field} className="py-3 px-4 text-white text-sm">
                              {renderCellValue(col.field, item[col.field])}
                            </td>
                          ))}
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(getEditRoute(activeSection));
                                }}
                                className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => handleDeleteItem(e, item)}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!sectionLoading && sortedData.length > 0 && (
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={sortedData.length}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* Detail View Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-700 shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {sectionMeta?.icon}{' '}
                {activeSection.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(selectedItem).map(([key, value]) => (
                  <div
                    key={key}
                    className={`p-3 bg-gray-700/50 rounded-lg ${
                      ['description', 'notes', 'instructions', 'meals', 'ingredients', 'exercises', 'permissions', 'bio', 'certifications', 'availability', 'message'].includes(key)
                        ? 'sm:col-span-2'
                        : ''
                    }`}
                  >
                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
                      {formatFieldName(key)}
                    </p>
                    <p className="text-white text-sm break-words">
                      {formatFieldValue(key, value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 p-6 border-t border-gray-700 shrink-0">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  router.push(getEditRoute(activeSection));
                }}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteFromModal}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
