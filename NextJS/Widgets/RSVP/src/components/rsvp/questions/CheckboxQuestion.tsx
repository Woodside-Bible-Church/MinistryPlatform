// ===================================================================
// Checkbox Question Component
// ===================================================================
// Single yes/no checkbox
// Used for: agreements, yes/no questions, opt-ins
// ===================================================================

'use client';

import { QuestionComponentProps } from '@/types/rsvp';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { motion } from 'framer-motion';

export function CheckboxQuestion({
  question,
  value,
  onChange,
  error,
}: QuestionComponentProps) {
  const booleanValue = typeof value === 'boolean' ? value : question.Default_Value === 'true';

  // Get the icon component dynamically (same pattern as QuestionLabel)
  const IconComponent = question.Icon_Name
    ? (LucideIcons[question.Icon_Name as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>) || HelpCircle
    : HelpCircle;

  return (
    <div className="space-y-4">
      {/* Entire question in a clickable box */}
      <motion.div
        onClick={() => onChange(!booleanValue)}
        className={cn(
          'flex items-start gap-3 rounded-lg border-2 p-4 transition-all cursor-pointer',
          error
            ? 'border-red-500 bg-red-500/10'
            : booleanValue
            ? 'border-white bg-white/15'
            : 'border-white/20 hover:bg-white/10 hover:border-white/30'
        )}
        animate={booleanValue ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Icon - shows Icon_Name or HelpCircle fallback */}
        <motion.div
          className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mt-0.5"
          animate={booleanValue ? {
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <IconComponent className="w-5 h-5 text-secondary" />
        </motion.div>

        {/* Question text and helper */}
        <div className="flex-1 space-y-1">
          <Label className="text-lg font-semibold leading-tight text-white cursor-pointer">
            {question.Question_Text}
            {question.Is_Required && <span className="ml-1 text-red-200">*</span>}
          </Label>
          {question.Helper_Text && (
            <p className="text-sm text-white/70">{question.Helper_Text}</p>
          )}
          <motion.p
            className="text-sm italic pt-1"
            animate={booleanValue ? {
              color: ['rgba(255,255,255,0.6)', 'rgba(255,255,255,1)', 'rgba(255,255,255,0.6)']
            } : {
              // Subtle pulsing glow when unchecked
              textShadow: [
                '0 0 8px rgba(255,255,255,0.3)',
                '0 0 12px rgba(255,255,255,0.5)',
                '0 0 8px rgba(255,255,255,0.3)'
              ],
              color: [
                'rgba(255,255,255,0.6)',
                'rgba(255,255,255,0.8)',
                'rgba(255,255,255,0.6)'
              ]
            }}
            transition={{
              duration: booleanValue ? 0.6 : 1.5,
              ease: 'easeInOut',
              repeat: booleanValue ? 0 : Infinity,
              repeatDelay: 0.5
            }}
          >
            {booleanValue ? '✓ Confirmed' : 'Click to confirm'}
          </motion.p>
        </div>
      </motion.div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
