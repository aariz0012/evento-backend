const express = require('express');
const {
  getVenues,
  getVenue,
  createVenue,
  updateVenue,
  uploadVenueImages,
  uploadVenueVideos,
  uploadDocuments,
  deleteVenue,
  toggleVenueStatus,
  updateVenueApproval
} = require('../controllers/venues');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getVenues);
router.get('/:id', getVenue);

// Protected routes
router.post('/', protect, authorize('host'), createVenue);
router.put('/:id', protect, authorize('host'), updateVenue);
router.put('/:id/images', protect, authorize('host'), uploadVenueImages);
router.put('/:id/videos', protect, authorize('host'), uploadVenueVideos);
router.put('/:id/documents', protect, authorize('host'), uploadDocuments);
router.delete('/:id', protect, authorize('host', 'admin'), deleteVenue);

// Admin routes for venue management
router.put(
  '/:id/status', 
  protect, 
  authorize('admin'), 
  toggleVenueStatus
);

router.put(
  '/:id/approval', 
  protect, 
  authorize('admin'), 
  updateVenueApproval
);

module.exports = router;
