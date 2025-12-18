import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// Configure route for longer timeout (needed for PDF generation)
export const maxDuration = 60; // 60 seconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  let browser;

  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // Get the base URL for the application
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    // Launch Puppeteer with serverless-compatible settings
    const isProduction = process.env.NODE_ENV === 'production';

    browser = await puppeteer.launch({
      args: isProduction
        ? chromium.args
        : [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
          ],
      executablePath: isProduction
        ? await chromium.executablePath()
        : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1600,
      height: 1200,
      deviceScaleFactor: 2, // Higher quality rendering
    });

    // Get session cookies from the request
    const cookies = request.headers.get("cookie");

    // Set cookies in Puppeteer context to authenticate
    if (cookies) {
      const cookieArray = cookies.split(';').map(cookie => {
        const [name, ...valueParts] = cookie.trim().split('=');
        const value = valueParts.join('=');
        return {
          name: name.trim(),
          value: value.trim(),
          domain: host.split(':')[0], // Remove port if present
          path: '/',
        };
      });

      await page.setCookie(...cookieArray);
    }

    // Navigate to the reports page
    const reportsUrl = `${baseUrl}/budgets/${encodeURIComponent(slug)}/reports`;

    console.log(`Navigating to: ${reportsUrl}`);

    await page.goto(reportsUrl, {
      waitUntil: 'networkidle0', // Wait until network is idle
      timeout: 30000,
    });

    // Wait for charts and CSS to fully render
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate PDF with custom settings
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.3in',
        bottom: '0.5in',
        left: '0.5in',
        right: '0.5in',
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
    });

    await browser.close();

    // Return PDF as download
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="budget-report-${slug}-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);

    if (browser) {
      await browser.close();
    }

    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
