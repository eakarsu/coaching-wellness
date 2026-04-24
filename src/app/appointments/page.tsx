'use client';

import { useState, useEffect } from 'react';
import { Appointment, Client, Coach } from '@/types';
import { useToast } from '@/components/Toast';
import { GridSkeleton, StatSkeleton } from '@/components/LoadingSkeleton';
import SortHeader, { useSortData, toggleSort } from '@/components/SortHeader';
import Pagination from '@/components/Pagination';
import BulkActions from '@/components/BulkActions';
import ExportButtons, { exportToJSON, exportToCSV } from '@/components/ExportButtons';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function AppointmentsPage() {
  const { showToast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    confirmLabel: string;
    onConfirm: () => void;
  }>({ title: '', message: '', type: 'danger', confirmLabel: 'Confirm', onConfirm: () => {} });

  // Search, filter, sort
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [sort, setSort] = useState({ field: 'date', direction: 'desc' as 'asc' | 'desc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // AI
  const [aiLoading, setAiLoading] = useState(false);

  // Validation
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    coachName: '',
    appointmentType: '',
    date: '',
    time: '',
    duration: '60',
    status: 'scheduled',
    notes: '',
    location: '',
    creationType: 'manual' as 'manual' | 'ai',
  });

  const appointmentTypes = [
    'Initial Consultation',
    'Follow-up',
    'Training Session',
    'Nutrition Review',
    'Progress Check',
    'Goal Setting',
    'Assessment',
  ];

  const locations = [
    'Main Studio',
    'Online/Zoom',
    'Gym Floor',
    'Nutrition Office',
    'Conference Room A',
    'Home Visit',
  ];

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, clientsRes, coachesRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/clients'),
        fetch('/api/coaches'),
      ]);
      const [appointmentsData, clientsData, coachesData] = await Promise.all([
        appointmentsRes.json(),
        clientsRes.json(),
        coachesRes.json(),
      ]);
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setCoaches(Array.isArray(coachesData) ? coachesData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Filter / Search / Sort / Paginate
  // ---------------------------------------------------------------------------

  const filteredAppointments = appointments.filter((a) => {
    const matchesSearch =
      !searchTerm ||
      (a.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.coachName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchesDate = !filterDate || a.date === filterDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const sortedAppointments = useSortData(filteredAppointments, sort);

  const totalPages = Math.max(1, Math.ceil(sortedAppointments.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedAppointments = sortedAppointments.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterDate, sort.field, sort.direction]);

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  const today = new Date().toISOString().split('T')[0];
  const todayCount = appointments.filter((a) => a.date === today).length;
  const upcomingCount = appointments.filter((a) => a.status === 'scheduled').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;

  // ---------------------------------------------------------------------------
  // Status helpers
  // ---------------------------------------------------------------------------

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-400';
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      case 'no_show':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.clientId) errors.clientId = 'Client is required';
    if (!formData.coachName) errors.coachName = 'Coach is required';
    if (!formData.appointmentType) errors.appointmentType = 'Appointment type is required';
    if (!formData.date) errors.date = 'Date is required';
    if (!formData.time) errors.time = 'Time is required';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }
    try {
      const method = editingAppointment ? 'PUT' : 'POST';
      const selectedClient = clients.find((c) => c.id === formData.clientId);
      const body = {
        ...formData,
        id: editingAppointment?.id,
        clientName: selectedClient?.name || formData.clientName,
        duration: parseInt(formData.duration) || 60,
        creationType: formData.creationType,
      };

      const res = await fetch('/api/appointments', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchData();
        closeModal();
        showToast(
          editingAppointment ? 'Appointment updated successfully' : 'Appointment scheduled successfully',
          'success'
        );
      } else {
        showToast('Failed to save appointment', 'error');
      }
    } catch (error) {
      console.error('Failed to save appointment:', error);
      showToast('Failed to save appointment', 'error');
    }
  };

  const handleDeleteClick = (id: string, clientName: string) => {
    setConfirmConfig({
      title: 'Delete Appointment?',
      message: `Are you sure you want to delete the appointment with "${clientName}"? This action cannot be undone.`,
      type: 'danger',
      confirmLabel: 'Delete',
      onConfirm: () => handleDeleteConfirm(id),
    });
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        setConfirmOpen(false);
        showToast('Appointment deleted', 'success');
      } else {
        showToast('Failed to delete appointment', 'error');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      showToast('Failed to delete appointment', 'error');
    }
  };

  const handleStatusChange = async (appointment: Appointment, newStatus: string) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...appointment, status: newStatus }),
      });
      if (res.ok) {
        fetchData();
        showToast(`Appointment marked as ${newStatus.replace('_', ' ')}`, 'success');
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // Modal helpers
  // ---------------------------------------------------------------------------

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setValidationErrors({});
    setFormData({
      clientId: appointment.clientId || '',
      clientName: appointment.clientName || '',
      coachName: appointment.coachName || '',
      appointmentType: appointment.appointmentType || '',
      date: appointment.date || '',
      time: appointment.time || '',
      duration: appointment.duration?.toString() || '60',
      status: appointment.status || 'scheduled',
      notes: appointment.notes || '',
      location: appointment.location || '',
      creationType: appointment.creationType || 'manual',
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingAppointment(null);
    setValidationErrors({});
    setFormData({
      clientId: '',
      clientName: '',
      coachName: '',
      appointmentType: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      duration: '60',
      status: 'scheduled',
      notes: '',
      location: '',
      creationType: 'manual',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAppointment(null);
    setValidationErrors({});
  };

  const handleViewDetails = (appointment: Appointment) => {
    setViewingAppointment(appointment);
    setShowViewModal(true);
  };

  // Check for existing entry when client is selected (by creation type)
  const handleClientChange = (clientId: string) => {
    const creationType = formData.creationType;
    const existingAppointment = appointments.find(
      (a) => a.clientId === clientId && a.creationType === creationType
    );
    if (existingAppointment) {
      setEditingAppointment(existingAppointment);
      setFormData({
        clientId: existingAppointment.clientId || '',
        clientName: existingAppointment.clientName || '',
        coachName: existingAppointment.coachName || '',
        appointmentType: existingAppointment.appointmentType || '',
        date: existingAppointment.date || '',
        time: existingAppointment.time || '',
        duration: existingAppointment.duration?.toString() || '60',
        status: existingAppointment.status || 'scheduled',
        notes: existingAppointment.notes || '',
        location: existingAppointment.location || '',
        creationType: existingAppointment.creationType || 'manual',
      });
    } else {
      setEditingAppointment(null);
      setFormData({ ...formData, clientId, clientName: '' });
    }
    setValidationErrors((prev) => ({ ...prev, clientId: '' }));
  };

  // ---------------------------------------------------------------------------
  // AI generation
  // ---------------------------------------------------------------------------

  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const selectedClient = clients.find((c) => c.id === formData.clientId);

      // Check if client already has an AI entry
      const existingAI = appointments.find(
        (a) => a.clientId === formData.clientId && a.creationType === 'ai'
      );
      if (existingAI) {
        setEditingAppointment(existingAI);
      }

      const context = selectedClient
        ? {
            clientName: selectedClient.name,
            clientGoals: selectedClient.goals,
            clientHealthConditions: selectedClient.healthConditions,
          }
        : {};

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'appointment', context }),
      });
      const data = await res.json();

      setFormData({
        ...formData,
        appointmentType: data.appointmentType || '',
        duration: data.duration?.toString() || '60',
        notes: data.notes || '',
        location: data.location || '',
        creationType: 'ai',
      });
      showToast('AI suggestions generated', 'success');
    } catch (error) {
      console.error('AI generation failed:', error);
      showToast('AI generation failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Bulk operations
  // ---------------------------------------------------------------------------

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

  const handleSelectAll = () => {
    const allIds = paginatedAppointments.map((a) => a.id);
    setSelectedIds(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmConfig({
      title: 'Delete Selected Appointments?',
      message: `Are you sure you want to delete ${selectedIds.size} appointment(s)? This action cannot be undone.`,
      type: 'danger',
      confirmLabel: 'Delete All',
      onConfirm: async () => {
        try {
          const deletePromises = Array.from(selectedIds).map((id) =>
            fetch(`/api/appointments?id=${id}`, { method: 'DELETE' })
          );
          await Promise.all(deletePromises);
          fetchData();
          setSelectedIds(new Set());
          setConfirmOpen(false);
          showToast(`${selectedIds.size} appointment(s) deleted`, 'success');
        } catch (error) {
          console.error('Bulk delete failed:', error);
          showToast('Failed to delete some appointments', 'error');
        }
      },
    });
    setConfirmOpen(true);
  };

  const handleBulkExport = () => {
    const selectedData = appointments.filter((a) => selectedIds.has(a.id));
    exportToJSON(selectedData, 'selected-appointments');
    showToast(`Exported ${selectedData.length} appointment(s)`, 'success');
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Banner */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">Today</p>
              <p className="text-2xl font-bold text-white">{todayCount}</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">Upcoming</p>
              <p className="text-2xl font-bold text-blue-400">{upcomingCount}</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-400">{completedCount}</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">Cancelled</p>
              <p className="text-2xl font-bold text-red-400">{cancelledCount}</p>
            </div>
          </div>
        )}

        {/* Toolbar: Search, Filters, Sort, Export, Add */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by client or coach..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 w-64"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm"
            >
              Clear Date
            </button>
          )}

          {/* Sort headers */}
          <div className="flex items-center gap-3 ml-auto">
            <SortHeader label="Date" field="date" sort={sort} onSort={(f) => setSort(toggleSort(sort, f))} />
            <SortHeader label="Client" field="clientName" sort={sort} onSort={(f) => setSort(toggleSort(sort, f))} />
            <SortHeader label="Status" field="status" sort={sort} onSort={(f) => setSort(toggleSort(sort, f))} />
          </div>
        </div>

        {/* Export + Add button row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <ExportButtons
              data={filteredAppointments as unknown as Record<string, unknown>[]}
              filename="appointments"
            />
            <span className="text-sm text-gray-500">
              {filteredAppointments.length} result{filteredAppointments.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            + Schedule Appointment
          </button>
        </div>

        {/* Bulk Actions */}
        <BulkActions
          selectedCount={selectedIds.size}
          totalCount={paginatedAppointments.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
        />

        {/* Appointments Grid */}
        {loading ? (
          <GridSkeleton count={6} />
        ) : paginatedAppointments.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-2">No appointments found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  onClick={() => handleViewDetails(appointment)}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-red-500/50 hover:bg-gray-700/50 transition-all cursor-pointer relative"
                >
                  {/* Bulk checkbox */}
                  <div className="absolute top-3 left-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(appointment.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSelect(appointment.id)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-between items-start mb-3 pl-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{appointment.clientName}</h3>
                      <p className="text-sm text-gray-400">with {appointment.coachName}</p>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          appointment.creationType === 'ai'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-gray-600/40 text-gray-300'
                        }`}
                      >
                        {appointment.creationType === 'ai' ? 'AI' : 'Manual'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {appointment.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-400 mb-4">
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500 w-4 text-center">&#128197;</span>
                      {appointment.date}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500 w-4 text-center">&#9200;</span>
                      {appointment.time} ({appointment.duration} min)
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500 w-4 text-center">&#128205;</span>
                      {appointment.location || 'N/A'}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500 w-4 text-center">&#128203;</span>
                      {appointment.appointmentType}
                    </p>
                  </div>

                  {/* Status action buttons for scheduled appointments */}
                  {appointment.status === 'scheduled' && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(appointment, 'completed');
                        }}
                        className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs hover:bg-green-600/30 transition-colors"
                      >
                        Complete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(appointment, 'cancelled');
                        }}
                        className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs hover:bg-red-600/30 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(appointment, 'no_show');
                        }}
                        className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs hover:bg-yellow-600/30 transition-colors"
                      >
                        No Show
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(appointment);
                      }}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(appointment.id, appointment.clientName);
                      }}
                      className="px-3 py-2 bg-gray-700 text-red-400 rounded hover:bg-gray-600 transition-colors text-sm border border-red-500/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={sortedAppointments.length}
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

      {/* ---------- Detail Modal ---------- */}
      {showViewModal && viewingAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-white">Appointment Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                  {viewingAppointment.clientName?.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-medium">{viewingAppointment.clientName}</p>
                  <p className="text-gray-400 text-sm">Client</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {viewingAppointment.coachName?.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-medium">{viewingAppointment.coachName}</p>
                  <p className="text-gray-400 text-sm">Coach</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Type</p>
                  <p className="text-white font-medium">{viewingAppointment.appointmentType}</p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Status</p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(
                      viewingAppointment.status
                    )}`}
                  >
                    {viewingAppointment.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Date</p>
                  <p className="text-white font-medium">{viewingAppointment.date}</p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Time</p>
                  <p className="text-white font-medium">{viewingAppointment.time}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Duration</p>
                  <p className="text-white font-medium">{viewingAppointment.duration} minutes</p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Location</p>
                  <p className="text-white font-medium">{viewingAppointment.location || 'N/A'}</p>
                </div>
              </div>

              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Created Via</p>
                <span
                  className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                    viewingAppointment.creationType === 'ai'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-gray-600/40 text-gray-300'
                  }`}
                >
                  {viewingAppointment.creationType === 'ai' ? 'AI Generated' : 'Manual'}
                </span>
              </div>

              {viewingAppointment.notes && (
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-white">{viewingAppointment.notes}</p>
                </div>
              )}

              {/* Status actions inside detail modal for scheduled */}
              {viewingAppointment.status === 'scheduled' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleStatusChange(viewingAppointment, 'completed');
                      setShowViewModal(false);
                    }}
                    className="flex-1 px-3 py-2 bg-green-600/20 text-green-400 rounded-lg text-sm hover:bg-green-600/30 transition-colors border border-green-500/30"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(viewingAppointment, 'cancelled');
                      setShowViewModal(false);
                    }}
                    className="flex-1 px-3 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition-colors border border-red-500/30"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(viewingAppointment, 'no_show');
                      setShowViewModal(false);
                    }}
                    className="flex-1 px-3 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-600/30 transition-colors border border-yellow-500/30"
                  >
                    No Show
                  </button>
                </div>
              )}
            </div>

            {/* Detail modal: Edit + Delete buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(viewingAppointment);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleDeleteClick(viewingAppointment.id, viewingAppointment.clientName);
                }}
                className="px-4 py-2 bg-gray-700 text-red-400 rounded-lg hover:bg-gray-600 transition-colors border border-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Edit / Add Modal ---------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingAppointment ? 'Edit Appointment' : 'Schedule Appointment'}
              </h2>
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={aiLoading || !formData.clientId}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!formData.clientId ? 'Select a client first' : ''}
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
                  <>Generate with AI</>
                )}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Client *</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded text-white focus:outline-none focus:border-red-500 ${
                      validationErrors.clientId ? 'border-red-500' : 'border-gray-600'
                    }`}
                  >
                    <option value="">Select Client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.clientId && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.clientId}</p>
                  )}
                  {editingAppointment && (
                    <p className="text-xs text-yellow-400 mt-1">
                      Editing existing {formData.creationType} entry
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Coach *</label>
                  <select
                    value={formData.coachName}
                    onChange={(e) => {
                      setFormData({ ...formData, coachName: e.target.value });
                      setValidationErrors((prev) => ({ ...prev, coachName: '' }));
                    }}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded text-white focus:outline-none focus:border-red-500 ${
                      validationErrors.coachName ? 'border-red-500' : 'border-gray-600'
                    }`}
                  >
                    <option value="">Select Coach</option>
                    {coaches.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.coachName && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.coachName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Appointment Type *</label>
                <select
                  value={formData.appointmentType}
                  onChange={(e) => {
                    setFormData({ ...formData, appointmentType: e.target.value });
                    setValidationErrors((prev) => ({ ...prev, appointmentType: '' }));
                  }}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded text-white focus:outline-none focus:border-red-500 ${
                    validationErrors.appointmentType ? 'border-red-500' : 'border-gray-600'
                  }`}
                >
                  <option value="">Select Type</option>
                  {appointmentTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {validationErrors.appointmentType && (
                  <p className="text-red-400 text-xs mt-1">{validationErrors.appointmentType}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      setFormData({ ...formData, date: e.target.value });
                      setValidationErrors((prev) => ({ ...prev, date: '' }));
                    }}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded text-white focus:outline-none focus:border-red-500 ${
                      validationErrors.date ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {validationErrors.date && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Time *</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => {
                      setFormData({ ...formData, time: e.target.value });
                      setValidationErrors((prev) => ({ ...prev, time: '' }));
                    }}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded text-white focus:outline-none focus:border-red-500 ${
                      validationErrors.time ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {validationErrors.time && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.time}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Duration</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Location</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="">Select Location</option>
                    {locations.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-red-500"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  {editingAppointment ? 'Update' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- Confirm Dialog ---------- */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmLabel={confirmConfig.confirmLabel}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
