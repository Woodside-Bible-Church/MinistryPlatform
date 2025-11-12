"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import {
  User,
  Mail,
  Phone,
  Loader2,
  UserPlus,
  UserCircle,
} from "lucide-react";
import {
  RSVPFormSchema,
  RSVPFormInput,
  ServiceTimeResponse,
  RSVPQuestion,
  parseQuestionOptions,
  RSVPAnswerValue,
} from "@/types/rsvp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DynamicQuestion } from "@/components/rsvp/questions/DynamicQuestion";

interface HouseholdMember {
  Contact_ID: number;
  Display_Name: string;
  Nickname: string | null;
  First_Name: string;
  Last_Name: string;
  Email_Address: string | null;
  Mobile_Phone: string | null;
  Image_GUID: string | null;
}

interface RSVPFormProps {
  selectedServiceTime: ServiceTimeResponse;
  onSubmit: (data: RSVPFormInput, answers: Record<number, RSVPAnswerValue>) => Promise<void>;
  onBack: () => void;
  formStep: 1 | 2;
  onStepChange: (step: 1 | 2) => void;
  initialData: Partial<RSVPFormInput>;
  onDataChange: (data: Partial<RSVPFormInput>) => void;
  questions: RSVPQuestion[];
}

export default function RSVPForm({
  selectedServiceTime,
  onSubmit,
  onBack,
  formStep,
  onStepChange,
  initialData,
  onDataChange,
  questions,
}: RSVPFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication and household members
  const { data: session } = useSession();
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [currentUser, setCurrentUser] = useState<HouseholdMember | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<string>("new"); // "new" or Contact_ID
  const [isLoadingHousehold, setIsLoadingHousehold] = useState(false);

  // Parse questions with options
  const parsedQuestions = questions
    .map(q => ({
      ...q,
      Options: parseQuestionOptions(q.Options),
    }))
    .sort((a, b) => a.Field_Order - b.Field_Order);

  // Initialize dynamic answers with default values from questions
  const getInitialAnswers = (): Record<number, RSVPAnswerValue> => {
    const answers: Record<number, RSVPAnswerValue> = {};
    parsedQuestions.forEach((q) => {
      if (q.Question_Type === 'Counter') {
        answers[q.Question_ID] = q.Default_Value ? parseInt(q.Default_Value) : (q.Min_Value || 1);
      } else if (q.Question_Type === 'Checkbox') {
        answers[q.Question_ID] = q.Default_Value === 'true' || q.Default_Value === '1';
      }
      // Add more question types as needed
    });
    return answers;
  };

  // Dynamic answers state (maps question ID to answer value)
  const [answers, setAnswers] = useState<Record<number, RSVPAnswerValue>>(getInitialAnswers);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
    setFocus,
  } = useForm({
    resolver: zodResolver(RSVPFormSchema),
    defaultValues: {
      eventId: selectedServiceTime.Event_ID,
      firstName: initialData.firstName || "",
      lastName: initialData.lastName || "",
      emailAddress: initialData.emailAddress || "",
      phoneNumber: initialData.phoneNumber || "",
      partySize: initialData.partySize || 1,
      isNewVisitor: initialData.isNewVisitor ?? false,
    },
  });

  // Helper function to format name as "(Nickname || First_Name) Last_Name"
  const formatPersonName = (person: HouseholdMember, isCurrentUser: boolean = false) => {
    const firstName = person.Nickname || person.First_Name;
    const name = `${firstName} ${person.Last_Name}`;
    return isCurrentUser ? `${name} (Me)` : name;
  };

  // Fetch household members when user is authenticated
  useEffect(() => {
    console.log('[RSVPForm v2] useEffect triggered, session:', !!session);
    if (session) {
      console.log('[RSVPForm v2] Fetching household data...');
      setIsLoadingHousehold(true);
      fetch('/api/household')
        .then(res => {
          console.log('[RSVPForm] Household API response status:', res.status);
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('[RSVPForm] Household API data:', data);
          if (data.error) {
            console.error('[RSVPForm] Household API error:', data.error);
            return;
          }
          if (!data.user) {
            console.error('[RSVPForm] Household API returned no user data');
            return;
          }
          console.log('[RSVPForm] Setting household data - user:', data.user.Display_Name, 'members:', data.householdMembers?.length);
          setCurrentUser(data.user);
          setHouseholdMembers(data.householdMembers || []);
          // Default to current user
          setSelectedPerson(data.user.Contact_ID.toString());
          // Pre-fill form with user data
          setValue("firstName", data.user.First_Name);
          setValue("lastName", data.user.Last_Name);
          setValue("emailAddress", data.user.Email_Address || "");
          setValue("phoneNumber", data.user.Mobile_Phone || "");
        })
        .catch(err => {
          console.error('[RSVPForm] Error fetching household:', err);
        })
        .finally(() => {
          console.log('[RSVPForm] Household fetch complete');
          setIsLoadingHousehold(false);
        });
    }
  }, [session, setValue]);

  // Handle person selection change
  const handlePersonChange = (value: string) => {
    setSelectedPerson(value);

    if (value === "new") {
      // Clear form for new person
      setValue("firstName", "");
      setValue("lastName", "");
      setValue("emailAddress", "");
      setValue("phoneNumber", "");
    } else {
      // Find the selected person and fill the form
      const contactId = parseInt(value);
      let person: HouseholdMember | undefined;

      if (currentUser && currentUser.Contact_ID === contactId) {
        person = currentUser;
      } else {
        person = householdMembers.find(m => m.Contact_ID === contactId);
      }

      if (person) {
        setValue("firstName", person.First_Name);
        setValue("lastName", person.Last_Name);
        setValue("emailAddress", person.Email_Address || "");
        setValue("phoneNumber", person.Mobile_Phone || "");
      }
    }
  };

  // Watch form values to detect autocomplete changes
  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const emailAddress = watch("emailAddress");

  // Track previous values to detect autocomplete
  const prevFirstName = useRef("");
  const prevLastName = useRef("");
  const prevEmailAddress = useRef("");

  // Auto-advance when autocomplete fills a field
  // Autocomplete typically fills the entire field at once (length > 2)
  // Manual typing happens one character at a time
  useEffect(() => {
    const prevLength = prevFirstName.current.length;
    const currentLength = firstName.length;

    // If field went from empty/small to large (3+ chars), likely autocomplete
    if (prevLength <= 1 && currentLength >= 3) {
      setTimeout(() => setFocus("lastName"), 100);
    }
    prevFirstName.current = firstName;
  }, [firstName, setFocus]);

  useEffect(() => {
    const prevLength = prevLastName.current.length;
    const currentLength = lastName.length;

    if (prevLength <= 1 && currentLength >= 3) {
      setTimeout(() => setFocus("emailAddress"), 100);
    }
    prevLastName.current = lastName;
  }, [lastName, setFocus]);

  useEffect(() => {
    const prevLength = prevEmailAddress.current.length;
    const currentLength = emailAddress.length;

    if (prevLength <= 1 && currentLength >= 5) {
      setTimeout(() => setFocus("phoneNumber"), 100);
    }
    prevEmailAddress.current = emailAddress;
  }, [emailAddress, setFocus]);

  // Phone number formatting function
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, "");

    // Handle 11-digit numbers (with country code)
    if (phoneNumber.length === 11 && phoneNumber.startsWith("1")) {
      const areaCode = phoneNumber.slice(1, 4);
      const firstPart = phoneNumber.slice(4, 7);
      const secondPart = phoneNumber.slice(7, 11);
      return `1 (${areaCode}) ${firstPart}-${secondPart}`;
    }

    // Handle 10-digit numbers (standard format)
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else if (phoneNumber.length <= 10) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    } else {
      // For numbers longer than 11, just format as 10-digit
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue("phoneNumber", formatted);
  };

  const handleStep1Continue = async () => {
    // Validate step 1 fields before continuing
    const isValid = await trigger(["firstName", "lastName", "emailAddress", "phoneNumber"]);

    if (!isValid) {
      return; // Don't proceed if validation fails
    }

    // Save step 1 data
    const step1Data = {
      firstName: watch("firstName"),
      lastName: watch("lastName"),
      emailAddress: watch("emailAddress"),
      phoneNumber: watch("phoneNumber"),
    };
    onDataChange({ ...initialData, ...step1Data });
    onStepChange(2);
  };

  const handleStep2Submit = async (data: RSVPFormInput) => {
    setIsSubmitting(true);
    try {
      // Pass both the validated form data and the dynamic answers
      await onSubmit(data, answers);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Tell Us About Yourself */}
      {formStep === 1 && (
        <div className="bg-primary p-6 space-y-6">
          {/* Fill Out As Dropdown - Only show for authenticated users */}
          {session && currentUser && (
            <div className="space-y-2">
              <Label htmlFor="fillOutAs" className="text-white">
                Fill Out As
              </Label>
              <Select
                value={selectedPerson}
                onValueChange={handlePersonChange}
                disabled={isLoadingHousehold}
              >
                <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {/* Current User */}
                  <SelectItem value={currentUser.Contact_ID.toString()}>
                    <div className="flex items-center gap-3">
                      {currentUser.Image_GUID ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL}/${currentUser.Image_GUID}?$thumbnail=true`}
                          alt={formatPersonName(currentUser, true)}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle className="size-8 text-muted-foreground" />
                      )}
                      <span>{formatPersonName(currentUser, true)}</span>
                    </div>
                  </SelectItem>

                  {/* Household Members */}
                  {householdMembers.map((member) => (
                    <SelectItem key={member.Contact_ID} value={member.Contact_ID.toString()}>
                      <div className="flex items-center gap-3">
                        {member.Image_GUID ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL}/${member.Image_GUID}?$thumbnail=true`}
                            alt={formatPersonName(member)}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <UserCircle className="size-8 text-muted-foreground" />
                        )}
                        <span>{formatPersonName(member)}</span>
                      </div>
                    </SelectItem>
                  ))}

                  {/* Add New Person - Make it stand out */}
                  <SelectItem value="new" className="bg-primary/10 border-t-2 border-primary/20 mt-2 focus:!bg-primary focus:!text-white group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center transition-colors">
                        <UserPlus className="size-5 text-primary group-focus:!text-white transition-colors" />
                      </div>
                      <span className="font-semibold text-primary group-focus:!text-white transition-colors">Add New Person</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Only show form fields when "Add New Person" is selected */}
          {(!session || selectedPerson === "new") && (
          <>
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-white">
                First Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <Input
                  id="firstName"
                  {...register("firstName")}
                  name="firstName"
                  autoComplete="given-name"
                  disabled={!!(session && selectedPerson !== "new")}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="First Name"
                />
              </div>
              {errors.firstName && (
                <p className="text-sm text-red-200 italic">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-white">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <Input
                  id="lastName"
                  {...register("lastName")}
                  name="lastName"
                  autoComplete="family-name"
                  disabled={!!(session && selectedPerson !== "new")}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Last Name"
                />
              </div>
              {errors.lastName && (
                <p className="text-sm text-red-200 italic">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="emailAddress" className="text-white">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <Input
                id="emailAddress"
                type="email"
                {...register("emailAddress")}
                name="emailAddress"
                autoComplete="email"
                disabled={!!(session && selectedPerson !== "new")}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="email@example.com"
              />
            </div>
            {errors.emailAddress && (
              <p className="text-sm text-red-200 italic">
                {errors.emailAddress.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-white">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <Input
                id="phoneNumber"
                type="tel"
                inputMode="numeric"
                {...register("phoneNumber")}
                name="phoneNumber"
                autoComplete="tel"
                onChange={handlePhoneChange}
                maxLength={17}
                disabled={!!(session && selectedPerson !== "new")}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="(123) 456-7890"
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-sm text-red-200 italic">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>
          </>
          )}

          {/* Back and Continue Buttons */}
          <div className="flex flex-col sm:flex-row-reverse gap-4">
            <Button
              type="button"
              onClick={handleStep1Continue}
              variant="secondary"
              className="btn-primary flex-1 h-12 text-base"
            >
              Continue
            </Button>
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="btn-secondary flex-1 h-12 text-base"
            >
              Back
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Complete Your RSVP */}
      {formStep === 2 && (
        <form onSubmit={handleSubmit(handleStep2Submit)}>
          <div className="bg-primary p-6 space-y-10">
            {/* Dynamic Questions */}
            {parsedQuestions.map((question) => (
              <DynamicQuestion
                key={question.Question_ID}
                question={question}
                value={answers[question.Question_ID]}
                onChange={(value) => {
                  setAnswers(prev => ({ ...prev, [question.Question_ID]: value }));
                  // Backward compatibility: sync with old form fields
                  if (question.Question_Type === 'Counter') {
                    setValue("partySize", value as number);
                  } else if (question.Question_Type === 'Checkbox') {
                    setValue("isNewVisitor", value as boolean);
                  }
                }}
                error={undefined} // Can add error handling later if needed
              />
            ))}

            {/* Back and Submit Buttons */}
            <div className="flex flex-col sm:flex-row-reverse gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="secondary"
                className="btn-primary flex-1 h-12 text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Complete RSVP"
                )}
              </Button>
              <Button
                type="button"
                onClick={() => onStepChange(1)}
                variant="outline"
                className="btn-secondary flex-1 h-12 text-base"
              >
                Back
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
