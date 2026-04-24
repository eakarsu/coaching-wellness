'use client';

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  onBulkExport: () => void;
}

export default function BulkActions({ selectedCount, totalCount, onSelectAll, onDeselectAll, onBulkDelete, onBulkExport }: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 flex items-center gap-4 mb-4">
      <span className="text-sm text-gray-300">
        <span className="text-white font-medium">{selectedCount}</span> of {totalCount} selected
      </span>
      <div className="flex gap-2">
        {selectedCount < totalCount ? (
          <button onClick={onSelectAll} className="px-3 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
            Select All
          </button>
        ) : (
          <button onClick={onDeselectAll} className="px-3 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
            Deselect All
          </button>
        )}
        <button onClick={onBulkExport} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          Export Selected
        </button>
        <button onClick={onBulkDelete} className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
          Delete Selected
        </button>
      </div>
    </div>
  );
}
