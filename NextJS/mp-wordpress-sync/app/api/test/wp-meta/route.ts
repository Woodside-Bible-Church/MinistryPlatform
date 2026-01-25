/**
 * Test endpoint to discover WordPress post meta fields
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const pageId = request.nextUrl.searchParams.get('page_id');

    if (!pageId) {
      return NextResponse.json({
        error: 'Please provide a page_id query parameter',
        example: '/api/test/wp-meta?page_id=323',
      });
    }

    // Fetch page with all meta fields
    const response = await fetch(
      `${process.env.WORDPRESS_URL}/wp-json/wp/v2/pages/${pageId}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(
            `${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APP_PASSWORD}`
          ).toString('base64')}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `WordPress API error: ${response.status}` },
        { status: response.status }
      );
    }

    const page = await response.json();

    // Also try to get all custom fields via direct WP REST API
    const metaResponse = await fetch(
      `${process.env.WORDPRESS_URL}/wp-json`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(
            `${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APP_PASSWORD}`
          ).toString('base64')}`,
        },
      }
    );

    return NextResponse.json({
      page_title: page.title?.rendered,
      page_id: page.id,
      template: page.template,

      // Try different meta access methods
      meta: page.meta,
      acf: page.acf,

      // Check if fields are in the root
      custom_fields_in_root: Object.keys(page).filter(k =>
        k.startsWith('location') || k.includes('info') || k.includes('service')
      ),

      // Full page for inspection
      all_fields: Object.keys(page),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
