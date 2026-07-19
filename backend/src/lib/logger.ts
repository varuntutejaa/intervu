import pino from "pino";

// Structured JSON logs in production (what a log aggregator wants); a
// human-readable single-line format in dev so a terminal stays scannable.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" } },
});
