// Global Search Type Definitions
// These types define the contract for global search across all apps

/**
 * A single search result item returned by an app's search endpoint
 */
export type GlobalSearchResult = {
  result_id: string | number;        // Unique identifier for this result
  title: string;                      // Main display text (e.g., "Colton Wirgau")
  subtitle?: string;                  // Secondary text (e.g., email address)
  metadata?: string;                  // Additional context (e.g., "Age: 30")
  image_url?: string;                 // Optional avatar/icon URL
  route: string;                      // Where to navigate when clicked
  app_key: string;                    // Which app this result belongs to
};

/**
 * Application metadata for search results
 */
export type SearchableApp = {
  Application_ID: number;
  Application_Name: string;
  Application_Key: string;
  Icon: string;
  Route: string;
  Searchable: boolean;
  Search_Endpoint: string | null;
};

/**
 * App matched by name only (no content search)
 */
export type AppNameMatch = {
  Application_ID: number;
  Application_Name: string;
  Application_Key: string;
  Icon: string;
  Route: string;
  match_type: 'name';
};

/**
 * Content results grouped by app
 */
export type AppContentResults = {
  app: {
    Application_ID: number;
    Application_Name: string;
    Application_Key: string;
    Icon: string;
  };
  results: GlobalSearchResult[];
};

/**
 * Complete global search response
 */
export type GlobalSearchResponse = {
  apps: AppNameMatch[];              // Apps that match by name
  content_results: AppContentResults[]; // Content results grouped by app
};

/**
 * Request parameters for app-specific search endpoints
 */
export type AppSearchRequest = {
  q: string;        // Search query
  limit?: number;   // Max results to return (default: 5)
};

/**
 * Response from app-specific search endpoints
 * Apps must return an array of GlobalSearchResult items
 */
export type AppSearchResponse = GlobalSearchResult[];
