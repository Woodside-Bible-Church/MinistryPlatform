import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { searchContacts } from '@/services/peopleSearchService';
import type { GlobalSearchResult } from '@/types/globalSearch';

export async function GET(request: NextRequest) {
  try {
    // Get the search query from URL params
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    if (!query || query.trim().length < 2) {
      return NextResponse.json<GlobalSearchResult[]>([]);
    }

    // Get authenticated session
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Search contacts using existing service
    const contacts = await searchContacts(
      session.accessToken,
      query,
      limit,  // limit
      0       // skip
    );

    // Transform to global search result format
    const results: GlobalSearchResult[] = contacts.map(contact => {
      const firstName = contact.Nickname || contact.First_Name || '';
      const displayName = `${firstName} ${contact.Last_Name}`.trim();

      // Build the route with query and contactId
      const route = `/people-search?q=${encodeURIComponent(query)}&contactId=${contact.Contact_ID}`;

      // Build image URL if available
      let image_url: string | undefined;
      if (contact.Image_GUID) {
        if (contact.Image_GUID.startsWith('http')) {
          image_url = contact.Image_GUID;
        } else {
          image_url = `${process.env.NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL}/${contact.Image_GUID}?$thumbnail=true`;
        }
      }

      // Build metadata
      let metadata: string | undefined;
      if (contact.__Age) {
        metadata = `Age: ${contact.__Age}`;
      }

      return {
        result_id: contact.Contact_ID,
        title: displayName,
        subtitle: contact.Email_Address || undefined,
        metadata,
        image_url,
        route,
        app_key: 'people-search',
      };
    });

    return NextResponse.json<GlobalSearchResult[]>(results);
  } catch (error) {
    console.error('People search global search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
