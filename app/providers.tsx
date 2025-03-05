"use client";

import { useRef, useEffect, Suspense } from "react";
import { Provider } from "react-redux";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider, usePostHog } from "posthog-js/react";
import type { ReactNode } from "react";
import { AppStore, makeStore } from "@/redux/store";

// PostHog page view tracking component
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    // Only capture pageviews in production
    if (pathname && posthog && process.env.NODE_ENV === "production") {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + "?" + searchParams.toString();
      }
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}

// Suspense wrapper for PostHogPageView
function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  );
}

// Combined Providers component
export function Providers({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  // Initialize PostHog only in production environment
  useEffect(() => {
    // Check if we're in production environment
    if (process.env.NODE_ENV === "production") {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        person_profiles: "always",
        capture_pageview: false,
      });
    }
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <Provider store={storeRef.current}>
        <SuspendedPostHogPageView />
        {children}
      </Provider>
    </PostHogProvider>
  );
}
