import { Router } from 'express';
import { getScenarios, getScenarioBySlug } from '../controllers/scenario.controller';

const router = Router();

router.get('/', getScenarios);
router.get('/:slug', getScenarioBySlug);

export default router;