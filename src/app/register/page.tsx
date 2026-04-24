'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '', firstName: '', lastName: '', role: 'viewer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.username) { setError('Username is required'); return; }
    if (formData.username.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (!formData.email) { setError('Email is required'); return; }
    if (!formData.email.includes('@')) { setError('Please enter a valid email address'); return; }
    if (!formData.password) { setError('Password is required'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (!formData.firstName) { setError('First name is required'); return; }
    if (!formData.lastName) { setError('Last name is required'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...formData }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); return; }
      localStorage.setItem('user', JSON.stringify(data));
      router.push('/');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl p-8 w-full max-w-md border border-gray-700 max-h-[95vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400">Join Wellness Coach Pro</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">First Name *</label>
              <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Last Name *</label>
              <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username *</label>
            <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="Choose a username" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email *</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Role</label>
            <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option value="viewer">Viewer</option>
              <option value="client">Client</option>
              <option value="coach">Coach</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password *</label>
            <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Confirm Password *</label>
            <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="Re-enter password" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-400 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
