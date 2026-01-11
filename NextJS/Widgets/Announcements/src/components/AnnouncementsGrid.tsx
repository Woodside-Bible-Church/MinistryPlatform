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
  const progressBarContainerRef = useRef<HTMLDivElement>(null);
  const churchWideSectionRef = useRef<HTMLDivElement>(null);
  const campusSectionRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showChurchWideHeader, setShowChurchWideHeader] = useState(true);
  const [showCampusHeader, setShowCampusHeader] = useState(false);

  const isCarousel = mode === 'carousel';

  // Handle click on progress bar to scroll to position
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current || !progressBarContainerRef.current) return;

    const rect = progressBarContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;

    const scrollContainer = scrollContainerRef.current;
    const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    const targetScroll = maxScroll * percentage;

    scrollContainer.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  // Scroll left by viewport width
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
    scrollContainerRef.current.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });
  };

  // Scroll right by viewport width
  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
    scrollContainerRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };

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

      const scrollLeft = scrollContainer.scrollLeft;
      const scrollWidth = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      const scrollPercentage = scrollWidth > 0 ? scrollLeft / scrollWidth : 0;

      // Update progress bar
      if (progressBarRef.current) {
        // Show a minimum of 5% progress to indicate the progress bar exists
        const displayPercentage = Math.max(0.05, scrollPercentage);
        progressBarRef.current.style.transform = `scaleX(${displayPercentage})`;
      }

      // Update arrow visibility
      setCanScrollLeft(scrollLeft > 10); // Show left arrow if scrolled more than 10px
      setCanScrollRight(scrollLeft < scrollWidth - 10); // Show right arrow if not at end

      // Update sticky header visibility based on section visibility
      if (churchWideSectionRef.current && campusSectionRef.current) {
        const churchWideRect = churchWideSectionRef.current.getBoundingClientRect();
        const campusRect = campusSectionRef.current.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();

        const churchWideVisible = churchWideRect.left < containerRect.right && churchWideRect.right > containerRect.left;
        const campusVisible = campusRect.left < containerRect.right && campusRect.right > containerRect.left;

        // Only show one header at a time - prioritize campus when both are visible
        // On desktop, show campus header when campus section is at least 40% in view
        const campusInViewAmount = Math.min(containerRect.right, campusRect.right) - Math.max(containerRect.left, campusRect.left);
        const campusInViewPercent = campusInViewAmount / containerRect.width;

        if (campusVisible && campusInViewPercent > 0.4) {
          setShowChurchWideHeader(false);
          setShowCampusHeader(true);
        } else if (churchWideVisible) {
          setShowChurchWideHeader(true);
          setShowCampusHeader(false);
        } else {
          setShowChurchWideHeader(churchWideVisible);
          setShowCampusHeader(campusVisible);
        }
      } else if (churchWideSectionRef.current) {
        setShowChurchWideHeader(true);
        setShowCampusHeader(false);
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
    <div>
      {/* Main heading - shows for both carousel and grid modes */}
      <div className={isCarousel ? 'pb-4 md:pb-8 mb-2 md:mb-4 px-2 md:px-0' : 'pb-6 md:pb-0 mb-4 md:mb-8 px-2 md:px-0 relative overflow-visible animate-[fadeInDown_1.25s_ease-out_0s_both]'}>
        {/* Background Woodside logo is now rendered by the loading state transition - no static logo needed */}
        {/* Header with heading and navigation arrows */}
        <div className="flex justify-between items-center gap-3 md:mb-0 relative z-10">
          <div className={isCarousel ? 'flex-1 min-w-0' : 'flex-1 min-w-0 text-right'}>
            <div className={isCarousel ? 'text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wide mb-0.5 md:mb-1' : 'text-sm md:text-base font-normal text-gray-400 uppercase tracking-widest'}>
              {labels.carouselHeading1 || 'Stay in the know'}
            </div>
            <h1 className={isCarousel ? 'text-xl md:text-4xl font-bold truncate' : 'text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter'}>
              {labels.carouselHeading2 || 'Announcements'}
            </h1>
          </div>
          {/* Navigation arrows visible on desktop only - carousel mode only */}
          {isCarousel && hasOverflow && (
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className={`w-10 h-10 flex items-center justify-center rounded-full border border-black/10 transition-all duration-200 ${
                  canScrollLeft
                    ? 'bg-white/90 hover:bg-white hover:scale-110'
                    : 'bg-gray-100 opacity-40 cursor-not-allowed'
                }`}
                aria-label="Scroll left"
              >
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                className={`w-10 h-10 flex items-center justify-center rounded-full border border-black/10 transition-all duration-200 ${
                  canScrollRight
                    ? 'bg-white/90 hover:bg-white hover:scale-110'
                    : 'bg-gray-100 opacity-40 cursor-not-allowed'
                }`}
                aria-label="Scroll right"
              >
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sticky section headers for carousel - mobile only */}
      {isCarousel && showChurchWideHeader && (
        <h2 className="md:hidden sticky top-0 left-0 right-0 bg-white dark:bg-[#1c2b39] z-20 py-3 pr-4 text-xs font-medium text-primary/60 dark:text-white/60 uppercase tracking-wide transition-opacity duration-200">
          {labels.churchWideTitle || 'Happening At Woodside'}
        </h2>
      )}
      {isCarousel && showCampusHeader && (
        <h2 className="md:hidden sticky top-0 left-0 right-0 bg-white dark:bg-[#1c2b39] z-20 py-3 pr-4 text-xs font-medium text-primary/60 dark:text-white/60 uppercase tracking-wide transition-opacity duration-200">
          {data.Campus!.Name || 'Campus'}
        </h2>
      )}

      <div ref={scrollContainerRef} className={isCarousel ? 'overflow-x-auto scrollbar-hide snap-x snap-mandatory' : ''}>
        <div className={isCarousel ? 'inline-flex' : 'block'}>
          {/* Church-wide Featured Announcements */}
          {hasChurchWide && (
            <div ref={churchWideSectionRef}>
              {!isCarousel && (
                <h2 className="mb-4 md:mb-6 text-lg md:text-3xl lg:text-4xl font-bold text-primary dark:text-white uppercase tracking-tight animate-[fadeInDown_1.25s_ease-out_0.3s_both]">
                  {labels.churchWideTitle || 'Happening At Woodside'}
                </h2>
              )}
              {isCarousel && (
                <h2 className="hidden md:block mb-4 text-sm font-semibold text-primary/80 dark:text-white/80 uppercase tracking-wide">
                  {labels.churchWideTitle || 'Happening At Woodside'}
                </h2>
              )}
              <div
                className={
                  isCarousel
                    ? 'grid gap-6 pb-2 md:pb-8'
                    : (() => {
                        const count = data.ChurchWide.length;
                        if (count === 1) return 'grid gap-3 md:gap-4 grid-cols-1 animate-[fadeInUp_1.25s_ease-out_0.4s_both]';
                        if (count === 2) return 'grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 animate-[fadeInUp_1.25s_ease-out_0.4s_both]';
                        if (count === 3) return 'grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-6 md:grid-rows-2 animate-[fadeInUp_1.25s_ease-out_0.4s_both]';
                        if (count === 4) return 'grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 animate-[fadeInUp_1.25s_ease-out_0.4s_both]';
                        if (count === 5) return 'grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-6 animate-[fadeInUp_1.25s_ease-out_0.4s_both]';
                        // 6+ announcements: masonry-style grid
                        return 'grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-3 animate-[fadeInUp_1.25s_ease-out_0.4s_both]';
                      })()
                }
                style={
                  isCarousel
                    ? {
                        gridTemplateAreas:
                          data.ChurchWide.length === 1 ? '"i1" "d1"' :
                          data.ChurchWide.length === 2 ? '"i1 i2" "d1 d2"' :
                          '"i1 i2 i3" "d1 d2 d3"',
                        gridTemplateColumns: `repeat(${Math.min(data.ChurchWide.length, 3)}, clamp(260px, 70vw, 400px))`,
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
                      <div key={announcement.ID} className="contents snap-start">
                        {/* Image */}
                        <a
                          href={hasLink || '#'}
                          className="relative block aspect-video overflow-hidden carousel-snap-item snap-start"
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
                                backgroundColor: '#1c2b39',
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
                            width: 'clamp(260px, 70vw, 400px)',
                          }}
                        >
                          <h3 className="font-extrabold leading-tight mb-0.5 line-clamp-1 text-[clamp(0.8rem,1vw,1rem)] text-primary dark:text-white">
                            {heading}
                          </h3>
                          {subHeading && (
                            <p className="text-primary/65 dark:text-white/70 leading-snug line-clamp-2 text-[clamp(0.75rem,0.9vw,0.8rem)] m-0 p-0">
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
            </div>
          )}

          {/* Campus Announcements */}
          {hasCampus && (
            <div ref={campusSectionRef} className={isCarousel ? 'ml-6' : 'mt-12 md:mt-16'}>
              {!isCarousel && (
                <h2 className="mb-4 md:mb-6 text-lg md:text-3xl lg:text-4xl font-bold text-primary dark:text-white uppercase tracking-tight animate-[fadeInDown_1.25s_ease-out_0.3s_both]">
                  {data.Campus!.Name || 'Campus'}
                </h2>
              )}
              {isCarousel && (
                <h2 className="hidden md:block mb-4 text-sm font-semibold text-primary/80 dark:text-white/80 uppercase tracking-wide">
                  {data.Campus!.Name || 'Campus'}
                </h2>
              )}
              <div
                className={
                  isCarousel
                    ? 'flex gap-6'
                    : 'flex flex-wrap gap-3 md:gap-4 animate-[fadeInUp_1.25s_ease-out_0.4s_both]'
                }
              >
                {data.Campus!.Announcements.map((announcement) => {
                  if (isCarousel) {
                    const heading = announcement.CallToAction?.Heading || announcement.Title;
                    const subHeading = announcement.CallToAction?.SubHeading || announcement.Body;
                    const hasLink = announcement.CallToAction?.Link;

                    return (
                      <div key={announcement.ID} className="w-[clamp(260px,70vw,400px)] flex flex-col snap-start">
                        <a
                          href={hasLink || '#'}
                          className="relative block aspect-video overflow-hidden carousel-snap-item"
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
                                backgroundColor: '#1c2b39',
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
                          style={{ width: 'clamp(260px, 70vw, 400px)' }}
                        >
                          <h3 className="font-extrabold leading-tight mb-0.5 line-clamp-1 text-[clamp(0.8rem,1vw,1rem)] text-primary dark:text-white">
                            {heading}
                          </h3>
                          {subHeading && (
                            <p className="text-primary/65 dark:text-white/70 leading-snug line-clamp-2 text-[clamp(0.75rem,0.9vw,0.8rem)] m-0 p-0">
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
            </div>
          )}
        </div>
      </div>

      {/* Progress bar for carousel mode */}
      {isCarousel && hasOverflow && (
        <div>
          <div
            ref={progressBarContainerRef}
            onClick={handleProgressBarClick}
            className="cursor-pointer py-2"
            aria-label="Scroll to position"
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-1 bg-black/8 rounded-full overflow-hidden">
              <div
                ref={progressBarRef}
                className="h-full w-full bg-secondary origin-left transition-transform duration-[60ms] linear pointer-events-none"
                style={{ transform: 'scaleX(0)' }}
              />
            </div>
          </div>

          {/* Desktop subtle link below progress bar */}
          <div className="hidden md:flex justify-end mt-3">
            <a
              href="https://woodsidebible.org/Announcements"
              className="flex items-center gap-1.5 text-base font-semibold text-primary/70 dark:text-white/70 hover:text-primary dark:hover:text-white transition-colors duration-200 group uppercase tracking-wide"
            >
              <span>{labels.viewAllButton || 'View All Announcements'}</span>
              <svg
                className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* Mobile button */}
      {isCarousel && (
        <a
          href="https://woodsidebible.org/Announcements"
          className="block md:hidden mt-6 px-[10px] py-[12px] border-[3px] border-solid font-bold text-xs leading-none uppercase text-center no-underline"
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
      )}
    </div>
  );
}
