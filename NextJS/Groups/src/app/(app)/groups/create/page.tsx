"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Heart, Star, Clock, Calendar, MapPin, Save, Eye, Info } from "lucide-react";

const categories = [
  { id: "bible-study", name: "Bible Study", icon: Users, description: "Deep scripture study and discussion" },
  { id: "life-groups", name: "Life Groups", icon: Heart, description: "Support and fellowship community" },
  { id: "ministry", name: "Ministry", icon: Star, description: "Service and outreach opportunities" },
  { id: "special-interest", name: "Special Interest", icon: Clock, description: "Shared hobbies and interests" }
];

const meetingTimes = [
  "Sunday Morning", "Sunday Evening", "Monday Morning", "Monday Evening",
  "Tuesday Morning", "Tuesday Evening", "Wednesday Morning", "Wednesday Evening",
  "Thursday Morning", "Thursday Evening", "Friday Morning", "Friday Evening",
  "Saturday Morning", "Saturday Evening"
];

const locations = [
  "Main Sanctuary", "Fellowship Hall", "Room 101", "Room 102", "Room 103",
  "Room 201", "Room 202", "Room 203", "Youth Center", "Children's Wing",
  "Community Room", "Prayer Chapel", "Off-site", "Online"
];

export default function CreateGroupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    schedule: "",
    customSchedule: "",
    location: "",
    customLocation: "",
    maxMembers: "",
    contactEmail: "",
    contactPhone: "",
    requirements: "",
    highlights: "",
    isPublic: true,
    acceptingMembers: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Group name is required";
      if (!formData.description.trim()) newErrors.description = "Description is required";
      if (!formData.category) newErrors.category = "Please select a category";
    }

    if (step === 2) {
      if (!formData.schedule && !formData.customSchedule.trim()) {
        newErrors.schedule = "Please select a meeting time or enter a custom schedule";
      }
      if (!formData.location && !formData.customLocation.trim()) {
        newErrors.location = "Please select a location or enter a custom location";
      }
      if (!formData.maxMembers || parseInt(formData.maxMembers) < 1) {
        newErrors.maxMembers = "Please enter a valid maximum number of members";
      }
    }

    if (step === 3) {
      if (!formData.contactEmail.trim()) newErrors.contactEmail = "Contact email is required";
      if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
        newErrors.contactEmail = "Please enter a valid email address";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (validateStep(3)) {
      setCurrentStep(4);
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.icon : Users;
  };

  const getCategoryColor = (categoryId: string) => {
    switch (categoryId) {
      case "bible-study": return "bg-primary text-primary-foreground border-primary";
      case "life-groups": return "bg-church-secondary text-secondary-foreground border-church-secondary";
      case "ministry": return "bg-church-accent text-accent-foreground border-church-accent";
      case "special-interest": return "bg-church-warm text-secondary-foreground border-church-warm";
      default: return "bg-muted text-foreground border-border";
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Basic Information</h2>
              <p className="text-muted-foreground">Tell us about your group and what makes it special.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Young Adults Bible Study"
                  className={`w-full px-4 py-3 bg-input border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.name ? 'border-destructive' : 'border-border'
                  }`}
                />
                {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your group's purpose, activities, and what members can expect..."
                  rows={4}
                  className={`w-full px-4 py-3 bg-input border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                    errors.description ? 'border-destructive' : 'border-border'
                  }`}
                />
                {errors.description && <p className="text-destructive text-sm mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                        className={`p-4 border-2 rounded-xl text-left transition-all ${
                          formData.category === category.id
                            ? getCategoryColor(category.id)
                            : 'border-border bg-card hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <Icon className="w-6 h-6" />
                          <span className="font-semibold">{category.name}</span>
                        </div>
                        <p className={`text-sm ${
                          formData.category === category.id ? '' : 'text-muted-foreground'
                        }`}>
                          {category.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
                {errors.category && <p className="text-destructive text-sm mt-1">{errors.category}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Meeting Details</h2>
              <p className="text-muted-foreground">When and where will your group meet?</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Meeting Schedule *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                  {meetingTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, schedule: time, customSchedule: '' }))}
                      className={`p-3 border rounded-xl text-sm transition-all ${
                        formData.schedule === time
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border bg-card hover:bg-muted'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.customSchedule}
                  onChange={(e) => setFormData(prev => ({ ...prev, customSchedule: e.target.value, schedule: '' }))}
                  placeholder="Or enter custom schedule (e.g., Every other Tuesday, 7:00 PM)"
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errors.schedule && <p className="text-destructive text-sm mt-1">{errors.schedule}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Location *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                  {locations.map((location) => (
                    <button
                      key={location}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, location, customLocation: '' }))}
                      className={`p-3 border rounded-xl text-sm transition-all ${
                        formData.location === location
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border bg-card hover:bg-muted'
                      }`}
                    >
                      {location}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.customLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, customLocation: e.target.value, location: '' }))}
                  placeholder="Or enter custom location"
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errors.location && <p className="text-destructive text-sm mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Maximum Members *
                </label>
                <input
                  type="number"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxMembers: e.target.value }))}
                  placeholder="e.g., 15"
                  min="1"
                  max="100"
                  className={`w-full px-4 py-3 bg-input border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.maxMembers ? 'border-destructive' : 'border-border'
                  }`}
                />
                {errors.maxMembers && <p className="text-destructive text-sm mt-1">{errors.maxMembers}</p>}
                <p className="text-sm text-muted-foreground mt-1">
                  This helps people know if your group has space available.
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Additional Details</h2>
              <p className="text-muted-foreground">Help members know what to expect and how to reach you.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="your.email@example.com"
                  className={`w-full px-4 py-3 bg-input border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.contactEmail ? 'border-destructive' : 'border-border'
                  }`}
                />
                {errors.contactEmail && <p className="text-destructive text-sm mt-1">{errors.contactEmail}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  What We Offer
                </label>
                <textarea
                  value={formData.highlights}
                  onChange={(e) => setFormData(prev => ({ ...prev, highlights: e.target.value }))}
                  placeholder="List key benefits or activities (one per line)&#10;• Interactive Bible study sessions&#10;• Prayer and fellowship time&#10;• Monthly social activities"
                  rows={4}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Requirements or Expectations
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="List any requirements or expectations (one per line)&#10;• Ages 18-30&#10;• Commitment to weekly attendance&#10;• Open heart to learn and grow"
                  rows={4}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="w-5 h-5 text-primary border-border rounded focus:ring-2 focus:ring-primary"
                  />
                  <label htmlFor="isPublic" className="text-foreground">
                    Make this group publicly visible
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="acceptingMembers"
                    checked={formData.acceptingMembers}
                    onChange={(e) => setFormData(prev => ({ ...prev, acceptingMembers: e.target.checked }))}
                    className="w-5 h-5 text-primary border-border rounded focus:ring-2 focus:ring-primary"
                  />
                  <label htmlFor="acceptingMembers" className="text-foreground">
                    Currently accepting new members
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-group-status-active text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Group Created Successfully!</h2>
              <p className="text-muted-foreground">
                Your group has been created and will be reviewed by our team before being published.
              </p>
            </div>

            <div className="bg-muted rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4">What happens next?</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                  <div>
                    <div className="font-medium text-foreground">Review Process</div>
                    <div className="text-sm text-muted-foreground">Our team will review your group details within 24-48 hours.</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                  <div>
                    <div className="font-medium text-foreground">Approval & Publishing</div>
                    <div className="text-sm text-muted-foreground">Once approved, your group will be visible to all members.</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                  <div>
                    <div className="font-medium text-foreground">Start Welcoming Members</div>
                    <div className="text-sm text-muted-foreground">You'll receive notifications when people want to join your group.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <Link
                href="/groups"
                className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-hover transition-colors"
              >
                Browse Other Groups
              </Link>
              <div>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary-hover to-accent text-primary-foreground py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/groups"
            className="inline-flex items-center text-primary-foreground/80 hover:text-primary-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Groups
          </Link>

          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Start a New Group</h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Create a space for people to connect, grow, and build meaningful relationships.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        {currentStep < 4 && (
          <div className="mb-12">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      currentStep >= step
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-16 h-1 mx-2 transition-colors ${
                        currentStep > step ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between max-w-md mx-auto mt-4 text-sm">
              <span className={currentStep >= 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                Basic Info
              </span>
              <span className={currentStep >= 2 ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                Meeting Details
              </span>
              <span className={currentStep >= 3 ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                Additional Details
              </span>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-card border border-border rounded-2xl p-8">
          {renderStepContent()}

          {/* Navigation Buttons */}
          {currentStep < 4 && (
            <div className="flex justify-between mt-12 pt-8 border-t border-border">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-3 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-4">
                {currentStep < 3 && (
                  <button
                    onClick={nextStep}
                    className="flex items-center px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-colors font-medium"
                  >
                    Next
                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                  </button>
                )}

                {currentStep === 3 && (
                  <button
                    onClick={handleSubmit}
                    className="flex items-center px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-colors font-medium"
                  >
                    Create Group
                    <Save className="w-4 h-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        {currentStep < 4 && (
          <div className="mt-8 bg-muted/50 border border-border rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Need Help?</h3>
                <p className="text-muted-foreground text-sm">
                  If you need assistance creating your group or have questions about group leadership,
                  contact our ministry team at groups@church.com or call (555) 123-4567.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}