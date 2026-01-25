import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cancellations and Updates | Woodside Bible Church',
  description: 'Check the status of Woodside Bible Church campuses during inclement weather or other situations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
