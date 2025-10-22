'use client';

/**
 * Prayer List Component
 * Displays a list or stack of prayers with filtering options
 */

import { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/mpWidgetAuthClient';
import { PrayerCard } from './PrayerCard';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Prayer {
  Feedback_Entry_ID: number;
  Feedback_Type_ID: number;
  Entry_Title: string | null;
  Description: string;
  Date_Submitted: string;
  Ongoing_Need: boolean | null;
  Prayer_Count?: number | null;
  Contact_ID_Table?: {
    Display_Name: string;
    First_Name: string;
  };
  Feedback_Type_ID_Table?: {
    Feedback_Type: string;
  };
}

interface Category {
  Feedback_Type_ID: number;
  Feedback_Type: string;
}

interface PrayerListProps {
  mode?: 'stack' | 'list';
  onlyApproved?: boolean;
  showMyPrayers?: boolean;
}

export function PrayerList({ mode = 'stack', onlyApproved = true, showMyPrayers = false }: PrayerListProps) {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [filteredPrayers, setFilteredPrayers] = useState<Prayer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch prayers and categories
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch prayers - use authenticated fetch only for "My Prayers"
        const prayersUrl = `/api/prayers?${onlyApproved ? 'approved=true&' : ''}${showMyPrayers ? 'mine=true' : ''}`;
        const prayersResponse = showMyPrayers
          ? await authenticatedFetch(prayersUrl)
          : await fetch(prayersUrl);

        if (!prayersResponse.ok) {
          throw new Error('Failed to fetch prayers');
        }

        const prayersData = await prayersResponse.json();
        setPrayers(prayersData);
        setFilteredPrayers(prayersData);

        // Fetch categories - public endpoint, no auth needed
        const categoriesResponse = await fetch('/api/categories');

        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories');
        }

        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [onlyApproved, showMyPrayers]);

  // Apply filters
  useEffect(() => {
    let filtered = [...prayers];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        p => p.Feedback_Type_ID.toString() === selectedCategory
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.Description.toLowerCase().includes(term) ||
          (p.Entry_Title?.toLowerCase().includes(term) ?? false)
      );
    }

    setFilteredPrayers(filtered);
    setCurrentIndex(0);
  }, [prayers, selectedCategory, searchTerm]);

  const handlePrayedFor = (id: number) => {
    // Remove the prayer from the list
    setFilteredPrayers(prev => prev.filter(p => p.Feedback_Entry_ID !== id));

    // Optionally, you could make an API call here to track the prayer action
    // await authenticatedFetch(`/api/prayers/${id}/pray`, { method: 'POST' });
  };

  const handleDismiss = (id: number) => {
    // Remove the prayer from the list
    setFilteredPrayers(prev => prev.filter(p => p.Feedback_Entry_ID !== id));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <AlertDescription className="text-red-800">{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search prayers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.Feedback_Type_ID} value={category.Feedback_Type_ID.toString()}>
                  {category.Feedback_Type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredPrayers.length} {filteredPrayers.length === 1 ? 'prayer' : 'prayers'} found
        </div>
      </div>

      {/* Prayer Display */}
      {filteredPrayers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">No prayers found</p>
          <p className="text-sm text-muted-foreground">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your filters'
              : 'Be the first to submit a prayer request'}
          </p>
        </div>
      ) : mode === 'stack' ? (
        <div className="relative">
          {/* Stack mode: Show one prayer at a time */}
          <div className="relative min-h-[400px]">
            {filteredPrayers.slice(currentIndex, currentIndex + 3).map((prayer, index) => (
              <div
                key={prayer.Feedback_Entry_ID}
                className="absolute inset-0"
                style={{
                  zIndex: 3 - index,
                  transform: `scale(${1 - index * 0.05}) translateY(${index * 10}px)`,
                  opacity: index === 0 ? 1 : 0.6,
                  pointerEvents: index === 0 ? 'auto' : 'none',
                }}
              >
                <PrayerCard
                  prayer={prayer}
                  onPrayedFor={handlePrayedFor}
                  onDismiss={handleDismiss}
                  showSwipeHint={currentIndex === 0 && index === 0}
                />
              </div>
            ))}
          </div>

          {/* Progress indicator */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {currentIndex + 1} of {filteredPrayers.length}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* List mode: Show all prayers */}
          {filteredPrayers.map((prayer) => (
            <PrayerCard
              key={prayer.Feedback_Entry_ID}
              prayer={prayer}
              onPrayedFor={handlePrayedFor}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
}
