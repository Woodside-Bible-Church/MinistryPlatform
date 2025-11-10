import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();

    // If no session, return only public apps
    if (!session?.user?.email) {
      const publicApps = await db.query.applications.findMany({
        where: (applications, { eq, and }) => and(
          eq(applications.isActive, true),
          eq(applications.requiresAuth, false)
        ),
        orderBy: (applications, { asc }) => [asc(applications.sortOrder)],
      });

      // Transform to match old MinistryPlatform format
      return NextResponse.json(publicApps.map(app => ({
        Application_ID: app.id,
        Application_Name: app.name,
        Application_Key: app.key,
        Description: app.description,
        Icon: app.icon,
        Route: app.route,
        Sort_Order: app.sortOrder,
      })));
    }

    // Check if user is an administrator
    const isAdmin = session.roles?.includes("Administrators");

    if (isAdmin) {
      // Admins can see all active applications from Neon
      const allApps = await db.query.applications.findMany({
        where: (applications, { eq }) => eq(applications.isActive, true),
        orderBy: (applications, { asc }) => [asc(applications.sortOrder)],
      });

      // Transform to match old MinistryPlatform format
      return NextResponse.json(allApps.map(app => ({
        Application_ID: app.id,
        Application_Name: app.name,
        Application_Key: app.key,
        Description: app.description,
        Icon: app.icon,
        Route: app.route,
        Sort_Order: app.sortOrder,
      })));
    } else {
      // Regular users - filter by permissions
      // TODO: Implement permission filtering based on user groups and security roles
      // For now, return apps that don't require auth or that user has access to
      const userApps = await db.query.applications.findMany({
        where: (applications, { eq }) => eq(applications.isActive, true),
        orderBy: (applications, { asc }) => [asc(applications.sortOrder)],
      });

      // Transform to match old MinistryPlatform format
      return NextResponse.json(userApps.map(app => ({
        Application_ID: app.id,
        Application_Name: app.name,
        Application_Key: app.key,
        Description: app.description,
        Icon: app.icon,
        Route: app.route,
        Sort_Order: app.sortOrder,
      })));
    }
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
