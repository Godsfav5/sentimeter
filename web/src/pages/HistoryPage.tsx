/**
 * History Page
 */

import { useState } from "react";
import { Card, LoadingState, ErrorState, EmptyState, Badge, StatsCard } from "@/components";
import {
  useHistory,
  formatCurrency,
  formatPercent,
  formatDate,
  getStatusColor,
  getStatusLabel,
  type HistoryParams,
} from "@/lib";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "entry_hit", label: "In Position" },
  { value: "target_hit", label: "Target Hit" },
  { value: "sl_hit", label: "Stop Loss" },
  { value: "expired", label: "Expired" },
];

export function HistoryPage() {
  const [params, setParams] = useState<HistoryParams>({
    page: 1,
    pageSize: 20,
  });

  const { data, loading, error, refetch } = useHistory(params);

  const handleFilterChange = (key: keyof HistoryParams, value: string) => {
    setParams((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage }));
  };

  if (loading) return <LoadingState message="Loading history..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return <EmptyState message="No data available" />;

  const stats = [
    { label: "Total Recommendations", value: data.stats.totalRecommendations },
    { label: "Win Rate", value: data.stats.winRate ? `${data.stats.winRate.toFixed(1)}%` : "-" },
    { label: "Avg Return", value: data.stats.avgReturn ? formatPercent(data.stats.avgReturn) : "-" },
    {
      label: "Best Pick",
      value: data.stats.bestPick ? `${data.stats.bestPick.ticker} (${formatPercent(data.stats.bestPick.returnPct)})` : "-",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recommendation History</h1>
        <p className="text-gray-500">Track past recommendations and performance</p>
      </div>

      <StatsCard stats={stats} />

      <Card>
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Filter by ticker..."
            className="input w-40"
            value={params.ticker ?? ""}
            onChange={(e) => handleFilterChange("ticker", e.target.value)}
          />
          <select
            className="input w-40"
            value={params.status ?? ""}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="input w-40"
            value={params.startDate ?? ""}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
          />
          <input
            type="date"
            className="input w-40"
            value={params.endDate ?? ""}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
          />
        </div>

        {data.items.length === 0 ? (
          <EmptyState message="No recommendations match your filters" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-500">
                    <th className="pb-3 font-medium">Ticker</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Action</th>
                    <th className="pb-3 font-medium text-right">Entry</th>
                    <th className="pb-3 font-medium text-right">Target</th>
                    <th className="pb-3 font-medium text-right">Stop Loss</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">P&L</th>
                    <th className="pb-3 font-medium text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, index) => (
                    <tr key={`${item.ticker}-${item.recommendationDate}-${index}`} className="border-b last:border-0">
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.ticker}</p>
                          <p className="text-xs text-gray-500">{item.companyName}</p>
                        </div>
                      </td>
                      <td className="py-3 text-sm">{formatDate(item.recommendationDate)}</td>
                      <td className="py-3">
                        <Badge variant={item.action === "buy" ? "success" : "danger"}>
                          {item.action.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 text-right text-sm">{formatCurrency(item.entryPrice)}</td>
                      <td className="py-3 text-right text-sm text-success-600">
                        {formatCurrency(item.targetPrice)}
                      </td>
                      <td className="py-3 text-right text-sm text-danger-600">
                        {formatCurrency(item.stopLoss)}
                      </td>
                      <td className="py-3">
                        <Badge className={getStatusColor(item.status)}>{getStatusLabel(item.status)}</Badge>
                      </td>
                      <td
                        className={`py-3 text-right text-sm font-medium ${
                          item.profitLossPct === null
                            ? "text-gray-400"
                            : item.profitLossPct >= 0
                              ? "text-success-600"
                              : "text-danger-600"
                        }`}
                      >
                        {formatPercent(item.profitLossPct)}
                      </td>
                      <td className="py-3 text-right text-sm">{item.overallScore.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                Showing {(data.pagination.page - 1) * data.pagination.pageSize + 1} to{" "}
                {Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total)} of{" "}
                {data.pagination.total} results
              </p>
              <div className="flex gap-2">
                <button
                  className="btn-secondary"
                  disabled={data.pagination.page <= 1}
                  onClick={() => handlePageChange(data.pagination.page - 1)}
                >
                  Previous
                </button>
                <button
                  className="btn-secondary"
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  onClick={() => handlePageChange(data.pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
