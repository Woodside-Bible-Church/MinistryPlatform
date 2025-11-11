import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PeopleSearchService } from "@/services/peopleSearchService";
import { db } from "@/db";
import { appPermissions } from "@/db/schema";
import { eq, or, and, inArray } from "drizzle-orm";

async function checkEditPermission(session: { user?: { email?: string | null }; roles?: string[] }, applicationId: number) {
  const userEmail = session.user?.email;
  const userRoles = session.roles || [];

  // Admins have all permissions
  if (userRoles.includes('Administrators')) {
    return true;
  }

  // Check permissions for user's roles
  const permissions = await db
    .select({
      canEdit: appPermissions.canEdit,
    })
    .from(appPermissions)
    .where(
      and(
        eq(appPermissions.applicationId, applicationId),
        or(
          inArray(appPermissions.roleName, userRoles),
          eq(appPermissions.userEmail, userEmail || '')
        )
      )
    );

  // Return true if ANY permission grants edit
  return permissions.some((p) => p.canEdit);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { contactId } = await params;
    const peopleSearchService = new PeopleSearchService(session.accessToken);
    const contact = await peopleSearchService.getContactById(parseInt(contactId));

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has edit permission for People Search app (ID: 4)
    const hasEditPermission = await checkEditPermission(session, 4);
    if (!hasEditPermission) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to edit contacts" },
        { status: 403 }
      );
    }

    const { contactId } = await params;
    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = ['First_Name', 'Nickname', 'Last_Name', 'Email_Address', 'Mobile_Phone', 'Company_Phone'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const peopleSearchService = new PeopleSearchService(session.accessToken);
    const updatedContact = await peopleSearchService.updateContact(parseInt(contactId), updates);

    if (!updatedContact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}
