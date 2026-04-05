import { useEffect, useRef, useState } from "react";

import { hooksLensStore } from "@/lib/hookslens/store";

import type { StoreSnapshot, ThemeMode } from "../types";

const THEME_KEY = "hookslens_theme";

function getStoreSnapshot(): StoreSnapshot {
  const snapshot = hooksLensStore.snapshot();

  return {
    hooks: snapshot.hooks,
    timeline: snapshot.timeline,
    waterfall: snapshot.waterfall,
    routeCoverage: snapshot.routeCoverage,
    diagnostics: snapshot.diagnostics,
    routes: snapshot.routes,
    meta: { timestamp: Date.now() },
  };
}

export function useInsightSnapshot(paused: boolean) {
  const [snapshot, setSnapshot] = useState<StoreSnapshot | null>(null);
  const connected = true; // Always connected when reading directly from store
  const pausedRef = useRef(paused);

  pausedRef.current = paused;

  useEffect(() => {
    // Set initial snapshot
    setSnapshot(getStoreSnapshot());

    // Listen to store events
    const onHooksUpdated = () => {
      if (!pausedRef.current) {
        setSnapshot(getStoreSnapshot());
      }
    };

    const onTimelineUpdated = () => {
      if (!pausedRef.current) {
        setSnapshot(getStoreSnapshot());
      }
    };

    hooksLensStore.addEventListener("hooks:updated", onHooksUpdated);
    hooksLensStore.addEventListener("timeline:updated", onTimelineUpdated);

    // Refresh every 2 seconds to catch any missed updates
    const refreshInterval = setInterval(() => {
      if (!pausedRef.current) {
        setSnapshot(getStoreSnapshot());
      }
    }, 2000);

    return () => {
      hooksLensStore.removeEventListener("hooks:updated", onHooksUpdated);
      hooksLensStore.removeEventListener("timeline:updated", onTimelineUpdated);
      clearInterval(refreshInterval);
    };
  }, []);

  return { snapshot, connected, setSnapshot };
}

export function useThemeMode() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
        return;
      }

      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setTheme(prefersDark ? "dark" : "light");
    } catch {
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // Ignore storage errors in restricted environments.
      }
      return next;
    });
  };

  return { theme, toggleTheme };
}
