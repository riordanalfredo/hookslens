import { useEffect, useRef, useState } from "react";
import type { StoreSnapshot, ThemeMode } from "../types";

const STREAM_ENDPOINT = "/__hookslens/api/stream";
const SNAPSHOT_ENDPOINT = "/__hookslens/api/hooks";
const THEME_KEY = "__hookslens_theme";

export function useInsightSnapshot(paused: boolean) {
  const [snapshot, setSnapshot] = useState<StoreSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const pausedRef = useRef(paused);

  pausedRef.current = paused;

  useEffect(() => {
    const es = new EventSource(STREAM_ENDPOINT);

    const onUpdate = (event: MessageEvent<string>) => {
      if (pausedRef.current) return;
      setSnapshot(JSON.parse(event.data) as StoreSnapshot);
      setConnected(true);
    };

    es.addEventListener("snapshot", onUpdate as EventListener);
    es.addEventListener("hooks:updated", onUpdate as EventListener);
    es.addEventListener("timeline:updated", onUpdate as EventListener);
    es.onerror = () => setConnected(false);

    return () => es.close();
  }, []);

  useEffect(() => {
    if (connected) return;

    const id = setInterval(async () => {
      if (pausedRef.current) return;
      try {
        const res = await fetch(SNAPSHOT_ENDPOINT, { cache: "no-store" });
        const data = (await res.json()) as StoreSnapshot;
        setSnapshot(data);
        setConnected(true);
      } catch {
        setConnected(false);
      }
    }, 2000);

    return () => clearInterval(id);
  }, [connected]);

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
