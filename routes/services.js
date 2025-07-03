const express = require('express');
const {
  getServiceProviders,
  getServiceProvider,
  updateServiceProvider,
  uploadServiceImages,
  addMenuItem,
  addDecorationCategory,
  addOrganizerService,
  updateAvailability
} = require('../controllers/services');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getServiceProviders);
router.get('/:id', getServiceProvider);

// Protected routes
router.put('/:id', protect, authorize('host'), updateServiceProvider);
router.put('/:id/images', protect, authorize('host'), uploadServiceImages);
router.post('/:id/menu', protect, authorize('host'), addMenuItem);
router.post('/:id/decoration-category', protect, authorize('host'), addDecorationCategory);
router.post('/:id/organizer-service', protect, authorize('host'), addOrganizerService);
router.put('/:id/availability', protect, authorize('host'), updateAvailability);

module.exports = router;
