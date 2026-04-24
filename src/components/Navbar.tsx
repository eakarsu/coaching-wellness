'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/clients', label: 'Clients', icon: '👥' },
  { href: '/fitness', label: 'Fitness', icon: '💪' },
  { href: '/nutrition', label: 'Nutrition', icon: '🥗' },
  { href: '/wellness', label: 'Wellness', icon: '🎯' },
  { href: '/appointments', label: 'Appointments', icon: '📅' },
  { href: '/admin', label: 'Admin', icon: '⚙️' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isLoginPage = pathname === '/login' || pathname === '/register' || pathname === '/password-reset';
  if (isLoginPage) return null;

  return (
    <nav className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          <Link href="/" className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-xl">💊</span>
            <span className="hidden sm:inline">Wellness Coach Pro</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5 ${
                  pathname === item.href
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/profile" className="px-3 py-1.5 text-gray-400 hover:text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
              Profile
            </Link>
            <Link href="/login" className="px-3 py-1.5 bg-red-600/20 text-red-400 text-sm rounded-lg hover:bg-red-600/30 transition-colors">
              Logout
            </Link>
          </div>

          {/* Hamburger button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-3 border-t border-gray-700">
            <div className="flex flex-col gap-1">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    pathname === item.href
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <hr className="border-gray-700 my-2" />
              <Link href="/profile" onClick={() => setIsOpen(false)} className="px-3 py-2 text-gray-400 hover:text-white text-sm rounded-lg hover:bg-gray-700 flex items-center gap-2">
                <span>👤</span> Profile
              </Link>
              <Link href="/login" onClick={() => setIsOpen(false)} className="px-3 py-2 text-red-400 text-sm rounded-lg hover:bg-red-600/20 flex items-center gap-2">
                <span>🚪</span> Logout
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
