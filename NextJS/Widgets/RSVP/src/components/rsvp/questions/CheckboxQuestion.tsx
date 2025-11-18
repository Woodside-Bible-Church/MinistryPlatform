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
          'rounded-lg border-2 p-4 transition-shadow cursor-pointer space-y-2',
          error
            ? 'border-red-500 bg-red-500/10 shadow-[3px_6px_12px_rgba(239,68,68,0.2)]'
            : booleanValue
            ? 'border-white bg-white/15 shadow-[3px_6px_15px_rgba(255,255,255,0.18)]'
            : 'border-white/20 shadow-[2px_3px_8px_rgba(0,0,0,0.3)]'
        )}
        animate={booleanValue ? { scale: 1 } : { scale: 1 }}
        initial={{ scale: 1 }}
        whileHover={{
          scale: 1.005,
          boxShadow: '2px 4px 9px rgba(0,0,0,0.32)',
          transition: { duration: 0.15, ease: 'easeOut' }
        }}
        whileTap={{ scale: 0.99, transition: { duration: 0.1 } }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Icon and Question Text (first row) */}
        <div className="flex min-[480px]:grid min-[480px]:grid-cols-[auto_1fr_auto] items-center justify-between min-[480px]:justify-start gap-3 mb-3">
          {/* Icon - shows Icon_Name or HelpCircle fallback */}
          <motion.div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
            animate={booleanValue ? {
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            } : {}}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <IconComponent className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
          </motion.div>

          <Label
            className="text-lg font-semibold leading-tight cursor-pointer text-right min-[480px]:text-center block flex-1"
            style={{ color: 'var(--theme-secondary)' }}
          >
            {question.Question_Text}
            {question.Is_Required && <span className="ml-1 text-red-200">*</span>}
          </Label>

          <div className="w-10 hidden min-[480px]:block"></div>
        </div>

        {/* Helper Text (full width below) */}
        {question.Helper_Text && (
          <p
            className="text-sm w-full text-center"
            style={{ color: 'var(--theme-primary)', opacity: 0.8 }}
          >
            {question.Helper_Text}
          </p>
        )}

        {/* Click to confirm text (full width below) */}
        <motion.p
          className="text-sm italic w-full text-right"
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
      </motion.div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
