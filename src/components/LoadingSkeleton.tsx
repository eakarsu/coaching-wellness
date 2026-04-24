'use client';

export function CardSkeleton() {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="h-5 bg-gray-700 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-700 rounded w-24" />
        </div>
        <div className="h-5 bg-gray-700 rounded w-16" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-700 rounded w-3/4" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-gray-700 rounded flex-1" />
        <div className="h-8 bg-gray-700 rounded w-16" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b border-gray-700/50 animate-pulse">
      <td className="py-3 px-4"><div className="h-4 bg-gray-700 rounded w-6" /></td>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4"><div className="h-4 bg-gray-700 rounded w-20" /></td>
      ))}
      <td className="py-3 px-4 text-right">
        <div className="flex justify-end gap-2">
          <div className="h-6 bg-gray-700 rounded w-12" />
          <div className="h-6 bg-gray-700 rounded w-12" />
        </div>
      </td>
    </tr>
  );
}

export function StatSkeleton() {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 animate-pulse">
      <div className="h-3 bg-gray-700 rounded w-20 mb-2" />
      <div className="h-8 bg-gray-700 rounded w-12" />
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
