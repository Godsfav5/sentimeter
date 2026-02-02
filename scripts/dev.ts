#!/usr/bin/env bun
/**
 * Development Script
 *
 * Runs both backend API and frontend dev server concurrently.
 */

import { spawn, type Subprocess } from "bun";

const processes: Subprocess[] = [];

function cleanup() {
  console.log("\n🛑 Shutting down...");
  for (const proc of processes) {
    proc.kill();
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

console.log("🚀 Starting Sentimeter development servers...\n");

// Start backend API
const backend = spawn({
  cmd: ["bun", "run", "--watch", "src/api/index.ts"],
  cwd: process.cwd(),
  stdout: "inherit",
  stderr: "inherit",
  env: { ...process.env, FORCE_COLOR: "1" },
});
processes.push(backend);
console.log("📡 Backend API starting on http://localhost:3001");

// Wait a bit for backend to start
await new Promise((r) => setTimeout(r, 1000));

// Start frontend
const frontend = spawn({
  cmd: ["bun", "run", "dev"],
  cwd: `${process.cwd()}/web`,
  stdout: "inherit",
  stderr: "inherit",
  env: { ...process.env, FORCE_COLOR: "1" },
});
processes.push(frontend);
console.log("🌐 Frontend starting on http://localhost:3000\n");

// Wait for processes
await Promise.all([backend.exited, frontend.exited]);
