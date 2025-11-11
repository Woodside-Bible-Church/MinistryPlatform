"use client";

import Script from "next/script";

export function MPWidgetsLoader() {
  return (
    <Script
      src="https://my.woodsidebible.org/widgets/dist/MPWidgets.js"
      strategy="afterInteractive"
    />
  );
}
