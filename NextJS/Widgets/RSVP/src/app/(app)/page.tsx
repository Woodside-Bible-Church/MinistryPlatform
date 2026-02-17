"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, ArrowLeft, CheckCircle2, User, LogOut, Calendar } from "lucide-react";
import ServiceTimeCard from "@/components/rsvp/ServiceTimeCard";
import RSVPForm from "@/components/rsvp/RSVPForm";
import ConfirmationView from "@/components/rsvp/ConfirmationView";
import InformationalEventCard from "@/components/rsvp/InformationalEventCard";
import { AmenitiesLegend } from "@/components/rsvp/AmenitiesLegend";
import {
  RSVPFormInput,
  RSVPConfirmation,
  ServiceTimeResponse,
  ProjectRSVPDataResponse,
  RSVPEvent,
  RSVPAnswerValue,
  RSVPAnswer,
  RSVPSubmissionRequest,
  ParsedConfirmationCard,
  parseCardConfiguration,
} from "@/types/rsvp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CampusSelector from "@/components/rsvp/CampusSelector";

type ViewType = "services" | "form" | "confirmation";

// Extend Window interface for widget config
interface WidgetWindow extends Window {
  RSVP_WIDGET_CONFIG?: {
    apiBaseUrl?: string;
    containerId?: string;
  };
}

// Widget params from data-params attribute
interface WidgetParams {
  CongregationID?: number;
  ProjectRsvpID?: number;  // Deprecated: use Project instead
  Project?: string | number;  // Can be numeric ID or slug (e.g., "christmas-2024")
}

// WordPress location cookie structure
interface WPLocationCookie {
  user_id: number;
  location_id: number;
  location_name: string;
  location_short_name: string;
  location_url: string;
}

/**
 * Parse data-params attribute from widget container
 * Format: "@ParamName=value, @ParamName2=value2"
 * Examples:
 *   "@CongregationID=9, @ProjectRsvpID=1"  (old format, still supported)
 *   "@CongregationID=9, @Project=1"  (new format with numeric ID)
 *   "@Project=christmas-2024"  (new format with slug)
 */
function parseWidgetParams(): WidgetParams {
  if (typeof document === 'undefined') return {};

  try {
    const container = document.getElementById('rsvp-widget-root');
    if (!container) return {};

    const dataParams = container.getAttribute('data-params');
    if (!dataParams) return {};

    const params: WidgetParams = {};

    // Split by comma and parse each parameter
    dataParams.split(',').forEach(param => {
      const trimmed = param.trim();
      // Match @ParamName=value pattern (value can be alphanumeric + dashes)
      const match = trimmed.match(/@(\w+)=([\w-]+)/);
      if (match) {
        const [, key, value] = match;
        // Normalize key to lowercase for case-insensitive matching
        const normalizedKey = key.toLowerCase();

        if (normalizedKey === 'congregationid') {
          params.CongregationID = parseInt(value);
        } else if (normalizedKey === 'projectrsvpid') {
          // Deprecated but still supported for backward compatibility
          params.ProjectRsvpID = parseInt(value);
        } else if (normalizedKey === 'project') {
          // New parameter: can be numeric ID or slug
          // Check if value is numeric
          if (/^\d+$/.test(value)) {
            params.Project = parseInt(value);
          } else {
            params.Project = value;  // It's a slug
          }
        }
      }
    });

    return params;
  } catch (error) {
    console.warn('Failed to parse widget data-params:', error);
    return {};
  }
}

/**
 * Read and decode WordPress location cookie from parent page
 * Cookie name: tbx-ws__selected-location
 * Value is base64-encoded JSON
 */
function getWordPressLocationId(): number | null {
  if (typeof document === 'undefined') return null;

  try {
    // Get cookie from document.cookie (accessible from Shadow DOM)
    const cookies = document.cookie.split(';');
    const locationCookie = cookies
      .find(c => c.trim().startsWith('tbx-ws__selected-location='));

    if (!locationCookie) return null;

    // Extract value after '='
    const cookieValue = locationCookie.split('=')[1];
    if (!cookieValue) return null;

    // Decode base64
    const decoded = atob(cookieValue);
    const data: WPLocationCookie = JSON.parse(decoded);

    // Return location_id from cookie
    return data.location_id;
  } catch (error) {
    console.warn('Failed to parse WordPress location cookie:', error);
    return null;
  }
}

export default function RSVPPage() {
  // Detect if running as embedded widget
  const isWidget = typeof window !== 'undefined' && !!(window as WidgetWindow).RSVP_WIDGET_CONFIG;

  // Get base URL for assets (works in both Next.js and widget contexts)
  const baseUrl = typeof window !== 'undefined' && (window as WidgetWindow).RSVP_WIDGET_CONFIG?.apiBaseUrl
    ? (window as WidgetWindow).RSVP_WIDGET_CONFIG?.apiBaseUrl
    : '';

  // Parse widget params from data-params attribute
  const widgetParams = parseWidgetParams();

  // Get authentication session (only for Next.js dev mode, not widget)
  const { data: session, status: sessionStatus} = useSession();
  console.log('[DEBUG] Session:', session);
  console.log('[DEBUG] Session Status:', sessionStatus);
  console.log('[DEBUG] Is Widget Mode:', isWidget);

  // State for RSVP data from API
  const [rsvpData, setRsvpData] = useState<ProjectRSVPDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // State for user's Web_Congregation_ID from household API
  const [userCongregationId, setUserCongregationId] = useState<number | null>(null);

  // Track whether we've applied the user's congregation preference
  const hasAppliedUserCongregation = useRef(false);

  // Track loaded campus images
  const [loadedCampusImages, setLoadedCampusImages] = useState<Set<number>>(new Set());

  // Track if component has mounted (client-side only) to prevent hydration mismatches
  const [hasMounted, setHasMounted] = useState(false);

  // Build campus list from events that have RSVPs
  const availableCampuses = useMemo(() => {
    if (!rsvpData?.Events) return [];

    // Get unique campuses from events
    const campusMap = new Map<number, { id: number; name: string; congregationId: number; svgUrl: string | null }>();

    rsvpData.Events.forEach(event => {
      if (event.Congregation_ID && event.Campus_Name && !campusMap.has(event.Congregation_ID)) {
        campusMap.set(event.Congregation_ID, {
          id: event.Congregation_ID, // Use Congregation_ID as the ID
          name: event.Campus_Name,
          congregationId: event.Congregation_ID,
          svgUrl: event.Campus_SVG_URL,
        });
      }
    });

    // Convert to array and sort by name
    return Array.from(campusMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rsvpData]);

  // Build dynamic slug-to-Congregation_ID mapping from events data
  const slugToIdMap = useMemo(() => {
    if (!rsvpData?.Events) return {};

    const map: Record<string, number> = {};
    rsvpData.Events.forEach(event => {
      if (event.Campus_Slug && event.Congregation_ID) {
        map[event.Campus_Slug] = event.Congregation_ID;
      }
    });
    console.log('[DEBUG] Built slug-to-ID map:', map);
    return map;
  }, [rsvpData]);

  // Get default campus with priority: data-params > URL param > user's Web_Congregation_ID > WordPress cookie > first available
  const getInitialCampusId = useMemo(() => {
    return (): number | null => {
      if (availableCampuses.length === 0) return null;

      // Priority 1: data-params @CongregationID (overrides everything - also hides dropdown)
      if (widgetParams.CongregationID) {
        const campus = availableCampuses.find(c => c.congregationId === widgetParams.CongregationID);
        if (campus) {
          console.log(`Widget param detected: Congregation_ID ${widgetParams.CongregationID} -> Campus ${campus.name}`);
          return campus.id;
        }
        console.warn(`Widget param Congregation_ID ${widgetParams.CongregationID} not found in available campuses`);
      }

      // Priority 2: URL query parameter ?campus=slug (pre-selects dropdown only)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const campusSlug = urlParams.get('campus');
        if (campusSlug) {
          console.log(`[DEBUG] URL campus parameter detected: "${campusSlug}"`);
          console.log(`[DEBUG] Available slug map:`, slugToIdMap);
          // Use dynamic mapping from events data
          const congregationId = slugToIdMap[campusSlug];
          if (congregationId) {
            const campus = availableCampuses.find(c => c.congregationId === congregationId);
            if (campus) {
              console.log(`[DEBUG] ✓ URL campus slug matched: ${campusSlug} -> Congregation_ID ${congregationId} -> Campus ${campus.name}`);
              return campus.id;
            }
            console.warn(`[DEBUG] ✗ Congregation_ID ${congregationId} not found in availableCampuses`);
          } else {
            console.warn(`[DEBUG] ✗ URL campus slug "${campusSlug}" not found in slug map`);
          }
        }
      }

      // Priority 3: User's Web_Congregation_ID from Contact record
      if (userCongregationId) {
        const campus = availableCampuses.find(c => c.congregationId === userCongregationId);
        if (campus) {
          console.log(`User's Web_Congregation_ID detected: ${userCongregationId} -> Campus ${campus.name}`);
          return campus.id;
        }
        console.warn(`User's Web_Congregation_ID ${userCongregationId} not found in available campuses`);
      }

      // Priority 4: WordPress location cookie
      const wpLocationId = getWordPressLocationId();
      if (wpLocationId) {
        const campus = availableCampuses.find(c => c.congregationId === wpLocationId);
        if (campus) {
          console.log(`WordPress location detected: Congregation_ID ${wpLocationId} -> Campus ${campus.name}`);
          return campus.id;
        }
        console.warn(`WordPress location_id ${wpLocationId} not found in available campuses`);
      }

      // Priority 5: If only one campus, auto-select it. Otherwise, no default selection.
      if (availableCampuses.length === 1) {
        return availableCampuses[0].id;
      }
      return null; // Let user choose from dropdown
    };
  }, [availableCampuses, userCongregationId, widgetParams.CongregationID, slugToIdMap]);

  // Determine if campus dropdown should be hidden
  const hideCampusDropdown = !!widgetParams.CongregationID;

  // State
  const [currentView, setCurrentView] = useState<ViewType>("services");
  const [selectedCampusId, setSelectedCampusId] = useState<number | null>(null);
  const [selectedServiceTime, setSelectedServiceTime] =
    useState<ServiceTimeResponse | null>(null);
  const [confirmation, setConfirmation] =
    useState<RSVPConfirmation | null>(null);
  const [submittedAnswers, setSubmittedAnswers] =
    useState<Record<number, RSVPAnswerValue> | null>(null);
  const [formStep, setFormStep] = useState<1 | 2>(1); // Track form step
  const [formData, setFormData] = useState<Partial<RSVPFormInput>>({}); // Store partial form data
  const instructionRef = useRef<HTMLDivElement>(null);

  // Track if this is the first render (to prevent auto-scroll on initial load)
  const isFirstRender = useRef(true);

  // Dev mode: allow selecting project via dropdown
  // In dev mode, read project from URL or default to empty
  const [devProject, setDevProject] = useState<string>(() => {
    if (typeof window === 'undefined' || isWidget) return '';
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('project') || '';
  });
  const [availableProjects, setAvailableProjects] = useState<Array<{value: string; label: string}>>([]);

  // Fetch user's Web_Congregation_ID when authenticated
  useEffect(() => {
    const fetchUserCongregationId = async () => {
      // In widget mode, check for MP widget token instead of NextAuth session
      if (isWidget) {
        try {
          const { getAuthToken } = await import('@/lib/mpWidgetAuthClient');
          const token = getAuthToken();

          if (!token) {
            console.log('[DEBUG] No MP widget token found in localStorage');
            setUserCongregationId(null);
            return;
          }

          console.log('[DEBUG] Found MP widget token, fetching user data...');
          const apiOrigin = baseUrl || window.location.origin;
          const response = await fetch(`${apiOrigin}/api/household`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const congregationId = data.user?.Web_Congregation_ID || null;
            console.log('[DEBUG] User Web_Congregation_ID from MP token:', congregationId);
            setUserCongregationId(congregationId);
          } else {
            console.warn('[DEBUG] Failed to fetch user data with MP token:', response.status);
            setUserCongregationId(null);
          }
        } catch (error) {
          console.warn('Failed to fetch user congregation ID with MP token:', error);
          setUserCongregationId(null);
        }
      } else {
        // In Next.js dev mode, use NextAuth session
        if (!session?.user?.id) {
          setUserCongregationId(null);
          return;
        }

        try {
          const apiOrigin = baseUrl || window.location.origin;
          const response = await fetch(`${apiOrigin}/api/household`);
          if (response.ok) {
            const data = await response.json();
            const congregationId = data.user?.Web_Congregation_ID || null;
            console.log('[DEBUG] User Web_Congregation_ID from NextAuth:', congregationId);
            setUserCongregationId(congregationId);
          }
        } catch (error) {
          console.warn('Failed to fetch user congregation ID:', error);
          setUserCongregationId(null);
        }
      }
    };

    fetchUserCongregationId();
  }, [session, baseUrl, isWidget]);

  // Track when component has mounted to prevent hydration mismatches
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Set initial campus when available campuses are loaded
  useEffect(() => {
    console.log('[DEBUG] availableCampuses:', availableCampuses);
    console.log('[DEBUG] selectedCampusId:', selectedCampusId);
    console.log('[DEBUG] userCongregationId:', userCongregationId);
    console.log('[DEBUG] hasAppliedUserCongregation:', hasAppliedUserCongregation.current);

    if (availableCampuses.length === 0) return;

    // Initial campus selection when page loads
    if (selectedCampusId === null) {
      const initialId = getInitialCampusId();
      console.log('[DEBUG] Setting initial campus ID:', initialId);
      setSelectedCampusId(initialId);
      return;
    }

    // Re-apply campus selection when user's congregation becomes available
    // This handles the case where the user logs in after the page has loaded
    if (userCongregationId && !hasAppliedUserCongregation.current) {
      // Check if there's a higher priority override (data-params or URL param)
      const hasDataParamOverride = !!widgetParams.CongregationID;
      const hasUrlParamOverride = typeof window !== 'undefined' && !!new URLSearchParams(window.location.search).get('campus');

      // Only apply user congregation if there are no overrides
      if (!hasDataParamOverride && !hasUrlParamOverride) {
        const campus = availableCampuses.find(c => c.congregationId === userCongregationId);
        if (campus) {
          console.log(`[DEBUG] Applying user's Web_Congregation_ID: ${userCongregationId} -> Campus ${campus.name}`);
          setSelectedCampusId(campus.id);
        }
      }
      hasAppliedUserCongregation.current = true;
    }
  }, [availableCampuses, selectedCampusId, userCongregationId, getInitialCampusId, widgetParams.CongregationID]);

  // Fetch available projects in dev mode
  useEffect(() => {
    if (isWidget) return; // Only in dev mode

    const fetchProjects = async () => {
      try {
        const apiOrigin = baseUrl || window.location.origin;
        const response = await fetch(`${apiOrigin}/api/rsvp/projects`);
        if (response.ok) {
          const data = await response.json();
          setAvailableProjects(data);
        }
      } catch (error) {
        console.warn('Failed to fetch available projects:', error);
      }
    };

    fetchProjects();
  }, [isWidget, baseUrl]);

  // Update CSS variables on document root when RSVP data changes
  // This ensures portaled components (like Select dropdowns) can access the theme colors
  useEffect(() => {
    if (rsvpData?.Project) {
      document.documentElement.style.setProperty('--theme-primary', rsvpData.Project.RSVP_Primary_Color || '#E5E7EB');
      document.documentElement.style.setProperty('--theme-secondary', rsvpData.Project.RSVP_Secondary_Color || '#FFFFFF');
      document.documentElement.style.setProperty('--theme-accent', rsvpData.Project.RSVP_Accent_Color || '#62BB46');
      document.documentElement.style.setProperty('--theme-background', rsvpData.Project.RSVP_Background_Color || '#1C2B39');
    }
  }, [rsvpData]);

  // Restore saved state after page refresh (for token refresh flow)
  useEffect(() => {
    const restoreSavedState = async () => {
      if (!isWidget) return; // Only in widget mode

      const { getSavedFormState, restoreScrollPosition } = await import('@/lib/mpWidgetAuthClient');
      const saved = getSavedFormState();

      if (saved && saved.formData) {
        console.log('[Restore] Found saved state:', saved);

        // Restore scroll position
        restoreScrollPosition();

        // Wait for RSVP data to load before restoring state
        // This will be handled after rsvpData is fetched
        // For now, just log that we have saved state
      }
    };

    restoreSavedState();
  }, [isWidget]);

  // Fetch RSVP data on mount
  useEffect(() => {
    const fetchRSVPData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        // Priority: Project > ProjectRsvpID > devProject (dev mode) > no default
        // In Next.js dev mode, use devProject state only if it's not empty
        const projectIdentifier = widgetParams.Project || widgetParams.ProjectRsvpID || (!isWidget && devProject ? devProject : null);

        // Safety check: if no project is available, don't fetch
        // (This should be caught by early return, but just in case)
        if (!projectIdentifier) {
          console.warn('[RSVP Widget] No project identifier available, skipping fetch');
          setIsLoading(false);
          return;
        }

        // Build API URL with query parameters
        // Use baseUrl (widget config) if available, otherwise use window.location.origin
        const apiOrigin = baseUrl || window.location.origin;
        const apiUrl = new URL('/api/rsvp/project', apiOrigin);
        apiUrl.searchParams.set('project', projectIdentifier.toString());

        console.log('[DEBUG] Fetching RSVP data for project:', projectIdentifier);
        console.log('[DEBUG] API URL:', apiUrl.toString());
        const response = await fetch(apiUrl.toString());

        if (!response.ok) {
          throw new Error(`Failed to fetch RSVP data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[DEBUG] Raw API response:', data);
        console.log('[DEBUG] Events count:', data.Events?.length || 0);
        if (data.Events && data.Events.length > 0) {
          console.log('[DEBUG] First event Minor_Registration:', data.Events[0].Minor_Registration);
        }

        setRsvpData(data);
      } catch (error) {
        console.error('Error fetching RSVP data:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load RSVP data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRSVPData();
  }, [widgetParams.Project, widgetParams.ProjectRsvpID, baseUrl, devProject, isWidget]);

  // Scroll to instructions when view or form step changes
  // Only on mobile, and not on initial render
  useEffect(() => {
    // Skip scroll on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Only scroll on mobile devices (less than 768px = md breakpoint)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (instructionRef.current && isMobile) {
      const elementPosition = instructionRef.current.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - (2.5 * 16); // 2.5em offset (assuming 16px base font size)

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  }, [currentView, formStep]);

  // Restore saved service selection after RSVP data loads (for token refresh flow)
  useEffect(() => {
    const restoreServiceSelection = async () => {
      if (!isWidget || !rsvpData) return;

      const { getSavedFormState, clearSavedFormState } = await import('@/lib/mpWidgetAuthClient');
      const saved = getSavedFormState();

      if (saved && saved.formData && saved.actionType === 'service-select') {
        const { selectedServiceEventId } = saved.formData as { selectedServiceEventId?: number };

        if (selectedServiceEventId) {
          // Wait a brief moment for MP widget to finish OAuth token refresh
          // The MP widget auto-refreshes tokens on page load, but it happens asynchronously
          await new Promise(resolve => setTimeout(resolve, 500));

          // Find the service time from the loaded data
          const service = rsvpData.Events.find(e => e.Event_ID === selectedServiceEventId);

          if (service) {
            console.log('[Restore] Restoring service selection:', service.Event_Title);
            const serviceTime = convertEventToServiceTime(service);
            setSelectedServiceTime(serviceTime);
            setCurrentView("form");
            setFormStep(1);
          }
        }

        // Clear saved state after restoring
        clearSavedFormState();
      }
    };

    restoreServiceSelection();
  }, [isWidget, rsvpData]);

  // Send height updates to parent window (for iframe embedding)
  useEffect(() => {
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({
        type: 'rsvp-widget-height',
        height: height
      }, '*');
    };

    // Send height on mount and whenever content changes
    sendHeight();

    // Use ResizeObserver to detect size changes
    const resizeObserver = new ResizeObserver(sendHeight);
    resizeObserver.observe(document.body);

    return () => resizeObserver.disconnect();
  }, [currentView, formStep]);

  // Convert RSVPEvent to ServiceTimeResponse format
  const convertEventToServiceTime = (event: RSVPEvent): ServiceTimeResponse => {
    const date = new Date(event.Event_Start_Date);
    // Format date with em dash: "Tue — Dec 24"
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formattedDate = `${weekday} — ${monthDay}`;

    return {
      ...event, // Spread all RSVPEvent properties
      formattedDate,
      formattedTime: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      capacityStatus: event.Capacity_Percentage >= 100 ? 'full' : event.Capacity_Percentage >= 75 ? 'limited' : 'available',
      capacityColor: event.Capacity_Percentage <= 50 ? 'bg-green-500' : event.Capacity_Percentage <= 75 ? 'bg-yellow-500' : event.Capacity_Percentage <= 90 ? 'bg-orange-500' : 'bg-red-500',
    };
  };

  // Filter service times by selected campus (from real API data)
  const filteredServiceTimes = useMemo(() => {
    if (!rsvpData?.Events || selectedCampusId === null) {
      return [];
    }

    // Filter events by Congregation_ID matching the selected campus
    return rsvpData.Events
      .filter(event => event.Congregation_ID === selectedCampusId)
      .map(convertEventToServiceTime);
  }, [rsvpData, selectedCampusId]);

  // Filter carousel events by selected campus (from real API data)
  const filteredCarousels = useMemo(() => {
    if (!rsvpData?.Carousels || selectedCampusId === null) {
      return [];
    }

    // Filter each carousel's events by the selected campus
    return rsvpData.Carousels
      .map(carousel => ({
        ...carousel,
        Events: carousel.Events.filter(
          event => event.Congregation_ID === selectedCampusId
        ),
      }))
      // Remove carousels with no events after filtering
      .filter(carousel => carousel.Events.length > 0);
  }, [rsvpData, selectedCampusId]);


  // Collect all unique amenities from filtered service times
  const allAmenities = useMemo(() => {
    const amenitiesMap = new Map();
    filteredServiceTimes.forEach(service => {
      if (service.Amenities && service.Amenities.length > 0) {
        service.Amenities.forEach(amenity => {
          if (!amenitiesMap.has(amenity.Amenity_ID)) {
            amenitiesMap.set(amenity.Amenity_ID, amenity);
          }
        });
      }
    });
    return Array.from(amenitiesMap.values());
  }, [filteredServiceTimes]);

  // Group service times by date for display
  const groupedServiceTimes = useMemo(() => {
    const groups: Record<string, ServiceTimeResponse[]> = {};
    filteredServiceTimes.forEach((service) => {
      // Use formattedDate as the key (e.g., "Saturday, December 7")
      const dateKey = service.formattedDate;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(service);
    });

    // Sort groups by actual date (chronological order)
    const sortedEntries = Object.entries(groups).sort((a, b) => {
      const dateA = new Date(a[1][0].Event_Start_Date);
      const dateB = new Date(b[1][0].Event_Start_Date);
      return dateA.getTime() - dateB.getTime();
    });

    return Object.fromEntries(sortedEntries);
  }, [filteredServiceTimes]);

  // Parse confirmation cards from RSVP data
  // Filter cards to only show cards that match the confirmation's campus OR are global (null Congregation_ID)
  const confirmationCards = useMemo<ParsedConfirmationCard[]>(() => {
    if (!rsvpData?.Confirmation_Cards) return [];

    return rsvpData.Confirmation_Cards
      .filter(card => {
        // If we don't have a confirmation yet, show all cards (shouldn't happen, but safe)
        if (!confirmation?.Congregation_ID) return true;

        // Show card if it's global (null Congregation_ID) OR matches the event's campus
        return card.Congregation_ID === null || card.Congregation_ID === confirmation.Congregation_ID;
      })
      .map(card => ({
        Card_ID: card.Card_ID,
        Card_Type_ID: card.Card_Type_ID,
        Card_Type_Name: card.Card_Type_Name,
        Component_Name: card.Component_Name,
        Icon_Name: card.Icon_Name,
        Display_Order: card.Display_Order,
        Congregation_ID: card.Congregation_ID,
        Configuration: parseCardConfiguration(card.Configuration),
      }));
  }, [rsvpData, confirmation]);

  // Get campus-specific meeting instructions for the selected campus
  const currentCampusMeetingInstructions = useMemo(() => {
    if (!rsvpData?.Campus_Meeting_Instructions || selectedCampusId === null) {
      return null;
    }

    // Find meeting instructions for the selected campus
    const campusInstructions = rsvpData.Campus_Meeting_Instructions.find(
      instruction => instruction.Congregation_ID === selectedCampusId
    );

    return campusInstructions?.Meeting_Instructions || null;
  }, [rsvpData, selectedCampusId]);

  // Get campus-specific image URL from Public_Event_ID, fallback to project default
  const currentImageURL = useMemo(() => {
    if (!rsvpData?.Project?.RSVP_Image_URL && !rsvpData?.Campus_Meeting_Instructions) {
      return null;
    }

    // If a campus is selected, check if there's a campus-specific image
    if (selectedCampusId !== null && rsvpData?.Campus_Meeting_Instructions) {
      const campusInstructions = rsvpData.Campus_Meeting_Instructions.find(
        instruction => instruction.Congregation_ID === selectedCampusId
      );

      // Use campus-specific image if available, otherwise fall back to project default
      if (campusInstructions?.Campus_Image_URL) {
        return campusInstructions.Campus_Image_URL;
      }
    }

    // Default to project-level image
    return rsvpData?.Project?.RSVP_Image_URL || null;
  }, [rsvpData, selectedCampusId]);

  // Handlers
  const handleServiceSelect = async (serviceTime: ServiceTimeResponse) => {
    // In widget mode, check if token is expired before proceeding
    if (isWidget) {
      const { getTokenStatus, saveFormState, refreshPageForTokenUpdate } = await import('@/lib/mpWidgetAuthClient');
      const tokenStatus = getTokenStatus();

      if (tokenStatus.isExpired) {
        console.log('[handleServiceSelect] Token expired, saving state and refreshing...');
        // Save the service selection state
        saveFormState({
          selectedServiceEventId: serviceTime.Event_ID,
          view: 'form',
          formStep: 1,
        }, 'service-select');

        // Refresh page to let MP widget update token
        refreshPageForTokenUpdate();
        return;
      }
    }

    // Normal flow if token is valid or not in widget mode
    setSelectedServiceTime(serviceTime);
    setCurrentView("form");
  };

  const handleFormSubmit = async (data: RSVPFormInput, answers: Record<number, RSVPAnswerValue>, contactId: number | null) => {
    console.log('[DEBUG] Form submission - Contact Data:', data);
    console.log('[DEBUG] Form submission - Dynamic Answers:', answers);
    console.log('[DEBUG] Form submission - Contact_ID:', contactId);

    try {
      // Convert answers object to array format for API
      const answersArray: RSVPAnswer[] = Object.entries(answers).map(([questionId, value]) => {
        const answer: RSVPAnswer = {
          Question_ID: parseInt(questionId),
        };

        // Determine which field to populate based on value type
        if (typeof value === 'number') {
          answer.Numeric_Value = value;
        } else if (typeof value === 'boolean') {
          answer.Boolean_Value = value;
        } else if (typeof value === 'string') {
          // Check if it's a date string
          if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
            answer.Date_Value = value;
          } else {
            answer.Text_Value = value;
          }
        } else if (Array.isArray(value)) {
          // Multi-select answers as JSON string
          answer.Text_Value = JSON.stringify(value);
        }

        return answer;
      });

      // Build submission request
      // Use Project_ID from fetched data (which was resolved from slug if needed)
      const submissionRequest: RSVPSubmissionRequest = {
        Event_ID: data.eventId,
        Project_ID: rsvpData?.Project.Project_ID || 1,
        Contact_ID: contactId, // Pass Contact_ID from household dropdown (null if "new person")
        First_Name: data.firstName,
        Last_Name: data.lastName,
        Email_Address: data.emailAddress,
        Phone_Number: data.phoneNumber || null,
        Answers: answersArray,
      };

      console.log('[DEBUG] Submitting RSVP:', submissionRequest);

      // Call submission API
      const apiOrigin = baseUrl || window.location.origin;
      const response = await fetch(`${apiOrigin}/api/rsvp/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to submit RSVP');
      }

      const result = await response.json();
      console.log('[DEBUG] Submission successful:', result);

      // Extract confirmation from result and add First_Name/Last_Name
      const confirmationData = {
        ...result.confirmation,
        First_Name: data.firstName,
        Last_Name: data.lastName,
      };

      setConfirmation(confirmationData);
      setSubmittedAnswers(answers); // Store the submitted answers
      setCurrentView("confirmation");

    } catch (error) {
      console.error('Error submitting RSVP:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit RSVP. Please try again.');
    }
  };

  const handleBackToServices = () => {
    setCurrentView("services");
    setSelectedServiceTime(null);
    setFormStep(1);
    setFormData({});
  };

  const handleReset = () => {
    setCurrentView("services");
    // Keep the currently selected campus instead of resetting to first in list
    setSelectedServiceTime(null);
    setConfirmation(null);
    setSubmittedAnswers(null); // Clear submitted answers
    setFormStep(1); // Reset to step 1
    setFormData({}); // Clear form data
  };

  // Widget mode: don't render anything if no project parameter
  // IMPORTANT: This must come AFTER all hooks are called
  if (isWidget && !widgetParams.Project && !widgetParams.ProjectRsvpID) {
    console.warn('[RSVP Widget] No project parameter provided. Widget will not render.');
    console.warn('[RSVP Widget] Add data-params="@Project=christmas-2024" or data-params="@Project=1" to the widget container.');
    return null;  // Don't render anything
  }

  return (
    <div
      className="min-h-screen bg-white"
      style={{
        // Override theme CSS variables for dynamic branding from database
        ['--theme-primary' as string]: rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB',
        ['--theme-secondary' as string]: rsvpData?.Project?.RSVP_Secondary_Color || '#FFFFFF',
        ['--theme-accent' as string]: rsvpData?.Project?.RSVP_Accent_Color || '#62BB46',
        ['--theme-background' as string]: rsvpData?.Project?.RSVP_Background_Color || '#1C2B39',
        // Also update Tailwind CSS v4 color variables (used by bg-*, text-*, border-* utilities)
        ['--color-primary' as string]: rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB',
        ['--color-secondary' as string]: rsvpData?.Project?.RSVP_Secondary_Color || '#FFFFFF',
        ['--color-accent' as string]: rsvpData?.Project?.RSVP_Accent_Color || '#62BB46',
        // Widget mode styles
        ...(isWidget ? {} : {}),
      } as React.CSSProperties}
    >
      {/* Glassmorphic Top Navigation Bar - Fixed (Only show in Next.js dev mode, not widget) */}
      {!isWidget && (
        <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/20 py-3 px-8 shadow-lg" style={{ backgroundColor: 'var(--theme-background)' }}>
          <div className="max-w-[1600px] mx-auto flex justify-between items-center">
            {/* Left: Project Selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium" style={{ color: 'var(--theme-secondary)' }}>Project:</span>
              <Select
                value={devProject}
                onValueChange={(value) => {
                  setDevProject(value);
                  // Update URL to persist selection across refreshes
                  const url = new URL(window.location.href);
                  url.searchParams.set('project', value);
                  window.history.replaceState({}, '', url.toString());
                }}
              >
                <SelectTrigger
                  className="w-[300px] h-9 border-2 transition-colors text-sm font-semibold shadow-md"
                  style={{
                    backgroundColor: 'var(--theme-background)',
                    borderColor: 'var(--theme-background)',
                    color: 'var(--theme-secondary)',
                    '--tw-ring-color': 'var(--theme-secondary)',
                  } as React.CSSProperties}
                >
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {availableProjects.map((project) => (
                    <SelectItem key={project.value} value={project.value} className="text-sm">
                      {project.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Right: User Menu */}
            <div>
              {sessionStatus === "loading" ? (
                <div className="text-white/90 text-sm">Loading...</div>
              ) : session ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-white drop-shadow-lg">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{session.user?.name || session.user?.email}</span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-md transition-all text-sm font-medium shadow-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn("ministryplatform")}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-md transition-all text-sm font-medium shadow-lg"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dev mode: Only render widget content if project is selected */}
      {!isWidget && !devProject ? null : (
      <>
      {/* Header with Background Image and Content - Adjust padding based on mode */}
      <section className={`relative text-white overflow-hidden ${isWidget ? 'pt-48 pb-32' : 'pt-32 pb-24'}`}>
        {/* Background Pattern */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: rsvpData?.Project?.RSVP_BG_Image_URL
              ? `url('${rsvpData.Project.RSVP_BG_Image_URL}')`
              : undefined,
            backgroundColor: rsvpData?.Project?.RSVP_Background_Color || '#6B7280' // Gray-500 fallback
          }}
        />

        {/* Content Container */}
        <div className="relative mx-auto px-8 max-w-[1600px]">
          {/* Top Section - Header and Image */}
          <div className="flex gap-8 mb-8 md:mb-12">
            {/* Left: Header Text + Instructions */}
            <div className="flex-1 flex flex-col justify-between gap-6 xl:gap-0">
              {/* Main Header - Aligned with top of image */}
              <div>
                <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-3 leading-tight text-white">
                  {rsvpData?.Project?.RSVP_Title || ""}
                </h1>
                <p className="text-base md:text-xl leading-relaxed text-white opacity-90">
                  {rsvpData?.Project?.RSVP_Description || ""}
                </p>

                {/* Campus-specific meeting instructions */}
                {currentCampusMeetingInstructions && (
                  <p className="text-base md:text-xl leading-relaxed text-white opacity-90 mt-4 whitespace-pre-line">
                    {currentCampusMeetingInstructions}
                  </p>
                )}
              </div>

              {/* RSVP Image - Mobile only (between blurb and instructions) */}
              {currentImageURL && (
                <div className="md:hidden my-2">
                  <img
                    src={currentImageURL}
                    alt={rsvpData?.Project?.RSVP_Title || "RSVP"}
                    className="w-full h-auto shadow-2xl max-w-md mx-auto"
                  />
                </div>
              )}

              {/* Dynamic Instructions + Campus Filter - Aligned with bottom of image */}
              <div className="space-y-3 md:space-y-4">
                {/* Instructions based on current view */}
                <div ref={instructionRef}>
                  {currentView === "services" && (
                    <>
                      <h2 className="text-xl md:text-2xl font-bold text-white mb-1 mt-6">
                        Service Times & Availability
                      </h2>
                      <p className="text-sm md:text-base text-white opacity-80">
                        Select a service time to RSVP
                      </p>
                    </>
                  )}
                  {currentView === "form" && selectedServiceTime && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {formStep === 1 ? "Tell Us About Yourself" : "Complete Your RSVP"}
                      </h2>

                      {/* Cards Container */}
                      <div className="flex flex-col md:flex-row gap-4 max-w-xl">
                        {/* Service Selection Card - Clickable */}
                        <button
                          onClick={handleBackToServices}
                          className="px-4 py-3 w-full md:w-auto text-left transition-colors"
                          style={{
                            backgroundColor: rsvpData?.Project?.RSVP_Background_Color || '#1C2B39',
                            color: rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${rsvpData?.Project?.RSVP_Background_Color || '#1C2B39'}E6`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = rsvpData?.Project?.RSVP_Background_Color || '#1C2B39';
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {/* Back Arrow - Left Side */}
                            <ArrowLeft className="w-5 h-5 flex-shrink-0" style={{ color: `${rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB'}B3` }} />

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4" style={{ color: rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB' }} />
                                <span className="text-lg font-bold" style={{ color: rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB' }}>
                                  {new Date(selectedServiceTime.Event_Start_Date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: `${rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB'}B3` }}>
                                {new Date(selectedServiceTime.Event_Start_Date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" style={{ color: `${rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB'}99` }} />
                                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: `${rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB'}CC` }}>
                                  {selectedServiceTime.Campus_Name} Campus
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Personal Info Card - Only show on Step 2 */}
                        {formStep === 2 && formData.firstName && (
                          <button
                            onClick={() => setFormStep(1)}
                            className="px-4 py-3 w-full md:w-auto text-left transition-colors"
                            style={{
                              backgroundColor: rsvpData?.Project?.RSVP_Background_Color || '#1C2B39',
                              color: rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${rsvpData?.Project?.RSVP_Background_Color || '#1C2B39'}E6`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = rsvpData?.Project?.RSVP_Background_Color || '#1C2B39';
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {/* Back Arrow - Left Side */}
                              <ArrowLeft className="w-5 h-5 flex-shrink-0" style={{ color: `${rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB'}B3` }} />

                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB' }}>
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                  </svg>
                                  <span className="text-lg font-bold" style={{ color: rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB' }}>
                                    {formData.firstName} {formData.lastName}
                                  </span>
                                </div>
                                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: `${rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB'}B3` }}>
                                  {formData.emailAddress}
                                </p>
                                {formData.phoneNumber && (
                                  <p className="text-xs font-medium uppercase tracking-wide mt-1" style={{ color: `${rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB'}CC` }}>
                                    {formData.phoneNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        )}
                      </div>

                      {/* Progress Indicator */}
                      <div className="flex items-center gap-2 max-w-md">
                        <div className="flex-1 h-1" style={{ backgroundColor: rsvpData?.Project?.RSVP_Accent_Color || '#62BB46' }}></div>
                        <div className="flex-1 h-1" style={{ backgroundColor: formStep === 2 ? (rsvpData?.Project?.RSVP_Accent_Color || '#62BB46') : 'rgba(255, 255, 255, 0.2)' }}></div>
                      </div>
                      <p className="text-xs text-white/70 uppercase tracking-wide font-medium">Step {formStep} of 2</p>
                    </div>
                  )}
                  {currentView === "confirmation" && (
                    <div className="flex items-center gap-4">
                      {/* Success Checkmark Animation */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <div className="relative">
                          {/* Pulsing background */}
                          <motion.div
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 0.2, 0.5],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            className="absolute inset-0 rounded-full"
                            style={{ backgroundColor: 'var(--theme-secondary)' }}
                          />
                          {/* Check icon */}
                          <div
                            className="relative w-16 h-16 rounded-full flex items-center justify-center border-2"
                            style={{
                              backgroundColor: 'var(--theme-primary)',
                              borderColor: 'var(--theme-primary)',
                              color: 'var(--theme-background)'
                            }}
                          >
                            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                          </div>
                        </div>
                      </motion.div>

                      {/* Text */}
                      <div>
                        <h2 className="text-2xl font-bold mb-1 text-right md:text-left" style={{ color: 'var(--theme-secondary)' }}>
                          You&apos;re All Set
                        </h2>
                        <p className="text-base text-right md:text-left" style={{ color: 'var(--theme-primary)', opacity: 0.9 }}>
                          We can&apos;t wait to see you at Christmas.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Campus Filter - Only show on services view and when not hardcoded via data-params */}
                {currentView === "services" && !hideCampusDropdown && availableCampuses.length > 1 && hasMounted && (
                  <CampusSelector
                    campuses={availableCampuses}
                    selectedId={selectedCampusId}
                    onSelect={setSelectedCampusId}
                    backgroundColor={rsvpData?.Project?.RSVP_Background_Color || '#1C2B39'}
                    textColor={rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB'}
                    loadedImages={loadedCampusImages}
                    onImageLoad={(id) => setLoadedCampusImages(prev => new Set(prev).add(id))}
                  />
                )}
              </div>
            </div>

            {/* RSVP Image - Desktop Only (right side) */}
            {currentImageURL && (
              <div className="hidden xl:block flex-shrink-0 w-[520px]">
                <img
                  src={currentImageURL}
                  alt={rsvpData?.Project?.RSVP_Title || "RSVP"}
                  className="w-full h-auto shadow-2xl"
                />
              </div>
            )}
          </div>

          {/* Main Content Section - Full Width */}
          <div>
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <p className="text-white/80 text-sm">Loading service times...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {loadError && (
                <div className="bg-red-500/10 border-2 border-red-500/50 rounded-lg p-6 text-center">
                  <p className="text-white font-semibold mb-2">Unable to load RSVP data</p>
                  <p className="text-white/80 text-sm">{loadError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-md transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Main Content - Only show when not loading and no error */}
              {!isLoading && !loadError && (
              <AnimatePresence mode="wait">
                {/* Service Times List */}
                {currentView === "services" && (
                  <motion.div
                    key="services"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Amenities Legend */}
                    {allAmenities.length > 0 && (
                      <AmenitiesLegend
                        amenities={allAmenities}
                        textColor={rsvpData?.Project?.RSVP_Primary_Color || '#FFFFFF'}
                      />
                    )}

                    {/* Service Times Grouped by Date */}
                    <div className="space-y-8">
                      {Object.entries(groupedServiceTimes).map(([dateHeading, services]) => (
                        <div key={dateHeading} className="space-y-4">
                          {/* Date Heading */}
                          <h3 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                            <Calendar className="w-6 h-6 md:w-7 md:h-7 text-white" />
                            {dateHeading}
                          </h3>

                          {/* Service Time Cards - Flexible auto-flowing layout */}
                          <div className="relative md:static">
                            {/* Mobile: full-width scroll (if multiple) | Desktop: normal flexbox within container */}
                            <div className={`flex md:flex-wrap gap-4 pb-2 scroll-smooth md:overflow-x-visible scrollbar-hide ${services.length > 1 ? 'overflow-x-auto snap-x snap-mandatory -mx-8 px-8 md:mx-0 md:px-0' : 'overflow-x-visible'}`}>
                              {services.map((service) => (
                                <ServiceTimeCard
                                  key={service.Event_ID}
                                  serviceTime={service}
                                  selected={false}
                                  onSelect={() => handleServiceSelect(service)}
                                  isCarousel={services.length > 1}
                                  backgroundColor={rsvpData?.Project?.RSVP_Background_Color || '#1C2B39'}
                                  accentColor={rsvpData?.Project?.RSVP_Secondary_Color || '#FFFFFF'}
                                  textColor={rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB'}
                                />
                              ))}
                            </div>

                            {/* Swipe Indicator - Only show on mobile when there are multiple cards */}
                            {services.length > 1 && (
                              <div className="flex items-center justify-center gap-2 mt-4 md:hidden">
                                <motion.div
                                  animate={{ x: [0, 8, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                  className="flex items-center gap-1"
                                >
                                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white/60">
                                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white/60">
                                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </motion.div>
                                <span className="text-sm text-white/70 font-medium uppercase tracking-wide">
                                  Swipe to see more
                                </span>
                                <motion.div
                                  animate={{ x: [0, 8, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                  className="flex items-center gap-1"
                                >
                                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white/60">
                                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white/60">
                                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </motion.div>
                              </div>
                            )}
                          </div>
                        </div>
                  ))}
                </div>

                    {/* Helper Text */}
                    <div className="text-center pt-2">
                      <p className="text-sm text-white opacity-70">
                        <strong className="font-semibold text-white opacity-90">Note:</strong> RSVPs help us plan accordingly but don&apos;t guarantee a spot.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* RSVP Form */}
                {currentView === "form" && selectedServiceTime && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <RSVPForm
                      selectedServiceTime={selectedServiceTime}
                      onSubmit={handleFormSubmit}
                      onBack={handleBackToServices}
                      formStep={formStep}
                      onStepChange={setFormStep}
                      initialData={formData}
                      onDataChange={setFormData}
                      questions={rsvpData?.Questions || []}
                      backgroundColor={rsvpData?.Project?.RSVP_Background_Color || '#1C2B39'}
                      textColor={rsvpData?.Project?.RSVP_Primary_Color || '#E5E7EB'}
                      accentColor={rsvpData?.Project?.RSVP_Accent_Color || '#62BB46'}
                    />
                  </motion.div>
                )}

                {/* Confirmation */}
                {currentView === "confirmation" && confirmation && (
                  <motion.div
                    key="confirmation"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <ConfirmationView
                      confirmation={confirmation}
                      confirmationCards={confirmationCards}
                      questions={rsvpData?.Questions || []}
                      answers={submittedAnswers || {}}
                      onReset={handleReset}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              )}
          </div>
        </div>
      </section>

      {/* Event Carousels Section - Display related events grouped by carousel name */}
      {filteredCarousels.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="relative mx-auto px-8 max-w-[1600px] space-y-12">
            {filteredCarousels.map((carousel) => (
              <div key={carousel.Carousel_Name}>
                <h2 className="text-3xl font-bold mb-6 text-gray-900">
                  {carousel.Carousel_Name}
                </h2>
                <div className="flex flex-wrap gap-4">
                  {carousel.Events.map((event) => (
                    <InformationalEventCard
                      key={`${event.Item_Type || 'Event'}-${event.Event_ID || event.Opportunity_ID}`}
                      event={event}
                      baseUrl={baseUrl}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Note: Mock data fallback removed - now using only real carousel events from database */}
      </>
      )}

    </div>
  );
}
