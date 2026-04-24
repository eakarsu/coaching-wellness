'use client';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  type = 'danger', onConfirm, onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const colors = {
    danger: { bg: 'bg-red-500/20', icon: 'text-red-500', btn: 'bg-red-600 hover:bg-red-700' },
    warning: { bg: 'bg-yellow-500/20', icon: 'text-yellow-500', btn: 'bg-yellow-600 hover:bg-yellow-700' },
    info: { bg: 'bg-blue-500/20', icon: 'text-blue-500', btn: 'bg-blue-600 hover:bg-blue-700' },
  };

  const c = colors[type];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
        <div className="text-center">
          <div className={`w-16 h-16 ${c.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <svg className={`w-8 h-8 ${c.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {type === 'danger' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              )}
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-400 mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
              {cancelLabel}
            </button>
            <button onClick={onConfirm} className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${c.btn}`}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
