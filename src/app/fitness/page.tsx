'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Workout, Exercise, Client } from '@/types';

export default function FitnessPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workouts' | 'exercises'>('workouts');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ id: string; type: 'workout' | 'exercise'; name: string } | null>(null);
  const [viewingWorkout, setViewingWorkout] = useState<Workout | null>(null);
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);
  const [modalType, setModalType] = useState<'workout' | 'exercise'>('workout');
  const [editingItem, setEditingItem] = useState<Workout | Exercise | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [aiLoading, setAiLoading] = useState(false);

  const [workoutForm, setWorkoutForm] = useState({
    clientId: '', clientName: '', name: '', description: '', category: '', difficulty: 'beginner', duration: '', caloriesBurned: '', exercises: '', creationType: 'manual' as 'manual' | 'ai'
  });

  const [exerciseForm, setExerciseForm] = useState({
    clientId: '', clientName: '', name: '', description: '', muscleGroup: '', equipment: '', instructions: '', sets: '', reps: '', restTime: '', creationType: 'manual' as 'manual' | 'ai'
  });

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
    } catch (error) { console.error('Failed to fetch data:', error); }
    finally { setLoading(false); }
  };

  const handleWorkoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      if (res.ok) { fetchData(); closeModal(); }
    } catch (error) { console.error('Failed to save workout:', error); }
  };

  const handleExerciseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      if (res.ok) { fetchData(); closeModal(); }
    } catch (error) { console.error('Failed to save exercise:', error); }
  };

  const handleDeleteClick = (id: string, type: 'workout' | 'exercise', name: string) => {
    setDeletingItem({ id, type, name });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      const endpoint = deletingItem.type === 'workout' ? '/api/workouts' : '/api/exercises';
      const res = await fetch(`${endpoint}?id=${deletingItem.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        setShowDeleteModal(false);
        setDeletingItem(null);
      } else {
        console.error('Delete failed:', await res.text());
      }
    } catch (error) { console.error('Failed to delete:', error); }
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingItem(workout);
    setModalType('workout');
    setWorkoutForm({ clientId: workout.clientId || '', clientName: workout.clientName || '', name: workout.name, description: workout.description || '', category: workout.category || '', difficulty: workout.difficulty || 'beginner', duration: workout.duration?.toString() || '', caloriesBurned: workout.caloriesBurned?.toString() || '', exercises: workout.exercises || '', creationType: workout.creationType || 'manual' });
    setShowModal(true);
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingItem(exercise);
    setModalType('exercise');
    setExerciseForm({ clientId: exercise.clientId || '', clientName: exercise.clientName || '', name: exercise.name, description: exercise.description || '', muscleGroup: exercise.muscleGroup || '', equipment: exercise.equipment || '', instructions: exercise.instructions || '', sets: exercise.sets?.toString() || '', reps: exercise.reps?.toString() || '', restTime: exercise.restTime?.toString() || '', creationType: exercise.creationType || 'manual' });
    setShowModal(true);
  };

  const handleAddNew = (type: 'workout' | 'exercise') => {
    setEditingItem(null);
    setModalType(type);
    if (type === 'workout') {
      setWorkoutForm({ clientId: '', clientName: '', name: '', description: '', category: '', difficulty: 'beginner', duration: '', caloriesBurned: '', exercises: '', creationType: 'manual' });
    } else {
      setExerciseForm({ clientId: '', clientName: '', name: '', description: '', muscleGroup: '', equipment: '', instructions: '', sets: '', reps: '', restTime: '', creationType: 'manual' });
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingItem(null); };

  // Check for existing entry when client is selected (by creation type)
  const handleWorkoutClientChange = (clientId: string) => {
    const creationType = workoutForm.creationType;
    const existingWorkout = workouts.find(w => w.clientId === clientId && w.creationType === creationType);
    if (existingWorkout) {
      // Load existing workout for editing
      setEditingItem(existingWorkout);
      setWorkoutForm({
        clientId: existingWorkout.clientId || '',
        clientName: existingWorkout.clientName || '',
        name: existingWorkout.name,
        description: existingWorkout.description || '',
        category: existingWorkout.category || '',
        difficulty: existingWorkout.difficulty || 'beginner',
        duration: existingWorkout.duration?.toString() || '',
        caloriesBurned: existingWorkout.caloriesBurned?.toString() || '',
        exercises: existingWorkout.exercises || '',
        creationType: existingWorkout.creationType || 'manual'
      });
    } else {
      setEditingItem(null);
      setWorkoutForm({ ...workoutForm, clientId, clientName: '' });
    }
  };

  const handleExerciseClientChange = (clientId: string) => {
    const creationType = exerciseForm.creationType;
    const existingExercise = exercises.find(e => e.clientId === clientId && e.creationType === creationType);
    if (existingExercise) {
      // Load existing exercise for editing
      setEditingItem(existingExercise);
      setExerciseForm({
        clientId: existingExercise.clientId || '',
        clientName: existingExercise.clientName || '',
        name: existingExercise.name,
        description: existingExercise.description || '',
        muscleGroup: existingExercise.muscleGroup || '',
        equipment: existingExercise.equipment || '',
        instructions: existingExercise.instructions || '',
        sets: existingExercise.sets?.toString() || '',
        reps: existingExercise.reps?.toString() || '',
        restTime: existingExercise.restTime?.toString() || '',
        creationType: existingExercise.creationType || 'manual'
      });
    } else {
      setEditingItem(null);
      setExerciseForm({ ...exerciseForm, clientId, clientName: '' });
    }
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const type = modalType === 'workout' ? 'workout' : 'exercise';
      const currentForm = modalType === 'workout' ? workoutForm : exerciseForm;
      const selectedClient = clients.find(c => c.id === currentForm.clientId);

      // Check if client already has an AI entry
      if (modalType === 'workout') {
        const existingAI = workouts.find(w => w.clientId === currentForm.clientId && w.creationType === 'ai');
        if (existingAI) {
          setEditingItem(existingAI);
        }
      } else {
        const existingAI = exercises.find(e => e.clientId === currentForm.clientId && e.creationType === 'ai');
        if (existingAI) {
          setEditingItem(existingAI);
        }
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
          name: data.name || '',
          description: data.description || '',
          category: data.category || '',
          difficulty: data.difficulty?.toLowerCase() || 'intermediate',
          duration: data.duration?.toString() || '',
          caloriesBurned: data.caloriesBurned?.toString() || '',
          exercises: data.exercises || '',
          creationType: 'ai'
        });
      } else {
        setExerciseForm({
          ...exerciseForm,
          name: data.name || '',
          description: data.description || '',
          muscleGroup: data.muscleGroup || '',
          equipment: data.equipment || '',
          instructions: data.instructions || '',
          sets: data.sets?.toString() || '',
          reps: data.reps?.toString() || '',
          restTime: data.restTime?.toString() || '60',
          creationType: 'ai'
        });
      }
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setAiLoading(false);
    }
  };

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-400';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400';
      case 'advanced': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredWorkouts = workouts.filter(w => {
    const matchesCategory = filterCategory === 'all' || w.category === filterCategory;
    const matchesDifficulty = filterDifficulty === 'all' || w.difficulty === filterDifficulty;
    return matchesCategory && matchesDifficulty;
  });

  const categories = [...new Set(workouts.map(w => w.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-white">← Back</Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2"><span className="text-3xl">💪</span> Fitness Programs</h1>
                <p className="text-gray-400 text-sm">Workouts and exercises library</p>
              </div>
            </div>
            <button onClick={() => handleAddNew(activeTab === 'workouts' ? 'workout' : 'exercise')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              + Add {activeTab === 'workouts' ? 'Workout' : 'Exercise'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-6">
          <button onClick={() => setActiveTab('workouts')} className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'workouts' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            Workouts ({workouts.length})
          </button>
          <button onClick={() => setActiveTab('exercises')} className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'exercises' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            Exercises ({exercises.length})
          </button>
        </div>

        {activeTab === 'workouts' && (
          <div className="flex gap-4 mb-6">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
              <option value="all">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
              <option value="all">All Difficulty</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : activeTab === 'workouts' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkouts.map((workout) => (
              <div key={workout.id} onClick={() => handleViewWorkout(workout)} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-white">{workout.name}</h3>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${workout.creationType === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {workout.creationType === 'ai' ? '✨ AI' : '✏️ Manual'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(workout.difficulty)}`}>{workout.difficulty}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-2">{workout.clientName && <span className="text-green-400">Client: {workout.clientName}</span>}</p>
                <p className="text-gray-400 text-sm mb-4">{workout.description}</p>
                <div className="flex gap-4 text-sm text-gray-400 mb-4">
                  <span>⏱️ {workout.duration} min</span>
                  <span>🔥 {workout.caloriesBurned} cal</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">Category: {workout.category}</p>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleEditWorkout(workout); }} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(workout.id, 'workout', workout.name); }} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exercises.map((exercise) => (
              <div key={exercise.id} onClick={() => handleViewExercise(exercise)} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-white">{exercise.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${exercise.creationType === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {exercise.creationType === 'ai' ? '✨ AI' : '✏️ Manual'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-2">{exercise.clientName && <span className="text-green-400">Client: {exercise.clientName}</span>}</p>
                <p className="text-gray-400 text-sm mb-3">{exercise.description}</p>
                <div className="space-y-1 text-sm text-gray-400 mb-4">
                  <p><span className="text-gray-500">Muscle:</span> {exercise.muscleGroup}</p>
                  <p><span className="text-gray-500">Equipment:</span> {exercise.equipment}</p>
                  <p><span className="text-gray-500">Sets/Reps:</span> {exercise.sets} x {exercise.reps}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleEditExercise(exercise); }} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(exercise.id, 'exercise', exercise.name); }} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Workout/Exercise Modal */}
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
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(viewingWorkout.difficulty)}`}>
                    {viewingWorkout.difficulty}
                  </span>
                </div>

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
                  <p className="text-white font-medium">{viewingWorkout.category}</p>
                </div>

                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Exercises Included</p>
                  <p className="text-white whitespace-pre-line">{viewingWorkout.exercises || 'No exercises listed'}</p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowViewModal(false)} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">Close</button>
                  <button onClick={() => { setShowViewModal(false); handleEditWorkout(viewingWorkout); }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit</button>
                </div>
              </div>
            )}

            {viewingExercise && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <h3 className="text-xl font-bold text-white mb-1">{viewingExercise.name}</h3>
                  <p className="text-blue-400">{viewingExercise.muscleGroup}</p>
                </div>

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

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowViewModal(false)} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">Close</button>
                  <button onClick={() => { setShowViewModal(false); handleEditExercise(viewingExercise); }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
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
                  <>✨ Generate with AI</>
                )}
              </button>
            </div>

            {modalType === 'workout' ? (
              <form onSubmit={handleWorkoutSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Client *</label>
                  <select required value={workoutForm.clientId} onChange={(e) => handleWorkoutClientChange(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white">
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {editingItem && <p className="text-xs text-yellow-400 mt-1">Editing existing {workoutForm.creationType} entry for this client</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name *</label>
                  <input type="text" required value={workoutForm.name} onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
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
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">{editingItem ? 'Update' : 'Create'}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleExerciseSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Client *</label>
                  <select required value={exerciseForm.clientId} onChange={(e) => handleExerciseClientChange(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white">
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {editingItem && <p className="text-xs text-yellow-400 mt-1">Editing existing {exerciseForm.creationType} entry for this client</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name *</label>
                  <input type="text" required value={exerciseForm.name} onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
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
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">{editingItem ? 'Update' : 'Create'}</button>
                </div>
              </form>
            )}
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
              <h3 className="text-xl font-bold text-white mb-2">Delete {deletingItem.type}?</h3>
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
