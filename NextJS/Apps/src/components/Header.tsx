'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserCircleIcon, ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import { Activity, MapPin } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import UserMenu from '@/components/UserMenu/UserMenu';
import { useSession } from '@/components/SessionProvider';
import { getCurrentUserProfile, updateUserCongregation } from '@/components/UserMenu/actions';
import { mpUserProfile } from '@/providers/MinistryPlatform/Interfaces/mpUserProfile';
import { useCampus } from '@/contexts/CampusContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Application = {
  Application_ID: number;
  Application_Name: string;
  Application_Key: string;
  Description: string;
  Icon: string;
  Route: string;
  Sort_Order: number;
};

export default function Header() {
  const [userProfile, setUserProfile] = useState<mpUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<Application[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const session = useSession();
  const { selectedCampus, setSelectedCampus, congregations, isLoading: campusLoading } = useCampus();

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getCurrentUserProfile(session.user.id);
        setUserProfile(profile);

        // Set campus based on user's Web_Congregation_ID if available
        if (profile.Web_Congregation_ID && congregations.length > 0) {
          const userCampus = congregations.find(c => c.Congregation_ID === profile.Web_Congregation_ID);
          if (userCampus) {
            setSelectedCampus(userCampus);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [session?.user?.id, congregations, setSelectedCampus]);

  // Fetch applications
  useEffect(() => {
    async function loadApplications() {
      try {
        const response = await fetch('/api/applications');
        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }
        const data = await response.json();
        setApps(data);
      } catch (error) {
        console.error('Error loading applications:', error);
      }
    }

    loadApplications();
  }, []);

  // Map icon name from database to Lucide icon component
  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || Activity; // Fallback to Activity icon
  };

  // Handle mobile menu close on escape key and prevent body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 shadow-lg overflow-visible h-16">
        {/* Header background with notch mask */}
        <div
          className="absolute inset-0 backdrop-blur-xl bg-white/40 dark:bg-[oklch(0.12_0.005_0)]/60 border-b border-white/30 dark:border-[oklch(0.3_0.005_0)] header-notch-mask pointer-events-none"
        />

        <div className="container mx-auto px-4 relative h-full">
          <div className="flex items-center justify-between h-16">
            {/* Left - Mobile Menu Button + Desktop Logo & Navigation */}
            <div className="flex items-center gap-1">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 text-foreground dark:text-[oklch(0.8_0_0)] hover:text-primary active:text-primary transition-colors pointer-events-auto"
                aria-label="Open menu"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>

              {/* Desktop Logo */}
              <a href="https://woodsidebible.org" className="hidden md:flex items-center logo-link mr-3 pointer-events-auto" target="_blank" rel="noopener noreferrer">
                <div className="relative w-10 h-10 shrink-0">
                  <svg className="logo-svg w-full h-full" viewBox="0 0 822.73 822.41" xmlns="http://www.w3.org/2000/svg">
                    <path d="M482.59,292.96c-28.5,75.56-63.52,148.62-91.88,224.24-22.85,60.93-44.5,165.54,5.99,218.03,53.19,55.31,103.27-36.03,126.36-76.12,29.77-51.67,60.19-102.91,92.51-153.1,37.77-58.65,82.78-117.18,128.05-170.34,17.33-20.35,35.58-39.9,55.18-58.05,1.32-.3,1.67.72,2.19,1.61,2.7,4.68,6.16,19.72,7.79,25.79,55.59,207.53-59.67,424.44-261.39,494.49-162.86,56.55-343.5,6.03-452.97-125.71l.02-2.82c22.1-29.38,43.34-59.51,66.31-88.22,46.87-58.59,104.84-117,159.18-168.95,39.21-37.49,94.79-86.04,141.88-112.38,2.97-1.66,18.74-10.3,20.79-8.46Z" fill="currentColor"/>
                    <path d="M454.78,615.29c-.4-37.26,12.31-73.93,23.96-108.91,21.35-64.11,58.46-144.93,65.26-211.05,10.09-98.15-75.84-54.82-121.59-23.71-87.22,59.32-157.97,140.42-238.72,207.44-1.08.9-1.56,2.33-3.36,1.91,29.91-61.5,79.75-118.22,92.63-187.03,26.62-142.2-143-109.97-223.13-77.75-1.54-1.51,19.5-33.71,21.85-37.14C170.36,35.21,348.48-31.19,518.31,14.05c111.97,29.83,206.98,107.78,259.7,210.54l-1.23,3.19c-101.38,85.68-182.57,188.93-258.5,297.03-21.17,30.14-40.81,61.47-63.5,90.48Z" fill="currentColor"/>
                    <path d="M38.3,581.71c-6.2-9.05-10.4-20.99-14.14-31.42C-1.72,478.2-6.79,400.44,8.86,325.38c1.73-8.3,5.99-29.98,9.5-36.56,1.25-2.35,11.96-9.93,14.86-12.01,41.76-29.96,121.9-63.33,173.22-50.74,49.51,12.15,15.29,70.69-.39,97.86-34.22,59.31-78.86,114.75-116.32,172.48-18.06,27.83-35.65,56.1-51.43,85.3Z" fill="currentColor"/>
                  </svg>
                </div>
              </a>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-semibold uppercase tracking-wide text-foreground dark:text-[oklch(0.8_0_0)] hover:!text-primary active:!text-primary transition-colors rounded-md pointer-events-auto"
              >
                HOME
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-foreground dark:text-[oklch(0.8_0_0)] hover:!text-primary focus:!text-primary active:!text-primary transition-colors focus:outline-none !bg-transparent hover:!bg-transparent data-[state=open]:!bg-transparent focus:!bg-transparent active:!bg-transparent !border-none pointer-events-auto">
                  APPS
                  <ChevronDownIcon className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 bg-white/50 dark:bg-[oklch(0.16_0.005_0)]/95 backdrop-blur-2xl border-white/30 dark:border-[oklch(0.3_0.005_0)] shadow-2xl z-[60]">
                  {apps.map((app) => {
                    const Icon = getIcon(app.Icon);
                    const route = app.Route || '#';
                    return (
                      <DropdownMenuItem key={app.Application_ID} asChild>
                        <Link href={route} className="flex items-center gap-3 p-3 cursor-pointer rounded-md hover:bg-primary transition-colors group">
                          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground group-hover:text-white transition-colors">{app.Application_Name}</p>
                            <p className="text-xs text-muted-foreground group-hover:text-white/90 truncate transition-colors">{app.Description}</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          {/* Center - Mobile Logo with Bulge */}
          <div className="md:hidden absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-10">
            {/* Glass circle - slightly larger to fully cover the cutout edge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[68px] h-[68px] backdrop-blur-xl bg-white/40 dark:bg-[oklch(0.12_0.005_0)]/60 rounded-full shadow-lg pointer-events-none" />

            {/* Logo - original size */}
            <a href="https://woodsidebible.org" className="relative z-10 flex items-center justify-center logo-link w-16 h-16 pointer-events-auto" target="_blank" rel="noopener noreferrer">
              <div className="relative w-12 h-12 shrink-0">
                <svg className="logo-svg w-full h-full" viewBox="0 0 822.73 822.41" xmlns="http://www.w3.org/2000/svg">
                  <path d="M482.59,292.96c-28.5,75.56-63.52,148.62-91.88,224.24-22.85,60.93-44.5,165.54,5.99,218.03,53.19,55.31,103.27-36.03,126.36-76.12,29.77-51.67,60.19-102.91,92.51-153.1,37.77-58.65,82.78-117.18,128.05-170.34,17.33-20.35,35.58-39.9,55.18-58.05,1.32-.3,1.67.72,2.19,1.61,2.7,4.68,6.16,19.72,7.79,25.79,55.59,207.53-59.67,424.44-261.39,494.49-162.86,56.55-343.5,6.03-452.97-125.71l.02-2.82c22.1-29.38,43.34-59.51,66.31-88.22,46.87-58.59,104.84-117,159.18-168.95,39.21-37.49,94.79-86.04,141.88-112.38,2.97-1.66,18.74-10.3,20.79-8.46Z" fill="currentColor"/>
                  <path d="M454.78,615.29c-.4-37.26,12.31-73.93,23.96-108.91,21.35-64.11,58.46-144.93,65.26-211.05,10.09-98.15-75.84-54.82-121.59-23.71-87.22,59.32-157.97,140.42-238.72,207.44-1.08.9-1.56,2.33-3.36,1.91,29.91-61.5,79.75-118.22,92.63-187.03,26.62-142.2-143-109.97-223.13-77.75-1.54-1.51,19.5-33.71,21.85-37.14C170.36,35.21,348.48-31.19,518.31,14.05c111.97,29.83,206.98,107.78,259.7,210.54l-1.23,3.19c-101.38,85.68-182.57,188.93-258.5,297.03-21.17,30.14-40.81,61.47-63.5,90.48Z" fill="currentColor"/>
                  <path d="M38.3,581.71c-6.2-9.05-10.4-20.99-14.14-31.42C-1.72,478.2-6.79,400.44,8.86,325.38c1.73-8.3,5.99-29.98,9.5-36.56,1.25-2.35,11.96-9.93,14.86-12.01,41.76-29.96,121.9-63.33,173.22-50.74,49.51,12.15,15.29,70.69-.39,97.86-34.22,59.31-78.86,114.75-116.32,172.48-18.06,27.83-35.65,56.1-51.43,85.3Z" fill="currentColor"/>
                </svg>
              </div>
            </a>
          </div>

          {/* Right - Campus Selector + User avatar */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Campus Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 md:gap-2 px-1 md:px-3 py-2 text-xs md:text-sm font-medium text-foreground dark:text-[oklch(0.8_0_0)] hover:!text-primary focus:!text-primary active:!text-primary transition-colors focus:outline-none !bg-transparent hover:!bg-transparent data-[state=open]:!bg-transparent focus:!bg-transparent active:!bg-transparent !border-none pointer-events-auto">
                <MapPin className="w-4 h-4 md:w-4 md:h-4" />
                {campusLoading ? (
                  <span className="hidden sm:inline">Loading...</span>
                ) : selectedCampus ? (
                  <>
                    <span className="md:hidden text-xs">
                      {selectedCampus.Congregation_Short_Name || selectedCampus.Congregation_Name}
                    </span>
                    <span className="hidden md:inline">
                      {selectedCampus.Congregation_Name}
                    </span>
                  </>
                ) : (
                  <span className="hidden md:inline">Select Campus</span>
                )}
                <ChevronDownIcon className="w-3 h-3 md:w-4 md:h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/50 dark:bg-[oklch(0.16_0.005_0)]/95 backdrop-blur-2xl border-white/30 dark:border-[oklch(0.3_0.005_0)] shadow-2xl z-[60]">
                {congregations.map((congregation) => (
                  <DropdownMenuItem
                    key={congregation.Congregation_ID}
                    onClick={async () => {
                      setSelectedCampus(congregation);
                      // Update MP if user is logged in
                      if (userProfile?.Contact_ID) {
                        try {
                          await updateUserCongregation(userProfile.Contact_ID, congregation.Congregation_ID);
                        } catch (error) {
                          console.error('Failed to update congregation in MP:', error);
                        }
                      }
                    }}
                    className={`cursor-pointer ${
                      selectedCampus?.Congregation_ID === congregation.Congregation_ID
                        ? "bg-primary/10 text-primary font-semibold"
                        : ""
                    }`}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {congregation.Congregation_Name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Avatar */}
            <div className="relative pointer-events-auto">
            {!loading && userProfile ? (
              <UserMenu userProfile={userProfile}>
                <button
                  className="p-0 rounded-full focus:outline-none group"
                  aria-label="User menu"
                  title={userProfile?.First_Name && userProfile?.Last_Name
                    ? `${userProfile.First_Name} ${userProfile.Last_Name}`
                    : session?.user?.name || session?.user?.email || 'User menu'}
                >
                  {userProfile?.Image_GUID ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL}/${userProfile.Image_GUID}?$thumbnail=true`}
                      alt={userProfile.First_Name && userProfile.Last_Name
                        ? `${userProfile.First_Name} ${userProfile.Last_Name}`
                        : 'User avatar'}
                      className="h-9 w-9 md:h-10 md:w-10 rounded-full object-cover border-2 border-secondary group-hover:border-primary transition-colors"
                    />
                  ) : (
                    <UserCircleIcon className="h-9 w-9 md:h-10 md:w-10 text-secondary group-hover:text-primary transition-colors" />
                  )}
                </button>
              </UserMenu>
            ) : (
              <button
                className="p-0 rounded-full focus:outline-none group"
                aria-label="User menu"
                disabled={loading}
              >
                <UserCircleIcon className="h-9 w-9 md:h-10 md:w-10 text-secondary group-hover:text-primary transition-colors" />
              </button>
            )}
            </div>
          </div>
        </div>
      </div>
    </header>

    {/* Mobile Sidebar */}
    {mobileMenuOpen && (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <div
          className={`fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-[oklch(0.16_0.005_0)] z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } md:hidden`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <svg className="logo-svg w-8 h-8" viewBox="0 0 822.73 822.41" xmlns="http://www.w3.org/2000/svg">
                <path d="M482.59,292.96c-28.5,75.56-63.52,148.62-91.88,224.24-22.85,60.93-44.5,165.54,5.99,218.03,53.19,55.31,103.27-36.03,126.36-76.12,29.77-51.67,60.19-102.91,92.51-153.1,37.77-58.65,82.78-117.18,128.05-170.34,17.33-20.35,35.58-39.9,55.18-58.05,1.32-.3,1.67.72,2.19,1.61,2.7,4.68,6.16,19.72,7.79,25.79,55.59,207.53-59.67,424.44-261.39,494.49-162.86,56.55-343.5,6.03-452.97-125.71l.02-2.82c22.1-29.38,43.34-59.51,66.31-88.22,46.87-58.59,104.84-117,159.18-168.95,39.21-37.49,94.79-86.04,141.88-112.38,2.97-1.66,18.74-10.3,20.79-8.46Z" fill="currentColor"/>
                <path d="M454.78,615.29c-.4-37.26,12.31-73.93,23.96-108.91,21.35-64.11,58.46-144.93,65.26-211.05,10.09-98.15-75.84-54.82-121.59-23.71-87.22,59.32-157.97,140.42-238.72,207.44-1.08.9-1.56,2.33-3.36,1.91,29.91-61.5,79.75-118.22,92.63-187.03,26.62-142.2-143-109.97-223.13-77.75-1.54-1.51,19.5-33.71,21.85-37.14C170.36,35.21,348.48-31.19,518.31,14.05c111.97,29.83,206.98,107.78,259.7,210.54l-1.23,3.19c-101.38,85.68-182.57,188.93-258.5,297.03-21.17,30.14-40.81,61.47-63.5,90.48Z" fill="currentColor"/>
                <path d="M38.3,581.71c-6.2-9.05-10.4-20.99-14.14-31.42C-1.72,478.2-6.79,400.44,8.86,325.38c1.73-8.3,5.99-29.98,9.5-36.56,1.25-2.35,11.96-9.93,14.86-12.01,41.76-29.96,121.9-63.33,173.22-50.74,49.51,12.15,15.29,70.69-.39,97.86-34.22,59.31-78.86,114.75-116.32,172.48-18.06,27.83-35.65,56.1-51.43,85.3Z" fill="currentColor"/>
              </svg>
              <span className="font-bold text-lg uppercase tracking-wide">Menu</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 -mr-2 text-foreground hover:text-primary transition-colors"
              aria-label="Close menu"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex flex-col p-4 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 text-base font-semibold uppercase tracking-wide text-foreground hover:bg-primary/10 hover:text-primary transition-colors rounded-lg"
            >
              HOME
            </Link>

            {/* Apps Section */}
            <div className="pt-2">
              <p className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Apps</p>
              {apps.map((app) => {
                const Icon = getIcon(app.Icon);
                const route = app.Route || '#';
                return (
                  <Link
                    key={app.Application_ID}
                    href={route}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors rounded-lg group"
                  >
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{app.Application_Name}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.Description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </>
    )}
    </>
  );
}