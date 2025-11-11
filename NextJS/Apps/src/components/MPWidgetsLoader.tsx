"use client";

import { useEffect } from "react";

export function MPWidgetsLoader() {
  useEffect(() => {
    console.log('[MPWidgetsLoader] Component mounted');

    // Check if script is already loaded
    if (document.getElementById('MPWidgets')) {
      console.log('[MPWidgetsLoader] Script already exists');
      return;
    }

    // Create and inject our modified script tag (from public folder)
    const script = document.createElement('script');
    script.id = 'MPWidgets';
    script.src = '/mp-widgets/MPWidgets.js';

    script.onload = () => {
      console.log('[MPWidgetsLoader] Script loaded');

      // Our modified script has auto-init logic, so just wait and check
      setTimeout(() => {
        const isCustomFormDefined = customElements.get('mpp-custom-form');
        console.log('[MPWidgetsLoader] Is mpp-custom-form defined?', isCustomFormDefined);

        if (isCustomFormDefined) {
          console.log('[MPWidgetsLoader] SUCCESS! Custom element is now defined');
        } else {
          console.log('[MPWidgetsLoader] Custom element not defined yet, waiting...');

          // Try manual init if auto-init didn't work
          setTimeout(() => {
            if (window.MPWidgets && window.MPWidgets.manualInit) {
              console.log('[MPWidgetsLoader] Calling manual init');
              window.MPWidgets.manualInit();
            }
          }, 500);
        }
      }, 500);
    };

    script.onerror = () => {
      console.error('[MPWidgetsLoader] Script failed to load');
    };

    // Add to document head
    document.head.appendChild(script);

    return () => {
      // Don't remove script on unmount - it's needed globally
    };
  }, []);

  return null;
}
