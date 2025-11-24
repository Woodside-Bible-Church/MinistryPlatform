"use client";

import { ChevronDownIcon, MapPin } from "lucide-react";
import { useState, useEffect } from "react";

interface Campus {
  id: number;
  name: string;
  congregationId: number;
  svgUrl: string | null;
}

interface CampusSelectorProps {
  campuses: Campus[];
  selectedId: number;
  onSelect: (id: number) => void;
  backgroundColor: string;
  textColor: string;
  loadedImages: Set<number>;
  onImageLoad: (id: number) => void;
}

export default function CampusSelector({
  campuses,
  selectedId,
  onSelect,
  backgroundColor,
  textColor,
  loadedImages,
  onImageLoad,
}: CampusSelectorProps) {
  const [isMobile, setIsMobile] = useState(false);
  const selectedCampus = campuses.find(c => c.id === selectedId);

  useEffect(() => {
    // Detect mobile on mount and resize
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="relative w-full md:max-w-md">
      {/* Styled trigger button */}
      <div
        className="relative w-full h-12 border-2 rounded-md transition-colors text-base font-semibold shadow-md flex items-center justify-between px-3 cursor-pointer"
        style={{
          backgroundColor,
          borderColor: backgroundColor,
          color: textColor,
        }}
      >
        {/* Selected campus display */}
        <div className="flex items-center gap-3 pointer-events-none">
          {selectedCampus?.svgUrl ? (
            <div className="relative w-6 h-6">
              {!loadedImages.has(selectedCampus.id) && (
                <div className="absolute inset-0 bg-gray-300 animate-pulse rounded" />
              )}
              <img
                src={selectedCampus.svgUrl}
                alt={`${selectedCampus.name} Campus`}
                className={`w-6 h-6 ${!loadedImages.has(selectedCampus.id) ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => onImageLoad(selectedCampus.id)}
              />
            </div>
          ) : (
            <MapPin className="w-5 h-5" style={{ color: textColor }} />
          )}
          <span>{selectedCampus?.name || "Select Campus"}</span>
        </div>

        {/* Chevron icon */}
        <ChevronDownIcon
          className="w-5 h-5 transition-transform pointer-events-none"
          style={{ color: textColor }}
        />
      </div>

      {/* Native select overlay - invisible but functional */}
      <select
        value={selectedId}
        onChange={(e) => onSelect(parseInt(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        style={{
          // Critical for iOS: make select actually work
          appearance: isMobile ? 'menulist' : 'none',
        }}
      >
        {campuses.map((campus) => (
          <option key={campus.id} value={campus.id}>
            {campus.name}
          </option>
        ))}
      </select>
    </div>
  );
}
