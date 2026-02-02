/**
 * Scheduler Panel Component
 *
 * Toggle button for scheduler with status display.
 */

import type { SchedulerState } from "@/lib";

interface SchedulerPanelProps {
  state: SchedulerState | null;
  loading: boolean;
  onToggle: () => void;
}

export function SchedulerPanel({ state, loading, onToggle }: SchedulerPanelProps) {
  if (!state) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">Auto Scheduler</h3>
          <p className="text-sm text-gray-500">
            {state.morningTime} &amp; {state.eveningTime}
          </p>
          {state.enabled && state.nextRun && (
            <p className="text-xs text-gray-400 mt-1">
              Next: {new Date(state.nextRun).toLocaleString("id-ID")}
            </p>
          )}
        </div>
        <button
          onClick={onToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            state.enabled ? "bg-green-500" : "bg-gray-300"
          } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              state.enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
