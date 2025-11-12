// ===================================================================
// Text Question Component
// ===================================================================
// Short text input
// Used for: names, short answers, single-line responses
// ===================================================================

'use client';

import { QuestionComponentProps } from '@/types/rsvp';
import { Input } from '@/components/ui/input';
import { QuestionLabel } from './QuestionLabel';

export function TextQuestion({
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
        type="text"
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.Placeholder_Text || undefined}
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
