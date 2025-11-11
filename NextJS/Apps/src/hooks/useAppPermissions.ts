import { useSession } from '@/components/SessionProvider';
import { useState, useEffect } from 'react';

interface AppPermissions {
  canView: boolean;
  canEdit: boolean;
  loading: boolean;
}

export function useAppPermissions(applicationId: number): AppPermissions {
  const session = useSession();
  const [permissions, setPermissions] = useState<AppPermissions>({
    canView: false,
    canEdit: false,
    loading: true,
  });

  useEffect(() => {
    async function fetchPermissions() {
      if (!session?.user?.email) {
        setPermissions({ canView: false, canEdit: false, loading: false });
        return;
      }

      try {
        const response = await fetch(`/api/permissions?applicationId=${applicationId}`);
        if (response.ok) {
          const data = await response.json();
          setPermissions({
            canView: data.canView || false,
            canEdit: data.canEdit || false,
            loading: false,
          });
        } else {
          setPermissions({ canView: false, canEdit: false, loading: false });
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setPermissions({ canView: false, canEdit: false, loading: false });
      }
    }

    fetchPermissions();
  }, [session, applicationId]);

  return permissions;
}
