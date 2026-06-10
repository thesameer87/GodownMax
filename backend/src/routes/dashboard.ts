import { Router } from 'express';
import { getDashboardStats, getRevenueAnalytics } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/revenue', getRevenueAnalytics);

export default router;
