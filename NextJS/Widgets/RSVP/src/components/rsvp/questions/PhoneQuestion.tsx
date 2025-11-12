// ===================================================================
// Phone Question Component
// ===================================================================
// Phone number input with formatting
// Accepts various formats, displays formatted
// ===================================================================

'use client';

import { QuestionComponentProps } from '@/types/rsvp';
import { Input } from '@/components/ui/input';
import { QuestionLabel } from './QuestionLabel';

export function PhoneQuestion({
  question,
  value,
  onChange,
  error,
}: QuestionComponentProps) {
  const stringValue = typeof value === 'string' ? value : question.Default_Value || '';

  // Basic phone formatting (US): (123) 456-7890
  const formatPhone = (input: string) => {
    const digits = input.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    onChange(formatted);
  };

  return (
    <div className="space-y-3">
      <QuestionLabel question={question} htmlFor={`question-${question.Question_ID}`} />
      <Input
        id={`question-${question.Question_ID}`}
        type="tel"
        value={stringValue}
        onChange={handleChange}
        placeholder={question.Placeholder_Text || '(123) 456-7890'}
        maxLength={14}
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
