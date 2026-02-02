/**
 * Stats Card Component
 */

import { Card } from "./Card";

interface StatItem {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
}

interface StatsCardProps {
  stats: StatItem[];
}

export function StatsCard({ stats }: StatsCardProps) {
  return (
    <Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            {stat.change !== undefined && (
              <p
                className={`text-sm mt-1 ${
                  stat.change >= 0 ? "text-success-600" : "text-danger-600"
                }`}
              >
                {stat.change >= 0 ? "+" : ""}
                {stat.change.toFixed(2)}% {stat.changeLabel ?? ""}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
