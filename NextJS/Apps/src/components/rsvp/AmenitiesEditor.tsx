"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Amenity = {
  Amenity_ID: number;
  Amenity_Name: string;
  Amenity_Description: string | null;
  Icon_Name: string | null;
  Icon_Color: string | null;
  Icon_URL: string | null; // From dp_Files: icon.svg
  Display_Order: number;
};

type EventAmenity = {
  Amenity_ID: number;
  Amenity_Name: string;
  Amenity_Description: string | null;
  Icon_Name: string | null;
  Icon_Color: string | null;
  Icon_URL: string | null; // From dp_Files: icon.svg
  Display_Order: number;
};

interface AmenitiesEditorProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
  eventName: string;
  currentAmenities: EventAmenity[];
  onSave: (amenityIds: number[]) => Promise<void>;
}

export function AmenitiesEditor({
  isOpen,
  onClose,
  eventId,
  eventName,
  currentAmenities,
  onSave,
}: AmenitiesEditorProps) {
  const [availableAmenities, setAvailableAmenities] = useState<Amenity[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize selected IDs from current amenities
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(currentAmenities.map((a) => a.Amenity_ID));
    }
  }, [isOpen, currentAmenities]);

  // Fetch available amenities when dialog opens
  const fetchAmenities = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/rsvp/amenities");
      if (response.ok) {
        const data = await response.json();
        setAvailableAmenities(data);
      } else {
        console.error("Failed to fetch amenities");
      }
    } catch (error) {
      console.error("Error fetching amenities:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && availableAmenities.length === 0) {
      fetchAmenities();
    }
  }, [isOpen, availableAmenities.length, fetchAmenities]);

  const toggleAmenity = (amenityId: number) => {
    setSelectedIds((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selectedIds);
      onClose();
    } catch (error) {
      console.error("Error saving amenities:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to get icon component
  const getIconComponent = (iconName: string | null): LucideIcon | null => {
    if (!iconName) return null;
    return (LucideIcons as any)[iconName] || null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Amenities</DialogTitle>
          <DialogDescription>
            Select amenities for {eventName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#61bc47]"></div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {availableAmenities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No amenities available
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableAmenities.map((amenity) => {
                  const isSelected = selectedIds.includes(amenity.Amenity_ID);
                  const IconComponent = getIconComponent(amenity.Icon_Name);

                  return (
                    <div
                      key={amenity.Amenity_ID}
                      onClick={() => toggleAmenity(amenity.Amenity_ID)}
                      className={`
                        flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all
                        ${
                          isSelected
                            ? "border-[#61bc47] bg-[#61bc47]/10"
                            : "border-border hover:border-[#61bc47]/50"
                        }
                      `}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleAmenity(amenity.Amenity_ID)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {amenity.Icon_URL ? (
                            <img
                              src={amenity.Icon_URL}
                              alt={amenity.Amenity_Name}
                              className="w-4 h-4 flex-shrink-0"
                              style={{ color: amenity.Icon_Color || "#61bc47" }}
                            />
                          ) : IconComponent ? (
                            <IconComponent
                              className="w-4 h-4 flex-shrink-0"
                              style={{ color: amenity.Icon_Color || "#61bc47" }}
                            />
                          ) : null}
                          <span className="font-medium text-sm">
                            {amenity.Amenity_Name}
                          </span>
                        </div>
                        {amenity.Amenity_Description && (
                          <p className="text-xs text-muted-foreground">
                            {amenity.Amenity_Description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#61bc47] hover:bg-[#51a839]"
          >
            {isSaving ? "Saving..." : "Save Amenities"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
