export type CampusStatus = 'closed' | 'modified' | 'open';

export interface AffectedService {
  name: string;
  status: 'cancelled' | 'modified' | 'delayed';
  details?: string | null;
}

export interface CampusUpdate {
  message: string;
  timestamp: string;
}

export interface Campus {
  id: number;
  name: string;
  slug?: string;
  svgUrl?: string | null;
  address?: string;
  status: CampusStatus;
  reason?: string | null;
  updates?: CampusUpdate[] | null;
  expectedResumeTime?: string | null;
  affectedServices?: AffectedService[] | null;
  showWatchOnline?: boolean;
  watchOnlineUrl?: string;
  lastUpdated?: string;
}

/**
 * Information labels from Application Labels table
 */
export interface CancellationsInformation {
  alertTitle: string;
  mainTitle: string;
  alertMessage: string;
  autoRefreshMessage: string;
  lastUpdatedPrefix: string;
  openStatusMessage: string;
  openStatusSubtext: string;
}

/**
 * API response structure from stored procedure
 */
export interface CancellationsApiResponse {
  Information: CancellationsInformation;
  LastUpdated: string;
  Campuses: Campus[];
}

/**
 * Legacy data format for backwards compatibility
 */
export interface CancellationsData {
  lastUpdated: string;
  alertTitle?: string;
  alertMessage?: string;
  campuses: Campus[];
}

export type FilterType = 'all' | 'affected' | 'open';
