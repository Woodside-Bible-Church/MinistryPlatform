// ===================================================================
// Map Card Component
// ===================================================================
// Displays location map with directions link
// Shows campus address and map preview
// ===================================================================

'use client';

import { CardComponentProps, MapCardConfig } from '@/types/rsvp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, Navigation } from 'lucide-react';

export function MapCard({ card, confirmation }: CardComponentProps) {
  const config = card.Configuration as MapCardConfig;

  const address = confirmation.Campus_Address
    ? `${confirmation.Campus_Address}, ${confirmation.Campus_City}, ${confirmation.Campus_State} ${confirmation.Campus_Zip}`
    : confirmation.Campus_Location || '';

  const encodedAddress = encodeURIComponent(address);

  // Use static map for preview (Google Maps Static API or similar)
  // Uncomment when you have a Google Maps API key:
  // const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=15&size=600x300&markers=color:red%7C${encodedAddress}&key=YOUR_API_KEY`;

  const handleGetDirections = () => {
    // Use confirmation.Google_Maps_URL if available, otherwise construct one
    const directionsUrl = confirmation.Google_Maps_URL ||
      `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(directionsUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          {config.title}
        </CardTitle>
        {config.customInstructions && (
          <CardDescription>{config.customInstructions}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address */}
        <div className="rounded-lg border bg-muted/50 p-3">
          <p className="text-sm font-medium">{confirmation.Campus_Name || confirmation.Campus_Location}</p>
          {confirmation.Campus_Address && (
            <p className="mt-1 text-sm text-muted-foreground">
              {confirmation.Campus_Address}
              <br />
              {confirmation.Campus_City}, {confirmation.Campus_State} {confirmation.Campus_Zip}
            </p>
          )}
        </div>

        {/* Map Preview - fallback to colored block if no API key */}
        <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
          <div className="flex h-full items-center justify-center">
            <Map className="h-16 w-16 text-muted-foreground" />
          </div>
          {/* Uncomment when you have Google Maps API key:
          <img
            src={mapImageUrl}
            alt="Location map"
            className="h-full w-full object-cover"
          />
          */}
        </div>

        {/* Directions Button */}
        {config.showDirectionsLink && (
          <Button onClick={handleGetDirections} className="w-full">
            <Navigation className="mr-2 h-4 w-4" />
            Get Directions
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
