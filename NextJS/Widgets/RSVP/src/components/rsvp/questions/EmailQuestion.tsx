// ===================================================================
// Email Question Component
// ===================================================================
// Email input with HTML5 validation
// Used for: email collection, contact information
// ===================================================================

'use client';

import { QuestionComponentProps } from '@/types/rsvp';
import { Input } from '@/components/ui/input';
import { QuestionLabel } from './QuestionLabel';

export function EmailQuestion({
  question,
  value,
  onChange,
  error,
}: QuestionComponentProps) {
  const stringValue = typeof value === 'string' ? value : question.Default_Value || '';

  return (
    <div className="space-y-3">
      <QuestionLabel question={question} htmlFor={`question-${question.Question_ID}`} />
      <Input
        id={`question-${question.Question_ID}`}
        type="email"
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.Placeholder_Text || 'email@example.com'}
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
