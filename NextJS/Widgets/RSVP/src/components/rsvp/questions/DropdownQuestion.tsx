// ===================================================================
// Dropdown Question Component
// ===================================================================
// Select from dropdown list (single selection)
// Uses Question_Options for dropdown items
// ===================================================================

'use client';

import { QuestionComponentProps } from '@/types/rsvp';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function DropdownQuestion({
  question,
  value,
  onChange,
  error,
}: QuestionComponentProps) {
  const stringValue = typeof value === 'string' ? value : question.Default_Value || '';

  return (
    <div className="space-y-2">
      <Label htmlFor={`question-${question.Question_ID}`} className="text-base font-medium">
        {question.Question_Text}
        {question.Is_Required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {question.Helper_Text && (
        <p className="text-sm text-muted-foreground">{question.Helper_Text}</p>
      )}
      <Select value={stringValue} onValueChange={onChange}>
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder={question.Placeholder_Text || 'Select an option'} />
        </SelectTrigger>
        <SelectContent>
          {question.Options.map((option) => (
            <SelectItem key={option.Option_ID} value={option.Option_Value}>
              {option.Option_Text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
