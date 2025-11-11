"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface OptionGroup {
  label: string;
  options: Option[];
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: Option[];
  groupedOptions?: OptionGroup[];
  placeholder?: string;
  className?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options = [],
  groupedOptions = [],
  placeholder = "Select an option",
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten grouped options into a single array for searching
  const allOptions = groupedOptions.length > 0
    ? groupedOptions.flatMap(group => group.options)
    : options;

  // Filter options based on search term
  const filteredOptions = allOptions.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter grouped options based on search term
  const filteredGroupedOptions = groupedOptions.length > 0
    ? groupedOptions
        .map(group => ({
          ...group,
          options: group.options.filter((option) =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }))
        .filter(group => group.options.length > 0)
    : [];

  // Get selected option label
  const selectedOption = allOptions.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] flex items-center justify-between gap-2 cursor-pointer ${className}`}
      >
        <span className={`flex-1 text-left ${selectedOption ? "text-foreground" : "text-muted-foreground"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {selectedOption && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-accent rounded transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-[300px] flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                No results found
              </div>
            ) : groupedOptions.length > 0 ? (
              // Render grouped options
              filteredGroupedOptions.map((group) => (
                <div key={group.label}>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase bg-muted/50 sticky top-0">
                    {group.label}
                  </div>
                  {group.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center justify-between ${
                        option.value === value ? "bg-accent" : ""
                      }`}
                    >
                      <span>{option.label}</span>
                      {option.value === value && (
                        <Check className="w-4 h-4 text-[#61BC47]" />
                      )}
                    </button>
                  ))}
                </div>
              ))
            ) : (
              // Render flat options
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center justify-between ${
                    option.value === value ? "bg-accent" : ""
                  }`}
                >
                  <span>{option.label}</span>
                  {option.value === value && (
                    <Check className="w-4 h-4 text-[#61BC47]" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
