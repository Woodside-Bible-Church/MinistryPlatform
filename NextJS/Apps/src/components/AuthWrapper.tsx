import { auth } from '@/auth';
import { SessionProvider } from '@/components/SessionProvider';

export default async function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Allow access without session - components can check session status themselves
  // This enables public access to pages while still providing session context when available
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}