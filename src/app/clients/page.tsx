'use client';

import { useState, useEffect, useMemo } from 'react';
import { Client, SortState } from '@/types';
import { useToast } from '@/components/Toast';
import { GridSkeleton } from '@/components/LoadingSkeleton';
import SortHeader, { useSortData, toggleSort } from '@/components/SortHeader';
import Pagination from '@/components/Pagination';
import BulkActions from '@/components/BulkActions';
import ExportButtons, { exportToJSON, exportToCSV, exportToPDF } from '@/components/ExportButtons';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function ClientsPage() {
  // --- Core data state ---
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Toast ---
  const { showToast } = useToast();

  // --- Modals ---
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // --- Confirm dialog ---
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => () => {});

  // --- Search & filters ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGender, setFilterGender] = useState('all');

  // --- Sort ---
  const [sort, setSort] = useState<SortState>({ field: 'name', direction: 'asc' });

  // --- Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // --- Bulk selection ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // --- AI loading ---
  const [aiLoading, setAiLoading] = useState(false);

  // --- Form data ---
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    goals: '',
    healthConditions: '',
    status: 'active',
    notes: '',
  });

  // --- Form validation errors ---
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ======== Fetch clients ========
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('Failed to fetch clients');
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      showToast('Failed to load clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ======== Filtering ========
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        (client.phone && client.phone.toLowerCase().includes(term)) ||
        (client.goals && client.goals.toLowerCase().includes(term));
      const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
      const matchesGender = filterGender === 'all' || client.gender === filterGender;
      return matchesSearch && matchesStatus && matchesGender;
    });
  }, [clients, searchTerm, filterStatus, filterGender]);

  // ======== Sorting ========
  const sortedClients = useSortData(filteredClients, sort);

  const handleSort = (field: string) => {
    setSort(toggleSort(sort, field));
    setCurrentPage(1);
  };

  // ======== Pagination ========
  const totalPages = Math.max(1, Math.ceil(sortedClients.length / pageSize));
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedClients.slice(start, start + pageSize);
  }, [sortedClients, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterGender, pageSize]);

  // ======== Bulk selection ========
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredClients.map((c) => c.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // ======== Form validation ========
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (formData.age && (isNaN(Number(formData.age)) || Number(formData.age) < 0 || Number(formData.age) > 150)) {
      errors.age = 'Age must be a number between 0 and 150';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ======== Submit (create / update) ========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const method = editingClient ? 'PUT' : 'POST';
      const body = editingClient
        ? { ...formData, id: editingClient.id, age: parseInt(formData.age) || 0 }
        : { ...formData, age: parseInt(formData.age) || 0 };

      const res = await fetch('/api/clients', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Save failed');
      }

      await fetchClients();
      closeFormModal();
      showToast(
        editingClient ? `"${formData.name}" updated successfully` : `"${formData.name}" created successfully`,
        'success'
      );
    } catch (error) {
      console.error('Failed to save client:', error);
      showToast(
        editingClient ? 'Failed to update client' : 'Failed to create client',
        'error'
      );
    }
  };

  // ======== Delete single ========
  const handleDeleteClick = (id: string, name: string) => {
    setConfirmTitle('Delete Client?');
    setConfirmMessage(`Are you sure you want to delete "${name}"? This action cannot be undone.`);
    setConfirmAction(() => async () => {
      try {
        const res = await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        await fetchClients();
        setConfirmOpen(false);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        // Close detail modal if we just deleted the viewed client
        if (viewingClient?.id === id) {
          setShowDetailModal(false);
          setViewingClient(null);
        }
        showToast(`"${name}" deleted successfully`, 'success');
      } catch (error) {
        console.error('Failed to delete client:', error);
        showToast('Failed to delete client', 'error');
      }
    });
    setConfirmOpen(true);
  };

  // ======== Bulk delete ========
  const handleBulkDelete = () => {
    const count = selectedIds.size;
    setConfirmTitle(`Delete ${count} Client${count > 1 ? 's' : ''}?`);
    setConfirmMessage(`Are you sure you want to delete ${count} selected client${count > 1 ? 's' : ''}? This action cannot be undone.`);
    setConfirmAction(() => async () => {
      try {
        const deletePromises = Array.from(selectedIds).map((id) =>
          fetch(`/api/clients?id=${id}`, { method: 'DELETE' })
        );
        await Promise.all(deletePromises);
        await fetchClients();
        setSelectedIds(new Set());
        setConfirmOpen(false);
        showToast(`${count} client${count > 1 ? 's' : ''} deleted successfully`, 'success');
      } catch (error) {
        console.error('Failed to bulk delete:', error);
        showToast('Failed to delete some clients', 'error');
      }
    });
    setConfirmOpen(true);
  };

  // ======== Bulk export ========
  const handleBulkExport = () => {
    const selected = clients.filter((c) => selectedIds.has(c.id));
    exportToJSON(selected, 'clients-selected');
    showToast(`Exported ${selected.length} client${selected.length > 1 ? 's' : ''}`, 'success');
  };

  // ======== Edit handler ========
  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      age: client.age?.toString() || '',
      gender: client.gender || '',
      goals: client.goals || '',
      healthConditions: client.healthConditions || '',
      status: client.status || 'active',
      notes: client.notes || '',
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  // ======== Add new ========
  const handleAddNew = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      age: '',
      gender: '',
      goals: '',
      healthConditions: '',
      status: 'active',
      notes: '',
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  // ======== Close form modal ========
  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingClient(null);
    setFormErrors({});
  };

  // ======== Card click -> detail view ========
  const handleCardClick = (client: Client) => {
    setViewingClient(client);
    setShowDetailModal(true);
  };

  // ======== AI generation ========
  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'client', context: {} }),
      });
      if (!res.ok) throw new Error('AI generation failed');
      const data = await res.json();

      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        age: data.age?.toString() || '',
        gender: data.gender || '',
        goals: data.goals || '',
        healthConditions: data.healthConditions || '',
        status: data.status || 'active',
        notes: data.notes || '',
      });
      setFormErrors({});
      showToast('AI generated client data', 'success');
    } catch (error) {
      console.error('AI generation failed:', error);
      showToast('AI generation failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // ======== Status badge colors ========
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'inactive':
        return 'bg-red-500/20 text-red-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  // ======== Export data (cast for ExportButtons) ========
  const exportData = filteredClients as unknown as Record<string, unknown>[];

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ---------- Top bar: Add button + Export ---------- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Client Management</h1>
            <p className="text-gray-400 text-sm mt-1">
              {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
              {searchTerm || filterStatus !== 'all' || filterGender !== 'all' ? ' (filtered)' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButtons data={exportData} filename="clients" />
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Add Client
            </button>
          </div>
        </div>

        {/* ---------- Search & Filters ---------- */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[240px]">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, phone, goals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* ---------- Sort headers ---------- */}
        <div className="flex flex-wrap items-center gap-4 mb-4 px-1">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Sort by:</span>
          <SortHeader label="Name" field="name" sort={sort} onSort={handleSort} />
          <SortHeader label="Email" field="email" sort={sort} onSort={handleSort} />
          <SortHeader label="Status" field="status" sort={sort} onSort={handleSort} />
          <SortHeader label="Age" field="age" sort={sort} onSort={handleSort} />
        </div>

        {/* ---------- Bulk actions ---------- */}
        <BulkActions
          selectedCount={selectedIds.size}
          totalCount={filteredClients.length}
          onSelectAll={selectAllFiltered}
          onDeselectAll={deselectAll}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
        />

        {/* ---------- Content area ---------- */}
        {loading ? (
          <GridSkeleton count={6} />
        ) : paginatedClients.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <p className="text-gray-400 text-lg mb-2">No clients found</p>
            <p className="text-gray-500 text-sm mb-6">
              {searchTerm || filterStatus !== 'all' || filterGender !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first client'}
            </p>
            {!searchTerm && filterStatus === 'all' && filterGender === 'all' && (
              <button
                onClick={handleAddNew}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Your First Client
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleCardClick(client)}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer relative group"
                >
                  {/* Checkbox */}
                  <div
                    className="absolute top-3 left-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(client.id)}
                      onChange={() => toggleSelect(client.id)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-between items-start mb-4 ml-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{client.name}</h3>
                      <p className="text-gray-400 text-sm">{client.email}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(client.status)}`}
                    >
                      {client.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-400 mb-4">
                    <p>
                      <span className="text-gray-500">Phone:</span> {client.phone || 'N/A'}
                    </p>
                    <p>
                      <span className="text-gray-500">Age:</span> {client.age || 'N/A'}
                      {client.gender ? ` | ${client.gender}` : ''}
                    </p>
                    <p>
                      <span className="text-gray-500">Goals:</span>{' '}
                      {client.goals ? (client.goals.length > 60 ? client.goals.substring(0, 60) + '...' : client.goals) : 'N/A'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(client);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(client.id, client.name);
                      }}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ---------- Pagination ---------- */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedClients.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </>
        )}
      </div>

      {/* ================================================================ */}
      {/* DETAIL MODAL                                                      */}
      {/* ================================================================ */}
      {showDetailModal && viewingClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-white">Client Details</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setViewingClient(null);
                }}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Avatar + header info */}
            <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg mb-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {viewingClient.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-white text-lg font-medium">{viewingClient.name}</p>
                <p className="text-gray-400">{viewingClient.email}</p>
                <span
                  className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(viewingClient.status)}`}
                >
                  {viewingClient.status}
                </span>
              </div>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Phone</p>
                <p className="text-white font-medium">{viewingClient.phone || 'N/A'}</p>
              </div>
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Age</p>
                <p className="text-white font-medium">{viewingClient.age || 'N/A'}</p>
              </div>
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Gender</p>
                <p className="text-white font-medium">{viewingClient.gender || 'N/A'}</p>
              </div>
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Start Date</p>
                <p className="text-white font-medium">
                  {viewingClient.startDate
                    ? new Date(viewingClient.startDate).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Text blocks */}
            <div className="space-y-3 mb-4">
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Goals</p>
                <p className="text-white">{viewingClient.goals || 'No goals set'}</p>
              </div>
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Health Conditions</p>
                <p className="text-white">{viewingClient.healthConditions || 'None reported'}</p>
              </div>
              {viewingClient.notes && (
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-white">{viewingClient.notes}</p>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Created</p>
                <p className="text-white text-sm">
                  {viewingClient.createdAt
                    ? new Date(viewingClient.createdAt).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Updated</p>
                <p className="text-white text-sm">
                  {viewingClient.updatedAt
                    ? new Date(viewingClient.updatedAt).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Detail modal actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setViewingClient(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleEdit(viewingClient);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleDeleteClick(viewingClient.id, viewingClient.name);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ADD / EDIT FORM MODAL                                             */}
      {/* ================================================================ */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              <div className="flex items-center gap-2">
                {/* AI button shown on both add and edit */}
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate with AI'
                  )}
                </button>
                <button
                  onClick={closeFormModal}
                  className="text-gray-400 hover:text-white text-2xl leading-none"
                >
                  &times;
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded text-white focus:outline-none focus:border-blue-500 transition-colors ${
                    formErrors.name ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Full name"
                />
                {formErrors.name && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded text-white focus:outline-none focus:border-blue-500 transition-colors ${
                    formErrors.email ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="email@example.com"
                />
                {formErrors.email && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Phone + Age */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => {
                      setFormData({ ...formData, age: e.target.value });
                      if (formErrors.age) setFormErrors((prev) => ({ ...prev, age: '' }));
                    }}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded text-white focus:outline-none focus:border-blue-500 transition-colors ${
                      formErrors.age ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Age"
                  />
                  {formErrors.age && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.age}</p>
                  )}
                </div>
              </div>

              {/* Gender + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Goals */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Goals</label>
                <textarea
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Client goals..."
                />
              </div>

              {/* Health conditions */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Health Conditions</label>
                <textarea
                  value={formData.healthConditions}
                  onChange={(e) => setFormData({ ...formData, healthConditions: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Any health conditions..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Additional notes..."
                />
              </div>

              {/* Submit buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  {editingClient ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* CONFIRM DIALOG                                                    */}
      {/* ================================================================ */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={confirmAction}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
