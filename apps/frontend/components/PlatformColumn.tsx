import { PlatformCart } from "@/app/results/[searchId]/page";

const PLATFORM_ICONS: Record<string, string> = {
  blinkit: "🟡",
  zepto: "🟣",
  bigbasket: "🟢",
};

// Platform checkout deep links — these open the search page on each platform
// Users can then select items manually or use the platform's cart
const PLATFORM_CHECKOUT_BASE: Record<string, string> = {
  blinkit: "https://blinkit.com/s/?q=",
  zepto: "https://www.zeptonow.com/search?q=",
  bigbasket: "https://www.bigbasket.com/custompage/sysgen/?type=pc&slug=",
};


export default function PlatformColumn({
  platform,
  isWinner,
  animationDelay,
}: {
  platform: PlatformCart;
  isWinner: boolean;
  animationDelay: number;
}) {
  // Build a search query from all item names for the platform URL
  const searchQuery = platform.items
    .filter((i) => i.available)
    .map((i) => i.item_name)
    .join(" ");
  // Use first available item's product_url for direct checkout if possible
  const firstAvailableItem = platform.items.find((i) => i.available && i.product_url);
  const checkoutUrl = firstAvailableItem?.product_url ||
    ((PLATFORM_CHECKOUT_BASE[platform.platform] || "#") + encodeURIComponent(searchQuery));

  const handleCheckout = () => {
    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={`platform-card rounded-2xl border overflow-hidden animate-slide-up transition-all duration-300 ${isWinner
        ? "border-emerald-500/60 winner-glow bg-gray-900/90 scale-[1.02] shadow-2xl shadow-emerald-500/20"
        : "border-gray-700/50 bg-gray-900/60"
        }`}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      {/* Platform Header */}
      <div
        className={`px-5 py-4 flex items-center justify-between border-b ${isWinner ? "border-emerald-500/20 bg-emerald-950/30" : "border-gray-700/30"
          }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{PLATFORM_ICONS[platform.platform] || "🛒"}</span>
          <span className="font-bold text-white text-lg" style={{ fontFamily: "var(--font-outfit)" }}>
            {platform.platform_display}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isWinner && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 rounded-full px-2 py-0.5 animate-pulse">
              ✓ BEST PRICE
            </span>
          )}
          <span className="text-xs text-gray-500">~{platform.estimated_delivery_min} min</span>
        </div>
      </div>

      {/* Item List */}
      <div className="px-5 py-3 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
        {platform.items.map((item) => (
          <div key={item.item_name} className="flex items-center justify-between gap-3 py-3 border-b border-gray-800/40 last:border-0 hover:bg-white/5 transition-colors rounded-lg px-2 -mx-2">
            {/* Image */}
            <div className="w-12 h-12 rounded-lg bg-gray-800 flex-shrink-0 overflow-hidden border border-gray-700 flex items-center justify-center">
              {item.image_url ? (
                <img src={item.image_url} alt={item.matched_product_name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-xl">📦</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <a
                href={(() => {
                  // Detect if product_url is a bare homepage (not a deep link / search result)
                  const isUsableUrl = (u?: string) => {
                    if (!u || u === "#") return false;
                    try {
                      const parsed = new URL(u);
                      // Must have a meaningful path beyond just "/" to be considered deep link
                      return parsed.pathname.length > 1 || parsed.search.length > 0;
                    } catch { return false; }
                  };

                  if (isUsableUrl(item.product_url)) return item.product_url!;

                  // Fall back to a targeted product search URL on the platform
                  const q = encodeURIComponent(item.matched_product_name);
                  if (platform.platform === "blinkit")
                    return `https://blinkit.com/s/?q=${q}`;
                  if (platform.platform === "zepto")
                    return `https://www.zeptonow.com/search?query=${q}`;
                  return `https://www.bigbasket.com/ps/?q=${q}`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-300 truncate block hover:text-white transition-colors cursor-pointer font-medium"
              >
                {item.matched_product_name}
              </a>
              <p className="text-xs text-gray-600 mt-0.5">
                {item.quantity} unit{item.quantity > 1 ? "s" : ""} · {item.available ? `₹${item.unit_price}/unit` : ""}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              {item.available ? (
                <p className="text-sm font-bold text-white">₹{item.subtotal.toFixed(0)}</p>
              ) : (
                <span className="text-xs text-red-400 bg-red-950/40 border border-red-800/30 rounded px-2 py-0.5">
                  N/A
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Fee Breakdown */}
      <div className="px-5 py-3 bg-gray-950/50 space-y-1.5 border-t border-gray-800/40">
        <FeeRow label="Items Total" value={platform.item_total} />
        <FeeRow label="Delivery" value={platform.delivery_fee} />
        {(platform.handling_fee > 0 || platform.surge_fee > 0) && (
          <FeeRow label="Other Fees" value={platform.handling_fee + platform.surge_fee} warn={platform.surge_fee > 0} />
        )}
        <div className="border-t border-gray-700/40 pt-2 mt-1 flex items-center justify-between">
          <span className="font-bold text-gray-400 text-sm">TOTAL</span>
          <span className={`font-bold text-xl ${isWinner ? "text-emerald-400" : "text-white"}`}>
            ₹{platform.total_payable.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="px-5 py-4">
        <button
          onClick={handleCheckout}
          id={`checkout-${platform.platform}`}
          disabled={!platform.all_items_available && platform.item_total === 0}
          className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 px-4 rounded-xl text-sm transition-all duration-200 active:scale-95 shadow-lg ${isWinner
            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30"
            : "bg-gray-800 hover:bg-gray-700 text-gray-200"
            } ${(!platform.all_items_available && platform.item_total === 0) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {isWinner ? "Order Now" : `Shop on ${platform.platform_display}`} →
        </button>
      </div>
    </div>
  );
}

function FeeRow({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-[11px] uppercase tracking-wider ${warn ? "text-orange-400" : "text-gray-500"}`}>{label}</span>
      <span className={`text-xs font-medium ${warn ? "text-orange-400" : "text-gray-400"}`}>
        ₹{value.toFixed(0)}
      </span>
    </div>
  );
}
