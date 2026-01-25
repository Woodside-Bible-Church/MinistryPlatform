/**
 * Campus Sync Service
 * Transforms MinistryPlatform campus data to WordPress format
 */

import { MPCampus, WPCampus } from '@/lib/types/campus';
import { MinistryPlatformService } from './ministryplatform';
import { WordPressCustomService } from './wordpress-custom';

export class CampusSyncService {
  private mpService: MinistryPlatformService;
  private wpService: WordPressCustomService;

  constructor() {
    this.mpService = new MinistryPlatformService();
    this.wpService = new WordPressCustomService();
  }

  /**
   * Transform MP campus data to WordPress format
   */
  transformCampusData(mpCampus: MPCampus): WPCampus {
    // Build full address for WordPress format (with <br> tag like WP uses)
    // MP returns "State/Region" with a slash in the key name
    const state = mpCampus['State/Region'] || mpCampus.State || '';
    const addressParts = [mpCampus.Address_Line_1, mpCampus.Address_Line_2].filter(Boolean);
    const addressLine1 = mpCampus.Address_Line_1 || '';
    const cityStateZip = [mpCampus.City, state, mpCampus.Postal_Code]
      .filter(Boolean)
      .join(', ');
    const fullAddress = `${addressLine1}${addressLine1 && cityStateZip ? ' <br>' : ''}${cityStateZip}`;

    // Format phone number (strip non-digits, format as needed)
    const phone = mpCampus.Phone ? mpCampus.Phone.replace(/\D/g, '') : '';
    const phoneFormatted = phone
      ? `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`
      : '';

    // Create WordPress post object (using 'page' type with Location template)
    const wpData: WPCampus = {
      title: mpCampus.Congregation_Name,
      content: mpCampus.Description || '',
      status: 'publish',
      // Note: This syncs to WordPress Pages, not a custom post type
      // The Location template (page-location-ind.php) is assigned in WordPress
      acf: {
        // Location ID (used for matching and URL params like ?location=9)
        location_id: mpCampus.Congregation_ID,

        // Location Info fields (based on Woodside WP structure)
        location_info_services: '', // TODO: Map service times from MP
        location_info_additional: mpCampus.Description || '',
        location_info_phone: phoneFormatted || phone,
        location_info_address: fullAddress,
        location_info_announcements: `https://woodsidebible.org/announcements/?location=${mpCampus.Congregation_ID}`,
        location_info_calendar: '', // TODO: Add calendar link if needed

        // Store raw address components for potential future use
        address_line_1: mpCampus.Address_Line_1,
        address_line_2: mpCampus.Address_Line_2,
        city: mpCampus.City,
        state: state,
        zip: mpCampus.Postal_Code,

        // Store contact info
        phone: phoneFormatted || phone,
        contact_person: mpCampus.Contact_Person,

        // TODO: These sections are likely managed manually in WordPress:
        // - hero (Hero section content)
        // - community (Community section content)
        // - features (Features section content)
        // - events (Events section content)
        // - serve (Serve section content)
        // - form (Form section content)
        // - overlay (Overlay section content)
      },
      meta: {
        // Store MP ID in post meta for matching
        mp_congregation_id: mpCampus.Congregation_ID,
        location_id: mpCampus.Congregation_ID,
      },
    };

    return wpData;
  }

  /**
   * Sync a single campus by ID
   */
  async syncCampusById(congregationId: number, wpPageId: number, dryRun: boolean = false): Promise<any> {
    console.log(`${dryRun ? '[DRY RUN] ' : ''}Syncing campus ${congregationId} to WP page ${wpPageId}...`);

    // Fetch from MP
    const mpCampus = await this.mpService.getCampusById(congregationId);

    if (!mpCampus) {
      throw new Error(`Campus ${congregationId} not found in MinistryPlatform`);
    }

    console.log('MP Campus Data:', JSON.stringify(mpCampus, null, 2));

    // Transform to WP format
    const wpData = this.transformCampusData(mpCampus);

    console.log('Transformed WP Data:', JSON.stringify(wpData.acf, null, 2));

    // Fetch current WP data for comparison
    const currentWpData = await this.wpService.getLocation(wpPageId);
    console.log('Current WP Data:', JSON.stringify(currentWpData, null, 2));

    if (dryRun) {
      console.log(`[DRY RUN] Would update campus ${congregationId} to WP page ${wpPageId}`);
      return {
        dry_run: true,
        would_update: true,
        page_id: wpPageId,
        current_data: currentWpData,
        new_data: wpData.acf,
        message: 'Dry run - no changes made',
      };
    }

    // Update WordPress using custom plugin endpoint
    const result = await this.wpService.updateLocation(wpPageId, wpData.acf);

    console.log(`Successfully synced campus ${congregationId} to WP page ${wpPageId}`);
    return result;
  }

  /**
   * Sync all campuses
   */
  async syncAllCampuses(): Promise<any[]> {
    console.log('Starting full campus sync...');

    // Fetch all campuses from MP
    const mpCampuses = await this.mpService.getCampuses();
    console.log(`Found ${mpCampuses.length} campuses in MinistryPlatform`);

    // Sync each campus
    const results = [];
    for (const mpCampus of mpCampuses) {
      try {
        const wpData = this.transformCampusData(mpCampus);
        const result = await this.wpService.upsertPost(wpData, 'pages');
        results.push({
          success: true,
          congregation_id: mpCampus.Congregation_ID,
          wp_post_id: result.id,
        });
        console.log(`✓ Synced: ${mpCampus.Congregation_Name}`);
      } catch (error) {
        console.error(`✗ Failed to sync ${mpCampus.Congregation_Name}:`, error);
        results.push({
          success: false,
          congregation_id: mpCampus.Congregation_ID,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Sync complete: ${successCount}/${mpCampuses.length} successful`);

    return results;
  }

  /**
   * Test connections to both MP and WP
   */
  async testConnections(): Promise<{ mp: boolean; wp: boolean }> {
    const [mpOk, wpOk] = await Promise.all([
      this.mpService.testConnection(),
      this.wpService.testConnection(),
    ]);

    return {
      mp: mpOk,
      wp: wpOk,
    };
  }
}
