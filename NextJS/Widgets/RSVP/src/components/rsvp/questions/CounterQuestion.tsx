// ===================================================================
// Counter Question Component
// ===================================================================
// Numeric counter with +/- buttons
// Used for: party size, number of attendees, quantity selection
// ===================================================================

'use client';

import { QuestionComponentProps } from '@/types/rsvp';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuestionLabel } from './QuestionLabel';
import { motion } from 'framer-motion';

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Allow empty string for easier editing
    if (newValue === '') {
      onChange(min);
      return;
    }

    const parsed = parseInt(newValue);

    // Only update if it's a valid number within range
    if (!isNaN(parsed)) {
      if (parsed >= min && parsed <= max) {
        onChange(parsed);
      } else if (parsed > max) {
        onChange(max);
      } else if (parsed < min) {
        onChange(min);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4">
        <QuestionLabel question={question} htmlFor={`question-${question.Question_ID}`} />

        <div className="flex items-center justify-center gap-4 mt-4">
        <motion.button
          type="button"
          onClick={numericValue > min ? decrement : undefined}
          className={cn(
            'h-12 w-12 rounded-full border-2 flex items-center justify-center',
            numericValue <= min
              ? 'border-white/10 bg-white/5 text-white/30 cursor-not-allowed pointer-events-none'
              : 'border-white/20 bg-white/10 text-white shadow-[2px_3px_8px_rgba(0,0,0,0.3)] cursor-pointer'
          )}
          initial={{ scale: 1 }}
          whileHover={{
            scale: 1.05,
            boxShadow: '2px 4px 9px rgba(0,0,0,0.32)',
            transition: { duration: 0.15, ease: 'easeOut' }
          }}
          whileTap={{ scale: 0.95, transition: { duration: 0.1, ease: 'easeOut' } }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          aria-label="Decrease"
          aria-disabled={numericValue <= min}
        >
          <Minus className="h-5 w-5" />
        </motion.button>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          id={`question-${question.Question_ID}`}
          value={numericValue}
          onChange={handleInputChange}
          className={cn(
            'flex h-16 w-24 items-center justify-center rounded-lg border-2 bg-white/10 text-center text-3xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary',
            error ? 'border-red-500' : 'border-white/20'
          )}
          aria-label={question.Question_Text}
        />

        <motion.button
          type="button"
          onClick={numericValue < max ? increment : undefined}
          className={cn(
            'h-12 w-12 rounded-full border-2 flex items-center justify-center',
            numericValue >= max
              ? 'border-white/10 bg-white/5 text-white/30 cursor-not-allowed pointer-events-none'
              : 'border-white/20 bg-white/10 text-white shadow-[2px_3px_8px_rgba(0,0,0,0.3)] cursor-pointer'
          )}
          initial={{ scale: 1 }}
          whileHover={{
            scale: 1.05,
            boxShadow: '2px 4px 9px rgba(0,0,0,0.32)',
            transition: { duration: 0.15, ease: 'easeOut' }
          }}
          whileTap={{ scale: 0.95, transition: { duration: 0.1, ease: 'easeOut' } }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          aria-label="Increase"
          aria-disabled={numericValue >= max}
        >
          <Plus className="h-5 w-5" />
        </motion.button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
