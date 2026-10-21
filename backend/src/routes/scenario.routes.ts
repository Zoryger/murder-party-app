import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  getScenarios,
  getScenarioBySlug,
  getQrClue,
} from "../controllers/scenario.controller";

const router = Router();

router.get("/", getScenarios); // public : liste sans secret
router.get("/qr/:slug", requireAuth, getQrClue);
router.get("/:slug", requireAuth, getScenarioBySlug); // MJ uniquement (vérifié dans le contrôleur)

export default router;
