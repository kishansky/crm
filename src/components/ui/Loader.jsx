import { Loader2 } from "lucide-react";

export default function Loader({ type = "spinner" }) {
  // 🔄 SPINNER LOADER
  if (type === "spinner") {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 🧊 SKELETON LOADER (CARDS)
  if (type === "card") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-white/95 animate-pulse" />
        ))}
      </div>
    );
  }

  // 📋 TABLE LOADER
  if (type === "table") {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-10 rounded-md bg-white/90 animate-pulse" />
        ))}
      </div>
    );
  }

  return null;
}
