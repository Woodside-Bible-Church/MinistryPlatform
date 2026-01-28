'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AnnouncementsData, AnnouncementsLabels } from '@/lib/types';
import { AnnouncementCard } from './AnnouncementCard';
import { QuickLinks } from './QuickLinks';

interface AnnouncementsGridProps {
  data: AnnouncementsData;
  mode?: 'grid' | 'carousel' | 'social';
  labels?: AnnouncementsLabels;
}

// Check if URL is a bible.com link
function isBibleComLink(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'bible.com' || urlObj.hostname === 'www.bible.com';
  } catch {
    return false;
  }
}

// Convert bible.com URLs to youversion:// deep links where applicable
function getBibleAppDeepLink(url: string): string {
  try {
    const urlObj = new URL(url);

    // Check for event URLs: bible.com/events/123456
    const eventMatch = urlObj.pathname.match(/^\/events\/(\d+)/);
    if (eventMatch) {
      return `youversion://events?id=${eventMatch[1]}`;
    }

    // For other bible.com URLs (passages, etc.), return the original URL
    // as it works as a universal link
    return url;
  } catch {
    return url;
  }
}

// Modal for opening links in different browsers (mobile only)
function LinkOptionsModal({
  url,
  onClose
}: {
  url: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isBibleLink = isBibleComLink(url);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    }
  };

  const handleOpenInChrome = () => {
    // Convert https:// to googlechromes:// for Chrome on iOS
    const chromeUrl = url.replace(/^https:\/\//, 'googlechromes://').replace(/^http:\/\//, 'googlechrome://');
    window.location.href = chromeUrl;
    onClose();
  };

  const handleOpenInFirefox = () => {
    // Firefox iOS URL scheme
    const firefoxUrl = `firefox://open-url?url=${encodeURIComponent(url)}`;
    window.location.href = firefoxUrl;
    onClose();
  };

  const handleOpenInInstagram = () => {
    // Just navigate in the current context (Instagram's browser)
    window.top?.location.assign(url);
    onClose();
  };

  const handleOpenInBibleApp = () => {
    // Convert to youversion:// deep link for events, use universal link for passages
    const deepLink = getBibleAppDeepLink(url);
    window.location.href = deepLink;
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl p-4 pb-8 animate-[slideUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />

        {/* URL Preview */}
        <div className="text-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate px-4">{url}</p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2">
          {/* Bible App option - shown first for bible.com links */}
          {isBibleLink && (
            <button
              onClick={handleOpenInBibleApp}
              className="flex items-center gap-3 w-full p-4 rounded-xl bg-[#0a0a0a] hover:bg-[#1a1a1a] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                {/* Book/Bible icon */}
                <svg className="w-6 h-6 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <span className="font-medium text-white">Open in Bible App</span>
            </button>
          )}

          <button
            onClick={handleOpenInChrome}
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm">
              <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
                <path d="M16.0005 2.00394C16.0005 2.00394 24.2527 1.63495 28.6278 9.90002H15.2983C15.2983 9.90002 12.7828 9.81923 10.634 12.8601C10.0167 14.1364 9.3532 15.4511 10.0978 18.0422C9.02517 16.2315 4.40332 8.21246 4.40332 8.21246C4.40332 8.21246 7.66332 2.33069 16.0004 2.00394H16.0005Z" fill="#EF3F36"/>
                <path d="M28.1994 22.986C28.1994 22.986 24.3915 30.2938 15.0244 29.9325C16.1818 27.9373 21.691 18.4305 21.691 18.4305C21.691 18.4305 23.022 16.3008 21.4518 12.9256C20.6531 11.7531 19.8391 10.5268 17.2157 9.87324C19.3261 9.85413 28.6045 9.87324 28.6045 9.87324C28.6045 9.87324 32.0805 15.6281 28.1994 22.986Z" fill="#FCD900"/>
                <path d="M3.85931 23.0433C3.85931 23.0433 -0.588992 16.1044 4.41095 8.20068C5.56452 10.1959 11.0737 19.7027 11.0737 19.7027C11.0737 19.7027 12.262 21.917 15.9772 22.2475C17.3932 22.1437 18.8669 22.0553 20.7497 20.1217C19.7117 21.9516 15.0551 29.9476 15.0551 29.9476C15.0551 29.9476 8.31134 30.0706 3.8592 23.0433H3.85931Z" fill="#61BC5B"/>
                <path d="M15.0205 30.0013L16.8955 22.2053C16.8955 22.2053 18.9557 22.0437 20.6842 20.1562C19.6115 22.0362 15.0205 30.0013 15.0205 30.0013Z" fill="#5AB055"/>
                <path d="M9.71973 16.089C9.71973 12.6523 12.5168 9.86523 15.9658 9.86523C19.4148 9.86523 22.2119 12.6523 22.2119 16.089C22.2119 19.5257 19.4148 22.3127 15.9658 22.3127C12.5168 22.3089 9.71973 19.5257 9.71973 16.089Z" fill="white"/>
                <path d="M10.7656 16.0892C10.7656 13.2292 13.0921 10.9072 15.9663 10.9072C18.8366 10.9072 21.1669 13.2254 21.1669 16.0892C21.1669 18.9494 18.8406 21.2714 15.9663 21.2714C13.0959 21.2714 10.7656 18.9494 10.7656 16.0892Z" fill="url(#chrome-gradient)"/>
                <path d="M28.6007 9.87673L20.8808 12.1333C20.8808 12.1333 19.7157 10.4302 17.2119 9.87673C19.384 9.86515 28.6007 9.87673 28.6007 9.87673Z" fill="#EACA05"/>
                <path d="M9.94735 17.7577C8.86313 15.8855 4.40332 8.2124 4.40332 8.2124L10.1209 13.8481C10.1209 13.8481 9.53441 15.0514 9.75441 16.7735L9.94724 17.7577H9.94735Z" fill="#DF3A32"/>
                <defs>
                  <linearGradient id="chrome-gradient" x1="15.9661" y1="10.9804" x2="15.9661" y2="20.9594" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#86BBE5"/>
                    <stop offset="1" stopColor="#1072BA"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="font-medium text-gray-900 dark:text-white">Open in Chrome</span>
          </button>

          <button
            onClick={handleOpenInFirefox}
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm">
              <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
                <path d="M28.9905 10.7265C28.3816 9.2574 27.1473 7.67139 26.1784 7.17039C26.967 8.72015 27.4232 10.2746 27.5976 11.4344C27.5976 11.4344 27.5976 11.4426 27.6005 11.4578C26.0156 7.49777 23.3277 5.90065 21.1327 2.42407C21.0213 2.24869 20.9105 2.07331 20.802 1.88566C20.7407 1.77985 20.6911 1.68397 20.648 1.59336C20.557 1.41757 20.4867 1.23179 20.4386 1.03975C20.439 1.03063 20.4359 1.02169 20.4301 1.01467C20.4243 1.00765 20.4161 1.00305 20.4071 1.00175C20.3985 0.999416 20.3894 0.999416 20.3808 1.00175L20.3639 1.0111L20.3697 1.0035C16.8483 3.07063 15.6536 6.89446 15.544 8.80784C14.1368 8.90428 12.7913 9.42358 11.683 10.298C11.5672 10.1998 11.4461 10.1081 11.3202 10.0232C11.0008 8.9027 10.9873 7.71683 11.2811 6.58931C9.84091 7.24697 8.72095 8.28463 7.90664 9.20303H7.90023C7.34433 8.49742 7.38341 6.17015 7.41491 5.68435L6.94826 5.93339C6.45773 6.2841 5.9992 6.67771 5.57805 7.1096C5.0988 7.59655 4.66096 8.12276 4.26909 8.68274C3.36752 9.96323 2.72814 11.4101 2.3879 12.9398L2.36924 13.0327C2.34299 13.1561 2.24791 13.7751 2.23099 13.9096V13.9406C2.10704 14.5803 2.02984 15.2282 2 15.8791V15.951C2 23.7097 8.27646 30 16.0182 30C22.9521 30 28.7088 24.9549 29.8364 18.328C29.8597 18.1485 29.8789 17.9673 29.8999 17.786C30.1788 15.3763 29.869 12.8439 28.9905 10.7265Z" fill="url(#ff-main)"/>
                <path d="M28.9907 10.7265C28.3818 9.25741 27.1475 7.67141 26.1786 7.17041C26.9672 8.72017 27.4234 10.2746 27.5978 11.4344V11.4631C28.9208 15.0572 28.1998 18.7121 27.1615 20.9452C25.555 24.4002 21.6661 27.9416 15.578 27.7692C9.00581 27.5821 3.21175 22.6885 2.1297 16.2842C1.93254 15.2735 2.1297 14.7608 2.22886 13.9406C2.10812 14.5725 2.06203 14.7555 2.00195 15.8791V15.951C2.00195 23.7098 8.27842 30 16.0202 30C22.954 30 28.7108 24.9549 29.8383 18.328C29.8616 18.1485 29.8809 17.9673 29.9019 17.7861C30.179 15.3764 29.8692 12.8439 28.9907 10.7265Z" fill="url(#ff-glow)"/>
                <defs>
                  <linearGradient id="ff-main" x1="27.135" y1="5.49261" x2="3.81392" y2="27.9437" gradientUnits="userSpaceOnUse">
                    <stop offset="0.05" stopColor="#FFF44F"/>
                    <stop offset="0.11" stopColor="#FFE847"/>
                    <stop offset="0.22" stopColor="#FFC830"/>
                    <stop offset="0.37" stopColor="#FF980E"/>
                    <stop offset="0.4" stopColor="#FF8B16"/>
                    <stop offset="0.46" stopColor="#FF672A"/>
                    <stop offset="0.53" stopColor="#FF3647"/>
                    <stop offset="0.7" stopColor="#E31587"/>
                  </linearGradient>
                  <radialGradient id="ff-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(26.0596 4.21879) scale(29.2246 29.2888)">
                    <stop offset="0.13" stopColor="#FFBD4F"/>
                    <stop offset="0.28" stopColor="#FF980E"/>
                    <stop offset="0.47" stopColor="#FF3750"/>
                    <stop offset="0.78" stopColor="#EB0878"/>
                    <stop offset="0.86" stopColor="#E50080"/>
                  </radialGradient>
                </defs>
              </svg>
            </div>
            <span className="font-medium text-gray-900 dark:text-white">Open in Firefox</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm">
              {copied ? (
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <span className="font-medium text-gray-900 dark:text-white">
              {copied ? 'Copied!' : 'Copy Link'}
            </span>
          </button>
        </div>

        {/* Open in Instagram option - less prominent */}
        <button
          onClick={handleOpenInInstagram}
          className="flex items-center justify-center gap-2 w-full mt-4 p-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <span>Continue in app</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
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

  // Modal state for social mode link options
  const [linkOptionsUrl, setLinkOptionsUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const isCarousel = mode === 'carousel';
  const isSocial = mode === 'social';

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle link click in social mode
  const handleSocialLinkClick = useCallback((e: React.MouseEvent, url: string) => {
    e.preventDefault();
    if (isMobile) {
      // On mobile, show the options modal
      setLinkOptionsUrl(url);
    } else {
      // On desktop, navigate directly
      window.open(url, '_blank');
    }
  }, [isMobile]);

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

  // Social mode - compact horizontal list layout for Linktree replacement
  if (isSocial) {
    // Combine all announcements for social mode
    const allAnnouncements = [
      ...data.ChurchWide,
      ...(data.Campus?.Announcements || [])
    ];

    return (
      <div className="max-w-lg md:max-w-2xl mx-auto relative">
        {/* Woodside watermark - visible on all screen sizes for social mode */}
        <div
          className="absolute top-0 right-0 w-24 h-24 md:w-36 md:h-36 opacity-[0.04] pointer-events-none"
        >
          <svg
            viewBox="0 0 822.73 822.41"
            className="w-full h-full text-primary dark:text-white"
          >
            <path d="M482.59,292.96c-28.5,75.56-63.52,148.62-91.88,224.24-22.85,60.93-44.5,165.54,5.99,218.03,53.19,55.31,103.27-36.03,126.36-76.12,29.77-51.67,60.19-102.91,92.51-153.1,37.77-58.65,82.78-117.18,128.05-170.34,17.33-20.35,35.58-39.9,55.18-58.05,1.32-.3,1.67.72,2.19,1.61,2.7,4.68,6.16,19.72,7.79,25.79,55.59,207.53-59.67,424.44-261.39,494.49-162.86,56.55-343.5,6.03-452.97-125.71l.02-2.82c22.1-29.38,43.34-59.51,66.31-88.22,46.87-58.59,104.84-117,159.18-168.95,39.21-37.49,94.79-86.04,141.88-112.38,2.97-1.66,18.74-10.3,20.79-8.46Z" fill="currentColor"/>
            <path d="M454.78,615.29c-.4-37.26,12.31-73.93,23.96-108.91,21.35-64.11,58.46-144.93,65.26-211.05,10.09-98.15-75.84-54.82-121.59-23.71-87.22,59.32-157.97,140.42-238.72,207.44-1.08.9-1.56,2.33-3.36,1.91,29.91-61.5,79.75-118.22,92.63-187.03,26.62-142.2-143-109.97-223.13-77.75-1.54-1.51,19.5-33.71,21.85-37.14C170.36,35.21,348.48-31.19,518.31,14.05c111.97,29.83,206.98,107.78,259.7,210.54l-1.23,3.19c-101.38,85.68-182.57,188.93-258.5,297.03-21.17,30.14-40.81,61.47-63.5,90.48Z" fill="currentColor"/>
            <path d="M38.3,581.71c-6.2-9.05-10.4-20.99-14.14-31.42C-1.72,478.2-6.79,400.44,8.86,325.38c1.73-8.3,5.99-29.98,9.5-36.56,1.25-2.35,11.96-9.93,14.86-12.01,41.76-29.96,121.9-63.33,173.22-50.74,49.51,12.15,15.29,70.69-.39,97.86-34.22,59.31-78.86,114.75-116.32,172.48-18.06,27.83-35.65,56.1-51.43,85.3Z" fill="currentColor"/>
          </svg>
        </div>

        {/* Header */}
        <div className="text-center mb-6 md:mb-10">
          <div className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">
            {labels.carouselHeading1 || 'Stay in the know'}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            {labels.carouselHeading2 || 'Announcements'}
          </h1>
          {/* Campus name if passed */}
          {hasCampus && data.Campus?.Name && (
            <div className="mt-4 md:mt-6">
              <div className="w-16 md:w-20 h-px bg-gray-300 dark:bg-white/15 mx-auto my-3 md:my-4" />
              <div className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-widest">
                {data.Campus.Name} Campus
              </div>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <QuickLinks openInNewTab onLinkClick={handleSocialLinkClick} />

        {/* Compact announcement list */}
        <div className="flex flex-col gap-2 md:gap-3 mt-6 md:mt-10">
          {allAnnouncements.map((announcement) => {
            const heading = announcement.CallToAction?.Heading || announcement.Title;
            const subHeading = announcement.CallToAction?.SubHeading || announcement.Body;
            const hasLink = announcement.CallToAction?.Link;

            return (
              <React.Fragment key={announcement.ID}>
                <a
                  href={hasLink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => hasLink && handleSocialLinkClick(e, hasLink)}
                  className="flex items-center gap-3 md:gap-4 p-2 md:p-3 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-200 group"
                >
                  {/* Small thumbnail - 16:9 aspect ratio */}
                  <div className="flex-shrink-0 w-24 md:w-36 aspect-video overflow-hidden">
                    {announcement.Image ? (
                      <img
                        src={announcement.Image}
                        alt={announcement.Title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full grid place-items-center p-1 md:p-2"
                        style={{
                          backgroundColor: '#1c2b39',
                          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.15'/%3E%3Ccircle cx='12' cy='12' r='1' fill='%23ffffff' fill-opacity='0.25'/%3E%3C/svg%3E\")",
                          backgroundRepeat: 'repeat',
                          backgroundSize: '10px 10px',
                        }}
                      >
                        <span className="text-white font-bold uppercase leading-tight text-center text-[8px] md:text-xs">
                          {announcement.Title.substring(0, 20)}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xs md:text-base leading-tight text-primary dark:text-white group-hover:text-secondary transition-colors duration-200">
                      {heading}
                    </h3>
                    {subHeading && (
                      <p className="text-[11px] md:text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                        {subHeading.replace(/<[^>]*>/g, '').trim().substring(0, 80)}
                      </p>
                    )}
                  </div>
                  {/* Arrow */}
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 text-gray-400 group-hover:text-secondary group-hover:translate-x-0.5 transition-all duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </React.Fragment>
            );
          })}
        </div>

        {/* Link options modal (mobile only) */}
        {linkOptionsUrl && (
          <LinkOptionsModal
            url={linkOptionsUrl}
            onClose={() => setLinkOptionsUrl(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Main heading - shows for both carousel and grid modes */}
      <div className={isCarousel ? 'pb-4 md:pb-8 mb-2 md:mb-4 px-2 md:px-0' : 'pb-6 md:pb-0 mb-4 md:mb-8 px-2 md:px-0 relative overflow-visible animate-[fadeInFromRight_1.25s_ease-out_0s_both]'}>
        {/* Background Woodside logo is now rendered by the loading state transition - no static logo needed */}
        {/* Header with heading and navigation arrows */}
        <div className="flex justify-between items-center gap-3 md:mb-0 relative z-10">
          <div className={isCarousel ? 'flex-1 min-w-0' : 'flex-1 min-w-0 text-right'}>
            <div className={isCarousel ? 'text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wide mb-0.5 md:mb-1' : 'text-sm md:text-base font-normal text-gray-400 uppercase tracking-widest'}>
              {labels.carouselHeading1 || 'Stay in the know'}
            </div>
            <h1 className={isCarousel ? 'text-xl md:text-4xl font-bold truncate' : 'text-3xl md:text-7xl lg:text-8xl font-bold tracking-tighter'}>
              {labels.carouselHeading2 || 'Announcements'}
            </h1>
            {/* Quick links - grid mode only */}
            {!isCarousel && <QuickLinks />}
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
                <h2 className="mb-4 md:mb-6 text-lg md:text-3xl lg:text-4xl font-bold text-primary dark:text-white uppercase tracking-tight animate-[fadeInFromLeft_1.25s_ease-out_0.8s_both]">
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
                        // For 1-2 announcements, use flexbox like campus section for consistent sizing
                        if (count <= 2) return 'flex flex-wrap gap-3 md:gap-4';
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
                    if (count <= 2) {
                      // Flexbox layout matching campus section for consistent sizing
                      cardClass = 'flex-1 min-w-[280px] max-w-[480px] md:min-w-[320px] md:max-w-[420px]';
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
                    <div
                      key={announcement.ID}
                      className={cardClass}
                      style={{
                        animation: `cardSlideIn 0.8s ease-out ${1.0 + (index * 0.6)}s both`
                      }}
                    >
                      <AnnouncementCard
                        announcement={announcement}
                      />
                    </div>
                  );
                })}
                {/* Invisible filler elements for 1-2 announcements to prevent stretching */}
                {!isCarousel && data.ChurchWide.length <= 2 && Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={`churchwide-filler-${i}`}
                    className="flex-1 min-w-[280px] max-w-[480px] md:min-w-[320px] md:max-w-[420px] h-0"
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Campus Announcements */}
          {hasCampus && (
            <div ref={campusSectionRef} className={isCarousel ? 'ml-6' : 'mt-6 md:mt-8'}>
              {!isCarousel && (() => {
                // Calculate when campus section should start animating
                // Church-wide cards start at 1.0s with 0.6s stagger and 0.8s duration
                const churchWideCount = hasChurchWide ? data.ChurchWide.length : 0;
                const lastChurchWideCardStart = 1.0 + ((churchWideCount - 1) * 0.6);
                const lastChurchWideCardEnd = lastChurchWideCardStart + 0.8;
                const campusHeaderDelay = hasChurchWide ? lastChurchWideCardEnd : 0.8;

                return (
                  <h2
                    className="mb-4 md:mb-6 text-lg md:text-3xl lg:text-4xl font-bold text-primary dark:text-white uppercase tracking-tight"
                    style={{
                      animation: `fadeInFromLeft 1.25s ease-out ${campusHeaderDelay}s both`
                    }}
                  >
                    {data.Campus!.Name || 'Campus'}
                  </h2>
                );
              })()}
              {isCarousel && (
                <h2 className="hidden md:block mb-4 text-sm font-semibold text-primary/80 dark:text-white/80 uppercase tracking-wide">
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
                {data.Campus!.Announcements.map((announcement, index) => {
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

                  // Calculate when campus cards should start animating
                  // Start cards shortly after header begins (0.3s overlap for smoother flow)
                  const churchWideCount = hasChurchWide ? data.ChurchWide.length : 0;
                  const lastChurchWideCardStart = 1.0 + ((churchWideCount - 1) * 0.6);
                  const lastChurchWideCardEnd = lastChurchWideCardStart + 0.8;
                  const campusHeaderDelay = hasChurchWide ? lastChurchWideCardEnd : 0.8;
                  const campusCardsStart = campusHeaderDelay + 0.3;

                  // Flexbox with consistent sizing - cards maintain same width across all rows
                  return (
                    <div
                      key={announcement.ID}
                      className="flex-1 min-w-[280px] max-w-[480px] md:min-w-[320px] md:max-w-[420px]"
                      style={{
                        animation: `cardSlideInFromLeft 0.8s ease-out ${campusCardsStart + (index * 0.6)}s both`
                      }}
                    >
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
