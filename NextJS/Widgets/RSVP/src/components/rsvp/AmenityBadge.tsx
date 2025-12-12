'use client';

import * as LucideIcons from 'lucide-react';
import { EventAmenity } from '@/types/rsvp';
import { useState } from 'react';

interface AmenityBadgeProps {
  amenity: EventAmenity;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

/**
 * Displays a single amenity badge with icon and tooltip
 * Icons come from Lucide React based on Icon_Name field
 * Colors from MinistryPlatform's dp_Color field (hex codes)
 */
export function AmenityBadge({ amenity, size = 'md', showTooltip = true }: AmenityBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Get the icon component dynamically from Lucide
  const IconComponent = LucideIcons[amenity.Icon_Name as keyof typeof LucideIcons] as React.ComponentType<{ className?: string; style?: React.CSSProperties }> | undefined;

  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Fallback color if none provided
  const badgeColor = amenity.Icon_Color || '#FFFFFF';

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
        {IconComponent ? (
          <IconComponent
            className={iconSizeClasses[size]}
            style={{ color: badgeColor }}
          />
        ) : (
          // Fallback if icon not found
          <span className={`text-xs font-bold`} style={{ color: badgeColor }}>
            {amenity.Amenity_Name.charAt(0)}
          </span>
        )}
      </div>

      {/* Tooltip - Desktop only */}
      {showTooltip && isHovered && (
        <div className="hidden md:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10 shadow-lg pointer-events-none">
          {amenity.Amenity_Description || amenity.Amenity_Name}
          {/* Arrow */}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"
            style={{ marginTop: '-1px' }}
          ></div>
        </div>
      )}
    </div>
  );
}
