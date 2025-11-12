// ===================================================================
// Textarea Question Component
// ===================================================================
// Long text area for multi-line responses
// Used for: comments, descriptions, detailed responses
// ===================================================================

'use client';

import { QuestionComponentProps } from '@/types/rsvp';
import { Textarea } from '@/components/ui/textarea';
import { QuestionLabel } from './QuestionLabel';

export function TextareaQuestion({
  question,
  value,
  onChange,
  error,
}: QuestionComponentProps) {
  const stringValue = typeof value === 'string' ? value : question.Default_Value || '';

  return (
    <div className="space-y-3">
      <QuestionLabel question={question} htmlFor={`question-${question.Question_ID}`} />
      <Textarea
        id={`question-${question.Question_ID}`}
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.Placeholder_Text || undefined}
        className={error ? 'border-red-500' : ''}
        rows={4}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
