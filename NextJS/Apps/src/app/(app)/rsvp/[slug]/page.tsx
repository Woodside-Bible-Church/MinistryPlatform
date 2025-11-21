"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { useCampus } from "@/contexts/CampusContext";
import {
  Calendar,
  Users,
  Activity,
  ChevronLeft,
  Settings,
  List,
  CheckCircle2,
  XCircle,
  Pencil,
  Clock,
  Baby,
  Music,
  Heart,
  MapPin,
  Info,
  Search,
  X,
  ChevronDown,
  Coffee,
  Car,
  Gift,
  Book,
  Smile,
  Star,
  Home,
  Leaf,
  Sun,
  Moon,
  Umbrella,
  TreePine,
  Sparkles,
  Waves,
  Zap,
  Plus,
  Trash2,
  Save,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line } from "recharts";
import { TemplateSelector } from "@/components/rsvp/TemplateSelector";

type Project = {
  Project_ID: number;
  Project_Title: string;
  Project_Type_ID: number | null;
  Project_Type: string | null;
  RSVP_Title: string | null;
  RSVP_Description: string | null;
  RSVP_Start_Date: string | null;
  RSVP_End_Date: string | null;
  RSVP_Is_Active: boolean | null;
  RSVP_Slug: string | null;
  RSVP_Require_Contact_Lookup: boolean | null;
  RSVP_Allow_Guest_Submission: boolean | null;
  RSVP_Primary_Color: string | null;
  RSVP_Secondary_Color: string | null;
  RSVP_Accent_Color: string | null;
  RSVP_Background_Color: string | null;
  RSVP_Confirmation_Email_Template_ID: number | null;
  RSVP_Reminder_Email_Template_ID: number | null;
  RSVP_Days_To_Remind: number | null;
  RSVP_BG_Image_URL: string | null;
  RSVP_Image_URL: string | null;
};

type ProjectEventWithDetails = {
  Project_Event_ID: number;
  Project_ID: number;
  Event_ID: number;
  Include_In_RSVP: boolean | null;
  RSVP_Capacity_Modifier: number | null;
  Event_Title: string;
  Event_Start_Date: string | null;
  Event_End_Date: string | null;
  Congregation_Name: string | null;
  Congregation_ID: number | null;
  Event_Type: string | null;
  RSVP_Count: number;
  Total_Attendees: number;
  Capacity: number | null;
  Available_Capacity: number | null;
};

type ProjectRSVP = {
  Event_RSVP_ID: number;
  Event_ID: number;
  Contact_ID: number | null;
  First_Name: string;
  Last_Name: string;
  Email_Address: string | null;
  Phone_Number: string | null;
  Party_Size: number | null;
  Is_New_Visitor: boolean | null;
  RSVP_Date: string;
  Event_Title: string | null;
  Event_Start_Date: string | null;
  Campus_Name: string | null;
  Answer_Summary: string | null;
};

type ProjectCampus = {
  Congregation_ID: number;
  Campus_Name: string;
  Public_Event_ID: number | null;
  Public_Event_Title: string | null;
  Meeting_Instructions: string | null;
  Public_Event_Image_URL: string | null;
  Is_Active: boolean | null;
  Display_Order: number | null;
  Events: ProjectEventWithDetails[];
  Confirmation_Cards: ConfirmationCard[];
};

type ConfirmationCard = {
  Card_ID: number;
  Card_Type_ID: number;
  Card_Type_Name: string;
  Component_Name: string;
  Icon_Name: string | null;
  Display_Order: number;
  Congregation_ID: number | null;
  Campus_Name: string | null;
  Is_Global: boolean;
  Configuration: string | null;
};

function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Helper to get icon component by name
function getIconComponent(iconName: string | null): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    Clock,
    Baby,
    Music,
    Heart,
    MapPin,
    Info,
    Calendar,
    Users,
    Activity,
    Coffee,
    Car,
    Gift,
    Book,
    Smile,
    Star,
    Home,
    Leaf,
    Sun,
    Moon,
    Umbrella,
    TreePine,
    Sparkles,
    Waves,
    Zap,
  };
  return iconMap[iconName || "Info"] || Info;
}

// Get all available icons for picker
function getAvailableIcons(): Array<{ name: string; component: LucideIcon }> {
  return [
    { name: "Clock", component: Clock },
    { name: "Baby", component: Baby },
    { name: "Music", component: Music },
    { name: "Heart", component: Heart },
    { name: "MapPin", component: MapPin },
    { name: "Info", component: Info },
    { name: "Calendar", component: Calendar },
    { name: "Users", component: Users },
    { name: "Activity", component: Activity },
    { name: "Coffee", component: Coffee },
    { name: "Car", component: Car },
    { name: "Gift", component: Gift },
    { name: "Book", component: Book },
    { name: "Smile", component: Smile },
    { name: "Star", component: Star },
    { name: "Home", component: Home },
    { name: "Leaf", component: Leaf },
    { name: "Sun", component: Sun },
    { name: "Moon", component: Moon },
    { name: "Umbrella", component: Umbrella },
    { name: "TreePine", component: TreePine },
    { name: "Sparkles", component: Sparkles },
    { name: "Waves", component: Waves },
    { name: "Zap", component: Zap },
  ];
}

// Parse Answer_Summary field into key-value pairs
function parseAnswerSummary(answerSummary: string | null): Record<string, string> {
  if (!answerSummary) return {};
  const answers: Record<string, string> = {};
  const lines = answerSummary.split(/\r?\n|<br>/gi).filter((line) => line.trim());
  lines.forEach((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const question = line.substring(0, colonIndex).trim();
      const answer = line.substring(colonIndex + 1).trim();
      if (question && answer) {
        answers[question] = answer;
      }
    }
  });
  return answers;
}

// Get all unique questions from all RSVPs
function getAllQuestions(rsvps: ProjectRSVP[]): string[] {
  const questionsSet = new Set<string>();
  rsvps.forEach((rsvp) => {
    const answers = parseAnswerSummary(rsvp.Answer_Summary);
    Object.keys(answers).forEach((question) => questionsSet.add(question));
  });
  return Array.from(questionsSet).sort();
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  // Get selected campus from context
  const { selectedCampus } = useCampus();

  const [project, setProject] = useState<Project | null>(null);
  const [campuses, setCampuses] = useState<ProjectCampus[]>([]);
  const [rsvps, setRsvps] = useState<ProjectRSVP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeProjects, setTypeProjects] = useState<Array<{Project_ID: number; Project_Title: string; RSVP_Slug: string}>>([]);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<"details" | "campuses" | "rsvps">("details");

  // Edit mode states
  const [isEditingTemplates, setIsEditingTemplates] = useState(false);
  const [isSavingTemplates, setIsSavingTemplates] = useState(false);
  const [isEditingProjectInfo, setIsEditingProjectInfo] = useState(false);
  const [isSavingProjectInfo, setIsSavingProjectInfo] = useState(false);
  const [isEditingGeneralSettings, setIsEditingGeneralSettings] = useState(false);
  const [isSavingGeneralSettings, setIsSavingGeneralSettings] = useState(false);
  const [isEditingColors, setIsEditingColors] = useState(false);
  const [isSavingColors, setIsSavingColors] = useState(false);
  const [isEditingImages, setIsEditingImages] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Campus editing states
  const [editingMeetingInstructions, setEditingMeetingInstructions] = useState<number | null>(null); // Event_ID being edited
  const [meetingInstructionsForm, setMeetingInstructionsForm] = useState<string>("");
  const [isSavingMeetingInstructions, setIsSavingMeetingInstructions] = useState(false);

  const [editingEventCapacity, setEditingEventCapacity] = useState<number | null>(null); // Event_ID being edited
  const [eventCapacityForm, setEventCapacityForm] = useState<{
    capacity: number | null;
    modifier: number | null;
  }>({ capacity: null, modifier: null });
  const [isSavingEventCapacity, setIsSavingEventCapacity] = useState(false);

  const [editingConfirmationCard, setEditingConfirmationCard] = useState<{
    cardId: number;
    config: { title: string; bullets: Array<{ icon: string; text: string }> };
  } | null>(null);
  const [isSavingConfirmationCard, setIsSavingConfirmationCard] = useState(false);

  // Local state for Days to Remind with debouncing
  const [daysToRemindInput, setDaysToRemindInput] = useState<string>("");

  // Local state for Project Info fields
  const [projectInfoForm, setProjectInfoForm] = useState({
    RSVP_Title: "",
    RSVP_Description: "",
    RSVP_Start_Date: "",
    RSVP_End_Date: "",
  });

  // Local state for General Settings fields
  const [generalSettingsForm, setGeneralSettingsForm] = useState({
    RSVP_Is_Active: false,
    RSVP_Require_Contact_Lookup: false,
    RSVP_Allow_Guest_Submission: false,
  });

  // Local state for Colors fields
  const [colorsForm, setColorsForm] = useState({
    RSVP_Primary_Color: "",
    RSVP_Secondary_Color: "",
    RSVP_Accent_Color: "",
    RSVP_Background_Color: "",
  });

  // Sync local input with project state when project loads
  useEffect(() => {
    if (project?.RSVP_Days_To_Remind !== null && project?.RSVP_Days_To_Remind !== undefined) {
      setDaysToRemindInput(project.RSVP_Days_To_Remind.toString());
    } else {
      setDaysToRemindInput("");
    }
  }, [project?.RSVP_Days_To_Remind]);

  // Sync Project Info form with project state
  useEffect(() => {
    if (project) {
      setProjectInfoForm({
        RSVP_Title: project.RSVP_Title || "",
        RSVP_Description: project.RSVP_Description || "",
        RSVP_Start_Date: project.RSVP_Start_Date ? project.RSVP_Start_Date.split("T")[0] : "",
        RSVP_End_Date: project.RSVP_End_Date ? project.RSVP_End_Date.split("T")[0] : "",
      });
    }
  }, [project]);

  // Sync General Settings form with project state
  useEffect(() => {
    if (project) {
      setGeneralSettingsForm({
        RSVP_Is_Active: project.RSVP_Is_Active ?? false,
        RSVP_Require_Contact_Lookup: project.RSVP_Require_Contact_Lookup ?? false,
        RSVP_Allow_Guest_Submission: project.RSVP_Allow_Guest_Submission ?? false,
      });
    }
  }, [project]);

  // Sync Colors form with project state
  useEffect(() => {
    if (project) {
      setColorsForm({
        RSVP_Primary_Color: project.RSVP_Primary_Color || "",
        RSVP_Secondary_Color: project.RSVP_Secondary_Color || "",
        RSVP_Accent_Color: project.RSVP_Accent_Color || "",
        RSVP_Background_Color: project.RSVP_Background_Color || "",
      });
    }
  }, [project]);

  // Debounce Days to Remind updates (wait 800ms after user stops typing)
  useEffect(() => {
    if (!isEditingTemplates) return;

    const timer = setTimeout(() => {
      const numValue = daysToRemindInput === "" ? null : parseInt(daysToRemindInput, 10);
      // Only update if value actually changed
      if (numValue !== project?.RSVP_Days_To_Remind && !isNaN(numValue as any)) {
        handleTemplateUpdate("RSVP_Days_To_Remind", numValue);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [daysToRemindInput, isEditingTemplates]);

  useEffect(() => {
    async function loadData() {
      try {
        // Load all project details in one call using stored procedure
        const response = await fetch(`/api/rsvp/projects/details/${slug}`);
        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error:", errorData);
          throw new Error(`Failed to fetch project details: ${response.status}`);
        }
        const data = await response.json();

        console.log("Project details loaded:", data);

        setProject(data.Project);
        setCampuses(data.Campuses || []);
        setRsvps(data.RSVPs || []);

        // If project has a type, fetch all projects of the same type for dropdown
        if (data.Project?.Project_Type_ID) {
          const projectsResponse = await fetch("/api/rsvp/projects");
          if (projectsResponse.ok) {
            const allProjects = await projectsResponse.json();
            const sameTypeProjects = allProjects
              .filter((p: any) => p.Project_Type_ID === data.Project.Project_Type_ID)
              .sort((a: any, b: any) => {
                const dateA = a.RSVP_Start_Date ? new Date(a.RSVP_Start_Date).getTime() : 0;
                const dateB = b.RSVP_Start_Date ? new Date(b.RSVP_Start_Date).getTime() : 0;
                return dateB - dateA;
              })
              .map((p: any) => ({
                Project_ID: p.Project_ID,
                Project_Title: p.Project_Title,
                RSVP_Slug: p.RSVP_Slug,
              }));
            setTypeProjects(sameTypeProjects);
          }
        }
      } catch (error) {
        console.error("Error loading project data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [slug]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest(".filter-dropdown")) {
          setOpenDropdown(null);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // Filter campuses and RSVPs by selected congregation
  // Church Wide (ID = 1) shows all, specific campus shows only that campus
  const isChurchWide = !selectedCampus || selectedCampus.Congregation_ID === 1;

  const filteredCampuses = campuses.filter((campus) => {
    if (isChurchWide) return true;
    return campus.Congregation_ID === selectedCampus.Congregation_ID;
  });

  const filteredRsvps = rsvps.filter((r) => {
    if (isChurchWide) return true;
    // Match by campus name since RSVPs have Campus_Name
    return r.Campus_Name === selectedCampus.Congregation_Name;
  });

  const totalRSVPs = filteredRsvps.length;
  const totalAttendees = filteredRsvps.reduce(
    (sum, r) => sum + (r.Party_Size || 0),
    0
  );

  // Optimistic update handler for templates
  const handleTemplateUpdate = async (
    field: "RSVP_Confirmation_Email_Template_ID" | "RSVP_Reminder_Email_Template_ID" | "RSVP_Days_To_Remind",
    value: number | null
  ) => {
    if (!project) return;

    // Store previous value for rollback
    const previousValue = project[field];

    // Optimistic update
    setProject({ ...project, [field]: value });
    setIsSavingTemplates(true);

    try {
      const response = await fetch(`/api/rsvp/projects/${project.Project_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error("Failed to update template");
      }

      const updatedProject = await response.json();
      setProject({ ...project, ...updatedProject });
    } catch (error) {
      console.error("Error updating template:", error);
      // Rollback on error
      setProject({ ...project, [field]: previousValue });
      alert("Failed to update template. Please try again.");
    } finally {
      setIsSavingTemplates(false);
    }
  };

  // Handler for saving project info changes
  const handleSaveProjectInfo = async () => {
    if (!project) return;

    setIsSavingProjectInfo(true);

    try {
      // Prepare update payload
      const updateData: Partial<Project> = {
        RSVP_Title: projectInfoForm.RSVP_Title || null,
        RSVP_Description: projectInfoForm.RSVP_Description || null,
        RSVP_Start_Date: projectInfoForm.RSVP_Start_Date || null,
        RSVP_End_Date: projectInfoForm.RSVP_End_Date || null,
      };

      const response = await fetch(`/api/rsvp/projects/${project.Project_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update project information");
      }

      const updatedProject = await response.json();
      setProject({ ...project, ...updatedProject });
      setIsEditingProjectInfo(false);
    } catch (error) {
      console.error("Error updating project information:", error);
      alert("Failed to update project information. Please try again.");
    } finally {
      setIsSavingProjectInfo(false);
    }
  };

  // Handler for saving general settings changes
  const handleSaveGeneralSettings = async () => {
    if (!project) return;

    setIsSavingGeneralSettings(true);

    try {
      const response = await fetch(`/api/rsvp/projects/${project.Project_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generalSettingsForm),
      });

      if (!response.ok) {
        throw new Error("Failed to update general settings");
      }

      const updatedProject = await response.json();
      setProject({ ...project, ...updatedProject });
      setIsEditingGeneralSettings(false);
    } catch (error) {
      console.error("Error updating general settings:", error);
      alert("Failed to update general settings. Please try again.");
    } finally {
      setIsSavingGeneralSettings(false);
    }
  };

  // Handler for saving colors changes
  const handleSaveColors = async () => {
    if (!project) return;

    setIsSavingColors(true);

    try {
      // Prepare update payload - convert empty strings to null
      const updateData = {
        RSVP_Primary_Color: colorsForm.RSVP_Primary_Color || null,
        RSVP_Secondary_Color: colorsForm.RSVP_Secondary_Color || null,
        RSVP_Accent_Color: colorsForm.RSVP_Accent_Color || null,
        RSVP_Background_Color: colorsForm.RSVP_Background_Color || null,
      };

      const response = await fetch(`/api/rsvp/projects/${project.Project_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update colors");
      }

      const updatedProject = await response.json();
      setProject({ ...project, ...updatedProject });
      setIsEditingColors(false);
    } catch (error) {
      console.error("Error updating colors:", error);
      alert("Failed to update colors. Please try again.");
    } finally {
      setIsSavingColors(false);
    }
  };

  // Handler for uploading images
  const handleImageUpload = async (file: File, fileName: "RSVP_Image.jpg" | "RSVP_BG_Image.jpg") => {
    if (!project) return;

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", fileName);

      const response = await fetch(`/api/rsvp/projects/${project.Project_ID}/files`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      // Reload the project to get the updated image URLs
      const projectResponse = await fetch(`/api/rsvp/projects/details/${project.RSVP_Slug || project.Project_ID}`);
      if (!projectResponse.ok) {
        throw new Error("Failed to reload project");
      }

      const data = await projectResponse.json();
      setProject(data.Project);

      alert("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handler for deleting images
  const handleImageDelete = async (fileName: "RSVP_Image.jpg" | "RSVP_BG_Image.jpg") => {
    if (!project) return;
    if (!confirm(`Are you sure you want to delete the ${fileName === "RSVP_Image.jpg" ? "main" : "background"} image?`)) return;

    setIsUploadingImage(true);

    try {
      // Get files to find the fileId
      const filesResponse = await fetch(`/api/rsvp/projects/${project.Project_ID}/files`);
      if (!filesResponse.ok) {
        throw new Error("Failed to fetch files");
      }

      const files = await filesResponse.json();
      const fileToDelete = files.find((f: any) => f.FileName === fileName);

      if (!fileToDelete) {
        alert("File not found");
        return;
      }

      // Delete the file
      const deleteResponse = await fetch(`/api/rsvp/projects/${project.Project_ID}/files?fileId=${fileToDelete.FileId}`, {
        method: "DELETE",
      });

      if (!deleteResponse.ok) {
        throw new Error("Failed to delete image");
      }

      // Reload the project to get the updated image URLs
      const projectResponse = await fetch(`/api/rsvp/projects/details/${project.RSVP_Slug || project.Project_ID}`);
      if (!projectResponse.ok) {
        throw new Error("Failed to reload project");
      }

      const data = await projectResponse.json();
      setProject(data.Project);

      alert("Image deleted successfully!");
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handler for saving meeting instructions
  const handleSaveMeetingInstructions = async () => {
    if (!editingMeetingInstructions) return;

    setIsSavingMeetingInstructions(true);

    try {
      const response = await fetch(`/api/rsvp/events/${editingMeetingInstructions}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Meeting_Instructions: meetingInstructionsForm
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update meeting instructions");
      }

      // Reload project data
      const projectResponse = await fetch(`/api/rsvp/projects/details/${project?.RSVP_Slug || project?.Project_ID}`);
      if (!projectResponse.ok) {
        throw new Error("Failed to reload project");
      }

      const data = await projectResponse.json();
      setProject(data.Project);
      setCampuses(data.Campuses);

      setEditingMeetingInstructions(null);
      alert("Meeting instructions updated successfully!");
    } catch (error) {
      console.error("Error updating meeting instructions:", error);
      alert("Failed to update meeting instructions. Please try again.");
    } finally {
      setIsSavingMeetingInstructions(false);
    }
  };

  // Handler for saving event capacity
  const handleSaveEventCapacity = async () => {
    if (!editingEventCapacity) return;

    setIsSavingEventCapacity(true);

    try {
      const response = await fetch(`/api/rsvp/events/${editingEventCapacity}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          RSVP_Capacity: eventCapacityForm.capacity,
          RSVP_Capacity_Modifier: eventCapacityForm.modifier
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update event capacity");
      }

      // Reload project data
      const projectResponse = await fetch(`/api/rsvp/projects/details/${project?.RSVP_Slug || project?.Project_ID}`);
      if (!projectResponse.ok) {
        throw new Error("Failed to reload project");
      }

      const data = await projectResponse.json();
      setProject(data.Project);
      setCampuses(data.Campuses);

      setEditingEventCapacity(null);
      alert("Event capacity updated successfully!");
    } catch (error) {
      console.error("Error updating event capacity:", error);
      alert("Failed to update event capacity. Please try again.");
    } finally {
      setIsSavingEventCapacity(false);
    }
  };

  // Handler for saving confirmation card
  const handleSaveConfirmationCard = async () => {
    if (!editingConfirmationCard) return;

    setIsSavingConfirmationCard(true);

    try {
      const response = await fetch(`/api/rsvp/confirmation-cards/${editingConfirmationCard.cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingConfirmationCard.config.title,
          bullets: editingConfirmationCard.config.bullets
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update confirmation card");
      }

      // Reload project data
      const projectResponse = await fetch(`/api/rsvp/projects/details/${project?.RSVP_Slug || project?.Project_ID}`);
      if (!projectResponse.ok) {
        throw new Error("Failed to reload project");
      }

      const data = await projectResponse.json();
      setProject(data.Project);
      setCampuses(data.Campuses);

      setEditingConfirmationCard(null);
      alert("Confirmation card updated successfully!");
    } catch (error) {
      console.error("Error updating confirmation card:", error);
      alert("Failed to update confirmation card. Please try again.");
    } finally {
      setIsSavingConfirmationCard(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Project not found
          </h2>
          <Link href="/rsvp">
            <Button variant="outline">Back to Project RSVPs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const displayTitle = project.RSVP_Title || project.Project_Title;

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/rsvp"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Project RSVPs
        </Link>
      </div>

      {/* Project Title with dropdown if multiple in same type */}
      {typeProjects.length > 1 ? (
        <div className="mb-6">
          <div className="relative inline-block group">
            <label className="flex items-center gap-2 cursor-pointer">
              <h1 className="text-3xl font-bold text-primary dark:text-foreground group-hover:text-[#61bc47] transition-colors">
                {project.Project_Title}
              </h1>
              <ChevronDown className="w-6 h-6 text-primary dark:text-foreground group-hover:text-[#61bc47] transition-colors" />
              <select
                value={project.Project_ID}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const selectedProject = typeProjects.find(p => p.Project_ID === parseInt(e.target.value));
                  if (selectedProject?.RSVP_Slug) {
                    window.location.href = `/rsvp/${selectedProject.RSVP_Slug}`;
                  }
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              >
                {typeProjects.map((p) => (
                  <option key={p.Project_ID} value={p.Project_ID}>
                    {p.Project_Title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ) : (
        <h1 className="text-3xl font-bold text-primary dark:text-foreground mb-6">
          {project.Project_Title}
        </h1>
      )}

      {/* Tabs */}
      <div className="border-b border-border mb-8">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-4 px-6 py-2 font-semibold transition-all relative rounded-t-lg ${
              activeTab === "details"
                ? "text-[#61bc47]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Details
            {activeTab === "details" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#61bc47]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("campuses")}
            className={`pb-4 px-6 py-2 font-semibold transition-all relative rounded-t-lg ${
              activeTab === "campuses"
                ? "text-[#61bc47]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {isChurchWide ? "Campuses" : selectedCampus.Congregation_Name}
            {activeTab === "campuses" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#61bc47]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("rsvps")}
            className={`pb-4 px-6 py-2 font-semibold transition-all relative rounded-t-lg ${
              activeTab === "rsvps"
                ? "text-[#61bc47]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Who's Coming?
            {activeTab === "rsvps" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#61bc47]" />
            )}
          </button>
        </div>
      </div>

      {/* Details Tab */}
      {activeTab === "details" && (
        <div className="mb-12 space-y-6">
          {/* Project Information Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold text-foreground">Project Information</h2>
              <div className="flex items-center gap-2">
                {isEditingProjectInfo && (
                  <button
                    className="px-3 py-1.5 text-sm bg-[#61bc47] text-white hover:bg-[#51a839] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleSaveProjectInfo()}
                    disabled={isSavingProjectInfo}
                  >
                    Save
                  </button>
                )}
                <button
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => {
                    if (isEditingProjectInfo) {
                      setIsEditingProjectInfo(false);
                      // Reset form to current project values
                      if (project) {
                        setProjectInfoForm({
                          RSVP_Title: project.RSVP_Title || "",
                          RSVP_Description: project.RSVP_Description || "",
                          RSVP_Start_Date: project.RSVP_Start_Date ? project.RSVP_Start_Date.split("T")[0] : "",
                          RSVP_End_Date: project.RSVP_End_Date ? project.RSVP_End_Date.split("T")[0] : "",
                        });
                      }
                    } else {
                      setIsEditingProjectInfo(true);
                    }
                  }}
                  title={isEditingProjectInfo ? "Cancel editing" : "Edit project information"}
                  disabled={isSavingProjectInfo}
                >
                  {isEditingProjectInfo ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isEditingProjectInfo ? (
              <div className="space-y-4">
                {/* RSVP Title Input */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    RSVP Title
                  </label>
                  <input
                    type="text"
                    value={projectInfoForm.RSVP_Title}
                    onChange={(e) => setProjectInfoForm({ ...projectInfoForm, RSVP_Title: e.target.value })}
                    disabled={isSavingProjectInfo}
                    placeholder="Enter custom RSVP title or leave blank to use project title"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave blank to use project title: "{project.Project_Title}"
                  </p>
                </div>

                {/* Description Textarea */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Description
                  </label>
                  <textarea
                    value={projectInfoForm.RSVP_Description}
                    onChange={(e) => setProjectInfoForm({ ...projectInfoForm, RSVP_Description: e.target.value })}
                    disabled={isSavingProjectInfo}
                    placeholder="Enter description (HTML supported)"
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-y"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    HTML is supported for formatting
                  </p>
                </div>

                {/* Date Range Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={projectInfoForm.RSVP_Start_Date}
                      onChange={(e) => setProjectInfoForm({ ...projectInfoForm, RSVP_Start_Date: e.target.value })}
                      disabled={isSavingProjectInfo}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={projectInfoForm.RSVP_End_Date}
                      onChange={(e) => setProjectInfoForm({ ...projectInfoForm, RSVP_End_Date: e.target.value })}
                      disabled={isSavingProjectInfo}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* RSVP Title */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    RSVP Title
                  </label>
                  <p className="text-sm text-foreground mt-1">
                    {displayTitle}
                  </p>
                </div>

                {/* Description */}
                {project.RSVP_Description && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Description
                    </label>
                    <div
                      className="text-sm text-foreground mt-1"
                      dangerouslySetInnerHTML={{ __html: project.RSVP_Description }}
                    />
                  </div>
                )}

                {/* Date Range */}
                {project.RSVP_Start_Date && project.RSVP_End_Date && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Date Range
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm text-foreground">
                        {formatDate(project.RSVP_Start_Date)} - {formatDate(project.RSVP_End_Date)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isSavingProjectInfo && (
              <div className="mt-4 text-sm text-muted-foreground italic">
                Saving changes...
              </div>
            )}
          </div>

          {/* General Settings Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold text-foreground">General Settings</h2>
              <div className="flex items-center gap-2">
                {isEditingGeneralSettings && (
                  <button
                    className="px-3 py-1.5 text-sm bg-[#61bc47] text-white hover:bg-[#51a839] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleSaveGeneralSettings()}
                    disabled={isSavingGeneralSettings}
                  >
                    Save
                  </button>
                )}
                <button
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => {
                    if (isEditingGeneralSettings) {
                      setIsEditingGeneralSettings(false);
                      // Reset form to current project values
                      if (project) {
                        setGeneralSettingsForm({
                          RSVP_Is_Active: project.RSVP_Is_Active ?? false,
                          RSVP_Require_Contact_Lookup: project.RSVP_Require_Contact_Lookup ?? false,
                          RSVP_Allow_Guest_Submission: project.RSVP_Allow_Guest_Submission ?? false,
                        });
                      }
                    } else {
                      setIsEditingGeneralSettings(true);
                    }
                  }}
                  title={isEditingGeneralSettings ? "Cancel editing" : "Edit general settings"}
                  disabled={isSavingGeneralSettings}
                >
                  {isEditingGeneralSettings ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isEditingGeneralSettings ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Status
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generalSettingsForm.RSVP_Is_Active}
                      onChange={(e) => setGeneralSettingsForm({ ...generalSettingsForm, RSVP_Is_Active: e.target.checked })}
                      disabled={isSavingGeneralSettings}
                      className="w-5 h-5 rounded border-border text-[#61bc47] focus:ring-[#61bc47] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-foreground">Active</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Require Contact Lookup
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generalSettingsForm.RSVP_Require_Contact_Lookup}
                      onChange={(e) => setGeneralSettingsForm({ ...generalSettingsForm, RSVP_Require_Contact_Lookup: e.target.checked })}
                      disabled={isSavingGeneralSettings}
                      className="w-5 h-5 rounded border-border text-[#61bc47] focus:ring-[#61bc47] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-foreground">Require Lookup</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Allow Guest Submission
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generalSettingsForm.RSVP_Allow_Guest_Submission}
                      onChange={(e) => setGeneralSettingsForm({ ...generalSettingsForm, RSVP_Allow_Guest_Submission: e.target.checked })}
                      disabled={isSavingGeneralSettings}
                      className="w-5 h-5 rounded border-border text-[#61bc47] focus:ring-[#61bc47] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-foreground">Allow Guests</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Status
                  </label>
                  <p className="text-sm text-foreground mt-1">
                    {project.RSVP_Is_Active ? 'Active' : 'Inactive'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Require Contact Lookup
                  </label>
                  <p className="text-sm text-foreground mt-1">
                    {project.RSVP_Require_Contact_Lookup ? 'Yes' : 'No'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Allow Guest Submission
                  </label>
                  <p className="text-sm text-foreground mt-1">
                    {project.RSVP_Allow_Guest_Submission ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            )}

            {isSavingGeneralSettings && (
              <div className="mt-4 text-sm text-muted-foreground italic">
                Saving changes...
              </div>
            )}
          </div>

          {/* Emails Card - Always visible */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold text-foreground">Emails</h2>
              <button
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                onClick={() => setIsEditingTemplates(!isEditingTemplates)}
                title={isEditingTemplates ? "Cancel editing" : "Edit email configuration"}
                disabled={isSavingTemplates}
              >
                {isEditingTemplates ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              </button>
            </div>

            {isEditingTemplates ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TemplateSelector
                    label="Confirmation Email Template"
                    type="email"
                    value={project.RSVP_Confirmation_Email_Template_ID}
                    onChange={(value) => handleTemplateUpdate("RSVP_Confirmation_Email_Template_ID", value)}
                    disabled={isSavingTemplates}
                    placeholder="Select email template..."
                  />

                  <TemplateSelector
                    label="Reminder Email Template"
                    type="email"
                    value={project.RSVP_Reminder_Email_Template_ID}
                    onChange={(value) => handleTemplateUpdate("RSVP_Reminder_Email_Template_ID", value)}
                    disabled={isSavingTemplates}
                    placeholder="Select email template..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Days Before Event to Send Reminder
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={daysToRemindInput}
                    onChange={(e) => setDaysToRemindInput(e.target.value)}
                    disabled={isSavingTemplates}
                    placeholder="e.g., 3"
                    className="w-full max-w-xs px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    How many days before the event should reminder emails be sent
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Confirmation Email Template
                    </label>
                    <p className="text-sm text-foreground mt-1">
                      {project.RSVP_Confirmation_Email_Template_ID ? (
                        <span className="font-mono">ID: {project.RSVP_Confirmation_Email_Template_ID}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Not set</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Reminder Email Template
                    </label>
                    <p className="text-sm text-foreground mt-1">
                      {project.RSVP_Reminder_Email_Template_ID ? (
                        <span className="font-mono">ID: {project.RSVP_Reminder_Email_Template_ID}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Not set</span>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Days Before Event to Send Reminder
                  </label>
                  <p className="text-sm text-foreground mt-1">
                    {project.RSVP_Days_To_Remind !== null ? (
                      <span>{project.RSVP_Days_To_Remind} days</span>
                    ) : (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {isSavingTemplates && (
              <div className="mt-4 text-sm text-muted-foreground italic">
                Saving changes...
              </div>
            )}
          </div>

          {/* Colors Card */}
          {(project.RSVP_Primary_Color || project.RSVP_Secondary_Color || project.RSVP_Accent_Color || project.RSVP_Background_Color) && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold text-foreground">Colors</h2>
                <div className="flex items-center gap-2">
                  {isEditingColors && (
                    <button
                      className="px-3 py-1.5 text-sm bg-[#61bc47] text-white hover:bg-[#51a839] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleSaveColors()}
                      disabled={isSavingColors}
                    >
                      Save
                    </button>
                  )}
                  <button
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => {
                      if (isEditingColors) {
                        setIsEditingColors(false);
                        // Reset form to current project values
                        if (project) {
                          setColorsForm({
                            RSVP_Primary_Color: project.RSVP_Primary_Color || "",
                            RSVP_Secondary_Color: project.RSVP_Secondary_Color || "",
                            RSVP_Accent_Color: project.RSVP_Accent_Color || "",
                            RSVP_Background_Color: project.RSVP_Background_Color || "",
                          });
                        }
                      } else {
                        setIsEditingColors(true);
                      }
                    }}
                    title={isEditingColors ? "Cancel editing" : "Edit colors"}
                    disabled={isSavingColors}
                  >
                    {isEditingColors ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isEditingColors ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Primary Color */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={colorsForm.RSVP_Primary_Color || "#000000"}
                        onChange={(e) => setColorsForm({ ...colorsForm, RSVP_Primary_Color: e.target.value })}
                        disabled={isSavingColors}
                        className="w-12 h-12 rounded border border-border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <input
                        type="text"
                        value={colorsForm.RSVP_Primary_Color}
                        onChange={(e) => setColorsForm({ ...colorsForm, RSVP_Primary_Color: e.target.value })}
                        disabled={isSavingColors}
                        placeholder="#000000"
                        className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={colorsForm.RSVP_Secondary_Color || "#000000"}
                        onChange={(e) => setColorsForm({ ...colorsForm, RSVP_Secondary_Color: e.target.value })}
                        disabled={isSavingColors}
                        className="w-12 h-12 rounded border border-border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <input
                        type="text"
                        value={colorsForm.RSVP_Secondary_Color}
                        onChange={(e) => setColorsForm({ ...colorsForm, RSVP_Secondary_Color: e.target.value })}
                        disabled={isSavingColors}
                        placeholder="#000000"
                        className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={colorsForm.RSVP_Accent_Color || "#000000"}
                        onChange={(e) => setColorsForm({ ...colorsForm, RSVP_Accent_Color: e.target.value })}
                        disabled={isSavingColors}
                        className="w-12 h-12 rounded border border-border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <input
                        type="text"
                        value={colorsForm.RSVP_Accent_Color}
                        onChange={(e) => setColorsForm({ ...colorsForm, RSVP_Accent_Color: e.target.value })}
                        disabled={isSavingColors}
                        placeholder="#000000"
                        className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Background Color */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Background Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={colorsForm.RSVP_Background_Color || "#000000"}
                        onChange={(e) => setColorsForm({ ...colorsForm, RSVP_Background_Color: e.target.value })}
                        disabled={isSavingColors}
                        className="w-12 h-12 rounded border border-border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <input
                        type="text"
                        value={colorsForm.RSVP_Background_Color}
                        onChange={(e) => setColorsForm({ ...colorsForm, RSVP_Background_Color: e.target.value })}
                        disabled={isSavingColors}
                        placeholder="#000000"
                        className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.RSVP_Primary_Color && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-border"
                        style={{ backgroundColor: project.RSVP_Primary_Color }}
                      />
                      <div>
                        <p className="text-xs text-muted-foreground">Primary</p>
                        <p className="text-sm font-mono text-foreground">{project.RSVP_Primary_Color}</p>
                      </div>
                    </div>
                  )}
                  {project.RSVP_Secondary_Color && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-border"
                        style={{ backgroundColor: project.RSVP_Secondary_Color }}
                      />
                      <div>
                        <p className="text-xs text-muted-foreground">Secondary</p>
                        <p className="text-sm font-mono text-foreground">{project.RSVP_Secondary_Color}</p>
                      </div>
                    </div>
                  )}
                  {project.RSVP_Accent_Color && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-border"
                        style={{ backgroundColor: project.RSVP_Accent_Color }}
                      />
                      <div>
                        <p className="text-xs text-muted-foreground">Accent</p>
                        <p className="text-sm font-mono text-foreground">{project.RSVP_Accent_Color}</p>
                      </div>
                    </div>
                  )}
                  {project.RSVP_Background_Color && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-border"
                        style={{ backgroundColor: project.RSVP_Background_Color }}
                      />
                      <div>
                        <p className="text-xs text-muted-foreground">Background</p>
                        <p className="text-sm font-mono text-foreground">{project.RSVP_Background_Color}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isSavingColors && (
                <div className="mt-4 text-sm text-muted-foreground italic">
                  Saving changes...
                </div>
              )}
            </div>
          )}

          {/* Images Card */}
          {(project.RSVP_Image_URL || project.RSVP_BG_Image_URL || isEditingImages) && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold text-foreground">Images</h2>
                <button
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setIsEditingImages(!isEditingImages)}
                  title={isEditingImages ? "Cancel editing" : "Edit images"}
                  disabled={isUploadingImage}
                >
                  {isEditingImages ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* RSVP Image */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Image</p>
                  {project.RSVP_Image_URL && (
                    <img
                      src={project.RSVP_Image_URL}
                      alt="RSVP Image"
                      className="w-full h-auto rounded border border-border mb-3"
                    />
                  )}
                  {isEditingImages && (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file, "RSVP_Image.jpg");
                          }
                        }}
                        disabled={isUploadingImage}
                        className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#61bc47] file:text-white hover:file:bg-[#51a839] file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      {project.RSVP_Image_URL && (
                        <button
                          onClick={() => handleImageDelete("RSVP_Image.jpg")}
                          disabled={isUploadingImage}
                          className="w-full px-3 py-2 text-sm border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete Image
                        </button>
                      )}
                    </div>
                  )}
                  {!project.RSVP_Image_URL && !isEditingImages && (
                    <p className="text-sm text-muted-foreground italic">No image set</p>
                  )}
                </div>

                {/* Background Image */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Background Image</p>
                  {project.RSVP_BG_Image_URL && (
                    <img
                      src={project.RSVP_BG_Image_URL}
                      alt="Background Image"
                      className="w-full h-auto rounded border border-border mb-3"
                    />
                  )}
                  {isEditingImages && (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file, "RSVP_BG_Image.jpg");
                          }
                        }}
                        disabled={isUploadingImage}
                        className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#61bc47] file:text-white hover:file:bg-[#51a839] file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      {project.RSVP_BG_Image_URL && (
                        <button
                          onClick={() => handleImageDelete("RSVP_BG_Image.jpg")}
                          disabled={isUploadingImage}
                          className="w-full px-3 py-2 text-sm border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete Background Image
                        </button>
                      )}
                    </div>
                  )}
                  {!project.RSVP_BG_Image_URL && !isEditingImages && (
                    <p className="text-sm text-muted-foreground italic">No background image set</p>
                  )}
                </div>
              </div>

              {isUploadingImage && (
                <div className="mt-4 text-sm text-muted-foreground italic">
                  Uploading image...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Campuses Section - Campus-specific configuration */}
      {activeTab === "campuses" && (
      <div className="mb-12">
        {filteredCampuses.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No campuses found
            </h3>
            <p className="text-muted-foreground">
              Add campuses to this project in MinistryPlatform.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Iterate through each campus */}
            {filteredCampuses.map((campus) => (
              <div key={campus.Congregation_ID}>
                {/* Campus Header - Only show when Church Wide */}
                {isChurchWide && (
                  <div className="sticky top-16 bg-background/60 backdrop-blur-md border-b border-border z-10 py-4 mb-2">
                    <h3 className="text-2xl font-bold text-foreground">{campus.Campus_Name}</h3>
                    <div className="h-1 w-20 bg-[#61bc47] rounded mt-2" />
                  </div>
                )}

                {/* Public Event Info */}
                {campus.Public_Event_ID ? (
                  <div className={`bg-card border border-border rounded-lg overflow-hidden max-w-md relative mb-6 ${isChurchWide ? 'mt-4' : ''}`}>
                    {/* Public Event Image */}
                    {campus.Public_Event_Image_URL && (
                      <div className="w-full bg-muted">
                        <img
                          src={campus.Public_Event_Image_URL}
                          alt="Additional Meeting Information"
                          className="w-full h-auto"
                        />
                      </div>
                    )}

                    {/* Public Event Text Content */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-[#61bc47]" />
                          <h4 className="font-semibold text-foreground">Additional Meeting Information</h4>
                        </div>
                        {editingMeetingInstructions === campus.Public_Event_ID ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingMeetingInstructions(null);
                                setMeetingInstructionsForm("");
                              }}
                              className="px-3 py-1 text-xs border border-border rounded-md text-foreground hover:bg-muted transition-colors"
                              disabled={isSavingMeetingInstructions}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveMeetingInstructions}
                              className="px-3 py-1 text-xs bg-[#61bc47] text-white rounded-md hover:bg-[#51a839] transition-colors flex items-center gap-1"
                              disabled={isSavingMeetingInstructions}
                            >
                              {isSavingMeetingInstructions ? (
                                <>Saving...</>
                              ) : (
                                <>
                                  <Save className="w-3 h-3" />
                                  Save
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <button
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                            onClick={() => {
                              setEditingMeetingInstructions(campus.Public_Event_ID!);
                              setMeetingInstructionsForm(campus.Meeting_Instructions || "");
                            }}
                            title="Edit meeting instructions"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {editingMeetingInstructions === campus.Public_Event_ID ? (
                        <textarea
                          value={meetingInstructionsForm}
                          onChange={(e) => setMeetingInstructionsForm(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] pl-6"
                          rows={6}
                          disabled={isSavingMeetingInstructions}
                          placeholder="Enter meeting instructions..."
                        />
                      ) : (
                        campus.Meeting_Instructions && (
                          <p className="text-sm text-muted-foreground pl-6">{campus.Meeting_Instructions}</p>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`bg-card border border-dashed border-border rounded-lg p-6 text-center max-w-md mb-6 ${isChurchWide ? 'mt-4' : ''}`}>
                    <p className="text-sm text-muted-foreground">No public-facing event configured</p>
                  </div>
                )}

                {/* Check if campus has events */}
                {!campus.Events || campus.Events.length === 0 ? (
                  <div className="bg-card border border-dashed border-border rounded-lg p-8 text-center mb-8">
                    <p className="text-muted-foreground">No events for this campus</p>
                  </div>
                ) : (
                  <div className="space-y-8 mb-8">
                    {/* Group campus events by date */}
                    {Object.entries(
                      campus.Events.reduce((dateGroups, event) => {
                        const date = event.Event_Start_Date
                          ? new Date(event.Event_Start_Date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })
                          : "No Date";
                        if (!dateGroups[date]) dateGroups[date] = [];
                        dateGroups[date].push(event);
                        return dateGroups;
                      }, {} as Record<string, ProjectEventWithDetails[]>)
                    ).map(([date, dateEvents]) => (
                      <div key={date}>
                        {/* Date Header */}
                        <div className="flex items-center gap-2 mb-4">
                          <Calendar className="w-5 h-5 text-[#61bc47]" />
                          <h4 className="text-lg font-semibold text-foreground">{date}</h4>
                        </div>

                        {/* Event Cards - Horizontal Scroll */}
                        <div className="overflow-x-auto pb-4 -mx-4 px-4">
                          <div className="flex gap-4" style={{ minWidth: "min-content" }}>
                            {dateEvents.map((event) => (
                            <div
                              key={event.Event_ID}
                              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow flex-shrink-0 relative"
                              style={{ width: "320px" }}
                            >
                        {/* Header with Time and Edit Controls */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-[#61bc47]" />
                            <span className="text-2xl font-bold text-foreground">
                              {event.Event_Start_Date
                                ? new Date(event.Event_Start_Date).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })
                                : "N/A"}
                            </span>
                          </div>
                          {editingEventCapacity === event.Event_ID ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingEventCapacity(null);
                                  setEventCapacityForm({ capacity: null, modifier: null });
                                }}
                                className="px-2 py-1 text-xs border border-border rounded-md text-foreground hover:bg-muted transition-colors"
                                disabled={isSavingEventCapacity}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveEventCapacity}
                                className="px-2 py-1 text-xs bg-[#61bc47] text-white rounded-md hover:bg-[#51a839] transition-colors flex items-center gap-1"
                                disabled={isSavingEventCapacity}
                              >
                                {isSavingEventCapacity ? (
                                  <>Saving...</>
                                ) : (
                                  <>
                                    <Save className="w-3 h-3" />
                                    Save
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <button
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                              onClick={() => {
                                setEditingEventCapacity(event.Event_ID);
                                setEventCapacityForm({
                                  capacity: event.Capacity,
                                  modifier: event.RSVP_Capacity_Modifier
                                });
                              }}
                              title="Edit event capacity"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Capacity Bar */}
                        <div className="mb-4">
                          {(() => {
                            const modifier = event.RSVP_Capacity_Modifier ?? 0;
                            const effectiveAttendees = event.Total_Attendees + modifier;
                            const capacityPercentage = event.Capacity
                              ? Math.round((effectiveAttendees / event.Capacity) * 100)
                              : 0;

                            // Get color based on percentage (matching widget)
                            const getCapacityColor = (pct: number): string => {
                              if (pct <= 50) return "#10B981"; // green-500
                              if (pct <= 75) return "#EAB308"; // yellow-500
                              if (pct <= 90) return "#F97316"; // orange-500
                              return "#EF4444"; // red-500
                            };

                            // Get status text (matching widget)
                            const getCapacityText = (pct: number): string => {
                              if (pct === 0) return "Plenty of space";
                              if (pct <= 50) return "Plenty of space";
                              if (pct <= 75) return "Good availability";
                              if (pct <= 90) return "Filling up";
                              if (pct < 100) return "Near capacity";
                              return "Overflow";
                            };

                            return (
                              <>
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium uppercase text-xs tracking-wide text-muted-foreground">
                                      {getCapacityText(capacityPercentage)}
                                    </span>
                                  </div>
                                  {event.Capacity && (
                                    <span className="font-bold text-lg text-foreground">
                                      {capacityPercentage}%
                                    </span>
                                  )}
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full transition-all"
                                    style={{
                                      width: event.Capacity
                                        ? `${Math.min(capacityPercentage, 100)}%`
                                        : "0%",
                                      backgroundColor: getCapacityColor(capacityPercentage),
                                    }}
                                  />
                                </div>
                                {!event.Capacity && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    No capacity limit
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        {/* Stats */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">RSVPs:</span>
                            <span className="font-semibold text-foreground">
                              {event.RSVP_Count}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Attendees:</span>
                            <span className="font-semibold text-foreground">
                              {event.Total_Attendees}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Capacity:</span>
                            {editingEventCapacity === event.Event_ID ? (
                              <input
                                type="number"
                                value={eventCapacityForm.capacity ?? ""}
                                onChange={(e) =>
                                  setEventCapacityForm({
                                    ...eventCapacityForm,
                                    capacity: e.target.value ? parseInt(e.target.value) : null
                                  })
                                }
                                className="w-24 px-2 py-1 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                                placeholder="Unlimited"
                                disabled={isSavingEventCapacity}
                              />
                            ) : (
                              <span className="font-semibold text-foreground">
                                {event.Capacity ?? 'Unlimited'}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Capacity Modifier:</span>
                            {editingEventCapacity === event.Event_ID ? (
                              <input
                                type="number"
                                value={eventCapacityForm.modifier ?? ""}
                                onChange={(e) =>
                                  setEventCapacityForm({
                                    ...eventCapacityForm,
                                    modifier: e.target.value ? parseInt(e.target.value) : null
                                  })
                                }
                                className="w-24 px-2 py-1 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                                placeholder="0"
                                disabled={isSavingEventCapacity}
                              />
                            ) : (
                              <span className="font-semibold text-foreground">
                                {event.RSVP_Capacity_Modifier != null && event.RSVP_Capacity_Modifier > 0 ? '+' : ''}{event.RSVP_Capacity_Modifier ?? 0}
                              </span>
                            )}
                          </div>
                          {editingEventCapacity === event.Event_ID && (
                            <p className="text-xs text-muted-foreground italic mt-2">
                              Modifier represents additional attendees to account for (e.g., fake RSVPs or reserved spots)
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
                  </div>
                )}

                {/* Confirmation Cards for this campus */}
                {campus.Confirmation_Cards && campus.Confirmation_Cards.length > 0 && (
                  <div className="mt-8">
                    {/* Confirmation Cards Heading */}
                    <div className="flex items-center gap-2 mb-6">
                      <CheckCircle2 className="w-5 h-5 text-[#61bc47]" />
                      <h4 className="text-lg font-semibold text-foreground">
                        Confirmation Cards
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      {campus.Confirmation_Cards.map((card) => {
                          // Parse configuration JSON if it exists
                          let config: { title?: string; bullets?: Array<{ icon?: string; text?: string }> } = {};
                          try {
                            if (card.Configuration) {
                              config = JSON.parse(card.Configuration);
                            }
                          } catch (e) {
                            console.error("Failed to parse card configuration:", e);
                          }

                          // Check if card is global (null or 1)
                          const isGlobal = card.Congregation_ID === null || card.Congregation_ID === 1;

                          return (
                            <div key={card.Card_ID} className="bg-card border border-border rounded-lg p-6 w-fit max-w-md relative">
                              {/* Edit Button */}
                              <button
                                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                onClick={() => {
                                  setEditingConfirmationCard({
                                    cardId: card.Card_ID,
                                    config: {
                                      title: config.title || card.Card_Type_Name,
                                      bullets: config.bullets || []
                                    }
                                  });
                                }}
                                title="Edit confirmation card"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              <div className="flex items-center gap-4 mb-6">
                                <h4 className="text-xl font-semibold text-foreground">
                                  {config.title || card.Card_Type_Name}
                                </h4>
                                {isGlobal && (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#61bc47]/10 text-[#61bc47] border border-[#61bc47]/20 whitespace-nowrap">
                                    All campuses
                                  </span>
                                )}
                              </div>
                              {config.bullets && config.bullets.length > 0 && (
                                <div className="space-y-4">
                                  {config.bullets.map((bullet, index) => {
                                    const IconComponent = getIconComponent(bullet.icon || null);
                                    return (
                                      <div
                                        key={index}
                                        className="flex items-center gap-4"
                                      >
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#61bc47]/10 border border-[#61bc47]/20 flex items-center justify-center">
                                          <IconComponent className="w-5 h-5 text-[#61bc47]" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm text-muted-foreground leading-relaxed">
                                            {bullet.text}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* RSVP Submissions Section */}
      {activeTab === "rsvps" && (
      <div className="mb-12">
          <div className="space-y-4">
            {/* Floating Stats - Only show when there are RSVPs */}
            {filteredRsvps.length > 0 && (
              <div className="flex gap-8 mb-8">
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <Activity className="w-5 h-5 text-[#61bc47] flex-shrink-0" />
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Attendees</h3>
                  </div>
                  <p className="text-5xl font-bold text-foreground">{totalAttendees}</p>
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <Users className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total RSVPs</h3>
                  </div>
                  <p className="text-5xl font-bold text-muted-foreground">{totalRSVPs}</p>
                </div>
              </div>
            )}

            {/* Charts - 2 Column Grid */}
            {filteredRsvps.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* RSVPs Over Time Chart */}
                <div className="bg-card border border-border rounded-lg p-6 flex flex-col h-[500px]">
                  <h3 className="text-lg font-semibold text-foreground mb-2">RSVPs Over Time</h3>
                  <div className="flex-1 min-h-0">
                    {(() => {
                      // Build cumulative RSVP and attendee data by date
                      const sortedRsvps = [...filteredRsvps].sort((a, b) =>
                        new Date(a.RSVP_Date).getTime() - new Date(b.RSVP_Date).getTime()
                      );

                      // Group by date and calculate cumulative for both RSVPs and attendees
                      const dateMap = new Map<string, { rsvpCount: number; attendeeCount: number }>();

                      sortedRsvps.forEach(rsvp => {
                        const date = new Date(rsvp.RSVP_Date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                        if (!dateMap.has(date)) {
                          dateMap.set(date, { rsvpCount: 0, attendeeCount: 0 });
                        }
                        const current = dateMap.get(date)!;
                        current.rsvpCount += 1;
                        current.attendeeCount += (rsvp.Party_Size || 1);
                      });

                      const dataPoints: Array<{ date: string; rsvps: number; attendees: number }> = [];
                      let cumulativeRsvps = 0;
                      let cumulativeAttendees = 0;

                      dateMap.forEach((data, date) => {
                        cumulativeRsvps += data.rsvpCount;
                        cumulativeAttendees += data.attendeeCount;
                        dataPoints.push({ date, rsvps: cumulativeRsvps, attendees: cumulativeAttendees });
                      });

                      return (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dataPoints} margin={{ top: 10, right: 20, bottom: 5, left: 5 }}>
                            <defs>
                              <linearGradient id="colorAttendees" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#61bc47" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#61bc47" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorRsvps" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#666666"
                              strokeOpacity={0.5}
                              vertical={true}
                              horizontal={true}
                            />
                            <XAxis
                              dataKey="date"
                              stroke="#888888"
                              fontSize={11}
                              tickLine={true}
                              axisLine={true}
                              angle={-45}
                              textAnchor="end"
                              height={50}
                              tick={{ fill: "#888888" }}
                            />
                            <YAxis
                              stroke="#888888"
                              fontSize={11}
                              tickLine={true}
                              axisLine={true}
                              tick={{ fill: "#888888" }}
                              allowDecimals={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "6px",
                                fontSize: "12px"
                              }}
                              labelStyle={{ color: "hsl(var(--foreground))" }}
                            />
                            <Legend
                              verticalAlign="top"
                              height={30}
                              iconType="line"
                              wrapperStyle={{ fontSize: "12px" }}
                            />
                            <Area
                              type="monotone"
                              dataKey="attendees"
                              stroke="#61bc47"
                              strokeWidth={2}
                              fill="url(#colorAttendees)"
                              name="Total Attendees"
                              dot={{ fill: "#61bc47", strokeWidth: 2, r: 4, stroke: "#fff" }}
                              activeDot={{ r: 6, fill: "#61bc47", stroke: "#fff", strokeWidth: 2 }}
                            />
                            <Area
                              type="monotone"
                              dataKey="rsvps"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              fill="url(#colorRsvps)"
                              name="Total RSVPs"
                              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4, stroke: "#fff" }}
                              activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </div>
                </div>

                {/* Events Chart */}
                <div className="bg-card border border-border rounded-lg p-6 flex flex-col h-[500px]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      {isChurchWide ? "Events" : selectedCampus.Congregation_Name}
                    </h3>
                    {/* Legend - Sticky at top */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-[#3b82f6]" />
                        <span className="text-muted-foreground">RSVPs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-[#61bc47]" />
                        <span className="text-muted-foreground">Party Size</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3">
                    {(() => {
                      // Group by campus, then by event
                      const campusEventData = filteredRsvps.reduce((acc, rsvp) => {
                        const campus = rsvp.Campus_Name || "Unknown Campus";
                        const event = rsvp.Event_Title || "Unknown Event";

                        if (!acc[campus]) {
                          acc[campus] = {};
                        }
                        if (!acc[campus][event]) {
                          acc[campus][event] = { rsvpCount: 0, attendeeCount: 0 };
                        }

                        acc[campus][event].rsvpCount++;
                        acc[campus][event].attendeeCount += (rsvp.Party_Size || 1);

                        return acc;
                      }, {} as Record<string, Record<string, { rsvpCount: number; attendeeCount: number }>>);

                      // Find max for scaling across all events
                      const allEventsData = Object.values(campusEventData).flatMap(events => Object.values(events));
                      const maxAttendees = Math.max(...allEventsData.map(e => e.attendeeCount));

                      return (
                        <>
                          {Object.entries(campusEventData)
                            .sort(([campusA], [campusB]) => campusA.localeCompare(campusB))
                            .map(([campus, events]) => (
                              <div key={campus} className="space-y-3">
                                {/* Campus Header - only if Church Wide */}
                                {isChurchWide && (
                                  <h4 className="text-sm font-semibold text-foreground/80 pt-2 first:pt-0">{campus}</h4>
                                )}

                                {/* Events for this campus */}
                                {Object.entries(events)
                                  .sort(([, a], [, b]) => b.attendeeCount - a.attendeeCount)
                                  .map(([event, data]) => {
                                    const rsvpPercentage = (data.rsvpCount / maxAttendees) * 100;
                                    const partySizeCount = data.attendeeCount - data.rsvpCount;
                                    const partySizePercentage = (partySizeCount / maxAttendees) * 100;

                                    return (
                                      <div key={event} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                          <div className="flex-1 truncate">
                                            <span className="font-medium text-muted-foreground">{event}</span>
                                          </div>
                                          <span className="font-semibold text-foreground ml-2">{data.attendeeCount}</span>
                                        </div>
                                        {/* Stacked horizontal bar */}
                                        <div className="flex h-6 bg-muted rounded-full overflow-hidden">
                                          {/* RSVPs portion (blue) */}
                                          <div
                                            className="bg-[#3b82f6] flex items-center justify-center text-[10px] text-white font-semibold"
                                            style={{ width: `${rsvpPercentage}%` }}
                                          >
                                            {rsvpPercentage > 12 && data.rsvpCount}
                                          </div>
                                          {/* Party Size portion (green) */}
                                          <div
                                            className="bg-[#61bc47] flex items-center justify-center text-[10px] text-white font-semibold"
                                            style={{ width: `${partySizePercentage}%` }}
                                          >
                                            {partySizePercentage > 12 && `+${partySizeCount}`}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            ))}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {filteredRsvps.length === 0 ? (
              <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No RSVPs yet
                </h3>
                <p className="text-muted-foreground">
                  RSVPs submitted for this project will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Filter Controls */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={isChurchWide ? "Search by name, event, or campus..." : "Search by name or event..."}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] focus:border-transparent"
                    />
                  </div>
                  {(searchText || Object.keys(columnFilters).length > 0) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchText("");
                        setColumnFilters({});
                      }}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto border border-border rounded-lg">
                  {(() => {
                    // Get all unique questions from filtered RSVPs (respecting congregation filter)
                    const questions = getAllQuestions(filteredRsvps);

                    // Apply search and column filters to already congregation-filtered RSVPs
                    const searchFilteredRsvps = filteredRsvps.filter((rsvp) => {
                      // Search text filter (name, event, campus)
                      if (searchText) {
                        const searchLower = searchText.toLowerCase();
                        const fullName = `${rsvp.First_Name} ${rsvp.Last_Name}`.toLowerCase();
                        const event = (rsvp.Event_Title || "").toLowerCase();
                        const campus = (rsvp.Campus_Name || "").toLowerCase();

                        if (!fullName.includes(searchLower) &&
                            !event.includes(searchLower) &&
                            !campus.includes(searchLower)) {
                          return false;
                        }
                      }

                      // Column-specific filters
                      const answers = parseAnswerSummary(rsvp.Answer_Summary);
                      for (const [question, filterValues] of Object.entries(columnFilters)) {
                        if (filterValues && filterValues.length > 0) {
                          if (!filterValues.includes(answers[question])) {
                            return false;
                          }
                        }
                      }

                      return true;
                    });

                    return (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground whitespace-nowrap">
                              Name
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground whitespace-nowrap">
                              Event
                            </th>
                            {isChurchWide && (
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground whitespace-nowrap">
                                Campus
                              </th>
                            )}
                            {questions.map((question) => {
                              // Get unique values for this question from congregation-filtered RSVPs
                              const uniqueValues = Array.from(new Set(
                                filteredRsvps.map(r => parseAnswerSummary(r.Answer_Summary)[question]).filter(Boolean)
                              )).sort();

                              const selectedValues = columnFilters[question] || [];
                              const isOpen = openDropdown === question;

                              return (
                                <th
                                  key={question}
                                  className="text-left py-3 px-4 text-sm font-semibold text-foreground whitespace-nowrap"
                                >
                                  <div className="flex flex-col gap-2">
                                    <span>{question}</span>
                                    {uniqueValues.length > 0 && uniqueValues.length <= 10 && (
                                      <div className="relative filter-dropdown">
                                        <button
                                          onClick={() => setOpenDropdown(isOpen ? null : question)}
                                          className="w-full text-xs font-normal border border-border rounded px-2 py-1 bg-background text-foreground flex items-center justify-between hover:bg-muted transition-colors"
                                        >
                                          <span className="truncate">
                                            {selectedValues.length === 0
                                              ? "All"
                                              : selectedValues.length === 1
                                              ? selectedValues[0]
                                              : `${selectedValues.length} selected`}
                                          </span>
                                          <ChevronDown className="w-3 h-3 flex-shrink-0 ml-1" />
                                        </button>
                                        {isOpen && (
                                          <div className="absolute z-10 mt-1 w-full min-w-[200px] bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                                            {uniqueValues.map((value) => {
                                              const isSelected = selectedValues.includes(value);
                                              return (
                                                <label
                                                  key={value}
                                                  className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer text-xs"
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                      setColumnFilters((prev) => {
                                                        const next = { ...prev };
                                                        const current = next[question] || [];
                                                        if (e.target.checked) {
                                                          next[question] = [...current, value];
                                                        } else {
                                                          next[question] = current.filter(
                                                            (v) => v !== value
                                                          );
                                                          if (next[question].length === 0) {
                                                            delete next[question];
                                                          }
                                                        }
                                                        return next;
                                                      });
                                                    }}
                                                    className="rounded border-border text-[#61bc47] focus:ring-[#61bc47]"
                                                  />
                                                  <span className="flex-1">{value}</span>
                                                </label>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </th>
                              );
                            })}
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground whitespace-nowrap">
                              Submitted
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchFilteredRsvps.length === 0 ? (
                            <tr>
                              <td colSpan={questions.length + (isChurchWide ? 4 : 3)} className="py-8 text-center text-muted-foreground">
                                No RSVPs match your filters
                              </td>
                            </tr>
                          ) : (
                            <>
                              {searchFilteredRsvps.map((rsvp) => {
                                const answers = parseAnswerSummary(rsvp.Answer_Summary);

                                return (
                                  <tr
                                    key={rsvp.Event_RSVP_ID}
                                    className="border-b border-border hover:bg-muted/50 transition-colors"
                                  >
                                    <td className="py-3 px-4 text-sm text-foreground whitespace-nowrap">
                                      {rsvp.First_Name} {rsvp.Last_Name}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                      {rsvp.Event_Title || "N/A"}
                                    </td>
                                    {isChurchWide && (
                                      <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                        {rsvp.Campus_Name || "N/A"}
                                      </td>
                                    )}
                                    {questions.map((question) => (
                                      <td
                                        key={question}
                                        className="py-3 px-4 text-sm text-foreground whitespace-nowrap"
                                      >
                                        {answers[question] || "-"}
                                      </td>
                                    ))}
                                    <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                      {formatDate(rsvp.RSVP_Date)}
                                    </td>
                                  </tr>
                                );
                              })}
                              {/* Summary Row */}
                              <tr className="bg-muted/50 font-semibold border-t-2 border-border">
                                <td className="py-3 px-4 text-sm text-foreground whitespace-nowrap">
                                  Total: {searchFilteredRsvps.length}
                                </td>
                                <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                  -
                                </td>
                                {isChurchWide && (
                                  <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                    -
                                  </td>
                                )}
                                {questions.map((question) => {
                                  // Collect all values for this question
                                  const values = searchFilteredRsvps
                                    .map(r => parseAnswerSummary(r.Answer_Summary)[question])
                                    .filter(Boolean);

                                  // Check if numeric
                                  const numericValues = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
                                  if (numericValues.length > 0 && numericValues.length === values.length) {
                                    // All values are numeric - show sum
                                    const sum = numericValues.reduce((a, b) => a + b, 0);
                                    return (
                                      <td key={question} className="py-3 px-4 text-sm text-foreground whitespace-nowrap">
                                        {sum}
                                      </td>
                                    );
                                  }

                                  // For non-numeric, show count of unique values
                                  const uniqueCount = new Set(values).size;
                                  if (uniqueCount <= 3) {
                                    // Show value counts if few unique values (boolean-like)
                                    const counts = values.reduce((acc, val) => {
                                      acc[val] = (acc[val] || 0) + 1;
                                      return acc;
                                    }, {} as Record<string, number>);

                                    return (
                                      <td key={question} className="py-3 px-4 text-sm text-foreground whitespace-nowrap">
                                        {Object.entries(counts).map(([val, count]) => `${val}: ${count}`).join(", ")}
                                      </td>
                                    );
                                  }

                                  return (
                                    <td key={question} className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                      -
                                    </td>
                                  );
                                })}
                                <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                  -
                                </td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
      </div>
      )}


      {/* Confirmation Card Edit Modal */}
      {editingConfirmationCard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-foreground">Edit Confirmation Card</h3>
                <button
                  onClick={() => setEditingConfirmationCard(null)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  disabled={isSavingConfirmationCard}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-6">
                {/* Title Input */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Card Title
                  </label>
                  <input
                    type="text"
                    value={editingConfirmationCard.config.title}
                    onChange={(e) =>
                      setEditingConfirmationCard({
                        ...editingConfirmationCard,
                        config: {
                          ...editingConfirmationCard.config,
                          title: e.target.value
                        }
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                    disabled={isSavingConfirmationCard}
                  />
                </div>

                {/* Bullets */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Bullet Points
                  </label>
                  <div className="space-y-4">
                    {editingConfirmationCard.config.bullets.map((bullet, index) => (
                      <div key={index} className="flex gap-3 items-start p-4 bg-background border border-border rounded-lg">
                        <div className="flex-1 space-y-3">
                          {/* Icon Picker */}
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2">
                              Icon
                            </label>
                            <div className="grid grid-cols-8 gap-2">
                              {getAvailableIcons().map((iconOption) => {
                                const IconComp = iconOption.component;
                                const isSelected = bullet.icon === iconOption.name;
                                return (
                                  <button
                                    key={iconOption.name}
                                    type="button"
                                    onClick={() => {
                                      const newBullets = [...editingConfirmationCard.config.bullets];
                                      newBullets[index] = { ...bullet, icon: iconOption.name };
                                      setEditingConfirmationCard({
                                        ...editingConfirmationCard,
                                        config: {
                                          ...editingConfirmationCard.config,
                                          bullets: newBullets
                                        }
                                      });
                                    }}
                                    className={`p-3 rounded-md border transition-all ${
                                      isSelected
                                        ? "border-[#61bc47] bg-[#61bc47]/10"
                                        : "border-border hover:border-[#61bc47]/50 hover:bg-muted"
                                    }`}
                                    title={iconOption.name}
                                    disabled={isSavingConfirmationCard}
                                  >
                                    <IconComp className={`w-5 h-5 ${isSelected ? "text-[#61bc47]" : "text-muted-foreground"}`} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Text Input */}
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2">
                              Text
                            </label>
                            <textarea
                              value={bullet.text}
                              onChange={(e) => {
                                const newBullets = [...editingConfirmationCard.config.bullets];
                                newBullets[index] = { ...bullet, text: e.target.value };
                                setEditingConfirmationCard({
                                  ...editingConfirmationCard,
                                  config: {
                                    ...editingConfirmationCard.config,
                                    bullets: newBullets
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 bg-card border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                              rows={2}
                              disabled={isSavingConfirmationCard}
                            />
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            const newBullets = editingConfirmationCard.config.bullets.filter((_, i) => i !== index);
                            setEditingConfirmationCard({
                              ...editingConfirmationCard,
                              config: {
                                ...editingConfirmationCard.config,
                                bullets: newBullets
                              }
                            });
                          }}
                          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors"
                          title="Delete bullet point"
                          disabled={isSavingConfirmationCard}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Add Bullet Button */}
                    <button
                      onClick={() => {
                        setEditingConfirmationCard({
                          ...editingConfirmationCard,
                          config: {
                            ...editingConfirmationCard.config,
                            bullets: [
                              ...editingConfirmationCard.config.bullets,
                              { icon: "Info", text: "" }
                            ]
                          }
                        });
                      }}
                      className="w-full py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-[#61bc47] transition-colors flex items-center justify-center gap-2"
                      disabled={isSavingConfirmationCard}
                    >
                      <Plus className="w-4 h-4" />
                      Add Bullet Point
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-border">
                  <button
                    onClick={() => setEditingConfirmationCard(null)}
                    className="px-4 py-2 text-sm border border-border rounded-md text-foreground hover:bg-muted transition-colors"
                    disabled={isSavingConfirmationCard}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveConfirmationCard}
                    className="px-4 py-2 text-sm bg-[#61bc47] text-white rounded-md hover:bg-[#51a839] transition-colors flex items-center gap-2"
                    disabled={isSavingConfirmationCard}
                  >
                    {isSavingConfirmationCard ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
