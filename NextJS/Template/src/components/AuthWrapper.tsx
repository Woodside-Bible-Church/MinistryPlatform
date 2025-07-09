import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { SessionProvider } from '@/components/SessionProvider';

export default async function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  console.log('AuthWrapper session: ', session);

  if (!session) {
    redirect('/api/auth/signin');
  }

  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}