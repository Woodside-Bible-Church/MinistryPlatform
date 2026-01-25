/**
 * Cancellations types for management interface
 */

export type CancellationStatus = 'open' | 'modified' | 'closed';

export interface Cancellation {
  ID: number;
  CongregationID: number;
  CongregationName: string;
  CampusSlug?: string;
  StatusID: number;
  StatusName: string;
  Status: CancellationStatus;
  Reason: string | null;
  ExpectedResumeTime: string | null;
  StartDate: string;
  EndDate: string | null;
  DomainID: number;

  // Related data
  Services?: CancellationService[];
  Updates?: CancellationUpdate[];

  // Computed
  IsActive?: boolean;
}

export interface CancellationService {
  ID: number;
  CancellationID: number;
  ServiceName: string;
  ServiceStatus: 'cancelled' | 'modified' | 'delayed';
  Details: string | null;
  SortOrder: number;
}

export interface CancellationUpdate {
  ID: number;
  CancellationID: number;
  Message: string;
  Timestamp: string;
}

export interface CancellationFormData {
  congregationID: number;
  statusID: number;
  reason: string | null;
  expectedResumeTime: string | null;
  startDate: string;
  endDate: string | null;
}

export interface CancellationServiceFormData {
  serviceName: string;
  serviceStatus: 'cancelled' | 'modified' | 'delayed';
  details: string | null;
  sortOrder: number;
}

export interface CancellationUpdateFormData {
  message: string;
}

// Status options for dropdown
export interface CancellationStatusOption {
  value: number;
  label: string;
  status: CancellationStatus;
}

// For dropdown selects
export interface CongregationOption {
  value: number;
  label: string;
  slug?: string;
}
