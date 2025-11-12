// ===================================================================
// Share Card Component
// ===================================================================
// Share event with friends via SMS, email, or social media
// Used in Christmas example to invite friends
// ===================================================================

'use client';

import { CardComponentProps, ShareCardConfig } from '@/types/rsvp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Mail, MessageSquare, Facebook } from 'lucide-react';

export function ShareCard({ card, confirmation }: CardComponentProps) {
  const config = card.Configuration as ShareCardConfig;

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareText = config.customMessage ||
    `Join me at ${confirmation.Event_Title} on ${new Date(confirmation.Event_Start_Date).toLocaleDateString()}!`;

  const handleShare = (method: string) => {
    switch (method) {
      case 'sms':
        window.open(`sms:?body=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        break;
      case 'email':
        window.open(
          `mailto:?subject=${encodeURIComponent(confirmation.Event_Title)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`,
          '_blank'
        );
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
    }
  };

  const shareIcons: Record<string, React.ReactNode> = {
    sms: <MessageSquare className="h-4 w-4" />,
    email: <Mail className="h-4 w-4" />,
    facebook: <Facebook className="h-4 w-4" />,
    twitter: <Share2 className="h-4 w-4" />,
  };

  const shareLabels: Record<string, string> = {
    sms: 'Text',
    email: 'Email',
    facebook: 'Facebook',
    twitter: 'Twitter',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          {config.title}
        </CardTitle>
        {config.description && (
          <CardDescription>{config.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {config.enabledMethods.map((method) => (
            <Button
              key={method}
              variant="outline"
              size="sm"
              onClick={() => handleShare(method)}
              className="flex-1 min-w-[100px]"
            >
              {shareIcons[method]}
              <span className="ml-2">{shareLabels[method]}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
