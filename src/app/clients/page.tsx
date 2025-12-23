'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Client } from '@/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingClient, setDeletingClient] = useState<{ id: string; name: string } | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [aiLoading, setAiLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', age: '', gender: '', goals: '', healthConditions: '', status: 'active', notes: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingClient ? 'PUT' : 'POST';
      const body = editingClient ? { ...formData, id: editingClient.id, age: parseInt(formData.age) || 0 } : { ...formData, age: parseInt(formData.age) || 0 };

      const res = await fetch('/api/clients', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchClients();
        closeModal();
      }
    } catch (error) {
      console.error('Failed to save client:', error);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeletingClient({ id, name });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingClient) return;
    try {
      const res = await fetch(`/api/clients?id=${deletingClient.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchClients();
        setShowDeleteModal(false);
        setDeletingClient(null);
      } else {
        console.error('Delete failed:', await res.text());
      }
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name, email: client.email, phone: client.phone || '', age: client.age?.toString() || '',
      gender: client.gender || '', goals: client.goals || '', healthConditions: client.healthConditions || '',
      status: client.status || 'active', notes: client.notes || '',
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingClient(null);
    setFormData({ name: '', email: '', phone: '', age: '', gender: '', goals: '', healthConditions: '', status: 'active', notes: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  const handleViewDetails = (client: Client) => {
    setViewingClient(client);
    setShowViewModal(true);
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'client', context: {} })
      });
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
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'inactive': return 'bg-red-500/20 text-red-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-white">← Back</Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-3xl">👥</span> Client Management
                </h1>
                <p className="text-gray-400 text-sm">Manage your coaching clients</p>
              </div>
            </div>
            <button onClick={handleAddNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              + Add Client
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-4 mb-6">
          <input type="text" placeholder="Search clients..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading clients...</div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No clients found</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <div key={client.id} onClick={() => handleViewDetails(client)} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{client.name}</h3>
                    <p className="text-gray-400 text-sm">{client.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(client.status)}`}>{client.status}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-400 mb-4">
                  <p><span className="text-gray-500">Phone:</span> {client.phone || 'N/A'}</p>
                  <p><span className="text-gray-500">Age:</span> {client.age || 'N/A'}</p>
                  <p><span className="text-gray-500">Goals:</span> {client.goals?.substring(0, 50) || 'N/A'}...</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(client); }} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(client.id, client.name); }} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {showViewModal && viewingClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-white">Client Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {viewingClient.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-white text-lg font-medium">{viewingClient.name}</p>
                  <p className="text-gray-400">{viewingClient.email}</p>
                  <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(viewingClient.status)}`}>
                    {viewingClient.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Member Since</p>
                  <p className="text-white font-medium">{viewingClient.startDate || 'N/A'}</p>
                </div>
              </div>

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

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowViewModal(false)} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">Close</button>
              <button onClick={() => { setShowViewModal(false); handleEdit(viewingClient); }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
              {!editingClient && (
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email *</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Age</label>
                  <input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Gender</label>
                  <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Goals</label>
                <textarea value={formData.goals} onChange={(e) => setFormData({ ...formData, goals: e.target.value })} rows={2}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Health Conditions</label>
                <textarea value={formData.healthConditions} onChange={(e) => setFormData({ ...formData, healthConditions: e.target.value })} rows={2}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">{editingClient ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Client?</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete <span className="text-white font-medium">"{deletingClient.name}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletingClient(null); }}
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
