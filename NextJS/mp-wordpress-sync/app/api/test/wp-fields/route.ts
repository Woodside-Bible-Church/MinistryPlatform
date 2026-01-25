/**
 * Test endpoint to discover WordPress ACF fields
 * Fetches an existing location page to see what fields it has
 */

import { NextRequest, NextResponse } from 'next/server';
import { WordPressService } from '@/lib/services/wordpress';

export async function GET(request: NextRequest) {
  try {
    const wpService = new WordPressService();

    // Get the page ID from query params (e.g., /api/test/wp-fields?page_id=123)
    const pageId = request.nextUrl.searchParams.get('page_id');

    if (!pageId) {
      return NextResponse.json({
        error: 'Please provide a page_id query parameter',
        example: '/api/test/wp-fields?page_id=123',
      });
    }

    // Fetch the specific page with ACF data
    const response = await fetch(
      `${process.env.WORDPRESS_URL}/wp-json/wp/v2/pages/${pageId}?acf_format=standard`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(
            `${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APP_PASSWORD}`
          ).toString('base64')}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `WordPress API error: ${response.status} - ${error}` },
        { status: response.status }
      );
    }

    const page = await response.json();

    // Return the page data so we can see the ACF field structure
    return NextResponse.json({
      page_title: page.title?.rendered,
      page_id: page.id,
      template: page.template,
      acf_fields: page.acf || 'No ACF fields found',
      meta: page.meta,
      // Full page data for inspection
      full_data: page,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch page',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
