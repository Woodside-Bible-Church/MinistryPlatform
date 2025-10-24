'use client';

/**
 * Prayer Submission Form
 * Allows users to submit new prayer requests
 */

import { useState, useRef, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';

// Form validation schema
const prayerFormSchema = z.object({
  Entry_Title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  Description: z.string().min(10, 'Prayer request must be at least 10 characters').max(4000, 'Prayer request is too long'),
  Feedback_Type_ID: z.string().min(1, 'Please select a type'),
  Target_Date: z.string().optional(), // Optional target date for the prayer
  Anonymous_Share: z.boolean(), // Whether to submit anonymously
});

type PrayerFormValues = z.infer<typeof prayerFormSchema>;

interface PrayerFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: {
    Feedback_Entry_ID?: number;
    Feedback_Type_ID: number;
    Entry_Title: string;
    Description: string;
    Ongoing_Need: boolean;
    Target_Date?: string;
  };
}

export function PrayerForm({ onSuccess, onCancel, initialData }: PrayerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const isEditing = !!initialData?.Feedback_Entry_ID;
  const alertRef = useRef<HTMLDivElement>(null);

  const form = useForm<PrayerFormValues>({
    resolver: zodResolver(prayerFormSchema),
    defaultValues: {
      Entry_Title: initialData?.Entry_Title || '',
      Description: initialData?.Description || '',
      Feedback_Type_ID: initialData?.Feedback_Type_ID?.toString() || '1',
      Target_Date: initialData?.Target_Date || '',
      Anonymous_Share: false,
    },
  });

  // Scroll to alert when success or error changes
  useEffect(() => {
    if ((success || error) && alertRef.current) {
      alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [success, error]);


  async function onSubmit(values: PrayerFormValues) {
    console.log('[PrayerForm] Submit started', { values, isEditing });
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const url = isEditing
        ? `/api/prayers/${initialData!.Feedback_Entry_ID}`
        : '/api/prayers';

      const method = isEditing ? 'PATCH' : 'POST';

      console.log('[PrayerForm] Making request to:', url, { method });

      const response = await authenticatedFetch(url, {
        method,
        body: JSON.stringify({
          ...values,
          Feedback_Type_ID: parseInt(values.Feedback_Type_ID),
          Target_Date: values.Target_Date || null, // Send null if empty
          Ongoing_Need: !values.Target_Date, // If no target date, mark as ongoing
          Anonymous_Share: values.Anonymous_Share,
        }),
      });

      console.log('[PrayerForm] Response received:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
        console.error('[PrayerForm] Error response:', errorData);
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'submit'} prayer request`);
      }

      console.log('[PrayerForm] Success!');
      setSuccess(true);
      if (!isEditing) {
        form.reset();
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error(`[PrayerForm] Error ${isEditing ? 'updating' : 'submitting'} prayer:`, err);
      setError(err instanceof Error ? err.message : `An error occurred while ${isEditing ? 'updating' : 'submitting'} your prayer request`);
    } finally {
      setIsSubmitting(false);
      console.log('[PrayerForm] Submit completed');
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {success && (
        <Alert ref={alertRef} className="mb-6 bg-green-50 border-green-200 border-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <AlertDescription className="text-green-800 font-medium">
              {isEditing
                ? 'Your prayer request has been updated successfully!'
                : 'Your prayer request has been submitted! It will be reviewed before being posted to the Prayer Wall.'}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {error && (
        <Alert ref={alertRef} className="mb-6 bg-red-50 border-red-200 border-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <AlertDescription className="text-red-800 font-medium">
              {error}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="Entry_Title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prayer Title</FormLabel>
                <FormControl>
                  <Input placeholder="Brief title for your prayer request" {...field} />
                </FormControl>
                <FormDescription>
                  A short, descriptive title for your prayer request
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="Feedback_Type_ID"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                    <div className="flex-1 text-center transition-all duration-300">
                      <div className={`text-sm font-medium transition-all duration-300 ${field.value === '1' ? 'text-foreground scale-105' : 'text-muted-foreground scale-100'}`}>
                        Prayer Request
                      </div>
                      <div className={`text-xs transition-colors ${field.value === '1' ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                        Ask for prayer support
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => field.onChange(field.value === '1' ? '2' : '1')}
                      className={`relative inline-flex h-10 w-20 shrink-0 cursor-pointer items-center rounded-full border-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        field.value === '2' ? 'bg-[#61BC47] border-[#61BC47]' : 'bg-gray-200 border-gray-300'
                      }`}
                      style={{ backgroundColor: field.value === '2' ? '#61BC47' : '#e5e7eb', borderColor: field.value === '2' ? '#61BC47' : '#d1d5db' }}
                    >
                      <span
                        className={`pointer-events-none block h-8 w-8 rounded-full shadow-lg ring-0 transition-all duration-300 ${
                          field.value === '2' ? 'translate-x-10 bg-white' : 'translate-x-1 bg-white'
                        }`}
                        style={{ backgroundColor: '#ffffff' }}
                      />
                    </button>

                    <div className="flex-1 text-center transition-all duration-300">
                      <div className={`text-sm font-medium transition-all duration-300 ${field.value === '2' ? 'text-foreground scale-105' : 'text-muted-foreground scale-100'}`}>
                        Praise Report
                      </div>
                      <div className={`text-xs transition-colors ${field.value === '2' ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                        Share answered prayers
                      </div>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="Description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prayer Request</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Share your prayer request..."
                    className="min-h-[150px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Share your prayer request with the community
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="Anonymous_Share"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Submit Anonymously
                  </FormLabel>
                  <FormDescription>
                    Your name will not be shown with this prayer request
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="Target_Date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Date (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    min={new Date().toISOString().split('T')[0]} // Today or later
                  />
                </FormControl>
                <FormDescription>
                  If there&apos;s a specific date related to this prayer (e.g., surgery date, job interview), set it here.
                  Leave blank for ongoing needs.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting
                ? (isEditing ? 'Updating...' : 'Submitting...')
                : (isEditing ? 'Update Prayer Request' : 'Submit Prayer Request')}
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
