import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import type {
  GlobalSearchResponse,
  SearchableApp,
  AppNameMatch,
  AppContentResults,
  GlobalSearchResult
} from '@/types/globalSearch';

export async function GET(request: NextRequest) {
  try {
    // Get the search query from URL params
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json<GlobalSearchResponse>({
        apps: [],
        content_results: []
      });
    }

    // Get authenticated session
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;
    if (!baseUrl) {
      throw new Error('MINISTRY_PLATFORM_BASE_URL is not configured');
    }

    // Fetch all applications the user has access to
    const applicationsResponse = await fetch(
      `${baseUrl}/tables/Applications?$select=Application_ID,Application_Name,Application_Key,Icon,Route,Searchable,Search_Endpoint&$orderby=Sort_Order`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!applicationsResponse.ok) {
      console.error('MP API Error:', applicationsResponse.status, applicationsResponse.statusText);
      throw new Error(`Failed to fetch applications: ${applicationsResponse.statusText}`);
    }

    const applications: SearchableApp[] = await applicationsResponse.json();
    const queryLower = query.toLowerCase().trim();

    // 1. Find apps that match by name
    const appMatches: AppNameMatch[] = applications
      .filter(app =>
        app.Application_Name.toLowerCase().includes(queryLower) ||
        app.Application_Key.toLowerCase().includes(queryLower)
      )
      .map(app => ({
        Application_ID: app.Application_ID,
        Application_Name: app.Application_Name,
        Application_Key: app.Application_Key,
        Icon: app.Icon,
        Route: app.Route,
        match_type: 'name' as const,
      }));

    // 2. Search content in searchable apps
    const searchableApps = applications.filter(
      app => app.Searchable && app.Search_Endpoint
    );

    console.log('Searchable apps:', searchableApps.map(a => ({ name: a.Application_Name, endpoint: a.Search_Endpoint, searchable: a.Searchable })));

    const contentSearchPromises = searchableApps.map(async (app) => {
      try {
        // Call the app's search endpoint using the current request's host
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('host') || 'localhost:3000';
        const url = `${protocol}://${host}${app.Search_Endpoint}?q=${encodeURIComponent(query)}`;
        console.log(`Calling search endpoint for ${app.Application_Name}:`, url);

        const response = await fetch(url, {
          headers: {
            Cookie: request.headers.get('cookie') || '',
          },
        });

        if (!response.ok) {
          console.error(`Search failed for ${app.Application_Name}:`, response.status, response.statusText);
          return null;
        }

        const results: GlobalSearchResult[] = await response.json();
        console.log(`Results from ${app.Application_Name}:`, results.length, 'items');

        if (results.length === 0) {
          return null;
        }

        return {
          app: {
            Application_ID: app.Application_ID,
            Application_Name: app.Application_Name,
            Application_Key: app.Application_Key,
            Icon: app.Icon,
          },
          results,
        } as AppContentResults;
      } catch (error) {
        console.error(`Error searching ${app.Application_Name}:`, error);
        return null;
      }
    });

    const contentResults = (await Promise.all(contentSearchPromises))
      .filter((result): result is AppContentResults => result !== null);

    return NextResponse.json<GlobalSearchResponse>({
      apps: appMatches,
      content_results: contentResults,
    });
  } catch (error) {
    console.error('Global search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
