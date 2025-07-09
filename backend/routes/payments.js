const express = require('express');
const {
  createPaymentIntent,
  confirmPayment,
  stripeWebhook,
  getPaymentDetails
} = require('../controllers/payments');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Webhook route (public)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Protected routes
router.post('/create-payment-intent', protect, authorize('user'), createPaymentIntent);
router.post('/confirm', protect, authorize('user'), confirmPayment);
router.get('/:bookingId', protect, getPaymentDetails);

module.exports = router;
