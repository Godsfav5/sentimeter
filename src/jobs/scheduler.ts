/**
 * Job Scheduler
 *
 * Schedules and runs the daily analysis jobs using cron-like timing.
 * Morning run: 7:30 WIB (00:30 UTC)
 * Evening run: 16:30 WIB (09:30 UTC)
 */

import { runDailyAnalysis } from "./daily-analysis.ts";
import type { JobSchedule } from "../lib/database/types.ts";

const MORNING_HOUR = 7;
const MORNING_MINUTE = 30;
const EVENING_HOUR = 16;
const EVENING_MINUTE = 30;

interface ScheduledJob {
  schedule: JobSchedule;
  hour: number;
  minute: number;
  timeout: ReturnType<typeof setTimeout> | null;
}

const jobs: ScheduledJob[] = [
  { schedule: "morning", hour: MORNING_HOUR, minute: MORNING_MINUTE, timeout: null },
  { schedule: "evening", hour: EVENING_HOUR, minute: EVENING_MINUTE, timeout: null },
];

function getNextRunTime(hour: number, minute: number): Date {
  const now = new Date();
  const next = new Date(now);

  next.setHours(hour, minute, 0, 0);

  // If the time has passed today, schedule for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function scheduleJob(job: ScheduledJob): void {
  const nextRun = getNextRunTime(job.hour, job.minute);
  const delay = nextRun.getTime() - Date.now();

  console.log(
    `📅 Scheduled ${job.schedule} job for ${nextRun.toLocaleString("id-ID")} (in ${formatDuration(delay)})`
  );

  job.timeout = setTimeout(async () => {
    console.log(`\n⏰ Running ${job.schedule} job...`);

    try {
      const result = await runDailyAnalysis(job.schedule);

      if (result.success) {
        console.log(`✅ ${job.schedule} job completed successfully`);
      } else {
        console.log(`⚠️ ${job.schedule} job completed with errors`);
      }
    } catch (err) {
      console.error(`❌ ${job.schedule} job failed:`, err);
    }

    // Reschedule for tomorrow
    scheduleJob(job);
  }, delay);
}

function stopAllJobs(): void {
  for (const job of jobs) {
    if (job.timeout) {
      clearTimeout(job.timeout);
      job.timeout = null;
    }
  }
}

export function startScheduler(): void {
  console.log("\n🕐 Starting Sentimeter Job Scheduler");
  console.log(`   Morning run: ${MORNING_HOUR}:${MORNING_MINUTE.toString().padStart(2, "0")} WIB`);
  console.log(`   Evening run: ${EVENING_HOUR}:${EVENING_MINUTE.toString().padStart(2, "0")} WIB\n`);

  for (const job of jobs) {
    scheduleJob(job);
  }

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down scheduler...");
    stopAllJobs();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Shutting down scheduler...");
    stopAllJobs();
    process.exit(0);
  });
}

// CLI entry point
if (import.meta.main) {
  console.log(`\n${"=".repeat(60)}`);
  console.log("  SENTIMETER JOB SCHEDULER");
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log(`${"=".repeat(60)}`);

  startScheduler();

  // Keep process alive
  console.log("\n💤 Scheduler running. Press Ctrl+C to stop.\n");
}
