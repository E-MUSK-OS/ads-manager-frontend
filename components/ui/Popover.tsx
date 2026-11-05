"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export interface PopoverProps {
  trigger: React.ReactNode;
  children:
    | React.ReactNode
    | ((helpers: { close: () => void }) => React.ReactNode);
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end" | "left" | "right";
  sideOffset?: number;
  className?: string;
  disabled?: boolean;
}

export function Popover({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  align = "start",
  sideOffset = 6,
  className = "",
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

  // Direct DOM positioning via translate3d — ZERO React re-renders during scroll!
  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    const panelEl = panelRef.current;
    if (!triggerEl || !panelEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const panelWidth = panelEl.offsetWidth || 240;
    const panelHeight = panelEl.offsetHeight || 180;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let left = rect.left;
    if (align === "center") {
      left = rect.left + rect.width / 2 - panelWidth / 2;
    } else if (align === "end" || align === "right") {
      left = rect.right - panelWidth;
    }

    // Clamp horizontally within viewport
    left = Math.max(8, Math.min(left, viewportW - panelWidth - 8));

    // Flip above trigger if not enough space below
    let top = rect.bottom + sideOffset;
    if (top + panelHeight > viewportH - 8 && rect.top - panelHeight - sideOffset > 8) {
      top = rect.top - panelHeight - sideOffset;
    }

    panelEl.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
  }, [align, sideOffset]);

  const schedulePositionUpdate = useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = window.requestAnimationFrame(() => {
      rafIdRef.current = null;
      updatePosition();
    });
  }, [updatePosition]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      schedulePositionUpdate();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };

    window.addEventListener("scroll", handleScrollOrResize, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen, schedulePositionUpdate, close]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setOpen(!isOpen);
        }}
        className={disabled ? "cursor-not-allowed opacity-60" : "inline-flex cursor-pointer"}
      >
        {trigger}
      </div>
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              transform: "translate3d(-9999px, -9999px, 0)",
              willChange: "transform",
            }}
            className={`z-50 bg-white text-slate-900 border border-slate-300 rounded-md shadow-lg ${className}`}
          >
            {typeof children === "function" ? children({ close }) : children}
          </div>,
          document.body
        )}
    </>
  );
}
