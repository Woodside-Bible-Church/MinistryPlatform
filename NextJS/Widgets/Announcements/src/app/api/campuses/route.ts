import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// CORS headers for cross-origin widget embedding (mirrors /api/announcements)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

interface Campus {
  id: number;
  name: string;
  shortName: string | null;
  svgUrl: string | null;
}

interface CongregationRow {
  Congregation_ID: number;
  Congregation_Name: string;
  Congregation_Short_Name?: string | null;
  Campus_SVG_URL?: string | null;
}

function mpRootUrl(): string {
  const base =
    process.env.MINISTRY_PLATFORM_BASE_URL ||
    'https://my.woodsidebible.org/ministryplatformapi';
  return base.replace(/\/ministryplatformapi\/?$/, '');
}

async function getAccessToken(): Promise<string> {
  const tokenUrl = `${mpRootUrl()}/ministryplatformapi/oauth/connect/token`;
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.MINISTRY_PLATFORM_CLIENT_ID!,
      client_secret: process.env.MINISTRY_PLATFORM_CLIENT_SECRET!,
      scope: 'http://www.thinkministry.com/dataplatform/scopes/all',
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to get OAuth token: ${res.status}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

/**
 * Prefer the `api_Custom_GetCongregationsWithSVG` stored procedure (returns
 * each campus's `Campus_SVG_URL` so the picker can show brand icons). Falls
 * back to a plain Congregations table query when the proc isn't registered or
 * returns nothing — same pattern as church-hub's /api/congregations route.
 */
async function fetchCongregations(token: string): Promise<CongregationRow[]> {
  const root = mpRootUrl();
  const authHeader = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Proc first.
  try {
    const procRes = await fetch(
      `${root}/ministryplatformapi/procs/api_Custom_GetCongregationsWithSVG`,
      { headers: authHeader }
    );
    if (procRes.ok) {
      const resultSets = await procRes.json();
      // SQL Server FOR JSON returns the payload as a single string column
      // (JSON_F52E2B6118A111d1B10500805F49916B); pull the first scalar.
      const firstRow = resultSets?.[0]?.[0] as Record<string, unknown> | undefined;
      if (firstRow) {
        const jsonCol = Object.values(firstRow)[0];
        if (typeof jsonCol === 'string') {
          const parsed = JSON.parse(jsonCol) as CongregationRow[];
          if (parsed.length > 0) return parsed;
        }
      }
      // Proc returned plain rows (non-JSON shape) — use as-is.
      const rows = resultSets?.[0] as CongregationRow[] | undefined;
      if (rows && rows.length > 0 && 'Congregation_ID' in rows[0]) return rows;
    }
  } catch {
    // Fall through to the table query.
  }

  // Fallback: active campuses straight from the Congregations table,
  // matching church-hub's filter (active + available online).
  const today = new Date().toISOString().slice(0, 10);
  const params = new URLSearchParams({
    $filter: `Start_Date <= '${today}' AND (End_Date IS NULL OR End_Date >= '${today}') AND Available_Online = 1`,
    $select: 'Congregation_ID, Congregation_Name, Congregation_Short_Name',
    $orderby: 'Congregation_Name',
  });
  const tableRes = await fetch(
    `${root}/ministryplatformapi/tables/Congregations?${params.toString()}`,
    { headers: authHeader }
  );
  if (!tableRes.ok) {
    throw new Error(`Failed to fetch congregations: ${tableRes.status}`);
  }
  return (await tableRes.json()) as CongregationRow[];
}

/**
 * GET /api/campuses
 *
 * Returns the list of selectable campuses for the in-widget campus dropdown.
 * The "Church Wide" row (Congregation_ID = 1) is excluded — it isn't a real
 * campus; church-wide is the dropdown's default "All Campuses" state, which
 * sends no campus filter to the announcements proc.
 */
export async function GET() {
  try {
    const token = await getAccessToken();
    const rows = await fetchCongregations(token);

    const campuses: Campus[] = rows
      .filter((r) => r.Congregation_ID !== 1)
      .map((r) => ({
        id: r.Congregation_ID,
        name: r.Congregation_Name,
        shortName: r.Congregation_Short_Name ?? null,
        svgUrl: r.Campus_SVG_URL ?? null,
      }));

    return NextResponse.json({ campuses }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching campuses:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch campuses',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
