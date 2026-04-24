'use client';

import { SortState } from '@/types';

interface SortHeaderProps {
  label: string;
  field: string;
  sort: SortState;
  onSort: (field: string) => void;
}

export default function SortHeader({ label, field, sort, onSort }: SortHeaderProps) {
  const isActive = sort.field === field;

  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-left font-medium text-sm hover:text-white transition-colors group"
    >
      <span className={isActive ? 'text-blue-400' : 'text-gray-400'}>{label}</span>
      <span className={`transition-colors ${isActive ? 'text-blue-400' : 'text-gray-600 group-hover:text-gray-400'}`}>
        {isActive ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );
}

export function useSortData<T>(data: T[], sort: SortState): T[] {
  if (!sort.field) return data;
  return [...data].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[sort.field];
    const bVal = (b as Record<string, unknown>)[sort.field];
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    return sort.direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });
}

export function toggleSort(current: SortState, field: string): SortState {
  if (current.field === field) {
    return { field, direction: current.direction === 'asc' ? 'desc' : 'asc' };
  }
  return { field, direction: 'asc' };
}
