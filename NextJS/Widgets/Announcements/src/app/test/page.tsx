'use client';

import { useEffect, useState } from 'react';
import { AnnouncementsGrid } from '@/components/AnnouncementsGrid';
import { AnnouncementsData } from '@/lib/types';

export default function TestPage() {
  const [churchWideCount, setChurchWideCount] = useState(3);
  const [campusCount, setCampusCount] = useState(3);
  const [mode, setMode] = useState<'grid' | 'carousel'>('grid');

  // Generate mock announcement
  const generateAnnouncement = (id: number, hasImage: boolean = true) => ({
    ID: id,
    Title: `Test Announcement ${id}`,
    Image: hasImage ? 'https://my.woodsidebible.org/ministryplatformapi/api.svc/rst/getfile?dn=14AC825E-C4B1-4BF7-BFBC-07B1D0DE2A03&fn=1115A9AF-2913-472E-BA10-9A8B66B52764.jpg' : undefined,
    Body: `This is test announcement number ${id}`,
    CallToAction: {
      Link: 'https://woodsidebible.org',
      Heading: `Test Heading ${id}`,
      SubHeading: `This is a test subheading for announcement ${id}`,
    },
  });

  // Generate mock data based on counts
  const generateMockData = (): AnnouncementsData => {
    const churchWide = Array.from({ length: churchWideCount }, (_, i) =>
      generateAnnouncement(i + 1, i % 3 !== 0) // Every 3rd card has no image
    );

    const campusAnnouncements = Array.from({ length: campusCount }, (_, i) =>
      generateAnnouncement(i + 100, i % 4 !== 0) // Every 4th card has no image
    );

    return {
      ChurchWide: churchWide,
      Campus: campusCount > 0 ? {
        Name: 'Central',
        Announcements: campusAnnouncements,
      } : null,
    };
  };

  const [data, setData] = useState<AnnouncementsData>(generateMockData());

  useEffect(() => {
    setData(generateMockData());
  }, [churchWideCount, campusCount]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Test Controls */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Announcements Grid Test</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Church-wide count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Church-wide Cards: {churchWideCount}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={churchWideCount}
                onChange={(e) => setChurchWideCount(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>10</span>
              </div>
            </div>

            {/* Campus count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campus Cards: {campusCount}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={campusCount}
                onChange={(e) => setCampusCount(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>10</span>
              </div>
            </div>

            {/* Mode toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('grid')}
                  className={`px-4 py-2 rounded ${
                    mode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setMode('carousel')}
                  className={`px-4 py-2 rounded ${
                    mode === 'carousel'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Carousel
                </button>
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Presets:</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setChurchWideCount(1); setCampusCount(0); }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                1 Church-wide
              </button>
              <button
                onClick={() => { setChurchWideCount(2); setCampusCount(2); }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                2 + 2
              </button>
              <button
                onClick={() => { setChurchWideCount(3); setCampusCount(3); }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                3 + 3
              </button>
              <button
                onClick={() => { setChurchWideCount(4); setCampusCount(0); }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                4 Church-wide
              </button>
              <button
                onClick={() => { setChurchWideCount(5); setCampusCount(5); }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                5 + 5
              </button>
              <button
                onClick={() => { setChurchWideCount(10); setCampusCount(10); }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                10 + 10
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements Grid */}
      <div className="max-w-7xl mx-auto p-4">
        <AnnouncementsGrid data={data} mode={mode} />
      </div>
    </div>
  );
}
