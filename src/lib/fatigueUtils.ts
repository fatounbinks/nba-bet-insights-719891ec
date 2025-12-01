export interface FatigueFactor {
  name: string;
  color: string;
  bgColor: string;
  icon?: string;
}

const FATIGUE_FACTORS: Record<string, FatigueFactor> = {
  "back-to-back": {
    name: "Back-to-Back",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-500/20 border-red-500/30",
    icon: "🔴",
  },
  "3 matchs en 4 soirs": {
    name: "3 matchs en 4 soirs",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-500/20 border-orange-500/30",
    icon: "🟠",
  },
  "3 games in 4 nights": {
    name: "3 Games in 4 Nights",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-500/20 border-orange-500/30",
    icon: "🟠",
  },
  "altitude": {
    name: "Altitude",
    color: "text-violet-700 dark:text-violet-400",
    bgColor: "bg-violet-500/20 border-violet-500/30",
    icon: "🟣",
  },
  "long road trip": {
    name: "Long Road Trip",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-500/20 border-blue-500/30",
    icon: "🔵",
  },
};

export function getFatigueFactor(factor: string): FatigueFactor {
  const normalized = factor.toLowerCase().trim();
  return (
    FATIGUE_FACTORS[normalized] || {
      name: factor,
      color: "text-slate-700 dark:text-slate-400",
      bgColor: "bg-slate-500/20 border-slate-500/30",
      icon: "⚪",
    }
  );
}

export function getRestBadge(): FatigueFactor {
  return {
    name: "Reposé",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-500/20 border-green-500/30",
    icon: "🟢",
  };
}
