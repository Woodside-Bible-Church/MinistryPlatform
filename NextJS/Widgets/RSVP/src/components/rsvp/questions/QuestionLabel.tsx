// ===================================================================
// Question Label Component
// ===================================================================
// Shared component for displaying question labels with icons
// Ensures consistent styling across all question types
// ===================================================================

'use client';

import { Label } from '@/components/ui/label';
import { HelpCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { ParsedRSVPQuestion, RSVPQuestion } from '@/types/rsvp';

interface QuestionLabelProps {
  question: ParsedRSVPQuestion | RSVPQuestion;
  htmlFor?: string;
}

export function QuestionLabel({ question, htmlFor }: QuestionLabelProps) {
  // Get the icon component dynamically
  const IconComponent = question.Icon_Name
    ? (LucideIcons[question.Icon_Name as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>) || HelpCircle
    : HelpCircle;

  return (
    <div className="flex min-[480px]:grid min-[480px]:grid-cols-[auto_1fr_auto] items-center justify-between min-[480px]:justify-start gap-3 mb-6">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <IconComponent className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
      </div>
      <div className="space-y-1 flex-1">
        <Label
          htmlFor={htmlFor}
          className="text-lg font-semibold leading-tight text-right min-[480px]:text-center block"
          style={{ color: 'var(--theme-secondary)' }}
        >
          {question.Question_Text}
          {question.Is_Required && <span className="ml-1 text-red-200">*</span>}
        </Label>
        {question.Helper_Text && (
          <p
            className="text-sm text-right min-[480px]:text-center"
            style={{ color: 'var(--theme-primary)', opacity: 0.8 }}
          >
            {question.Helper_Text}
          </p>
        )}
      </div>
      <div className="w-10 hidden min-[480px]:block"></div>
    </div>
  );
}
