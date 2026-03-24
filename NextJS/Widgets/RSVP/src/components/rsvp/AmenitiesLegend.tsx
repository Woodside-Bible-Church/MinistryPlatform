'use client';

import { EventAmenity } from '@/types/rsvp';
import { AmenityBadge } from './AmenityBadge';

interface AmenitiesLegendProps {
  amenities: EventAmenity[];
  legendDetails?: Map<number, string | null>;
  textColor?: string;
}

/**
 * Displays a legend of all available amenities
 * Shows unique amenities across all services with descriptions
 */
export function AmenitiesLegend({
  amenities,
  legendDetails,
  textColor = '#FFFFFF',
}: AmenitiesLegendProps) {
  // Get unique amenities (deduplicate by Amenity_ID)
  const uniqueAmenities = Array.from(
    new Map(amenities.map(a => [a.Amenity_ID, a])).values()
  ).sort((a, b) => a.Display_Order - b.Display_Order);

  // Don't render if no amenities
  if (uniqueAmenities.length === 0) return null;

  return (
    <div className="mb-6 pb-4" style={{ borderBottom: `1px solid ${textColor}33` }}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {uniqueAmenities.map(amenity => (
          <div
            key={amenity.Amenity_ID}
            className="flex items-center gap-2"
          >
            <AmenityBadge amenity={amenity} size="sm" showTooltip={false} themeColor={textColor} />
            <span
              className="text-sm font-medium"
              style={{ color: `${textColor}` }}
            >
              {amenity.Amenity_Name}
              {legendDetails?.get(amenity.Amenity_ID) && (
                <span style={{ color: `${textColor}99` }}> ({legendDetails.get(amenity.Amenity_ID)})</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
