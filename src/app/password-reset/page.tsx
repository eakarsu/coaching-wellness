'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PasswordResetPage() {
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Email is required'); return; }
    if (!email.includes('@')) { setError('Please enter a valid email'); return; }
    setStep('reset');
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newPassword) { setError('New password is required'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Reset failed'); return; }
      setStep('done');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl p-8 w-full max-w-md border border-gray-700">
        {step === 'done' ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
            <p className="text-gray-400 mb-6">Your password has been successfully reset.</p>
            <Link href="/login" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
              <p className="text-gray-400 text-sm">
                {step === 'email' ? 'Enter your email to reset your password' : 'Enter your new password'}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {step === 'email' ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="you@example.com" />
                </div>
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                  Continue
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="p-3 bg-gray-700/50 rounded-lg mb-2">
                  <p className="text-gray-400 text-xs">Resetting password for</p>
                  <p className="text-white font-medium">{email}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Min 6 characters" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Re-enter password" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}

            <p className="mt-4 text-center text-gray-400 text-sm">
              <Link href="/login" className="text-blue-400 hover:text-blue-300">Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
