'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SimulationStatus {
  active: boolean;
  type?: 'impersonate' | 'roles';
  user?: {
    Contact_ID: number;
    Display_Name: string;
    Email_Address: string;
    Nickname?: string;
    First_Name?: string;
    Last_Name?: string;
    Image_GUID?: string;
  };
  roles?: string[];
}

const BANNER_HEIGHT = '48px'; // Height of the banner to offset content
const HEADER_HEIGHT = '64px'; // Height of main header (h-16 = 64px)

export default function SimulationBanner() {
  const [status, setStatus] = useState<SimulationStatus>({ active: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  // Add padding to body when banner is active (for header + banner)
  useEffect(() => {
    if (status.active) {
      document.body.style.paddingTop = `calc(${HEADER_HEIGHT} + ${BANNER_HEIGHT})`;
    } else {
      document.body.style.paddingTop = HEADER_HEIGHT;
    }

    return () => {
      document.body.style.paddingTop = HEADER_HEIGHT;
    };
  }, [status.active]);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/simulation/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching simulation status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExit = async () => {
    try {
      const response = await fetch('/api/admin/simulation/clear', {
        method: 'POST',
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error exiting simulation:', error);
    }
  };

  if (loading || !status.active) {
    return null;
  }

  // Get avatar URL for impersonated user
  const getAvatarUrl = () => {
    if (status.type === 'impersonate' && status.user?.Image_GUID) {
      return `https://my.woodsidebible.org/ministryplatformapi/files/${status.user.Image_GUID}`;
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();

  // Format name as Nickname (fallback to First_Name) + Last_Name
  const getFormattedName = () => {
    if (status.type === 'impersonate' && status.user) {
      const firstName = status.user.Nickname || status.user.First_Name || '';
      const lastName = status.user.Last_Name || '';
      return `${firstName} ${lastName}`.trim();
    }
    return '';
  };

  return (
    <div
      className="fixed left-0 right-0 z-[45] bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
      style={{ top: HEADER_HEIGHT, height: BANNER_HEIGHT }}
    >
      <div className="container mx-auto px-4 h-full flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {status.type === 'impersonate' ? (
              <div>
                <p className="font-semibold text-sm">
                  Impersonating: {getFormattedName()}
                </p>
                <p className="text-xs opacity-90">{status.user?.Email_Address}</p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-sm">
                  Simulating Roles: {status.roles && status.roles.length > 0 ? status.roles.join(', ') : 'No Roles'}
                </p>
                <p className="text-xs opacity-90">Testing permission-based features</p>
              </div>
            )}
          </div>

          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors text-sm font-medium"
          >
            <X className="w-4 h-4" />
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
