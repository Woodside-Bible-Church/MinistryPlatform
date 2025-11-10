import { NextResponse } from 'next/server';
import { db } from '@/db';
import { widgetFields } from '@/db/schema';
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

    // Get authenticated session
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the widget field configuration
    const field = await db.query.widgetFields.findFirst({
      where: eq(widgetFields.fieldKey, fieldId),
    });

    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // If field doesn't have MP data source, return empty
    if (field.dataSourceType !== 'mp_table' || !field.dataSourceConfig) {
      return NextResponse.json([]);
    }

    const config = field.dataSourceConfig as {
      table: string;
      valueField: string;
      labelField: string;
      filter?: string;
    };

    // Get MP helper instance
    const mp = new MPHelper();

    // Fetch data from MinistryPlatform
    const records = await mp.getTableRecords({
      table: config.table,
      select: `${config.valueField}, ${config.labelField}`,
      filter: config.filter,
      orderBy: config.labelField,
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
