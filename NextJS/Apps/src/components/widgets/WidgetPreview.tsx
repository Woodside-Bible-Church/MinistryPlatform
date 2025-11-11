"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface WidgetPreviewProps {
  embedCode: string;
  widgetName: string;
  widgetSource?: 'custom' | 'ministry_platform' | 'third_party';
}

export function WidgetPreview({ embedCode, widgetName, widgetSource = 'custom' }: WidgetPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    setIsLoading(true);
    setError(null);

    // Clear previous content
    containerRef.current.innerHTML = "";

    try {
      // For MP widgets, include the script tag to trigger re-initialization
      if (widgetSource === 'ministry_platform') {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = embedCode;

        // Append to container (including script tag)
        containerRef.current.appendChild(wrapper);

        // Execute script tags to re-initialize widgets
        const scripts = wrapper.querySelectorAll("script");
        scripts.forEach((oldScript) => {
          const newScript = document.createElement("script");

          // Copy attributes
          Array.from(oldScript.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });

          if (oldScript.src) {
            newScript.src = oldScript.src;
            newScript.onload = () => {
              // Wait a bit for widget to initialize after script loads
              setTimeout(() => {
                setIsLoading(false);
              }, 1000);
            };
            newScript.onerror = () => {
              setError("Failed to load Ministry Platform widgets script");
              setIsLoading(false);
            };
          }

          // Replace old script with new one to execute it
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        });

        // If no scripts, remove loading state
        if (scripts.length === 0) {
          setIsLoading(false);
        }
      } else {
        // Custom widgets - original behavior
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
  }, [embedCode, widgetSource]);

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
