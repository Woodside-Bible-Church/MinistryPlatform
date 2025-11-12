// ===================================================================
// Radio Question Component
// ===================================================================
// Radio button group for single selection
// Uses Question_Options for radio options
// ===================================================================

'use client';

import { QuestionComponentProps } from '@/types/rsvp';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function RadioQuestion({
  question,
  value,
  onChange,
  error,
}: QuestionComponentProps) {
  const stringValue = typeof value === 'string' ? value : question.Default_Value || '';

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-base font-medium">
          {question.Question_Text}
          {question.Is_Required && <span className="ml-1 text-red-500">*</span>}
        </Label>
        {question.Helper_Text && (
          <p className="text-sm text-muted-foreground">{question.Helper_Text}</p>
        )}
      </div>

      <RadioGroup value={stringValue} onValueChange={onChange}>
        <div className="space-y-2">
          {question.Options.map((option) => (
            <div
              key={option.Option_ID}
              className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent/5"
            >
              <RadioGroupItem value={option.Option_Value} id={`option-${option.Option_ID}`} />
              <Label
                htmlFor={`option-${option.Option_ID}`}
                className="flex-1 cursor-pointer font-normal"
              >
                {option.Option_Text}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
