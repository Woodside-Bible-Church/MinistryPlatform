"use client";

import { useState, useEffect } from "react";
import { Loader2, Info } from "lucide-react";
import { SearchableSelect } from "@/components/widgets/SearchableSelect";
import { useRouter, useSearchParams } from "next/navigation";

interface UrlParameter {
  id: number;
  parameterKey: string;
  description: string;
  exampleValue: string | null;
  isRequired: boolean;
  isInteractive: boolean;
  dataSourceType: string | null;
  dataSourceConfig: any;
  sortOrder: number;
}

interface UrlParametersSectionProps {
  widgetId: string;
}

export function UrlParametersSection({ widgetId }: UrlParametersSectionProps) {
  const [parameters, setParameters] = useState<UrlParameter[]>([]);
  const [parameterOptions, setParameterOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [loadingFields, setLoadingFields] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch URL parameters
  useEffect(() => {
    async function fetchUrlParameters() {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/widgets/${widgetId}/url-parameters`);
        if (!response.ok) {
          throw new Error('Failed to fetch URL parameters');
        }

        const data = await response.json();
        setParameters(data.filter((p: UrlParameter) => p.isInteractive));
      } catch (err) {
        console.error('Error fetching URL parameters:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (widgetId) {
      fetchUrlParameters();
    }
  }, [widgetId]);

  // Fetch options for interactive parameters
  useEffect(() => {
    parameters.forEach(async (param) => {
      if (!param.isInteractive || !param.dataSourceType) return;
      if (parameterOptions[param.id.toString()]) return;

      setLoadingFields((prev) => new Set(prev).add(param.id.toString()));

      try {
        const response = await fetch(`/api/widgets/field-data/${param.id}?type=url-parameter`);
        if (!response.ok) throw new Error('Failed to fetch options');

        const options = await response.json();
        setParameterOptions((prev) => ({ ...prev, [param.id]: options }));
      } catch (error) {
        console.error(`Error fetching options for ${param.parameterKey}:`, error);
      } finally {
        setLoadingFields((prev) => {
          const newSet = new Set(prev);
          newSet.delete(param.id.toString());
          return newSet;
        });
      }
    });
  }, [parameters, parameterOptions]);

  const handleParameterChange = (paramKey: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(paramKey, value);
    } else {
      params.delete(paramKey);
    }

    // Update URL without page reload
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const getParameterValue = (paramKey: string) => {
    return searchParams.get(paramKey) || '';
  };

  // Get active parameters for display
  const activeParams = parameters
    .map(p => ({ key: p.parameterKey, value: searchParams.get(p.parameterKey) }))
    .filter(p => p.value);

  // Don't show section if no interactive parameters
  if (isLoading || parameters.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {parameters.map((param) => (
        <div key={param.id}>
          <label className="block text-sm font-medium text-foreground mb-2">
            {param.description}
            {param.isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>

          {loadingFields.has(param.id.toString()) ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading options...
            </div>
          ) : (
            <SearchableSelect
              value={getParameterValue(param.parameterKey)}
              onChange={(value) => handleParameterChange(param.parameterKey, value)}
              options={parameterOptions[param.id] || []}
              placeholder={`Select ${param.parameterKey}`}
            />
          )}
        </div>
      ))}

      {activeParams.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex gap-2">
            <Info className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="text-sm text-green-900 dark:text-green-300 font-medium">
                URL Parameters Active
              </p>
              <p className="text-xs text-green-800 dark:text-green-400">
                These parameters will be added to your page URL:
              </p>
              <code className="text-xs font-mono bg-white/50 dark:bg-black/20 px-2 py-1 rounded block mt-2">
                woodsidebible.org/your-page/?{activeParams.map(p => `${p.key}=${p.value}`).join('&')}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
