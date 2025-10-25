'use client';

/**
 * Prayer Update Form
 * Allows users to add updates/testimonies to their prayer requests
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authenticatedFetch } from '@/lib/mpWidgetAuthClient';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';

// Form validation schema
const updateFormSchema = z.object({
  updateText: z.string().min(10, 'Update must be at least 10 characters').max(4000, 'Update is too long'),
  isAnswered: z.boolean(),
});

type UpdateFormValues = z.infer<typeof updateFormSchema>;

interface PrayerUpdateFormProps {
  prayerId: number;
  prayerTitle: string;
  onSuccess?: (update: { Update_Text: string; Is_Answered: boolean }) => void;
  onCancel?: () => void;
}

export function PrayerUpdateForm({ prayerId, prayerTitle, onSuccess, onCancel }: PrayerUpdateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      updateText: '',
      isAnswered: false,
    },
  });

  async function onSubmit(values: UpdateFormValues) {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await authenticatedFetch(`/api/prayers/${prayerId}/updates`, {
        method: 'POST',
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(errorData.message || 'Failed to add update');
      }

      await response.json(); // Parse response
      setSuccess(true);

      const updateData = {
        Update_Text: values.updateText,
        Is_Answered: values.isAnswered,
      };

      form.reset();

      // Call onSuccess after a short delay to show success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(updateData);
        }
      }, 1500);
    } catch (err) {
      console.error('[PrayerUpdateForm] Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while adding your update');
    } finally {
      setIsSubmitting(false);
    }
  }

  const isAnswered = form.watch('isAnswered');

  return (
    <div className="w-full max-w-2xl mx-auto">
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200 border-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <AlertDescription className="text-green-800 font-medium">
              {isAnswered
                ? 'Prayer marked as answered! Your testimony has been added.'
                : 'Update added successfully!'}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200 border-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <AlertDescription className="text-red-800 font-medium">
              {error}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
        <h4 className="text-sm font-medium text-muted-foreground mb-1">Prayer Request:</h4>
        <p className="text-foreground">{prayerTitle}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="updateText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Update</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Share how God is working... or how this prayer was answered!"
                    className="min-h-[150px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Share an update, testimony, or how God answered this prayer
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isAnswered"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-green-50/50">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Mark this prayer as answered
                  </FormLabel>
                  <FormDescription>
                    Check this if God has answered this prayer request
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
              style={{ backgroundColor: isAnswered ? '#61BC47' : undefined }}
            >
              {isSubmitting
                ? 'Adding Update...'
                : (isAnswered ? 'Mark Answered & Share Testimony' : 'Add Update')}
            </Button>

            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
