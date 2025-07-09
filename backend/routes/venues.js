const express = require('express');
const {
  getVenues,
  getVenue,
  createVenue,
  updateVenue,
  uploadVenueImages,
  uploadVenueVideos,
  uploadDocuments,
  deleteVenue
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

module.exports = router;
