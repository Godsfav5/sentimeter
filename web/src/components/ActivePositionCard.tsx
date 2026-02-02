/**
 * Active Position Card Component
 */

import type { ActivePositionItem } from "@/lib/types";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { formatCurrency, formatPercent, formatDate, getStatusColor, getStatusLabel } from "@/lib/format";

interface ActivePositionCardProps {
  position: ActivePositionItem;
}

export function ActivePositionCard({ position }: ActivePositionCardProps) {
  const pnlColor =
    position.unrealizedPnlPct === null
      ? "text-gray-500"
      : position.unrealizedPnlPct >= 0
        ? "text-success-600"
        : "text-danger-600";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">{position.ticker}</h3>
            <Badge className={getStatusColor(position.status)}>
              {getStatusLabel(position.status)}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">{position.companyName}</p>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold ${pnlColor}`}>
            {formatPercent(position.unrealizedPnlPct)}
          </p>
          <p className="text-xs text-gray-400">P&L</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <p className="text-gray-500">Entry</p>
          <p className="font-medium">{formatCurrency(position.entryPrice)}</p>
        </div>
        <div>
          <p className="text-gray-500">Current</p>
          <p className="font-medium">
            {position.currentPrice ? formatCurrency(position.currentPrice) : "-"}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Stop Loss</p>
          <p className="font-medium text-danger-600">{formatCurrency(position.stopLoss)}</p>
        </div>
        <div>
          <p className="text-gray-500">Target</p>
          <p className="font-medium text-success-600">{formatCurrency(position.targetPrice)}</p>
        </div>
      </div>

      <div className="flex justify-between text-sm text-gray-500 mb-3">
        <span>Since {formatDate(position.recommendationDate)}</span>
        <span>{position.daysHeld} days held</span>
      </div>

      <div className="p-2 bg-primary-50 rounded text-sm text-primary-700 font-medium">
        {position.suggestedAction}
      </div>
    </Card>
  );
}
