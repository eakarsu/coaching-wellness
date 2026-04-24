'use client';

import { useState, useEffect, useMemo } from 'react';
import { Workout, Exercise, Client, SortState } from '@/types';
import { useToast } from '@/components/Toast';
import { GridSkeleton } from '@/components/LoadingSkeleton';
import SortHeader, { useSortData, toggleSort } from '@/components/SortHeader';
import Pagination from '@/components/Pagination';
import BulkActions from '@/components/BulkActions';
import ExportButtons, { exportToJSON, exportToCSV, exportToPDF } from '@/components/ExportButtons';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function FitnessPage() {
  // --- Data state ---
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Tab ---
  const [activeTab, setActiveTab] = useState<'workouts' | 'exercises'>('workouts');

  // --- Modals ---
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [modalType, setModalType] = useState<'workout' | 'exercise'>('workout');
  const [editingItem, setEditingItem] = useState<Workout | Exercise | null>(null);
  const [viewingWorkout, setViewingWorkout] = useState<Workout | null>(null);
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);

  // --- Delete confirm ---
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ id: string; type: 'workout' | 'exercise'; name: string } | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // --- Search ---
  const [searchQuery, setSearchQuery] = useState('');

  // --- Filters ---
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  // --- Sort ---
  const [workoutSort, setWorkoutSort] = useState<SortState>({ field: 'name', direction: 'asc' });
  const [exerciseSort, setExerciseSort] = useState<SortState>({ field: 'name', direction: 'asc' });

  // --- Pagination ---
  const [workoutPage, setWorkoutPage] = useState(1);
  const [workoutPageSize, setWorkoutPageSize] = useState(15);
  const [exercisePage, setExercisePage] = useState(1);
  const [exercisePageSize, setExercisePageSize] = useState(15);

  // --- Bulk selection ---
  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState<Set<string>>(new Set());
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(new Set());

  // --- AI ---
  const [aiLoading, setAiLoading] = useState(false);

  // --- Form validation ---
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // --- Toast ---
  const { showToast } = useToast();

  // --- Form state ---
  const [workoutForm, setWorkoutForm] = useState({
    clientId: '', clientName: '', name: '', description: '', category: '', difficulty: 'beginner', duration: '', caloriesBurned: '', exercises: '', creationType: 'manual' as 'manual' | 'ai'
  });

  const [exerciseForm, setExerciseForm] = useState({
    clientId: '', clientName: '', name: '', description: '', muscleGroup: '', equipment: '', instructions: '', sets: '', reps: '', restTime: '', creationType: 'manual' as 'manual' | 'ai'
  });

  // ========== Fetch data ==========
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [workoutsRes, exercisesRes, clientsRes] = await Promise.all([
        fetch('/api/workouts'),
        fetch('/api/exercises'),
        fetch('/api/clients')
      ]);
      const [workoutsData, exercisesData, clientsData] = await Promise.all([
        workoutsRes.json(),
        exercisesRes.json(),
        clientsRes.json()
      ]);
      setWorkouts(Array.isArray(workoutsData) ? workoutsData : []);
      setExercises(Array.isArray(exercisesData) ? exercisesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ========== Filtered + sorted + paginated data ==========
  const categories = useMemo(() => [...new Set(workouts.map(w => w.category).filter(Boolean))], [workouts]);

  const filteredWorkouts = useMemo(() => {
    return workouts.filter(w => {
      const matchesSearch = !searchQuery || w.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || w.category === filterCategory;
      const matchesDifficulty = filterDifficulty === 'all' || w.difficulty === filterDifficulty;
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [workouts, searchQuery, filterCategory, filterDifficulty]);

  const filteredExercises = useMemo(() => {
    return exercises.filter(e => {
      const matchesSearch = !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [exercises, searchQuery]);

  const sortedWorkouts = useSortData(filteredWorkouts, workoutSort);
  const sortedExercises = useSortData(filteredExercises, exerciseSort);

  const workoutTotalPages = Math.max(1, Math.ceil(sortedWorkouts.length / workoutPageSize));
  const exerciseTotalPages = Math.max(1, Math.ceil(sortedExercises.length / exercisePageSize));

  const paginatedWorkouts = useMemo(() => {
    const start = (workoutPage - 1) * workoutPageSize;
    return sortedWorkouts.slice(start, start + workoutPageSize);
  }, [sortedWorkouts, workoutPage, workoutPageSize]);

  const paginatedExercises = useMemo(() => {
    const start = (exercisePage - 1) * exercisePageSize;
    return sortedExercises.slice(start, start + exercisePageSize);
  }, [sortedExercises, exercisePage, exercisePageSize]);

  // Reset to page 1 on filter/search change
  useEffect(() => { setWorkoutPage(1); }, [searchQuery, filterCategory, filterDifficulty, workoutSort]);
  useEffect(() => { setExercisePage(1); }, [searchQuery, exerciseSort]);

  // ========== Difficulty color ==========
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-400';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400';
      case 'advanced': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  // ========== Form validation ==========
  const validateWorkoutForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!workoutForm.name.trim()) errors.name = 'Name is required';
    if (!workoutForm.clientId) errors.clientId = 'Client is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateExerciseForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!exerciseForm.name.trim()) errors.name = 'Name is required';
    if (!exerciseForm.clientId) errors.clientId = 'Client is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ========== CRUD: Workout ==========
  const handleWorkoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateWorkoutForm()) return;
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const selectedClient = clients.find(c => c.id === workoutForm.clientId);
      const body = {
        ...workoutForm,
        id: editingItem?.id,
        clientName: selectedClient?.name || workoutForm.clientName,
        duration: parseInt(workoutForm.duration) || 30,
        caloriesBurned: parseInt(workoutForm.caloriesBurned) || 0,
        creationType: workoutForm.creationType
      };
      const res = await fetch('/api/workouts', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        showToast(editingItem ? 'Workout updated successfully' : 'Workout created successfully', 'success');
        fetchData();
        closeModal();
      } else {
        showToast('Failed to save workout', 'error');
      }
    } catch (error) {
      console.error('Failed to save workout:', error);
      showToast('Failed to save workout', 'error');
    }
  };

  // ========== CRUD: Exercise ==========
  const handleExerciseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateExerciseForm()) return;
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const selectedClient = clients.find(c => c.id === exerciseForm.clientId);
      const body = {
        ...exerciseForm,
        id: editingItem?.id,
        clientName: selectedClient?.name || exerciseForm.clientName,
        sets: parseInt(exerciseForm.sets) || 3,
        reps: parseInt(exerciseForm.reps) || 10,
        restTime: parseInt(exerciseForm.restTime) || 60,
        creationType: exerciseForm.creationType
      };
      const res = await fetch('/api/exercises', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        showToast(editingItem ? 'Exercise updated successfully' : 'Exercise created successfully', 'success');
        fetchData();
        closeModal();
      } else {
        showToast('Failed to save exercise', 'error');
      }
    } catch (error) {
      console.error('Failed to save exercise:', error);
      showToast('Failed to save exercise', 'error');
    }
  };

  // ========== Delete ==========
  const handleDeleteClick = (id: string, type: 'workout' | 'exercise', name: string) => {
    setDeletingItem({ id, type, name });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      const endpoint = deletingItem.type === 'workout' ? '/api/workouts' : '/api/exercises';
      const res = await fetch(`${endpoint}?id=${deletingItem.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`${deletingItem.type === 'workout' ? 'Workout' : 'Exercise'} deleted successfully`, 'success');
        fetchData();
        setShowDeleteConfirm(false);
        setDeletingItem(null);
        // Also close view modal if open
        if (showViewModal) setShowViewModal(false);
      } else {
        showToast('Delete failed', 'error');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      showToast('Failed to delete', 'error');
    }
  };

  // ========== Bulk delete ==========
  const handleBulkDeleteConfirm = async () => {
    const ids = activeTab === 'workouts' ? selectedWorkoutIds : selectedExerciseIds;
    const endpoint = activeTab === 'workouts' ? '/api/workouts' : '/api/exercises';
    let successCount = 0;
    let failCount = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' });
        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }
    if (successCount > 0) {
      showToast(`Deleted ${successCount} item(s) successfully`, 'success');
    }
    if (failCount > 0) {
      showToast(`Failed to delete ${failCount} item(s)`, 'error');
    }
    if (activeTab === 'workouts') setSelectedWorkoutIds(new Set());
    else setSelectedExerciseIds(new Set());
    setShowBulkDeleteConfirm(false);
    fetchData();
  };

  // ========== Bulk export ==========
  const handleBulkExport = () => {
    if (activeTab === 'workouts') {
      const selected = workouts.filter(w => selectedWorkoutIds.has(w.id));
      exportToJSON(selected, 'workouts-selected');
      showToast(`Exported ${selected.length} workout(s)`, 'success');
    } else {
      const selected = exercises.filter(e => selectedExerciseIds.has(e.id));
      exportToJSON(selected, 'exercises-selected');
      showToast(`Exported ${selected.length} exercise(s)`, 'success');
    }
  };

  // ========== Selection helpers ==========
  const toggleWorkoutSelection = (id: string) => {
    setSelectedWorkoutIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExerciseSelection = (id: string) => {
    setSelectedExerciseIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ========== Edit handlers ==========
  const handleEditWorkout = (workout: Workout) => {
    setEditingItem(workout);
    setModalType('workout');
    setFormErrors({});
    setWorkoutForm({
      clientId: workout.clientId || '', clientName: workout.clientName || '', name: workout.name,
      description: workout.description || '', category: workout.category || '',
      difficulty: workout.difficulty || 'beginner', duration: workout.duration?.toString() || '',
      caloriesBurned: workout.caloriesBurned?.toString() || '', exercises: workout.exercises || '',
      creationType: workout.creationType || 'manual'
    });
    setShowModal(true);
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingItem(exercise);
    setModalType('exercise');
    setFormErrors({});
    setExerciseForm({
      clientId: exercise.clientId || '', clientName: exercise.clientName || '', name: exercise.name,
      description: exercise.description || '', muscleGroup: exercise.muscleGroup || '',
      equipment: exercise.equipment || '', instructions: exercise.instructions || '',
      sets: exercise.sets?.toString() || '', reps: exercise.reps?.toString() || '',
      restTime: exercise.restTime?.toString() || '', creationType: exercise.creationType || 'manual'
    });
    setShowModal(true);
  };

  const handleAddNew = (type: 'workout' | 'exercise') => {
    setEditingItem(null);
    setModalType(type);
    setFormErrors({});
    if (type === 'workout') {
      setWorkoutForm({ clientId: '', clientName: '', name: '', description: '', category: '', difficulty: 'beginner', duration: '', caloriesBurned: '', exercises: '', creationType: 'manual' });
    } else {
      setExerciseForm({ clientId: '', clientName: '', name: '', description: '', muscleGroup: '', equipment: '', instructions: '', sets: '', reps: '', restTime: '', creationType: 'manual' });
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingItem(null); setFormErrors({}); };

  // ========== Client change (loads existing entry) ==========
  const handleWorkoutClientChange = (clientId: string) => {
    const creationType = workoutForm.creationType;
    const existingWorkout = workouts.find(w => w.clientId === clientId && w.creationType === creationType);
    if (existingWorkout) {
      setEditingItem(existingWorkout);
      setWorkoutForm({
        clientId: existingWorkout.clientId || '', clientName: existingWorkout.clientName || '',
        name: existingWorkout.name, description: existingWorkout.description || '',
        category: existingWorkout.category || '', difficulty: existingWorkout.difficulty || 'beginner',
        duration: existingWorkout.duration?.toString() || '', caloriesBurned: existingWorkout.caloriesBurned?.toString() || '',
        exercises: existingWorkout.exercises || '', creationType: existingWorkout.creationType || 'manual'
      });
    } else {
      setEditingItem(null);
      setWorkoutForm({ ...workoutForm, clientId, clientName: '' });
    }
    setFormErrors(prev => { const n = { ...prev }; delete n.clientId; return n; });
  };

  const handleExerciseClientChange = (clientId: string) => {
    const creationType = exerciseForm.creationType;
    const existingExercise = exercises.find(e => e.clientId === clientId && e.creationType === creationType);
    if (existingExercise) {
      setEditingItem(existingExercise);
      setExerciseForm({
        clientId: existingExercise.clientId || '', clientName: existingExercise.clientName || '',
        name: existingExercise.name, description: existingExercise.description || '',
        muscleGroup: existingExercise.muscleGroup || '', equipment: existingExercise.equipment || '',
        instructions: existingExercise.instructions || '', sets: existingExercise.sets?.toString() || '',
        reps: existingExercise.reps?.toString() || '', restTime: existingExercise.restTime?.toString() || '',
        creationType: existingExercise.creationType || 'manual'
      });
    } else {
      setEditingItem(null);
      setExerciseForm({ ...exerciseForm, clientId, clientName: '' });
    }
    setFormErrors(prev => { const n = { ...prev }; delete n.clientId; return n; });
  };

  // ========== AI generation ==========
  const handleGenerateAI = async () => {
    const currentForm = modalType === 'workout' ? workoutForm : exerciseForm;
    if (!currentForm.clientId) {
      showToast('Please select a client first', 'warning');
      return;
    }
    setAiLoading(true);
    try {
      const type = modalType === 'workout' ? 'workout' : 'exercise';
      const selectedClient = clients.find(c => c.id === currentForm.clientId);

      // Check if client already has an AI entry
      if (modalType === 'workout') {
        const existingAI = workouts.find(w => w.clientId === currentForm.clientId && w.creationType === 'ai');
        if (existingAI) setEditingItem(existingAI);
      } else {
        const existingAI = exercises.find(e => e.clientId === currentForm.clientId && e.creationType === 'ai');
        if (existingAI) setEditingItem(existingAI);
      }

      const context = selectedClient ? {
        clientName: selectedClient.name,
        clientGoals: selectedClient.goals,
        clientHealthConditions: selectedClient.healthConditions
      } : {};

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, context })
      });
      const data = await res.json();

      if (modalType === 'workout') {
        setWorkoutForm({
          ...workoutForm,
          name: data.name || '', description: data.description || '',
          category: data.category || '', difficulty: data.difficulty?.toLowerCase() || 'intermediate',
          duration: data.duration?.toString() || '', caloriesBurned: data.caloriesBurned?.toString() || '',
          exercises: data.exercises || '', creationType: 'ai'
        });
      } else {
        setExerciseForm({
          ...exerciseForm,
          name: data.name || '', description: data.description || '',
          muscleGroup: data.muscleGroup || '', equipment: data.equipment || '',
          instructions: data.instructions || '', sets: data.sets?.toString() || '',
          reps: data.reps?.toString() || '', restTime: data.restTime?.toString() || '60',
          creationType: 'ai'
        });
      }
      showToast('AI content generated successfully', 'success');
    } catch (error) {
      console.error('AI generation failed:', error);
      showToast('AI generation failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // ========== View handlers ==========
  const handleViewWorkout = (workout: Workout) => {
    setViewingWorkout(workout);
    setViewingExercise(null);
    setShowViewModal(true);
  };

  const handleViewExercise = (exercise: Exercise) => {
    setViewingExercise(exercise);
    setViewingWorkout(null);
    setShowViewModal(true);
  };

  // ========== Render ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Tabs + Add button row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => { setActiveTab('workouts'); setSearchQuery(''); setSelectedExerciseIds(new Set()); }}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'workouts' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >
              Workouts ({workouts.length})
            </button>
            <button
              onClick={() => { setActiveTab('exercises'); setSearchQuery(''); setSelectedWorkoutIds(new Set()); }}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'exercises' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >
              Exercises ({exercises.length})
            </button>
          </div>
          <button
            onClick={() => handleAddNew(activeTab === 'workouts' ? 'workout' : 'exercise')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + Add {activeTab === 'workouts' ? 'Workout' : 'Exercise'}
          </button>
        </div>

        {/* Search + Filters + Sort + Export row */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Advanced filters (workouts only) */}
          {activeTab === 'workouts' && (
            <div className="flex gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="all">All Difficulty</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          )}

          {/* Sort buttons */}
          <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-3 py-1.5 border border-gray-700">
            <span className="text-gray-500 text-xs uppercase tracking-wide">Sort:</span>
            {activeTab === 'workouts' ? (
              <>
                <SortHeader label="Name" field="name" sort={workoutSort} onSort={(f) => setWorkoutSort(toggleSort(workoutSort, f))} />
                <SortHeader label="Duration" field="duration" sort={workoutSort} onSort={(f) => setWorkoutSort(toggleSort(workoutSort, f))} />
                <SortHeader label="Calories" field="caloriesBurned" sort={workoutSort} onSort={(f) => setWorkoutSort(toggleSort(workoutSort, f))} />
              </>
            ) : (
              <>
                <SortHeader label="Name" field="name" sort={exerciseSort} onSort={(f) => setExerciseSort(toggleSort(exerciseSort, f))} />
                <SortHeader label="Sets" field="sets" sort={exerciseSort} onSort={(f) => setExerciseSort(toggleSort(exerciseSort, f))} />
                <SortHeader label="Reps" field="reps" sort={exerciseSort} onSort={(f) => setExerciseSort(toggleSort(exerciseSort, f))} />
              </>
            )}
          </div>

          {/* Export buttons */}
          <ExportButtons
            data={(activeTab === 'workouts' ? sortedWorkouts : sortedExercises) as unknown as Record<string, unknown>[]}
            filename={activeTab === 'workouts' ? 'workouts' : 'exercises'}
          />
        </div>

        {/* Bulk actions bar */}
        {activeTab === 'workouts' && (
          <BulkActions
            selectedCount={selectedWorkoutIds.size}
            totalCount={paginatedWorkouts.length}
            onSelectAll={() => setSelectedWorkoutIds(new Set(sortedWorkouts.map(w => w.id)))}
            onDeselectAll={() => setSelectedWorkoutIds(new Set())}
            onBulkDelete={() => setShowBulkDeleteConfirm(true)}
            onBulkExport={handleBulkExport}
          />
        )}
        {activeTab === 'exercises' && (
          <BulkActions
            selectedCount={selectedExerciseIds.size}
            totalCount={paginatedExercises.length}
            onSelectAll={() => setSelectedExerciseIds(new Set(sortedExercises.map(e => e.id)))}
            onDeselectAll={() => setSelectedExerciseIds(new Set())}
            onBulkDelete={() => setShowBulkDeleteConfirm(true)}
            onBulkExport={handleBulkExport}
          />
        )}

        {/* Content */}
        {loading ? (
          <GridSkeleton count={6} />
        ) : activeTab === 'workouts' ? (
          <>
            {paginatedWorkouts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg">No workouts found</p>
                <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedWorkouts.map((workout) => (
                  <div key={workout.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer relative group">
                    {/* Checkbox */}
                    <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedWorkoutIds.has(workout.id)}
                        onChange={() => toggleWorkoutSelection(workout.id)}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                    </div>

                    {/* Card body - clickable for detail modal */}
                    <div onClick={() => handleViewWorkout(workout)} className="pl-5">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-white truncate pr-2">{workout.name}</h3>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${workout.creationType === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {workout.creationType === 'ai' ? 'AI' : 'Manual'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(workout.difficulty)}`}>
                            {workout.difficulty}
                          </span>
                        </div>
                      </div>

                      {workout.clientName && (
                        <p className="text-green-400 text-sm mb-1">Client: {workout.clientName}</p>
                      )}

                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{workout.description}</p>

                      <div className="flex gap-4 text-sm text-gray-400 mb-3">
                        <span>Duration: {workout.duration} min</span>
                        <span>Calories: {workout.caloriesBurned}</span>
                      </div>

                      {workout.category && (
                        <p className="text-xs text-gray-500 mb-4">Category: {workout.category}</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pl-5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditWorkout(workout); }}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(workout.id, 'workout', workout.name); }}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={workoutPage}
              totalPages={workoutTotalPages}
              totalItems={sortedWorkouts.length}
              pageSize={workoutPageSize}
              onPageChange={setWorkoutPage}
              onPageSizeChange={(size) => { setWorkoutPageSize(size); setWorkoutPage(1); }}
            />
          </>
        ) : (
          <>
            {paginatedExercises.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg">No exercises found</p>
                <p className="text-gray-500 text-sm mt-2">Try adjusting your search</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedExercises.map((exercise) => (
                  <div key={exercise.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer relative group">
                    {/* Checkbox */}
                    <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedExerciseIds.has(exercise.id)}
                        onChange={() => toggleExerciseSelection(exercise.id)}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                    </div>

                    {/* Card body - clickable for detail modal */}
                    <div onClick={() => handleViewExercise(exercise)} className="pl-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-white truncate pr-2">{exercise.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${exercise.creationType === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {exercise.creationType === 'ai' ? 'AI' : 'Manual'}
                        </span>
                      </div>

                      {exercise.clientName && (
                        <p className="text-green-400 text-sm mb-1">Client: {exercise.clientName}</p>
                      )}

                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{exercise.description}</p>

                      <div className="space-y-1 text-sm text-gray-400 mb-4">
                        <p><span className="text-gray-500">Muscle:</span> {exercise.muscleGroup}</p>
                        <p><span className="text-gray-500">Equipment:</span> {exercise.equipment}</p>
                        <p><span className="text-gray-500">Sets x Reps:</span> {exercise.sets} x {exercise.reps}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pl-5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditExercise(exercise); }}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(exercise.id, 'exercise', exercise.name); }}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={exercisePage}
              totalPages={exerciseTotalPages}
              totalItems={sortedExercises.length}
              pageSize={exercisePageSize}
              onPageChange={setExercisePage}
              onPageSizeChange={(size) => { setExercisePageSize(size); setExercisePage(1); }}
            />
          </>
        )}
      </div>

      {/* ========== View/Detail Modal ========== */}
      {showViewModal && (viewingWorkout || viewingExercise) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-white">{viewingWorkout ? 'Workout Details' : 'Exercise Details'}</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            {viewingWorkout && (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <h3 className="text-xl font-bold text-white mb-1">{viewingWorkout.name}</h3>
                  <div className="flex gap-2 items-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(viewingWorkout.difficulty)}`}>
                      {viewingWorkout.difficulty}
                    </span>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${viewingWorkout.creationType === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {viewingWorkout.creationType === 'ai' ? 'AI Generated' : 'Manual'}
                    </span>
                  </div>
                </div>

                {viewingWorkout.clientName && (
                  <div className="p-3 bg-gray-700/50 rounded-lg">
                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Client</p>
                    <p className="text-green-400 font-medium">{viewingWorkout.clientName}</p>
                  </div>
                )}

                <p className="text-gray-300">{viewingWorkout.description}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-400">{viewingWorkout.duration}</p>
                    <p className="text-gray-400 text-sm">Minutes</p>
                  </div>
                  <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-orange-400">{viewingWorkout.caloriesBurned}</p>
                    <p className="text-gray-400 text-sm">Calories</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Category</p>
                  <p className="text-white font-medium">{viewingWorkout.category || 'N/A'}</p>
                </div>

                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Exercises Included</p>
                  <p className="text-white whitespace-pre-line">{viewingWorkout.exercises || 'No exercises listed'}</p>
                </div>

                {viewingWorkout.imageUrl && (
                  <div className="p-3 bg-gray-700/50 rounded-lg">
                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Image URL</p>
                    <p className="text-blue-400 text-sm break-all">{viewingWorkout.imageUrl}</p>
                  </div>
                )}

                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Created</p>
                  <p className="text-white text-sm">{viewingWorkout.createdAt ? new Date(viewingWorkout.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowViewModal(false)} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">Close</button>
                  <button onClick={() => { setShowViewModal(false); handleEditWorkout(viewingWorkout); }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Edit</button>
                  <button onClick={() => { handleDeleteClick(viewingWorkout.id, 'workout', viewingWorkout.name); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
                </div>
              </div>
            )}

            {viewingExercise && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <h3 className="text-xl font-bold text-white mb-1">{viewingExercise.name}</h3>
                  <div className="flex gap-2 items-center">
                    <p className="text-blue-400">{viewingExercise.muscleGroup}</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${viewingExercise.creationType === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {viewingExercise.creationType === 'ai' ? 'AI Generated' : 'Manual'}
                    </span>
                  </div>
                </div>

                {viewingExercise.clientName && (
                  <div className="p-3 bg-gray-700/50 rounded-lg">
                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Client</p>
                    <p className="text-green-400 font-medium">{viewingExercise.clientName}</p>
                  </div>
                )}

                <p className="text-gray-300">{viewingExercise.description}</p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-400">{viewingExercise.sets}</p>
                    <p className="text-gray-400 text-sm">Sets</p>
                  </div>
                  <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-400">{viewingExercise.reps}</p>
                    <p className="text-gray-400 text-sm">Reps</p>
                  </div>
                  <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-400">{viewingExercise.restTime}s</p>
                    <p className="text-gray-400 text-sm">Rest</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Equipment Needed</p>
                  <p className="text-white font-medium">{viewingExercise.equipment || 'None'}</p>
                </div>

                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Instructions</p>
                  <p className="text-white whitespace-pre-line">{viewingExercise.instructions || 'No instructions provided'}</p>
                </div>

                {viewingExercise.videoUrl && (
                  <div className="p-3 bg-gray-700/50 rounded-lg">
                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Video URL</p>
                    <p className="text-blue-400 text-sm break-all">{viewingExercise.videoUrl}</p>
                  </div>
                )}

                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Created</p>
                  <p className="text-white text-sm">{viewingExercise.createdAt ? new Date(viewingExercise.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowViewModal(false)} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">Close</button>
                  <button onClick={() => { setShowViewModal(false); handleEditExercise(viewingExercise); }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Edit</button>
                  <button onClick={() => { handleDeleteClick(viewingExercise.id, 'exercise', viewingExercise.name); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== Edit/Add Modal ========== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">{editingItem ? 'Edit' : 'Add'} {modalType === 'workout' ? 'Workout' : 'Exercise'}</h2>
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={aiLoading || (modalType === 'workout' ? !workoutForm.clientId : !exerciseForm.clientId)}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={(modalType === 'workout' ? !workoutForm.clientId : !exerciseForm.clientId) ? 'Select a client first' : ''}
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
                  <>Generate with AI</>
                )}
              </button>
            </div>

            {modalType === 'workout' ? (
              <form onSubmit={handleWorkoutSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Client *</label>
                  <select
                    value={workoutForm.clientId}
                    onChange={(e) => handleWorkoutClientChange(e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded text-white ${formErrors.clientId ? 'border-red-500' : 'border-gray-600'}`}
                  >
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {formErrors.clientId && <p className="text-xs text-red-400 mt-1">{formErrors.clientId}</p>}
                  {editingItem && <p className="text-xs text-yellow-400 mt-1">Editing existing {workoutForm.creationType} entry for this client</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name *</label>
                  <input
                    type="text"
                    value={workoutForm.name}
                    onChange={(e) => { setWorkoutForm({ ...workoutForm, name: e.target.value }); if (formErrors.name) setFormErrors(prev => { const n = { ...prev }; delete n.name; return n; }); }}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded text-white ${formErrors.name ? 'border-red-500' : 'border-gray-600'}`}
                  />
                  {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea value={workoutForm.description} onChange={(e) => setWorkoutForm({ ...workoutForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                    <input type="text" value={workoutForm.category} onChange={(e) => setWorkoutForm({ ...workoutForm, category: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
                    <select value={workoutForm.difficulty} onChange={(e) => setWorkoutForm({ ...workoutForm, difficulty: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white">
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Duration (min)</label>
                    <input type="number" value={workoutForm.duration} onChange={(e) => setWorkoutForm({ ...workoutForm, duration: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Calories Burned</label>
                    <input type="number" value={workoutForm.caloriesBurned} onChange={(e) => setWorkoutForm({ ...workoutForm, caloriesBurned: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Exercises</label>
                  <textarea value={workoutForm.exercises} onChange={(e) => setWorkoutForm({ ...workoutForm, exercises: e.target.value })} rows={3} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" placeholder="List exercises..." />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">{editingItem ? 'Update' : 'Create'}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleExerciseSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Client *</label>
                  <select
                    value={exerciseForm.clientId}
                    onChange={(e) => handleExerciseClientChange(e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded text-white ${formErrors.clientId ? 'border-red-500' : 'border-gray-600'}`}
                  >
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {formErrors.clientId && <p className="text-xs text-red-400 mt-1">{formErrors.clientId}</p>}
                  {editingItem && <p className="text-xs text-yellow-400 mt-1">Editing existing {exerciseForm.creationType} entry for this client</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name *</label>
                  <input
                    type="text"
                    value={exerciseForm.name}
                    onChange={(e) => { setExerciseForm({ ...exerciseForm, name: e.target.value }); if (formErrors.name) setFormErrors(prev => { const n = { ...prev }; delete n.name; return n; }); }}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded text-white ${formErrors.name ? 'border-red-500' : 'border-gray-600'}`}
                  />
                  {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea value={exerciseForm.description} onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Muscle Group</label>
                    <input type="text" value={exerciseForm.muscleGroup} onChange={(e) => setExerciseForm({ ...exerciseForm, muscleGroup: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Equipment</label>
                    <input type="text" value={exerciseForm.equipment} onChange={(e) => setExerciseForm({ ...exerciseForm, equipment: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Sets</label>
                    <input type="number" value={exerciseForm.sets} onChange={(e) => setExerciseForm({ ...exerciseForm, sets: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Reps</label>
                    <input type="number" value={exerciseForm.reps} onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Rest (s)</label>
                    <input type="number" value={exerciseForm.restTime} onChange={(e) => setExerciseForm({ ...exerciseForm, restTime: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Instructions</label>
                  <textarea value={exerciseForm.instructions} onChange={(e) => setExerciseForm({ ...exerciseForm, instructions: e.target.value })} rows={3} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">{editingItem ? 'Update' : 'Create'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========== Delete Confirmation Dialog ========== */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={`Delete ${deletingItem?.type === 'workout' ? 'Workout' : 'Exercise'}?`}
        message={`Are you sure you want to delete "${deletingItem?.name || ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setShowDeleteConfirm(false); setDeletingItem(null); }}
      />

      {/* ========== Bulk Delete Confirmation Dialog ========== */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        title={`Delete ${activeTab === 'workouts' ? selectedWorkoutIds.size : selectedExerciseIds.size} item(s)?`}
        message="Are you sure you want to delete all selected items? This action cannot be undone."
        confirmLabel="Delete All"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />
    </div>
  );
}
