'use client';

import React, { useRef, useEffect, useState } from 'react';
import { AnnouncementsData, AnnouncementsLabels } from '@/lib/types';
import { AnnouncementCard } from './AnnouncementCard';

interface AnnouncementsGridProps {
  data: AnnouncementsData;
  mode?: 'grid' | 'carousel';
  labels?: AnnouncementsLabels;
}

export function AnnouncementsGrid({ data, mode = 'grid', labels = {} }: AnnouncementsGridProps) {
  const hasChurchWide = data.ChurchWide && data.ChurchWide.length > 0;
  const hasCampus = data.Campus && data.Campus.Announcements && data.Campus.Announcements.length > 0;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  const isCarousel = mode === 'carousel';

  // Track scroll progress for carousel mode
  useEffect(() => {
    if (!isCarousel || !scrollContainerRef.current) return;

    const scrollContainer = scrollContainerRef.current;

    const checkOverflow = () => {
      const hasScroll = scrollContainer.scrollWidth > scrollContainer.clientWidth;
      setHasOverflow(hasScroll);
    };

    const updateProgress = () => {
      checkOverflow();

      if (progressBarRef.current) {
        const scrollLeft = scrollContainer.scrollLeft;
        const scrollWidth = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        const scrollPercentage = scrollWidth > 0 ? scrollLeft / scrollWidth : 0;

        // Show a minimum of 5% progress to indicate the progress bar exists
        const displayPercentage = Math.max(0.05, scrollPercentage);

        progressBarRef.current.style.transform = `scaleX(${displayPercentage})`;
      }
    };

    scrollContainer.addEventListener('scroll', updateProgress);
    window.addEventListener('resize', checkOverflow);
    updateProgress(); // Initial update

    return () => {
      scrollContainer.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [isCarousel]);

  if (!hasChurchWide && !hasCampus) {
    return (
      <div className="my-6 md:my-10 p-6 bg-gray-50 text-primary/65 text-center rounded">
        No announcements to show.
      </div>
    );
  }

  return (
    <div className={isCarousel ? 'relative px-8 pt-8 pb-2 mt-8' : ''}>
      {isCarousel && (
        <div className="flex justify-between items-center pb-8 mb-4">
          <div>
            <div className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-1">
              {labels.carouselHeading1 || 'Upcoming'}
            </div>
            <h2 className="text-4xl font-bold">{labels.carouselHeading2 || 'at Woodside'}</h2>
          </div>
          <a
            href="https://woodsidebible.org/Announcements"
            className="inline-block min-w-[160px] px-[10px] py-[15px] border-[3px] border-solid font-bold text-sm leading-none uppercase text-center no-underline"
            style={{
              backgroundColor: '#62bb46',
              borderColor: '#62bb46',
              color: '#fff',
              transition: 'background .3s, color .3s, border-color .3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#62bb46';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#62bb46';
              e.currentTarget.style.color = '#fff';
            }}
          >
            {labels.viewAllButton || 'View All Announcements'}
          </a>
        </div>
      )}

      <div ref={scrollContainerRef} className={isCarousel ? 'overflow-x-auto scrollbar-hide' : ''}>
        <div className={isCarousel ? 'inline-flex' : 'block'}>
          {/* Church-wide Featured Announcements */}
          {hasChurchWide && (
            <>
              {!isCarousel && (
                <h2 className="my-8 md:my-4 font-bold text-xl leading-tight tracking-wide text-secondary">
                  {labels.churchWideTitle || 'Happening At Woodside'}
                </h2>
              )}
              {isCarousel && (
                <h2
                  className="text-[clamp(0.65rem,1.5vw,1rem)] text-primary/65 opacity-65 pr-6"
                  style={{
                    writingMode: 'sideways-lr',
                    textOrientation: 'sideways',
                    textAlign: 'end',
                  }}
                >
                  {labels.churchWideTitle || 'Happening At Woodside'}
                </h2>
              )}
              <div
                className={
                  isCarousel
                    ? 'grid gap-6 pb-8'
                    : (() => {
                        const count = data.ChurchWide.length;
                        if (count === 1) return 'grid gap-3 md:gap-4 grid-cols-1';
                        if (count === 2) return 'grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2';
                        if (count === 3) return 'grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-6 md:grid-rows-2';
                        if (count === 4) return 'grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2';
                        if (count === 5) return 'grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-6';
                        // 6+ announcements: masonry-style grid
                        return 'grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-3';
                      })()
                }
                style={
                  isCarousel
                    ? {
                        gridTemplateAreas:
                          data.ChurchWide.length === 1 ? '"i1" "d1"' :
                          data.ChurchWide.length === 2 ? '"i1 i2" "d1 d2"' :
                          '"i1 i2 i3" "d1 d2 d3"',
                        gridTemplateColumns: `repeat(${Math.min(data.ChurchWide.length, 3)}, clamp(250px, 50vw, 400px))`,
                        gridTemplateRows: 'auto auto',
                        rowGap: '0.75rem',
                      }
                    : {}
                }
              >
                {(isCarousel ? data.ChurchWide.slice(0, 3) : data.ChurchWide).map((announcement, index) => {
                  const heading = announcement.CallToAction?.Heading || announcement.Title;
                  const subHeading = announcement.CallToAction?.SubHeading || announcement.Body;
                  const hasLink = announcement.CallToAction?.Link;

                  if (isCarousel) {
                    return (
                      <div key={announcement.ID} className="contents">
                        {/* Image */}
                        <a
                          href={hasLink || '#'}
                          className="relative block aspect-video overflow-hidden"
                          aria-label={announcement.Title}
                          style={{
                            gridArea: index === 0 ? 'i1' : index === 1 ? 'i2' : 'i3',
                          }}
                        >
                          {announcement.Image ? (
                            <img
                              src={announcement.Image}
                              alt={announcement.Title}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-[650ms] ease-out hover:scale-[1.025]"
                            />
                          ) : (
                            <div
                              className="w-full h-full grid place-items-center p-4 md:p-7 outline outline-1 outline-white/95"
                              style={{
                                backgroundColor: '#62bb46',
                                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.15'/%3E%3Ccircle cx='12' cy='12' r='1' fill='%23ffffff' fill-opacity='0.25'/%3E%3C/svg%3E\")",
                                backgroundRepeat: 'repeat',
                                backgroundSize: '20px 20px',
                                outlineOffset: '-10px'
                              } as React.CSSProperties}
                            >
                              <span className="text-white font-extrabold uppercase leading-tight text-center text-xl md:text-3xl tracking-tight">
                                {announcement.Title}
                              </span>
                            </div>
                          )}
                        </a>
                        {/* Text body */}
                        <a
                          href={hasLink || '#'}
                          className="p-2 flex flex-col overflow-hidden hover:underline"
                          style={{
                            gridArea: index === 0 ? 'd1' : index === 1 ? 'd2' : 'd3',
                            width: 'clamp(250px, 50vw, 400px)',
                          }}
                        >
                          <h3 className="font-extrabold leading-tight mb-0.5 line-clamp-1 text-[clamp(0.8rem,1vw,1rem)]">
                            {heading}
                          </h3>
                          {subHeading && (
                            <p className="text-primary/65 leading-snug line-clamp-2 text-[clamp(0.75rem,0.9vw,0.8rem)] m-0 p-0">
                              {subHeading.replace(/<[^>]*>/g, '').trim().substring(0, 140)}
                            </p>
                          )}
                        </a>
                      </div>
                    );
                  }

                  // Dynamic bento-box style grid with varied card sizes
                  const count = data.ChurchWide.length;
                  let cardClass = '';

                  if (!isCarousel) {
                    if (count === 2) {
                      // 2-column grid: equal width cards
                      cardClass = '';
                    } else if (count === 3) {
                      // 6-column, 2-row grid: [4x2] + [2x1] + [2x1]
                      // First card is wider (4 cols) = taller at 16:9, spans 2 rows
                      // Other cards are narrower (2 cols) = shorter at 16:9, 1 row each
                      // Math: 4*(9/16) = 2.25, and 2*(2*(9/16)) = 2*1.125 = 2.25 ✓
                      if (index === 0) cardClass = 'md:col-span-4 md:row-span-2';
                      else cardClass = 'md:col-span-2';
                    } else if (count === 4) {
                      // 2-column, 2-row grid: all equal size
                      cardClass = '';
                    } else if (count === 5) {
                      // 6-column grid: 2 + 2 + 2 + 3 + 3
                      if (index < 3) cardClass = 'md:col-span-2';
                      else cardClass = 'md:col-span-3';
                    }
                  }

                  return (
                    <div key={announcement.ID} className={cardClass}>
                      <AnnouncementCard
                        announcement={announcement}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Campus Announcements */}
          {hasCampus && (
            <>
              {!isCarousel && (
                <h2 className="my-8 md:my-4 font-bold text-xl leading-tight tracking-wide text-secondary">
                  {data.Campus!.Name || 'Campus'} {labels.campusAnnouncementsSuffix || 'Announcements'}
                </h2>
              )}
              {isCarousel && (
                <h2
                  className="text-[clamp(0.65rem,1.5vw,1rem)] text-primary/65 opacity-65 pr-6 ml-9"
                  style={{
                    writingMode: 'sideways-lr',
                    textOrientation: 'sideways',
                    textAlign: 'end',
                  }}
                >
                  {data.Campus!.Name || 'Campus'}
                </h2>
              )}
              <div
                className={
                  isCarousel
                    ? 'flex gap-6'
                    : 'flex flex-wrap gap-3 md:gap-4'
                }
              >
                {data.Campus!.Announcements.map((announcement) => {
                  if (isCarousel) {
                    const heading = announcement.CallToAction?.Heading || announcement.Title;
                    const subHeading = announcement.CallToAction?.SubHeading || announcement.Body;
                    const hasLink = announcement.CallToAction?.Link;

                    return (
                      <div key={announcement.ID} className="w-[clamp(250px,50vw,400px)] flex flex-col">
                        <a
                          href={hasLink || '#'}
                          className="relative block aspect-video overflow-hidden"
                          aria-label={announcement.Title}
                        >
                          {announcement.Image ? (
                            <img
                              src={announcement.Image}
                              alt={announcement.Title}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-[650ms] ease-out hover:scale-[1.025]"
                            />
                          ) : (
                            <div
                              className="w-full h-full grid place-items-center p-4 md:p-7 outline outline-1 outline-white/95"
                              style={{
                                backgroundColor: '#62bb46',
                                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.15'/%3E%3Ccircle cx='12' cy='12' r='1' fill='%23ffffff' fill-opacity='0.25'/%3E%3C/svg%3E\")",
                                backgroundRepeat: 'repeat',
                                backgroundSize: '20px 20px',
                                outlineOffset: '-10px'
                              } as React.CSSProperties}
                            >
                              <span className="text-white font-extrabold uppercase leading-tight text-center text-xl md:text-3xl tracking-tight">
                                {announcement.Title}
                              </span>
                            </div>
                          )}
                        </a>
                        <a
                          href={hasLink || '#'}
                          className="p-2 mt-3 flex flex-col overflow-hidden hover:underline"
                          style={{ width: 'clamp(250px, 50vw, 400px)' }}
                        >
                          <h3 className="font-extrabold leading-tight mb-0.5 line-clamp-1 text-[clamp(0.8rem,1vw,1rem)]">
                            {heading}
                          </h3>
                          {subHeading && (
                            <p className="text-primary/65 leading-snug line-clamp-2 text-[clamp(0.75rem,0.9vw,0.8rem)] m-0 p-0">
                              {subHeading.replace(/<[^>]*>/g, '').trim().substring(0, 140)}
                            </p>
                          )}
                        </a>
                      </div>
                    );
                  }

                  // Flexbox with consistent sizing - cards maintain same width across all rows
                  return (
                    <div key={announcement.ID} className="flex-1 min-w-[280px] max-w-[480px] md:min-w-[320px] md:max-w-[420px]">
                      <AnnouncementCard
                        announcement={announcement}
                      />
                    </div>
                  );
                })}
                {/* Invisible filler elements to prevent last row from growing */}
                {!isCarousel && Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={`filler-${i}`}
                    className="flex-1 min-w-[280px] max-w-[480px] md:min-w-[320px] md:max-w-[420px] h-0"
                    aria-hidden="true"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress bar for carousel mode */}
      {isCarousel && hasOverflow && (
        <div
          className="absolute left-8 right-8 bottom-1 h-1 bg-black/8 rounded-full overflow-hidden pointer-events-none z-20"
          aria-hidden="true"
        >
          <div
            ref={progressBarRef}
            className="h-full w-full bg-secondary origin-left transition-transform duration-[60ms] linear"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      )}
    </div>
  );
}
