export type CampusStatus = 'closed' | 'modified' | 'open';

export interface AffectedService {
  name: string;
  status: 'cancelled' | 'modified' | 'delayed';
  details?: string;
}

export interface CampusUpdate {
  message: string;
  timestamp: string;
}

export interface Campus {
  id: number;
  name: string;
  address: string;
  status: CampusStatus;
  reason?: string;
  updates?: CampusUpdate[];
  expectedResumeTime?: string;
  affectedServices?: AffectedService[];
  showWatchOnline?: boolean;
  watchOnlineUrl?: string;
  lastUpdated?: string;
}

export interface CancellationsData {
  lastUpdated: string;
  alertTitle?: string;
  alertMessage?: string;
  campuses: Campus[];
}

export type FilterType = 'all' | 'affected' | 'open';
