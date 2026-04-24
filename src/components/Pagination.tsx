'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange }: PaginationProps) {
  const pageSizes = [10, 15, 25, 50];

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (totalItems === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-700">
      <div className="flex items-center gap-3 text-sm text-gray-400">
        <span>Showing {start}-{end} of {totalItems}</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
        >
          {pageSizes.map(s => <option key={s} value={s}>{s} per page</option>)}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm disabled:opacity-30 hover:bg-gray-700 transition-colors"
        >
          Prev
        </button>
        {getPageNumbers().map((page, i) => (
          typeof page === 'number' ? (
            <button
              key={i}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                currentPage === page
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 border border-gray-700 text-white hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={i} className="px-2 text-gray-500">...</span>
          )
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm disabled:opacity-30 hover:bg-gray-700 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
