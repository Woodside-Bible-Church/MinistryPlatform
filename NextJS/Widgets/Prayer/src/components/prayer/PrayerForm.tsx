'use client';

/**
 * Prayer Submission Form
 * Allows users to submit new prayer requests
 */

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Form validation schema
const prayerFormSchema = z.object({
  Entry_Title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  Description: z.string().min(10, 'Prayer request must be at least 10 characters').max(4000, 'Prayer request is too long'),
  Feedback_Type_ID: z.string().min(1, 'Please select a category'),
  Ongoing_Need: z.boolean().default(false),
});

type PrayerFormValues = z.infer<typeof prayerFormSchema>;

interface Category {
  Feedback_Type_ID: number;
  Feedback_Type: string;
  Description: string | null;
}

interface PrayerFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PrayerForm({ onSuccess, onCancel }: PrayerFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<PrayerFormValues>({
    resolver: zodResolver(prayerFormSchema),
    defaultValues: {
      Entry_Title: '',
      Description: '',
      Feedback_Type_ID: '',
      Ongoing_Need: false,
    },
  });

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await authenticatedFetch('/api/categories');

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load prayer categories');
      }
    }

    fetchCategories();
  }, []);

  async function onSubmit(values: PrayerFormValues) {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await authenticatedFetch('/api/prayers', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          Feedback_Type_ID: parseInt(values.Feedback_Type_ID),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit prayer request');
      }

      setSuccess(true);
      form.reset();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error submitting prayer:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while submitting your prayer request');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Your prayer request has been submitted and is pending approval. You will be notified once it is reviewed.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
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
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.Feedback_Type_ID}
                        value={category.Feedback_Type_ID.toString()}
                      >
                        {category.Feedback_Type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the category that best fits your prayer request
                </FormDescription>
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
            name="Ongoing_Need"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Ongoing Need</FormLabel>
                  <FormDescription>
                    Mark this if your prayer request is ongoing
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Submitting...' : 'Submit Prayer Request'}
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
