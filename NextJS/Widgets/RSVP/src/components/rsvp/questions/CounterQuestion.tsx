// ===================================================================
// Counter Question Component
// ===================================================================
// Numeric counter with +/- buttons
// Used for: party size, number of attendees, quantity selection
// ===================================================================

'use client';

import { QuestionComponentProps } from '@/types/rsvp';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuestionLabel } from './QuestionLabel';

export function CounterQuestion({
  question,
  value,
  onChange,
  error,
}: QuestionComponentProps) {
  const numericValue = typeof value === 'number' ? value : parseInt(question.Default_Value || '1');
  const min = question.Min_Value ?? 1;
  const max = question.Max_Value ?? 99;

  const increment = () => {
    if (numericValue < max) {
      onChange(numericValue + 1);
    }
  };

  const decrement = () => {
    if (numericValue > min) {
      onChange(numericValue - 1);
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <QuestionLabel question={question} htmlFor={`question-${question.Question_ID}`} />

      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={decrement}
          disabled={numericValue <= min}
          className="h-12 w-12 rounded-full bg-white hover:bg-secondary text-primary border-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Decrease"
        >
          <Minus className="h-5 w-5" />
        </Button>

        <div
          className={cn(
            'flex h-16 w-24 items-center justify-center rounded-lg border-2 bg-white/10',
            error ? 'border-red-500' : 'border-white/20'
          )}
        >
          <span className="text-3xl font-bold text-white">{numericValue}</span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={increment}
          disabled={numericValue >= max}
          className="h-12 w-12 rounded-full bg-white hover:bg-secondary text-primary border-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Increase"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
