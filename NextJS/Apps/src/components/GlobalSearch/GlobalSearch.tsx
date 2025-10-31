'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, ChevronRight, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GlobalSearchResponse, AppNameMatch, AppContentResults } from '@/types/globalSearch';

interface GlobalSearchProps {
  isMobile?: boolean;
}

export default function GlobalSearch({ isMobile = false }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResponse>({ apps: [], content_results: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ apps: [], content_results: [] });
      setIsLoading(false);
      setShowDropdown(false);
      return;
    }

    // Show dropdown and loading state immediately
    setShowDropdown(true);
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/global-search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data: GlobalSearchResponse = await response.json();
          setResults(data);
        }
      } catch (error) {
        console.error('Global search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Get icon component
  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || Search;
  };

  // Handle result click
  const handleResultClick = (route: string) => {
    router.push(route);
    setIsOpen(false);
    setShowDropdown(false);
    setQuery('');
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Mobile: Search icon that opens modal
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-foreground dark:text-[oklch(0.8_0_0)] hover:text-primary active:text-primary transition-colors pointer-events-auto"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Mobile Search Modal */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              />

              {/* Search Modal */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-4 left-4 right-4 z-[70] bg-card border border-border rounded-lg shadow-2xl overflow-hidden"
              >
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onDoubleClick={(e) => e.currentTarget.select()}
                    placeholder="Search apps and content..."
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
                    autoFocus
                  />
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  <button
                    onClick={() => {
                      setQuery('');
                      setIsOpen(false);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear and close search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Results */}
                {showDropdown && (
                  <div className="max-h-[70vh] overflow-y-auto">
                    {isLoading ? (
                      <div className="p-8 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Searching...</p>
                      </div>
                    ) : results.apps.length === 0 && results.content_results.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No results found
                      </div>
                    ) : (
                      <>
                        {/* App Name Matches */}
                        {results.apps.length > 0 && (
                          <div className="p-2">
                            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">Apps</p>
                            {results.apps.map((app) => {
                              const Icon = getIcon(app.Icon);
                              return (
                                <button
                                  key={app.Application_ID}
                                  onClick={() => handleResultClick(app.Route)}
                                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors text-left"
                                >
                                  <div className="w-10 h-10 bg-primary dark:bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-5 h-5 text-white" />
                                  </div>
                                  <span className="font-semibold text-foreground">{app.Application_Name}</span>
                                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Content Results */}
                        {results.content_results.map((appResults) => {
                          const Icon = getIcon(appResults.app.Icon);
                          return (
                            <div key={appResults.app.Application_ID} className="p-2 border-t border-border">
                              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                                {appResults.app.Application_Name}
                              </p>
                              {appResults.results.map((result) => (
                                <button
                                  key={result.result_id}
                                  onClick={() => handleResultClick(result.route)}
                                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors text-left"
                                >
                                  {result.image_url ? (
                                    <img
                                      src={result.image_url}
                                      alt={result.title}
                                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                      <Icon className="w-5 h-5 text-primary" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-foreground truncate">{result.title}</p>
                                    {result.subtitle && (
                                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                    )}
                                    {result.metadata && (
                                      <p className="text-xs text-muted-foreground">{result.metadata}</p>
                                    )}
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                </button>
                              ))}
                              {/* See More Results Button */}
                              {appResults.has_more && (
                                <button
                                  onClick={() => handleResultClick(`${appResults.app.Route}?q=${encodeURIComponent(query)}`)}
                                  className="w-full mt-2 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-colors text-left flex items-center justify-center gap-2 group"
                                >
                                  <span className="text-sm font-semibold text-primary">See More Results</span>
                                  <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop: Full search input with dropdown
  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onDoubleClick={(e) => e.currentTarget.select()}
          placeholder="Search apps and content..."
          className="w-full pl-10 pr-10 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all pointer-events-auto"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
        {query && !isLoading && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              setShowDropdown(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors pointer-events-auto"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {isOpen && showDropdown && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              className="fixed inset-0 z-[55]"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 left-0 right-0 bg-card border border-border rounded-lg shadow-2xl z-[60] overflow-hidden"
            >
              <div className="max-h-[70vh] overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Searching...</p>
                  </div>
                ) : results.apps.length === 0 && results.content_results.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No results found
                  </div>
                ) : (
                  <>
                    {/* App Name Matches */}
                    {results.apps.length > 0 && (
                      <div className="p-2">
                        <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">Apps</p>
                        {results.apps.map((app) => {
                          const Icon = getIcon(app.Icon);
                          return (
                            <button
                              key={app.Application_ID}
                              onClick={() => handleResultClick(app.Route)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors text-left"
                            >
                              <div className="w-10 h-10 bg-primary dark:bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <span className="font-semibold text-foreground">{app.Application_Name}</span>
                              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Content Results */}
                    {results.content_results.map((appResults) => {
                      const Icon = getIcon(appResults.app.Icon);
                      return (
                        <div key={appResults.app.Application_ID} className="p-2 border-t border-border">
                          <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                            {appResults.app.Application_Name}
                          </p>
                          {appResults.results.map((result) => (
                            <button
                              key={result.result_id}
                              onClick={() => handleResultClick(result.route)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors text-left"
                            >
                              {result.image_url ? (
                                <img
                                  src={result.image_url}
                                  alt={result.title}
                                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Icon className="w-5 h-5 text-primary" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground truncate">{result.title}</p>
                                {result.subtitle && (
                                  <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                )}
                                {result.metadata && (
                                  <p className="text-xs text-muted-foreground">{result.metadata}</p>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </button>
                          ))}
                          {/* See More Results Button */}
                          {appResults.has_more && (
                            <button
                              onClick={() => handleResultClick(`${appResults.app.Route}?q=${encodeURIComponent(query)}`)}
                              className="w-full mt-2 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-colors text-left flex items-center justify-center gap-2 group"
                            >
                              <span className="text-sm font-semibold text-primary">See More Results</span>
                              <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
