// ===================================================================
// Multi-Checkbox Question Component
// ===================================================================
// Multiple checkboxes for selecting multiple options
// Uses Question_Options - value stored as string array
// ===================================================================

'use client';

import { QuestionComponentProps } from '@/types/rsvp';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function MultiCheckboxQuestion({
  question,
  value,
  onChange,
  error,
}: QuestionComponentProps) {
  // Parse value as array of strings
  const selectedValues = Array.isArray(value)
    ? value
    : typeof value === 'string' && value
    ? JSON.parse(value)
    : [];

  const handleToggle = (optionValue: string) => {
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue];
    onChange(newValues);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-base font-medium">
          {question.Question_Text}
          {question.Is_Required && <span className="ml-1 text-red-500">*</span>}
        </Label>
        {question.Helper_Text && (
          <p className="text-sm text-muted-foreground">{question.Helper_Text}</p>
        )}
      </div>

      <div className="space-y-2">
        {question.Options.map((option) => (
          <div
            key={option.Option_ID}
            className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/5"
          >
            <Checkbox
              id={`option-${option.Option_ID}`}
              checked={selectedValues.includes(option.Option_Value)}
              onCheckedChange={() => handleToggle(option.Option_Value)}
              className="mt-0.5"
            />
            <Label
              htmlFor={`option-${option.Option_ID}`}
              className="flex-1 cursor-pointer font-normal leading-none"
            >
              {option.Option_Text}
            </Label>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
