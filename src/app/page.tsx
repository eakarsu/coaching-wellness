'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StatSkeleton, GridSkeleton } from '@/components/LoadingSkeleton';

interface Stats {
  clients: number;
  workouts: number;
  mealPlans: number;
  appointments: number;
}

interface Feature {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
  stat: number | null;
  statLabel: string;
}

function HomePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [stats, setStats] = useState<Stats>({ clients: 0, workouts: 0, mealPlans: 0, appointments: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [clientsRes, workoutsRes, mealPlansRes, appointmentsRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/workouts'),
          fetch('/api/meal-plans'),
          fetch('/api/appointments'),
        ]);

        if (!clientsRes.ok || !workoutsRes.ok || !mealPlansRes.ok || !appointmentsRes.ok) {
          throw new Error('One or more API requests failed');
        }

        const [clients, workouts, mealPlans, appointments] = await Promise.all([
          clientsRes.json(),
          workoutsRes.json(),
          mealPlansRes.json(),
          appointmentsRes.json(),
        ]);

        setStats({
          clients: Array.isArray(clients) ? clients.length : 0,
          workouts: Array.isArray(workouts) ? workouts.length : 0,
          mealPlans: Array.isArray(mealPlans) ? mealPlans.length : 0,
          appointments: Array.isArray(appointments) ? appointments.filter((a: { status: string }) => a.status === 'scheduled').length : 0,
        });

        showToast('Dashboard data loaded successfully', 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(message);
        showToast(message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const features: Feature[] = useMemo(() => [
    {
      title: 'Client Management',
      description: 'Manage your coaching clients, track their progress, and maintain detailed records.',
      href: '/clients',
      icon: '\u{1F465}',
      color: 'bg-blue-500',
      stat: stats.clients,
      statLabel: 'Active Clients',
    },
    {
      title: 'Fitness Programs',
      description: 'Browse and assign workouts, exercises, and training programs.',
      href: '/fitness',
      icon: '\u{1F4AA}',
      color: 'bg-green-500',
      stat: stats.workouts,
      statLabel: 'Workouts Available',
    },
    {
      title: 'Nutrition Plans',
      description: 'Create meal plans, browse healthy recipes, and track macros.',
      href: '/nutrition',
      icon: '\u{1F957}',
      color: 'bg-orange-500',
      stat: stats.mealPlans,
      statLabel: 'Meal Plans',
    },
    {
      title: 'Wellness Goals',
      description: 'Set and track wellness goals, monitor progress, and celebrate achievements.',
      href: '/wellness',
      icon: '\u{1F3AF}',
      color: 'bg-purple-500',
      stat: 15,
      statLabel: 'Active Goals',
    },
    {
      title: 'Appointments',
      description: 'Schedule coaching sessions, manage bookings, and send reminders.',
      href: '/appointments',
      icon: '\u{1F4C5}',
      color: 'bg-red-500',
      stat: stats.appointments,
      statLabel: 'Upcoming Sessions',
    },
    {
      title: 'Admin Dashboard',
      description: 'Full administrative control over all system data and settings.',
      href: '/admin',
      icon: '\u{2699}\u{FE0F}',
      color: 'bg-gray-700',
      stat: null,
      statLabel: 'Manage System',
    },
  ], [stats]);

  const filteredFeatures = useMemo(() => {
    if (!searchQuery.trim()) return features;
    const query = searchQuery.toLowerCase();
    return features.filter(
      (f) =>
        f.title.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query) ||
        f.statLabel.toLowerCase().includes(query)
    );
  }, [searchQuery, features]);

  const handleCardClick = (href: string, title: string) => {
    showToast(`Navigating to ${title}...`, 'info');
    router.push(href);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredFeatures.length === 1) {
      handleCardClick(filteredFeatures[0].href, filteredFeatures[0].title);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    window.location.reload();
  };

  const statBannerItems = [
    { label: 'Total Clients', value: stats.clients, color: 'text-blue-400', href: '/clients' },
    { label: 'Workouts', value: stats.workouts, color: 'text-green-400', href: '/fitness' },
    { label: 'Meal Plans', value: stats.mealPlans, color: 'text-orange-400', href: '/nutrition' },
    { label: 'Upcoming Sessions', value: stats.appointments, color: 'text-red-400', href: '/appointments' },
  ];

  const quickActions = [
    { label: '+ Add New Client', href: '/clients', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: '+ Schedule Session', href: '/appointments', color: 'bg-red-600 hover:bg-red-700' },
    { label: '+ Log Progress', href: '/wellness', color: 'bg-purple-600 hover:bg-purple-700' },
    { label: '+ Create Meal Plan', href: '/nutrition', color: 'bg-orange-600 hover:bg-orange-700' },
    { label: '+ New Workout', href: '/fitness', color: 'bg-green-600 hover:bg-green-700' },
  ];

  const totalItems = stats.clients + stats.workouts + stats.mealPlans + stats.appointments;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Welcome & Global Search */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-gray-400 mb-6">Your complete health and wellness coaching platform</p>

          <div className="relative max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search sections... (e.g. clients, fitness, nutrition)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-12 pr-4 py-3 bg-gray-800/70 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-700 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-red-400 text-lg font-bold">!</span>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
            <button
              onClick={handleRetry}
              className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Quick Stats Summary */}
        {!loading && !error && (
          <div className="mb-6 bg-gray-800/30 border border-gray-700/50 rounded-xl px-6 py-3 flex items-center gap-4">
            <span className="text-gray-400 text-sm">Quick Stats:</span>
            <span className="text-white font-semibold text-sm">{totalItems} total items across all sections</span>
            <span className="text-gray-600">|</span>
            <span className="text-green-400 text-sm">{stats.clients} clients</span>
            <span className="text-gray-600">|</span>
            <span className="text-blue-400 text-sm">{stats.workouts} workouts</span>
            <span className="text-gray-600">|</span>
            <span className="text-orange-400 text-sm">{stats.mealPlans} plans</span>
            <span className="text-gray-600">|</span>
            <span className="text-red-400 text-sm">{stats.appointments} sessions</span>
          </div>
        )}

        {/* Stats Banner */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statBannerItems.map((stat, index) => (
              <Link
                key={index}
                href={stat.href}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer group"
              >
                <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* Feature Cards */}
        {loading ? (
          <GridSkeleton count={6} />
        ) : (
          <>
            {filteredFeatures.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No sections match &quot;{searchQuery}&quot;</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm"
                >
                  Clear search
                </button>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFeatures.map((feature, index) => (
                <div
                  key={index}
                  onClick={() => handleCardClick(feature.href, feature.title)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(feature.href, feature.title);
                    }
                  }}
                  className="group bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-500 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                      {feature.icon}
                    </div>
                    {feature.stat !== null && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{feature.stat}</p>
                        <p className="text-xs text-gray-400">{feature.statLabel}</p>
                      </div>
                    )}
                    {feature.stat === null && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{feature.statLabel}</p>
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                    {feature.title}
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                  <div className="mt-4 flex items-center text-indigo-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                    Explore
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="mt-12 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  showToast(`Opening ${action.label.replace('+ ', '')}...`, 'info');
                  router.push(action.href);
                }}
                className={`px-4 py-2 ${action.color} text-white rounded-lg transition-colors text-sm font-medium`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm pb-8">
          <p>Wellness Coach Pro - Empowering Health Professionals</p>
          <p className="mt-1">Built with Next.js, React, and SQLite</p>
        </footer>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <HomePage />
    </ErrorBoundary>
  );
}
