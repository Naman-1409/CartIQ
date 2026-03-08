export default function SearchSkeleton({ scraping }: { scraping: boolean }) {
  return (
    <div className="max-w-6xl mx-auto">
      {scraping && (
        <div className="flex justify-center gap-6 mb-6">
          {["Blinkit", "Zepto", "Bigbasket"].map((name) => (
            <div key={name} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-gray-500 text-sm">Searching {name}...</span>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-gray-900/60 border border-gray-700/50 overflow-hidden">
            {/* Header skeleton */}
            <div className="px-5 py-4 border-b border-gray-700/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full skeleton" />
                <div className="w-20 h-5 rounded skeleton" />
              </div>
              <div className="w-12 h-4 rounded skeleton" />
            </div>
            {/* Item skeletons */}
            <div className="px-5 py-3 space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex justify-between items-center">
                  <div className="w-36 h-4 rounded skeleton" />
                  <div className="w-12 h-4 rounded skeleton" />
                </div>
              ))}
            </div>
            {/* Fee area skeleton */}
            <div className="px-5 py-3 bg-gray-950/50 space-y-2">
              {[1, 2, 3].map((k) => (
                <div key={k} className="flex justify-between">
                  <div className="w-24 h-3 rounded skeleton" />
                  <div className="w-10 h-3 rounded skeleton" />
                </div>
              ))}
              <div className="border-t border-gray-700/30 pt-2 flex justify-between">
                <div className="w-20 h-5 rounded skeleton" />
                <div className="w-16 h-6 rounded skeleton" />
              </div>
            </div>
            {/* Button skeleton */}
            <div className="px-5 py-4">
              <div className="w-full h-10 rounded-xl skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
