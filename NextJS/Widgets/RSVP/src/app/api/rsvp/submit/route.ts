// ===================================================================
// API Route: POST /api/rsvp/submit
// ===================================================================
// Submits an RSVP with answers to the database
// Calls stored procedure: api_Custom_RSVP_Submit_JSON
// ===================================================================

import { NextRequest, NextResponse } from 'next/server';
import { ministryPlatformProvider } from '@/providers/MinistryPlatform/ministryPlatformProvider';
import type { RSVPSubmissionRequest, RSVPSubmissionResponse } from '@/types/rsvp';

/**
 * Formats phone number to MinistryPlatform's expected format: XXX-XXX-XXXX
 * Strips country code and formats as 10-digit US number with dashes
 */
function formatPhoneForMP(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If starts with country code (1), remove it
  const localDigits = digits.startsWith('1') && digits.length === 11
    ? digits.substring(1)
    : digits;

  // Format as XXX-XXX-XXXX if we have 10 digits
  if (localDigits.length === 10) {
    return `${localDigits.substring(0, 3)}-${localDigits.substring(3, 6)}-${localDigits.substring(6)}`;
  }

  // Return original if not 10 digits
  return phone;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: RSVPSubmissionRequest = await request.json();

    // Validate required fields
    if (!body.Event_ID || !body.Project_ID) {
      return NextResponse.json(
        { error: 'Event_ID and Project_ID are required' },
        { status: 400 }
      );
    }

    if (!body.First_Name || !body.Last_Name || !body.Email_Address) {
      return NextResponse.json(
        { error: 'First Name, Last Name, and Email Address are required' },
        { status: 400 }
      );
    }

    // Get MP provider singleton instance
    const mp = ministryPlatformProvider.getInstance();

    // Build stored procedure parameters
    const params: Record<string, string | number | null> = {
      '@Event_ID': body.Event_ID,
      '@Project_ID': body.Project_ID,
      '@Contact_ID': body.Contact_ID ?? null,  // Person submitting
      '@Participant_ID': body.Participant_ID ?? null,  // Person attending
      '@First_Name': body.First_Name,
      '@Last_Name': body.Last_Name,
      '@Email_Address': body.Email_Address,
      '@Phone_Number': formatPhoneForMP(body.Phone_Number),
      '@Answers': JSON.stringify(body.Answers),
    };

    // Execute stored procedure
    const result = await mp.executeProcedure(
      'api_Custom_RSVP_Submit_JSON',
      params
    );

    // Stored procedure returns nested array with JsonResult
    // Format: [[{"JsonResult": "{...}"}]]
    if (!result || !Array.isArray(result) || result.length === 0) {
      return NextResponse.json(
        { error: 'No data returned from stored procedure' },
        { status: 500 }
      );
    }

    const firstRow = result[0];
    if (!Array.isArray(firstRow) || firstRow.length === 0) {
      return NextResponse.json(
        { error: 'Invalid data format from stored procedure' },
        { status: 500 }
      );
    }

    const jsonResultRow = firstRow[0] as { JsonResult?: string };
    if (!jsonResultRow.JsonResult) {
      return NextResponse.json(
        { error: 'No JsonResult field in response' },
        { status: 500 }
      );
    }

    // Parse the JSON string
    const data: RSVPSubmissionResponse = JSON.parse(jsonResultRow.JsonResult);

    // Check if submission was successful
    if (data.status === 'error') {
      return NextResponse.json(
        {
          error: data.message || 'RSVP submission failed',
          details: data,
        },
        { status: 400 }
      );
    }

    // Parse the double-JSON-encoded confirmation field if present
    if (data.confirmation && typeof data.confirmation === 'string') {
      try {
        data.confirmation = JSON.parse(data.confirmation as string);
      } catch (e) {
        console.error('Failed to parse confirmation JSON:', e);
        // Leave as-is if parsing fails
      }
    }

    // Return success response
    return NextResponse.json(data, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error submitting RSVP:', error);

    return NextResponse.json(
      {
        error: 'Failed to submit RSVP',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
