/**
 * Log Emitter
 *
 * Event-based log system for streaming analysis progress to clients.
 */

type LogLevel = "info" | "success" | "warning" | "error" | "step";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  step?: number;
  totalSteps?: number;
}

type LogListener = (entry: LogEntry) => void;

class LogEmitter {
  private listeners: Set<LogListener> = new Set();
  private currentJobId: number | null = null;
  private logs: LogEntry[] = [];

  /**
   * Subscribe to log events
   */
  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    // Send existing logs to new subscriber
    for (const log of this.logs) {
      listener(log);
    }
    return () => this.listeners.delete(listener);
  }

  /**
   * Start a new job
   */
  startJob(jobId: number): void {
    this.currentJobId = jobId;
    this.logs = [];
    this.emit("info", `Starting job ${jobId}...`);
  }

  /**
   * End current job
   */
  endJob(success: boolean): void {
    if (success) {
      this.emit("success", "Job completed successfully!");
    } else {
      this.emit("error", "Job failed.");
    }
    this.currentJobId = null;
  }

  /**
   * Log a step
   */
  step(stepNumber: number, totalSteps: number, message: string): void {
    this.emit("step", message, stepNumber, totalSteps);
  }

  /**
   * Log info message
   */
  info(message: string): void {
    this.emit("info", message);
  }

  /**
   * Log success message
   */
  success(message: string): void {
    this.emit("success", message);
  }

  /**
   * Log warning message
   */
  warn(message: string): void {
    this.emit("warning", message);
  }

  /**
   * Log error message
   */
  error(message: string): void {
    this.emit("error", message);
  }

  /**
   * Check if a job is running
   */
  isRunning(): boolean {
    return this.currentJobId !== null;
  }

  /**
   * Get current job ID
   */
  getJobId(): number | null {
    return this.currentJobId;
  }

  private emit(level: LogLevel, message: string, step?: number, totalSteps?: number): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      step,
      totalSteps,
    };

    this.logs.push(entry);

    // Also log to console
    const prefix = level === "step" ? `[${step}/${totalSteps}]` : `[${level.toUpperCase()}]`;
    console.log(`${prefix} ${message}`);

    // Notify all listeners
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch {
        // Ignore listener errors
      }
    }
  }
}

// Global singleton
export const logEmitter = new LogEmitter();
export type { LogEntry, LogLevel };
