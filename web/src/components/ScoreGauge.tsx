/**
 * Score Gauge Component
 */

import { formatScore, getScoreColor } from "@/lib/format";

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: { container: "w-16 h-16", text: "text-sm", label: "text-xs" },
  md: { container: "w-20 h-20", text: "text-lg", label: "text-xs" },
  lg: { container: "w-24 h-24", text: "text-xl", label: "text-sm" },
};

export function ScoreGauge({ score, label, size = "md" }: ScoreGaugeProps) {
  const styles = sizeStyles[size];
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${styles.container}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={getScoreColor(score)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${styles.text} ${getScoreColor(score)}`}>
            {formatScore(score)}
          </span>
        </div>
      </div>
      <span className={`mt-1 text-gray-500 ${styles.label}`}>{label}</span>
    </div>
  );
}
