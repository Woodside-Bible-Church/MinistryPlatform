'use client';

import { useState, useMemo, useEffect } from 'react';
import { CampusCard } from '@/components/CampusCard';
import { formatDateTime } from '@/lib/utils';
import type { CancellationsData } from '@/lib/types';

// Mock data - will be replaced with API call later
const mockData: CancellationsData = {
  lastUpdated: new Date().toISOString(),
  alertTitle: 'Winter Weather Advisory',
  alertMessage: 'Due to hazardous road conditions from winter weather, several church activities have been affected. Please check your campus status below before traveling.',
  campuses: [
    {
      id: 1,
      name: 'Algonac',
      address: '419 Michigan St, Algonac, MI 48001',
      status: 'open',
    },
    {
      id: 2,
      name: 'Chesterfield',
      address: '26950 23 Mile Rd, Chesterfield, MI 48051',
      status: 'open',
    },
    {
      id: 3,
      name: 'Detroit',
      address: '80 W Alexandrine, Detroit, MI 48201',
      status: 'open',
    },
    {
      id: 4,
      name: 'Downriver',
      address: '18050 Quarry Rd, Riverview, MI 48193',
      status: 'open',
    },
    {
      id: 5,
      name: 'Farmington Hills',
      address: '28301 Middlebelt Rd, Farmington Hills, MI 48334',
      status: 'closed',
      reason: 'Hazardous road conditions due to ice storm',
      expectedResumeTime: 'Wednesday, January 29 at 9:00 AM',
      affectedServices: [
        { name: 'Sunday Services', status: 'cancelled' },
        { name: 'Student Ministries', status: 'cancelled' },
        { name: 'Kids Ministry', status: 'cancelled' },
        { name: 'Office Hours', status: 'cancelled', details: 'Staff working remotely' },
      ],
      updates: [
        { timestamp: 'Jan 25, 2:30 PM', message: 'We encourage you to join us online for our worship service. Stay safe and warm!' },
        { timestamp: 'Jan 25, 8:00 AM', message: 'Campus closed due to overnight ice storm. All morning activities cancelled.' },
      ],
    },
    {
      id: 6,
      name: 'Lake Orion',
      address: '2500 Joslyn Rd, Lake Orion, MI 48360',
      status: 'open',
    },
    {
      id: 7,
      name: 'Lapeer',
      address: '148 Maple Grove Rd, Lapeer, MI 48446',
      status: 'open',
    },
    {
      id: 8,
      name: 'Plymouth',
      address: '42021 E. Ann Arbor Tr, Plymouth, MI 48170',
      status: 'open',
    },
    {
      id: 9,
      name: 'Pontiac',
      address: '830 Auburn Ave, Pontiac, MI 48342',
      status: 'modified',
      reason: 'Limited parking due to snow removal',
      expectedResumeTime: 'Normal operations resume Monday',
      affectedServices: [
        { name: 'Sunday 9:00 AM Service', status: 'cancelled' },
        { name: 'Sunday 11:00 AM Service', status: 'modified', details: 'Proceeding as scheduled' },
        { name: 'Kids Ministry', status: 'modified', details: 'Available at 11 AM only' },
      ],
      updates: [
        { timestamp: 'Jan 25, 10:00 AM', message: 'We are holding our 11:00 AM service only. Please allow extra time for parking.' },
      ],
    },
    {
      id: 10,
      name: 'Romeo',
      address: '7800 W 32 Mile Rd, Washington, MI 48095',
      status: 'open',
    },
    {
      id: 11,
      name: 'Royal Oak',
      address: '3620 Rochester Rd, Royal Oak, MI 48073',
      status: 'open',
    },
    {
      id: 12,
      name: 'Troy',
      address: '6600 Rochester Rd, Troy, MI 48085',
      status: 'closed',
      reason: 'Power outage affecting the building',
      expectedResumeTime: 'Pending power restoration - check back for updates',
      affectedServices: [
        { name: 'All Services', status: 'cancelled' },
        { name: 'Office Hours', status: 'cancelled' },
      ],
      updates: [
        { timestamp: 'Jan 25, 11:00 AM', message: 'DTE is working to restore power. We will update this page as soon as we have more information.' },
      ],
    },
    {
      id: 13,
      name: 'Troy Español',
      address: '6600 Rochester Rd, Troy, MI 48085 (The Garage)',
      status: 'closed',
      reason: 'Power outage affecting the building',
      expectedResumeTime: 'Pending power restoration - check back for updates',
      affectedServices: [
        { name: 'All Services', status: 'cancelled' },
      ],
      updates: [
        { timestamp: 'Jan 25, 11:00 AM', message: 'DTE is working to restore power. We will update this page as soon as we have more information.' },
      ],
    },
    {
      id: 14,
      name: 'Warren',
      address: '27300 Hoover Rd, Warren, MI 48093',
      status: 'modified',
      reason: 'Weather conditions improving',
      expectedResumeTime: 'Full schedule resumes Sunday',
      affectedServices: [
        { name: 'Wednesday Night Activities', status: 'cancelled' },
        { name: 'Sunday Services', status: 'modified', details: 'Delayed start - 10:30 AM' },
      ],
      updates: [
        { timestamp: 'Jan 25, 9:00 AM', message: 'Sunday services will start at 10:30 AM instead of our normal times. Thank you for your flexibility.' },
      ],
    },
    {
      id: 15,
      name: 'White Lake',
      address: '9000 Highland Rd, White Lake, MI 48386',
      status: 'open',
    },
  ],
};

export default function CancellationsPage() {
  const [data] = useState<CancellationsData>(mockData);
  const [selectedCampus, setSelectedCampus] = useState<string>('Troy');
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Simulate loading for demo (will be replaced with actual API call)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Wait a frame to ensure the DOM is ready, then start transition
      requestAnimationFrame(() => {
        setIsTransitioning(true);
        setLoading(false);
      });
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Get unique campus names for dropdown
  const campusNames = useMemo(() => {
    return [...data.campuses].sort((a, b) => a.name.localeCompare(b.name)).map(c => c.name);
  }, [data.campuses]);

  // Filter and sort campuses
  const filteredCampuses = useMemo(() => {
    let campuses = [...data.campuses];
    campuses = campuses.filter(c => c.name === selectedCampus);
    return campuses.sort((a, b) => a.name.localeCompare(b.name));
  }, [data.campuses, selectedCampus]);

  const hasAffectedCampuses = data.campuses.some(c => c.status !== 'open');

  // Woodside logo element - same pattern as Announcements widget
  // Starts centered during loading, transitions to top-right corner
  const logoElement = (
    <div
      className="hidden md:block absolute transition-all ease-out pointer-events-none"
      style={{
        top: loading && !isTransitioning ? '1.5rem' : '1rem',
        width: loading && !isTransitioning ? '200px' : '275px',
        height: loading && !isTransitioning ? '200px' : '275px',
        right: loading && !isTransitioning ? 'calc(50% - 100px)' : '2rem',
        opacity: loading && !isTransitioning ? 0.15 : 0.08,
        transitionDuration: '0.8s',
        zIndex: loading ? 50 : 0
      }}
    >
      <div className="relative w-full h-full">
        {/* Spinning loading circle - only visible during loading, fades out with opacity */}
        <div
          className="absolute inset-0 animate-spin transition-opacity"
          style={{
            animationDuration: '2s',
            opacity: loading && !isTransitioning ? 0.3 : 0,
            transitionDuration: '0.8s'
          }}
        >
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="70 200"
              strokeLinecap="round"
              className="text-primary"
            />
          </svg>
        </div>

        {/* Woodside logo */}
        <div className="w-full h-full p-4">
          <svg
            viewBox="0 0 822.73 822.41"
            className="w-full h-full text-primary"
          >
            <path d="M482.59,292.96c-28.5,75.56-63.52,148.62-91.88,224.24-22.85,60.93-44.5,165.54,5.99,218.03,53.19,55.31,103.27-36.03,126.36-76.12,29.77-51.67,60.19-102.91,92.51-153.1,37.77-58.65,82.78-117.18,128.05-170.34,17.33-20.35,35.58-39.9,55.18-58.05,1.32-.3,1.67.72,2.19,1.61,2.7,4.68,6.16,19.72,7.79,25.79,55.59,207.53-59.67,424.44-261.39,494.49-162.86,56.55-343.5,6.03-452.97-125.71l.02-2.82c22.1-29.38,43.34-59.51,66.31-88.22,46.87-58.59,104.84-117,159.18-168.95,39.21-37.49,94.79-86.04,141.88-112.38,2.97-1.66,18.74-10.3,20.79-8.46Z" fill="currentColor"/>
            <path d="M454.78,615.29c-.4-37.26,12.31-73.93,23.96-108.91,21.35-64.11,58.46-144.93,65.26-211.05,10.09-98.15-75.84-54.82-121.59-23.71-87.22,59.32-157.97,140.42-238.72,207.44-1.08.9-1.56,2.33-3.36,1.91,29.91-61.5,79.75-118.22,92.63-187.03,26.62-142.2-143-109.97-223.13-77.75-1.54-1.51,19.5-33.71,21.85-37.14C170.36,35.21,348.48-31.19,518.31,14.05c111.97,29.83,206.98,107.78,259.7,210.54l-1.23,3.19c-101.38,85.68-182.57,188.93-258.5,297.03-21.17,30.14-40.81,61.47-63.5,90.48Z" fill="currentColor"/>
            <path d="M38.3,581.71c-6.2-9.05-10.4-20.99-14.14-31.42C-1.72,478.2-6.79,400.44,8.86,325.38c1.73-8.3,5.99-29.98,9.5-36.56,1.25-2.35,11.96-9.93,14.86-12.01,41.76-29.96,121.9-63.33,173.22-50.74,49.51,12.15,15.29,70.69-.39,97.86-34.22,59.31-78.86,114.75-116.32,172.48-18.06,27.83-35.65,56.1-51.43,85.3Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
    </div>
  );

  // Loading state - matches Announcements widget pattern
  if (loading) {
    return (
      <div className="relative p-8">
        {logoElement}
        <div className="min-h-[60vh]"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {logoElement}

      {/* Main Content Container */}
      <div>
        {/* Header - matches Announcements typography exactly */}
        <div className="pb-6 md:pb-0 mb-4 md:mb-8 px-2 md:px-0 relative overflow-visible animate-[fadeInFromRight_1.25s_ease-out_0s_both]">
          <div className="flex-1 min-w-0 text-right">
            <div className="text-sm md:text-base font-normal text-gray-400 uppercase tracking-widest flex items-center justify-end gap-2">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-amber-500 animate-pulse"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {data.alertTitle || 'Weather Advisory'}
            </div>
            <h1 className="text-3xl md:text-7xl lg:text-8xl font-bold tracking-tighter">
              Cancellations
            </h1>
          </div>
        </div>

        {/* Alert Message - Centered and separated */}
        {data.alertMessage && hasAffectedCampuses && (
          <div
            className="mb-8 md:mb-10 text-center animate-[fadeInUp_0.8s_ease-out_0.5s_both]"
          >
            <p className="text-sm md:text-base font-normal text-gray-400 uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
              {data.alertMessage}
            </p>
          </div>
        )}

        {/* Campus Card */}
        <div className="px-2 md:px-0">
          {filteredCampuses.map((campus, index) => (
            <div
              key={campus.id}
              style={{
                animation: `cardSlideIn 0.8s ease-out ${0.8 + (index * 0.3)}s both`
              }}
            >
              <CampusCard
                campus={campus}
                campusNames={campusNames}
                selectedCampus={selectedCampus}
                onCampusChange={setSelectedCampus}
              />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCampuses.length === 0 && (
          <div className="text-center py-12 text-gray-500 px-2 md:px-0">
            No campuses match the selected filters.
          </div>
        )}

        {/* Last Updated */}
        <div
          className="mt-8 text-center text-sm text-gray-400 px-2 md:px-0"
          style={{ animation: 'fadeInUp 0.5s ease-out 1.5s both' }}
        >
          <p>
            This page refreshes automatically. Check back for the latest updates.
          </p>
          <p className="mt-1">
            Last updated: {formatDateTime(data.lastUpdated)}
          </p>
        </div>
      </div>
    </div>
  );
}
