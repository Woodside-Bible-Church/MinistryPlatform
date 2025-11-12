// ===================================================================
// Time Question Component
// ===================================================================
// Time picker for time selection
// Value stored as HH:MM string (24-hour format)
// ===================================================================

'use client';

import { QuestionComponentProps } from '@/types/rsvp';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function TimeQuestion({
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
      <Input
        id={`question-${question.Question_ID}`}
        type="time"
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
