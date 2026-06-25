'use client';

import { useEffect, useState } from 'react';

export interface CampusOption {
  id: number;
  name: string;
  shortName?: string | null;
  svgUrl?: string | null;
}

interface CampusSelectorProps {
  campuses: CampusOption[];
  /** Currently selected campus id, or null for "All Campuses" (church-wide). */
  selectedId: number | null;
  /** Called with the new campus id, or null when "All Campuses" is chosen. */
  onSelect: (id: number | null) => void;
  /** Label for the church-wide / no-campus option. */
  allLabel?: string;
  /** Disable interaction (e.g. while announcements are re-fetching). */
  disabled?: boolean;
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

const ALL_VALUE = '__all__';

/**
 * Inline campus picker for the announcements grid. It renders no type styles of
 * its own — it inherits font size/weight/color from its parent (the campus
 * section heading), so it reads as the heading itself with a subtle chevron.
 * A styled label sits over an invisible native <select> (the native control is
 * required for a reliable iOS picker). Selection is local to the widget — it
 * never writes the site-wide selected-location cookie.
 */
export default function CampusSelector({
  campuses,
  selectedId,
  onSelect,
  allLabel = 'All Campuses',
  disabled = false,
}: CampusSelectorProps) {
  const [isMobile, setIsMobile] = useState(false);
  const selectedCampus = campuses.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <span
      className={`group relative inline-flex items-center gap-[0.3em] align-middle ${
        disabled ? 'opacity-60' : 'cursor-pointer'
      }`}
    >
      {selectedCampus?.svgUrl && (
        <img
          src={selectedCampus.svgUrl}
          alt=""
          className="h-[0.9em] w-[0.9em] flex-shrink-0 object-contain"
        />
      )}
      <span>{selectedCampus?.name ?? allLabel}</span>
      <ChevronDownIcon className="h-[0.6em] w-[0.6em] flex-shrink-0 opacity-40 transition-opacity group-hover:opacity-80" />

      {/* Invisible native select overlay */}
      <select
        aria-label="Select campus"
        disabled={disabled}
        value={selectedId == null ? ALL_VALUE : String(selectedId)}
        onChange={(e) => {
          const v = e.target.value;
          onSelect(v === ALL_VALUE ? null : parseInt(v, 10));
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 [&>option]:bg-white [&>option]:text-black"
        style={{
          // Native menu on iOS; suppressed chrome on desktop.
          appearance: isMobile ? 'menulist' : 'none',
          color: '#000000',
          backgroundColor: '#ffffff',
          // Reset the inherited heading type inside the native control so the
          // OS picker/options render at a normal size.
          fontSize: '16px',
          fontWeight: 400,
          letterSpacing: 'normal',
          textTransform: 'none',
        }}
      >
        <option value={ALL_VALUE}>{allLabel}</option>
        {campuses.map((campus) => (
          <option key={campus.id} value={campus.id}>
            {campus.name}
          </option>
        ))}
      </select>
    </span>
  );
}
