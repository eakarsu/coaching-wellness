'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Stats {
  clients: number;
  workouts: number;
  mealPlans: number;
  appointments: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({ clients: 0, workouts: 0, mealPlans: 0, appointments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [clientsRes, workoutsRes, mealPlansRes, appointmentsRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/workouts'),
          fetch('/api/meal-plans'),
          fetch('/api/appointments'),
        ]);

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
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      title: 'Client Management',
      description: 'Manage your coaching clients, track their progress, and maintain detailed records.',
      href: '/clients',
      icon: '👥',
      color: 'bg-blue-500',
      stat: stats.clients,
      statLabel: 'Active Clients',
    },
    {
      title: 'Fitness Programs',
      description: 'Browse and assign workouts, exercises, and training programs.',
      href: '/fitness',
      icon: '💪',
      color: 'bg-green-500',
      stat: stats.workouts,
      statLabel: 'Workouts Available',
    },
    {
      title: 'Nutrition Plans',
      description: 'Create meal plans, browse healthy recipes, and track macros.',
      href: '/nutrition',
      icon: '🥗',
      color: 'bg-orange-500',
      stat: stats.mealPlans,
      statLabel: 'Meal Plans',
    },
    {
      title: 'Wellness Goals',
      description: 'Set and track wellness goals, monitor progress, and celebrate achievements.',
      href: '/wellness',
      icon: '🎯',
      color: 'bg-purple-500',
      stat: 15,
      statLabel: 'Active Goals',
    },
    {
      title: 'Appointments',
      description: 'Schedule coaching sessions, manage bookings, and send reminders.',
      href: '/appointments',
      icon: '📅',
      color: 'bg-red-500',
      stat: stats.appointments,
      statLabel: 'Upcoming Sessions',
    },
    {
      title: 'Admin Dashboard',
      description: 'Full administrative control over all system data and settings.',
      href: '/admin',
      icon: '⚙️',
      color: 'bg-gray-700',
      stat: null,
      statLabel: 'Manage System',
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Wellness Coach Pro</h1>
              <p className="text-gray-400 mt-1">Your complete health and wellness coaching platform</p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <span>⚙️</span>
              Admin Panel
            </Link>
          </div>
        </div>
      </header>

      {/* Stats Banner */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Clients', value: stats.clients, color: 'text-blue-400', href: '/clients' },
            { label: 'Workouts', value: stats.workouts, color: 'text-green-400', href: '/fitness' },
            { label: 'Meal Plans', value: stats.mealPlans, color: 'text-orange-400', href: '/nutrition' },
            { label: 'Upcoming Sessions', value: stats.appointments, color: 'text-red-400', href: '/appointments' },
          ].map((stat, index) => (
            <Link key={index} href={stat.href} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer">
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>
                {loading ? '...' : stat.value}
              </p>
            </Link>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link
              key={index}
              href={feature.href}
              className="group bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-500 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                  {feature.icon}
                </div>
                {feature.stat !== null && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{loading ? '...' : feature.stat}</p>
                    <p className="text-xs text-gray-400">{feature.statLabel}</p>
                  </div>
                )}
              </div>
              <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                {feature.title}
              </h2>
              <p className="text-gray-400 text-sm">{feature.description}</p>
              <div className="mt-4 flex items-center text-indigo-400 text-sm font-medium">
                Explore →
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/clients" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              + Add New Client
            </Link>
            <Link href="/appointments" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              + Schedule Session
            </Link>
            <Link href="/wellness" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              + Log Progress
            </Link>
            <Link href="/nutrition" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              + Create Meal Plan
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Wellness Coach Pro - Empowering Health Professionals</p>
          <p className="mt-1">Built with Next.js, React, and SQLite</p>
        </footer>
      </div>
    </main>
  );
}
