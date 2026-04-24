'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, string> | null>(null);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', avatar: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setFormData({ firstName: u.firstName || '', lastName: u.lastName || '', email: u.email || '', phone: u.phone || '', avatar: u.avatar || '' });
    }
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (!formData.firstName) { setError('First name is required'); return; }
    if (!formData.lastName) { setError('Last name is required'); return; }
    if (!formData.email) { setError('Email is required'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-profile', id: user?.id, ...formData }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Update failed'); return; }
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      setMessage('Profile updated successfully!');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (!passwordForm.newPassword) { setError('New password is required'); return; }
    if (passwordForm.newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', email: user?.email, newPassword: passwordForm.newPassword }),
      });
      if (!res.ok) { setError('Password update failed'); return; }
      setMessage('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-gray-400 hover:text-white">← Back</Link>
          <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        </div>

        {/* User card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.firstName?.charAt(0) || user?.username?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.firstName} {user?.lastName}</h2>
              <p className="text-gray-400">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-xs">{user?.role || 'user'}</span>
            </div>
            <button onClick={handleLogout} className="ml-auto px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm">
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            Edit Profile
          </button>
          <button onClick={() => setActiveTab('password')} className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'password' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            Change Password
          </button>
        </div>

        {message && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
            <p className="text-green-400 text-sm">{message}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">First Name *</label>
                  <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Last Name *</label>
                  <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone</label>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500" />
              </div>
              <button type="submit" disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Current Password</label>
                <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">New Password *</label>
                <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500" placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Confirm New Password *</label>
                <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500" />
              </div>
              <button type="submit" disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
