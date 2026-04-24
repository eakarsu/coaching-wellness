'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showGlobalSearch?: boolean;
}

const searchTargets = [
  { label: 'Clients', href: '/clients' },
  { label: 'Fitness', href: '/fitness' },
  { label: 'Nutrition', href: '/nutrition' },
  { label: 'Wellness', href: '/wellness' },
  { label: 'Appointments', href: '/appointments' },
  { label: 'Admin', href: '/admin' },
];

export default function SearchBar({ value, onChange, placeholder = 'Search...', showGlobalSearch = false }: SearchBarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => showGlobalSearch && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
          />
          {value && (
            <button
              onClick={() => onChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {showGlobalSearch && showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
          <p className="px-3 py-2 text-xs text-gray-500 border-b border-gray-700">Search in section:</p>
          {searchTargets.map(target => (
            <button
              key={target.href}
              onClick={() => { router.push(target.href); setShowDropdown(false); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
            >
              {target.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
