"use client";

import { MapPin } from "lucide-react";
import { Campus } from "@/types/rsvp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CampusSelectorProps {
  campuses: Campus[];
  selectedCampus: Campus | null;
  onSelectCampus: (campus: Campus) => void;
}

export default function CampusSelector({
  campuses,
  selectedCampus,
  onSelectCampus,
}: CampusSelectorProps) {
  const handleValueChange = (campusId: string) => {
    const campus = campuses.find((c) => c.id === parseInt(campusId));
    if (campus) {
      onSelectCampus(campus);
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">
          Select Your Campus
        </h2>
        <p className="text-gray-600">
          Choose the Woodside location you&apos;d like to attend
        </p>
      </div>

      {/* Campus Dropdown */}
      <div className="space-y-3">
        <Label htmlFor="campus-select" className="text-base font-medium">
          Campus Location
        </Label>
        <Select
          value={selectedCampus?.id.toString()}
          onValueChange={handleValueChange}
        >
          <SelectTrigger id="campus-select" className="h-14 text-base text-white">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-white" />
              <SelectValue placeholder="Select a campus" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {campuses.map((campus) => (
              <SelectItem
                key={campus.id}
                value={campus.id.toString()}
                className="text-base py-3"
              >
                {campus.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Helper Text */}
      <div className="text-center pt-2">
        <p className="text-sm text-gray-600">
          Not sure which campus to choose?{" "}
          <a
            href="https://woodsidebible.org/locations"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#61BC47] hover:underline"
          >
            View campus details
          </a>
        </p>
      </div>
    </div>
  );
}
