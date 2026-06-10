import { Router } from 'express';
import {
  aiChat, demandPrediction, restockSuggestions,
  salesForecast, naturalLanguageQuery, inventoryOptimization
} from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/chat', aiChat);
router.post('/demand-prediction', demandPrediction);
router.get('/restock-suggestions', restockSuggestions);
router.get('/sales-forecast', salesForecast);
router.post('/query', naturalLanguageQuery);
router.get('/inventory-optimization', inventoryOptimization);

export default router;
