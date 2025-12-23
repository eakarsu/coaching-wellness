'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MealPlan, Recipe, Client } from '@/types';

export default function NutritionPage() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'mealPlans' | 'recipes'>('mealPlans');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewingMealPlan, setViewingMealPlan] = useState<MealPlan | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; type: 'mealPlan' | 'recipe'; name: string } | null>(null);
  const [modalType, setModalType] = useState<'mealPlan' | 'recipe'>('mealPlan');
  const [editingItem, setEditingItem] = useState<MealPlan | Recipe | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [aiLoading, setAiLoading] = useState(false);

  const [mealPlanForm, setMealPlanForm] = useState({
    clientId: '', clientName: '', name: '', description: '', category: '', calories: '', protein: '', carbs: '', fat: '', meals: '', duration: '', targetGoal: '', creationType: 'manual' as 'manual' | 'ai'
  });

  const [recipeForm, setRecipeForm] = useState({
    clientId: '', clientName: '', name: '', description: '', category: '', calories: '', protein: '', carbs: '', fat: '', ingredients: '', instructions: '', prepTime: '', cookTime: '', servings: '', creationType: 'manual' as 'manual' | 'ai'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mealPlansRes, recipesRes, clientsRes] = await Promise.all([
        fetch('/api/meal-plans'),
        fetch('/api/recipes'),
        fetch('/api/clients')
      ]);
      const [mealPlansData, recipesData, clientsData] = await Promise.all([
        mealPlansRes.json(),
        recipesRes.json(),
        clientsRes.json()
      ]);
      setMealPlans(Array.isArray(mealPlansData) ? mealPlansData : []);
      setRecipes(Array.isArray(recipesData) ? recipesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMealPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const selectedClient = clients.find(c => c.id === mealPlanForm.clientId);
      const body = {
        ...mealPlanForm,
        id: editingItem?.id,
        clientName: selectedClient?.name || mealPlanForm.clientName,
        calories: parseInt(mealPlanForm.calories) || 0,
        protein: parseInt(mealPlanForm.protein) || 0,
        carbs: parseInt(mealPlanForm.carbs) || 0,
        fat: parseInt(mealPlanForm.fat) || 0,
        creationType: mealPlanForm.creationType
      };

      const res = await fetch('/api/meal-plans', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Failed to save meal plan:', error);
    }
  };

  const handleRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const selectedClient = clients.find(c => c.id === recipeForm.clientId);
      const body = {
        ...recipeForm,
        id: editingItem?.id,
        clientName: selectedClient?.name || recipeForm.clientName,
        calories: parseInt(recipeForm.calories) || 0,
        protein: parseInt(recipeForm.protein) || 0,
        carbs: parseInt(recipeForm.carbs) || 0,
        fat: parseInt(recipeForm.fat) || 0,
        prepTime: parseInt(recipeForm.prepTime) || 0,
        cookTime: parseInt(recipeForm.cookTime) || 0,
        servings: parseInt(recipeForm.servings) || 1,
        creationType: recipeForm.creationType
      };

      const res = await fetch('/api/recipes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Failed to save recipe:', error);
    }
  };

  const handleDeleteClick = (id: string, type: 'mealPlan' | 'recipe', name: string) => {
    setDeletingItem({ id, type, name });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      const endpoint = deletingItem.type === 'mealPlan' ? '/api/meal-plans' : '/api/recipes';
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

  const handleEditMealPlan = (plan: MealPlan) => {
    setEditingItem(plan);
    setModalType('mealPlan');
    setMealPlanForm({
      clientId: plan.clientId || '',
      clientName: plan.clientName || '',
      name: plan.name,
      description: plan.description || '',
      category: plan.category || '',
      calories: plan.calories?.toString() || '',
      protein: plan.protein?.toString() || '',
      carbs: plan.carbs?.toString() || '',
      fat: plan.fat?.toString() || '',
      meals: plan.meals || '',
      duration: plan.duration || '',
      targetGoal: plan.targetGoal || '',
      creationType: plan.creationType || 'manual'
    });
    setShowModal(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingItem(recipe);
    setModalType('recipe');
    setRecipeForm({
      clientId: recipe.clientId || '',
      clientName: recipe.clientName || '',
      name: recipe.name,
      description: recipe.description || '',
      category: recipe.category || '',
      calories: recipe.calories?.toString() || '',
      protein: recipe.protein?.toString() || '',
      carbs: recipe.carbs?.toString() || '',
      fat: recipe.fat?.toString() || '',
      ingredients: recipe.ingredients || '',
      instructions: recipe.instructions || '',
      prepTime: recipe.prepTime?.toString() || '',
      cookTime: recipe.cookTime?.toString() || '',
      servings: recipe.servings?.toString() || '',
      creationType: recipe.creationType || 'manual'
    });
    setShowModal(true);
  };

  const handleAddNew = (type: 'mealPlan' | 'recipe') => {
    setEditingItem(null);
    setModalType(type);
    if (type === 'mealPlan') {
      setMealPlanForm({ clientId: '', clientName: '', name: '', description: '', category: '', calories: '', protein: '', carbs: '', fat: '', meals: '', duration: '', targetGoal: '', creationType: 'manual' });
    } else {
      setRecipeForm({ clientId: '', clientName: '', name: '', description: '', category: '', calories: '', protein: '', carbs: '', fat: '', ingredients: '', instructions: '', prepTime: '', cookTime: '', servings: '', creationType: 'manual' });
    }
    setShowModal(true);
  };

  // Check for existing entry when client is selected (by creation type)
  const handleMealPlanClientChange = (clientId: string) => {
    const creationType = mealPlanForm.creationType;
    const existingPlan = mealPlans.find(m => m.clientId === clientId && m.creationType === creationType);
    if (existingPlan) {
      setEditingItem(existingPlan);
      setMealPlanForm({
        clientId: existingPlan.clientId || '',
        clientName: existingPlan.clientName || '',
        name: existingPlan.name,
        description: existingPlan.description || '',
        category: existingPlan.category || '',
        calories: existingPlan.calories?.toString() || '',
        protein: existingPlan.protein?.toString() || '',
        carbs: existingPlan.carbs?.toString() || '',
        fat: existingPlan.fat?.toString() || '',
        meals: existingPlan.meals || '',
        duration: existingPlan.duration || '',
        targetGoal: existingPlan.targetGoal || '',
        creationType: existingPlan.creationType || 'manual'
      });
    } else {
      setEditingItem(null);
      setMealPlanForm({ ...mealPlanForm, clientId, clientName: '' });
    }
  };

  const handleRecipeClientChange = (clientId: string) => {
    const creationType = recipeForm.creationType;
    const existingRecipe = recipes.find(r => r.clientId === clientId && r.creationType === creationType);
    if (existingRecipe) {
      setEditingItem(existingRecipe);
      setRecipeForm({
        clientId: existingRecipe.clientId || '',
        clientName: existingRecipe.clientName || '',
        name: existingRecipe.name,
        description: existingRecipe.description || '',
        category: existingRecipe.category || '',
        calories: existingRecipe.calories?.toString() || '',
        protein: existingRecipe.protein?.toString() || '',
        carbs: existingRecipe.carbs?.toString() || '',
        fat: existingRecipe.fat?.toString() || '',
        ingredients: existingRecipe.ingredients || '',
        instructions: existingRecipe.instructions || '',
        prepTime: existingRecipe.prepTime?.toString() || '',
        cookTime: existingRecipe.cookTime?.toString() || '',
        servings: existingRecipe.servings?.toString() || '',
        creationType: existingRecipe.creationType || 'manual'
      });
    } else {
      setEditingItem(null);
      setRecipeForm({ ...recipeForm, clientId, clientName: '' });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const type = modalType === 'mealPlan' ? 'mealPlan' : 'recipe';
      const currentForm = modalType === 'mealPlan' ? mealPlanForm : recipeForm;
      const selectedClient = clients.find(c => c.id === currentForm.clientId);

      // Check if client already has an AI entry
      if (modalType === 'mealPlan') {
        const existingAI = mealPlans.find(m => m.clientId === currentForm.clientId && m.creationType === 'ai');
        if (existingAI) {
          setEditingItem(existingAI);
        }
      } else {
        const existingAI = recipes.find(r => r.clientId === currentForm.clientId && r.creationType === 'ai');
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

      if (modalType === 'mealPlan') {
        setMealPlanForm({
          ...mealPlanForm,
          name: data.name || '',
          description: data.description || '',
          category: data.category || '',
          calories: data.calories?.toString() || '',
          protein: data.protein?.toString() || '',
          carbs: data.carbs?.toString() || '',
          fat: data.fat?.toString() || '',
          meals: data.meals || '',
          duration: data.duration || '',
          targetGoal: data.targetGoal || '',
          creationType: 'ai'
        });
      } else {
        setRecipeForm({
          ...recipeForm,
          name: data.name || '',
          description: data.description || '',
          category: data.category || '',
          calories: data.calories?.toString() || '',
          protein: data.protein?.toString() || '',
          carbs: data.carbs?.toString() || '',
          fat: data.fat?.toString() || '',
          ingredients: data.ingredients || '',
          instructions: data.instructions || '',
          prepTime: data.prepTime?.toString() || '',
          cookTime: data.cookTime?.toString() || '',
          servings: data.servings?.toString() || '',
          creationType: 'ai'
        });
      }
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleViewMealPlan = (plan: MealPlan) => {
    setViewingMealPlan(plan);
    setViewingRecipe(null);
    setShowViewModal(true);
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setViewingRecipe(recipe);
    setViewingMealPlan(null);
    setShowViewModal(true);
  };

  const categories = activeTab === 'mealPlans'
    ? [...new Set(mealPlans.map(m => m.category))]
    : [...new Set(recipes.map(r => r.category))];

  const filteredMealPlans = mealPlans.filter(m => filterCategory === 'all' || m.category === filterCategory);
  const filteredRecipes = recipes.filter(r => filterCategory === 'all' || r.category === filterCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-white">← Back</Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-3xl">🥗</span> Nutrition Plans
                </h1>
                <p className="text-gray-400 text-sm">Meal plans and healthy recipes</p>
              </div>
            </div>
            <button
              onClick={() => handleAddNew(activeTab === 'mealPlans' ? 'mealPlan' : 'recipe')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              + Add {activeTab === 'mealPlans' ? 'Meal Plan' : 'Recipe'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => { setActiveTab('mealPlans'); setFilterCategory('all'); }}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'mealPlans' ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            Meal Plans ({mealPlans.length})
          </button>
          <button
            onClick={() => { setActiveTab('recipes'); setFilterCategory('all'); }}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'recipes' ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            Recipes ({recipes.length})
          </button>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : activeTab === 'mealPlans' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMealPlans.map((plan) => (
              <div key={plan.id} onClick={() => handleViewMealPlan(plan)} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                    {plan.clientName && <p className="text-sm text-orange-400">{plan.clientName}</p>}
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${plan.creationType === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {plan.creationType === 'ai' ? '✨ AI' : '✏️ Manual'}
                    </span>
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">{plan.category}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="grid grid-cols-4 gap-2 text-center text-sm mb-4">
                  <div className="bg-gray-700/50 rounded p-2">
                    <p className="text-orange-400 font-bold">{plan.calories}</p>
                    <p className="text-gray-500 text-xs">cal</p>
                  </div>
                  <div className="bg-gray-700/50 rounded p-2">
                    <p className="text-red-400 font-bold">{plan.protein}g</p>
                    <p className="text-gray-500 text-xs">protein</p>
                  </div>
                  <div className="bg-gray-700/50 rounded p-2">
                    <p className="text-blue-400 font-bold">{plan.carbs}g</p>
                    <p className="text-gray-500 text-xs">carbs</p>
                  </div>
                  <div className="bg-gray-700/50 rounded p-2">
                    <p className="text-yellow-400 font-bold">{plan.fat}g</p>
                    <p className="text-gray-500 text-xs">fat</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4">Duration: {plan.duration}</p>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleEditMealPlan(plan); }} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(plan.id, 'mealPlan', plan.name); }} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div key={recipe.id} onClick={() => handleViewRecipe(recipe)} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-white">{recipe.name}</h3>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${recipe.creationType === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {recipe.creationType === 'ai' ? '✨ AI' : '✏️ Manual'}
                    </span>
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">{recipe.category}</span>
                  </div>
                </div>
                {recipe.clientName && <p className="text-sm text-orange-400 mb-2">{recipe.clientName}</p>}
                <p className="text-gray-400 text-sm mb-3">{recipe.description}</p>
                <div className="flex gap-4 text-sm text-gray-400 mb-3">
                  <span>⏱️ {recipe.prepTime + recipe.cookTime} min</span>
                  <span>🍽️ {recipe.servings} servings</span>
                </div>
                <div className="flex gap-2 text-xs text-gray-400 mb-4">
                  <span className="bg-gray-700 px-2 py-1 rounded">{recipe.calories} cal</span>
                  <span className="bg-gray-700 px-2 py-1 rounded">{recipe.protein}g protein</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleEditRecipe(recipe); }} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(recipe.id, 'recipe', recipe.name); }} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Delete</button>
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
                {editingItem ? 'Edit' : 'Add'} {modalType === 'mealPlan' ? 'Meal Plan' : 'Recipe'}
              </h2>
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={aiLoading || (modalType === 'mealPlan' ? !mealPlanForm.clientId : !recipeForm.clientId)}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={(modalType === 'mealPlan' ? !mealPlanForm.clientId : !recipeForm.clientId) ? 'Select a client first' : ''}
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

            {modalType === 'mealPlan' ? (
              <form onSubmit={handleMealPlanSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Client *</label>
                  <select required value={mealPlanForm.clientId} onChange={(e) => handleMealPlanClientChange(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white">
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {editingItem && <p className="text-xs text-yellow-400 mt-1">Editing existing {mealPlanForm.creationType} entry for this client</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name *</label>
                  <input type="text" required value={mealPlanForm.name} onChange={(e) => setMealPlanForm({ ...mealPlanForm, name: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea value={mealPlanForm.description} onChange={(e) => setMealPlanForm({ ...mealPlanForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                    <input type="text" value={mealPlanForm.category} onChange={(e) => setMealPlanForm({ ...mealPlanForm, category: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Duration</label>
                    <input type="text" value={mealPlanForm.duration} onChange={(e) => setMealPlanForm({ ...mealPlanForm, duration: e.target.value })} placeholder="e.g., 4 weeks" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Calories</label>
                    <input type="number" value={mealPlanForm.calories} onChange={(e) => setMealPlanForm({ ...mealPlanForm, calories: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Protein (g)</label>
                    <input type="number" value={mealPlanForm.protein} onChange={(e) => setMealPlanForm({ ...mealPlanForm, protein: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Carbs (g)</label>
                    <input type="number" value={mealPlanForm.carbs} onChange={(e) => setMealPlanForm({ ...mealPlanForm, carbs: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Fat (g)</label>
                    <input type="number" value={mealPlanForm.fat} onChange={(e) => setMealPlanForm({ ...mealPlanForm, fat: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Target Goal</label>
                  <input type="text" value={mealPlanForm.targetGoal} onChange={(e) => setMealPlanForm({ ...mealPlanForm, targetGoal: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Meals</label>
                  <textarea value={mealPlanForm.meals} onChange={(e) => setMealPlanForm({ ...mealPlanForm, meals: e.target.value })} rows={3} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">{editingItem ? 'Update' : 'Create'}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRecipeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Client *</label>
                  <select required value={recipeForm.clientId} onChange={(e) => handleRecipeClientChange(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white">
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {editingItem && <p className="text-xs text-yellow-400 mt-1">Editing existing {recipeForm.creationType} entry for this client</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name *</label>
                  <input type="text" required value={recipeForm.name} onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea value={recipeForm.description} onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                    <input type="text" value={recipeForm.category} onChange={(e) => setRecipeForm({ ...recipeForm, category: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Prep Time</label>
                    <input type="number" value={recipeForm.prepTime} onChange={(e) => setRecipeForm({ ...recipeForm, prepTime: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Cook Time</label>
                    <input type="number" value={recipeForm.cookTime} onChange={(e) => setRecipeForm({ ...recipeForm, cookTime: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Calories</label>
                    <input type="number" value={recipeForm.calories} onChange={(e) => setRecipeForm({ ...recipeForm, calories: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Protein</label>
                    <input type="number" value={recipeForm.protein} onChange={(e) => setRecipeForm({ ...recipeForm, protein: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Carbs</label>
                    <input type="number" value={recipeForm.carbs} onChange={(e) => setRecipeForm({ ...recipeForm, carbs: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Fat</label>
                    <input type="number" value={recipeForm.fat} onChange={(e) => setRecipeForm({ ...recipeForm, fat: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Servings</label>
                  <input type="number" value={recipeForm.servings} onChange={(e) => setRecipeForm({ ...recipeForm, servings: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ingredients</label>
                  <textarea value={recipeForm.ingredients} onChange={(e) => setRecipeForm({ ...recipeForm, ingredients: e.target.value })} rows={3} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Instructions</label>
                  <textarea value={recipeForm.instructions} onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })} rows={3} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">{editingItem ? 'Update' : 'Create'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && (viewingMealPlan || viewingRecipe) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-white">{viewingMealPlan ? 'Meal Plan Details' : 'Recipe Details'}</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            {viewingMealPlan && (
              <div className="space-y-4">
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <h3 className="text-xl font-bold text-white mb-1">{viewingMealPlan.name}</h3>
                  {viewingMealPlan.clientName && <p className="text-orange-400 mb-1">{viewingMealPlan.clientName}</p>}
                  <span className="inline-block px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">{viewingMealPlan.category}</span>
                </div>

                <p className="text-gray-300">{viewingMealPlan.description}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-700/50 rounded-lg">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Duration</p>
                    <p className="text-white font-medium">{viewingMealPlan.duration}</p>
                  </div>
                  <div className="p-3 bg-gray-700/50 rounded-lg">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Target Goal</p>
                    <p className="text-white font-medium">{viewingMealPlan.targetGoal}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                    <p className="text-xl font-bold text-orange-400">{viewingMealPlan.calories}</p>
                    <p className="text-gray-400 text-xs">Calories</p>
                  </div>
                  <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                    <p className="text-xl font-bold text-red-400">{viewingMealPlan.protein}g</p>
                    <p className="text-gray-400 text-xs">Protein</p>
                  </div>
                  <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                    <p className="text-xl font-bold text-blue-400">{viewingMealPlan.carbs}g</p>
                    <p className="text-gray-400 text-xs">Carbs</p>
                  </div>
                  <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                    <p className="text-xl font-bold text-yellow-400">{viewingMealPlan.fat}g</p>
                    <p className="text-gray-400 text-xs">Fat</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Meals</p>
                  <p className="text-white whitespace-pre-line">{viewingMealPlan.meals || 'No meals listed'}</p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowViewModal(false)} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">Close</button>
                  <button onClick={() => { setShowViewModal(false); handleEditMealPlan(viewingMealPlan); }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit</button>
                </div>
              </div>
            )}

            {viewingRecipe && (
              <div className="space-y-4">
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <h3 className="text-xl font-bold text-white mb-1">{viewingRecipe.name}</h3>
                  <span className="inline-block px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">{viewingRecipe.category}</span>
                </div>

                <p className="text-gray-300">{viewingRecipe.description}</p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                    <p className="text-xl font-bold text-blue-400">{viewingRecipe.prepTime}</p>
                    <p className="text-gray-400 text-xs">Prep (min)</p>
                  </div>
                  <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                    <p className="text-xl font-bold text-orange-400">{viewingRecipe.cookTime}</p>
                    <p className="text-gray-400 text-xs">Cook (min)</p>
                  </div>
                  <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                    <p className="text-xl font-bold text-green-400">{viewingRecipe.servings}</p>
                    <p className="text-gray-400 text-xs">Servings</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                    <p className="text-lg font-bold text-orange-400">{viewingRecipe.calories}</p>
                    <p className="text-gray-400 text-xs">Cal</p>
                  </div>
                  <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                    <p className="text-lg font-bold text-red-400">{viewingRecipe.protein}g</p>
                    <p className="text-gray-400 text-xs">Protein</p>
                  </div>
                  <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                    <p className="text-lg font-bold text-blue-400">{viewingRecipe.carbs}g</p>
                    <p className="text-gray-400 text-xs">Carbs</p>
                  </div>
                  <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                    <p className="text-lg font-bold text-yellow-400">{viewingRecipe.fat}g</p>
                    <p className="text-gray-400 text-xs">Fat</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Ingredients</p>
                  <p className="text-white whitespace-pre-line">{viewingRecipe.ingredients || 'No ingredients listed'}</p>
                </div>

                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Instructions</p>
                  <p className="text-white whitespace-pre-line">{viewingRecipe.instructions || 'No instructions provided'}</p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowViewModal(false)} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">Close</button>
                  <button onClick={() => { setShowViewModal(false); handleEditRecipe(viewingRecipe); }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit</button>
                </div>
              </div>
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
              <h3 className="text-xl font-bold text-white mb-2">Delete {deletingItem.type === 'mealPlan' ? 'Meal Plan' : 'Recipe'}?</h3>
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
