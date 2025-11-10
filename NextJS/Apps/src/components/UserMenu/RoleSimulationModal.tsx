'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface RoleSimulationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COMMON_ROLES = [
  'Staff',
  'Volunteer',
  'Group Leader',
  'Event Coordinator',
  'Finance',
  'Communications',
  'None (No Roles)',
];

export default function RoleSimulationModal({ open, onOpenChange }: RoleSimulationModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleRole = (role: string) => {
    if (role === 'None (No Roles)') {
      // If "None" is selected, clear all other roles
      setSelectedRoles(['None (No Roles)']);
    } else {
      setSelectedRoles((prev) => {
        // Remove "None" if other roles are selected
        const filtered = prev.filter((r) => r !== 'None (No Roles)');
        if (filtered.includes(role)) {
          return filtered.filter((r) => r !== role);
        } else {
          return [...filtered, role];
        }
      });
    }
  };

  const handleApply = async () => {
    setLoading(true);
    setError(null);

    try {
      const rolesToSimulate = selectedRoles.includes('None (No Roles)') ? [] : selectedRoles;

      const response = await fetch('/api/admin/simulation/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: rolesToSimulate }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply role simulation');
      }

      // Reload the page to apply the simulation
      window.location.reload();
    } catch (err) {
      console.error('Error applying role simulation:', err);
      setError('Failed to apply role simulation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Simulate Roles</DialogTitle>
          <DialogDescription>
            Select roles to simulate and see how the app appears with different permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-2">
            {COMMON_ROLES.map((role) => (
              <label
                key={role}
                className="flex items-center gap-3 p-3 border border-border rounded-md hover:bg-primary/5 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role)}
                  onChange={() => toggleRole(role)}
                  className="w-4 h-4 text-primary focus:ring-primary rounded"
                />
                <span className="text-foreground font-medium">{role}</span>
              </label>
            ))}
          </div>

          {/* Selected Roles Summary */}
          {selectedRoles.length > 0 && (
            <div className="p-3 bg-primary/10 rounded-md">
              <p className="text-sm font-semibold text-foreground mb-1">
                Simulating {selectedRoles.length === 1 && selectedRoles[0] === 'None (No Roles)' ? 'no roles' : `${selectedRoles.length} role${selectedRoles.length > 1 ? 's' : ''}`}:
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedRoles.includes('None (No Roles)')
                  ? 'User will have no roles or permissions'
                  : selectedRoles.join(', ')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={loading || selectedRoles.length === 0}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Apply Simulation
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
