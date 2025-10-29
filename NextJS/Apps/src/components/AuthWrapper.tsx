import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { SessionProvider } from '@/components/SessionProvider';

export default async function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/signin');
  }

  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}