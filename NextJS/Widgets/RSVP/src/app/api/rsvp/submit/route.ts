// ===================================================================
// API Route: POST /api/rsvp/submit
// ===================================================================
// Submits an RSVP with answers to the database
// Calls stored procedure: api_Custom_RSVP_Submit_JSON
//
// Phase 5 (api-architecture-rebuild, 2026-05-17):
// - Now passes @AuditUserName and @AuditUserId so MP's audit log records
//   "Service: RSVP Widget (user@email)" instead of the proc-internal
//   "First Last (RSVP Widget)" string.
// - Service identity is sourced from RSVP_WIDGET_AUDIT_SERVICE_NAME env
//   (default 'Service: RSVP Widget') so each deployment can override.
// - When the submitter is signed in, the NextAuth session's user_id is
//   passed as @AuditUserId so the audit row carries the impersonated
//   end-user too. For guest RSVPs both are null and the proc falls back
//   to legacy attribution.
//
// NOTE: This widget runs standalone (its own Next.js + MP OAuth, not
// behind apps/api), so it acts as its own "service" for audit purposes.
// If/when this widget is migrated behind apps/api, replace the env-var
// service name with whatever apps/api forwards in its x-service-client
// header.
// ===================================================================

import { NextRequest, NextResponse } from 'next/server';
import { ministryPlatformProvider } from '@/providers/MinistryPlatform/ministryPlatformProvider';
import { auth } from '@/auth';
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

/**
 * Service identity to use in MP's audit log. Override per-deployment via
 * RSVP_WIDGET_AUDIT_SERVICE_NAME (e.g. 'Service: RSVP Widget' for prod,
 * 'Service: RSVP Widget (dev)' for staging). Defaults to the prod string.
 */
const AUDIT_SERVICE_NAME =
  process.env.RSVP_WIDGET_AUDIT_SERVICE_NAME ?? 'Service: RSVP Widget';

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

    // ===================================================================
    // Phase 5: resolve audit identity from session (if signed in)
    // ===================================================================
    // The session's user.id holds the MP Contact_ID (see auth.ts session
    // callback). We look up the linked dp_Users.User_ID on the SQL side
    // (the proc already does this from @Contact_ID), but if we have a
    // session.user.userId straight from the MP OAuth profile, we pass it
    // as @AuditUserId so the proc skips its own lookup.
    let auditUserId: number | null = null;
    try {
      const session = await auth();
      // NextAuth session shape varies; MP profile attaches `userId` and we
      // alias `user.id` to Contact_ID elsewhere. Prefer the explicit
      // numeric MP User_ID when available; otherwise leave null and let
      // the proc resolve from @Contact_ID.
      const sessUserId =
        (session as unknown as { userId?: number | string })?.userId ??
        ((session as unknown as { user?: { userId?: number | string } })?.user
          ?.userId);
      if (sessUserId !== undefined && sessUserId !== null) {
        const parsed = typeof sessUserId === 'string' ? parseInt(sessUserId, 10) : sessUserId;
        if (Number.isFinite(parsed) && parsed > 0) {
          auditUserId = parsed;
        }
      }
    } catch (sessionErr) {
      // Session lookup failure is non-fatal — guest submissions are allowed.
      console.warn('[RSVP Submit] Could not resolve session for audit:', sessionErr);
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
      // Phase 5: service identity for MP audit log
      '@AuditUserName': AUDIT_SERVICE_NAME,
      '@AuditUserId': auditUserId,
    };

    // Execute stored procedure
    const result = await mp.executeProcedure(
      'api_Custom_RSVP_Submit_JSON',
      params
    );

    console.log('[RSVP Submit] Raw result:', JSON.stringify(result, null, 2));

    // Stored procedure returns nested array with JsonResult
    // Format: [[{"JsonResult": "{...}"}]]
    if (!result || !Array.isArray(result) || result.length === 0) {
      return NextResponse.json(
        { error: 'No data returned from stored procedure' },
        { status: 500 }
      );
    }

    const firstRow = result[0];
    console.log('[RSVP Submit] First row:', JSON.stringify(firstRow, null, 2));

    if (!Array.isArray(firstRow) || firstRow.length === 0) {
      return NextResponse.json(
        { error: 'Invalid data format from stored procedure', receivedData: result },
        { status: 500 }
      );
    }

    const jsonResultRow = firstRow[0] as Record<string, string>;
    console.log('[RSVP Submit] JsonResult row:', JSON.stringify(jsonResultRow, null, 2));

    // Handle both JsonResult and GUID field names (SQL Server auto-generates GUID field names when using FOR JSON PATH without column alias)
    let jsonString: string | undefined;

    if (jsonResultRow.JsonResult) {
      jsonString = jsonResultRow.JsonResult;
    } else {
      // Try to find any field that looks like a GUID (starts with "JSON_")
      const guidField = Object.keys(jsonResultRow).find(key => key.startsWith('JSON_'));
      if (guidField) {
        jsonString = jsonResultRow[guidField];
      }
    }

    if (!jsonString) {
      return NextResponse.json(
        { error: 'No JsonResult field in response', receivedRow: jsonResultRow },
        { status: 500 }
      );
    }

    // Parse the JSON string
    const data: RSVPSubmissionResponse = JSON.parse(jsonString);

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
