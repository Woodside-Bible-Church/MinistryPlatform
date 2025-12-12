import { auth } from "@/auth";

/**
 * Get the currently authenticated user's User_ID from the session
 * This should be used in API routes to pass to MinistryPlatform's $userID parameter for auditing
 *
 * @returns User_ID as a number, or null if not authenticated
 */
export async function getUserIdFromSession(): Promise<number | null> {
  const session = await auth();

  console.error('=== getUserIdFromSession Debug ===');
  console.error('Session exists:', !!session);
  console.error('Session object keys:', session ? Object.keys(session) : 'no session');
  console.error('Session user.id (User_GUID):', session?.user?.id);
  console.error('Session userId (User_ID):', session?.userId);
  console.error('Session sub (User_GUID):', session?.sub);
  console.error('Full session:', JSON.stringify(session, null, 2));

  if (!session?.userId) {
    console.error('No userId found in session - userId is:', session?.userId);
    return null;
  }

  // session.userId is stored as a string, convert to number
  const userId = parseInt(session.userId, 10);

  if (isNaN(userId)) {
    console.error('Invalid userId in session:', session.userId);
    return null;
  }

  console.error('Returning User_ID:', userId);
  return userId;
}
