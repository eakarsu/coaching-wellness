'use client';

import { useState, useEffect } from 'react';
import { WellnessGoal, ProgressLog, Client } from '@/types';
import { useToast } from '@/components/Toast';
import { GridSkeleton } from '@/components/LoadingSkeleton';
import SortHeader, { useSortData, toggleSort } from '@/components/SortHeader';
import Pagination from '@/components/Pagination';
import BulkActions from '@/components/BulkActions';
import ExportButtons, { exportToJSON, exportToCSV } from '@/components/ExportButtons';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function WellnessPage() {
  const { showToast } = useToast();

  const [goals, setGoals] = useState<WellnessGoal[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'goals' | 'progress'>('goals');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showViewGoalModal, setShowViewGoalModal] = useState(false);
  const [showViewProgressModal, setShowViewProgressModal] = useState(false);
  const [showUpdateProgressModal, setShowUpdateProgressModal] = useState(false);

  // Viewing/editing state
  const [viewingGoal, setViewingGoal] = useState<WellnessGoal | null>(null);
  const [viewingProgress, setViewingProgress] = useState<ProgressLog | null>(null);
  const [updatingGoal, setUpdatingGoal] = useState<WellnessGoal | null>(null);
  const [newProgressValue, setNewProgressValue] = useState('');
  const [modalType, setModalType] = useState<'goal' | 'progress'>('goal');
  const [editingItem, setEditingItem] = useState<WellnessGoal | ProgressLog | null>(null);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {} });

  // Search, filter, sort
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [goalSort, setGoalSort] = useState({ field: 'title', direction: 'asc' as 'asc' | 'desc' });
  const [progressSort, setProgressSort] = useState({ field: 'date', direction: 'desc' as 'asc' | 'desc' });

  // Pagination
  const [goalPage, setGoalPage] = useState(1);
  const [goalPageSize, setGoalPageSize] = useState(15);
  const [progressPage, setProgressPage] = useState(1);
  const [progressPageSize, setProgressPageSize] = useState(15);

  // Bulk selection
  const [selectedGoalIds, setSelectedGoalIds] = useState<Set<string>>(new Set());
  const [selectedProgressIds, setSelectedProgressIds] = useState<Set<string>>(new Set());

  // AI loading
  const [aiLoading, setAiLoading] = useState(false);

  // Validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Forms
  const [goalForm, setGoalForm] = useState({
    clientId: '', clientName: '', goalType: '', title: '', description: '',
    targetValue: '', currentValue: '', unit: '', startDate: '', targetDate: '',
    status: 'in_progress', notes: '', creationType: 'manual' as 'manual' | 'ai'
  });

  const [progressForm, setProgressForm] = useState({
    clientId: '', clientName: '', date: '', weight: '', bodyFat: '',
    muscleMass: '', waterIntake: '', sleepHours: '', energyLevel: '5',
    stressLevel: '5', notes: '', creationType: 'manual' as 'manual' | 'ai'
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when search/filter changes
  useEffect(() => { setGoalPage(1); }, [searchTerm, filterStatus]);
  useEffect(() => { setProgressPage(1); }, [searchTerm]);

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
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Validation ---
  const validateGoalForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!goalForm.title.trim()) errors.title = 'Title is required';
    if (!goalForm.clientId) errors.clientId = 'Client is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateProgressForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!progressForm.clientId) errors.clientId = 'Client is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- Goal Submit ---
  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateGoalForm()) return;
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
        showToast(editingItem ? 'Goal updated successfully' : 'Goal created successfully', 'success');
      } else {
        showToast('Failed to save goal', 'error');
      }
    } catch (error) {
      console.error('Failed to save goal:', error);
      showToast('Failed to save goal', 'error');
    }
  };

  // --- Progress Submit ---
  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProgressForm()) return;
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
        showToast(editingItem ? 'Progress log updated successfully' : 'Progress log created successfully', 'success');
      } else {
        showToast('Failed to save progress log', 'error');
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
      showToast('Failed to save progress log', 'error');
    }
  };

  // --- Delete ---
  const handleDeleteGoal = (goal: WellnessGoal) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Goal?',
      message: `Are you sure you want to delete "${goal.title}"? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/wellness-goals?id=${goal.id}`, { method: 'DELETE' });
          if (res.ok) {
            fetchData();
            showToast('Goal deleted successfully', 'success');
            setShowViewGoalModal(false);
          } else {
            showToast('Failed to delete goal', 'error');
          }
        } catch (error) {
          console.error('Failed to delete:', error);
          showToast('Failed to delete goal', 'error');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteProgress = (log: ProgressLog) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Progress Log?',
      message: `Are you sure you want to delete the progress log for "${log.clientName}"? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/progress-logs?id=${log.id}`, { method: 'DELETE' });
          if (res.ok) {
            fetchData();
            showToast('Progress log deleted successfully', 'success');
            setShowViewProgressModal(false);
          } else {
            showToast('Failed to delete progress log', 'error');
          }
        } catch (error) {
          console.error('Failed to delete:', error);
          showToast('Failed to delete progress log', 'error');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // --- Bulk Delete ---
  const handleBulkDeleteGoals = () => {
    if (selectedGoalIds.size === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: `Delete ${selectedGoalIds.size} Goals?`,
      message: `Are you sure you want to delete ${selectedGoalIds.size} selected goals? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await Promise.all(
            Array.from(selectedGoalIds).map(id =>
              fetch(`/api/wellness-goals?id=${id}`, { method: 'DELETE' })
            )
          );
          fetchData();
          setSelectedGoalIds(new Set());
          showToast(`${selectedGoalIds.size} goals deleted`, 'success');
        } catch (error) {
          console.error('Bulk delete failed:', error);
          showToast('Bulk delete failed', 'error');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleBulkDeleteProgress = () => {
    if (selectedProgressIds.size === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: `Delete ${selectedProgressIds.size} Progress Logs?`,
      message: `Are you sure you want to delete ${selectedProgressIds.size} selected progress logs? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await Promise.all(
            Array.from(selectedProgressIds).map(id =>
              fetch(`/api/progress-logs?id=${id}`, { method: 'DELETE' })
            )
          );
          fetchData();
          setSelectedProgressIds(new Set());
          showToast(`${selectedProgressIds.size} progress logs deleted`, 'success');
        } catch (error) {
          console.error('Bulk delete failed:', error);
          showToast('Bulk delete failed', 'error');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // --- Bulk Export ---
  const handleBulkExportGoals = () => {
    const selected = goals.filter(g => selectedGoalIds.has(g.id));
    exportToJSON(selected, 'wellness-goals-selected');
    showToast(`Exported ${selected.length} goals`, 'success');
  };

  const handleBulkExportProgress = () => {
    const selected = progressLogs.filter(p => selectedProgressIds.has(p.id));
    exportToJSON(selected, 'progress-logs-selected');
    showToast(`Exported ${selected.length} progress logs`, 'success');
  };

  // --- Edit ---
  const handleEditGoal = (goal: WellnessGoal) => {
    setEditingItem(goal);
    setModalType('goal');
    setFormErrors({});
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
    setFormErrors({});
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

  // --- Add New ---
  const handleAddNew = (type: 'goal' | 'progress') => {
    setEditingItem(null);
    setModalType(type);
    setFormErrors({});
    if (type === 'goal') {
      setGoalForm({
        clientId: '', clientName: '', goalType: '', title: '', description: '',
        targetValue: '', currentValue: '', unit: '',
        startDate: new Date().toISOString().split('T')[0], targetDate: '',
        status: 'in_progress', notes: '', creationType: 'manual'
      });
    } else {
      setProgressForm({
        clientId: '', clientName: '',
        date: new Date().toISOString().split('T')[0],
        weight: '', bodyFat: '', muscleMass: '', waterIntake: '', sleepHours: '',
        energyLevel: '5', stressLevel: '5', notes: '', creationType: 'manual'
      });
    }
    setShowModal(true);
  };

  // --- Client change handlers ---
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
    setFormErrors({});
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
    setFormErrors({});
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormErrors({});
  };

  // --- AI Generation ---
  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const selectedClient = clients.find(c => c.id === goalForm.clientId);
      const existingAI = goals.find(g => g.clientId === goalForm.clientId && g.creationType === 'ai');
      if (existingAI) setEditingItem(existingAI);

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
      showToast('AI goal generated successfully', 'success');
    } catch (error) {
      console.error('AI generation failed:', error);
      showToast('AI generation failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateProgressAI = async () => {
    setAiLoading(true);
    try {
      const selectedClient = clients.find(c => c.id === progressForm.clientId);
      const existingAI = progressLogs.find(p => p.clientId === progressForm.clientId && p.creationType === 'ai');
      if (existingAI) setEditingItem(existingAI);

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
      showToast('AI progress log generated successfully', 'success');
    } catch (error) {
      console.error('AI generation failed:', error);
      showToast('AI generation failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // --- Update Progress (quick) ---
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
        showToast('Progress updated successfully', 'success');
      } else {
        showToast('Failed to update progress', 'error');
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
      showToast('Failed to update progress', 'error');
    }
  };

  // --- Card click handlers ---
  const handleViewGoalDetails = (goal: WellnessGoal) => {
    setViewingGoal(goal);
    setShowViewGoalModal(true);
  };

  const handleViewProgressDetails = (log: ProgressLog) => {
    setViewingProgress(log);
    setShowViewProgressModal(true);
  };

  // --- Checkbox toggling ---
  const toggleGoalSelection = (id: string) => {
    setSelectedGoalIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleProgressSelection = (id: string) => {
    setSelectedProgressIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // --- Helpers ---
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

  // --- Filtering, sorting, pagination for Goals ---
  const filteredGoals = goals.filter(g => {
    const matchesSearch = searchTerm === '' ||
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || g.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedGoals = useSortData(filteredGoals, goalSort);
  const goalTotalPages = Math.max(1, Math.ceil(sortedGoals.length / goalPageSize));
  const paginatedGoals = sortedGoals.slice((goalPage - 1) * goalPageSize, goalPage * goalPageSize);

  // --- Filtering, sorting, pagination for Progress Logs ---
  const filteredProgress = progressLogs.filter(p => {
    const matchesSearch = searchTerm === '' ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const sortedProgress = useSortData(filteredProgress, progressSort);
  const progressTotalPages = Math.max(1, Math.ceil(sortedProgress.length / progressPageSize));
  const paginatedProgress = sortedProgress.slice((progressPage - 1) * progressPageSize, progressPage * progressPageSize);

  // --- AI spinner component ---
  const AISpinner = () => (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => { setActiveTab('goals'); setSearchTerm(''); setSelectedGoalIds(new Set()); }}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'goals' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >
              Goals ({goals.length})
            </button>
            <button
              onClick={() => { setActiveTab('progress'); setSearchTerm(''); setSelectedProgressIds(new Set()); }}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'progress' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >
              Progress Logs ({progressLogs.length})
            </button>
          </div>
          <button
            onClick={() => handleAddNew(activeTab === 'goals' ? 'goal' : 'progress')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Add {activeTab === 'goals' ? 'Goal' : 'Progress Log'}
          </button>
        </div>

        {/* Search + Filter + Sort + Export toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="text"
            placeholder={activeTab === 'goals' ? 'Search by title or client...' : 'Search by client name...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 w-64"
          />
          {activeTab === 'goals' && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Status</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Sort:</span>
            {activeTab === 'goals' ? (
              <>
                <SortHeader label="Title" field="title" sort={goalSort} onSort={(f) => setGoalSort(toggleSort(goalSort, f))} />
                <SortHeader label="Client" field="clientName" sort={goalSort} onSort={(f) => setGoalSort(toggleSort(goalSort, f))} />
                <SortHeader label="Status" field="status" sort={goalSort} onSort={(f) => setGoalSort(toggleSort(goalSort, f))} />
                <SortHeader label="Target Date" field="targetDate" sort={goalSort} onSort={(f) => setGoalSort(toggleSort(goalSort, f))} />
              </>
            ) : (
              <>
                <SortHeader label="Client" field="clientName" sort={progressSort} onSort={(f) => setProgressSort(toggleSort(progressSort, f))} />
                <SortHeader label="Date" field="date" sort={progressSort} onSort={(f) => setProgressSort(toggleSort(progressSort, f))} />
                <SortHeader label="Weight" field="weight" sort={progressSort} onSort={(f) => setProgressSort(toggleSort(progressSort, f))} />
              </>
            )}
          </div>
          <div className="ml-auto">
            <ExportButtons
              data={(activeTab === 'goals' ? filteredGoals : filteredProgress) as unknown as Record<string, unknown>[]}
              filename={activeTab === 'goals' ? 'wellness-goals' : 'progress-logs'}
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {activeTab === 'goals' && (
          <BulkActions
            selectedCount={selectedGoalIds.size}
            totalCount={paginatedGoals.length}
            onSelectAll={() => setSelectedGoalIds(new Set(paginatedGoals.map(g => g.id)))}
            onDeselectAll={() => setSelectedGoalIds(new Set())}
            onBulkDelete={handleBulkDeleteGoals}
            onBulkExport={handleBulkExportGoals}
          />
        )}
        {activeTab === 'progress' && (
          <BulkActions
            selectedCount={selectedProgressIds.size}
            totalCount={paginatedProgress.length}
            onSelectAll={() => setSelectedProgressIds(new Set(paginatedProgress.map(p => p.id)))}
            onDeselectAll={() => setSelectedProgressIds(new Set())}
            onBulkDelete={handleBulkDeleteProgress}
            onBulkExport={handleBulkExportProgress}
          />
        )}

        {/* Content */}
        {loading ? (
          <GridSkeleton count={6} />
        ) : activeTab === 'goals' ? (
          <>
            {paginatedGoals.length === 0 ? (
              <div className="text-center text-gray-400 py-12">No goals found</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    onClick={() => handleViewGoalDetails(goal)}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 hover:bg-gray-700/50 transition-all cursor-pointer relative"
                  >
                    {/* Checkbox */}
                    <div className="absolute top-3 left-3">
                      <input
                        type="checkbox"
                        checked={selectedGoalIds.has(goal.id)}
                        onChange={(e) => { e.stopPropagation(); toggleGoalSelection(goal.id); }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-between items-start mb-3 ml-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{goal.title}</h3>
                        <p className="text-sm text-purple-400">{goal.clientName}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${goal.creationType === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-600/30 text-gray-400'}`}>
                          {goal.creationType === 'ai' ? 'AI' : 'Manual'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(goal.status)}`}>
                          {goal.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {goal.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{goal.description}</p>
                    )}

                    {/* Progress bar */}
                    <div className="mb-3">
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

                    <p className="text-xs text-gray-500 mb-4">
                      {goal.goalType && <span>Type: {goal.goalType}</span>}
                      {goal.goalType && goal.targetDate && <span> | </span>}
                      {goal.targetDate && <span>Target: {goal.targetDate}</span>}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdateProgressClick(goal); }}
                        className="flex-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm transition-colors"
                      >
                        Update
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditGoal(goal); }}
                        className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal); }}
                        className="px-3 py-2 bg-red-600/80 text-white rounded hover:bg-red-600 text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination
              currentPage={goalPage}
              totalPages={goalTotalPages}
              totalItems={sortedGoals.length}
              pageSize={goalPageSize}
              onPageChange={setGoalPage}
              onPageSizeChange={(size) => { setGoalPageSize(size); setGoalPage(1); }}
            />
          </>
        ) : (
          <>
            {paginatedProgress.length === 0 ? (
              <div className="text-center text-gray-400 py-12">No progress logs found</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProgress.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => handleViewProgressDetails(log)}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 hover:bg-gray-700/50 transition-all cursor-pointer relative"
                  >
                    {/* Checkbox */}
                    <div className="absolute top-3 left-3">
                      <input
                        type="checkbox"
                        checked={selectedProgressIds.has(log.id)}
                        onChange={(e) => { e.stopPropagation(); toggleProgressSelection(log.id); }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-between items-start mb-4 ml-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{log.clientName}</h3>
                        <p className="text-sm text-gray-400">{log.date}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${log.creationType === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-600/30 text-gray-400'}`}>
                        {log.creationType === 'ai' ? 'AI' : 'Manual'}
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
                      <span>Energy: <span className="text-purple-400 font-medium">{log.energyLevel}/10</span></span>
                      <span>Stress: <span className="text-purple-400 font-medium">{log.stressLevel}/10</span></span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditProgress(log); }}
                        className="flex-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProgress(log); }}
                        className="px-3 py-2 bg-red-600/80 text-white rounded hover:bg-red-600 text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination
              currentPage={progressPage}
              totalPages={progressTotalPages}
              totalItems={sortedProgress.length}
              pageSize={progressPageSize}
              onPageChange={setProgressPage}
              onPageSizeChange={(size) => { setProgressPageSize(size); setProgressPage(1); }}
            />
          </>
        )}
      </div>

      {/* ==================== DETAIL MODAL: Goal ==================== */}
      {showViewGoalModal && viewingGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-white">Goal Details</h2>
              <button onClick={() => setShowViewGoalModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <h3 className="text-xl font-bold text-white mb-1">{viewingGoal.title}</h3>
                <p className="text-purple-400">{viewingGoal.clientName}</p>
              </div>

              {viewingGoal.description && (
                <p className="text-gray-300">{viewingGoal.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Type</p>
                  <p className="text-white font-medium">{viewingGoal.goalType || 'N/A'}</p>
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
                  <p className="text-white font-medium">{viewingGoal.startDate || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Target Date</p>
                  <p className="text-white font-medium">{viewingGoal.targetDate || 'N/A'}</p>
                </div>
              </div>

              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Creation Type</p>
                <p className="text-white font-medium">{viewingGoal.creationType === 'ai' ? 'AI Generated' : 'Manual'}</p>
              </div>

              {viewingGoal.notes && (
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-white">{viewingGoal.notes}</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowViewGoalModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { setShowViewGoalModal(false); handleEditGoal(viewingGoal); }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => { setShowViewGoalModal(false); handleDeleteGoal(viewingGoal); }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DETAIL MODAL: Progress Log ==================== */}
      {showViewProgressModal && viewingProgress && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-white">Progress Log Details</h2>
              <button onClick={() => setShowViewProgressModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <h3 className="text-xl font-bold text-white mb-1">{viewingProgress.clientName}</h3>
                <p className="text-purple-400">{viewingProgress.date}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Weight</p>
                  <p className="text-2xl font-bold text-purple-400">{viewingProgress.weight}</p>
                  <p className="text-gray-500 text-xs">lbs</p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Body Fat</p>
                  <p className="text-2xl font-bold text-purple-400">{viewingProgress.bodyFat}</p>
                  <p className="text-gray-500 text-xs">%</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Sleep</p>
                  <p className="text-xl font-bold text-white">{viewingProgress.sleepHours}</p>
                  <p className="text-gray-500 text-xs">hours</p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Water</p>
                  <p className="text-xl font-bold text-white">{viewingProgress.waterIntake}</p>
                  <p className="text-gray-500 text-xs">liters</p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Muscle</p>
                  <p className="text-xl font-bold text-white">{viewingProgress.muscleMass}</p>
                  <p className="text-gray-500 text-xs">lbs</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Energy Level</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-600 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(viewingProgress.energyLevel / 10) * 100}%` }} />
                    </div>
                    <span className="text-white font-bold text-sm">{viewingProgress.energyLevel}/10</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Stress Level</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-600 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(viewingProgress.stressLevel / 10) * 100}%` }} />
                    </div>
                    <span className="text-white font-bold text-sm">{viewingProgress.stressLevel}/10</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Creation Type</p>
                <p className="text-white font-medium">{viewingProgress.creationType === 'ai' ? 'AI Generated' : 'Manual'}</p>
              </div>

              {viewingProgress.notes && (
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-white">{viewingProgress.notes}</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowViewProgressModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { setShowViewProgressModal(false); handleEditProgress(viewingProgress); }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => { setShowViewProgressModal(false); handleDeleteProgress(viewingProgress); }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== UPDATE PROGRESS MODAL ==================== */}
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
                <p className="text-purple-400 text-sm">{updatingGoal.clientName}</p>
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
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProgressConfirm}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT/ADD MODAL ==================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Edit' : 'Add'} {modalType === 'goal' ? 'Wellness Goal' : 'Progress Log'}
              </h2>
              {modalType === 'goal' ? (
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={aiLoading || !goalForm.clientId}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!goalForm.clientId ? 'Select a client first' : ''}
                >
                  {aiLoading ? (<><AISpinner /> Generating...</>) : ('Generate with AI')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateProgressAI}
                  disabled={aiLoading || !progressForm.clientId}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!progressForm.clientId ? 'Select a client first' : ''}
                >
                  {aiLoading ? (<><AISpinner /> Generating...</>) : ('Generate with AI')}
                </button>
              )}
            </div>

            {modalType === 'goal' ? (
              <form onSubmit={handleGoalSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Client *</label>
                  <select
                    value={goalForm.clientId}
                    onChange={(e) => handleGoalClientChange(e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded text-white focus:outline-none focus:border-purple-500 ${formErrors.clientId ? 'border-red-500' : 'border-gray-600'}`}
                  >
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {formErrors.clientId && <p className="text-red-400 text-xs mt-1">{formErrors.clientId}</p>}
                  {editingItem && <p className="text-xs text-yellow-400 mt-1">Editing existing {goalForm.creationType} entry for this client</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Title *</label>
                  <input
                    type="text"
                    value={goalForm.title}
                    onChange={(e) => { setGoalForm({ ...goalForm, title: e.target.value }); setFormErrors(prev => ({ ...prev, title: '' })); }}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded text-white focus:outline-none focus:border-purple-500 ${formErrors.title ? 'border-red-500' : 'border-gray-600'}`}
                  />
                  {formErrors.title && <p className="text-red-400 text-xs mt-1">{formErrors.title}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Goal Type</label>
                    <input type="text" value={goalForm.goalType} onChange={(e) => setGoalForm({ ...goalForm, goalType: e.target.value })} placeholder="e.g., Weight Loss" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Status</label>
                    <select value={goalForm.status} onChange={(e) => setGoalForm({ ...goalForm, status: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500">
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Current</label>
                    <input type="number" step="0.1" value={goalForm.currentValue} onChange={(e) => setGoalForm({ ...goalForm, currentValue: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Target</label>
                    <input type="number" step="0.1" value={goalForm.targetValue} onChange={(e) => setGoalForm({ ...goalForm, targetValue: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Unit</label>
                    <input type="text" value={goalForm.unit} onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })} placeholder="lbs, %, etc" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                    <input type="date" value={goalForm.startDate} onChange={(e) => setGoalForm({ ...goalForm, startDate: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Target Date</label>
                    <input type="date" value={goalForm.targetDate} onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Notes</label>
                  <textarea value={goalForm.notes} onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500" />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">{editingItem ? 'Update' : 'Create'}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleProgressSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Client *</label>
                    <select
                      value={progressForm.clientId}
                      onChange={(e) => handleProgressClientChange(e.target.value)}
                      className={`w-full px-3 py-2 bg-gray-700 border rounded text-white focus:outline-none focus:border-purple-500 ${formErrors.clientId ? 'border-red-500' : 'border-gray-600'}`}
                    >
                      <option value="">Select Client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {formErrors.clientId && <p className="text-red-400 text-xs mt-1">{formErrors.clientId}</p>}
                    {editingItem && <p className="text-xs text-yellow-400 mt-1">Editing existing {progressForm.creationType} entry</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Date</label>
                    <input type="date" value={progressForm.date} onChange={(e) => setProgressForm({ ...progressForm, date: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Weight (lbs)</label>
                    <input type="number" step="0.1" value={progressForm.weight} onChange={(e) => setProgressForm({ ...progressForm, weight: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Body Fat (%)</label>
                    <input type="number" step="0.1" value={progressForm.bodyFat} onChange={(e) => setProgressForm({ ...progressForm, bodyFat: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Muscle (lbs)</label>
                    <input type="number" step="0.1" value={progressForm.muscleMass} onChange={(e) => setProgressForm({ ...progressForm, muscleMass: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Water (L)</label>
                    <input type="number" step="0.1" value={progressForm.waterIntake} onChange={(e) => setProgressForm({ ...progressForm, waterIntake: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Sleep (hrs)</label>
                    <input type="number" step="0.1" value={progressForm.sleepHours} onChange={(e) => setProgressForm({ ...progressForm, sleepHours: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Energy Level (1-10)</label>
                    <input type="range" min="1" max="10" value={progressForm.energyLevel} onChange={(e) => setProgressForm({ ...progressForm, energyLevel: e.target.value })} className="w-full accent-purple-500" />
                    <p className="text-center text-gray-400">{progressForm.energyLevel}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Stress Level (1-10)</label>
                    <input type="range" min="1" max="10" value={progressForm.stressLevel} onChange={(e) => setProgressForm({ ...progressForm, stressLevel: e.target.value })} className="w-full accent-purple-500" />
                    <p className="text-center text-gray-400">{progressForm.stressLevel}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Notes</label>
                  <textarea value={progressForm.notes} onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500" />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">{editingItem ? 'Update' : 'Create'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================== CONFIRM DIALOG ==================== */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmLabel="Delete"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
