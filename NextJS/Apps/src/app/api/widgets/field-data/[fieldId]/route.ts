import { NextResponse } from 'next/server';
import { db } from '@/db';
import { widgetFields, widgetUrlParameters } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { MPHelper } from '@/providers/MinistryPlatform/mpHelper';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  try {
    // Await params (required in Next.js 15)
    const { fieldId } = await params;

    // Get query params to determine type
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'field'; // 'field' or 'url-parameter'

    // Get authenticated session
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let dataSourceConfig: any;
    let dataSourceType: string | null;

    if (type === 'url-parameter') {
      // Find the URL parameter configuration by ID
      const urlParam = await db.query.widgetUrlParameters.findFirst({
        where: eq(widgetUrlParameters.id, parseInt(fieldId)),
      });

      if (!urlParam) {
        return NextResponse.json({ error: 'URL parameter not found' }, { status: 404 });
      }

      dataSourceConfig = urlParam.dataSourceConfig;
      dataSourceType = urlParam.dataSourceType;
    } else {
      // Find the widget field configuration
      const field = await db.query.widgetFields.findFirst({
        where: eq(widgetFields.fieldKey, fieldId),
      });

      if (!field) {
        return NextResponse.json({ error: 'Field not found' }, { status: 404 });
      }

      dataSourceConfig = field.dataSourceConfig;
      dataSourceType = field.dataSourceType;
    }

    // If field doesn't have MP data source, return empty
    if (dataSourceType !== 'mp_table' || !dataSourceConfig) {
      return NextResponse.json([]);
    }

    const config = dataSourceConfig as {
      table: string;
      valueField: string;
      labelField: string;
      filter?: string;
      orderBy?: string;
    };

    // Get MP helper instance
    const mp = new MPHelper();

    // Fetch data from MinistryPlatform
    const records = await mp.getTableRecords<Record<string, any>>({
      table: config.table,
      select: `${config.valueField}, ${config.labelField}`,
      filter: config.filter,
      orderBy: config.orderBy || config.labelField,
    });

    // Transform to options format
    const options = records.map((record) => ({
      value: String(record[config.valueField]),
      label: record[config.labelField],
    }));

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error fetching field data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch field data' },
      { status: 500 }
    );
  }
}
