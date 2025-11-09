"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Mail,
  Phone,
  Loader2,
  Minus,
  Plus,
  Sparkles,
  Check,
} from "lucide-react";
import {
  RSVPFormSchema,
  RSVPFormInput,
  ServiceTimeResponse,
} from "@/types/rsvp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RSVPFormProps {
  selectedServiceTime: ServiceTimeResponse;
  onSubmit: (data: RSVPFormInput) => Promise<void>;
  onBack: () => void;
  formStep: 1 | 2;
  onStepChange: (step: 1 | 2) => void;
  initialData: Partial<RSVPFormInput>;
  onDataChange: (data: Partial<RSVPFormInput>) => void;
}

export default function RSVPForm({
  selectedServiceTime,
  onSubmit,
  onBack,
  formStep,
  onStepChange,
  initialData,
  onDataChange,
}: RSVPFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const partySize = watch("partySize");
  const isNewVisitor = watch("isNewVisitor");

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
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Tell Us About Yourself */}
      {formStep === 1 && (
        <div className="bg-primary p-6 space-y-6">
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
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
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
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
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
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="email@example.com"
              />
            </div>
            {errors.emailAddress && (
              <p className="text-sm text-red-200 italic">
                {errors.emailAddress.message}
              </p>
            )}
          </div>

          {/* Phone (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-white">Phone Number (Optional)</Label>
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
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="(123) 456-7890"
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-sm text-red-200 italic">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

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
          <div className="bg-primary p-6 space-y-6">
            {/* Party Size Counter */}
            <div className="space-y-2">
              <Label htmlFor="partySize" className="text-white">
                How many people? <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-4">
                {/* Minus Button */}
                <button
                  type="button"
                  onClick={() => setValue("partySize", Math.max(1, (partySize || 1) - 1))}
                  disabled={(partySize || 1) <= 1}
                  className="h-14 w-14 flex items-center justify-center bg-white/10 border-2 border-white/20 text-white rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Minus className="w-6 h-6" />
                </button>

                {/* Counter Input */}
                <div className="flex-1">
                  <Input
                    id="partySize"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="99"
                    value={partySize || 1}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setValue("partySize", Math.max(1, Math.min(99, val)));
                    }}
                    className="h-14 px-4 text-center text-2xl font-bold bg-white/10 border-2 border-white/20 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                {/* Plus Button */}
                <button
                  type="button"
                  onClick={() => setValue("partySize", Math.min(99, (partySize || 1) + 1))}
                  disabled={(partySize || 1) >= 99}
                  className="h-14 w-14 flex items-center justify-center bg-white/10 border-2 border-white/20 text-white rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
              {errors.partySize && (
                <p className="text-sm text-red-200 italic">
                  {errors.partySize.message}
                </p>
              )}
            </div>

            {/* New Visitor Checkbox */}
            <div
              onClick={() => setValue("isNewVisitor", !isNewVisitor)}
              className="flex items-start gap-3 p-4 border-2 border-white/20 bg-white/5 cursor-pointer hover:bg-white/10 hover:border-white/30 transition-all select-none"
            >
              <div className="flex items-center gap-3">
                {/* Custom Checkbox Visual */}
                <div className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${
                  isNewVisitor
                    ? 'bg-white border-white'
                    : 'bg-transparent border-white/50'
                }`}>
                  {isNewVisitor && <Check className="w-4 h-4 text-primary" strokeWidth={3} />}
                </div>
                <Sparkles className="w-5 h-5 text-white/70" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="text-sm font-medium leading-none text-white">
                  This is my first visit to Woodside
                </div>
                <p className="text-sm text-white/70">
                  We&apos;d love to help you find your way and make you feel welcome.
                </p>
              </div>
            </div>

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
