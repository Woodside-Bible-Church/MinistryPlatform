'use client';

import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { mpUserProfile } from '@/providers/MinistryPlatform/Interfaces/mpUserProfile';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserMenuProps {
  onClose?: () => void;
  userProfile: mpUserProfile;
  children: React.ReactNode; // This will be the trigger element (e.g., user avatar/button)
}

export default function UserMenu({ onClose, userProfile, children }: UserMenuProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleSignOut = async () => {
    if (onClose) {
      onClose();
    }
    // Try to stay on current page, or go to home if page requires auth
    const currentPath = window.location.pathname;
    await signOut({ callbackUrl: currentPath });
  };

  // Use resolvedTheme to get the actual current theme (handles system preference)
  const currentTheme = resolvedTheme || theme;

  const toggleTheme = () => {
    // Toggle based on what the user actually sees (resolvedTheme), not the setting (theme)
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 bg-white/50 dark:bg-[oklch(0.16_0.005_0)]/95 backdrop-blur-2xl border-white/30 dark:border-[oklch(0.3_0.005_0)] shadow-2xl"
        align="end"
      >
        <DropdownMenuLabel className="text-foreground">
          <div className="flex flex-col space-y-1">
            <p className="font-semibold text-foreground">
              {userProfile.Nickname || userProfile.First_Name} {userProfile.Last_Name}
            </p>
            <p className="text-xs text-muted-foreground break-all">
              {userProfile.Email_Address}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem
          onClick={toggleTheme}
          className="cursor-pointer text-foreground hover:bg-primary/20 hover:text-foreground focus:bg-primary/20 focus:text-foreground"
        >
          {currentTheme === 'dark' ? (
            <>
              <Sun className="mr-2 h-4 w-4 flex-shrink-0" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span>Dark Mode</span>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-foreground hover:bg-primary/20 hover:text-foreground focus:bg-primary/20 focus:text-foreground"
        >
          <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}