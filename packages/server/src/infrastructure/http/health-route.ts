import type { Router } from "express";
import { getHealth } from "../../application/health/GetHealth.js";

export const registerHealthRoute = (router: Router): void => {
  router.get("/health", (_req, res) => {
    res.json(getHealth());
  });
};
