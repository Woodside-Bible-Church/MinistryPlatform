import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Client } from "pg";

// Initialize PostgreSQL client
function getClient() {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}

// GET: Fetch all pinned items for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.contactId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = getClient();
    await client.connect();

    const result = await client.query(
      `SELECT * FROM user_pinned_items
       WHERE contact_id = $1
       ORDER BY sort_order ASC, created_date DESC`,
      [session.contactId]
    );

    await client.end();

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching pinned items:", error);
    return NextResponse.json(
      { error: "Failed to fetch pinned items" },
      { status: 500 }
    );
  }
}

// POST: Create a new pinned item
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.contactId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemType, itemId, itemData, route } = body;

    if (!itemType || !itemId || !itemData || !route) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = getClient();
    await client.connect();

    // Get the current max sort_order for this user
    const maxSortResult = await client.query(
      `SELECT COALESCE(MAX(sort_order), -1) as max_sort FROM user_pinned_items WHERE contact_id = $1`,
      [session.contactId]
    );
    const nextSortOrder = (maxSortResult.rows[0]?.max_sort || -1) + 1;

    const result = await client.query(
      `INSERT INTO user_pinned_items (contact_id, item_type, item_id, item_data, route, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (contact_id, item_type, item_id) DO NOTHING
       RETURNING *`,
      [session.contactId, itemType, itemId, JSON.stringify(itemData), route, nextSortOrder]
    );

    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Item already pinned" },
        { status: 409 }
      );
    }

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating pinned item:", error);
    return NextResponse.json(
      { error: "Failed to create pinned item" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a pinned item
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.contactId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get("itemType");
    const itemId = searchParams.get("itemId");

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: "Missing itemType or itemId" },
        { status: 400 }
      );
    }

    const client = getClient();
    await client.connect();

    const result = await client.query(
      `DELETE FROM user_pinned_items
       WHERE contact_id = $1 AND item_type = $2 AND item_id = $3
       RETURNING *`,
      [session.contactId, itemType, itemId]
    );

    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Pinned item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting pinned item:", error);
    return NextResponse.json(
      { error: "Failed to delete pinned item" },
      { status: 500 }
    );
  }
}
