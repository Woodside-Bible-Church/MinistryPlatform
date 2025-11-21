"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronDown, Check, Loader2, X } from "lucide-react";

type Template = {
  Template_ID: number;
  Template_Name: string;
};

type TemplateSelectorProps = {
  value: number | null;
  onChange: (templateId: number | null) => void;
  type?: "email" | "communication" | "both";
  placeholder?: string;
  label?: string;
  disabled?: boolean;
};

export function TemplateSelector({
  value,
  onChange,
  type = "both",
  placeholder = "Select a template...",
  label,
  disabled = false,
}: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find selected template
  const selectedTemplate = templates.find(t => t.Template_ID === value);

  // Load templates
  const loadTemplates = useCallback(async (pageNum: number, searchQuery: string, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: "20",
        type,
      });

      if (searchQuery) {
        params.set("search", searchQuery);
      }

      const response = await fetch(`/api/rsvp/templates?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch templates");

      const data = await response.json();

      if (append) {
        setTemplates(prev => [...prev, ...data.templates]);
      } else {
        setTemplates(data.templates);
      }

      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [type]);

  // Initial load and search handling
  useEffect(() => {
    if (!isOpen) return;

    // Reset state
    setPage(1);
    setTemplates([]);

    // If there's a search term, debounce it
    if (search) {
      const timer = setTimeout(() => {
        loadTemplates(1, search, false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // No search, load immediately
      loadTemplates(1, "", false);
    }
  }, [isOpen, search, loadTemplates]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!listRef.current || isLoadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const threshold = scrollHeight - clientHeight - 50;

    if (scrollTop >= threshold) {
      const nextPage = page + 1;
      console.log(`[TemplateSelector] Infinite scroll triggered: page ${page} -> ${nextPage}, search="${search}", hasMore=${hasMore}`);
      setPage(nextPage);
      loadTemplates(nextPage, search, true);
    }
  }, [page, search, isLoadingMore, hasMore, loadTemplates]);

  // Attach scroll listener
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    list.addEventListener("scroll", handleScroll);
    return () => list.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-left flex items-center justify-between hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className={selectedTemplate ? "text-foreground" : "text-muted-foreground"}>
            {selectedTemplate ? selectedTemplate.Template_Name : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Clear Button - Only show when a template is selected */}
        {value !== null && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded transition-colors"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-md shadow-lg max-h-[400px] flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-9 pr-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#61bc47] focus:border-transparent"
              />
            </div>
          </div>

          {/* Template List */}
          <div ref={listRef} className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                No templates found
              </div>
            ) : (
              <>
                {/* Template Options */}
                {templates.map((template) => (
                  <button
                    key={template.Template_ID}
                    type="button"
                    onClick={() => {
                      onChange(template.Template_ID);
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {template.Template_Name}
                      </div>
                    </div>
                    {value === template.Template_ID && (
                      <Check className="w-4 h-4 text-[#61bc47] flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))}

                {/* Loading More Indicator */}
                {isLoadingMore && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                  </div>
                )}

                {/* End of List Message */}
                {!hasMore && templates.length > 0 && (
                  <div className="px-3 py-3 text-center text-xs text-muted-foreground border-t border-border">
                    All templates loaded
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
