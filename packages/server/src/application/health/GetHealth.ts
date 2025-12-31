import type { HealthStatus } from "../../domain/health/HealthStatus.js";

export const getHealth = (): HealthStatus => ({
  status: "ok",
  timestamp: new Date().toISOString(),
});
