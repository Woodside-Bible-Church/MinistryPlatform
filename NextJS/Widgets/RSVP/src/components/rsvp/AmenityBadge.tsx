'use client';

import * as LucideIcons from 'lucide-react';
import { EventAmenity } from '@/types/rsvp';
import { useState } from 'react';

interface AmenityBadgeProps {
  amenity: EventAmenity;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  themeColor?: string; // Override icon color with theme color
}

/**
 * Displays a single amenity badge with icon and tooltip
 * Icons come from Lucide React based on Icon_Name field
 * Colors from MinistryPlatform's dp_Color field (hex codes)
 */
export function AmenityBadge({ amenity, size = 'md', showTooltip = true, themeColor }: AmenityBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Get the icon component dynamically from Lucide
  const IconComponent = LucideIcons[amenity.Icon_Name as keyof typeof LucideIcons] as React.ComponentType<{ className?: string; style?: React.CSSProperties }> | undefined;

  // Size classes
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Use theme color if provided, otherwise use custom icon color, fallback to white
  const badgeColor = themeColor || amenity.Icon_Color || '#FFFFFF';

  return (
    <div
      className="group relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon Badge */}
      <div
        className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-transform hover:scale-110`}
        style={{
          borderColor: badgeColor,
          borderWidth: '2px'
        }}
        title={showTooltip ? (amenity.Amenity_Description || amenity.Amenity_Name) : undefined}
      >
        {amenity.Icon_URL ? (
          // Custom SVG from dp_Files (icon.svg)
          <img
            src={amenity.Icon_URL}
            alt={amenity.Amenity_Name}
            className={iconSizeClasses[size]}
            style={{ color: badgeColor }}
          />
        ) : IconComponent ? (
          // Fallback to Lucide icon
          <IconComponent
            className={iconSizeClasses[size]}
            style={{ color: badgeColor }}
          />
        ) : (
          // Final fallback if no icon found
          <span className={`text-xs font-bold`} style={{ color: badgeColor }}>
            {amenity.Amenity_Name.charAt(0)}
          </span>
        )}
      </div>

      {/* Tooltip - Desktop only, positioned to stay within viewport */}
      {showTooltip && isHovered && (
        <div className="hidden md:block absolute bottom-full mb-2 right-0 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg pointer-events-none w-64 z-50">
          <div className="whitespace-normal text-left break-words">
            {amenity.Amenity_Description || amenity.Amenity_Name}
          </div>
          {/* Arrow pointing up from tooltip to badge */}
          <div
            className="absolute top-full right-3 border-4 border-transparent border-t-gray-900"
            style={{ marginTop: '-1px' }}
          ></div>
        </div>
      )}
    </div>
  );
}
