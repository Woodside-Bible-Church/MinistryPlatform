"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Mail,
  Phone,
  Users,
  Loader2,
} from "lucide-react";
import {
  RSVPFormSchema,
  RSVPFormInput,
  ServiceTimeResponse,
} from "@/types/rsvp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const handleStep1Continue = () => {
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
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="John"
                />
              </div>
              {errors.firstName && (
                <p className="text-sm text-destructive bg-white/90 px-2 py-1">
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
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Doe"
                />
              </div>
              {errors.lastName && (
                <p className="text-sm text-destructive bg-white/90 px-2 py-1">
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
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="john.doe@example.com"
              />
            </div>
            {errors.emailAddress && (
              <p className="text-sm text-destructive bg-white/90 px-2 py-1">
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
                {...register("phoneNumber")}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="(810) 555-1234"
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-sm text-destructive bg-white/90 px-2 py-1">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          {/* Back and Continue Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="flex-1 h-12 text-base border-2 border-secondary text-secondary hover:bg-secondary hover:text-primary bg-transparent font-bold uppercase tracking-wide"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleStep1Continue}
              variant="secondary"
              className="flex-1 h-12 text-base font-bold uppercase tracking-wide"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Complete Your RSVP */}
      {formStep === 2 && (
        <form onSubmit={handleSubmit(handleStep2Submit)}>
          <div className="bg-primary p-6 space-y-6">
            {/* Party Size */}
            <div className="space-y-2">
              <Label htmlFor="partySize" className="text-white">
                How many people? <span className="text-destructive">*</span>
              </Label>
              <Select
                value={partySize?.toString()}
                onValueChange={(value) => setValue("partySize", parseInt(value))}
              >
                <SelectTrigger id="partySize" className="bg-white/10 border-white/20 text-white">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-white/60" />
                    <SelectValue placeholder="Select party size" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? "person" : "people"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.partySize && (
                <p className="text-sm text-destructive bg-white/90 px-2 py-1">
                  {errors.partySize.message}
                </p>
              )}
            </div>

            {/* New Visitor Checkbox */}
            <div className="flex items-start space-x-3 p-4 border border-white/20 bg-white/10">
              <Checkbox
                id="isNewVisitor"
                checked={isNewVisitor}
                onCheckedChange={(checked) =>
                  setValue("isNewVisitor", checked as boolean)
                }
              />
              <div className="space-y-1">
                <Label
                  htmlFor="isNewVisitor"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-white"
                >
                  This is my first visit to Woodside
                </Label>
                <p className="text-sm text-white/70">
                  We&apos;d love to help you find your way and make you feel welcome!
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-4 bg-white/10 border border-white/20">
              <p className="text-sm text-white/70">
                <strong className="text-white">Please note:</strong> This RSVP
                doesn&apos;t guarantee a spot, but will let everyone know how full each
                service is so we can plan accordingly.
              </p>
            </div>

            {/* Back and Submit Buttons */}
            <div className="flex gap-4">
              <Button
                type="button"
                onClick={() => onStepChange(1)}
                variant="outline"
                className="flex-1 h-12 text-base border-2 border-secondary text-secondary hover:bg-secondary hover:text-primary bg-transparent font-bold uppercase tracking-wide"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="secondary"
                className="flex-1 h-12 text-base font-bold uppercase tracking-wide"
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
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
