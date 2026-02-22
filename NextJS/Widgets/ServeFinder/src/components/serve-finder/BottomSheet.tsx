"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  header?: ReactNode;
  className?: string;
  closeThreshold?: number;
  velocityThreshold?: number;
  maxHeight?: string;
}

export function BottomSheet({
  open,
  onClose,
  children,
  header,
  className = "",
  closeThreshold = 100,
  velocityThreshold = 0.5,
  maxHeight = "90dvh",
}: BottomSheetProps) {
  const dragAreaRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const checkScrollIndicator = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const hasMore = container.scrollHeight > container.clientHeight + 5;
    const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 20;
    setShowIndicator(hasMore && !atBottom);
  }, []);

  useEffect(() => {
    if (!open) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    checkScrollIndicator();
    const t1 = setTimeout(checkScrollIndicator, 100);
    const t2 = setTimeout(checkScrollIndicator, 300);
    container.addEventListener("scroll", checkScrollIndicator);
    return () => {
      clearTimeout(t1); clearTimeout(t2);
      container.removeEventListener("scroll", checkScrollIndicator);
    };
  }, [open, checkScrollIndicator]);

  useEffect(() => {
    if (!open) { setDragOffset(0); setIsDragging(false); }
  }, [open]);

  // Escape key + body scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      const scrollY = window.scrollY;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
    } else {
      const scrollY = document.body.style.top;
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      if (scrollY) window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      const scrollY = document.body.style.top;
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      if (scrollY) window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
    };
  }, [open, onClose]);

  // Drag-to-close touch handlers
  useEffect(() => {
    const dragArea = dragAreaRef.current;
    if (!dragArea || !open) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
      setIsDragging(true);
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (touchStartY.current === null) return;
      const deltaY = e.touches[0].clientY - touchStartY.current;
      setDragOffset(Math.max(0, deltaY));
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current === null || touchStartTime.current === null) {
        setIsDragging(false);
        return;
      }
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      const deltaTime = Date.now() - touchStartTime.current;
      const velocity = deltaTime > 0 ? deltaY / deltaTime : 0;
      if (deltaY > closeThreshold || velocity > velocityThreshold) {
        onClose();
      } else {
        setDragOffset(0);
      }
      touchStartY.current = null;
      touchStartTime.current = null;
      setIsDragging(false);
    };

    dragArea.addEventListener("touchstart", handleTouchStart, { passive: true });
    dragArea.addEventListener("touchmove", handleTouchMove, { passive: false });
    dragArea.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      dragArea.removeEventListener("touchstart", handleTouchStart);
      dragArea.removeEventListener("touchmove", handleTouchMove);
      dragArea.removeEventListener("touchend", handleTouchEnd);
    };
  }, [open, onClose, closeThreshold, velocityThreshold]);

  const panelTransform = open ? `translateY(${dragOffset}px)` : "translateY(100%)";

  if (!mounted) return null;

  return createPortal(
    <div
      className="sf-sheet-overlay"
      data-open={open || undefined}
    >
      {/* Backdrop */}
      <div className="sf-sheet-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div
        className={`sf-sheet-panel ${isDragging ? "no-transition" : ""} ${className}`}
        style={{ transform: panelTransform, maxHeight }}
      >
        {/* Drag area */}
        <div ref={dragAreaRef} className="sf-sheet-drag-area">
          <div className="sf-sheet-handle">
            <div className="sf-sheet-handle-bar" />
          </div>
          {header}
        </div>

        {/* Scrollable content */}
        <div ref={scrollContainerRef} className="sf-sheet-content">
          {children}
        </div>

        {/* Scroll indicator */}
        <AnimatePresence>
          {showIndicator && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="sf-sheet-scroll-indicator"
            >
              <span>Scroll for more</span>
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <FontAwesomeIcon icon={faChevronDown} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>,
    document.body
  );
}
