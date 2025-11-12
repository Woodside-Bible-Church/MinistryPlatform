// ===================================================================
// QR Code Card Component
// ===================================================================
// Displays QR code for check-in with confirmation number
// Used in Christmas example for faster check-in
// ===================================================================

'use client';

import { CardComponentProps, QRCodeCardConfig } from '@/types/rsvp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';

export function QRCodeCard({ card, confirmation }: CardComponentProps) {
  const config = card.Configuration as QRCodeCardConfig;
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    // Generate QR code data
    const qrData = config.includeConfirmationNumber
      ? confirmation.Confirmation_Code
      : `${confirmation.Event_RSVP_ID}`;

    // Use a QR code API to generate the image
    // Using quickchart.io as a free QR code API
    const url = `https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=200`;
    setQrCodeUrl(url);
  }, [config.includeConfirmationNumber, confirmation]);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5" />
          {config.title}
        </CardTitle>
        {config.description && (
          <CardDescription>{config.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {qrCodeUrl ? (
          <div className="rounded-lg border bg-white p-4">
            <img
              src={qrCodeUrl}
              alt="Check-in QR Code"
              className="h-48 w-48"
            />
          </div>
        ) : (
          <div className="flex h-48 w-48 items-center justify-center rounded-lg border bg-muted">
            <QrCode className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {config.includeConfirmationNumber && (
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Confirmation Code</p>
            <p className="text-2xl font-bold tracking-wider">{confirmation.Confirmation_Code}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
