import winston from "winston";
import { inspect } from "util";

// Extra arguments, as in logger.info("Error approving melody:", error), are
// printed after the message. An error shows its stack, so the log says why.
const formatExtra = (value: unknown) => {
  if (value instanceof Error) return value.stack || value.message;
  if (typeof value === "string") return value;
  return inspect(value, { depth: 4, breakLength: Infinity });
};

// Set up logging
export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf((info) => {
      const extra = (info[Symbol.for("splat") as any] as unknown[] | undefined) || [];
      return [`${info.timestamp} ${info.level}: ${info.message}`, ...extra.map(formatExtra)].join(" ");
    })
  ),

  transports: [
    new winston.transports.Console(),
  ],
});
