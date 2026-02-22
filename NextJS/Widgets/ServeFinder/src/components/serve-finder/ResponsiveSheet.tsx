"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { BottomSheet } from "./BottomSheet";

// ============================================================================
// Types & Context
// ============================================================================

type SheetMode = "modal" | "sheet";

interface ResponsiveSheetContextValue {
  mode: SheetMode;
}

const ResponsiveSheetContext = createContext<ResponsiveSheetContextValue | null>(null);

export function useResponsiveSheet() {
  const context = useContext(ResponsiveSheetContext);
  if (!context) throw new Error("useResponsiveSheet must be used within a ResponsiveSheet");
  return context;
}

interface ResponsiveSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  header?: ReactNode;
  maxWidth?: string;
  modalBreakpoint?: number;
  panelClassName?: string;
  sheetMaxHeight?: string;
}

// ============================================================================
// ResponsiveSheet Component
// ============================================================================

export function ResponsiveSheet({
  open,
  onClose,
  children,
  header,
  maxWidth = "900px",
  modalBreakpoint = 768,
  panelClassName = "",
  sheetMaxHeight,
}: ResponsiveSheetProps) {
  const [mode, setMode] = useState<SheetMode>("sheet");
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Detect viewport mode
  useEffect(() => {
    const checkMode = () => {
      setMode(window.innerWidth >= modalBreakpoint ? "modal" : "sheet");
    };
    checkMode();
    window.addEventListener("resize", checkMode);
    return () => window.removeEventListener("resize", checkMode);
  }, [modalBreakpoint]);

  // Scroll indicator for modal
  const checkScrollIndicator = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const hasMore = container.scrollHeight > container.clientHeight + 5;
    const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 20;
    setShowScrollIndicator(hasMore && !atBottom);
  }, []);

  useEffect(() => {
    if (mode !== "modal" || !open) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    checkScrollIndicator();
    const t = setTimeout(checkScrollIndicator, 300);
    container.addEventListener("scroll", checkScrollIndicator);
    window.addEventListener("resize", checkScrollIndicator);
    return () => {
      clearTimeout(t);
      container.removeEventListener("scroll", checkScrollIndicator);
      window.removeEventListener("resize", checkScrollIndicator);
    };
  }, [mode, open, checkScrollIndicator]);

  // Escape key for modal
  useEffect(() => {
    if (mode !== "modal" || !open) return;
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEscape);
    // Body scroll lock
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      const storedY = document.body.style.top;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      if (storedY) window.scrollTo(0, parseInt(storedY, 10) * -1);
    };
  }, [mode, open, onClose]);

  const contextValue: ResponsiveSheetContextValue = { mode };

  // Sheet mode (mobile)
  if (mode === "sheet") {
    return (
      <ResponsiveSheetContext.Provider value={contextValue}>
        <BottomSheet
          open={open}
          onClose={onClose}
          className={panelClassName}
          header={header}
          maxHeight={sheetMaxHeight}
        >
          {children}
        </BottomSheet>
      </ResponsiveSheetContext.Provider>
    );
  }

  // Modal mode (desktop)
  return (
    <ResponsiveSheetContext.Provider value={contextValue}>
      <AnimatePresence>
        {open && (
          <div className="sf-modal-overlay">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="sf-modal-backdrop"
              onClick={onClose}
            />

            {/* Modal panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`sf-modal-panel ${panelClassName}`}
              style={{ maxWidth }}
            >
              {/* Close button */}
              <button className="sf-modal-close" onClick={onClose} aria-label="Close">
                <FontAwesomeIcon icon={faTimes} />
              </button>

              {/* Header */}
              {header && <div className="sf-modal-header">{header}</div>}

              {/* Scrollable content */}
              <div ref={scrollContainerRef} className="sf-modal-content">
                {children}
              </div>

              {/* Scroll indicator */}
              <AnimatePresence>
                {showScrollIndicator && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="sf-modal-scroll-indicator"
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ResponsiveSheetContext.Provider>
  );
}
