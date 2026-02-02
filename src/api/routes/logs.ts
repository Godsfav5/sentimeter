/**
 * SSE Logs Route
 *
 * GET /api/logs - Server-Sent Events endpoint for live log streaming
 */

import { logEmitter, type LogEntry } from "../log-emitter.ts";

export function handleLogs(request: Request): Response {
  const origin = request.headers.get("Origin");

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      const connectMsg = `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(encoder.encode(connectMsg));

      // Subscribe to log events
      const unsubscribe = logEmitter.subscribe((entry: LogEntry) => {
        const data = `data: ${JSON.stringify({ type: "log", ...entry })}\n\n`;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          // Stream closed
          unsubscribe();
        }
      });

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const ping = `data: ${JSON.stringify({ type: "ping", timestamp: new Date().toISOString() })}\n\n`;
          controller.enqueue(encoder.encode(ping));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    },
  });

  const headers: Record<string, string> = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return new Response(stream, { headers });
}
