"use client";

export default function SkeletonLoader({ count = 6 }: { count?: number }) {
  return (
    <div className="serveGrid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="eventCard skel-card">
          <div className="eventCardHero">
            <div className="skel eventCardImage" style={{ aspectRatio: '16/9' }}></div>
            <div className="eventCardOverlay" style={{ position: 'relative' }}>
              <div className="skel h-28 w-60" style={{ marginBottom: '0.5rem' }}></div>
              <div className="skel h-16 w-50" style={{ marginBottom: '0.3rem' }}></div>
              <div className="skel h-16 w-35"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
