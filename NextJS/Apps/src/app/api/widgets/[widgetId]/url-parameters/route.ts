/**
 * API Route: GET /api/widgets/[widgetId]/url-parameters
 *
 * Fetches URL parameters for a specific widget
 * Returns array of parameters that can be appended to the widget URL
 * Accepts either numeric ID or widget key
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { widgetUrlParameters, widgets } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  try {
    const { widgetId: widgetIdStr } = await params;

    // Try to parse as numeric ID first
    const numericId = parseInt(widgetIdStr);
    let widgetId: number;

    if (!isNaN(numericId)) {
      // It's a numeric ID
      widgetId = numericId;
    } else {
      // It's a widget key, look up the ID
      const widget = await db.query.widgets.findFirst({
        where: eq(widgets.key, widgetIdStr),
        columns: { id: true },
      });

      if (!widget) {
        return NextResponse.json(
          { error: 'Widget not found' },
          { status: 404 }
        );
      }

      widgetId = widget.id;
    }

    // Fetch URL parameters for this widget
    const parameters = await db
      .select()
      .from(widgetUrlParameters)
      .where(eq(widgetUrlParameters.widgetId, widgetId))
      .orderBy(widgetUrlParameters.sortOrder);

    return NextResponse.json(parameters, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching widget URL parameters:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch URL parameters',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
