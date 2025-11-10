'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, ShieldAlert } from 'lucide-react';

interface AppSimulationToggleProps {
  applicationId: number;
  applicationName: string;
}

export default function AppSimulationToggle({ applicationId, applicationName }: AppSimulationToggleProps) {
  const { data: session } = useSession();
  const [isSimulating, setIsSimulating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Only show for admins
  const isAdmin = session?.roles?.includes('Administrators');

  useEffect(() => {
    if (isAdmin) {
      fetchSimulationStatus();
    } else {
      setLoading(false);
    }
  }, [isAdmin, applicationId]);

  const fetchSimulationStatus = async () => {
    try {
      const response = await fetch(`/api/admin/simulation/app/status?applicationId=${applicationId}`);
      if (response.ok) {
        const data = await response.json();
        setIsSimulating(data.active);
      }
    } catch (error) {
      console.error('Error fetching simulation status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    try {
      setLoading(true);
      const endpoint = checked
        ? '/api/admin/simulation/app/enable'
        : '/api/admin/simulation/app/disable';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      });

      if (response.ok) {
        setIsSimulating(checked);
        // Reload page to apply the simulation
        window.location.reload();
      } else {
        console.error('Failed to toggle simulation');
      }
    } catch (error) {
      console.error('Error toggling simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything if not an admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      {isSimulating ? (
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
      ) : (
        <Shield className="w-5 h-5 text-gray-400 flex-shrink-0" />
      )}
      <div className="flex-1">
        <Label htmlFor="simulation-toggle" className="text-sm font-medium cursor-pointer">
          Test Permissions Mode
        </Label>
        <p className="text-xs text-muted-foreground">
          {isSimulating
            ? `Testing ${applicationName} with restricted permissions`
            : `Enable to test ${applicationName} permissions as a non-admin`}
        </p>
      </div>
      <Switch
        id="simulation-toggle"
        checked={isSimulating}
        onCheckedChange={handleToggle}
        disabled={loading}
      />
    </div>
  );
}
