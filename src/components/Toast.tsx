'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { ToastMessage } from '@/types';

interface ToastContextType {
  showToast: (message: string, type?: ToastMessage['type']) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type, duration: 3000 }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const colors = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
    warning: 'bg-yellow-600 border-yellow-500',
    info: 'bg-blue-600 border-blue-500',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`${colors[toast.type]} border rounded-lg px-4 py-3 text-white shadow-lg flex items-center gap-3 animate-slide-in`}>
      <span className="text-lg font-bold">{icons[toast.type]}</span>
      <p className="flex-1 text-sm">{toast.message}</p>
      <button onClick={() => onClose(toast.id)} className="text-white/70 hover:text-white text-lg">
        &times;
      </button>
    </div>
  );
}
