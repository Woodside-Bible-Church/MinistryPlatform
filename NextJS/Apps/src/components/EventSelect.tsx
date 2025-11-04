"use client";

import { useState, useEffect } from "react";
import Select from "react-select";
import type { Event } from "@/types/projects";

interface EventOption {
  value: number;
  label: string;
  event: Event;
}

interface EventSelectProps {
  value: number | string;
  onChange: (eventId: number | null) => void;
  className?: string;
}

export default function EventSelect({ value, onChange, className }: EventSelectProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        const url = searchTerm
          ? `/api/projects/events?search=${encodeURIComponent(searchTerm)}`
          : "/api/projects/events";

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error("Error loading events:", err);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [searchTerm]);

  const options: EventOption[] = events.map((event) => ({
    value: event.Event_ID,
    label: `${event.Event_Title} - ${new Date(event.Event_Start_Date).toLocaleDateString()}`,
    event,
  }));

  const selectedOption = options.find((opt) => opt.value === Number(value)) || null;

  return (
    <Select<EventOption>
      className={className}
      value={selectedOption}
      onChange={(option) => onChange(option?.value || null)}
      options={options}
      isLoading={loading}
      isClearable
      isSearchable
      onInputChange={(inputValue) => {
        setSearchTerm(inputValue);
      }}
      placeholder="Search for an event..."
      noOptionsMessage={() => "No events found"}
      styles={{
        control: (base, state) => ({
          ...base,
          backgroundColor: "hsl(var(--background))",
          borderColor: state.isFocused ? "#61BC47" : "hsl(var(--border))",
          borderRadius: "0.5rem",
          padding: "0.125rem",
          boxShadow: state.isFocused ? "0 0 0 2px rgba(97, 188, 71, 0.2)" : "none",
          "&:hover": {
            borderColor: "#61BC47",
          },
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: "hsl(var(--background))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "0.5rem",
          zIndex: 50,
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isFocused
            ? "hsl(var(--accent))"
            : state.isSelected
            ? "#61BC47"
            : "hsl(var(--background))",
          color: state.isSelected ? "white" : "hsl(var(--foreground))",
          cursor: "pointer",
          "&:active": {
            backgroundColor: "#61BC47",
          },
        }),
        input: (base) => ({
          ...base,
          color: "hsl(var(--foreground))",
        }),
        singleValue: (base) => ({
          ...base,
          color: "hsl(var(--foreground))",
        }),
        placeholder: (base) => ({
          ...base,
          color: "hsl(var(--muted-foreground))",
        }),
      }}
    />
  );
}
