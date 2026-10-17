'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'destructive';
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onCancel,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant,
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const handleClose = () => {
    if (onCancel) onCancel();
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  const effectiveVariant =
    variant === 'destructive' || variant === 'danger' || destructive ? 'danger' : 'primary';

  useEffect(() => {
    if (!open) return;

    // Focus confirm button when opened
    confirmBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, loading]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100"
    >
      <div
        ref={dialogRef}
        className="bg-surface border border-border-dim rounded-md shadow-xl max-w-md w-full p-5 relative"
      >
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          {effectiveVariant === 'danger' ? (
            <div className="w-9 h-9 rounded-full bg-rose-50 text-spend flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
          ) : null}

          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="text-base font-semibold text-text-main">
              {title}
            </h3>
            <p id="confirm-dialog-desc" className="text-sm text-slate-500 mt-2 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-border-dim">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="text-sm"
          >
            {cancelLabel}
          </Button>
          <Button
            ref={confirmBtnRef}
            type="button"
            variant={effectiveVariant === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={loading}
            className={`text-sm ${effectiveVariant === 'danger' ? 'bg-spend hover:bg-rose-700 text-white' : ''}`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
