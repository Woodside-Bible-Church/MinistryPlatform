import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { applications, appPermissions } from "@/db/schema";
import { eq, inArray, or, and } from "drizzle-orm";

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
      // If user has no roles, show no apps
      if (!session.roles || session.roles.length === 0) {
        return NextResponse.json([]);
      }

      // Find all permissions that match the user's roles or email
      const userPermissions = await db.query.appPermissions.findMany({
        where: or(
          inArray(appPermissions.roleName, session.roles),
          eq(appPermissions.userEmail, session.user.email!)
        ),
      });

      // Get unique application IDs the user has access to
      const allowedAppIds = [...new Set(userPermissions.map(p => p.applicationId))];

      if (allowedAppIds.length === 0) {
        return NextResponse.json([]);
      }

      // Fetch all allowed applications
      const userApps = await db.query.applications.findMany({
        where: and(
          eq(applications.isActive, true),
          inArray(applications.id, allowedAppIds)
        ),
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
