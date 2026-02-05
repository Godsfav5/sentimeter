/**
 * Summary Table
 *
 * Compact table combining new recommendations and active positions
 * for easy screenshotting and sharing.
 */

import type { RecommendationItem, ActivePositionItem } from "@/lib/types";

interface SummaryTableProps {
  recommendations: RecommendationItem[];
  activePositions: ActivePositionItem[];
  date: string;
}

type TableRow = {
  ticker: string;
  type: "NEW" | "HOLD";
  entry: number;
  current: number;
  target: number;
  stopLoss: number;
  pnl: number | null;
  score: number | null;
  days: number;
  status: string;
};

function formatPrice(price: number): string {
  return price.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatPnl(pnl: number | null): string {
  if (pnl === null) return "-";
  const sign = pnl >= 0 ? "+" : "";
  return `${sign}${pnl.toFixed(1)}%`;
}

function getPnlColor(pnl: number | null): string {
  if (pnl === null) return "text-gray-500";
  if (pnl > 0) return "text-green-600 font-semibold";
  if (pnl < 0) return "text-red-600 font-semibold";
  return "text-gray-600";
}

function getTypeColor(type: "NEW" | "HOLD"): string {
  return type === "NEW"
    ? "bg-blue-100 text-blue-800"
    : "bg-amber-100 text-amber-800";
}

export function SummaryTable({ recommendations, activePositions, date }: SummaryTableProps) {
  // Transform data into unified rows
  const rows: TableRow[] = [
    // New recommendations first
    ...recommendations.map((rec): TableRow => ({
      ticker: rec.ticker,
      type: "NEW",
      entry: rec.entryPrice,
      current: rec.currentPrice,
      target: rec.targetPrice,
      stopLoss: rec.stopLoss,
      pnl: null,
      score: rec.overallScore,
      days: 0,
      status: "Pending Entry",
    })),
    // Then active positions
    ...activePositions.map((pos): TableRow => ({
      ticker: pos.ticker,
      type: "HOLD",
      entry: pos.entryPrice,
      current: pos.currentPrice ?? pos.entryPrice,
      target: pos.targetPrice,
      stopLoss: pos.stopLoss,
      pnl: pos.unrealizedPnlPct,
      score: null,
      days: pos.daysHeld,
      status: pos.status === "entry_hit" ? "In Position" : "Waiting",
    })),
  ];

  if (rows.length === 0) {
    return null;
  }

  const formattedDate = new Date(date).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Sentimeter Summary</h3>
          <span className="text-indigo-200 text-sm">{formattedDate}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Ticker</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-700">Type</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">Entry</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">Current</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">Target</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">SL</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">P&L</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-700">Days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, idx) => (
              <tr key={`${row.ticker}-${idx}`} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-bold text-gray-900">{row.ticker}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(row.type)}`}>
                    {row.type}
                  </span>
                </td>
                <td className="px-3 py-2 text-right text-gray-700">{formatPrice(row.entry)}</td>
                <td className="px-3 py-2 text-right text-gray-900 font-medium">{formatPrice(row.current)}</td>
                <td className="px-3 py-2 text-right text-green-700">{formatPrice(row.target)}</td>
                <td className="px-3 py-2 text-right text-red-700">{formatPrice(row.stopLoss)}</td>
                <td className={`px-3 py-2 text-right ${getPnlColor(row.pnl)}`}>{formatPnl(row.pnl)}</td>
                <td className="px-3 py-2 text-center text-gray-600">{row.days}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{recommendations.length} new + {activePositions.length} active = {rows.length} total</span>
          <span>sentimeter.app</span>
        </div>
      </div>
    </div>
  );
}
