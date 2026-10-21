import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { blackoutGuard } from "../middleware/blackout.middleware";
import {
  getMyConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
} from "../controllers/conversation.controller";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, blackoutGuard, getMyConversations);
router.post("/", requireAuth, blackoutGuard, getOrCreateConversation);
router.get(
  "/:conversationId/messages",
  requireAuth,
  blackoutGuard,
  getMessages,
);
router.post(
  "/:conversationId/messages",
  requireAuth,
  blackoutGuard,
  sendMessage,
);

export default router;
