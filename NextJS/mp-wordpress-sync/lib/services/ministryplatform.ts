/**
 * MinistryPlatform API Client
 * Handles OAuth authentication and data fetching
 */

import { MPCampus } from '@/lib/types/campus';

export class MinistryPlatformService {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor() {
    const mpUrl = process.env.MINISTRY_PLATFORM_BASE_URL;
    const clientId = process.env.MINISTRY_PLATFORM_CLIENT_ID;
    const clientSecret = process.env.MINISTRY_PLATFORM_CLIENT_SECRET;

    if (!mpUrl || !clientId || !clientSecret) {
      throw new Error('MinistryPlatform credentials not configured');
    }

    this.baseUrl = mpUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Get OAuth access token (client credentials flow)
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const tokenUrl = `${this.baseUrl}/oauth/connect/token`;
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'http://www.thinkministry.com/dataplatform/scopes/all',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MP OAuth error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    // Set expiry 5 minutes before actual expiry for safety
    this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    return this.accessToken;
  }

  /**
   * Fetch all campuses (congregations) from MinistryPlatform
   */
  async getCampuses(): Promise<MPCampus[]> {
    const token = await this.getAccessToken();

    // Adjust this endpoint based on your MP setup
    // This is a typical congregation query with location details
    const apiUrl = `${this.baseUrl}/tables/Congregations`;
    const select = [
      'Congregation_ID',
      'Congregation_Name',
      'Description',
      'Location_ID_Table.[Location_Name]',
      'Location_ID_Table.[Address_Line_1]',
      'Location_ID_Table.[Address_Line_2]',
      'Location_ID_Table.[City]',
      'Location_ID_Table.[State/Region]',
      'Location_ID_Table.[Postal_Code]',
    ].join(',');

    const response = await fetch(`${apiUrl}?$select=${encodeURIComponent(select)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MP API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get a specific campus by ID
   */
  async getCampusById(congregationId: number): Promise<MPCampus | null> {
    const token = await this.getAccessToken();

    const apiUrl = `${this.baseUrl}/tables/Congregations/${congregationId}`;
    const select = [
      'Congregations.Congregation_ID',
      'Congregations.Congregation_Name',
      'Congregations.Description',
      'Location_ID_Table.Location_Name',
      'Location_ID_Table.Phone',
      'Location_ID_Table_Address_ID_Table.Address_Line_1',
      'Location_ID_Table_Address_ID_Table.Address_Line_2',
      'Location_ID_Table_Address_ID_Table.City',
      'Location_ID_Table_Address_ID_Table.[State/Region]',
      'Location_ID_Table_Address_ID_Table.Postal_Code',
      'Contact_ID_Table.Display_Name AS Contact_Person',
    ].join(',');

    const response = await fetch(`${apiUrl}?$select=${encodeURIComponent(select)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      const error = await response.text();
      throw new Error(`MP API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data[0] || null;
  }

  /**
   * Call a stored procedure
   */
  async callStoredProcedure(procName: string, params: Record<string, any> = {}): Promise<any> {
    const token = await this.getAccessToken();

    const apiUrl = `${this.baseUrl}/procs/${procName}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MP Stored Proc error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Test connection to MinistryPlatform
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error('MP connection test failed:', error);
      return false;
    }
  }
}
