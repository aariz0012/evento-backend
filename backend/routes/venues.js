const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 15 // Max 15 files
  }
});

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

router.put(
  '/:id/images',
  protect,
  authorize('host'),
  upload.array('images', 15), // Max 15 images
  uploadVenueImages
);

router.put(
  '/:id/videos',
  protect,
  authorize('host'),
  upload.array('videos', 5), // Max 5 videos
  uploadVenueVideos
);

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
