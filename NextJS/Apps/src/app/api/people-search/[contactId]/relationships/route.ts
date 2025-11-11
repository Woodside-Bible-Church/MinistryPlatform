import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { TableService } from "@/providers/MinistryPlatform/services/tableService";
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

type ContactRelationship = {
  Contact_Relationship_ID?: number;
  Contact_ID: number;
  Related_Contact_ID: number;
  Relationship_ID: number;
  Start_Date?: string | null;
  End_Date?: string | null;
  Notes?: string | null;
  Domain_ID?: number;
};

/**
 * PATCH /api/people-search/[contactId]/relationships
 * Update relationship between contactId and a related contact
 * Body: { relatedContactId: number, relationshipId: number | null }
 */
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
    const { relatedContactId, relationshipId } = body;

    if (!relatedContactId) {
      return NextResponse.json(
        { error: "relatedContactId is required" },
        { status: 400 }
      );
    }

    const client = new MinistryPlatformClient();
    const tableService = new TableService(client);

    // Check if a relationship already exists between these contacts
    // In the relationship, the family member is Contact_ID and the selected contact is Related_Contact_ID
    const existingRelationships = await tableService.getTableRecords<ContactRelationship>(
      "Contact_Relationships",
      {
        $filter: `Contact_ID = ${relatedContactId} AND Related_Contact_ID = ${contactId}`,
        $select: "Contact_Relationship_ID,Contact_ID,Related_Contact_ID,Relationship_ID",
      }
    );

    if (relationshipId === null || relationshipId === undefined) {
      // Delete the relationship if it exists
      if (existingRelationships.length > 0) {
        const relationshipToDelete = existingRelationships[0];
        await tableService.deleteTableRecords("Contact_Relationships", [
          relationshipToDelete.Contact_Relationship_ID!,
        ]);
      }
      return NextResponse.json({ success: true, deleted: true });
    }

    if (existingRelationships.length > 0) {
      // Update existing relationship
      const existingRelationship = existingRelationships[0];
      const updated = {
        Contact_Relationship_ID: existingRelationship.Contact_Relationship_ID,
        Relationship_ID: relationshipId,
      };
      await tableService.updateTableRecords("Contact_Relationships", [updated]);
      return NextResponse.json({ success: true, updated: true });
    } else {
      // Create new relationship
      const newRelationship: Partial<ContactRelationship> = {
        Contact_ID: relatedContactId,
        Related_Contact_ID: parseInt(contactId),
        Relationship_ID: relationshipId,
        Start_Date: new Date().toISOString().split('T')[0], // Today's date
      };
      const created = await tableService.createTableRecords("Contact_Relationships", [newRelationship]);
      return NextResponse.json({ success: true, created: true, data: created });
    }
  } catch (error) {
    console.error("Error updating relationship:", error);
    return NextResponse.json(
      { error: "Failed to update relationship" },
      { status: 500 }
    );
  }
}
