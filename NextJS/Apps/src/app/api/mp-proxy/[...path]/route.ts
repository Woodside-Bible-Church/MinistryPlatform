import { NextRequest, NextResponse } from 'next/server';

const MP_BASE_URL = 'https://my.woodsidebible.org/widgets';

/**
 * Proxy route for Ministry Platform widget requests
 * Handles all requests to /api/mp-proxy/* and forwards them to the MP server
 * This avoids CORS issues in both development and production
 *
 * Development: http://localhost:3000/api/mp-proxy -> https://my.woodsidebible.org/widgets
 * Production: https://apps.woodsidebible.org/api/mp-proxy -> https://my.woodsidebible.org/widgets
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathString = path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const fullPath = searchParams ? `${pathString}?${searchParams}` : pathString;
    const targetUrl = `${MP_BASE_URL}/${fullPath}`;

    console.log('[MP Proxy] GET:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        // Forward relevant headers
        'User-Agent': request.headers.get('user-agent') || '',
      },
    });

    // Get the response body
    const contentType = response.headers.get('content-type') || '';
    let body;

    if (contentType.includes('application/json')) {
      body = await response.json();
      return NextResponse.json(body, { status: response.status });
    } else if (contentType.includes('text/javascript') || contentType.includes('application/javascript')) {
      body = await response.text();

      // Rewrite hardcoded API paths in JavaScript files to use our proxy
      // This handles cases where widget JS files have hardcoded paths like "/Api/ConfigurationApi"
      // Replace 0.0.0.0 with localhost to avoid connection refused errors
      const proxyOrigin = request.nextUrl.origin.replace('0.0.0.0', 'localhost');
      const originalLength = body.length;

      body = body
        .replace(/(['"`])\/Api\//g, `$1${proxyOrigin}/api/mp-proxy/Api/`)
        .replace(/(['"`])\/api\//g, `$1${proxyOrigin}/api/mp-proxy/api/`)
        .replace(/(['"`])\/Home\//g, `$1${proxyOrigin}/api/mp-proxy/Home/`);

      const replacements = originalLength !== body.length;
      console.log('[MP Proxy] JavaScript file:', pathString, '- Rewrote paths:', replacements);

      return new NextResponse(body, {
        status: response.status,
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } else {
      body = await response.text();

      // Handle 204 No Content responses (NextResponse doesn't support them)
      if (response.status === 204) {
        return new NextResponse(null, { status: 204 });
      }

      return new NextResponse(body, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
        },
      });
    }
  } catch (error) {
    console.error('[MP Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathString = path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const fullPath = searchParams ? `${pathString}?${searchParams}` : pathString;
    const targetUrl = `${MP_BASE_URL}/${fullPath}`;

    console.log('[MP Proxy] POST:', targetUrl);

    // Get request body
    const contentType = request.headers.get('content-type') || '';
    let body;

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      body = await request.text();
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'User-Agent': request.headers.get('user-agent') || '',
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });

    const responseContentType = response.headers.get('content-type') || '';
    let responseBody;

    if (responseContentType.includes('application/json')) {
      responseBody = await response.json();
      return NextResponse.json(responseBody, { status: response.status });
    } else {
      responseBody = await response.text();
      return new NextResponse(responseBody, {
        status: response.status,
        headers: {
          'Content-Type': responseContentType,
        },
      });
    }
  } catch (error) {
    console.error('[MP Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { status: 500 }
    );
  }
}
