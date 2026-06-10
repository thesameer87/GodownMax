import { Router } from 'express';
import multer from 'multer';
import {
  getProducts, getProduct, createProduct, updateProduct,
  deleteProduct, bulkImport, exportProducts, generateQR
} from '../controllers/productController';
import { authenticate, isAdminOrManager } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);
router.get('/', getProducts);
router.get('/export', exportProducts);
router.get('/:id', getProduct);
router.get('/:id/qr', generateQR);
router.post('/', isAdminOrManager, createProduct);
router.post('/bulk-import', isAdminOrManager, upload.single('file'), bulkImport);
router.put('/:id', isAdminOrManager, updateProduct);
router.delete('/:id', isAdminOrManager, deleteProduct);

export default router;
