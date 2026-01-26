'use client';

import { useState } from 'react';
import { XCircle, AlertTriangle, CheckCircle, ChevronDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Campus, CampusStatus, CancellationsInformation } from '@/lib/types';

interface CampusCardProps {
  campus: Campus;
  campusNames: string[];
  selectedCampus: string;
  onCampusChange: (name: string) => void;
  labels?: CancellationsInformation;
}

const statusConfig: Record<CampusStatus, {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: typeof XCircle;
}> = {
  closed: {
    label: 'Closed',
    bgColor: 'bg-status-closed-light',
    textColor: 'text-status-closed',
    borderColor: 'border-status-closed/30',
    icon: XCircle,
  },
  modified: {
    label: 'Modified',
    bgColor: 'bg-status-modified-light',
    textColor: 'text-status-modified',
    borderColor: 'border-status-modified/30',
    icon: AlertTriangle,
  },
  open: {
    label: 'Open',
    bgColor: 'bg-status-open-light',
    textColor: 'text-status-open',
    borderColor: 'border-status-open/30',
    icon: CheckCircle,
  },
};

export function CampusCard({ campus, campusNames, selectedCampus, onCampusChange, labels }: CampusCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const config = statusConfig[campus.status];
  const isAffected = campus.status !== 'open';

  return (
    <div
      className={cn(
        'border-2 transition-all duration-300 overflow-hidden',
        isAffected ? config.borderColor : 'border-gray-100',
      )}
    >
      {/* Card Header */}
      <div className={cn('p-4 sm:p-5', config.bgColor)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <label className="group relative inline-flex items-center cursor-pointer hover:opacity-80 transition-opacity">
              {/* Campus Icon */}
              {campus.svgUrl ? (
                <div className="relative w-8 h-8 mr-3 flex-shrink-0">
                  {!imageLoaded && (
                    <div className="absolute inset-0 bg-gray-300/50 animate-pulse rounded" />
                  )}
                  <img
                    src={campus.svgUrl}
                    alt={`${selectedCampus} Campus`}
                    className={cn(
                      'w-8 h-8 transition-all duration-200',
                      !imageLoaded ? 'opacity-0' : 'opacity-100',
                      'grayscale group-hover:grayscale-0'
                    )}
                    onLoad={() => setImageLoaded(true)}
                  />
                  {/* Color tint overlay */}
                  <div
                    className={cn(
                      'absolute inset-0 mix-blend-multiply opacity-30 group-hover:opacity-0 transition-opacity duration-200 pointer-events-none',
                      config.bgColor
                    )}
                  />
                </div>
              ) : (
                <MapPin className={cn('w-6 h-6 mr-3 flex-shrink-0', config.textColor)} />
              )}
              {/* Visible text that sizes the container */}
              <span className={cn('text-lg font-bold uppercase', config.textColor)}>
                {selectedCampus}
              </span>
              <ChevronDown className={cn('w-4 h-4 ml-1 flex-shrink-0', config.textColor)} />
              {/* Invisible select overlaid on top */}
              <select
                value={selectedCampus}
                onChange={(e) => onCampusChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              >
                {campusNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status Badge */}
            <div className="flex items-center gap-1.5">
              <config.icon className={cn('w-5 h-5', config.textColor)} />
              <span className={cn('text-sm font-semibold uppercase tracking-wide', config.textColor)}>
                {config.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="border-t border-gray-100">
        <div className="p-4 sm:p-5 pt-4 space-y-4 bg-gray-50/30">
          {/* Open Campus - All activities proceeding */}
          {!isAffected && (
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-status-open flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {labels?.openStatusMessage || 'All activities are proceeding as scheduled'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {labels?.openStatusSubtext || 'No cancellations or modifications at this time'}
                </p>
              </div>
            </div>
          )}

          {/* Expected Resume Time - Affected campuses only */}
          {isAffected && campus.expectedResumeTime && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                Expected to Resume
              </h4>
              <p className="text-sm text-gray-700 font-medium">
                {campus.expectedResumeTime}
              </p>
            </div>
          )}

          {/* Affected Activities - Affected campuses only */}
          {isAffected && campus.affectedServices && campus.affectedServices.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Affected Activities
              </h4>
              <ul className="space-y-1.5">
                {campus.affectedServices.map((service, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full flex-shrink-0',
                        service.status === 'cancelled' && 'bg-status-closed',
                        service.status === 'modified' && 'bg-status-modified',
                        service.status === 'delayed' && 'bg-status-modified'
                      )}
                    />
                    <span className="text-gray-700">
                      {service.name}
                      {service.details && (
                        <span className="text-gray-500"> - {service.details}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Updates - Affected campuses only */}
          {isAffected && campus.updates && campus.updates.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Updates
              </h4>
              <ul className="space-y-2">
                {campus.updates.map((update, idx) => (
                  <li key={idx} className="text-sm">
                    <span className="text-gray-400 text-xs">{update.timestamp}</span>
                    <p className="text-gray-700 mt-0.5">{update.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
