"use client";
import { PlatformCart } from "@/app/results/[searchId]/page";
import { useTheme } from "@/hooks/useTheme";

// Light mode: vivid solid brand gradients
const PLATFORM_COLORS_DARK: Record<string, { bg: string; text: string }> = {
  blinkit: { bg: "from-yellow-500/20 to-yellow-900/10", text: "text-yellow-400" },
  zepto: { bg: "from-purple-500/20 to-purple-900/10", text: "text-purple-400" },
  bigbasket: { bg: "from-green-500/20 to-green-900/10", text: "text-green-400" },
};

const PLATFORM_COLORS_LIGHT: Record<string, { gradient: string; text: string; border: string }> = {
  blinkit: {
    gradient: "linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)",
    text: "#ffffff",
    border: "#f59e0b",
  },
  zepto: {
    gradient: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
    text: "#ffffff",
    border: "#7c3aed",
  },
  bigbasket: {
    gradient: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
    text: "#ffffff",
    border: "#16a34a",
  },
};

const PLATFORM_CHECKOUT_BASE: Record<string, string> = {
  blinkit: "https://blinkit.com/",
  zepto: "https://www.zeptonow.com/",
  bigbasket: "https://www.bigbasket.com/",
};

export default function WinnerBanner({
  winner,
  platforms,
}: {
  winner: string;
  platforms: PlatformCart[];
}) {
  const theme = useTheme();
  const winnerPlatform = platforms.find((p) => p.platform === winner);
  if (!winnerPlatform) return null;

  const sorted = [...platforms].sort((a, b) => a.total_payable - b.total_payable);
  const savings = sorted.length > 1 ? sorted[sorted.length - 1].total_payable - sorted[0].total_payable : 0;

  const firstAvailableItem = winnerPlatform.items.find((i) => i.available && i.product_url);
  const checkoutUrl = firstAvailableItem?.product_url || PLATFORM_CHECKOUT_BASE[winner] || "#";

  // ── Dark mode: original subtle gradient approach
  if (theme === "dark") {
    const colors = PLATFORM_COLORS_DARK[winner] || { bg: "from-emerald-500/20", text: "text-emerald-400" };
    return (
      <div
        className={`rounded-3xl bg-gradient-to-br ${colors.bg} border-2 border-emerald-500/40 p-8 animate-slide-up shadow-2xl shadow-emerald-500/10 backdrop-blur-md relative overflow-hidden`}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <BannerContent
          winnerPlatform={winnerPlatform}
          sorted={sorted}
          savings={savings}
          checkoutUrl={checkoutUrl}
          titleColor={colors.text}
          bodyColor="text-gray-300"
          subtitleStyle={{}}
          theme="dark"
        />
      </div>
    );
  }

  // ── Light mode: vivid solid brand gradient
  const lc = PLATFORM_COLORS_LIGHT[winner] || {
    gradient: "linear-gradient(135deg, #10b981, #34d399)",
    text: "#fff",
    border: "#10b981",
  };

  return (
    <div
      className="rounded-3xl p-8 animate-slide-up shadow-2xl relative overflow-hidden"
      style={{
        background: lc.gradient,
        border: `2px solid ${lc.border}`,
        boxShadow: `0 8px 40px ${lc.border}40`,
      }}
    >
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <BannerContent
        winnerPlatform={winnerPlatform}
        sorted={sorted}
        savings={savings}
        checkoutUrl={checkoutUrl}
        titleColor=""
        bodyColor=""
        subtitleStyle={{ color: "rgba(255,255,255,0.9)" }}
        theme="light"
      />
    </div>
  );
}

// ── Shared banner body ─────────────────────────────────────────────────────

function BannerContent({
  winnerPlatform,
  sorted,
  savings,
  checkoutUrl,
  titleColor,
  bodyColor,
  subtitleStyle,
  theme,
}: {
  winnerPlatform: PlatformCart;
  sorted: PlatformCart[];
  savings: number;
  checkoutUrl: string;
  titleColor: string;
  bodyColor: string;
  subtitleStyle: React.CSSProperties;
  theme: "dark" | "light";
}) {
  const textClass = theme === "light" ? "text-white" : "";
  const badgeBg = theme === "light" ? "bg-white/20 border-white/30" : "bg-emerald-950/50 border-emerald-500/30";
  const badgeText = theme === "light" ? "text-white" : "text-emerald-400";
  const savingsBg = theme === "light" ? "bg-white/20 text-white" : "bg-emerald-500/10 text-emerald-400";
  const rankBg = (i: number) =>
    i === 0
      ? theme === "light" ? "bg-white/20" : "bg-white/10"
      : "opacity-60";
  const rankText = theme === "light" ? "text-white" : "text-white";
  const rankSub = theme === "light" ? "text-white/70" : "text-gray-400";
  const btnClass =
    theme === "light"
      ? "bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
      : "bg-white text-black hover:bg-emerald-50 shadow-xl shadow-white/10";

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl animate-bounce">🏆</span>
          <span className={`text-xs uppercase tracking-[0.2em] font-extrabold px-3 py-1 rounded-full border ${badgeBg} ${badgeText}`}>
            Optimal Choice Found
          </span>
        </div>

        <div>
          <h2
            className="text-3xl md:text-4xl font-black leading-tight"
            style={{ fontFamily: "var(--font-outfit)", color: theme === "light" ? "#fff" : undefined }}
          >
            <span className={titleColor || "text-white"}>
              {winnerPlatform.platform_display}
            </span>{" "}
            {theme === "dark" && <span className="text-white">is your best bet</span>}
            {theme === "light" && "is your best bet"}
          </h2>
          <p className={`text-lg mt-2 font-medium ${bodyColor}`} style={subtitleStyle}>
            Total Payable:{" "}
            <span className="font-black text-2xl" style={{ color: theme === "light" ? "#fff" : undefined }}>
              ₹{winnerPlatform.total_payable.toFixed(0)}
            </span>
            {savings > 0 && (
              <span className={`ml-3 inline-flex items-center gap-1.5 font-bold px-3 py-1 rounded-lg ${savingsBg}`}>
                <span className="text-sm">⚡</span> Save ₹{savings.toFixed(0)}
              </span>
            )}
          </p>
        </div>

        {/* Rank mini table */}
        <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-white/20">
          {sorted.map((p, i) => (
            <div key={p.platform} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${rankBg(i)}`}>
              <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
              <div>
                <p className={`text-xs font-bold leading-none ${rankText}`}>{p.platform_display}</p>
                <p className={`text-[10px] mt-1 ${rankSub}`}>₹{p.total_payable.toFixed(0)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          id="winner-checkout-btn"
          className={`group relative flex-shrink-0 flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 px-10 py-5 rounded-2xl font-black text-lg overflow-hidden ${btnClass}`}
        >
          <span className="relative z-10 flex items-center gap-2">
            Instant Purchase{" "}
            <span className="text-2xl transition-transform group-hover:translate-x-1">→</span>
          </span>
        </a>
        <p className="text-center text-[10px] font-medium uppercase tracking-widest opacity-60"
          style={{ color: theme === "light" ? "#fff" : "#6b7280" }}>
          Secure Transaction on {winnerPlatform.platform_display}
        </p>
      </div>
    </div>
  );
}
