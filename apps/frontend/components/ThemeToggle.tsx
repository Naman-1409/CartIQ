"use client";
import { useEffect, useState } from "react";

const LIGHT_MODE_CSS = `
  body { color: #111827 !important; }
  .gradient-mesh { background: #eef2ff !important; }
  .bg-orb { filter: blur(100px) !important; opacity: 0.35 !important; }
  .bg-orb-1 { background: radial-gradient(circle, rgba(167,139,250,0.7), rgba(221,214,254,0.1)) !important; }
  .bg-orb-2 { background: radial-gradient(circle, rgba(251,191,36,0.6), rgba(253,230,138,0.08)) !important; }
  .bg-orb-3 { background: radial-gradient(circle, rgba(52,211,153,0.5), rgba(167,243,208,0.07)) !important; }
  .bg-orb-4 { background: radial-gradient(circle, rgba(129,140,248,0.6), rgba(199,210,254,0.08)) !important; }
  .bg-grid { background-image: linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px) !important; }

  /* Text — target all gray and white text classes including opacity variants */
  .text-white:not(button):not(a) { color: #111827 !important; }
  [class*="text-gray-2"] { color: #1f2937 !important; }
  [class*="text-gray-3"] { color: #374151 !important; }
  [class*="text-gray-4"] { color: #4b5563 !important; }
  [class*="text-gray-5"] { color: #6b7280 !important; }
  [class*="text-gray-6"] { color: #4b5563 !important; }

  /* Backgrounds — [class*="bg-gray-9X"] matches bg-gray-900, bg-gray-900/60, bg-gray-950 etc. */
  [class*="bg-gray-95"] { background-color: #ffffff !important; }
  [class*="bg-gray-90"] { background-color: #f9fafb !important; }
  [class*="bg-gray-8"]  { background-color: #f3f4f6 !important; }

  /* Borders */
  [class*="border-gray-7"] { border-color: #d1d5db !important; }
  [class*="border-gray-8"] { border-color: #e5e7eb !important; }

  /* Platform cards */
  .platform-card { background: #ffffff !important; box-shadow: 0 2px 20px rgba(0,0,0,0.08) !important; }

  /* Winner card header: bg-emerald-950/30 goes muddy-gray on white bg — fix with light mint */
  [class*="bg-emerald-950"] { background-color: rgba(209,250,229,0.55) !important; }
  [class*="bg-emerald-9"] { background-color: rgba(209,250,229,0.45) !important; }
  /* Keep vivid border on winner card */
  [class*="border-emerald-5"] { border-color: rgba(16,185,129,0.75) !important; }
  /* Winner glow stays in light mode */
  .winner-glow { box-shadow: 0 0 20px rgba(16,185,129,0.3), 0 0 40px rgba(16,185,129,0.15) !important; }

  /* Search textarea */
  textarea { color: #111827 !important; background-color: transparent !important; }
  textarea::placeholder { color: #9ca3af !important; }

  /* Skeleton */
  .skeleton { background: linear-gradient(90deg, #e5e7eb 25%, #d1d5db 50%, #e5e7eb 75%) !important; background-size: 1000px 100% !important; }

  /* Scrollbar */
  ::-webkit-scrollbar-track { background: #f3f4f6 !important; }
  ::-webkit-scrollbar-thumb { background: #d1d5db !important; }
`;

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("qc-theme") as "dark" | "light" | null;
    const initial = stored || "dark";
    applyTheme(initial);
    setTheme(initial);
    setMounted(true);
  }, []);

  const applyTheme = (next: "dark" | "light") => {
    document.documentElement.setAttribute("data-theme", next);

    // Inject or remove the light-mode stylesheet
    let el = document.getElementById("qc-light-theme");
    if (next === "light") {
      if (!el) {
        el = document.createElement("style");
        el.id = "qc-light-theme";
        document.head.appendChild(el);
      }
      el.textContent = LIGHT_MODE_CSS;
    } else {
      el?.remove();
    }
  };

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("qc-theme", next);
  };

  if (!mounted) {
    return <div className="w-10 h-10 rounded-xl" style={{ background: "rgba(31,41,55,0.5)", border: "1px solid rgba(75,85,99,0.4)" }} />;
  }

  return (
    <button
      onClick={toggle}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-300 active:scale-90 shadow-md"
      style={{
        background: theme === "dark" ? "rgba(31,41,55,0.85)" : "rgba(255,255,255,0.9)",
        border: theme === "dark" ? "1px solid rgba(75,85,99,0.5)" : "1px solid rgba(209,213,219,0.9)",
        boxShadow: theme === "dark" ? "0 2px 12px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.12)",
        backdropFilter: "blur(8px)",
      }}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
