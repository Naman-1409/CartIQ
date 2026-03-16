"use client";
import { useState, useEffect } from "react";

/**
 * Subscribes to the data-theme attribute on <html> via MutationObserver.
 * Returns "dark" | "light" and re-renders when the theme changes.
 */
export function useTheme(): "dark" | "light" {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const read = () =>
      (document.documentElement.getAttribute("data-theme") as "dark" | "light") || "dark";

    setTheme(read());

    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}
