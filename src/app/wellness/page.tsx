'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { WellnessGoal, ProgressLog, Client } from '@/types';

export default function WellnessPage() {
  const [goals, setGoals] = useState<WellnessGoal[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'goals' | 'progress'>('goals');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateProgressModal, setShowUpdateProgressModal] = useState(false);
  const [viewingGoal, setViewingGoal] = useState<WellnessGoal | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; type: 'goal' | 'progress'; name: string } | null>(null);
  const [updatingGoal, setUpdatingGoal] = useState<WellnessGoal | null>(null);
  const [newProgressValue, setNewProgressValue] = useState('');
  const [modalType, setModalType] = useState<'goal' | 'progress'>('goal');
  const [editingItem, setEditingItem] = useState<WellnessGoal | ProgressLog | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [aiLoading, setAiLoading] = useState(false);

  const [goalForm, setGoalForm] = useState({
    clientId: '', clientName: '', goalType: '', title: '', description: '', targetValue: '', currentValue: '', unit: '', startDate: '', targetDate: '', status: 'in_progress', notes: '', creationType: 'manual' as 'manual' | 'ai'
  });

  const [progressForm, setProgressForm] = useState({
    clientId: '', clientName: '', date: '', weight: '', bodyFat: '', muscleMass: '', waterIntake: '', sleepHours: '', energyLevel: '5', stressLevel: '5', notes: '', creationType: 'manual' as 'manual' | 'ai'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [goalsRes, progressRes, clientsRes] = await Promise.all([
        fetch('/api/wellness-goals'),
        fetch('/api/progress-logs'),
        fetch('/api/clients')
      ]);
      const [goalsData, progressData, clientsData] = await Promise.all([
        goalsRes.json(),
        progressRes.json(),
        clientsRes.json()
      ]);
      setGoals(Array.isArray(goalsData) ? goalsData : []);
      setProgressLogs(Array.isArray(progressData) ? progressData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const selectedClient = clients.find(c => c.id === goalForm.clientId);
      const body = {
        ...goalForm,
        id: editingItem?.id,
        clientName: selectedClient?.name || goalForm.clientName,
        targetValue: parseFloat(goalForm.targetValue) || 0,
        currentValue: parseFloat(goalForm.currentValue) || 0,
        creationType: goalForm.creationType
      };

      const res = await fetch('/api/wellness-goals', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Failed to save goal:', error);
    }
  };

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const selectedClient = clients.find(c => c.id === progressForm.clientId);
      const body = {
        ...progressForm,
        id: editingItem?.id,
        clientName: selectedClient?.name || progressForm.clientName,
        weight: parseFloat(progressForm.weight) || 0,
        bodyFat: parseFloat(progressForm.bodyFat) || 0,
        muscleMass: parseFloat(progressForm.muscleMass) || 0,
        waterIntake: parseFloat(progressForm.waterIntake) || 0,
        sleepHours: parseFloat(progressForm.sleepHours) || 0,
        energyLevel: parseInt(progressForm.energyLevel) || 5,
        stressLevel: parseInt(progressForm.stressLevel) || 5,
        creationType: progressForm.creationType
      };

      const res = await fetch('/api/progress-logs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const handleDeleteClick = (id: string, type: 'goal' | 'progress', name: string) => {
    setDeletingItem({ id, type, name });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      const endpoint = deletingItem.type === 'goal' ? '/api/wellness-goals' : '/api/progress-logs';
      const res = await fetch(`${endpoint}?id=${deletingItem.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        setShowDeleteModal(false);
        setDeletingItem(null);
      } else {
        console.error('Delete failed:', await res.text());
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleEditGoal = (goal: WellnessGoal) => {
    setEditingItem(goal);
    setModalType('goal');
    setGoalForm({
      clientId: goal.clientId || '',
      clientName: goal.clientName || '',
      goalType: goal.goalType || '',
      title: goal.title,
      description: goal.description || '',
      targetValue: goal.targetValue?.toString() || '',
      currentValue: goal.currentValue?.toString() || '',
      unit: goal.unit || '',
      startDate: goal.startDate || '',
      targetDate: goal.targetDate || '',
      status: goal.status || 'in_progress',
      notes: goal.notes || '',
      creationType: goal.creationType || 'manual'
    });
    setShowModal(true);
  };

  const handleEditProgress = (log: ProgressLog) => {
    setEditingItem(log);
    setModalType('progress');
    setProgressForm({
      clientId: log.clientId || '',
      clientName: log.clientName || '',
      date: log.date || '',
      weight: log.weight?.toString() || '',
      bodyFat: log.bodyFat?.toString() || '',
      muscleMass: log.muscleMass?.toString() || '',
      waterIntake: log.waterIntake?.toString() || '',
      sleepHours: log.sleepHours?.toString() || '',
      energyLevel: log.energyLevel?.toString() || '5',
      stressLevel: log.stressLevel?.toString() || '5',
      notes: log.notes || '',
      creationType: log.creationType || 'manual'
    });
    setShowModal(true);
  };

  const handleAddNew = (type: 'goal' | 'progress') => {
    setEditingItem(null);
    setModalType(type);
    if (type === 'goal') {
      setGoalForm({ clientId: '', clientName: '', goalType: '', title: '', description: '', targetValue: '', currentValue: '', unit: '', startDate: new Date().toISOString().split('T')[0], targetDate: '', status: 'in_progress', notes: '', creationType: 'manual' });
    } else {
      setProgressForm({ clientId: '', clientName: '', date: new Date().toISOString().split('T')[0], weight: '', bodyFat: '', muscleMass: '', waterIntake: '', sleepHours: '', energyLevel: '5', stressLevel: '5', notes: '', creationType: 'manual' });
    }
    setShowModal(true);
  };

  // Check for existing entry when client is selected (by creation type)
  const handleGoalClientChange = (clientId: string) => {
    const creationType = goalForm.creationType;
    const existingGoal = goals.find(g => g.clientId === clientId && g.creationType === creationType);
    if (existingGoal) {
      setEditingItem(existingGoal);
      setGoalForm({
        clientId: existingGoal.clientId || '',
        clientName: existingGoal.clientName || '',
        goalType: existingGoal.goalType || '',
        title: existingGoal.title,
        description: existingGoal.description || '',
        targetValue: existingGoal.targetValue?.toString() || '',
        currentValue: existingGoal.currentValue?.toString() || '',
        unit: existingGoal.unit || '',
        startDate: existingGoal.startDate || '',
        targetDate: existingGoal.targetDate || '',
        status: existingGoal.status || 'in_progress',
        notes: existingGoal.notes || '',
        creationType: existingGoal.creationType || 'manual'
      });
    } else {
      setEditingItem(null);
      setGoalForm({ ...goalForm, clientId, clientName: '' });
    }
  };

  const handleProgressClientChange = (clientId: string) => {
    const creationType = progressForm.creationType;
    const existingProgress = progressLogs.find(p => p.clientId === clientId && p.creationType === creationType);
    if (existingProgress) {
      setEditingItem(existingProgress);
      setProgressForm({
        clientId: existingProgress.clientId || '',
        clientName: existingProgress.clientName || '',
        date: existingProgress.date || '',
        weight: existingProgress.weight?.toString() || '',
        bodyFat: existingProgress.bodyFat?.toString() || '',
        muscleMass: existingProgress.muscleMass?.toString() || '',
        waterIntake: existingProgress.waterIntake?.toString() || '',
        sleepHours: existingProgress.sleepHours?.toString() || '',
        energyLevel: existingProgress.energyLevel?.toString() || '5',
        stressLevel: existingProgress.stressLevel?.toString() || '5',
        notes: existingProgress.notes || '',
        creationType: existingProgress.creationType || 'manual'
      });
    } else {
      setEditingItem(null);
      setProgressForm({ ...progressForm, clientId, clientName: '' });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const selectedClient = clients.find(c => c.id === goalForm.clientId);

      // Check if client already has an AI entry
      const existingAI = goals.find(g => g.clientId === goalForm.clientId && g.creationType === 'ai');
      if (existingAI) {
        setEditingItem(existingAI);
      }

      const context = selectedClient ? {
        clientName: selectedClient.name,
        clientGoals: selectedClient.goals,
        clientHealthConditions: selectedClient.healthConditions
      } : {};

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'goal', context })
      });
      const data = await res.json();

      setGoalForm({
        ...goalForm,
        title: data.title || '',
        description: data.description || '',
        goalType: data.goalType || '',
        targetValue: data.targetValue?.toString() || '',
        currentValue: data.currentValue?.toString() || '0',
        unit: data.unit || '',
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        targetDate: data.targetDate || '',
        notes: data.notes || '',
        creationType: 'ai'
      });
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateProgressAI = async () => {
    setAiLoading(true);
    try {
      const selectedClient = clients.find(c => c.id === progressForm.clientId);

      // Check if client already has an AI entry
      const existingAI = progressLogs.find(p => p.clientId === progressForm.clientId && p.creationType === 'ai');
      if (existingAI) {
        setEditingItem(existingAI);
      }

      const context = selectedClient ? {
        clientName: selectedClient.name,
        clientGoals: selectedClient.goals,
        clientHealthConditions: selectedClient.healthConditions
      } : {};

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'progress', context })
      });
      const data = await res.json();

      setProgressForm({
        ...progressForm,
        weight: data.weight?.toString() || '',
        bodyFat: data.bodyFat?.toString() || '',
        muscleMass: data.muscleMass?.toString() || '',
        waterIntake: data.waterIntake?.toString() || '',
        sleepHours: data.sleepHours?.toString() || '',
        energyLevel: data.energyLevel?.toString() || '5',
        stressLevel: data.stressLevel?.toString() || '5',
        notes: data.notes || '',
        creationType: 'ai'
      });
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleUpdateProgressClick = (goal: WellnessGoal) => {
    setUpdatingGoal(goal);
    setNewProgressValue(goal.currentValue?.toString() || '');
    setShowUpdateProgressModal(true);
  };

  const handleUpdateProgressConfirm = async () => {
    if (!updatingGoal) return;
    try {
      const res = await fetch('/api/wellness-goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatingGoal, currentValue: parseFloat(newProgressValue) || 0 }),
      });
      if (res.ok) {
        fetchData();
        setShowUpdateProgressModal(false);
        setUpdatingGoal(null);
        setNewProgressValue('');
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleViewGoalDetails = (goal: WellnessGoal) => {
    setViewingGoal(goal);
    setShowViewModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-500/20 text-blue-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'paused': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getProgressPercentage = (goal: WellnessGoal) => {
    if (!goal.targetValue) return 0;
    return Math.min(100, (goal.currentValue / goal.targetValue) * 100);
  };

  const filteredGoals = goals.filter(g => filterStatus === 'all' || g.status === filterStatus);

  const goalTypes = [...new Set(goals.map(g => g.goalType))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-white">← Back</Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-3xl">🎯</span> Wellness Goals & Progress
                </h1>
                <p className="text-gray-400 text-sm">Track client goals and progress</p>
              </div>
            </div>
            <button
              onClick={() => handleAddNew(activeTab === 'goals' ? 'goal' : 'progress')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              + Add {activeTab === 'goals' ? 'Goal' : 'Progress Log'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'goals' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            Goals ({goals.length})
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'progress' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            Progress Logs ({progressLogs.length})
          </button>
        </div>

        {/* Filter for goals */}
        {activeTab === 'goals' && (
          <div className="mb-6">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              <option value="all">All Status</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : activeTab === 'goals' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map((goal) => (
              <div key={goal.id} onClick={() => handleViewGoalDetails(goal)} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{goal.title}</h3>
                    <p className="text-sm text-gray-400">{goal.clientName}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${goal.creationType === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {goal.creationType === 'ai' ? '✨ AI' : '✏️ Manual'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(goal.status)}`}>
                      {goal.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-3">{goal.description}</p>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${getProgressPercentage(goal)}%` }}
                    />
                  </div>
                  <p className="text-right text-xs text-gray-500 mt-1">{getProgressPercentage(goal).toFixed(0)}%</p>
                </div>
                <p className="text-xs text-gray-500 mb-4">Type: {goal.goalType} | Target: {goal.targetDate}</p>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleUpdateProgressClick(goal); }} className="flex-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm">Update</button>
                  <button onClick={(e) => { e.stopPropagation(); handleEditGoal(goal); }} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(goal.id, 'goal', goal.title); }} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {progressLogs.map((log) => (
              <div key={log.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-500 hover:bg-gray-700/50 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{log.clientName}</h3>
                    <p className="text-sm text-gray-400">{log.date}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${log.creationType === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {log.creationType === 'ai' ? '✨ AI' : '✏️ Manual'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="bg-gray-700/50 rounded p-2">
                    <p className="text-gray-400 text-xs">Weight</p>
                    <p className="text-white font-medium">{log.weight} lbs</p>
                  </div>
                  <div className="bg-gray-700/50 rounded p-2">
                    <p className="text-gray-400 text-xs">Body Fat</p>
                    <p className="text-white font-medium">{log.bodyFat}%</p>
                  </div>
                  <div className="bg-gray-700/50 rounded p-2">
                    <p className="text-gray-400 text-xs">Sleep</p>
                    <p className="text-white font-medium">{log.sleepHours} hrs</p>
                  </div>
                  <div className="bg-gray-700/50 rounded p-2">
                    <p className="text-gray-400 text-xs">Water</p>
                    <p className="text-white font-medium">{log.waterIntake} L</p>
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-gray-400 mb-4">
                  <span>Energy: {log.energyLevel}/10</span>
                  <span>Stress: {log.stressLevel}/10</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditProgress(log)} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Edit</button>
                  <button onClick={() => handleDeleteClick(log.id, 'progress', log.clientName)} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Edit' : 'Add'} {modalType === 'goal' ? 'Wellness Goal' : 'Progress Log'}
              </h2>
              {modalType === 'goal' && (
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={aiLoading || !goalForm.clientId}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!goalForm.clientId ? 'Select a client first' : ''}
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

            {modalType === 'goal' ? (
              <form onSubmit={handleGoalSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Client *</label>
                  <select required value={goalForm.clientId} onChange={(e) => handleGoalClientChange(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white">
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {editingItem && <p className="text-xs text-yellow-400 mt-1">Editing existing {goalForm.creationType} entry for this client</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Goal Type</label>
                    <input type="text" value={goalForm.goalType} onChange={(e) => setGoalForm({ ...goalForm, goalType: e.target.value })} placeholder="e.g., Weight Loss" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Status</label>
                    <select value={goalForm.status} onChange={(e) => setGoalForm({ ...goalForm, status: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white">
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Title *</label>
                  <input type="text" required value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Current</label>
                    <input type="number" step="0.1" value={goalForm.currentValue} onChange={(e) => setGoalForm({ ...goalForm, currentValue: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Target</label>
                    <input type="number" step="0.1" value={goalForm.targetValue} onChange={(e) => setGoalForm({ ...goalForm, targetValue: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Unit</label>
                    <input type="text" value={goalForm.unit} onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })} placeholder="lbs, %, etc" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                    <input type="date" value={goalForm.startDate} onChange={(e) => setGoalForm({ ...goalForm, startDate: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Target Date</label>
                    <input type="date" value={goalForm.targetDate} onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Notes</label>
                  <textarea value={goalForm.notes} onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">{editingItem ? 'Update' : 'Create'}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleProgressSubmit} className="space-y-4">
                {!editingItem && (
                  <div className="flex justify-end mb-2">
                    <button
                      type="button"
                      onClick={handleGenerateProgressAI}
                      disabled={aiLoading || !progressForm.clientId}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!progressForm.clientId ? 'Select a client first' : ''}
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
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Client *</label>
                    <select required value={progressForm.clientId} onChange={(e) => handleProgressClientChange(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white">
                      <option value="">Select Client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {editingItem && <p className="text-xs text-yellow-400 mt-1">Editing existing {progressForm.creationType} entry</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Date</label>
                    <input type="date" value={progressForm.date} onChange={(e) => setProgressForm({ ...progressForm, date: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Weight (lbs)</label>
                    <input type="number" step="0.1" value={progressForm.weight} onChange={(e) => setProgressForm({ ...progressForm, weight: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Body Fat (%)</label>
                    <input type="number" step="0.1" value={progressForm.bodyFat} onChange={(e) => setProgressForm({ ...progressForm, bodyFat: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Muscle (lbs)</label>
                    <input type="number" step="0.1" value={progressForm.muscleMass} onChange={(e) => setProgressForm({ ...progressForm, muscleMass: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Water (L)</label>
                    <input type="number" step="0.1" value={progressForm.waterIntake} onChange={(e) => setProgressForm({ ...progressForm, waterIntake: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Sleep (hrs)</label>
                    <input type="number" step="0.1" value={progressForm.sleepHours} onChange={(e) => setProgressForm({ ...progressForm, sleepHours: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Energy Level (1-10)</label>
                    <input type="range" min="1" max="10" value={progressForm.energyLevel} onChange={(e) => setProgressForm({ ...progressForm, energyLevel: e.target.value })} className="w-full" />
                    <p className="text-center text-gray-400">{progressForm.energyLevel}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Stress Level (1-10)</label>
                    <input type="range" min="1" max="10" value={progressForm.stressLevel} onChange={(e) => setProgressForm({ ...progressForm, stressLevel: e.target.value })} className="w-full" />
                    <p className="text-center text-gray-400">{progressForm.stressLevel}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Notes</label>
                  <textarea value={progressForm.notes} onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">{editingItem ? 'Update' : 'Create'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* View Goal Details Modal */}
      {showViewModal && viewingGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-white">Goal Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <h3 className="text-xl font-bold text-white mb-1">{viewingGoal.title}</h3>
                <p className="text-purple-400">{viewingGoal.clientName}</p>
              </div>

              <p className="text-gray-300">{viewingGoal.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Type</p>
                  <p className="text-white font-medium">{viewingGoal.goalType}</p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Status</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(viewingGoal.status)}`}>
                    {viewingGoal.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gray-700/50 rounded-lg">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{getProgressPercentage(viewingGoal).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-3 mb-2">
                  <div
                    className="bg-purple-500 h-3 rounded-full transition-all"
                    style={{ width: `${getProgressPercentage(viewingGoal)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Current: <span className="text-white font-medium">{viewingGoal.currentValue} {viewingGoal.unit}</span></span>
                  <span className="text-gray-400">Target: <span className="text-white font-medium">{viewingGoal.targetValue} {viewingGoal.unit}</span></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Start Date</p>
                  <p className="text-white font-medium">{viewingGoal.startDate}</p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Target Date</p>
                  <p className="text-white font-medium">{viewingGoal.targetDate}</p>
                </div>
              </div>

              {viewingGoal.notes && (
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-white">{viewingGoal.notes}</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowViewModal(false)} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">Close</button>
                <button onClick={() => { setShowViewModal(false); handleEditGoal(viewingGoal); }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Progress Modal */}
      {showUpdateProgressModal && updatingGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-white">Update Progress</h2>
              <button onClick={() => { setShowUpdateProgressModal(false); setUpdatingGoal(null); }} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <h3 className="text-lg font-bold text-white">{updatingGoal.title}</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Current</p>
                  <p className="text-xl font-bold text-purple-400">{updatingGoal.currentValue} {updatingGoal.unit}</p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Target</p>
                  <p className="text-xl font-bold text-green-400">{updatingGoal.targetValue} {updatingGoal.unit}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">New Value ({updatingGoal.unit})</label>
                <input
                  type="number"
                  step="0.1"
                  value={newProgressValue}
                  onChange={(e) => setNewProgressValue(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg focus:outline-none focus:border-purple-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowUpdateProgressModal(false); setUpdatingGoal(null); }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProgressConfirm}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Update
                </button>
              </div>
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
              <h3 className="text-xl font-bold text-white mb-2">Delete {deletingItem.type === 'goal' ? 'Goal' : 'Progress Log'}?</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete <span className="text-white font-medium">"{deletingItem.name}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletingItem(null); }}
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
