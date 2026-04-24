'use client';

import { useState, useEffect, useMemo } from 'react';
import { MealPlan, Recipe, Client, SortState } from '@/types';
import { useToast } from '@/components/Toast';
import { GridSkeleton } from '@/components/LoadingSkeleton';
import SortHeader, { useSortData, toggleSort } from '@/components/SortHeader';
import Pagination from '@/components/Pagination';
import BulkActions from '@/components/BulkActions';
import ExportButtons, { exportToJSON, exportToCSV } from '@/components/ExportButtons';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function NutritionPage() {
  const { showToast } = useToast();

  // Data
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'mealPlans' | 'recipes'>('mealPlans');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalType, setModalType] = useState<'mealPlan' | 'recipe'>('mealPlan');
  const [editingItem, setEditingItem] = useState<MealPlan | Recipe | null>(null);
  const [viewingMealPlan, setViewingMealPlan] = useState<MealPlan | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => () => {});
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  // Search, filter, sort
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [mealPlanSort, setMealPlanSort] = useState<SortState>({ field: 'name', direction: 'asc' });
  const [recipeSort, setRecipeSort] = useState<SortState>({ field: 'name', direction: 'asc' });

  // Pagination
  const [mpPage, setMpPage] = useState(1);
  const [mpPageSize, setMpPageSize] = useState(15);
  const [rPage, setRPage] = useState(1);
  const [rPageSize, setRPageSize] = useState(15);

  // Bulk selection
  const [selectedMealPlanIds, setSelectedMealPlanIds] = useState<Set<string>>(new Set());
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());

  // AI
  const [aiLoading, setAiLoading] = useState(false);

  // Validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Forms
  const [mealPlanForm, setMealPlanForm] = useState({
    clientId: '', clientName: '', name: '', description: '', category: '',
    calories: '', protein: '', carbs: '', fat: '', meals: '', duration: '',
    targetGoal: '', creationType: 'manual' as 'manual' | 'ai'
  });

  const [recipeForm, setRecipeForm] = useState({
    clientId: '', clientName: '', name: '', description: '', category: '',
    calories: '', protein: '', carbs: '', fat: '', ingredients: '',
    instructions: '', prepTime: '', cookTime: '', servings: '',
    creationType: 'manual' as 'manual' | 'ai'
  });

  // ─── Fetch Data ──────────────────────────────────────────────────────
  useEffect(() => { fetchData(); }, []);

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
      showToast('Failed to load nutrition data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Derived / Filtered Data ─────────────────────────────────────────
  const mealPlanCategories = useMemo(() =>
    [...new Set(mealPlans.map(m => m.category).filter(Boolean))], [mealPlans]);
  const recipeCategories = useMemo(() =>
    [...new Set(recipes.map(r => r.category).filter(Boolean))], [recipes]);
  const categories = activeTab === 'mealPlans' ? mealPlanCategories : recipeCategories;

  const filteredMealPlans = useMemo(() => {
    return mealPlans.filter(m => {
      const matchesSearch = !searchTerm || m.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [mealPlans, searchTerm, filterCategory]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const matchesSearch = !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || r.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [recipes, searchTerm, filterCategory]);

  const sortedMealPlans = useSortData(filteredMealPlans, mealPlanSort);
  const sortedRecipes = useSortData(filteredRecipes, recipeSort);

  const mpTotalPages = Math.max(1, Math.ceil(sortedMealPlans.length / mpPageSize));
  const paginatedMealPlans = sortedMealPlans.slice((mpPage - 1) * mpPageSize, mpPage * mpPageSize);

  const rTotalPages = Math.max(1, Math.ceil(sortedRecipes.length / rPageSize));
  const paginatedRecipes = sortedRecipes.slice((rPage - 1) * rPageSize, rPage * rPageSize);

  // ─── Validation ──────────────────────────────────────────────────────
  const validateMealPlanForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!mealPlanForm.name.trim()) errors.name = 'Name is required';
    if (!mealPlanForm.clientId) errors.clientId = 'Client is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRecipeForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!recipeForm.name.trim()) errors.name = 'Name is required';
    if (!recipeForm.clientId) errors.clientId = 'Client is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── CRUD: Meal Plans ────────────────────────────────────────────────
  const handleMealPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMealPlanForm()) return;
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
        showToast(editingItem ? 'Meal plan updated successfully' : 'Meal plan created successfully', 'success');
      } else {
        showToast('Failed to save meal plan', 'error');
      }
    } catch (error) {
      console.error('Failed to save meal plan:', error);
      showToast('Failed to save meal plan', 'error');
    }
  };

  // ─── CRUD: Recipes ───────────────────────────────────────────────────
  const handleRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRecipeForm()) return;
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
        showToast(editingItem ? 'Recipe updated successfully' : 'Recipe created successfully', 'success');
      } else {
        showToast('Failed to save recipe', 'error');
      }
    } catch (error) {
      console.error('Failed to save recipe:', error);
      showToast('Failed to save recipe', 'error');
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────
  const handleDeleteClick = (id: string, type: 'mealPlan' | 'recipe', name: string) => {
    setConfirmTitle(`Delete ${type === 'mealPlan' ? 'Meal Plan' : 'Recipe'}?`);
    setConfirmMessage(`Are you sure you want to delete "${name}"? This action cannot be undone.`);
    setConfirmAction(() => async () => {
      try {
        const endpoint = type === 'mealPlan' ? '/api/meal-plans' : '/api/recipes';
        const res = await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchData();
          showToast(`${type === 'mealPlan' ? 'Meal plan' : 'Recipe'} deleted successfully`, 'success');
        } else {
          showToast('Delete failed', 'error');
        }
      } catch (error) {
        console.error('Failed to delete:', error);
        showToast('Failed to delete', 'error');
      }
      setConfirmOpen(false);
    });
    setConfirmOpen(true);
  };

  // ─── Bulk Delete ─────────────────────────────────────────────────────
  const handleBulkDelete = () => {
    const ids = activeTab === 'mealPlans' ? selectedMealPlanIds : selectedRecipeIds;
    const type = activeTab === 'mealPlans' ? 'meal plans' : 'recipes';
    setConfirmTitle(`Delete ${ids.size} ${type}?`);
    setConfirmMessage(`Are you sure you want to delete ${ids.size} selected ${type}? This action cannot be undone.`);
    setConfirmAction(() => async () => {
      try {
        const endpoint = activeTab === 'mealPlans' ? '/api/meal-plans' : '/api/recipes';
        const deletePromises = Array.from(ids).map(id =>
          fetch(`${endpoint}?id=${id}`, { method: 'DELETE' })
        );
        await Promise.all(deletePromises);
        fetchData();
        if (activeTab === 'mealPlans') setSelectedMealPlanIds(new Set());
        else setSelectedRecipeIds(new Set());
        showToast(`${ids.size} ${type} deleted successfully`, 'success');
      } catch (error) {
        console.error('Bulk delete failed:', error);
        showToast('Bulk delete failed', 'error');
      }
      setConfirmOpen(false);
    });
    setConfirmOpen(true);
  };

  // ─── Bulk Export ─────────────────────────────────────────────────────
  const handleBulkExport = () => {
    if (activeTab === 'mealPlans') {
      const selected = mealPlans.filter(m => selectedMealPlanIds.has(m.id));
      exportToJSON(selected, 'selected-meal-plans');
      showToast(`Exported ${selected.length} meal plans`, 'success');
    } else {
      const selected = recipes.filter(r => selectedRecipeIds.has(r.id));
      exportToJSON(selected, 'selected-recipes');
      showToast(`Exported ${selected.length} recipes`, 'success');
    }
  };

  // ─── Selection helpers ───────────────────────────────────────────────
  const toggleMealPlanSelection = (id: string) => {
    setSelectedMealPlanIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleRecipeSelection = (id: string) => {
    setSelectedRecipeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ─── Edit handlers ──────────────────────────────────────────────────
  const handleEditMealPlan = (plan: MealPlan) => {
    setEditingItem(plan);
    setModalType('mealPlan');
    setFormErrors({});
    setMealPlanForm({
      clientId: plan.clientId || '', clientName: plan.clientName || '',
      name: plan.name, description: plan.description || '',
      category: plan.category || '', calories: plan.calories?.toString() || '',
      protein: plan.protein?.toString() || '', carbs: plan.carbs?.toString() || '',
      fat: plan.fat?.toString() || '', meals: plan.meals || '',
      duration: plan.duration || '', targetGoal: plan.targetGoal || '',
      creationType: plan.creationType || 'manual'
    });
    setShowModal(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingItem(recipe);
    setModalType('recipe');
    setFormErrors({});
    setRecipeForm({
      clientId: recipe.clientId || '', clientName: recipe.clientName || '',
      name: recipe.name, description: recipe.description || '',
      category: recipe.category || '', calories: recipe.calories?.toString() || '',
      protein: recipe.protein?.toString() || '', carbs: recipe.carbs?.toString() || '',
      fat: recipe.fat?.toString() || '', ingredients: recipe.ingredients || '',
      instructions: recipe.instructions || '', prepTime: recipe.prepTime?.toString() || '',
      cookTime: recipe.cookTime?.toString() || '', servings: recipe.servings?.toString() || '',
      creationType: recipe.creationType || 'manual'
    });
    setShowModal(true);
  };

  const handleAddNew = (type: 'mealPlan' | 'recipe') => {
    setEditingItem(null);
    setModalType(type);
    setFormErrors({});
    if (type === 'mealPlan') {
      setMealPlanForm({ clientId: '', clientName: '', name: '', description: '', category: '', calories: '', protein: '', carbs: '', fat: '', meals: '', duration: '', targetGoal: '', creationType: 'manual' });
    } else {
      setRecipeForm({ clientId: '', clientName: '', name: '', description: '', category: '', calories: '', protein: '', carbs: '', fat: '', ingredients: '', instructions: '', prepTime: '', cookTime: '', servings: '', creationType: 'manual' });
    }
    setShowModal(true);
  };

  // ─── Client change (auto-load existing) ──────────────────────────────
  const handleMealPlanClientChange = (clientId: string) => {
    const creationType = mealPlanForm.creationType;
    const existingPlan = mealPlans.find(m => m.clientId === clientId && m.creationType === creationType);
    if (existingPlan) {
      setEditingItem(existingPlan);
      setMealPlanForm({
        clientId: existingPlan.clientId || '', clientName: existingPlan.clientName || '',
        name: existingPlan.name, description: existingPlan.description || '',
        category: existingPlan.category || '', calories: existingPlan.calories?.toString() || '',
        protein: existingPlan.protein?.toString() || '', carbs: existingPlan.carbs?.toString() || '',
        fat: existingPlan.fat?.toString() || '', meals: existingPlan.meals || '',
        duration: existingPlan.duration || '', targetGoal: existingPlan.targetGoal || '',
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
        clientId: existingRecipe.clientId || '', clientName: existingRecipe.clientName || '',
        name: existingRecipe.name, description: existingRecipe.description || '',
        category: existingRecipe.category || '', calories: existingRecipe.calories?.toString() || '',
        protein: existingRecipe.protein?.toString() || '', carbs: existingRecipe.carbs?.toString() || '',
        fat: existingRecipe.fat?.toString() || '', ingredients: existingRecipe.ingredients || '',
        instructions: existingRecipe.instructions || '', prepTime: existingRecipe.prepTime?.toString() || '',
        cookTime: existingRecipe.cookTime?.toString() || '', servings: existingRecipe.servings?.toString() || '',
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
    setFormErrors({});
  };

  // ─── Detail Modal (card click) ───────────────────────────────────────
  const handleViewMealPlan = (plan: MealPlan) => {
    setViewingMealPlan(plan);
    setViewingRecipe(null);
    setShowDetailModal(true);
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setViewingRecipe(recipe);
    setViewingMealPlan(null);
    setShowDetailModal(true);
  };

  // ─── AI Generation ───────────────────────────────────────────────────
  const handleGenerateAI = async () => {
    const currentForm = modalType === 'mealPlan' ? mealPlanForm : recipeForm;
    if (!currentForm.clientId) {
      showToast('Please select a client first', 'warning');
      return;
    }
    setAiLoading(true);
    try {
      const type = modalType === 'mealPlan' ? 'mealPlan' : 'recipe';
      const selectedClient = clients.find(c => c.id === currentForm.clientId);

      if (modalType === 'mealPlan') {
        const existingAI = mealPlans.find(m => m.clientId === currentForm.clientId && m.creationType === 'ai');
        if (existingAI) setEditingItem(existingAI);
      } else {
        const existingAI = recipes.find(r => r.clientId === currentForm.clientId && r.creationType === 'ai');
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

      if (modalType === 'mealPlan') {
        setMealPlanForm({
          ...mealPlanForm,
          name: data.name || '', description: data.description || '',
          category: data.category || '', calories: data.calories?.toString() || '',
          protein: data.protein?.toString() || '', carbs: data.carbs?.toString() || '',
          fat: data.fat?.toString() || '', meals: data.meals || '',
          duration: data.duration || '', targetGoal: data.targetGoal || '',
          creationType: 'ai'
        });
      } else {
        setRecipeForm({
          ...recipeForm,
          name: data.name || '', description: data.description || '',
          category: data.category || '', calories: data.calories?.toString() || '',
          protein: data.protein?.toString() || '', carbs: data.carbs?.toString() || '',
          fat: data.fat?.toString() || '', ingredients: data.ingredients || '',
          instructions: data.instructions || '', prepTime: data.prepTime?.toString() || '',
          cookTime: data.cookTime?.toString() || '', servings: data.servings?.toString() || '',
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

  // ─── Tab switch resets ───────────────────────────────────────────────
  const handleTabSwitch = (tab: 'mealPlans' | 'recipes') => {
    setActiveTab(tab);
    setFilterCategory('all');
    setSearchTerm('');
    setMpPage(1);
    setRPage(1);
  };

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => handleTabSwitch('mealPlans')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'mealPlans'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Meal Plans ({mealPlans.length})
            </button>
            <button
              onClick={() => handleTabSwitch('recipes')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'recipes'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Recipes ({recipes.length})
            </button>
          </div>
          <button
            onClick={() => handleAddNew(activeTab === 'mealPlans' ? 'mealPlan' : 'recipe')}
            className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium shadow-lg shadow-orange-600/20"
          >
            + Add {activeTab === 'mealPlans' ? 'Meal Plan' : 'Recipe'}
          </button>
        </div>

        {/* Search + Filter + Sort + Export bar */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder={`Search ${activeTab === 'mealPlans' ? 'meal plans' : 'recipes'} by name...`}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setMpPage(1); setRPage(1); }}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Category filter */}
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setMpPage(1); setRPage(1); }}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            {/* Sort buttons */}
            <div className="flex items-center gap-3 bg-gray-700/50 rounded-lg px-3 py-1.5">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Sort:</span>
              {activeTab === 'mealPlans' ? (
                <>
                  <SortHeader label="Name" field="name" sort={mealPlanSort} onSort={(f) => setMealPlanSort(toggleSort(mealPlanSort, f))} />
                  <SortHeader label="Calories" field="calories" sort={mealPlanSort} onSort={(f) => setMealPlanSort(toggleSort(mealPlanSort, f))} />
                  <SortHeader label="Protein" field="protein" sort={mealPlanSort} onSort={(f) => setMealPlanSort(toggleSort(mealPlanSort, f))} />
                </>
              ) : (
                <>
                  <SortHeader label="Name" field="name" sort={recipeSort} onSort={(f) => setRecipeSort(toggleSort(recipeSort, f))} />
                  <SortHeader label="Calories" field="calories" sort={recipeSort} onSort={(f) => setRecipeSort(toggleSort(recipeSort, f))} />
                  <SortHeader label="Protein" field="protein" sort={recipeSort} onSort={(f) => setRecipeSort(toggleSort(recipeSort, f))} />
                </>
              )}
            </div>

            {/* Export */}
            <ExportButtons
              data={(activeTab === 'mealPlans' ? sortedMealPlans : sortedRecipes) as unknown as Record<string, unknown>[]}
              filename={activeTab === 'mealPlans' ? 'meal-plans' : 'recipes'}
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {activeTab === 'mealPlans' ? (
          <BulkActions
            selectedCount={selectedMealPlanIds.size}
            totalCount={sortedMealPlans.length}
            onSelectAll={() => setSelectedMealPlanIds(new Set(sortedMealPlans.map(m => m.id)))}
            onDeselectAll={() => setSelectedMealPlanIds(new Set())}
            onBulkDelete={handleBulkDelete}
            onBulkExport={handleBulkExport}
          />
        ) : (
          <BulkActions
            selectedCount={selectedRecipeIds.size}
            totalCount={sortedRecipes.length}
            onSelectAll={() => setSelectedRecipeIds(new Set(sortedRecipes.map(r => r.id)))}
            onDeselectAll={() => setSelectedRecipeIds(new Set())}
            onBulkDelete={handleBulkDelete}
            onBulkExport={handleBulkExport}
          />
        )}

        {/* Content */}
        {loading ? (
          <GridSkeleton count={6} />
        ) : activeTab === 'mealPlans' ? (
          <>
            {paginatedMealPlans.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg">No meal plans found</p>
                <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters, or add a new meal plan.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedMealPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => handleViewMealPlan(plan)}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 hover:bg-gray-700/50 transition-all cursor-pointer group relative"
                  >
                    {/* Bulk select checkbox */}
                    <div className="absolute top-3 left-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedMealPlanIds.has(plan.id)}
                        onChange={() => toggleMealPlanSelection(plan.id)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-between items-start mb-3 ml-6">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-white truncate group-hover:text-orange-300 transition-colors">{plan.name}</h3>
                        {plan.clientName && <p className="text-sm text-orange-400 truncate">{plan.clientName}</p>}
                      </div>
                      <div className="flex gap-1.5 ml-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${plan.creationType === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {plan.creationType === 'ai' ? 'AI' : 'Manual'}
                        </span>
                        {plan.category && (
                          <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs font-medium">{plan.category}</span>
                        )}
                      </div>
                    </div>

                    {plan.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{plan.description}</p>
                    )}

                    {/* Macros grid */}
                    <div className="grid grid-cols-4 gap-2 text-center text-sm mb-4">
                      <div className="bg-gray-700/50 rounded-lg p-2">
                        <p className="text-orange-400 font-bold">{plan.calories}</p>
                        <p className="text-gray-500 text-xs">cal</p>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-2">
                        <p className="text-red-400 font-bold">{plan.protein}g</p>
                        <p className="text-gray-500 text-xs">protein</p>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-2">
                        <p className="text-blue-400 font-bold">{plan.carbs}g</p>
                        <p className="text-gray-500 text-xs">carbs</p>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-2">
                        <p className="text-yellow-400 font-bold">{plan.fat}g</p>
                        <p className="text-gray-500 text-xs">fat</p>
                      </div>
                    </div>

                    {plan.duration && (
                      <p className="text-xs text-gray-500 mb-2">Duration: {plan.duration}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={mpPage}
              totalPages={mpTotalPages}
              totalItems={sortedMealPlans.length}
              pageSize={mpPageSize}
              onPageChange={setMpPage}
              onPageSizeChange={(size) => { setMpPageSize(size); setMpPage(1); }}
            />
          </>
        ) : (
          <>
            {paginatedRecipes.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg">No recipes found</p>
                <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters, or add a new recipe.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => handleViewRecipe(recipe)}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 hover:bg-gray-700/50 transition-all cursor-pointer group relative"
                  >
                    {/* Bulk select checkbox */}
                    <div className="absolute top-3 left-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRecipeIds.has(recipe.id)}
                        onChange={() => toggleRecipeSelection(recipe.id)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-between items-start mb-3 ml-6">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-white truncate group-hover:text-orange-300 transition-colors">{recipe.name}</h3>
                        {recipe.clientName && <p className="text-sm text-orange-400 truncate">{recipe.clientName}</p>}
                      </div>
                      <div className="flex gap-1.5 ml-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${recipe.creationType === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {recipe.creationType === 'ai' ? 'AI' : 'Manual'}
                        </span>
                        {recipe.category && (
                          <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs font-medium">{recipe.category}</span>
                        )}
                      </div>
                    </div>

                    {recipe.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{recipe.description}</p>
                    )}

                    {/* Prep + Cook + Servings */}
                    <div className="flex gap-4 text-sm text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {recipe.prepTime + recipe.cookTime} min
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {recipe.servings} servings
                      </span>
                    </div>

                    {/* Macros row */}
                    <div className="grid grid-cols-4 gap-2 text-center text-sm">
                      <div className="bg-gray-700/50 rounded-lg p-2">
                        <p className="text-orange-400 font-bold">{recipe.calories}</p>
                        <p className="text-gray-500 text-xs">cal</p>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-2">
                        <p className="text-red-400 font-bold">{recipe.protein}g</p>
                        <p className="text-gray-500 text-xs">protein</p>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-2">
                        <p className="text-blue-400 font-bold">{recipe.carbs}g</p>
                        <p className="text-gray-500 text-xs">carbs</p>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-2">
                        <p className="text-yellow-400 font-bold">{recipe.fat}g</p>
                        <p className="text-gray-500 text-xs">fat</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={rPage}
              totalPages={rTotalPages}
              totalItems={sortedRecipes.length}
              pageSize={rPageSize}
              onPageChange={setRPage}
              onPageSizeChange={(size) => { setRPageSize(size); setRPage(1); }}
            />
          </>
        )}
      </div>

      {/* ─── Detail Modal (card click) ─────────────────────────────────── */}
      {showDetailModal && (viewingMealPlan || viewingRecipe) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-white">
                {viewingMealPlan ? 'Meal Plan Details' : 'Recipe Details'}
              </h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            {viewingMealPlan && (
              <div className="space-y-4">
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <h3 className="text-xl font-bold text-white mb-1">{viewingMealPlan.name}</h3>
                  {viewingMealPlan.clientName && <p className="text-orange-400 text-sm mb-2">{viewingMealPlan.clientName}</p>}
                  <div className="flex gap-2">
                    {viewingMealPlan.category && (
                      <span className="inline-block px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">{viewingMealPlan.category}</span>
                    )}
                    <span className={`inline-block px-2 py-1 rounded text-xs ${viewingMealPlan.creationType === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {viewingMealPlan.creationType === 'ai' ? 'AI Generated' : 'Manual'}
                    </span>
                  </div>
                </div>

                {viewingMealPlan.description && (
                  <p className="text-gray-300">{viewingMealPlan.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-700/50 rounded-lg">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Duration</p>
                    <p className="text-white font-medium">{viewingMealPlan.duration || '-'}</p>
                  </div>
                  <div className="p-3 bg-gray-700/50 rounded-lg">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Target Goal</p>
                    <p className="text-white font-medium">{viewingMealPlan.targetGoal || '-'}</p>
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
                  <p className="text-white whitespace-pre-line text-sm">{viewingMealPlan.meals || 'No meals listed'}</p>
                </div>

                {viewingMealPlan.createdAt && (
                  <p className="text-xs text-gray-500">Created: {new Date(viewingMealPlan.createdAt).toLocaleDateString()}</p>
                )}

                {/* Edit + Delete buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => { setShowDetailModal(false); handleEditMealPlan(viewingMealPlan); }}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { setShowDetailModal(false); handleDeleteClick(viewingMealPlan.id, 'mealPlan', viewingMealPlan.name); }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}

            {viewingRecipe && (
              <div className="space-y-4">
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <h3 className="text-xl font-bold text-white mb-1">{viewingRecipe.name}</h3>
                  {viewingRecipe.clientName && <p className="text-orange-400 text-sm mb-2">{viewingRecipe.clientName}</p>}
                  <div className="flex gap-2">
                    {viewingRecipe.category && (
                      <span className="inline-block px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">{viewingRecipe.category}</span>
                    )}
                    <span className={`inline-block px-2 py-1 rounded text-xs ${viewingRecipe.creationType === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {viewingRecipe.creationType === 'ai' ? 'AI Generated' : 'Manual'}
                    </span>
                  </div>
                </div>

                {viewingRecipe.description && (
                  <p className="text-gray-300">{viewingRecipe.description}</p>
                )}

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
                  <p className="text-white whitespace-pre-line text-sm">{viewingRecipe.ingredients || 'No ingredients listed'}</p>
                </div>

                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Instructions</p>
                  <p className="text-white whitespace-pre-line text-sm">{viewingRecipe.instructions || 'No instructions provided'}</p>
                </div>

                {viewingRecipe.createdAt && (
                  <p className="text-xs text-gray-500">Created: {new Date(viewingRecipe.createdAt).toLocaleDateString()}</p>
                )}

                {/* Edit + Delete buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => { setShowDetailModal(false); handleEditRecipe(viewingRecipe); }}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { setShowDetailModal(false); handleDeleteClick(viewingRecipe.id, 'recipe', viewingRecipe.name); }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Edit / Add Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700" onClick={(e) => e.stopPropagation()}>
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
                  <>Generate with AI</>
                )}
              </button>
            </div>

            {modalType === 'mealPlan' ? (
              <form onSubmit={handleMealPlanSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Client *</label>
                  <select
                    value={mealPlanForm.clientId}
                    onChange={(e) => handleMealPlanClientChange(e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none transition-colors ${formErrors.clientId ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-orange-500'}`}
                  >
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {formErrors.clientId && <p className="text-xs text-red-400 mt-1">{formErrors.clientId}</p>}
                  {editingItem && <p className="text-xs text-yellow-400 mt-1">Editing existing {mealPlanForm.creationType} entry for this client</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name *</label>
                  <input
                    type="text"
                    value={mealPlanForm.name}
                    onChange={(e) => setMealPlanForm({ ...mealPlanForm, name: e.target.value })}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none transition-colors ${formErrors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-orange-500'}`}
                  />
                  {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea value={mealPlanForm.description} onChange={(e) => setMealPlanForm({ ...mealPlanForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                    <input type="text" value={mealPlanForm.category} onChange={(e) => setMealPlanForm({ ...mealPlanForm, category: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Duration</label>
                    <input type="text" value={mealPlanForm.duration} onChange={(e) => setMealPlanForm({ ...mealPlanForm, duration: e.target.value })} placeholder="e.g., 4 weeks" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Calories</label>
                    <input type="number" value={mealPlanForm.calories} onChange={(e) => setMealPlanForm({ ...mealPlanForm, calories: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Protein (g)</label>
                    <input type="number" value={mealPlanForm.protein} onChange={(e) => setMealPlanForm({ ...mealPlanForm, protein: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Carbs (g)</label>
                    <input type="number" value={mealPlanForm.carbs} onChange={(e) => setMealPlanForm({ ...mealPlanForm, carbs: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Fat (g)</label>
                    <input type="number" value={mealPlanForm.fat} onChange={(e) => setMealPlanForm({ ...mealPlanForm, fat: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Target Goal</label>
                  <input type="text" value={mealPlanForm.targetGoal} onChange={(e) => setMealPlanForm({ ...mealPlanForm, targetGoal: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Meals</label>
                  <textarea value={mealPlanForm.meals} onChange={(e) => setMealPlanForm({ ...mealPlanForm, meals: e.target.value })} rows={3} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">{editingItem ? 'Update' : 'Create'}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRecipeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Client *</label>
                  <select
                    value={recipeForm.clientId}
                    onChange={(e) => handleRecipeClientChange(e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none transition-colors ${formErrors.clientId ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-orange-500'}`}
                  >
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {formErrors.clientId && <p className="text-xs text-red-400 mt-1">{formErrors.clientId}</p>}
                  {editingItem && <p className="text-xs text-yellow-400 mt-1">Editing existing {recipeForm.creationType} entry for this client</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name *</label>
                  <input
                    type="text"
                    value={recipeForm.name}
                    onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none transition-colors ${formErrors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-orange-500'}`}
                  />
                  {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea value={recipeForm.description} onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                    <input type="text" value={recipeForm.category} onChange={(e) => setRecipeForm({ ...recipeForm, category: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Prep Time (min)</label>
                    <input type="number" value={recipeForm.prepTime} onChange={(e) => setRecipeForm({ ...recipeForm, prepTime: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Cook Time (min)</label>
                    <input type="number" value={recipeForm.cookTime} onChange={(e) => setRecipeForm({ ...recipeForm, cookTime: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Calories</label>
                    <input type="number" value={recipeForm.calories} onChange={(e) => setRecipeForm({ ...recipeForm, calories: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Protein (g)</label>
                    <input type="number" value={recipeForm.protein} onChange={(e) => setRecipeForm({ ...recipeForm, protein: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Carbs (g)</label>
                    <input type="number" value={recipeForm.carbs} onChange={(e) => setRecipeForm({ ...recipeForm, carbs: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Fat (g)</label>
                    <input type="number" value={recipeForm.fat} onChange={(e) => setRecipeForm({ ...recipeForm, fat: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Servings</label>
                  <input type="number" value={recipeForm.servings} onChange={(e) => setRecipeForm({ ...recipeForm, servings: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ingredients</label>
                  <textarea value={recipeForm.ingredients} onChange={(e) => setRecipeForm({ ...recipeForm, ingredients: e.target.value })} rows={3} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Instructions</label>
                  <textarea value={recipeForm.instructions} onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })} rows={3} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">{editingItem ? 'Update' : 'Create'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── Confirm Dialog ────────────────────────────────────────────── */}
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
