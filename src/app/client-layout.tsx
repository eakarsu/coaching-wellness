'use client';

import Navbar from '@/components/Navbar';
import { ToastProvider } from '@/components/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Navbar />
        {children}
      </ToastProvider>
    </ErrorBoundary>
  );
}
