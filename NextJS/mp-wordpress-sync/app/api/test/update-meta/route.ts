/**
 * Test endpoint to update WordPress post meta directly
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const pageId = 323; // Lake Orion page
    const authHeader = `Basic ${Buffer.from(
      `${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APP_PASSWORD}`
    ).toString('base64')}`;

    // Try updating via meta field (ACF stores fields as post meta with underscore prefix)
    const updateData = {
      meta: {
        location_info_services: 'SUN 8:30AM, 10AM & 11:30AM!',
        _location_info_services: 'field_xxxxx', // ACF reference (we don't know the key yet)
      },
    };

    const updateResponse = await fetch(
      `${process.env.WORDPRESS_URL}/wp-json/wp/v2/pages/${pageId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      return NextResponse.json(
        {
          error: `Failed to update: ${updateResponse.status}`,
          details: error,
        },
        { status: updateResponse.status }
      );
    }

    const result = await updateResponse.json();

    // Check if it worked by fetching the page again
    const verifyResponse = await fetch(
      `${process.env.WORDPRESS_URL}/wp-json/wp/v2/pages/${pageId}`,
      {
        headers: { 'Authorization': authHeader },
      }
    );

    const verifiedPage = await verifyResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Update attempted via post meta',
      meta_in_result: result.meta,
      verified_meta: verifiedPage.meta,
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
