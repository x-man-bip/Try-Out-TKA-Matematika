import { Clock } from "lucide-react";
import { formatTime } from "@/utils/formatTime";

interface TimerProps {
  secondsLeft: number;
  totalSeconds: number;
}

export function Timer({ secondsLeft, totalSeconds }: TimerProps) {
  const isLow = secondsLeft <= 300;
  const isCritical = secondsLeft <= 60;
  const pct = Math.max(0, (secondsLeft / totalSeconds) * 100);

  return (
    <div className="flex items-center gap-2">
      <Clock
        className={`h-5 w-5 flex-shrink-0 ${
          isCritical ? "text-red-500 animate-pulse" : isLow ? "text-amber-500" : "text-white/70"
        }`}
      />
      <span
        className={`font-mono text-base font-bold tabular-nums sm:text-lg ${
          isCritical ? "text-red-400" : isLow ? "text-amber-400" : "text-white"
        }`}
      >
        {formatTime(secondsLeft)}
      </span>
      <div className="ml-1 hidden h-1.5 w-20 overflow-hidden rounded-full bg-white/20 sm:block">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            isCritical ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-emerald-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
