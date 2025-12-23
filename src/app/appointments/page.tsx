'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Appointment, Client, Coach } from '@/types';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAppointment, setDeletingAppointment] = useState<{ id: string; clientName: string } | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '', clientName: '', coachName: '', appointmentType: '', date: '', time: '', duration: '60', status: 'scheduled', notes: '', location: '', creationType: 'manual' as 'manual' | 'ai'
  });

  const appointmentTypes = ['Initial Consultation', 'Follow-up', 'Training Session', 'Nutrition Review', 'Progress Check', 'Goal Setting', 'Assessment'];
  const locations = ['Main Studio', 'Online/Zoom', 'Gym Floor', 'Nutrition Office', 'Conference Room A', 'Home Visit'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, clientsRes, coachesRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/clients'),
        fetch('/api/coaches')
      ]);
      const [appointmentsData, clientsData, coachesData] = await Promise.all([
        appointmentsRes.json(),
        clientsRes.json(),
        coachesRes.json()
      ]);
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setCoaches(Array.isArray(coachesData) ? coachesData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingAppointment ? 'PUT' : 'POST';
      const selectedClient = clients.find(c => c.id === formData.clientId);
      const body = {
        ...formData,
        id: editingAppointment?.id,
        clientName: selectedClient?.name || formData.clientName,
        duration: parseInt(formData.duration) || 60,
        creationType: formData.creationType
      };

      const res = await fetch('/api/appointments', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Failed to save appointment:', error);
    }
  };

  const handleDeleteClick = (id: string, clientName: string) => {
    setDeletingAppointment({ id, clientName });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAppointment) return;
    try {
      const res = await fetch(`/api/appointments?id=${deletingAppointment.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        setShowDeleteModal(false);
        setDeletingAppointment(null);
      } else {
        console.error('Delete failed:', await res.text());
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
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
      creationType: appointment.creationType || 'manual'
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingAppointment(null);
    setFormData({
      clientId: '', clientName: '', coachName: '', appointmentType: '', date: new Date().toISOString().split('T')[0], time: '09:00', duration: '60', status: 'scheduled', notes: '', location: '', creationType: 'manual'
    });
    setShowModal(true);
  };

  // Check for existing entry when client is selected (by creation type)
  const handleClientChange = (clientId: string) => {
    const creationType = formData.creationType;
    const existingAppointment = appointments.find(a => a.clientId === clientId && a.creationType === creationType);
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
        creationType: existingAppointment.creationType || 'manual'
      });
    } else {
      setEditingAppointment(null);
      setFormData({ ...formData, clientId, clientName: '' });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAppointment(null);
  };

  const handleStatusChange = async (appointment: Appointment, newStatus: string) => {
    try {
      await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...appointment, status: newStatus }),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    setViewingAppointment(appointment);
    setShowViewModal(true);
  };

  const handleReschedule = (appointment: Appointment) => {
    handleEdit(appointment);
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const selectedClient = clients.find(c => c.id === formData.clientId);

      // Check if client already has an AI entry
      const existingAI = appointments.find(a => a.clientId === formData.clientId && a.creationType === 'ai');
      if (existingAI) {
        setEditingAppointment(existingAI);
      }

      const context = selectedClient ? {
        clientName: selectedClient.name,
        clientGoals: selectedClient.goals,
        clientHealthConditions: selectedClient.healthConditions
      } : {};

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'appointment', context })
      });
      const data = await res.json();

      setFormData({
        ...formData,
        appointmentType: data.appointmentType || '',
        duration: data.duration?.toString() || '60',
        notes: data.notes || '',
        location: data.location || '',
        creationType: 'ai'
      });
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      case 'no_show': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredAppointments = appointments.filter(a => {
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchesDate = !filterDate || a.date === filterDate;
    return matchesStatus && matchesDate;
  });

  const todayAppointments = appointments.filter(a => a.date === new Date().toISOString().split('T')[0]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-white">← Back</Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-3xl">📅</span> Appointments
                </h1>
                <p className="text-gray-400 text-sm">Schedule and manage coaching sessions</p>
              </div>
            </div>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              + Schedule Appointment
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Today</p>
            <p className="text-2xl font-bold text-white">{todayAppointments.length}</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Upcoming</p>
            <p className="text-2xl font-bold text-blue-400">{appointments.filter(a => a.status === 'scheduled').length}</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-400">{appointments.filter(a => a.status === 'completed').length}</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Cancelled</p>
            <p className="text-2xl font-bold text-red-400">{appointments.filter(a => a.status === 'cancelled').length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
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
            <button onClick={() => setFilterDate('')} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
              Clear Date
            </button>
          )}
        </div>

        {/* Appointments Grid */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No appointments found</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} onClick={() => handleViewDetails(appointment)} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{appointment.clientName}</h3>
                    <p className="text-sm text-gray-400">with {appointment.coachName}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${appointment.creationType === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {appointment.creationType === 'ai' ? '✨ AI' : '✏️ Manual'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-400 mb-4">
                  <p className="flex items-center gap-2">
                    <span>📅</span> {appointment.date}
                  </p>
                  <p className="flex items-center gap-2">
                    <span>⏰</span> {appointment.time} ({appointment.duration} min)
                  </p>
                  <p className="flex items-center gap-2">
                    <span>📍</span> {appointment.location}
                  </p>
                  <p className="flex items-center gap-2">
                    <span>📋</span> {appointment.appointmentType}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {appointment.status === 'scheduled' && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleStatusChange(appointment, 'completed'); }} className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs hover:bg-green-600/30">
                        Complete
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleStatusChange(appointment, 'cancelled'); }} className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs hover:bg-red-600/30">
                        Cancel
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleStatusChange(appointment, 'no_show'); }} className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs hover:bg-yellow-600/30">
                        No Show
                      </button>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleReschedule(appointment); }} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(appointment.id, appointment.clientName); }} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {showViewModal && viewingAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-white">Appointment Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
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
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(viewingAppointment.status)}`}>
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

              {viewingAppointment.notes && (
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-white">{viewingAppointment.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
              <button
                onClick={() => { setShowViewModal(false); handleEdit(viewingAppointment); }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
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
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>✨ Generate with AI</>
                )}
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Client *</label>
                  <select required value={formData.clientId} onChange={(e) => handleClientChange(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white">
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {editingAppointment && <p className="text-xs text-yellow-400 mt-1">Editing existing {formData.creationType} entry</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Coach *</label>
                  <select required value={formData.coachName} onChange={(e) => setFormData({ ...formData, coachName: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white">
                    <option value="">Select Coach</option>
                    {coaches.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Appointment Type *</label>
                <select required value={formData.appointmentType} onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white">
                  <option value="">Select Type</option>
                  {appointmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date *</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Time *</label>
                  <input type="time" required value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Duration</label>
                  <select value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white">
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
                  <select value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white">
                    <option value="">Select Location</option>
                    {locations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white">
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" placeholder="Additional notes..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">{editingAppointment ? 'Update' : 'Schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Appointment?</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete the appointment with <span className="text-white font-medium">"{deletingAppointment.clientName}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletingAppointment(null); }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
