"use client";

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "admin-theme";
const DEFAULT_THEME = "light";

export default function useAdminTheme() {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const next = stored || DEFAULT_THEME;
    setTheme(next);
    document.documentElement.dataset.theme = next;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = theme;
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    if (!mounted) return;
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.dataset.theme = next;
      return next;
    });
  }, [mounted]);

  return { theme, toggleTheme };
}
