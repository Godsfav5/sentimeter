/**
 * Scheduler Manager
 *
 * Manages the scheduler state within the API process.
 */

import { runDailyAnalysis } from "../jobs/daily-analysis.ts";
import type { JobSchedule } from "../lib/database/types.ts";
import { logEmitter } from "./log-emitter.ts";

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

interface SchedulerState {
  enabled: boolean;
  morningTime: string;
  eveningTime: string;
  nextRun: string | null;
}

const jobs: ScheduledJob[] = [
  { schedule: "morning", hour: MORNING_HOUR, minute: MORNING_MINUTE, timeout: null },
  { schedule: "evening", hour: EVENING_HOUR, minute: EVENING_MINUTE, timeout: null },
];

let schedulerEnabled = false;

function getNextRunTime(hour: number, minute: number): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function getNextScheduledRun(): Date | null {
  if (!schedulerEnabled) return null;

  const morningNext = getNextRunTime(MORNING_HOUR, MORNING_MINUTE);
  const eveningNext = getNextRunTime(EVENING_HOUR, EVENING_MINUTE);

  return morningNext < eveningNext ? morningNext : eveningNext;
}

function scheduleJob(job: ScheduledJob): void {
  if (!schedulerEnabled) return;

  const nextRun = getNextRunTime(job.hour, job.minute);
  const delay = nextRun.getTime() - Date.now();

  logEmitter.info(`Scheduled ${job.schedule} job for ${nextRun.toLocaleString("id-ID")}`);

  job.timeout = setTimeout(async () => {
    if (!schedulerEnabled) return;

    logEmitter.info(`Running scheduled ${job.schedule} job...`);

    try {
      await runDailyAnalysis(job.schedule);
      logEmitter.success(`${job.schedule} job completed`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEmitter.error(`${job.schedule} job failed: ${msg}`);
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
  if (schedulerEnabled) return;

  schedulerEnabled = true;
  logEmitter.info("Scheduler started");

  for (const job of jobs) {
    scheduleJob(job);
  }
}

export function stopScheduler(): void {
  if (!schedulerEnabled) return;

  schedulerEnabled = false;
  stopAllJobs();
  logEmitter.info("Scheduler stopped");
}

export function getSchedulerState(): SchedulerState {
  const nextRun = getNextScheduledRun();

  return {
    enabled: schedulerEnabled,
    morningTime: `${MORNING_HOUR}:${MORNING_MINUTE.toString().padStart(2, "0")} WIB`,
    eveningTime: `${EVENING_HOUR}:${EVENING_MINUTE.toString().padStart(2, "0")} WIB`,
    nextRun: nextRun ? nextRun.toISOString() : null,
  };
}

export function isSchedulerEnabled(): boolean {
  return schedulerEnabled;
}
