'use client';

import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { mpUserProfile } from '@/providers/MinistryPlatform/Interfaces/mpUserProfile';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
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

const userMenuItems = [
  // { name: 'Profile', href: '/profile', icon: UserIcon },
  // { name: 'Settings', href: '/settings', icon: CogIcon },
  { name: 'Sign out', href: '/api/auth/signout', icon: ArrowRightOnRectangleIcon },
];

export default function UserMenu({ onClose, userProfile, children }: UserMenuProps) {
  const { theme, setTheme } = useTheme();

  const handleItemClick = (href: string) => {
    if (onClose) {
      onClose();
    }
    // Navigate to the href
    window.location.href = href;
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl border-white/30 dark:border-gray-700/30 shadow-2xl"
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
          {theme === 'dark' ? (
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
        {userMenuItems.map((item) => (
          <DropdownMenuItem
            key={item.name}
            onClick={() => handleItemClick(item.href)}
            className="cursor-pointer text-foreground hover:bg-primary/20 hover:text-foreground focus:bg-primary/20 focus:text-foreground"
          >
            <item.icon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span>{item.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}