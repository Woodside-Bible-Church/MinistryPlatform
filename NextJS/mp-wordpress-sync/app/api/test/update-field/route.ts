/**
 * Test endpoint to update a WordPress ACF field
 * Tests if we can write to the location_info_services field
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const pageId = 323; // Lake Orion page
    const authHeader = `Basic ${Buffer.from(
      `${process.env.WORDPRESS_USERNAME}:${process.env.WORDPRESS_APP_PASSWORD}`
    ).toString('base64')}`;

    // First, let's get the current value
    const getResponse = await fetch(
      `${process.env.WORDPRESS_URL}/wp-json/wp/v2/pages/${pageId}`,
      {
        headers: {
          'Authorization': authHeader,
        },
      }
    );

    if (!getResponse.ok) {
      return NextResponse.json(
        { error: `Failed to get page: ${getResponse.status}` },
        { status: getResponse.status }
      );
    }

    const currentPage = await getResponse.json();

    // Update with the exclamation mark
    const updateData = {
      acf: {
        location_info_services: 'SUN 8:30AM, 10AM & 11:30AM!',
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
          error: `Failed to update page: ${updateResponse.status}`,
          details: error,
          attempted_update: updateData,
        },
        { status: updateResponse.status }
      );
    }

    const result = await updateResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Updated location_info_services field!',
      previous_value: currentPage.acf?.location_info_services || 'Not found in ACF',
      new_value: 'SUN 8:30AM, 10AM & 11:30AM!',
      page_id: pageId,
      result: result.acf,
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
