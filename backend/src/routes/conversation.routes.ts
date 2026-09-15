import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getMyConversations, getOrCreateConversation, getMessages, sendMessage } from '../controllers/conversation.controller';

const router = Router({ mergeParams: true });

router.get('/',                          requireAuth, getMyConversations);
router.post('/',                         requireAuth, getOrCreateConversation);
router.get('/:conversationId/messages',  requireAuth, getMessages);
router.post('/:conversationId/messages', requireAuth, sendMessage);

export default router;