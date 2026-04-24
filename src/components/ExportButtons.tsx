'use client';

interface ExportButtonsProps {
  data: Record<string, unknown>[];
  filename: string;
  onExportJSON?: () => void;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
}

export function exportToJSON(data: unknown[], filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h];
      const str = val === null || val === undefined ? '' : String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(','))
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(data: Record<string, unknown>[], filename: string, title: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).filter(k => k !== 'id' && k !== 'imageUrl' && k !== 'videoUrl');

  let html = `<!DOCTYPE html><html><head><title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    h1 { color: #1a1a2e; border-bottom: 2px solid #4a90d9; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
    th { background: #4a90d9; color: white; padding: 8px 6px; text-align: left; }
    td { padding: 6px; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) { background: #f8f9fa; }
    .footer { margin-top: 20px; font-size: 10px; color: #999; text-align: center; }
  </style></head><body>
  <h1>${title}</h1>
  <p>Generated: ${new Date().toLocaleString()} | Total Records: ${data.length}</p>
  <table><thead><tr>${headers.map(h => `<th>${h.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</th>`).join('')}</tr></thead><tbody>`;

  data.forEach(row => {
    html += '<tr>' + headers.map(h => {
      const val = row[h];
      const str = val === null || val === undefined ? '-' : String(val);
      return `<td>${str.length > 50 ? str.substring(0, 50) + '...' : str}</td>`;
    }).join('') + '</tr>';
  });

  html += `</tbody></table><div class="footer">Wellness Coach Pro - Export Report</div></body></html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); };
  }
}

export default function ExportButtons({ data, filename }: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => exportToJSON(data, filename)}
        className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
      >
        JSON
      </button>
      <button
        onClick={() => exportToCSV(data, filename)}
        className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
      >
        CSV
      </button>
      <button
        onClick={() => exportToPDF(data, filename, filename.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}
        className="px-3 py-1.5 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors"
      >
        PDF
      </button>
    </div>
  );
}
