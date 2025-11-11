"use client";

// People Search app - look up contacts and view their information
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Search, User, Mail, Phone, Home, Users, Loader2, X, ChevronRight, Info, Edit, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useCampus } from "@/contexts/CampusContext";
import AppSimulationModal from "@/components/AppSimulationModal";
import { useAppPermissions } from "@/hooks/useAppPermissions";

type Contact = {
  Contact_ID: number;
  First_Name: string | null;
  Last_Name: string;
  Nickname: string | null;
  Display_Name: string;
  Email_Address: string | null;
  Mobile_Phone: string | null;
  Company_Phone: string | null;
  Date_of_Birth: string | null;
  Gender_ID: number | null;
  Marital_Status_ID: number | null;
  Household_ID: number | null;
  Household_Position_ID: number | null;
  Participant_Record: number | null;
  Company: boolean | null;
  Company_Name: string | null;
  __Age: number | null;
  Contact_Status_ID: number | null;
  Image_GUID?: string | null;
  Congregation_ID?: number | null;
};

type HouseholdMember = Contact & {
  Image_URL?: string | null;
  Selected?: boolean;
  Household_Position?: string | null;
  Relationship_ID?: number | null;
  Relationship_Name?: string | null;
};

type MembersByType = {
  Relationship_Type_ID: number;
  Relationship_Type_Name: string;
  Sort_Order: number;
  Members: HouseholdMember[];
};

type Relationship = {
  Relationship_ID: number;
  Relationship_Name: string;
  Male_Label?: string | null;
  Female_Label?: string | null;
  Description?: string | null;
};

type RelationshipType = {
  Relationship_Type_ID: number;
  Relationship_Type_Name: string;
  Description?: string | null;
  Sort_Order: number;
};

type GroupedRelationships = {
  type: RelationshipType;
  relationships: Relationship[];
};

type Household = {
  Household_ID: number;
  Household_Name: string;
  Congregation_Name?: string | null;
  Home_Phone: string | null;
  Address?: {
    Address_ID: number;
    Address_Line_1?: string | null;
    Address_Line_2?: string | null;
    City?: string | null;
    State?: string | null;
    Postal_Code?: string | null;
    Country?: string | null;
    Latitude?: number | null;
    Longitude?: number | null;
  } | null;
};

export default function PeopleSearchPage() {
  const { selectedCampus } = useCampus();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [membersByType, setMembersByType] = useState<MembersByType[]>([]);

  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingHousehold, setIsLoadingHousehold] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [simulationModalOpen, setSimulationModalOpen] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editedContact, setEditedContact] = useState<Contact | null>(null);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isEditingRelationships, setIsEditingRelationships] = useState(false);
  const [editedRelationships, setEditedRelationships] = useState<Map<number, number | null>>(new Map());
  const [isSavingRelationships, setIsSavingRelationships] = useState(false);
  const [groupedRelationships, setGroupedRelationships] = useState<GroupedRelationships[]>([]);

  // Check permissions
  const { canEdit } = useAppPermissions(4); // People Search app ID

  // Ref for scrolling to the details panel
  const detailsPanelRef = useRef<HTMLDivElement>(null);

  // Set page title
  useEffect(() => {
    document.title = "People Search - Ministry Apps";
  }, []);

  // Fetch grouped relationships on mount
  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        console.log('Fetching grouped relationships from API...');
        const response = await fetch('/api/people-search/relationships');
        console.log('Relationships API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Relationships API data:', data);
          setGroupedRelationships(data);
        } else {
          console.error('Relationships API error:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error response body:', errorText);
        }
      } catch (error) {
        console.error('Error fetching relationships:', error);
      }
    };
    fetchRelationships();
  }, []);

  // Debounced search function
  const performSearch = useCallback(async (query: string, skip: number = 0) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setHasMore(true);
      return;
    }

    if (skip === 0) {
      setIsSearching(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      let url = `/api/people-search/search?q=${encodeURIComponent(query)}&skip=${skip}`;
      if (selectedCampus?.Congregation_ID) {
        url += `&congregationId=${selectedCampus.Congregation_ID}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to search");
      const data = await response.json();

      // Sort contacts: selected campus first, then other campuses
      const sortedData = selectedCampus?.Congregation_ID
        ? data.sort((a: Contact, b: Contact) => {
            const aIsSelected = a.Congregation_ID === selectedCampus.Congregation_ID;
            const bIsSelected = b.Congregation_ID === selectedCampus.Congregation_ID;

            // Both from selected campus or both from other campuses - maintain original order
            if (aIsSelected === bIsSelected) return 0;
            // Selected campus comes first
            return aIsSelected ? -1 : 1;
          })
        : data;

      if (skip === 0) {
        setSearchResults(sortedData);
      } else {
        setSearchResults(prev => [...prev, ...sortedData]);
      }

      // If we got less than 50 results, there are no more
      setHasMore(data.length === 50);
    } catch (error) {
      console.error("Error searching contacts:", error);
      if (skip === 0) {
        setSearchResults([]);
      }
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  }, [selectedCampus]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery, 0);
    }, 500);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Handle scroll to load more
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;

    if (bottom && hasMore && !isLoadingMore && !isSearching && searchResults.length > 0) {
      performSearch(searchQuery, searchResults.length);
    }
  }, [hasMore, isLoadingMore, isSearching, searchResults.length, searchQuery, performSearch]);

  const handleSelectContact = async (contact: Contact) => {
    setShowDetailsPanel(true);
    setSelectedContact(contact);
    setIsLoadingDetails(true);
    setIsLoadingHousehold(true);
    setHousehold(null);
    setMembersByType([]);

    try {
      // Load contact details
      const contactResponse = await fetch(`/api/people-search/${contact.Contact_ID}`);
      if (!contactResponse.ok) {
        const errorText = await contactResponse.text();
        console.error("Contact API error:", errorText);
        throw new Error("Failed to fetch contact");
      }
      const contactData = await contactResponse.json();
      setSelectedContact(contactData);

      // Load household info if available
      if (contactData.Household_ID) {
        try {
          const householdResponse = await fetch(`/api/people-search/${contact.Contact_ID}/household`);
          if (!householdResponse.ok) {
            const errorText = await householdResponse.text();
            console.error("Household API error:", errorText);
            throw new Error("Failed to fetch household");
          }
          const householdData = await householdResponse.json();
          console.log("Household data:", householdData);
          // API now returns { Household: {...}, MembersByType: [...] }
          setHousehold(householdData.Household);
          setMembersByType(householdData.MembersByType || []);
        } catch (error) {
          console.error("Error loading household:", error);
          setHousehold(null);
          setMembersByType([]);
        } finally {
          setIsLoadingHousehold(false);
        }
      } else {
        setIsLoadingHousehold(false);
      }
    } catch (error) {
      console.error("Error loading contact details:", error);
      setIsLoadingHousehold(false);
    } finally {
      setIsLoadingDetails(false);
    }

    // Scroll to the details panel after a short delay for the animation
    setTimeout(() => {
      detailsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleClearSelection = () => {
    setShowDetailsPanel(false);
    setSelectedContact(null);
    setHousehold(null);
    setMembersByType([]);
    setIsEditingContact(false);
    setEditedContact(null);
    setIsEditingRelationships(false);
    setEditedRelationships(new Map());
  };

  const handleStartEdit = () => {
    setIsEditingContact(true);
    setEditedContact(selectedContact);
  };

  const handleCancelEdit = () => {
    setIsEditingContact(false);
    setEditedContact(null);
  };

  const handleSaveContact = async () => {
    if (!editedContact) return;

    // Store the previous contact state for rollback if needed
    const previousContact = selectedContact;

    // Optimistic UI update - immediately show the changes
    setSelectedContact(editedContact);
    setIsEditingContact(false);
    setEditedContact(null);
    setIsSavingContact(true);

    try {
      const response = await fetch(`/api/people-search/${editedContact.Contact_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          First_Name: editedContact.First_Name,
          Nickname: editedContact.Nickname,
          Last_Name: editedContact.Last_Name,
          Email_Address: editedContact.Email_Address,
          Mobile_Phone: editedContact.Mobile_Phone,
          Company_Phone: editedContact.Company_Phone,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        // Update with server response (in case server modified data)
        setSelectedContact(updated);

        // Show success animation
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
      } else {
        // Rollback on error
        setSelectedContact(previousContact);
        alert('Failed to update contact');
      }
    } catch (error) {
      // Rollback on error
      console.error('Error updating contact:', error);
      setSelectedContact(previousContact);
      alert('Failed to update contact');
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleStartEditRelationships = () => {
    setIsEditingRelationships(true);
    // Initialize edited relationships map with current values
    // Flatten all members from membersByType
    const relationshipsMap = new Map<number, number | null>();
    membersByType.forEach(typeGroup => {
      typeGroup.Members
        .filter(m => m.Contact_ID !== selectedContact?.Contact_ID)
        .forEach(member => {
          console.log('Initializing relationship for member:', {
            name: getDisplayName(member),
            Contact_ID: member.Contact_ID,
            Relationship_ID: member.Relationship_ID,
            Relationship_Name: member.Relationship_Name
          });
          relationshipsMap.set(member.Contact_ID, member.Relationship_ID || null);
        });
    });
    console.log('Edit relationships map:', relationshipsMap);
    console.log('Grouped relationships available:', groupedRelationships);
    setEditedRelationships(relationshipsMap);
  };

  const handleCancelEditRelationships = () => {
    setIsEditingRelationships(false);
    setEditedRelationships(new Map());
  };

  const handleSaveRelationships = async () => {
    if (!selectedContact) return;

    setIsSavingRelationships(true);

    try {
      // Save each relationship that was edited
      const savePromises = Array.from(editedRelationships.entries()).map(
        async ([relatedContactId, relationshipId]) => {
          const response = await fetch(`/api/people-search/${selectedContact.Contact_ID}/relationships`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              relatedContactId,
              relationshipId,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to update relationship for contact ${relatedContactId}`);
          }

          return response.json();
        }
      );

      await Promise.all(savePromises);

      // Reload household data to show updated relationships
      if (selectedContact.Household_ID) {
        const householdResponse = await fetch(`/api/people-search/${selectedContact.Contact_ID}/household`);
        if (householdResponse.ok) {
          const householdData = await householdResponse.json();
          setHousehold(householdData.Household);
          setMembersByType(householdData.MembersByType || []);
        }
      }

      setIsEditingRelationships(false);
      setEditedRelationships(new Map());
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving relationships:', error);
      alert('Failed to save relationships');
    } finally {
      setIsSavingRelationships(false);
    }
  };

  // Handle URL params on page load (from global search)
  useEffect(() => {
    const query = searchParams.get('q');
    const contactId = searchParams.get('contactId');

    if (query) {
      setSearchQuery(query);
    }

    if (contactId) {
      // Show panel immediately for optimistic UI
      setShowDetailsPanel(true);
      setIsLoadingDetails(true);
      setIsLoadingHousehold(true);

      // Fetch and select the contact
      const loadContact = async () => {
        try {
          const response = await fetch(`/api/people-search/${contactId}`);
          if (response.ok) {
            const contact = await response.json();
            await handleSelectContact(contact);
          } else {
            // If loading fails, hide the panel
            setShowDetailsPanel(false);
            setIsLoadingDetails(false);
            setIsLoadingHousehold(false);
          }
        } catch (error) {
          console.error('Error loading contact from URL:', error);
          setShowDetailsPanel(false);
          setIsLoadingDetails(false);
          setIsLoadingHousehold(false);
        }
      };
      loadContact();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getImageUrl = (imageGuidOrUrl: string | null | undefined) => {
    if (!imageGuidOrUrl) return null;
    // If it's already a full URL (from stored procedure), return as-is
    if (imageGuidOrUrl.startsWith('http')) return imageGuidOrUrl;
    // Otherwise, build the URL (for API calls with Image_GUID)
    return `${process.env.NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL}/${imageGuidOrUrl}?$thumbnail=true`;
  };

  const getInitials = (contact: Contact) => {
    // For companies, use first two letters of company name
    if (contact.Company && contact.Company_Name) {
      return contact.Company_Name.substring(0, 2).toUpperCase();
    }
    const firstName = contact.Nickname || contact.First_Name || "";
    const lastName = contact.Last_Name || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getDisplayName = (contact: Contact) => {
    // For companies, use company name
    if (contact.Company && contact.Company_Name) {
      return contact.Company_Name;
    }
    const firstName = contact.Nickname || contact.First_Name || "";
    return `${firstName} ${contact.Last_Name}`.trim();
  };

  const isInactive = (contact: Contact) => {
    // Contact_Status_ID: 1 = Active, 2 = Inactive
    return contact.Contact_Status_ID === 2;
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-4xl font-bold text-primary dark:text-foreground">PEOPLE SEARCH</h1>
            <button
              onClick={() => setSimulationModalOpen(true)}
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="App information and permission testing"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
          <p className="text-muted-foreground">
            Look up contacts and view their information
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Search */}
          <div className="space-y-6">
            {/* Search Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#61bc47]/10 flex items-center justify-center">
                  <Search className="w-5 h-5 text-[#61bc47]" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">SEARCH</h3>
                  <p className="text-sm text-muted-foreground">Find people by name, email, or phone</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter name, email, or phone number..."
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-base focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Search Results */}
            <AnimatePresence>
              {(isSearching || searchResults.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-card border border-border rounded-lg p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#61bc47]/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#61bc47]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">RESULTS</h3>
                      <p className="text-sm text-muted-foreground">
                        {isSearching ? "Searching..." : `${searchResults.length}${hasMore ? "+" : ""} contact${searchResults.length !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>

                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No contacts found
                    </div>
                  ) : (
                    <div
                      className="space-y-2 max-h-[500px] overflow-y-auto overflow-x-hidden scrollbar-hide"
                      onScroll={handleScroll}
                    >
                      {(() => {
                        // Group contacts by campus
                        const selectedCampusContacts = selectedCampus?.Congregation_ID
                          ? searchResults.filter(c => c.Congregation_ID === selectedCampus.Congregation_ID)
                          : [];
                        const otherCampusContacts = selectedCampus?.Congregation_ID
                          ? searchResults.filter(c => c.Congregation_ID !== selectedCampus.Congregation_ID)
                          : searchResults;

                        return (
                          <>
                            {/* From Your Campus Section */}
                            {selectedCampusContacts.length > 0 && (
                              <>
                                <div className="sticky top-0 bg-card/95 backdrop-blur-sm py-2 px-1 -mx-1 z-10">
                                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">
                                    From {selectedCampus?.Congregation_Name} Campus
                                  </h4>
                                </div>
                                {selectedCampusContacts.map((contact) => {
                                  const inactive = isInactive(contact);
                                  return (
                                    <button
                                      key={contact.Contact_ID}
                                      onClick={() => handleSelectContact(contact)}
                                      className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                                        selectedContact?.Contact_ID === contact.Contact_ID
                                          ? "border-primary bg-primary/5 shadow-md hover:shadow-lg hover:bg-primary/10"
                                          : "border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"
                                      } ${inactive ? "opacity-50" : ""}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full overflow-hidden ${inactive ? "bg-muted" : "bg-primary/10"} flex items-center justify-center flex-shrink-0`}>
                                          {getImageUrl(contact.Image_GUID) ? (
                                            <img
                                              src={getImageUrl(contact.Image_GUID)!}
                                              alt={getDisplayName(contact)}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                const parent = (e.target as HTMLImageElement).parentElement;
                                                if (parent) {
                                                  parent.innerHTML = `<span class="text-sm font-medium ${inactive ? "text-muted-foreground" : "text-[#61bc47]"}">${getInitials(contact)}</span>`;
                                                }
                                              }}
                                            />
                                          ) : (
                                            <span className={`text-sm font-medium ${inactive ? "text-muted-foreground" : "text-[#61bc47]"}`}>{getInitials(contact)}</span>
                                          )}
                                        </div>
                                        <div>
                                          <p className={`font-semibold ${inactive ? "text-muted-foreground" : "text-foreground"}`}>
                                            {getDisplayName(contact)}
                                            {inactive && <span className="ml-2 text-xs">(Inactive)</span>}
                                          </p>
                                          {contact.Email_Address && (
                                            <p className="text-xs text-muted-foreground truncate">{contact.Email_Address}</p>
                                          )}
                                        </div>
                                      </div>
                                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                  );
                                })}
                              </>
                            )}

                            {/* From Other Campuses Section */}
                            {otherCampusContacts.length > 0 && (
                              <>
                                {selectedCampusContacts.length > 0 && (
                                  <div className="sticky top-0 bg-card/95 backdrop-blur-sm py-2 px-1 -mx-1 mt-4 z-10">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                      From Other Campuses
                                    </h4>
                                  </div>
                                )}
                                {otherCampusContacts.map((contact) => {
                                  const inactive = isInactive(contact);
                                  return (
                                    <button
                                      key={contact.Contact_ID}
                                      onClick={() => handleSelectContact(contact)}
                                      className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                                        selectedContact?.Contact_ID === contact.Contact_ID
                                          ? "border-primary bg-primary/5 shadow-md hover:shadow-lg hover:bg-primary/10"
                                          : "border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"
                                      } ${inactive ? "opacity-50" : ""}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full overflow-hidden ${inactive ? "bg-muted" : "bg-primary/10"} flex items-center justify-center flex-shrink-0`}>
                                          {getImageUrl(contact.Image_GUID) ? (
                                            <img
                                              src={getImageUrl(contact.Image_GUID)!}
                                              alt={getDisplayName(contact)}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                const parent = (e.target as HTMLImageElement).parentElement;
                                                if (parent) {
                                                  parent.innerHTML = `<span class="text-sm font-medium ${inactive ? "text-muted-foreground" : "text-[#61bc47]"}">${getInitials(contact)}</span>`;
                                                }
                                              }}
                                            />
                                          ) : (
                                            <span className={`text-sm font-medium ${inactive ? "text-muted-foreground" : "text-[#61bc47]"}`}>{getInitials(contact)}</span>
                                          )}
                                        </div>
                                        <div>
                                          <p className={`font-semibold ${inactive ? "text-muted-foreground" : "text-foreground"}`}>
                                            {getDisplayName(contact)}
                                            {inactive && <span className="ml-2 text-xs">(Inactive)</span>}
                                          </p>
                                          {contact.Email_Address && (
                                            <p className="text-xs text-muted-foreground truncate">{contact.Email_Address}</p>
                                          )}
                                        </div>
                                      </div>
                                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                  );
                                })}
                              </>
                            )}
                          </>
                        );
                      })()}
                      {isLoadingMore && (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Contact Details */}
          <AnimatePresence>
            {showDetailsPanel && (
              <motion.div
                ref={detailsPanelRef}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Contact Information */}
                <div className={`bg-card border rounded-lg p-6 shadow-sm transition-all duration-300 ${
                  showSaveSuccess
                    ? 'border-green-500 ring-2 ring-green-500/20'
                    : 'border-border'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#61bc47]/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#61bc47]" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">CONTACT INFO</h3>
                          <p className="text-sm text-muted-foreground">
                            {isSavingContact ? (
                              <span className="flex items-center gap-1.5">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Saving changes...
                              </span>
                            ) : (
                              "Personal details"
                            )}
                          </p>
                        </div>
                        {showSaveSuccess && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {canEdit && !isEditingContact && (
                        <Button
                          onClick={handleStartEdit}
                          size="sm"
                          variant="ghost"
                          className="gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      )}
                      {isEditingContact && (
                        <>
                          <Button
                            onClick={handleSaveContact}
                            size="sm"
                            variant="default"
                            className="gap-2"
                            disabled={isSavingContact}
                          >
                            {isSavingContact ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            size="sm"
                            variant="ghost"
                            className="gap-2"
                            disabled={isSavingContact}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={handleClearSelection}
                        size="sm"
                        variant="ghost"
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Close
                      </Button>
                    </div>
                  </div>

                  {isLoadingDetails ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex-shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-8 bg-muted rounded w-3/4"></div>
                          <div className="h-4 bg-muted rounded w-1/4"></div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-muted rounded mt-0.5"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-muted rounded w-1/4"></div>
                          <div className="h-5 bg-muted rounded w-2/3"></div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-muted rounded mt-0.5"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-muted rounded w-1/4"></div>
                          <div className="h-5 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ) : selectedContact ? (
                    <div className="space-y-4">
                      {/* Profile Picture and Name - Always Visible */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-[#61bc47]/10 flex items-center justify-center flex-shrink-0">
                          {getImageUrl(selectedContact.Image_GUID) ? (
                            <img
                              src={getImageUrl(selectedContact.Image_GUID)!}
                              alt={getDisplayName(selectedContact)}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="text-lg font-semibold text-primary">${getInitials(selectedContact)}</span>`;
                                }
                              }}
                            />
                          ) : (
                            <span className="text-lg font-semibold text-[#61bc47]">{getInitials(selectedContact)}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          {isEditingContact && editedContact ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-xs text-muted-foreground">First Name</label>
                                  <input
                                    type="text"
                                    value={editedContact.First_Name || ''}
                                    onChange={(e) => setEditedContact({ ...editedContact, First_Name: e.target.value })}
                                    className="w-full px-2 py-1 text-sm border border-border rounded bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">Nickname</label>
                                  <input
                                    type="text"
                                    value={editedContact.Nickname || ''}
                                    onChange={(e) => setEditedContact({ ...editedContact, Nickname: e.target.value })}
                                    className="w-full px-2 py-1 text-sm border border-border rounded bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">Last Name</label>
                                <input
                                  type="text"
                                  value={editedContact.Last_Name || ''}
                                  onChange={(e) => setEditedContact({ ...editedContact, Last_Name: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-border rounded bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <h4 className="text-2xl font-bold text-foreground mb-1">
                                {getDisplayName(selectedContact)}
                                {isInactive(selectedContact) && <span className="ml-2 text-sm text-muted-foreground">(Inactive)</span>}
                              </h4>
                              {selectedContact.__Age && (
                                <p className="text-sm text-muted-foreground">Age: {selectedContact.__Age}</p>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Email - Editable or Display */}
                      {(isEditingContact && editedContact) || selectedContact.Email_Address ? (
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-[#61bc47] mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-muted-foreground">Email</p>
                            {isEditingContact && editedContact ? (
                              <input
                                type="email"
                                value={editedContact.Email_Address || ''}
                                onChange={(e) => setEditedContact({ ...editedContact, Email_Address: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-border rounded bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="email@example.com"
                              />
                            ) : (
                              <a
                                href={`mailto:${selectedContact.Email_Address}`}
                                className="text-sm sm:text-base text-foreground hover:text-primary transition-colors break-all"
                              >
                                {selectedContact.Email_Address}
                              </a>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {/* Mobile Phone - Editable or Display */}
                      {(isEditingContact && editedContact) || selectedContact.Mobile_Phone ? (
                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-[#61bc47] mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Mobile</p>
                            {isEditingContact && editedContact ? (
                              <input
                                type="tel"
                                value={editedContact.Mobile_Phone || ''}
                                onChange={(e) => setEditedContact({ ...editedContact, Mobile_Phone: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-border rounded bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="(555) 555-5555"
                              />
                            ) : (
                              <a
                                href={`tel:${selectedContact.Mobile_Phone}`}
                                className="text-sm sm:text-base text-foreground hover:text-primary transition-colors"
                              >
                                {formatPhone(selectedContact.Mobile_Phone)}
                              </a>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {/* Company Phone - Editable or Display */}
                      {(isEditingContact && editedContact) || selectedContact.Company_Phone ? (
                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-[#61bc47] mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Work</p>
                            {isEditingContact && editedContact ? (
                              <input
                                type="tel"
                                value={editedContact.Company_Phone || ''}
                                onChange={(e) => setEditedContact({ ...editedContact, Company_Phone: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-border rounded bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="(555) 555-5555"
                              />
                            ) : (
                              <a
                                href={`tel:${selectedContact.Company_Phone}`}
                                className="text-sm sm:text-base text-foreground hover:text-primary transition-colors"
                              >
                                {formatPhone(selectedContact.Company_Phone)}
                              </a>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {/* Household Information */}
                {(selectedContact?.Household_ID || isLoadingHousehold) && (
                  <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#61bc47]/10 flex items-center justify-center">
                          <Home className="w-5 h-5 text-[#61bc47]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">HOUSEHOLD</h3>
                          <p className="text-sm text-muted-foreground">
                            {isSavingRelationships ? (
                              <span className="flex items-center gap-1.5">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Saving relationships...
                              </span>
                            ) : (
                              "Family members and address"
                            )}
                          </p>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex gap-2">
                          {!isEditingRelationships ? (
                            <Button
                              onClick={handleStartEditRelationships}
                              size="sm"
                              variant="ghost"
                              className="gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </Button>
                          ) : (
                            <>
                              <Button
                                onClick={handleSaveRelationships}
                                size="sm"
                                variant="default"
                                className="gap-2"
                                disabled={isSavingRelationships}
                              >
                                {isSavingRelationships ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                                Save
                              </Button>
                              <Button
                                onClick={handleCancelEditRelationships}
                                size="sm"
                                variant="ghost"
                                className="gap-2"
                                disabled={isSavingRelationships}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {isLoadingHousehold ? (
                      <div className="space-y-4 animate-pulse">
                        <div className="space-y-2">
                          <div className="h-5 bg-muted rounded w-1/2"></div>
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-4 bg-muted rounded w-2/3"></div>
                          <div className="h-4 bg-muted rounded w-1/3"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-1/3"></div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 p-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                                <div className="h-3 bg-muted rounded w-1/2"></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-2/3"></div>
                                <div className="h-3 bg-muted rounded w-1/3"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : household ? (
                      <div className="space-y-4">
                        <div>
                          <p className="font-semibold text-foreground mb-2">{household.Household_Name}</p>
                          {household.Address?.Address_Line_1 && (
                            <div className="text-sm text-muted-foreground whitespace-pre-line">
                              {household.Address.Address_Line_1}
                              {household.Address.Address_Line_2 && `\n${household.Address.Address_Line_2}`}
                              {household.Address.City && `\n${household.Address.City}, ${household.Address.State} ${household.Address.Postal_Code}`}
                            </div>
                          )}
                          {household.Home_Phone && (
                            <a
                              href={`tel:${household.Home_Phone}`}
                              className="text-sm text-primary hover:underline block mt-2"
                            >
                              {formatPhone(household.Home_Phone)}
                            </a>
                          )}
                        </div>

                        {membersByType.length > 0 && (() => {
                          // Calculate total member count across all types (excluding selected contact)
                          const totalMembers = membersByType.reduce((sum, typeGroup) =>
                            sum + typeGroup.Members.filter(m => m.Contact_ID !== selectedContact?.Contact_ID).length, 0
                          );
                          return totalMembers > 0 ? (
                            <div>
                              <p className="text-sm font-semibold text-foreground mb-2">
                                Family Members ({totalMembers})
                              </p>
                              <div className="space-y-2">
                              {isEditingRelationships ? (
                                // EDIT MODE: Flatten all members from all types and show with dropdowns
                                membersByType.flatMap(typeGroup => typeGroup.Members)
                                  .filter(m => m.Contact_ID !== selectedContact?.Contact_ID)
                                  .map((member) => (
                                  <div
                                    key={member.Contact_ID}
                                    className="p-3 rounded-lg border border-border bg-card"
                                  >
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#61bc47]/10 flex items-center justify-center flex-shrink-0">
                                        {member.Image_URL ? (
                                          <img
                                            src={member.Image_URL}
                                            alt={getDisplayName(member)}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                              const parent = (e.target as HTMLImageElement).parentElement;
                                              if (parent) {
                                                parent.innerHTML = `<span class="text-sm font-medium text-[#61bc47]">${getInitials(member)}</span>`;
                                              }
                                            }}
                                          />
                                        ) : (
                                          <span className="text-sm font-medium text-[#61bc47]">{getInitials(member)}</span>
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium text-foreground">
                                          {getDisplayName(member)}
                                        </p>
                                        {member.__Age && (
                                          <p className="text-xs text-muted-foreground">Age: {member.__Age}</p>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground block mb-1">
                                        Relationship to {getDisplayName(selectedContact)}
                                      </label>
                                      <select
                                        value={editedRelationships.get(member.Contact_ID) ?? ''}
                                        onChange={(e) => {
                                          const newMap = new Map(editedRelationships);
                                          const value = e.target.value;
                                          newMap.set(member.Contact_ID, value === '' ? null : parseInt(value));
                                          setEditedRelationships(newMap);
                                        }}
                                        className="w-full px-2 py-1.5 text-sm border border-border rounded bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                      >
                                        <option value="">No relationship</option>
                                        {groupedRelationships.map((group) => (
                                          <optgroup key={group.type.Relationship_Type_ID} label={group.type.Relationship_Type_Name}>
                                            {group.relationships.map((rel) => (
                                              <option key={rel.Relationship_ID} value={rel.Relationship_ID}>
                                                {member.Gender_ID === 1 && rel.Male_Label ? rel.Male_Label :
                                                 member.Gender_ID === 2 && rel.Female_Label ? rel.Female_Label :
                                                 rel.Relationship_Name}
                                              </option>
                                            ))}
                                          </optgroup>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                // VIEW MODE: Display pre-grouped members from API
                                <>
                                  {membersByType.map((typeGroup) => {
                                    const membersToShow = typeGroup.Members.filter(m => m.Contact_ID !== selectedContact?.Contact_ID);
                                    if (membersToShow.length === 0) return null;

                                    return (
                                      <div key={typeGroup.Relationship_Type_ID}>
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 mt-3 first:mt-0">
                                          {typeGroup.Relationship_Type_Name}
                                        </h4>
                                        <div className="space-y-2">
                                          {membersToShow.map((member) => (
                                            <button
                                              key={member.Contact_ID}
                                              onClick={() => handleSelectContact(member)}
                                              className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-all text-left ${
                                                member.Contact_ID === selectedContact?.Contact_ID || member.Selected
                                                  ? "border-primary bg-primary/5"
                                                  : "border-border hover:border-primary/50 hover:bg-primary/5"
                                              }`}
                                            >
                                              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#61bc47]/10 flex items-center justify-center flex-shrink-0">
                                                {member.Image_URL ? (
                                                  <img
                                                    src={member.Image_URL}
                                                    alt={getDisplayName(member)}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                      (e.target as HTMLImageElement).style.display = 'none';
                                                      const parent = (e.target as HTMLImageElement).parentElement;
                                                      if (parent) {
                                                        parent.innerHTML = `<span class="text-sm font-medium text-[#61bc47]">${getInitials(member)}</span>`;
                                                      }
                                                    }}
                                                  />
                                                ) : (
                                                  <span className="text-sm font-medium text-[#61bc47]">{getInitials(member)}</span>
                                                )}
                                              </div>
                                              <div>
                                                <p className="font-medium text-foreground">
                                                  {getDisplayName(member)}
                                                </p>
                                                {(member.__Age || member.Relationship_Name) && (
                                                  <p className="text-xs text-muted-foreground">
                                                    {member.__Age && `Age: ${member.__Age}`}
                                                    {member.__Age && member.Relationship_Name && " • "}
                                                    {member.Relationship_Name}
                                                  </p>
                                                )}
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </>
                              )}
                            </div>
                          </div>
                          ) : null;
                        })()}
                      </div>
                    ) : null}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Permission Testing Modal */}
      <AppSimulationModal
        open={simulationModalOpen}
        onOpenChange={setSimulationModalOpen}
        applicationId={4}
        applicationName="People Search"
      />
    </div>
  );
}
