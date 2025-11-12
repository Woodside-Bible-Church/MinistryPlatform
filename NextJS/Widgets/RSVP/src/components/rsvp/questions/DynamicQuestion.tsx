// ===================================================================
// Dynamic Question Renderer
// ===================================================================
// Renders questions dynamically based on Component_Name from database
// Matches Question_Types from seed-lookup-tables.sql
// ===================================================================

'use client';

import { QuestionComponentProps } from '@/types/rsvp';
import { CounterQuestion } from './CounterQuestion';
import { CheckboxQuestion } from './CheckboxQuestion';
import { TextQuestion } from './TextQuestion';
import { TextareaQuestion } from './TextareaQuestion';
import { DropdownQuestion } from './DropdownQuestion';
import { RadioQuestion } from './RadioQuestion';
import { MultiCheckboxQuestion } from './MultiCheckboxQuestion';
import { DateQuestion } from './DateQuestion';
import { TimeQuestion } from './TimeQuestion';
import { EmailQuestion } from './EmailQuestion';
import { PhoneQuestion } from './PhoneQuestion';

/**
 * Dynamic question renderer component
 *
 * Routes to appropriate question component based on Component_Name
 * All question components receive the same props interface
 */
export function DynamicQuestion(props: QuestionComponentProps) {
  const { question } = props;

  // Map component names to React components
  const componentMap: Record<string, React.ComponentType<QuestionComponentProps>> = {
    CounterQuestion,
    CheckboxQuestion,
    TextQuestion,
    TextareaQuestion,
    DropdownQuestion,
    RadioQuestion,
    MultiCheckboxQuestion,
    DateQuestion,
    TimeQuestion,
    EmailQuestion,
    PhoneQuestion,
    // TODO: Implement remaining question types:
    // SearchableDropdownQuestion,
    // MultiSelectDropdownQuestion,
    // TagInputQuestion,
    // ButtonGroupQuestion,
    // MultiButtonGroupQuestion,
    // SliderQuestion,
    // RatingQuestion,
    // FileUploadQuestion,
    // ColorPickerQuestion,
  };

  const QuestionComponent = componentMap[question.Component_Name];

  if (!QuestionComponent) {
    // Fallback for unimplemented question types
    return (
      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
        <p className="text-sm text-yellow-600">
          Question type <code className="font-mono">{question.Component_Name}</code> is not yet implemented.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Question: {question.Question_Text}
        </p>
      </div>
    );
  }

  return <QuestionComponent {...props} />;
}
