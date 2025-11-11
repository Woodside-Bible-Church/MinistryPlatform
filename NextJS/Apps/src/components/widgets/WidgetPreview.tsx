"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface WidgetPreviewProps {
  embedCode: string;
  widgetName: string;
  widgetSource?: 'custom' | 'ministry_platform' | 'third_party';
}

const MP_WIDGETS_SCRIPT_URL = 'https://my.woodsidebible.org/widgets/dist/MPWidgets.js';

export function WidgetPreview({ embedCode, widgetName, widgetSource = 'custom' }: WidgetPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mpScriptLoaded, setMpScriptLoaded] = useState(false);

  // Load Ministry Platform widgets script if needed
  useEffect(() => {
    if (widgetSource !== 'ministry_platform') {
      setMpScriptLoaded(true);
      return;
    }

    // Check if MP script is already loaded
    if (document.querySelector(`script[src="${MP_WIDGETS_SCRIPT_URL}"]`)) {
      setMpScriptLoaded(true);
      return;
    }

    // Load MP widgets script
    const script = document.createElement('script');
    script.src = MP_WIDGETS_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      console.log('Ministry Platform widgets script loaded');
      setMpScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Ministry Platform widgets script');
      setError('Failed to load Ministry Platform widgets');
      setMpScriptLoaded(true); // Allow proceeding anyway
    };

    document.head.appendChild(script);

    return () => {
      // Keep the script loaded for other MP widgets
    };
  }, [widgetSource]);

  useEffect(() => {
    if (!containerRef.current || !mpScriptLoaded) return;

    setIsLoading(true);
    setError(null);

    // Clear previous content
    containerRef.current.innerHTML = "";

    try {
      // Create a wrapper div for the widget
      const wrapper = document.createElement("div");
      wrapper.innerHTML = embedCode;

      // Append to container
      containerRef.current.appendChild(wrapper);

      // Find and execute any script tags
      const scripts = wrapper.querySelectorAll("script");
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");

        // Copy attributes
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });

        // Copy script content
        if (oldScript.src) {
          newScript.src = oldScript.src;
          newScript.onload = () => {
            setIsLoading(false);
          };
          newScript.onerror = () => {
            setError("Failed to load widget script");
            setIsLoading(false);
          };
        } else {
          newScript.textContent = oldScript.textContent;
          setIsLoading(false);
        }

        // Replace old script with new one to execute it
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });

      // If no scripts, remove loading state
      if (scripts.length === 0) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error rendering widget:", err);
      setError("Failed to render widget");
      setIsLoading(false);
    }

    // Cleanup on unmount
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [embedCode, mpScriptLoaded]);

  return (
    <div className="relative min-h-[500px] bg-card border border-border md:rounded-lg p-0 md:p-6 -mx-4 md:mx-0">
      <h2 className="text-lg font-semibold text-foreground mb-4 px-4 md:px-0 pt-4 md:pt-0">Live Preview</h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <p className="text-sm text-red-500 dark:text-red-500 mt-2">
            Make sure the widget server is running
          </p>
        </div>
      )}

      {isLoading && !error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#61BC47] animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading {widgetName}...</p>
          </div>
        </div>
      )}

      <div ref={containerRef} className="min-h-[400px]" />
    </div>
  );
}
