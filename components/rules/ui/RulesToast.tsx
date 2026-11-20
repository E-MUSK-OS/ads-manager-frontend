'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Fallback emitter for components called without an explicit provider
type ToastListener = (toasts: ToastItem[]) => void;
let globalToasts: ToastItem[] = [];
const listeners = new Set<ToastListener>();

function emitToasts() {
  listeners.forEach((l) => l([...globalToasts]));
}

function addGlobalToast(type: ToastType, title: string, message?: string, duration = 4000): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const item: ToastItem = { id, type, title, message, duration };
  globalToasts = [...globalToasts, item];
  emitToasts();

  if (duration > 0) {
    setTimeout(() => {
      dismissGlobalToast(id);
    }, duration);
  }
  return id;
}

function dismissGlobalToast(id: string) {
  globalToasts = globalToasts.filter((t) => t.id !== id);
  emitToasts();
}

export function RulesToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    dismissGlobalToast(id);
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      return addGlobalToast(type, title, message, duration);
    },
    []
  );

  const success = useCallback((title: string, message?: string) => addGlobalToast('success', title, message), []);
  const error = useCallback((title: string, message?: string) => addGlobalToast('error', title, message), []);
  const info = useCallback((title: string, message?: string) => addGlobalToast('info', title, message), []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, info, dismiss }}>
      {children}
      <RulesToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;

  // Standalone fallback: works everywhere without requiring provider
  return {
    toasts: globalToasts,
    showToast: ({ type, title, message, duration }) => addGlobalToast(type, title, message, duration),
    success: (title: string, message?: string) => addGlobalToast('success', title, message),
    error: (title: string, message?: string) => addGlobalToast('error', title, message),
    info: (title: string, message?: string) => addGlobalToast('info', title, message),
    dismiss: (id: string) => dismissGlobalToast(id),
  };
}

function RulesToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none p-4"
    >
      {toasts.map((toast) => (
        <RulesToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>,
    document.body
  );
}

function RulesToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start justify-between p-3.5 rounded-lg border shadow-lg transition-all animate-in slide-in-from-bottom-2 duration-150 ${
        isError
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : isSuccess
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      <div className="flex items-start gap-3">
        {isError ? (
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        ) : isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        )}
        <div>
          <div className="font-semibold text-xs leading-none">{toast.title}</div>
          {toast.message && <div className="text-[11px] mt-1 opacity-90">{toast.message}</div>}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="ml-3 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
