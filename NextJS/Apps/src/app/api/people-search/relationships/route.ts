import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { TableService } from "@/providers/MinistryPlatform/services/tableService";

type Relationship = {
  Relationship_ID: number;
  Relationship_Name: string;
  Male_Label?: string | null;
  Female_Label?: string | null;
  Description?: string | null;
  Relationship_Type_ID: number;
  Relationship_Type_Name?: string;
};

type RelationshipType = {
  Relationship_Type_ID: number;
  Relationship_Type_Name: string;
  Description?: string | null;
  Sort_Order: number;
};

type GroupedRelationships = {
  type: RelationshipType;
  relationships: Relationship[];
};

/**
 * GET /api/people-search/relationships
 * Returns relationships grouped by type from MinistryPlatform
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const client = new MinistryPlatformClient();
    const tableService = new TableService(client);

    // Fetch all relationship types
    const relationshipTypes = await tableService.getTableRecords<RelationshipType>("Relationship_Types", {
      $select: "Relationship_Type_ID,Relationship_Type_Name,Description,Sort_Order",
      $orderby: "Sort_Order",
    });

    // Fetch all relationships with their type
    const relationships = await tableService.getTableRecords<Relationship>("Relationships", {
      $select: "Relationship_ID,Relationship_Name,Male_Label,Female_Label,Relationship_Type_ID,Relationship_Type_ID_Table.Relationship_Type_Name",
      $orderby: "Relationship_Name",
    });

    // Group relationships by type
    const grouped: GroupedRelationships[] = relationshipTypes.map(type => ({
      type,
      relationships: relationships.filter(r => r.Relationship_Type_ID === type.Relationship_Type_ID)
    })).filter(group => group.relationships.length > 0); // Only include types that have relationships

    return NextResponse.json(grouped);
  } catch (error) {
    console.error("Error fetching relationships:", error);
    return NextResponse.json(
      { error: "Failed to fetch relationships" },
      { status: 500 }
    );
  }
}
