'use client';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

export interface PopoverProps {
  trigger: React.ReactNode;
  children:
    | React.ReactNode
    | ((helpers: { close: () => void }) => React.ReactNode);
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'center' | 'end' | 'left' | 'right';
  sideOffset?: number;
  className?: string;
  disabled?: boolean;
}

export function Popover({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  align = 'start',
  sideOffset = 6,
  className = '',
  disabled = false,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const triggerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const setOpen = useCallback(
    (next: boolean) => {
      if (disabled && next) return;
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [disabled, isControlled, onOpenChange]
  );

  const close = useCallback(() => setOpen(false), [setOpen]);

  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    const panelEl = panelRef.current;
    if (!triggerEl || !panelEl) return;

    const rect = triggerEl.getBoundingClientRect();

    if (
      rect.bottom < 0 ||
      rect.top > window.innerHeight ||
      rect.right < 0 ||
      rect.left > window.innerWidth
    ) {
      close();
      return;
    }

    const panelWidth = panelEl.offsetWidth || 240;
    const panelHeight = panelEl.offsetHeight || 180;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let left = rect.left;
    if (align === 'center') {
      left = rect.left + rect.width / 2 - panelWidth / 2;
    } else if (align === 'end' || align === 'right') {
      left = rect.right - panelWidth;
    }

    left = Math.max(8, Math.min(left, viewportW - panelWidth - 8));

    let top = rect.bottom + sideOffset;
    if (
      top + panelHeight > viewportH - 8 &&
      rect.top - panelHeight - sideOffset > 8
    ) {
      top = rect.top - panelHeight - sideOffset;
    }

    panelEl.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
  }, [align, sideOffset, close]);

  const schedulePositionUpdate = useCallback(() => {
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      updatePosition();
      rafIdRef.current = null;
    });
  }, [updatePosition]);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('scroll', schedulePositionUpdate, { passive: true, capture: true });
    window.addEventListener('resize', schedulePositionUpdate, { passive: true });

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('scroll', schedulePositionUpdate, true);
      window.removeEventListener('resize', schedulePositionUpdate);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close, schedulePositionUpdate]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setOpen(!isOpen);
  };

  const renderedContent =
    typeof children === 'function' ? children({ close }) : children;

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className="inline-flex cursor-pointer"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              zIndex: 9999,
              willChange: 'transform',
            }}
            className={`rounded-md border border-slate-200 bg-white p-3 shadow-lg outline-none ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {renderedContent}
          </div>,
          document.body
        )}
    </>
  );
}
