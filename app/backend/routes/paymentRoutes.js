import express from 'express';

import { protect } from '../middleware/authMiddleware.js';
import { config, createPaymentIntent } from '../controllers/paymentController.js';

const router = express.Router();

router.get('/stripe/config', config);

router.post('/stripe/create-payment-intent', protect, createPaymentIntent);

export default router;
