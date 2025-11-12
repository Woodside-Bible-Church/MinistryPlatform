// ===================================================================
// Add to Calendar Card Component
// ===================================================================
// Add event to calendar (Google, Apple, Outlook, ICS)
// Used in Christmas example to save the date
// ===================================================================

'use client';

import { CardComponentProps, AddToCalendarCardConfig } from '@/types/rsvp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Download } from 'lucide-react';

export function AddToCalendarCard({ card, confirmation }: CardComponentProps) {
  const config = card.Configuration as AddToCalendarCardConfig;

  // Format dates for calendar links
  const formatDateForCalendar = (date: string) => {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = formatDateForCalendar(confirmation.Event_Start_Date);
  const endDate = formatDateForCalendar(confirmation.Event_End_Date);
  const title = encodeURIComponent(confirmation.Event_Title);
  const location = confirmation.Campus_Address
    ? encodeURIComponent(`${confirmation.Campus_Address}, ${confirmation.Campus_City}, ${confirmation.Campus_State} ${confirmation.Campus_Zip}`)
    : '';

  const handleAddToCalendar = (provider: string) => {
    let url = '';

    switch (provider) {
      case 'google':
        url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&location=${location}`;
        break;
      case 'outlook':
        url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${confirmation.Event_Start_Date}&enddt=${confirmation.Event_End_Date}&location=${location}`;
        break;
      case 'apple':
      case 'ics':
        // Generate ICS file
        const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${confirmation.Event_Title}
LOCATION:${confirmation.Campus_Address || ''}
DESCRIPTION:RSVP Confirmation: ${confirmation.Confirmation_Code}
END:VEVENT
END:VCALENDAR`;
        const blob = new Blob([ics], { type: 'text/calendar' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${confirmation.Event_Title}.ics`;
        link.click();
        return;
    }

    if (url) {
      window.open(url, '_blank');
    }
  };

  const calendarIcons: Record<string, React.ReactNode> = {
    google: <Calendar className="h-4 w-4" />,
    apple: <Calendar className="h-4 w-4" />,
    outlook: <Calendar className="h-4 w-4" />,
    ics: <Download className="h-4 w-4" />,
  };

  const calendarLabels: Record<string, string> = {
    google: 'Google',
    apple: 'Apple',
    outlook: 'Outlook',
    ics: 'Download ICS',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {config.title}
        </CardTitle>
        {config.description && (
          <CardDescription>{config.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {config.providers.map((provider) => (
            <Button
              key={provider}
              variant="outline"
              size="sm"
              onClick={() => handleAddToCalendar(provider)}
            >
              {calendarIcons[provider]}
              <span className="ml-2">{calendarLabels[provider]}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
