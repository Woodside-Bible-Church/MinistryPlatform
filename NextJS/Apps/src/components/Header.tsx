'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/40 dark:bg-[color-mix(in_oklab,oklch(0.08_0.02_250)_60%,transparent)] border-b border-white/30 dark:border-gray-800/50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left - Logo + Navigation */}
          <div className="flex items-center gap-1">
            <a href="https://woodsidebible.org" className="flex items-center logo-link mr-3" target="_blank" rel="noopener noreferrer">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/assets/icons/woodside-logo.svg"
                  alt="Woodside Bible Church"
                  width={40}
                  height={40}
                  className="logo-svg object-contain"
                />
              </div>
            </a>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-semibold uppercase tracking-wide text-foreground dark:text-[oklch(0.8_0_0)] hover:!text-primary transition-colors rounded-md"
              >
                HOME
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-foreground dark:text-[oklch(0.8_0_0)] hover:!text-primary focus:!text-primary transition-colors focus:outline-none !bg-transparent hover:!bg-transparent data-[state=open]:!bg-transparent focus:!bg-transparent active:!bg-transparent !border-none">
                  APPS
                  <ChevronDownIcon className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 bg-white/50 dark:bg-[oklch(0.18_0.04_250)]/95 backdrop-blur-2xl border-white/30 dark:border-gray-700/50 shadow-2xl">
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

          {/* Right - Campus Selector + User avatar */}
          <div className="flex items-center gap-4">
            {/* Campus Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground dark:text-[oklch(0.8_0_0)] hover:!text-primary focus:!text-primary transition-colors focus:outline-none !bg-transparent hover:!bg-transparent data-[state=open]:!bg-transparent focus:!bg-transparent active:!bg-transparent !border-none">
                <MapPin className="w-4 h-4" />
                {campusLoading ? (
                  <span className="hidden sm:inline">Loading...</span>
                ) : selectedCampus ? (
                  <>
                    <span className="sm:hidden">
                      {selectedCampus.Congregation_Short_Name || selectedCampus.Congregation_Name}
                    </span>
                    <span className="hidden sm:inline">
                      {selectedCampus.Congregation_Name}
                    </span>
                  </>
                ) : (
                  <span className="hidden sm:inline">Select Campus</span>
                )}
                <ChevronDownIcon className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/50 dark:bg-[oklch(0.18_0.04_250)]/95 backdrop-blur-2xl border-white/30 dark:border-gray-700/50 shadow-2xl">
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
            <div className="relative">
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
                      className="h-10 w-10 rounded-full object-cover border-2 border-secondary group-hover:border-primary transition-colors"
                    />
                  ) : (
                    <UserCircleIcon className="h-10 w-10 text-secondary group-hover:text-primary transition-colors" />
                  )}
                </button>
              </UserMenu>
            ) : (
              <button
                className="p-0 rounded-full focus:outline-none group"
                aria-label="User menu"
                disabled={loading}
              >
                <UserCircleIcon className="h-10 w-10 text-secondary group-hover:text-primary transition-colors" />
              </button>
            )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}