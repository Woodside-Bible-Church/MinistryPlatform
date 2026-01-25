/**
 * WordPress Custom API Client
 * Uses the Woodside MP Sync plugin's custom endpoint
 */

export class WordPressCustomService {
  private baseUrl: string;
  private authHeader: string;

  constructor() {
    const wpUrl = process.env.WORDPRESS_URL;
    const wpUsername = process.env.WORDPRESS_USERNAME;
    const wpAppPassword = process.env.WORDPRESS_APP_PASSWORD;

    if (!wpUrl || !wpUsername || !wpAppPassword) {
      throw new Error('WordPress credentials not configured');
    }

    this.baseUrl = `${wpUrl}/wp-json/woodside/v1`;

    // Application Password auth
    const credentials = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;
  }

  /**
   * Update a location page using the custom endpoint
   */
  async updateLocation(pageId: number, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/location/${pageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authHeader,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WordPress API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get location data
   */
  async getLocation(pageId: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/location/${pageId}`, {
      headers: {
        'Authorization': this.authHeader,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WordPress API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Find location by MP congregation ID
   */
  async findLocationByMPId(mpId: number): Promise<any | null> {
    // We'll need to search pages by the location_id meta field
    // For now, return null and we'll implement search later
    // You might need to query multiple known page IDs
    return null;
  }

  /**
   * Test connection to WordPress
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to get a known page (Lake Orion = 323)
      const response = await fetch(`${process.env.WORDPRESS_URL}/wp-json/wp/v2/pages/323`, {
        headers: {
          'Authorization': this.authHeader,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('WordPress connection test failed:', error);
      return false;
    }
  }
}
