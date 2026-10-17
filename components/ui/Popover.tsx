"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";

export interface PopoverProps {
  trigger: React.ReactNode;
  children:
    | React.ReactNode
    | ((helpers: { close: () => void }) => React.ReactNode);
  align?: "left" | "right" | "start" | "end" | "center";
  side?: "top" | "bottom";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function Popover({
  trigger,
  children,
  align = "right",
  open: controlledOpen,
  onOpenChange,
  className = "",
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const triggerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  const close = useCallback(() => setOpen(false), [setOpen]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = contentRef.current?.offsetWidth || 192;
    const menuHeight = contentRef.current?.offsetHeight || 200;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Flip upward if there is not enough space below the row trigger
    const spaceBelow = viewportHeight - rect.bottom;
    const shouldFlipUp = spaceBelow < menuHeight + 12 && rect.top > menuHeight;

    const top = shouldFlipUp
      ? Math.max(8, rect.top - menuHeight - 6)
      : rect.bottom + 6;

    const isRight = align === "right" || align === "end";
    let left = isRight ? rect.right - menuWidth : rect.left;
    left = Math.max(8, Math.min(left, viewportWidth - menuWidth - 8));

    setCoords({ top, left });
  }, [align]);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, close, updatePosition]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!isOpen);
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={handleTriggerClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setOpen(!isOpen);
          }
        }}
      >
        {trigger}
      </div>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={contentRef}
            role="menu"
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 9999,
            }}
            className={`min-w-[12rem] rounded-md border border-slate-200 bg-white py-1 shadow-lg focus:outline-none dark:border-slate-700 dark:bg-slate-900 ${className}`}
            onClick={(e) => {
              // Prevent React synthetic event from bubbling through portal to parent <tr>
              e.stopPropagation();
            }}
          >
            {typeof children === "function" ? children({ close }) : children}
          </div>,
          document.body
        )}
    </div>
  );
}

export default Popover;
