'use client';

import { EventAmenity } from '@/types/rsvp';
import { AmenityBadge } from './AmenityBadge';

interface AmenitiesLegendProps {
  amenities: EventAmenity[];
  backgroundColor?: string;
  textColor?: string;
}

/**
 * Displays a sticky legend of all available amenities
 * Shows unique amenities across all services with descriptions
 */
export function AmenitiesLegend({
  amenities,
  backgroundColor = '#1C2B39',
  textColor = '#FFFFFF',
}: AmenitiesLegendProps) {
  // Get unique amenities (deduplicate by Amenity_ID)
  const uniqueAmenities = Array.from(
    new Map(amenities.map(a => [a.Amenity_ID, a])).values()
  ).sort((a, b) => a.Display_Order - b.Display_Order);

  // Don't render if no amenities
  if (uniqueAmenities.length === 0) return null;

  return (
    <div
      className="sticky top-0 z-10 backdrop-blur-sm border-b py-3 px-4 mb-6"
      style={{
        backgroundColor: `${backgroundColor}CC`, // Add transparency
        borderBottomColor: `${textColor}33`,
      }}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <span
          className="text-sm font-semibold whitespace-nowrap"
          style={{ color: `${textColor}BF` }} // 75% opacity
        >
          Available at select services:
        </span>

        {uniqueAmenities.map(amenity => (
          <div
            key={amenity.Amenity_ID}
            className="flex items-center gap-2"
          >
            <AmenityBadge amenity={amenity} size="sm" showTooltip={false} />
            <span
              className="text-sm hidden sm:inline"
              style={{ color: `${textColor}E6` }} // 90% opacity
            >
              {amenity.Amenity_Name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
